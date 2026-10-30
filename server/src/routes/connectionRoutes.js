// now we r going to make the connection model so lets be ready for that.
import express from "express";
const connectionRouter = express.Router();
import connectionModel from "../models/connectionModel.js";
import User from "../models/userModel.js";
import auth from "../middleware/auth.js";
connectionRouter.post("/request/send/:status/:to_id",auth, async (req, res) => {
  try {
    const status = req.params.status;
    const to_id = req.params.to_id;
    const loggedinuser = req.user;
    const AllowedStatus = ["interested", "ignored"];
    if (status && !AllowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values are: ${AllowedStatus.join(", ")}`,
      });
    }
    const IsuserExist = await User.findOne({ _id: to_id });
    if (!IsuserExist) {
      return res.status(401).send("user does not exist");
    }
    // now we will check the it can be like that . ki mene request pehle hi bhej rakhi ho . 
    const ExistingConnection=await connectionModel.findOne(
      { 
        $or:[
          { fromuserid:loggedinuser._id,touserid:to_id},
          { fromuserid:to_id,touserid:loggedinuser._id}
        ]
       })
       if(ExistingConnection){
        return res.status(401).send("connection request exist .. ")
       }
    const connection = new connectionModel({
      fromuserid: loggedinuser._id,
      touserid: to_id,
      status: status,
    });
    await connection.save();
    res.status(200).json({
        message:"request send succesfully "
        
    })
  } catch (err) {
    res.status(401).send(err.message);
  }
});
connectionRouter.patch("/request/review/:status/:from_id",auth,async(req,res)=>{
  try{
  const loggedinuser=req.user
  const status=req.params.status
  const from_id=req.params.from_id
  const AllowedStatus=["accepted","rejected"]
  if(status && !AllowedStatus.includes(status)){
    return res.status(401).send("Status is not valid ")
  }
  const connection=await connectionModel.findOne(
    
      {fromuserid:from_id,touserid:loggedinuser._id,status:"interested"}
    
  )
  if(!connection){
    throw new Error("connection request does not exist ")

  }
  connection.status=status;
  await connection.save();
  res.status(200).send(`${status} succesfully`)}catch(err){
    res.status(401).send(err.message)
  }

})
export default connectionRouter;
