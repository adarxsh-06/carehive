
import validator from "validator"
import bcrypt from "bcrypt"
import userModel from'../models/userModel.js'
import jwt from "jsonwebtoken"
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"
import razorpay from "razorpay"
import mongoose from "mongoose"
import { io } from "../server.js"

// api to register user
const registerUser=async(req,res)=>{
    try {
        const {name,email,password}=req.body
        if(!name || !password || !email){
           return res.json({success:false, message:"Missing Details"})
        }

        // validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false, message:"Enter a valid email"})
         }

        //  validating a strong password
        if(password.length<8){
            return res.json({success:false, message:"Enter a strong password"})
         }
        
        //  hashing user password
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)

        const userData={
            name,
            email,
            password:hashedPassword
        }

        const newUser=new userModel(userData)

        const user=await newUser.save()

        const token=jwt.sign({id:user._id}, process.env.JWT_SECRET)
        res.json({success:true,token})

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


// api for user login
const loginUser=async(req , res)=>{
    try {
        const {email,password}=req.body
        const user=await userModel.findOne({email})

        if(!user){
           return res.json({success:false, message:"User not exist"})
        }
        
        const isMatch=await bcrypt.compare(password,user.password)

        if(isMatch){
            const token=jwt.sign({id:user._id}, process.env.JWT_SECRET)
            res.json({success:true, token})
        } else{
            res.json({success:false, message:"Invalid Credentials"})
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


// api for getting user profile data
const getProfile=async(req , res)=>{
    try {
        const {userId}=req.body
        const userData=await userModel.findById(userId).select('-password')
        
        res.json({success:true, userData})
       
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


// api for updating user profile data
const updateProfile=async(req , res)=>{
    try {
        const {userId, name, phone, address, dob, gender}=req.body
        const imageFile=req.file

        if(!phone || !name || !dob || !gender){
           return res.json({success:false, message:"Data missing"})
        }
        await userModel.findByIdAndUpdate(userId, {name, phone, address:JSON.parse(address), dob, gender})

        if(imageFile){
            // upload image to cloudinary
            const imageUpload=await cloudinary.uploader.upload(imageFile.path, {resource_type: 'image'})
            const imageUrl=imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, {image:imageUrl})
        }
        
        res.json({success:true, message:"Profile Updated"})
       
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


// api to book appointment => handling race condition or concurrecy
const bookAppointment=async(req , res)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {userId, docId, slotDate, slotTime}=req.body
        const docData= await doctorModel.findById(docId).select('-password').session(session);
        if(!docData.available){
            await session.abortTransaction();
            return res.json({success:false, message:"Doctor Not Available"})
        }

        // Try to update slots_booked atomically
         const updatedDoctor = await doctorModel.findOneAndUpdate(
            { _id: docId, [`slots_booked.${slotDate}`]: { $ne: slotTime } }, // Ensure slot is NOT already booked
            { $push: { [`slots_booked.${slotDate}`]: slotTime } },
            { new: true, session }
        );

        if (!updatedDoctor) {
            await session.abortTransaction();
            return res.json({ success: false, message: "Slot Not Available" });
        }

        const userData=await userModel.findById(userId).select('-password').session(session);
        
        delete docData.slots_booked

        const appointmentData={
            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date:Date.now()
        }

        const newAppointment=new appointmentModel(appointmentData)
        await newAppointment.save({session})

        await session.commitTransaction();
        session.endSession();

        // Emit real-time slot update event
        io.emit("slot-booked", { docId, slotDate, slotTime });
       
        res.json({success:true, message:"Appointment Booked"})
       
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


//api to show all appointments
const listAppointment=async(req , res)=>{
    try {
        const {userId}=req.body
        const appointments= await appointmentModel.find({userId}) //will get the array of all the appointents

        res.json({success:true, appointments})
       
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


//api to cancel appointment
const cancelAppointment=async(req , res)=>{
    try {
        const {userId,appointmentId}=req.body
        const appointmentData= await appointmentModel.findById(appointmentId) 

        // verify appointment user
        if(appointmentData.userId!==userId){
          return res.json({success:false, message:"Unauthorized Action"})
        }

        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        // releasing doctors slot
        const {docId, slotDate, slotTime}=appointmentData
        const doctorData=await doctorModel.findById(docId)
        let slots_booked=doctorData.slots_booked
        slots_booked[slotDate]=slots_booked[slotDate].filter(e => e !== slotTime)
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})

        res.json({success:true, message:"Appointment Cancelled"})
       
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


const razorpayInstance=new razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_KEY_SECRET
})
//api to make payment of appointment using razorpay
const paymentRazorpay=async(req , res)=>{
    try {
        const {appointmentId}=req.body
        const appointmentData= await appointmentModel.findById(appointmentId) 

        // verify appointmentData
        if(!appointmentData || appointmentData.cancelled){
          return res.json({success:false, message:"Appointment Cancelled Or Not Found"})
        }

        // creating options for razorpay payment
        const options={
            amount:appointmentData.amount * 100,
            currency:process.env.CURRENCY,
            receipt:appointmentId
        }

        // creation of order
        const order=await razorpayInstance.orders.create(options)

        res.json({success:true, order})
       
    } catch (error) {
       
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


//api to verify payment of appointment using razorpay
const verifyRazorpay=async(req , res)=>{
    try {
        const {razorpay_order_id}=req.body
        const orderInfo= await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status==='paid'){
           await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {payment:true})
           res.json({success:true, message:"Payment Successfull"}) 
        } else{
            res.json({success:false, message:"Payment falied"}) 
        }
       
    } catch (error) {
       
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}

export {registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, verifyRazorpay}