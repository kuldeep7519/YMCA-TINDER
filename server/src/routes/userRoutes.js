import express from "express";
import auth from "../middleware/auth.js";
import connectionModel from "../models/connectionModel.js";
import User from "../models/userModel.js";
import { set } from "mongoose";
 
const userRouter = express.Router();
userRouter.get("/user/request/recieved", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const connectionrequest = await connectionModel.find({
      touserid: loggedinuser._id,
      status: "interested",
    }).populate("fromuserid",["firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "branch",
        "year",
        "bio",
        "interest"]);
    if (!connectionrequest) {
      return res.status(401).send("connection request is invalid ");
    }
    res.status(200).json({
      data: connectionrequest,
    });
  } catch (err) {
    res.status(401).send(err.message);
  }
});
userRouter.get("/user/connection", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const connections = await connectionModel.find({
        status:"accepted",
        $or:[
            {touserid:loggedinuser._id},
            {fromuserid:loggedinuser._id}
        ]
      
       
    }).populate("fromuserid",["firstName",
        "lastName",
        "photoUrl",
        "age",
        "gender",
        "branch",
        "year",
        "bio",
        "interest"]).populate("touserid", ["firstName", "lastName", "photoUrl", "branch", "year", "bio"]);
    const data=connections.map((connection)=>{
        if(connection.fromuserid._id.toString()===loggedinuser._id.toString()){
            return connection.touserid
        }
        return connection.fromuserid
    })
    res.status(200).json({
      data: data,
    });
  } catch (err) {
    res.status(401).send(err.message);
  }
});
userRouter.get("/user/feed", auth, async (req, res) => {
  try {
    const loggedinuser = req.user;
    const connections = await connectionModel.find({
        $or:[
            {touserid:loggedinuser._id},
            {fromuserid:loggedinuser._id}
        ]

    }).select("fromuserid touserid")
    const hideusersfromfeed = new Set();
    connections.forEach((req)=>{
        hideusersfromfeed.add(req.fromuserid.toString())
        hideusersfromfeed.add(req.touserid.toString())
    })
     hideusersfromfeed.add(loggedinuser._id.toString());
     
    const users = await User.find({
      _id: { $nin: Array.from(hideusersfromfeed) },
    }).select([
      "firstName",
      "lastName",
      "photoUrl",
      "age",
      "gender",
      "branch",
      "year",
      "bio",
      "interest",
    ]);
    res.json({ data: users });

    
  } catch (err) {
    res.status(401).send(err.message);
  }
});
export default userRouter;
