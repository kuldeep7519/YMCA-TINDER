import User from "../models/userModel.js";
import OTP from "../models/otpModel.js";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/mailer.js";

const authRouter = express.Router();

// 1. Send 6-digit Verification OTP to Student Email
authRouter.post("/send-otp", async (req, res) => {
  try {
    const { email, firstName } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Student email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Block fake/temp emails - strictly allow @gmail.com (and official @jcboseust.ac.in)
    const isAllowedEmail = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalizedEmail);
    if (!isAllowedEmail) {
      return res.status(400).json({
        message: "Only genuine @gmail.com email addresses are allowed. Temporary, disposable, and fake emails are strictly blocked!",
      });
    }

    // Check if account already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists. Please log in.",
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert OTP with fresh timestamp (MongoDB TTL auto-deletes after 10 mins)
    await OTP.findOneAndUpdate(
      { email: normalizedEmail },
      { email: normalizedEmail, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email via Nodemailer (or fallback to server console if SMTP pending)
    const mailResult = await sendVerificationEmail({
      toEmail: normalizedEmail,
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
    res.status(500).json({ message: "Failed to send code: " + err.message });
  }
});

// 2. Validate OTP code
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const record = await OTP.findOne({
      email: email.toLowerCase().trim(),
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
    res.status(500).json({ message: err.message });
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

    if (!photoUrl || !photoUrl.trim()) {
      return res.status(400).json({
        message: "Profile photo is compulsory! Please upload a photo of yourself.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const isAllowedEmail = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalizedEmail);
    if (!isAllowedEmail) {
      return res.status(400).json({
        message: "Only genuine @gmail.com email addresses are allowed. Temporary, disposable, and fake emails are strictly blocked!",
      });
    }

    const existinguser = await User.findOne({ email: normalizedEmail });
    if (existinguser) {
      return res.status(400).json({
        message: "An account with this email already exists",
      });
    }

    // Verify OTP if provided
    if (otp) {
      const validOtp = await OTP.findOne({
        email: normalizedEmail,
        otp: otp.toString().trim(),
      });

      if (!validOtp) {
        return res.status(400).json({
          message: "Invalid or expired verification code. Please request a new code.",
        });
      }

      // Delete used OTP
      await OTP.deleteMany({ email: normalizedEmail });
    }

    const hashpassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      age: Number(age) || 20,
      gender,
      branch,
      interest: interest || [],
      email: normalizedEmail,
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

    res.cookie("token", token, { httpOnly: true });

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
    const normalizedEmail = email.toLowerCase().trim();

    const isAllowedEmail = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalizedEmail);
    if (!isAllowedEmail) {
      return res.status(400).json({
        message: "Only genuine @gmail.com email addresses are allowed. Temporary, disposable, and fake emails are strictly blocked!",
      });
    }

    const existinguser = await User.findOne({ email: normalizedEmail });
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

    const token = jwt.sign(
      { _id: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, { httpOnly: true });

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

    const normalizedEmail = email.toLowerCase().trim();

    // Check allowed domains
    const isAllowedEmail = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalizedEmail);
    if (!isAllowedEmail) {
      return res.status(400).json({
        message: "Only genuine @gmail.com email addresses are allowed.",
      });
    }

    // Check if account exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({
        message: "No registered account found with this email. Please check spelling or create a new account.",
      });
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
      toEmail: normalizedEmail,
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
    res.status(500).json({ message: "Failed to send reset code: " + err.message });
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

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const validOtp = await OTP.findOne({
      email: normalizedEmail,
      otp: otp.toString().trim(),
    });

    if (!validOtp) {
      return res.status(400).json({
        message: "Invalid or expired verification code. Please request a new code.",
      });
    }

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        message: "No account found with this email.",
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Delete used OTP
    await OTP.deleteMany({ email: normalizedEmail });

    // Generate JWT and log user in immediately
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("token", token, { httpOnly: true });

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
