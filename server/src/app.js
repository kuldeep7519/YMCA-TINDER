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
app.use(express.json());

// Serve locally uploaded files statically
app.use("/uploads", express.static(path.resolve("public/uploads")));

// Routes
app.use("/", authRouter);
app.use("/", ProfileRoute);
app.use("/", connectionRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", uploadRouter);

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
