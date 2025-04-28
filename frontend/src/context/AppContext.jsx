import { createContext, useEffect, useState } from "react";
import axios from "axios"
import {toast} from "react-toastify"
import { useSocket, useSocketActions } from "./SocketContext";

export const AppContext=createContext()

const AppContextProvider=(props)=>{
    const [doctors,setDoctors]=useState([])
    const [token, setToken]=useState(localStorage.getItem('token') ? localStorage.getItem('token') : false)
    const [userData, setUserData]=useState(false)
    const [appointments, setAppointments] = useState([]);

    const {socket} = useSocket();
    const { registerSocket } = useSocketActions();

    const currency='₹'
    const calculateAge=(dob)=>{
        const today= new Date()
        const birthDate= new Date(dob)
        let age=today.getFullYear() - birthDate.getFullYear()
        return age
    }

    const months=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const slotDateFormat=(slotDate)=>{
        const dateArray=slotDate.split('_')
        return dateArray[0]+" "+months[Number(dateArray[1])]+" "+dateArray[2]
    }

   
    const backendUrl=import.meta.env.VITE_BACKEND_URL
    

    const getDoctorsData=async()=>{
        try {
            const {data}=await axios.get(backendUrl+'/api/doctor/list')
            if(data.success){
                setDoctors(data.doctors)
            } else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const loadUserProfileData=async()=>{
        try {
            const {data}=await axios.get(backendUrl+'/api/user/get-profile', {headers:{token}})
            if(data.success){
                setUserData(data.userData)
            } else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const getAppointments = async () => {
        try {
            const {data}=await axios.get(backendUrl+'/api/user/appointments', {headers:{token}})
            if (data.success) {
                setAppointments(data.appointments.reverse());
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const value={ //can be accessed in any component
        doctors,getDoctorsData,
        token,setToken,backendUrl,
        userData,setUserData,
        loadUserProfileData,
        appointments, getAppointments,
        calculateAge,slotDateFormat, currency
    }

    useEffect(()=>{
        getDoctorsData()
    },[])

    useEffect(()=>{
        if(token){
            loadUserProfileData()
            getAppointments(); //Fetch appointments on login
        } else{
            setUserData(false)
            setAppointments([]); // Clear on logout
        }
    },[token])

    useEffect(() => {
        if (!socket || !userData?._id) return;

        const handleAppointmentCanceled = ({appointmentId, slotDate, slotTime}) => {
            // email sending to that doctor can be done (not too helpful)
            getAppointments(); //Real-time refresh on slot assign
        };
        
        socket.on('appointment-canceled-user', handleAppointmentCanceled);

        socket.on("waitlist-slot-assigned", ({ userId, docId, slotDate, slotTime }) => {
            if (userId === userData._id) {
                toast.success(`A slot has been automatically assigned to you on ${slotDate} at ${slotTime}`);
                getAppointments(); //Real-time refresh on slot assign
            }
        });
    

        return () => {
            socket.off('appointment-canceled', handleAppointmentCanceled);
            socket.off("waitlist-slot-assigned");
        };
    }, [socket, userData]);


    
    // Register the user with backend socket
    // useEffect(() => {
    //     if (socket && userData?._id) {
    //         const role = "user";
    //         socket.emit("register",{userId: userData._id, role});
    //     }
    // }, [socket, userData]);
    useEffect(() => {
        if (socket && userData && token) {
            registerSocket(userData._id, "user");
        }
    }, [socket, userData, token]);


    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider