import validator from "validator"
import bcrypt from "bcrypt"
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"



// API for adding doctor => email can be sent to doctor welcoming him
const addDoctor=async(req,res)=>{
    try {

        const {name,email,password,speciality,degree,experience,about,fees,address}=req.body
        const imageFile=req.file
       
        // chehcking for all data to add doctor
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({success:false, message:"Missing Details"})
        }

        // validating email format

        if(!validator.isEmail(email)){
            return res.json({success:false, message:"Please Enter a valid email"})
        }

        // strong password
        if(password.length<8){
            return res.json({success:false, message:"Please enter a strong password"})
        }

        // hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        // uplaod image to cloudinary
        const imageUpload=await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"})
    
        const imageUrl=imageUpload.secure_url
        
        const doctorData={
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address:JSON.parse(address), //store object as an object in 
            date:Date.now()
        }

        const newDoctor=new doctorModel(doctorData)
        await newDoctor.save()

        res.json({success:true, message:"Doctor added"})
        
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}

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


// api for admin login
const loginAdmin=async(req,res)=>{
    try {

        const {email,password}=req.body
       
        // chehcking for all data to add doctor
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token= jwt.sign(email+password, process.env.JWT_SECRET)
            res.json({success:true, token})
        } else{
            return res.json({success:false, message:"Invalid Credentials"})
        }
        
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


// api for admin login
const allDoctors=async(req,res)=>{
    try {

        const doctors=await doctorModel.find({}).select('-password')
       
        res.json({success:true, doctors})
        
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}


// api to get all appointments list
const appointmentsAdmin=async(req,res)=>{
    try {

        const appointments=await appointmentModel.find({})
       
        res.json({success:true, appointments})
        
        
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}
  

//api to get dashboard data for admin panel
const adminDashboard=async(req , res)=>{
    try {
        
        const users= await userModel.find({}) 
        const doctors= await doctorModel.find({}) 

        const appointments=await appointmentModel.find({})

        const dashData={
            doctors:doctors.length,
            appointments:appointments.length,
            patients:users.length,
            latestAppointments:appointments.reverse().slice(0,5)
        }


        res.json({success:true, dashData})
       
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}

export {changeAvailability,addDoctor, loginAdmin, allDoctors, appointmentsAdmin, adminDashboard}