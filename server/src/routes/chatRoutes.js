import express from "express";
import auth from "../middleware/auth.js";
import Chat from "../models/chatModel.js";
import connectionModel from "../models/connectionModel.js";

const chatRouter = express.Router();

// GET /chat/:targetUserId - Fetch chat history between logged-in user and matched user
chatRouter.get("/chat/:targetUserId", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.params;

    // Verify mutual match exists between these two users
    const isMatch = await connectionModel.findOne({
      status: "accepted",
      $or: [
        { fromuserid: loggedInUserId, touserid: targetUserId },
        { fromuserid: targetUserId, touserid: loggedInUserId },
      ],
    });

    if (!isMatch) {
      return res.status(403).json({
        message: "You can only chat with matched YMCA students",
      });
    }

    // Find chat conversation
    let chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName photoUrl",
    });

    if (!chat) {
      // First time opening chat - return empty messages array
      return res.status(200).json({ messages: [] });
    }

    res.status(200).json({
      messages: chat.messages,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching chat: " + err.message });
  }
});

export default chatRouter;
