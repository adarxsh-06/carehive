import { useEffect, useContext } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";

const DoctorWaitlist = () => {
  const { dToken, waitlists, fetchDoctorWaitlist } = useContext(DoctorContext);

  const { slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      fetchDoctorWaitlist();
    }
  }, [dToken]);

  return (
   
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Waitlisted Appointments</p>
      <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 px-6 py-3 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Date</p>
          <p>Contact</p>
        </div>

        {waitlists.reverse().flatMap((wItem, wInd) =>
          waitlists.users.map((uItem, uInd) => (
          <div
            className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
            key={{wInd}-{uInd}}
          >
            <p className="max-sm:hidden">{uInd + 1}</p>
            <div className="flex items-center gap-2">
              <img
                className="w-8 rounded-full"
                src={uItem.userId?.image}
                alt=""
              />{" "}
              <p>{uItem.userId?.name}</p>
            </div>
            <p>
              {slotDateFormat(wItem.slotDate)}
            </p>
            <p>
              {uItem.userId?.phone}
            </p>
          </div>
        )))}
      </div>
    </div>
  );
};

export default DoctorWaitlist;
