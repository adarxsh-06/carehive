import { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDocs from "../components/RelatedDocs";
import { toast } from "react-toastify";
import axios from "axios";
import { useSocket } from "../context/SocketContext";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currency, backendUrl, token, getDoctorsData } =
    useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const navigate = useNavigate();
  const { socket } = useSocket(); // WebSocket context

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  const fetchDocInfo = async () => {
    const docInformation = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInformation);
  };

  const getAvailableSlots = async () => {
    if (!docInfo) return;
    setDocSlots([]);

    // getting current date
    let today = new Date();
    for (let index = 0; index < 7; index++) {
      // getting date with index
      let currDate = new Date(today);
      currDate.setDate(today.getDate() + index);

      // setting end time of the date with index
      let endTime = new Date();
      endTime.setDate(today.getDate() + index);
      endTime.setHours(21, 0, 0, 0);

      // setting hours
      if (today.getDate() === currDate.getDate()) {
        currDate.setHours(
          currDate.getHours() > 10 ? currDate.getHours() + 1 : 10
        );
        currDate.setMinutes(currDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currDate.setHours(10);
        currDate.setMinutes(0);
      }
      let timeSlots = [];
      while (currDate < endTime) {
        let formattedTime = currDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        let day = currDate.getDate();
        let month = currDate.getMonth() + 1;
        let year = currDate.getFullYear();

        const slotDate = day + "_" + month + "_" + year;
        const slotTime = formattedTime;

        // const isSlotAvailable=docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true
        const isSlotAvailable =
          !docInfo?.slots_booked?.[slotDate]?.includes(slotTime);

        if (isSlotAvailable) {
          // add slots to array
          timeSlots.push({
            datetime: new Date(currDate),
            time: formattedTime,
          });
        }

        // increment current time by 30 mins
        currDate.setMinutes(currDate.getMinutes() + 30);
      }
      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      toast.warn("Login to book Appointment");
      return navigate("/login");
    }

    if (!slotTime) {
      toast.warn("Please select a time slot");
      return;
    }

    try {
      const date = docSlots[slotIndex][0]?.datetime;
      if (!date) return toast.error("Invalid date selection");

      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      const slotDate = day + "_" + month + "_" + year;
      const { data } = await axios.post(
        backendUrl + "/api/user/book-appointment",
        { docId, slotDate, slotTime },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getDoctorsData();
        navigate("/my-appointments");

        // Emit event to notify other clients about the booked slot
        socket.emit("slot-booked", { docId, slotDate, slotTime });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!token) {
      toast.warn("Login to join waitlist");
      return navigate("/login");
    }

    try {
      // const date = docSlots[slotIndex][0]?.datetime || new Date(); // fallback to today
      let date=docSlots[slotIndex]?.[0]?.datetime;
      if(!date){
        const today = new Date();
        date = new Date(today.setDate(today.getDate() + slotIndex));
      }
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const slotDate = `${day}_${month}_${year}`;

      const { data } = await axios.post(
        backendUrl + "/api/user/join-waitlist",
        { docId, slotDate },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) {
      getAvailableSlots();
    }
  }, [docInfo]);

  // Listen for real-time slot updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    socket.on("update-slot", ({ docId: updatedDocId, slotDate, slotTime }) => {
      if (updatedDocId !== docId) return; // Ensure only relevant updates are processed

      setDocSlots((prevSlots) =>
        prevSlots.map((daySlots) =>
          daySlots.filter(
            (slot) =>
              !(
                slot.datetime.toLocaleDateString() === slotDate &&
                slot.time === slotTime
              )
          )
        )
      );
    });

    return () => socket.off("update-slot");
  }, [socket, docId]);

  return (
    docInfo && (
      <div>
        {/* doc details */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img
              className="bg-[#5f6FFF] w-full sm:max-w-72 rounded-lg"
              src={docInfo.image}
              alt=""
            />
          </div>

          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
            {/* Doc-info */}
            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="" />
            </p>

            <div className="flex items-center gap-2 text:sm mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button className="py-0.5 px-2 border text-xs rounded-full">
                {docInfo.experience}
              </button>
            </div>

            {/*doctors about  */}
            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                About <img src={assets.info_icon} alt="" />{" "}
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                {docInfo.about}
              </p>
            </div>
            <p className="text-gray-500 font-medium mt-4">
              Appointment fee:{" "}
              <span className="text-gray-600">
                {currency}
                {docInfo.fees}
              </span>{" "}
            </p>
          </div>
        </div>

        {/* booking slots */}

        <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
          <p>Booking Slots</p>
          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
            {docSlots.length &&
              docSlots.map((item, index) =>{
                const date=item.length > 0 ? item[0].datetime : new Date(new Date().setDate(new Date().getDate() + index))
                return(<div
                  onClick={() => setSlotIndex(index)}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${
                    slotIndex === index
                      ? "bg-[#5f6FFF] text-white"
                      : "border border-gray-200"
                  }`}
                  key={index}
                >
                  {/* <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                  <p>{item[0] && item[0].datetime.getDate()}</p> */}
                  <p>{daysOfWeek[date.getDay()]}</p>
                  <p>{date.getDate()}</p>
                </div>
              )})}
          </div>

          <div className="flex items-center gap-3 w-full overflow-x-scroll mt-4">
            {docSlots.length && docSlots[slotIndex]?.length > 0 ? (
              docSlots[slotIndex].map((item, index) => (
                <p
                  key={index}
                  onClick={() => setSlotTime(item.time)}
                  className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${
                    item.time === slotTime
                      ? "bg-[#5f6FFF] text-white"
                      : "text-gray-400 border border-gray-300"
                  }`}
                >
                  {item.time.toLowerCase()}
                </p>
              ))
            ) : (
              <div className="flex flex-col items-center text-center text-sm text-gray-500">
                {(() => {
                  const selectedDate =
                    docSlots[slotIndex]?.[0]?.datetime || new Date();
                  const now = new Date();
                  const isToday =
                    now.toDateString() === selectedDate.toDateString();

                  const currentTime = now.getHours() * 60 + now.getMinutes();
                  const endTimeMinutes = 20 * 60 + 30; // 8:30 PM = 1230 minutes

                  if (isToday && currentTime >= endTimeMinutes) {
                    return (
                      <p className="mb-2 text-2xl">
                        No slots can be booked for today now.
                      </p>
                    );
                  } else {
                    return (
                      <>
                        <p className="mb-4 text-2xl">
                          All slots are booked for this day.
                        </p>
                        <button
                          onClick={handleJoinWaitlist}
                          className="bg-[#5f6FFF] text-white text-sm font-light px-10 py-3 rounded-full"
                        >
                          Join Waitlist
                        </button>
                      </>
                    );
                  }
                })()}
              </div>
            )}
          </div>


          {docSlots.length && docSlots[slotIndex]?.length ?(
            <button
              onClick={bookAppointment}
              className="bg-[#5f6FFF] text-white text-sm font-light px-14 py-3 rounded-full my-6"
            >
              Book an appointment
            </button>
          ) : ""}
        </div>

        {/* Related Doctors */}
        <RelatedDocs docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
