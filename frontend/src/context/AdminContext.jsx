import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from "./SocketContext";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [doctors, setDoctors] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const { socket } = useSocket();
  if(!socket)console.log("socket is null in admin")
   
  

  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : ""
  );
  const backendUrl = import.meta.env.VITE_BACKEND_URL; //syntax=>this is how we import .env variables
  // NOTE=> to initialize .env variables in vite project we must have to use VITE in starting of the name of the variable in .env file
  const adminId = "33943938474"; //manual

  const getAllDoctors = async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/all-doctors",
        {},
        { headers: { aToken } }
      );
      if (data.success) {
        setDoctors(data.doctors);
        console.log(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/change-availability",
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getAllAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/appointments", {
        headers: { aToken },
      });
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

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/cancel-appointment",
        { appointmentId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/dashboard", {
        headers: { aToken },
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

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    appointments,
    setAppointments,
    getAllAppointments,
    cancelAppointment,
    dashData,
    getDashData,
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("slotAssigned", ({ message, appointment }) => {
      toast.success(message);
      getAllAppointments(); // real-time refresh
    });

    return () => {
      socket.off("slotAssigned");
    };
  }, [socket]);

  // Effect to listen for real-time events
  useEffect(() => {
    if (!socket) return;

    const handleAppointmentBooked = ({ userId, docId, slotDate, slotTime }) => {
      toast.success(
        `New appointment booked with Doctor ID: ${docId} on ${slotDate} at ${slotTime} by user ID:${userId}`
      );
      getAllAppointments();
    };

    const handleAppointmentCanceled = ({
      userId,
      docId,
      slotDate,
      slotTime,
    }) => {
      toast.info(
        `Appointment canceled with Doctor ID: ${docId} on ${slotDate} at ${slotTime}`
      );
      getAllAppointments();
    };

    socket.on("appointment-booked", handleAppointmentBooked);
    socket.on("appointment-canceled", handleAppointmentCanceled);

    return () => {
      socket.off("appointment-booked", handleAppointmentBooked);
      socket.off("appointment-canceled", handleAppointmentCanceled);
    };
  }, [socket]);

  useEffect(() => {
    if (socket && adminId && aToken) {
      const role = "admin";
      socket.emit("register", { userId: adminId, role });
    }
  }, [socket, aToken]);

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
