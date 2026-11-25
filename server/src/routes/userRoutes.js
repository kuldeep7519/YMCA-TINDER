import express from "express";
import auth from "../middleware/auth.js";
import connectionModel from "../models/connectionModel.js";
import User from "../models/userModel.js";
import Block from "../models/blockModel.js";
import Report from "../models/reportModel.js";

const userRouter = express.Router();

// 1. Pending received connection requests
userRouter.get("/user/request/recieved", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;

    // Find all blocks involving this user
    const blocks = await Block.find({
      $or: [{ userId: loggedinuser._id }, { blockedUserId: loggedinuser._id }],
    });
    const blockedIds = new Set(
      blocks.map((b) =>
        b.userId.toString() === loggedinuser._id.toString()
          ? b.blockedUserId.toString()
          : b.userId.toString()
      )
    );

    const connectionrequest = await connectionModel
      .find({
        touserid: loggedinuser._id,
        status: { $in: ["interested", "superlike"] },
      })
      .populate("fromuserid", [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "branch",
        "year",
        "bio",
        "interest",
      ]);

    // Filter out any requests from blocked users
    const filteredRequests = connectionrequest.filter(
      (r) => r.fromuserid && !blockedIds.has(r.fromuserid._id.toString())
    );

    res.status(200).json({
      data: filteredRequests,
    });
  } catch (err) {
    res.status(401).send(err.message);
  }
});

// 2. Active mutual matches (Connections)
userRouter.get("/user/connection", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;

    // Find all blocked user IDs involving logged-in user
    const blocks = await Block.find({
      $or: [{ userId: loggedinuser._id }, { blockedUserId: loggedinuser._id }],
    });
    const myBlockedIds = new Set(
      blocks
        .filter((b) => b.userId.toString() === loggedinuser._id.toString())
        .map((b) => b.blockedUserId.toString())
    );
    const theirBlockedIds = new Set(
      blocks
        .filter((b) => b.blockedUserId.toString() === loggedinuser._id.toString())
        .map((b) => b.userId.toString())
    );

    const connections = await connectionModel
      .find({
        status: "accepted",
        $or: [
          { touserid: loggedinuser._id },
          { fromuserid: loggedinuser._id },
        ],
      })
      .populate("fromuserid", [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "branch",
        "year",
        "bio",
        "interest",
      ])
      .populate("touserid", [
        "firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "branch",
        "year",
        "bio",
        "interest",
      ]);

    const data = connections
      .map((connection) => {
        if (!connection.fromuserid || !connection.touserid) return null;
        const target =
          connection.fromuserid._id.toString() === loggedinuser._id.toString()
            ? connection.touserid
            : connection.fromuserid;

        const targetObj = target.toObject ? target.toObject() : { ...target };
        targetObj.isBlockedByMe = myBlockedIds.has(target._id.toString());
        targetObj.isBlockedByThem = theirBlockedIds.has(target._id.toString());
        return targetObj;
      })
      .filter(Boolean);

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(401).send(err.message);
  }
});

// 3. The Tinder Feed with Discovery Filters & Block Exclusions
userRouter.get("/user/feed", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const { gender, branch, year } = req.query;

    // A. Find all connection requests involving logged-in user
    const connections = await connectionModel
      .find({
        $or: [{ touserid: loggedinuser._id }, { fromuserid: loggedinuser._id }],
      })
      .select("fromuserid touserid");

    const hideusersfromfeed = new Set();
    connections.forEach((req) => {
      if (req.fromuserid) hideusersfromfeed.add(req.fromuserid.toString());
      if (req.touserid) hideusersfromfeed.add(req.touserid.toString());
    });

    // B. Find all blocks involving logged-in user
    const blocks = await Block.find({
      $or: [{ userId: loggedinuser._id }, { blockedUserId: loggedinuser._id }],
    });
    blocks.forEach((b) => {
      hideusersfromfeed.add(b.userId.toString());
      hideusersfromfeed.add(b.blockedUserId.toString());
    });

    // C. Always hide yourself
    hideusersfromfeed.add(loggedinuser._id.toString());

    // D. Build query filters
    const query = {
      _id: { $nin: Array.from(hideusersfromfeed) },
      isPaused: { $ne: true },
    };

    if (gender && gender !== "all") {
      query.gender = gender.toLowerCase();
    }
    if (branch && branch !== "all") {
      const cleanBranch = branch.replace(/[()]/g, "").trim().split(" ")[0];
      query.branch = { $regex: new RegExp(cleanBranch, "i") };
    }
    if (year && year !== "all") {
      const yearMatch = year.match(/\d+(?:st|nd|rd|th)?/i);
      if (yearMatch) {
        query.year = { $regex: new RegExp(yearMatch[0], "i") };
      } else {
        query.year = year;
      }
    }

    const users = await User.find(query).select([
      "firstName",
      "lastName",
      "photoUrl",
      "age",
      "gender",
      "branch",
      "year",
      "bio",
      "interest",
    ]);

    res.json({ data: users });
  } catch (err) {
    res.status(401).send(err.message);
  }
});

// 4. Block a User (Safety Feature)
userRouter.post(["/user/block/:targetUserId", "/user/block"], auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const targetUserId = req.params.targetUserId || req.body.targetUserId;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    if (loggedinuser._id.toString() === targetUserId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    // Check target exists
    const target = await User.findById(targetUserId);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    // Save block in DB
    await Block.findOneAndUpdate(
      { userId: loggedinuser._id, blockedUserId: targetUserId },
      { userId: loggedinuser._id, blockedUserId: targetUserId },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `${target.firstName} has been blocked.`,
      targetUserId,
    });
  } catch (err) {
    res.status(500).json({ message: "Error blocking user: " + err.message });
  }
});

// 5. Unblock a User
userRouter.post(["/user/unblock/:targetUserId", "/user/unblock"], auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const targetUserId = req.params.targetUserId || req.body.targetUserId;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    await Block.findOneAndDelete({
      userId: loggedinuser._id,
      blockedUserId: targetUserId,
    });

    res.status(200).json({
      success: true,
      message: "User unblocked successfully.",
      targetUserId,
    });
  } catch (err) {
    res.status(500).json({ message: "Error unblocking user: " + err.message });
  }
});

// 5. Report a User (Moderation Feature)
userRouter.post("/user/report/:targetUserId", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const { targetUserId } = req.params;
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Please select a reason for reporting" });
    }

    if (loggedinuser._id.toString() === targetUserId) {
      return res.status(400).json({ message: "You cannot report yourself" });
    }

    const report = new Report({
      reporterId: loggedinuser._id,
      reportedUserId: targetUserId,
      reason,
      details: details || "",
    });

    await report.save();

    res.status(201).json({
      message: "Report submitted successfully. Our safety team will review it.",
    });
  } catch (err) {
    res.status(500).json({ message: "Error reporting user: " + err.message });
  }
});

export default userRouter;
