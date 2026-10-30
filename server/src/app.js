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
app.use(cors())
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
