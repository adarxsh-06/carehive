import express from "express"
import cors from "cors"
import 'dotenv/config'
import http from "http"; // Required for WebSockets
import { Server } from "socket.io"; // Import Socket.io
import mongoose from "mongoose";
import connectDB from "./config/db.js"
import connectCloudinary from "./config/cloudinary.js"
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import userRouter from "./routes/userRoute.js"


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

// HTTP server (for socket.io)
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",  //frontend  to change when go for production
        methods: ["GET", "POST"],
    },
});

// Store connected clients
const clients = {};

// WebSocket Connection
io.on("connection", (socket) => {
    console.log(`⚡ A user connected: ${socket.id}`);

    // Store socket reference for real-time updates
    socket.on("register-user", (userId) => {
        clients[userId] = socket.id;
    });

    // Listen for slot booking events
    socket.on("slot-booked", (data) => {
        console.log("🔔 Slot booked: ", data);
        io.emit("update-slot", data); // Broadcast to all clients
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log(`🔴 User disconnected: ${socket.id}`);
        // Remove user from clients list
        Object.keys(clients).forEach((key) => {
            if (clients[key] === socket.id) delete clients[key];
        });
    });
});

// Export io to use in controllers
export { io };

server.listen(port,()=>console.log("Server Started: ", port))
