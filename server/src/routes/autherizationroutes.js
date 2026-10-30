import User from "../models/userModel.js";
import express from "express";
import bcrypt, { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
const authRouter = express.Router();
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
    } = req.body;
    const existinguser = await User.findOne({ email });
    if (existinguser) {
      return res.status(400).json({
        message: "user already exist",
      });
    }
    const hashpassword = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      age,
      gender,
      branch,
      interest,
      email,
      year,
      password: hashpassword,
      bio,
    });
    await user.save();
    const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      res.cookie("token", token, { httpOnly: true });
    res.status(201).json({
      message: "Signup successful!",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        branch: user.branch,
      },
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existinguser = await User.findOne({ email });
    if (!existinguser) {
      return res.status(400).json({
        message: "email not exist",
      });
    }
    const ispasswordCorrect = await bcrypt.compare(
      password,
      existinguser.password,
    );
    if (!ispasswordCorrect) {
      return res.status(400).json({
        message: "password incorrect. . . ",
      });
    }
     
      const token = jwt.sign(
        { _id: existinguser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
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
        photoUrl: existinguser.photoUrl,
        bio: existinguser.bio,
      },
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});
export default authRouter;
