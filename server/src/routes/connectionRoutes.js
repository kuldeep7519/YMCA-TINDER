import express from "express";
import connectionModel from "../models/connectionModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import auth from "../middleware/auth.js";

const connectionRouter = express.Router();

export const DAILY_SWIPE_LIMIT = 20;

export const checkAndResetDailySwipes = (user) => {
  if (!user) return;
  const now = new Date();
  const lastDate = user.lastSwipeDate ? new Date(user.lastSwipeDate) : null;

  if (!lastDate || now.toDateString() !== lastDate.toDateString()) {
    user.dailySwipesCount = 0;
    user.lastSwipeDate = now;
  }
};

// Check current user's daily swipe quota
connectionRouter.get("/user/swipe-quota", auth, async (req, res) => {
  try {
    const user = req.user;
    checkAndResetDailySwipes(user);
    await user.save();

    const remaining = Math.max(0, DAILY_SWIPE_LIMIT - (user.dailySwipesCount || 0));
    res.status(200).json({
      success: true,
      dailyLimit: DAILY_SWIPE_LIMIT,
      swipesUsed: user.dailySwipesCount || 0,
      remainingSwipes: remaining,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send swipe request (interested / ignored / superlike)
connectionRouter.post("/request/send/:status/:to_id", auth, async (req, res) => {
  try {
    const status = req.params.status;
    const to_id = req.params.to_id;
    const loggedinuser = req.user;
    const AllowedStatus = ["interested", "ignored", "superlike"];

    if (status && !AllowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${AllowedStatus.join(", ")}`,
      });
    }

    // Daily limit check on positive swipes (interested & superlike)
    if (status === "interested" || status === "superlike") {
      checkAndResetDailySwipes(loggedinuser);
      if ((loggedinuser.dailySwipesCount || 0) >= DAILY_SWIPE_LIMIT) {
        return res.status(429).json({
          success: false,
          limitReached: true,
          dailyLimit: DAILY_SWIPE_LIMIT,
          remainingSwipes: 0,
          message: `Daily campus swipe limit reached (${DAILY_SWIPE_LIMIT}/${DAILY_SWIPE_LIMIT}). Swipes recharge at midnight! 🌙`,
        });
      }
    }

    const IsuserExist = await User.findOne({ _id: to_id });
    if (!IsuserExist) {
      return res.status(404).send("User does not exist");
    }

    const ExistingConnection = await connectionModel.findOne({
      $or: [
        { fromuserid: loggedinuser._id, touserid: to_id },
        { fromuserid: to_id, touserid: loggedinuser._id },
      ],
    });

    if (ExistingConnection) {
      return res.status(400).send("Connection request already exists");
    }

    const connection = new connectionModel({
      fromuserid: loggedinuser._id,
      touserid: to_id,
      status: status,
    });

    await connection.save();

    // Consume 1 swipe on interested / superlike and save
    if (status === "interested" || status === "superlike") {
      loggedinuser.dailySwipesCount = (loggedinuser.dailySwipesCount || 0) + 1;
      loggedinuser.lastSwipeDate = new Date();
      await loggedinuser.save();
    }

    // Push real-time notification to recipient if online
    const io = req.app.get("io");
    if (io) {
      io.to(to_id.toString()).emit("newRequestNotification", {
        from: loggedinuser.firstName,
        status: status,
      });
    }

    checkAndResetDailySwipes(loggedinuser);
    const remainingSwipes = Math.max(0, DAILY_SWIPE_LIMIT - (loggedinuser.dailySwipesCount || 0));

    res.status(200).json({
      message: "Request sent successfully",
      remainingSwipes,
      dailyLimit: DAILY_SWIPE_LIMIT,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Accept or reject incoming match request
connectionRouter.patch("/request/review/:status/:from_id", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const status = req.params.status;
    const from_id = req.params.from_id;
    const AllowedStatus = ["accepted", "rejected"];

    if (status && !AllowedStatus.includes(status)) {
      return res.status(400).send("Status is not valid");
    }

    const connection = await connectionModel.findOne({
      fromuserid: from_id,
      touserid: loggedinuser._id,
      status: { $in: ["interested", "superlike"] },
    });

    if (!connection) {
      return res.status(404).send("Connection request does not exist");
    }

    connection.status = status;
    await connection.save();

    // Push real-time notification to the sender if request was accepted
    if (status === "accepted") {
      const io = req.app.get("io");
      if (io) {
        io.to(from_id.toString()).emit("newRequestNotification", {
          from: loggedinuser.firstName,
          status: "accepted",
        });
      }
    }

    res.status(200).send(`${status} successfully`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Unmatch two connected students
connectionRouter.post(
  ["/request/unmatch/:targetUserId", "/user/unmatch/:targetUserId", "/user/unmatch"],
  auth,
  async (req, res) => {
    try {
      const loggedinuser = req.user;
      const targetUserId = req.params.targetUserId || req.body.targetUserId;

      if (!targetUserId) {
        return res.status(400).json({ success: false, message: "targetUserId is required" });
      }

      await connectionModel.deleteMany({
        $or: [
          { fromuserid: loggedinuser._id, touserid: targetUserId },
          { fromuserid: targetUserId, touserid: loggedinuser._id },
        ],
      });

      // Also clean up any active chat conversation so it cannot be queried
      await Chat.deleteMany({
        participants: { $all: [loggedinuser._id, targetUserId] },
      });

      // Real-time socket event: notify the other user to close chat & remove connection instantly
      const io = req.app.get("io");
      if (io) {
        const roomId = [loggedinuser._id.toString(), targetUserId.toString()].sort().join("_");
        io.to(roomId).emit("userUnmatched", {
          unmatcherId: loggedinuser._id.toString(),
          targetUserId: targetUserId.toString(),
        });
        io.to(targetUserId.toString()).emit("userUnmatched", {
          unmatcherId: loggedinuser._id.toString(),
          targetUserId: targetUserId.toString(),
        });
        io.in(roomId).socketsLeave(roomId);
      }

      res.status(200).json({
        success: true,
        message: "Unmatched successfully. Removed from your connections.",
        targetUserId,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Error unmatching: " + err.message });
    }
  }
);

export default connectionRouter;
