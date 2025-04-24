import { useState, useEffect } from "react";
import { createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from "./SocketContext";


export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") ? localStorage.getItem("dToken") : ""
  );
  const { socket } = useSocket();
  
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
      const response = await axios.get(`${backendUrl}/api/doctor/waitlist/${doctorId}`);
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

  // Register the user with backend socket
  useEffect(() => {
    if (socket && profileData?._id) {
      const role = "doctor";
      socket.emit("register",{userId: profileData._id, role});
    }
  }, [socket, profileData]);

  // useEffect(() => {
  //   if (!socket) return;

  //   socket.on("slotAssigned", ({ message, appointment }) => {
  //     toast.success(message);
  //     getAppointments(); // Refresh doctor appointment list
  //   });

  //   return () => {
  //     socket.off("slotAssigned");
  //   };
  // }, [socket]);

  
  // Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    const handleAppointmentBooked = ({ userId, slotDate, slotTime }) => {
      // email can be sent to doctor
      toast.success(`New appointment booked by User with ID: ${userId} on ${slotDate} at ${slotTime}`);
      getAppointments(); // Refresh appointments
    };

    const handleAppointmentCanceled = ({ userId, slotDate, slotTime }) => {
      toast.info(`Appointment canceled by User with ID: ${userId} on ${slotDate} at ${slotTime}`);
      getAppointments(); // Refresh appointments
    };

    const handleWaitlistUpdated = ({ userId, slotDate }) => {
      toast.info(`Waitlist updated with User ID: ${userId} for ${slotDate}`);
      fetchDoctorWaitlist(profileData._id); // Refresh waitlist
    };

    socket.on('appointment-booked', handleAppointmentBooked);
    socket.on('appointment-canceled-doctor', handleAppointmentCanceled);
    socket.on('waitlist-updated', handleWaitlistUpdated);

    return () => {
      socket.off('appointment-booked', handleAppointmentBooked);
      socket.off('appointment-canceled-doctor', handleAppointmentCanceled);
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
