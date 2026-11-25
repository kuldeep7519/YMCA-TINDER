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
        if (!/^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(value)) {
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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
