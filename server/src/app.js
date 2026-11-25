import http from "http";
import path from "path";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import cookieparser from "cookie-parser";
import authRouter from "./routes/autherizationroutes.js";
import ProfileRoute from "./routes/profileRoutes.js";
import connectionRouter from "./routes/connectionRoutes.js";
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import initializeSocket from "./utils/socket.js";

dotenv.config();

const app = express();
// Enable trust proxy for Nginx / reverse proxy deployment
app.set("trust proxy", 1);
const server = http.createServer(app);

// Initialize Socket.io real-time engine
const io = initializeSocket(server);
app.set("io", io);

app.use(cookieparser());

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://ymcamatch.in",
  "https://www.ymcamatch.in",
  "http://ymcamatch.in",
  "http://www.ymcamatch.in",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback to allow during deployment setup
    },
    credentials: true,
  })
);

// High-capacity payload limit to prevent 413 Payload Too Large on student photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve locally uploaded files statically
app.use("/uploads", express.static(path.resolve("public/uploads")));

// Routes
app.use("/", authRouter);
app.use("/", ProfileRoute);
app.use("/", connectionRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", uploadRouter);
app.use("/", adminRouter);

// Bulletproof Crash Guards - prevents the server process from crashing on unhandled errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception caught by guard:", err);
});

// Connect DB first, then start HTTP + Socket.io server
connectDB()
  .then(() => {
    server.listen(process.env.PORT, () => {
      console.log(`🚀 Server listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
