import connectDB from "./config/database.js";
import dotenv from "dotenv"
import cors from "cors"
import express from "express"
import authRouter from "./routes/autherizationroutes.js";
import cookieparser from "cookie-parser"
import ProfileRoute from "./routes/profileRoutes.js";
import connectionRouter from "./routes/connectionRoutes.js";
import userRouter from "./routes/userRoutes.js";
dotenv.config();


const app=express();
app.use(cookieparser())
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
app.use(express.json())


app.use("/",authRouter)
app.use("/",ProfileRoute)
app.use("/",connectionRouter)
app.use("/",userRouter)



connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
