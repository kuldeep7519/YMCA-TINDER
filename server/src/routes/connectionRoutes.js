import express from "express";
import connectionModel from "../models/connectionModel.js";
import User from "../models/userModel.js";
import auth from "../middleware/auth.js";

const connectionRouter = express.Router();

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
    res.status(200).json({
      message: "Request sent successfully",
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
    res.status(200).send(`${status} successfully`);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Unmatch two connected students
connectionRouter.post("/request/unmatch/:targetUserId", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const { targetUserId } = req.params;

    await connectionModel.deleteMany({
      $or: [
        { fromuserid: loggedinuser._id, touserid: targetUserId },
        { fromuserid: targetUserId, touserid: loggedinuser._id },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Unmatched successfully. Removed from your connections.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error unmatching: " + err.message });
  }
});

export default connectionRouter;
