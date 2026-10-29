import User from "../models/userModel.js";
import express from "express"
const auth=express.Router();
auth.post("/signup",(req,res)=>{
    res.send("signup succesfull")
})
export default auth;