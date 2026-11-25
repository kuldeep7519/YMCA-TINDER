import { Server } from "socket.io";
import Chat from "../models/chatModel.js";
import Block from "../models/blockModel.js";

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
    socket.on("joinChat", ({ userId, targetUserId }) => {
      if (!userId || !targetUserId) return;
      const roomId = [userId.toString(), targetUserId.toString()].sort().join("_");
      socket.join(roomId);
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

        if (!chat) return;

        let hasUpdates = false;
        chat.messages.forEach((msg) => {
          if (
            msg.senderId.toString() === targetUserId.toString() &&
            msg.isRead !== true
          ) {
            msg.isRead = true;
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          await chat.save();
          const roomId = [userId.toString(), targetUserId.toString()].sort().join("_");
          io.to(roomId).emit("messagesMarkedRead", { readerId: userId });
        }
      } catch (err) {
        console.error("Socket error on markMessagesRead:", err);
      }
    });

    // 5. Real-time message exchange, moderation check & database persistence
    socket.on("sendMessage", async ({ userId, targetUserId, text, senderName }) => {
      try {
        if (!userId || !targetUserId || !text || !text.trim()) return;

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

        const newMessage = {
          senderId: userId,
          text: text.trim(),
          isRead: false,
        };

        chat.messages.push(newMessage);
        await chat.save();

        const savedMsg = chat.messages[chat.messages.length - 1];

        const payload = {
          _id: savedMsg._id,
          senderId: userId,
          senderName: senderName || "Student",
          text: savedMsg.text,
          isRead: false,
          createdAt: savedMsg.createdAt,
        };

        // Broadcast to the chat room
        io.to(roomId).emit("messageReceived", payload);

        // Also push live alert to recipient's personal channel (for toast notification & red badge)
        io.to(targetUserId.toString()).emit("newNotification", payload);
      } catch (err) {
        console.error("Socket error on sendMessage:", err);
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
