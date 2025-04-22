import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import waitlistModel from "../models/waitlistModel.js"
import { io } from "../server.js"

const changeAvailability=async(req,res)=>{
    try {

        const {docId}=req.body
        const docData=await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, {available: !docData.available})
        res.json({success:true, message:"Availability Changed"})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

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


// api to mark appointment completed for doctor panel
const appointmentComplete=async(req,res)=>{
    try {

        const {docId, appointmentId}=req.body
        const appointmentData=await appointmentModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId===docId){
            await appointmentModel.findByIdAndUpdate(appointmentId, {isCompleted:true})
            return res.json({success:true, message:"Appointment Completed"})
        } else{
            return res.json({success:false, message:"Mark Failed"})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


// api to mark appointment cancelled for doctor panel
const appointmentCancel = async (req, res) => {
    try {
      const { docId, appointmentId } = req.body;
      const appointmentData = await appointmentModel.findById(appointmentId);
  
      if (!appointmentData || appointmentData.docId.toString() !== docId) {
        return res.json({ success: false, message: "Cancellation Failed" });
      }
  
      await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
  
      const slotDate = appointmentData.slotDate;
      const doctorData = await doctorModel.findById(docId);
  
      // Update doctor slots (free the slot)
      let slots_booked = doctorData.slots_booked || {};
      slots_booked[slotDate] = slots_booked[slotDate]?.filter(e => e !== appointmentData.slotTime);
      await doctorModel.findByIdAndUpdate(docId, { slots_booked });
  
      // Check waitlist
      const waitlist = await waitlistModel.findOne({ doctorId: docId, slotDate });
  
      if (waitlist && waitlist.users.length > 0) {
        const nextUser = waitlist.users.shift();
  
        const userData = await userModel.findById(nextUser.userId).select("-password");
  
        const newAppointment = await appointmentModel.create({
          docId,
          userId: nextUser.userId,
          userData,
          docData: doctorData,
          amount: doctorData.fees,
          slotTime: appointmentData.slotTime,
          slotDate,
          date: Date.now(),
        });
  
        // Update doctor slots (assign slot again)
        slots_booked[slotDate] = [...(slots_booked[slotDate] || []), appointmentData.slotTime];
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });
  
        // Update waitlist
        if (waitlist.users.length === 0) {
          await waitlistModel.deleteOne({ _id: waitlist._id });
        } else {
          await waitlist.save();
        }
  
        // Notify frontend
        io.to(nextUser.userId.toString()).emit("slotAssigned", {
          message: "A slot became available and was assigned to you!",
          appointment: newAppointment,
        });
  
        console.log(`✅ Slot reassigned to waitlisted user ${nextUser.userId}`);
      }
  
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
    changeAvailability,
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