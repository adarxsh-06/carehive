import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../../context/AppContext";

const DoctorWaitlist = () => {
  const { backendUrl, token } = useContext(AppContext);
  // const [waitlist, setWaitlist] = useState([]);

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // const fetchWaitlist = async () => {
  //   try {
  //     const { data } = await axios.get(`${backendUrl}/api/doctor/waitlist`, {
  //       headers: { token },
  //     });

  //     if (data.success) {
  //       setWaitlist(data.waitlist.reverse());
  //     } else {
  //       toast.error(data.message);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     toast.error(err.message);
  //   }
  // };

  const formatDate = (slotDate) => {
    const [day, month, year] = slotDate.split("_");
    return `${day} ${months[parseInt(month)]} ${year}`;
  };

  useEffect(() => {
    if (token) {
      fetchWaitlist();
    }
  }, [token]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-zinc-700 border-b pb-3 mb-4">Waitlisted Appointments</h2>
      {waitlist.length === 0 ? (
        <p className="text-sm text-gray-500">No users on the waitlist.</p>
      ) : (
        waitlist.map((item, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">User: {item.user?.name || "N/A"}</p>
              <p className="text-sm text-gray-600">Email: {item.user?.email || "N/A"}</p>
              {item.reason && <p className="text-sm text-gray-600">Symptoms: {item.reason}</p>}
              <p className="text-sm text-gray-600">
                Requested Slot: {formatDate(item.slotDate)} | {item.slotTime}
              </p>
              <p className="text-xs text-gray-400">Joined on: {new Date(item.createdAt).toLocaleString()}</p>
            </div>
            {/* Optional Button */}
            {/* <button className="mt-3 sm:mt-0 text-sm px-4 py-2 bg-indigo-100 rounded-md text-indigo-700">Assign Slot</button> */}
          </div>
        ))
      )}
    </div>
  );
};

export default DoctorWaitlist;
