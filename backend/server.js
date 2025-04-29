import express from "express"
import cron from 'node-cron'
import cors from "cors"
import 'dotenv/config'
import http from "http"; // Required for WebSockets
import { Server } from "socket.io"; // Import Socket.io
import connectDB from "./config/db.js"
import connectCloudinary from "./config/cloudinary.js"
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import userRouter from "./routes/userRoute.js"
import appointmentModel from "./models/appointmentModel.js";

// app config
const app = express()
const port = process.env.PORT || 4040
connectDB()
connectCloudinary()


// Define allowed origins
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",  // Frontend
];
  
// CORS options
const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    // credentials: true
};

// middlewares
app.use(express.json())
app.use(cors(corsOptions)) //allows the frontend to connect to the backend


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
    cors: corsOptions
});

// Store connected clients
const clients = new Map();

// WebSocket Connection
io.on("connection", (socket) => {
    // console.log(`⚡ A user connected: ${socket.id}`);

    // Store socket reference for real-time updates
    socket.on('register', ({ userId, role }) => {
        clients.set(userId, { socketId: socket.id, role });
        console.log(`✅ ${role} registered: ${userId}`);
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log(`🔴 User disconnected: ${socket.id}`);
        // Remove user from clients list
        for (const [userId, client] of clients.entries()) {
            if (client.socketId === socket.id) {
                clients.delete(userId);
                break;
            }
        }
    });
});

cron.schedule('0 0 * * *', async () => {
    console.log('Running daily job to delete old cancelled appointments...');
  
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
    try {
      const result = await appointmentModel.deleteMany({
        cancelled: true,
        cancelledAt: { $lt: sevenDaysAgo }
      });
  
      console.log(`Deleted ${result.deletedCount} old cancelled appointments`);
    } catch (error) {
      console.error('Error deleting old cancelled appointments:', error);
    }
});

// Export io to use in controllers
export { io, clients, server };

server.listen(port,()=>console.log("Server Started: ", port))
