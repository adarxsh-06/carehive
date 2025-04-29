import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import waitlistModel from "../models/waitlistModel.js"
import { io, clients } from "../server.js"


// Function to emit events to specific clients
const emitToClient = (userId, event, data) => {
    const client = clients.get(userId);
    if (client) {
        io.to(client.socketId).emit(event, data);
    }
};

// Function to emit events to clients with a specific role
// const emitToRole = (role, event, data) => {
//   for (const [userId, client] of clients.entries()) {
//       if (client.role === role) {
//           io.to(client.socketId).emit(event, data);
//       }
//   }
// };


const doctorList=async(req,res)=>{
    try {
        const doctors=await doctorModel.find({}).select(['-password', '-email'])
        
        res.json({success:true, doctors})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


// api for doctor login
const loginDoctor=async(req,res)=>{
    try {

        const {email,password}=req.body
        const doctor=await doctorModel.findOne({email})

        if(!doctor){
            return res.json({success:false, message:"Invalid Credentials"})
        }

        const isMatch=await bcrypt.compare(password,doctor.password)

        if(isMatch){
            const token=jwt.sign({id:doctor._id},process.env.JWT_SECRET)
            res.json({success:true, token})
        } else{
            return res.json({success:false, message:"Invalid Credentials"})
        }
        
       
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}



// api for doctor appointments
const appointmentsDoctor=async(req,res)=>{
    try {

        const {docId}=req.body
        const appointments=await appointmentModel.find({docId})
        
        res.json({success:true, appointments})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}



// api to mark appointment completed for doctor panel => email can be sent to the patient thanking him for feedback to doctor and rate him
const appointmentComplete = async (req, res) => {
    try {
      const { docId, appointmentId } = req.body;
      const appointmentData = await appointmentModel.findById(appointmentId);
  
      if (!appointmentData) {
        return res.json({ success: false, message: "Appointment not found" });
      }
  
      if (appointmentData.docId !== docId) {
        return res.json({ success: false, message: "Unauthorized" });
      }
  
      const { userId, slotDate, slotTime } = appointmentData;
  
      // Convert slotDate ("28_4_2025") and slotTime ("11:00 AM") to a JS Date object
      const [day, month, year] = slotDate.split("_").map(Number);
      const appointmentDateTime = new Date(`${year}-${month}-${day} ${slotTime}`);
  
      const now = new Date();
      if (now < appointmentDateTime) {
        return res.json({
          success: false,
          message: "Too early to mark this appointment as completed",
        });
      }
  
      await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
  
      // Notify the user about the appointment completion
      emitToClient(userId, "appointment-completed", { slotDate, slotTime });
  
      return res.json({ success: true, message: "Appointment marked as completed" });
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };
  


// api to mark appointment cancelled for doctor panel
const appointmentCancel = async (req, res) => {
    try {
      const { docId, appointmentId } = req.body;
      const appointmentData = await appointmentModel.findById(appointmentId);
  
      if (!appointmentData || appointmentData.docId.toString() !== docId) {
        return res.json({ success: false, message: "Cancellation Failed" });
      }
  
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
  
    //   releasing doctor slot
      const { slotDate, slotTime, userId } = appointmentData;
      const doctorData = await doctorModel.findById(docId);
      let slots_booked = doctorData.slots_booked || {};
      slots_booked[slotDate]=slots_booked[slotDate]?.filter(e => e !== slotTime) 
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
  
      // Check waitlist for that day(not for that slot)
      const waitlist = await waitlistModel.findOne({ docId, slotDate });
  
      if (waitlist && waitlist.users.length > 0) {
        const nextUser = waitlist.users.shift();
        
        // Update waitlist
        if (waitlist.users.length === 0) {
          await waitlistModel.deleteOne({ _id: waitlist._id });
        } else {
          await waitlist.save();
        }

        const userData = await userModel.findById(nextUser.userId).select("-password");
  
        const newAppointment = await appointmentModel.create({
          userId: nextUser.userId,
          docId,
          userData,
          docData: doctorData,
          amount: doctorData.fees,
          slotTime,
          slotDate,
          date: Date.now(),
        });

        try {
            await newAppointment.save();
      
            // Update doctor slots (assign slot again)
            slots_booked[slotDate] = [...(slots_booked[slotDate] || []), slotTime];
            await doctorModel.findByIdAndUpdate(docId, { slots_booked });
      
            // Real-time notification to next user
            emitToClient(nextUser.userId, "waitlist-slot-assigned", {
                docId,
                slotDate,
                slotTime,
            });
              
            console.log(`✅ Waitlist: Assigned canceled slot to ${nextUser.userId}`);
        } catch (error) {
            if (err.code === 11000) {
                // Duplicate key error, slot was already taken
                console.log("❌ Slot already booked by another waitlist user (race condition)");
              } else {
                throw err;
            }
        }
      }
      // Notify the original user about successful cancellation
      emitToClient(userId, "appointment-canceled-by-doctor-1", {
        appointmentId,
        slotDate,
        slotTime,
      });
    
      // Notify doctor about the cancellation
      emitToClient(docId, "appointment-canceled-by-doctor-2", { userId, slotDate, slotTime });
  
      res.json({ success: true, message: "Appointment Cancelled and Waitlist Handled" });
  
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  };
  

// api to get dashboard data for doctor panel
const doctorDashboard=async(req,res)=>{
    try {

        const {docId}=req.body
        const appointments=await appointmentModel.find({docId})

        let earnings=0

        appointments.map((item)=>{
            if(item.isCompleted || item.payment){
                earnings += item.amount
            }
        })
        
        let patients=[]
        appointments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })

        const dashData={
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }

       
        res.json({success:true, dashData})
        
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


// api to get doctor profile for doctor panel
const doctorProfile=async(req,res)=>{
    try {

        const {docId}=req.body
        const profileData=await doctorModel.findById(docId).select('-password')

        res.json({success:true, profileData})
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


// api to update doctor profile for doctor panel
const updateDoctorProfile=async(req,res)=>{
    try {

        const {docId, fees, address, available}=req.body
        await doctorModel.findByIdAndUpdate(docId, {fees ,address, available})

        res.json({success:true, message:"Profile Updated"})
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


const getWaitlistByDoctor = async (req, res) => {
    try {
      const { doctorId } = req.params;
  
      const waitlists = await waitlistModel.find({ doctorId }).populate('users.userId', 'name email phone');
  
      res.status(200).json({ success: true, waitlists });
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
};


export {
    doctorList,
    loginDoctor,
    appointmentsDoctor,
    appointmentComplete, 
    appointmentCancel, 
    doctorDashboard, 
    doctorProfile, 
    updateDoctorProfile,
    getWaitlistByDoctor
}