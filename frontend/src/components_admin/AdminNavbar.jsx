import { useContext } from "react"
import { assets } from "../assets_admin/assets"
import { AdminContext } from "../context/AdminContext"
import {useNavigate} from 'react-router-dom'
import { DoctorContext } from "../context/DoctorContext"
import { useSocketActions } from "../context/SocketContext";

const AdminNavbar = () => {
    const {aToken,setAToken}=useContext(AdminContext)
    const {dToken, setDToken}=useContext(DoctorContext)
    const navigate=useNavigate()

    const { disconnectAndReconnect } = useSocketActions();

    const logout=()=>{
       
        aToken && setAToken('')
        aToken && localStorage.removeItem('aToken')

        dToken && setDToken('')
        dToken && localStorage.removeItem('dToken')

        // 2. Forcefully disconnect and reset socket
        disconnectAndReconnect();      

        navigate('/')
    }
    
  return (
    <div className="flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white">
        <div className="flex items-center gap-2 text-xs">
            <img className="w-30 cursor-pointer" src={assets.admin_logo} alt=""/>
            <p className="border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600">{ aToken ? 'Admin' : 'Doctor' } </p>
        </div>
        <button onClick={logout} className="bg-[#5f6fff] text-white text-sm px-10 py-2 rounded-full">LogOut</button>
    </div>
  )
}

export default AdminNavbar