import mongoose from "mongoose"
const connectDB=async()=>{
    
    await mongoose.connect(process.env.DATABASE_URL)
    console.log("connecion succesfull to the database")
}
export default connectDB;