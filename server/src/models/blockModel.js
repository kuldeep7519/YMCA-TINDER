import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate blocks
blockSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });

const Block = mongoose.model("Block", blockSchema);
export default Block;
