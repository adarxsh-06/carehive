
import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/CareHive`)
        console.log(`\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`)
    } catch(err){
        console.error("MongoDB Connection Failed: ",err)
        process.exit(1)
    }
}
export default connectDB