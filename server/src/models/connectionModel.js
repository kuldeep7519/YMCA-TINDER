import mongoose from "mongoose";

const ConnectionSchema = new mongoose.Schema(
  {
    fromuserid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    touserid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["interested", "accepted", "rejected", "ignored", "superlike"],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index to quickly find connections between two users
ConnectionSchema.index({ fromuserid: 1, touserid: 1 });

const connectionModel = mongoose.model("connectionModel", ConnectionSchema);
export default connectionModel;
