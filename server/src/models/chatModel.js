import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      text: {
        type: String,
        trim: true,
      },
      senderName: {
        type: String,
        trim: true,
      },
    },
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],
    theme: {
      type: String,
      default: "classic",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast lookup for chat between two users
chatSchema.index({ participants: 1 });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
