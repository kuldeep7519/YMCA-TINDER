import express from "express";
import auth from "../middleware/auth.js";
import Chat from "../models/chatModel.js";
import connectionModel from "../models/connectionModel.js";
import Block from "../models/blockModel.js";
import User from "../models/userModel.js";

const chatRouter = express.Router();

// GET /chat/:targetUserId - Fetch chat history between logged-in user and matched user
chatRouter.get("/chat/:targetUserId", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.params;

    const targetUser = await User.findById(targetUserId).select(
      "firstName lastName photoUrl age gender branch year bio interest"
    );

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

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

    // Check block status between loggedInUser and targetUser
    const myBlock = await Block.findOne({
      userId: loggedInUserId,
      blockedUserId: targetUserId,
    });

    const theirBlock = await Block.findOne({
      userId: targetUserId,
      blockedUserId: loggedInUserId,
    });

    // Find chat conversation
    let chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName photoUrl",
    });

    res.status(200).json({
      messages: chat ? chat.messages : [],
      theme: chat?.theme || "classic",
      streak: chat?.streak || 0,
      targetUser,
      isBlockedByMe: Boolean(myBlock),
      isBlockedByThem: Boolean(theirBlock),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching chat: " + err.message });
  }
});

// POST /chat/react - React to a message
chatRouter.post("/chat/react", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { messageId, emoji } = req.body;

    if (!messageId || !emoji) {
      return res.status(400).json({ message: "messageId and emoji are required" });
    }

    const chat = await Chat.findOne({ "messages._id": messageId });
    if (!chat) {
      return res.status(404).json({ message: "Chat or message not found" });
    }

    const msg = chat.messages.id(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!msg.reactions) msg.reactions = [];

    const existingIndex = msg.reactions.findIndex(
      (r) => r.userId.toString() === loggedInUserId.toString()
    );

    if (existingIndex > -1) {
      if (msg.reactions[existingIndex].emoji === emoji) {
        msg.reactions.splice(existingIndex, 1);
      } else {
        msg.reactions[existingIndex].emoji = emoji;
      }
    } else {
      msg.reactions.push({ userId: loggedInUserId, emoji });
    }

    await chat.save();

    res.status(200).json({ success: true, reactions: msg.reactions, messageId });
  } catch (err) {
    res.status(500).json({ message: "Error reacting: " + err.message });
  }
});

// DELETE /chat/message/:messageId - Unsend a message
chatRouter.delete("/chat/message/:messageId", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { messageId } = req.params;

    const chat = await Chat.findOne({ "messages._id": messageId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const msg = chat.messages.id(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (msg.senderId.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({ message: "You can only unsend your own messages" });
    }

    chat.messages.pull(messageId);
    await chat.save();

    res.status(200).json({ success: true, messageId });
  } catch (err) {
    res.status(500).json({ message: "Error deleting message: " + err.message });
  }
});

// DELETE /chat/clear/:targetUserId - Clear all messages in conversation
chatRouter.delete("/chat/clear/:targetUserId", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    const chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, targetUserId] },
    });

    if (chat) {
      chat.messages = [];
      await chat.save();
    }

    res.status(200).json({ success: true, message: "Chat cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing chat: " + err.message });
  }
});

// POST /chat/theme - Update chat theme
chatRouter.post("/chat/theme", auth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { targetUserId, theme } = req.body;

    if (!targetUserId || !theme) {
      return res.status(400).json({ message: "targetUserId and theme are required" });
    }

    let chat = await Chat.findOne({
      participants: { $all: [loggedInUserId, targetUserId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [loggedInUserId, targetUserId],
        messages: [],
        theme,
      });
    } else {
      chat.theme = theme;
    }

    await chat.save();
    res.status(200).json({ success: true, theme });
  } catch (err) {
    res.status(500).json({ message: "Error updating theme: " + err.message });
  }
});

export default chatRouter;
