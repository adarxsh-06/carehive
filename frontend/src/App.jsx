// import React from 'react'

// import { Route, Routes } from "react-router-dom";
// import Home from "./pages/Home";
// import Doctors from "./pages/Doctors";
// import Login from "./pages/Login";
// import About from "./pages/About";
// import Contact from "./pages/Contact";
// import MyProfile from "./pages/MyProfile";
// import MyAppointments from "./pages/MyAppointments";
// import Appointment from "./pages/Appointment";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import { ToastContainer } from "react-toastify";
// import AdminLogin from "./pages/AdminLogin";


// const App = () => {
//   return (
  
//       <div className="mx-4 sm:mx-[10%]">
//         <ToastContainer />
//         <Navbar />
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/doctors" element={<Doctors />} />
//           <Route path="/doctors/:speciality" element={<Doctors />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/admin-login" element={<AdminLogin />} />
//           <Route path="/about" element={<About />} />
//           <Route path="/contact" element={<Contact />} />
//           <Route path="/my-profile" element={<MyProfile />} />
//           <Route path="/my-appointments" element={<MyAppointments />} />
//           <Route path="/appointment/:docId" element={<Appointment />} />
//         </Routes>
//         <Footer />
//       </div>
  
//   );
// };

// export default App;

import { Route, Routes } from "react-router-dom";
import { useContext } from "react";
import { ToastContainer } from "react-toastify";

// User Pages
import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import Appointment from "./pages/Appointment";
import Footer from "./components/Footer"
import Navbar from "./components/Navbar";

// Admin/Doctor Pages
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Admin/Dashboard";
import AllAppointments from "./pages/Admin/AllAppointments";
import DoctorsList from "./pages/Admin/DoctorsList";
import AddDoctor from "./pages/Admin/AddDoctor";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorAppointment from "./pages/Doctor/DoctorAppointment";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorWaitlist from "./pages/Doctor/DoctorWaitlist";

// Components
import AdminNavbar from "./components_admin/AdminNavbar";
import Sidebar from "./components_admin/Sidebar";

// Contexts
import { AdminContext } from "./context/AdminContext";
import { DoctorContext } from "./context/DoctorContext";

const App = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);

  const isAdminOrDoctor = aToken || dToken;

  return (
    <div className={isAdminOrDoctor ? "bg-[#F8F9FD]" : "mx-4 sm:mx-[10%]"}>
      <ToastContainer />
      
      {isAdminOrDoctor ? (
        <>
          <AdminNavbar />
          <div className="flex items-start">
            <Sidebar />
            <Routes>
              {/* Admin Routes */}
              <Route path="/" element={<></>} />
              <Route path="/admin-dashboard" element={<Dashboard />} />
              <Route path="/all-appointments" element={<AllAppointments />} />
              <Route path="/add-doctor" element={<AddDoctor />} />
              <Route path="/doctor-list" element={<DoctorsList />} />

              {/* Doctor Routes */}
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor-appointments" element={<DoctorAppointment />} />
              <Route path="/doctor-profile" element={<DoctorProfile />} />
              <Route path="/doctor-waitlist" element={<DoctorWaitlist />} />
            </Routes>
          </div>
        </>
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:speciality" element={<Doctors />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/appointment/:docId" element={<Appointment />} />
          </Routes>
          <Footer />
        </>
      )}
    </div>
  );
};

export default App;

