import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/mailer.js";

const authRouter = express.Router();

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

// Canonical Email Normalization:
// 1. Blocks email aliases & plus-tags (e.g. user+tag@gmail.com)
// 2. Normalizes Gmail usernames by removing all dots (e.g. john.doe -> johndoe)
// Ensures 1 Gmail address = strictly 1 user account across YMCA Match
export const normalizeStudentEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.trim()) {
    throw new Error("Student email is required");
  }

  const trimmed = rawEmail.toLowerCase().trim();

  // Strictly block plus-tags / aliases (+tag)
  if (trimmed.includes("+")) {
    throw new Error("Email aliases and plus-tags (+tag) are strictly blocked on YMCA Match. Please use your standard email.");
  }

  // Validate allowed domain (@gmail.com or @jcboseust.ac.in)
  const isAllowedEmail = /^[a-zA-Z0-9._%-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(trimmed);
  if (!isAllowedEmail) {
    throw new Error("Only genuine @gmail.com email addresses are allowed. Temporary, disposable, and fake emails are strictly blocked!");
  }

  const [username, domain] = trimmed.split("@");

  // For Gmail, remove all dots from the username so 'first.last@gmail.com' and 'firstlast@gmail.com' are identical
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanUsername = username.replace(/\./g, "");
    return `${cleanUsername}@gmail.com`;
  }

  return `${username}@${domain}`;
};

// 1. Send 6-digit Verification OTP to Student Email
authRouter.post("/send-otp", async (req, res) => {
  try {
    const { email, firstName } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Student email is required" });
    }

    const normalizedEmail = normalizeStudentEmail(email);

    // Check if account already exists (matches canonical or pre-existing format)
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    // 60-second cooldown check to prevent spamming and SMTP exhaustion
    const existingOtp = await OTP.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (existingOtp && existingOtp.createdAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        return res.status(429).json({
          message: `Please wait ${60 - elapsedSeconds}s before requesting a new code.`,
        });
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert OTP with fresh timestamp (MongoDB TTL auto-deletes after 10 mins)
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email via Nodemailer (send to the student's entered address)
    const mailResult = await sendVerificationEmail({
      toEmail: email.trim(),
      studentName: firstName,
      otp,
    });

    if (!mailResult.sent && mailResult.mode !== "development") {
      return res.status(500).json({
        message:
          "Could not send email. Google returned an authentication error: Please ensure you are using a 16-character Google App Password (not your normal Gmail password).",
      });
    }

    res.status(200).json({
      success: true,
      message: "6-digit verification code sent to your email!",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 2. Validate OTP code
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const normalizedEmail = normalizeStudentEmail(email);

    const record = await OTP.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
      otp: otp.toString().trim(),
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code. Please check your inbox or request a new code.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 3. Complete Signup with verified email
authRouter.post("/signup", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      year,
      bio,
      age,
      gender,
      branch,
      interest,
      photoUrl,
      otp,
    } = req.body;

    if (!photoUrl || !photoUrl.trim() || photoUrl.startsWith("blob:") || !/^https?:\/\//i.test(photoUrl)) {
      return res.status(400).json({
        message: "Profile photo is compulsory! Please upload a valid photo of yourself.",
      });
    }

    const normalizedEmail = normalizeStudentEmail(email);

    // Prevent duplicate accounts: check both canonical and legacy email formats
    const existinguser = await User.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (existinguser) {
      return res.status(400).json({
        message: "An account with this email already exists",
      });
    }

    // Verify OTP if provided
    if (otp) {
      const validOtp = await OTP.findOne({
        $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
        otp: otp.toString().trim(),
      });

      if (!validOtp) {
        return res.status(400).json({
          message: "Invalid or expired verification code. Please request a new code.",
        });
      }

      // Delete used OTP
      await OTP.deleteMany({
        $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
      });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      age: Number(age) || 20,
      gender,
      branch,
      interest: interest || [],
      email: normalizedEmail, // saved as canonical normalized email
      year,
      password: hashpassword,
      bio: bio || "Hey there! I am using YMCA Match.",
      photoUrl,
      isEmailVerified: true,
    });

    await user.save();

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
      message: "Signup successful!",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        branch: user.branch,
        year: user.year,
        age: user.age,
        gender: user.gender,
        photoUrl: user.photoUrl,
        bio: user.bio,
        interest: user.interest,
        role: user.role || (user.email === "kuldeeprao9812@gmail.com" ? "admin" : "user"),
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// 4. Login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = normalizeStudentEmail(email);

    // Support both canonical and legacy email formats
    const existinguser = await User.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (!existinguser) {
      return res.status(400).json({
        message: "No account found with this email. Please check your spelling or sign up.",
      });
    }

    const ispasswordCorrect = await bcrypt.compare(
      password,
      existinguser.password
    );

    if (!ispasswordCorrect) {
      return res.status(400).json({
        message: "Incorrect password. Please try again.",
      });
    }

    if (existinguser.isBanned) {
      return res.status(403).json({
        message:
          "Your account has been suspended by campus moderation. " +
          (existinguser.banReason ? `Reason: ${existinguser.banReason}` : "Contact campus safety."),
      });
    }

    const token = jwt.sign(
      { _id: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        _id: existinguser._id,
        firstName: existinguser.firstName,
        lastName: existinguser.lastName,
        email: existinguser.email,
        branch: existinguser.branch,
        year: existinguser.year,
        age: existinguser.age,
        gender: existinguser.gender,
        photoUrl: existinguser.photoUrl,
        bio: existinguser.bio,
        interest: existinguser.interest,
        role: existinguser.role || (existinguser.email === "kuldeeprao9812@gmail.com" ? "admin" : "user"),
        isEmailVerified: existinguser.isEmailVerified,
      },
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// 5. Forgot Password - Send 6-digit OTP to registered email
authRouter.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Student email is required" });
    }

    const normalizedEmail = normalizeStudentEmail(email);

    // Check if account exists
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (!existingUser) {
      return res.status(404).json({
        message: "No registered account found with this email. Please check spelling or create a new account.",
      });
    }

    // 60-second cooldown check
    const existingOtp = await OTP.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (existingOtp && existingOtp.createdAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000);
      if (elapsedSeconds < 60) {
        return res.status(429).json({
          message: `Please wait ${60 - elapsedSeconds}s before requesting a new reset code.`,
        });
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert OTP with fresh timestamp
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send password reset email
    const mailResult = await sendVerificationEmail({
      toEmail: email.trim(),
      studentName: existingUser.firstName,
      otp,
      type: "reset",
    });

    if (!mailResult.sent && mailResult.mode !== "development") {
      return res.status(500).json({
        message: "Failed to send reset code via email. Please check server SMTP configuration.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset code sent to your email!",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 6. Forgot Password - Verify OTP and Reset Password
authRouter.post("/forgot-password/reset", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, verification code, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    const normalizedEmail = normalizeStudentEmail(email);

    // Verify OTP
    const validOtp = await OTP.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
      otp: otp.toString().trim(),
    });

    if (!validOtp) {
      return res.status(400).json({
        message: "Invalid or expired verification code. Please request a new code.",
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email.",
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.email = normalizedEmail; // update to canonical format
    await user.save();

    // Delete used OTP
    await OTP.deleteMany({
      $or: [{ email: normalizedEmail }, { email: email.toLowerCase().trim() }],
    });

    // Generate JWT and log user in immediately
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: "Password reset successfully! Logged in.",
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        branch: user.branch,
        year: user.year,
        age: user.age,
        gender: user.gender,
        photoUrl: user.photoUrl,
        bio: user.bio,
        interest: user.interest,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password: " + err.message });
  }
});

export default authRouter;
