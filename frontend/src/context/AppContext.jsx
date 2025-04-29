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

        const handleAppointmentCanceledByUser = ({appointmentId, slotDate, slotTime}) => {
            // email sending to that doctor can be done (not too helpful)
            getAppointments(); //Real-time refresh on slot assign
        };
        const handleAppointmentCanceledByDoc = ({appointmentId, slotDate, slotTime}) => {
            toast.info(`Appointment canceled by the Doctor for date: ${slotDate} and time: ${slotTime}`);
            getAppointments(); //Real-time refresh on slot cancelled
        };

        const handleAppointmentCompleted = ({slotDate, slotTime}) => {
            toast.info(`Appointment completed by the Doctor for date: ${slotDate} and time: ${slotTime}`);
            getAppointments(); //Real-time refresh on slot cancelled
        };

        const handleDocAvailabilityChange=({name})=>{
            toast.info(`Availability for Dr. ${name} changed!!`)
            getDoctorsData()  //Real-time refresh on Docs availability
        }
        
        socket.on('appointment-canceled-by-user-1', handleAppointmentCanceledByUser);

        socket.on('appointment-canceled-by-doctor-1', handleAppointmentCanceledByDoc);

        socket.on('appointment-completed', handleAppointmentCompleted);

        socket.on('availability-changed', handleDocAvailabilityChange)

        socket.on("waitlist-slot-assigned", ({ docId, slotDate, slotTime }) => {
            toast.success(`A slot has been automatically assigned to you on ${slotDate} at ${slotTime}`);
            getAppointments(); //Real-time refresh on slot assign
        });
    

        return () => {
            socket.off('appointment-canceled-by-user-1', handleAppointmentCanceledByUser);
            socket.off('appointment-canceled-by-doctor-1', handleAppointmentCanceledByDoc);
            socket.off('appointment-completed', handleAppointmentCompleted);
            socket.off('availability-changed', handleDocAvailabilityChange)
            socket.off("waitlist-slot-assigned");
        };
    }, [socket, userData]);

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