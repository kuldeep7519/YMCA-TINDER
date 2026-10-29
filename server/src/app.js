import connectDB from "./config/database.js";
import dotenv from "dotenv"
import cors from "cors"
import express from "express"
import auth from "./routes/autherizationroutes.js";
dotenv.config();


const app=express();

app.use(cors())
app.use(express.json())


app.use("/",auth)



connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server listening on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
