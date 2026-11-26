import { Server } from "socket.io";
import Chat from "../models/chatModel.js";
import Block from "../models/blockModel.js";
import connectionModel from "../models/connectionModel.js";
import User from "../models/userModel.js";

// Safe streak update helper
const updateChatStreak = (chat) => {
  try {
    const now = new Date();
    const last = chat.lastMessageDate ? new Date(chat.lastMessageDate) : null;

    if (!last) {
      chat.streak = 1;
      chat.lastMessageDate = now;
      return;
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfLast = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const dayDiff = Math.round((startOfToday - startOfLast) / oneDayMs);

    if (dayDiff === 0) {
      chat.lastMessageDate = now;
    } else if (dayDiff === 1) {
      chat.streak = (chat.streak || 0) + 1;
      chat.lastMessageDate = now;
    } else {
      chat.streak = 1;
      chat.lastMessageDate = now;
    }
  } catch (err) {
    console.error("Streak calculation error (safe fallback):", err);
  }
};

const initializeSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
  ];

  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  const io = new Server(server, {
    maxHttpBufferSize: 1e7, // 10MB buffer to safely accommodate voice notes and photos without dropping socket connection
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Fallback to allow connection
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Real-time online users presence map: socketId -> userId
  const onlineUsers = new Map();

  const broadcastOnlineUsers = () => {
    const uniqueUserIds = Array.from(new Set(onlineUsers.values()));
    io.emit("onlineUsersList", uniqueUserIds);
  };

  io.on("connection", (socket) => {
    // 1. Register user's personal channel for instant unread alerts & presence
    socket.on("registerUser", (userId) => {
      if (!userId) return;
      socket.join(userId.toString());
      onlineUsers.set(socket.id, userId.toString());
      broadcastOnlineUsers();
    });

    // Request active list of online users
    socket.on("getOnlineUsers", () => {
      socket.emit("onlineUsersList", Array.from(new Set(onlineUsers.values())));
    });

    // 2. Join private Chat Room between two matched students
    socket.on("joinChat", async ({ userId, targetUserId }) => {
      try {
        if (!userId || !targetUserId) return;

        // Verify mutual match exists
        const isConnected = await connectionModel.findOne({
          status: "accepted",
          $or: [
            { fromuserid: userId, touserid: targetUserId },
            { fromuserid: targetUserId, touserid: userId },
          ],
        });

        if (!isConnected) {
          socket.emit("userUnmatched", { targetUserId: targetUserId.toString() });
          return;
        }

        const roomId = [userId.toString(), targetUserId.toString()].sort().join("_");
        socket.join(roomId);
        socket.userId = userId.toString();
        onlineUsers.set(socket.id, userId.toString());
        broadcastOnlineUsers();

        // Mark any unread messages from targetUser as read when joining chat
        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (chat && chat.messages && chat.messages.length > 0) {
          let hasUpdates = false;
          chat.messages.forEach((msg) => {
            const senderStr = (typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId)?.toString();
            if (senderStr === targetUserId.toString() && !msg.isRead) {
              msg.isRead = true;
              hasUpdates = true;
            }
          });

          if (hasUpdates) {
            await chat.save();
            io.to(roomId).emit("messagesMarkedRead", { readerId: userId.toString() });
          }
        }
      } catch (err) {
        console.error("Socket error on joinChat:", err);
      }
    });

    socket.on("leaveChat", ({ userId, targetUserId }) => {
      if (!userId || !targetUserId) return;
      const roomId = [userId.toString(), targetUserId.toString()].sort().join("_");
      socket.leave(roomId);
    });

    // 3. Typing Indicators (Real-time)
    socket.on("typing", ({ roomId, userId, senderName }) => {
      if (!roomId) return;
      socket.to(roomId).emit("userTyping", { userId, senderName });
    });

    socket.on("stopTyping", ({ roomId, userId }) => {
      if (!roomId) return;
      socket.to(roomId).emit("userStoppedTyping", { userId });
    });

    // 4. Read Receipts (Mark messages as read/seen)
    socket.on("markMessagesRead", async ({ userId, targetUserId }) => {
      try {
        if (!userId || !targetUserId) return;
        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat || !chat.messages) return;

        let hasUpdates = false;
        chat.messages.forEach((msg) => {
          const senderStr = (typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId)?.toString();
          if (
            senderStr === targetUserId.toString() &&
            msg.isRead !== true
          ) {
            msg.isRead = true;
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          await chat.save();
          const roomId = [userId.toString(), targetUserId.toString()].sort().join("_");
          io.to(roomId).emit("messagesMarkedRead", { readerId: userId.toString() });
        }
      } catch (err) {
        console.error("Socket error on markMessagesRead:", err);
      }
    });

    // 5. Real-time message exchange, moderation check & database persistence
    socket.on("sendMessage", async ({ userId, targetUserId, text, senderName, senderPhoto, replyTo, messageType, audioUrl, audioDuration, imageUrl }) => {
      try {
        const hasText = Boolean(text && text.trim());
        const hasAudio = Boolean(audioUrl);
        const hasImage = Boolean(imageUrl);
        if (!userId || !targetUserId || (!hasText && !hasAudio && !hasImage)) return;

        // Check if either user has blocked the other
        const isBlocked = await Block.findOne({
          $or: [
            { userId, blockedUserId: targetUserId },
            { userId: targetUserId, blockedUserId: userId },
          ],
        });

        if (isBlocked) {
          socket.emit("errorMessage", "Cannot send message to this user.");
          return;
        }

        // Verify mutual match exists between these two users (prevent unmatch leak)
        const isConnected = await connectionModel.findOne({
          status: "accepted",
          $or: [
            { fromuserid: userId, touserid: targetUserId },
            { fromuserid: targetUserId, touserid: userId },
          ],
        });

        if (!isConnected) {
          socket.emit("errorMessage", "Cannot send message. You are no longer connected with this user.");
          socket.emit("userUnmatched", { targetUserId: targetUserId.toString() });
          return;
        }

        const roomId = [userId.toString(), targetUserId.toString()].sort().join("_");

        // Find existing chat or create a new one
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: [],
          });
        }

        // Update chat streak safely
        updateChatStreak(chat);

        // Check if recipient (targetUserId) has an active socket currently inside this chat room
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        let isRecipientInRoom = false;
        if (roomSockets && targetUserId) {
          for (const sId of roomSockets) {
            const clientSocket = io.sockets.sockets.get(sId);
            const sockUserId = clientSocket?.userId || onlineUsers.get(sId);
            if (sockUserId && sockUserId.toString() === targetUserId.toString()) {
              isRecipientInRoom = true;
              break;
            }
          }
        }

        const isAudio = messageType === "audio" || hasAudio;
        const isImage = messageType === "image" || hasImage;

        let finalMessageType = "text";
        if (isImage) {
          finalMessageType = "image";
        } else if (isAudio) {
          finalMessageType = "audio";
        }

        const finalMessageText = hasText
          ? text.trim()
          : (isImage ? "📷 Photo" : (isAudio ? "🎤 Voice note" : ""));

        const newMessage = {
          senderId: userId,
          text: finalMessageText,
          messageType: finalMessageType,
          imageUrl: imageUrl || null,
          audioUrl: audioUrl || null,
          audioDuration: typeof audioDuration === "number" ? audioDuration : 0,
          isRead: isRecipientInRoom,
          replyTo: replyTo || null,
          reactions: [],
        };

        chat.messages.push(newMessage);
        await chat.save();

        const savedMsg = chat.messages[chat.messages.length - 1];

        let finalPhoto = senderPhoto || null;
        if (!finalPhoto && userId) {
          try {
            const u = await User.findById(userId).select("photoUrl").lean();
            if (u && u.photoUrl) finalPhoto = u.photoUrl;
          } catch (e) {}
        }

        const payload = {
          _id: savedMsg._id,
          senderId: userId.toString(),
          targetUserId: targetUserId.toString(),
          senderName: senderName || "Student",
          senderPhoto: finalPhoto,
          text: savedMsg.text,
          messageType: savedMsg.messageType || finalMessageType,
          imageUrl: savedMsg.imageUrl || null,
          audioUrl: savedMsg.audioUrl || null,
          audioDuration: savedMsg.audioDuration || 0,
          replyTo: savedMsg.replyTo || null,
          reactions: savedMsg.reactions || [],
          isRead: isRecipientInRoom,
          createdAt: savedMsg.createdAt,
          streak: chat.streak,
        };

        // Broadcast to the chat room
        io.to(roomId).emit("messageReceived", payload);
        io.to(roomId).emit("streakUpdated", { streak: chat.streak });

        // Also push live alert to recipient's personal channel (for toast notification & red badge)
        io.to(targetUserId.toString()).emit("newNotification", payload);
      } catch (err) {
        console.error("Socket error on sendMessage:", err);
      }
    });

    // 6. Real-time Emoji Reactions
    socket.on("reactMessage", async ({ roomId, messageId, userId, emoji }) => {
      try {
        if (!messageId || !userId || !emoji) return;

        const chat = await Chat.findOne({ "messages._id": messageId });
        if (!chat) return;

        const msg = chat.messages.id(messageId);
        if (!msg) return;

        if (!msg.reactions) msg.reactions = [];

        const existingIndex = msg.reactions.findIndex(
          (r) => r.userId.toString() === userId.toString()
        );

        if (existingIndex > -1) {
          if (msg.reactions[existingIndex].emoji === emoji) {
            msg.reactions.splice(existingIndex, 1);
          } else {
            msg.reactions[existingIndex].emoji = emoji;
          }
        } else {
          msg.reactions.push({ userId, emoji });
        }

        await chat.save();

        io.to(roomId).emit("messageReacted", {
          messageId,
          reactions: msg.reactions,
        });
      } catch (err) {
        console.error("Socket error on reactMessage:", err);
      }
    });

    // 7. Unsend / Delete Message
    socket.on("unsendMessage", async ({ roomId, messageId, userId }) => {
      try {
        if (!messageId || !userId) return;

        const chat = await Chat.findOne({ "messages._id": messageId });
        if (!chat) return;

        const msg = chat.messages.id(messageId);
        if (!msg) return;

        // Verify sender
        if (msg.senderId.toString() !== userId.toString()) return;

        chat.messages.pull(messageId);
        await chat.save();

        io.to(roomId).emit("messageUnsent", { messageId });
      } catch (err) {
        console.error("Socket error on unsendMessage:", err);
      }
    });

    // 8. Clear entire chat conversation
    socket.on("clearChat", async ({ roomId, userId, targetUserId }) => {
      try {
        if (!userId || !targetUserId) return;

        const chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (chat) {
          chat.messages = [];
          await chat.save();
        }

        io.to(roomId).emit("chatCleared", { clearedBy: userId });
      } catch (err) {
        console.error("Socket error on clearChat:", err);
      }
    });

    // 9. Real-time Chat Theme Change
    socket.on("changeTheme", async ({ roomId, userId, targetUserId, theme, userName }) => {
      try {
        if (!userId || !targetUserId || !theme) return;

        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (chat) {
          chat.theme = theme;
          await chat.save();
        }

        io.to(roomId).emit("themeChanged", {
          theme,
          changedBy: userName || "Student",
        });
      } catch (err) {
        console.error("Socket error on changeTheme:", err);
      }
    });

    socket.on("disconnect", () => {
      // User disconnected from socket
      if (onlineUsers.has(socket.id)) {
        onlineUsers.delete(socket.id);
        broadcastOnlineUsers();
      }
    });
  });

  return io;
};

export default initializeSocket;
