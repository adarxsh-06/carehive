import { useState, useEffect } from "react";
import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket, useSocketActions } from "./SocketContext";


export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") ? localStorage.getItem("dToken") : ""
  );
  const { socket } = useSocket();
  const { registerSocket } = useSocketActions();
  
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);
  const [waitlists, setWaitlists] = useState([]);

  if(!socket)console.log("socket is null in doctor")

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        { headers: { dToken } }
      );
      if (data.success) {
        setAppointments(data.appointments);
        console.log(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        { appointmentId },
        { headers: { dToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointmentId },
        { headers: { dToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/dashboard", {
        headers: { dToken },
      });
      if (data.success) {
        setDashData(data.dashData);
        console.log(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/profile", {
        headers: { dToken },
      });
      if (data.success) {
        setProfileData(data.profileData);
        console.log(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Function to fetch waitlist data
  const fetchDoctorWaitlist = async (doctorId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/doctor/waitlist/${doctorId}`,{
        headers: { dToken },
      });
      setWaitlists(response.data.waitlists);
    } catch (err) {
      console.error("Error fetching waitlist:", err);
      toast.error(err.message);
    }
  };

  const value = {
    dToken,
    setDToken,
    backendUrl,
    appointments,
    setAppointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    setDashData,
    getDashData,
    profileData,
    setProfileData,
    getProfileData,
    waitlists,
    setWaitlists
  };


  useEffect(()=>{
    if(dToken){
        getProfileData();
        getDashData();
        getAppointments(); //Fetch appointments on login
       
    } else{
        setProfileData(false)
        setDashData(false)
        setAppointments([]); // Clear on logout
    }
},[dToken])

  useEffect(() => {
    if (socket && profileData && dToken) {
        registerSocket(profileData._id, "doctor");
    }
  }, [socket, profileData, dToken]);

  
  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    const handleAppointmentBooked = ({ userId, slotDate, slotTime }) => {
      // email can be sent to doctor
      toast.info(`New appointment booked by a User on ${slotDate} at ${slotTime}`);
      getAppointments(); // Refresh appointments
      getDashData();
    };

    const handleAppointmentCanceledByUser = ({ userId, slotDate, slotTime }) => {
      toast.info(`Appointment canceled by a User for date: ${slotDate} and time: ${slotTime}`);
      getAppointments(); // Refresh appointments
      getDashData();
    };

    const handleAppointmentCanceledByDoc = ({ userId, slotDate, slotTime }) => {
      getAppointments(); // Refresh appointments
      getDashData();
    };

    const handleWaitlistUpdated = ({ userId, slotDate }) => {
      toast.info(`Waitlist updated with a user for ${slotDate}`);
      fetchDoctorWaitlist(profileData._id); // Refresh waitlist
    };

    socket.on('appointment-booked', handleAppointmentBooked);
    socket.on('appointment-canceled-by-user-2', handleAppointmentCanceledByUser);
    socket.on('appointment-canceled-by-doctor-2', handleAppointmentCanceledByDoc);
    socket.on('waitlist-updated', handleWaitlistUpdated);

    return () => {
      socket.off('appointment-booked', handleAppointmentBooked);
      socket.off('appointment-canceled-by-user-2', handleAppointmentCanceledByUser);
      socket.off('appointment-canceled-by-doctor-2', handleAppointmentCanceledByDoc);
      socket.off('waitlist-updated', handleWaitlistUpdated);
    };
  }, [socket, profileData]); 

  

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
