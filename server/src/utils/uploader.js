import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Configure Multer to store incoming file in memory buffer
const storage = multer.memoryStorage();

// Accept image formats (including mobile camera, HEIC, WEBP, PNG, JPG) & max 25MB
export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit for high-res mobile photos
  fileFilter: (req, file, cb) => {
    // If browser supplies image mimetype, accept it immediately
    if (file.mimetype && file.mimetype.toLowerCase().startsWith("image/")) {
      return cb(null, true);
    }

    const filetypes = /jpeg|jpg|png|webp|gif|heic|heif|bmp/i;
    const extname = path.extname(file.originalname || "").toLowerCase();

    if (filetypes.test(extname) || filetypes.test(file.mimetype || "")) {
      return cb(null, true);
    }

    cb(new Error("Only image files (JPEG, JPG, PNG, WEBP, HEIC, GIF) are allowed!"));
  },
});

// Resilient uploader: Uses Cloudinary if configured; otherwise saves locally to /public/uploads
export const uploadToCloudOrLocal = async (fileBuffer, originalname, req) => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ymca-tinder-profiles",
          transformation: [
            { width: 800, height: 1000, crop: "fill", gravity: "face" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(fileBuffer);
    });
  } else {
    // Local storage fallback
    const uploadsDir = path.resolve("public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanExt = path.extname(originalname) || ".jpg";
    const filename = `student-${Date.now()}-${Math.round(Math.random() * 1e9)}${cleanExt}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    // Return full URL or relative path
    const host = req.get("host");
    const protocol = req.protocol;
    return `${protocol}://${host}/uploads/${filename}`;
  }
};

// Dedicated chat image uploader (Preserves aspect ratio, no face cropping, handles memes/photos)
export const uploadChatImage = async (fileBuffer, originalname, req) => {
  const isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ymca-chat-photos",
          transformation: [
            { width: 1400, crop: "limit", quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(fileBuffer);
    });
  } else {
    // Local storage fallback
    const uploadsDir = path.resolve("public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanExt = path.extname(originalname) || ".jpg";
    const filename = `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${cleanExt}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    const host = req.get("host");
    const protocol = req.protocol;
    return `${protocol}://${host}/uploads/${filename}`;
  }
};
