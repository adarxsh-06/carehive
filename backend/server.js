import express from "express"
import cors from "cors"
import 'dotenv/config'
import connectDB from "./config/db.js"
import connectCloudinary from "./config/cloudinary.js"
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import userRouter from "./routes/userRoute.js"


// extra feature for this => handle concurrency while booking appointment
// app config
const app = express()
const port = process.env.PORT || 4040
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors()) //allows the frontend to connect to the backend


// api end point 
app.use('/api/admin',adminRouter) //localhost:4040/api/admin/add-doctor
app.use('/api/doctor',doctorRouter) 
app.use('/api/user',userRouter) 

app.get('/', (req,res)=>{
    res.send('API Working')
})

app.listen(port,()=>console.log("Server Started: ", port))
