 

import mongoose from "mongoose";
const {Schema}=mongoose
 
const ConnectionSchema= new Schema({
    fromuserid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    touserid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    status:{
        type:String,
        enum:["interested","accepted","rejected","ignored"]

    }
},{timestamps:true})
const connectionModel=mongoose.model("connectionModel",ConnectionSchema)
export default connectionModel
