import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
        minLength:2,
        maxLength:20
    },
    lastName:{
        type:String,
        maxLength:20
    },
    email:{
        type:String,
        unique: true,
        trim:true,
        required:true,
        lowercase:true,
        maxLength:100

    },
    password:{
        type:String,
        trim:true,
        required:true

    },
    age:{
        type:Number,
        min:18,
        max:60


    },
    gender:{
        type:String,
        enum:{
            values:["male","female","others"],
            message:`{VALUE} is not a valid gender `
        },
        required:true
    },
    branch:{
        type:String,
        required:true
    },
    year:{
        type:String,
        required:true
    },
    photoUrl:{
        type:String,
        default:"https://geographyandyou.com/images/user-profile.png"
    },
    bio:{
        type:String,
        maxLength:250
    },
    interest:{
        type:[String],
        default:[]
    }

},{timestamps:true})
const User=mongoose.model("User",userSchema)
export default User