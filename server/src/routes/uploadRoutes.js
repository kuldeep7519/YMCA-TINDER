import express from "express";
import auth from "../middleware/auth.js";
import { upload, uploadToCloudOrLocal, uploadChatImage } from "../utils/uploader.js";

const uploadRouter = express.Router();

// 1. Generic photo upload (Used during student signup/registration)
uploadRouter.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No photo file provided" });
    }

    const photoUrl = await uploadToCloudOrLocal(
      req.file.buffer,
      req.file.originalname,
      req
    );

    res.status(200).json({
      message: "Photo uploaded successfully!",
      photoUrl,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed: " + err.message });
  }
});

// 2. Direct Profile Photo upload (Used by logged-in student)
uploadRouter.post(
  "/upload/profile-photo",
  auth,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo file provided" });
      }

      const photoUrl = await uploadToCloudOrLocal(
        req.file.buffer,
        req.file.originalname,
        req
      );

      // Save directly to logged-in user profile
      const user = req.user;
      user.photoUrl = photoUrl;
      await user.save();

      res.status(200).json({
        message: "Profile photo updated successfully!",
        photoUrl,
        user,
      });
    } catch (err) {
      res.status(500).json({ message: "Upload failed: " + err.message });
    }
  }
);

// 3. Chat photo upload (Preserves aspect ratio, returns secure URL)
uploadRouter.post(
  "/upload/chat-image",
  auth,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = await uploadChatImage(
        req.file.buffer,
        req.file.originalname,
        req
      );

      res.status(200).json({
        success: true,
        message: "Chat image uploaded successfully!",
        imageUrl,
      });
    } catch (err) {
      res.status(500).json({ message: "Image upload failed: " + err.message });
    }
  }
);

export default uploadRouter;
