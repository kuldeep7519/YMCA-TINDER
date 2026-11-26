import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 20,
    },
    lastName: {
      type: String,
      maxLength: 20,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      lowercase: true,
      maxLength: 100,
      validate(value) {
        if (value.includes("+")) {
          throw new Error("Email aliases and plus-tags (+tag) are strictly blocked on YMCA Match. Please use your standard email.");
        }
        if (!/^[a-zA-Z0-9._%-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(value)) {
          throw new Error("Only genuine @gmail.com email addresses are allowed! Disposable or temp-mails are blocked.");
        }
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    age: {
      type: Number,
      min: 18,
      max: 60,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: "{VALUE} is not a valid gender",
      },
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    photoUrl: {
      type: String,
      required: [true, "Profile photo is compulsory"],
      validate(value) {
        if (!value || value.startsWith("blob:") || !/^https?:\/\//i.test(value)) {
          throw new Error("Invalid profile photo URL. Please upload a real photo.");
        }
      },
    },
    bio: {
      type: String,
      maxLength: 250,
      default: "Hey there! I am a student at JC Bose UST (YMCA).",
    },
    interest: {
      type: [String],
      default: [],
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: "",
      trim: true,
    },
    dailySwipesCount: {
      type: Number,
      default: 0,
    },
    lastSwipeDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
