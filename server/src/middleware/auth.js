import User from "../models/userModel.js";
import jwt from "jsonwebtoken"
// now we are going to make a middleware for all of our routes like profile and mathces and all they only can be accessed when there is jwt token and it is correct. 
const auth=async(req,res,next)=>{
    try{
        const {token}=req.cookies;
        if(!token){
            return res.status(401).send("please log in . ")

        }
        const decodedmessage=await jwt.verify(token,process.env.JWT_SECRET)

        const {_id}=decodedmessage
        const user=await User.findById(_id)
        if(!user){
            throw new Error("user not found ")
        }
        req.user=user;
        next();
    }catch(err){
        res.status(401).send(err.message)
    }
}
export default auth;