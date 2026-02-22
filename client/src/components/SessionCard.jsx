import axios from "axios";
import { CiCalendar, CiClock1 } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SessionCard = ({ data, setData }) => {

    const navigate = useNavigate()

    // delete specific interview
    const handleDelete = async (id) => {

        try {
            const response = await axios.delete(`http://localhost:4000/api/interview/${id}`)

            if (response.status === 200) {
                toast.success("Deleted interview session")
                setData((prev) => ({
                    ...prev,
                    interviews: prev.interviews.filter((item) => item._id !== id),
                }));
            }
        } catch (error) {
            console.log("Error Deleting Interview Session", error)
            toast.error("Error deleting interview session")
        }
    }
    // utility function
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    // utility function
    function computeDuration(startTime, endTime) {
        const durationMs = endTime - startTime;
        const totalSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0 && seconds === 0) {
            return minutes === 1 ? "1 min" : `${minutes} mins`;
        }
        if (minutes > 0 && seconds > 0) {
            return minutes === 1
                ? `1 min ${seconds === 1 ? "1 sec" : `${seconds} secs`}`
                : `${minutes} mins ${seconds === 1 ? "1 sec" : `${seconds} secs`}`;
        }
        if (minutes === 0 && seconds > 0) {
            return seconds === 1 ? "1 sec" : `${seconds} secs`;
        }
        return "0 sec";
    }

    return (
        <>
            <div className="flex flex-col justify-center items-center gap-5  py-10 px-10 w-full">
                {Array.isArray(data?.interviews) && data?.interviews.length > 0 ? (
                    data.interviews.map((interview, index) => {
                        return (
                            <div key={interview._id || index} className="flex justify-between items-center outline-1 outline-gray-400/50 rounded-md py-10 px-10 w-full">
                                <div className="flex flex-col gap-1">
                                    <strong className="text-2xl ">{capitalize(interview.interview_category)} Mock Interview</strong>
                                    <div className="flex gap-4 justify-start items-center text-black/80">
                                        <p className="font-light text-sm flex justify-start items-center gap-1"><CiCalendar />{new Date(interview.createdAt).toLocaleDateString()}</p>
                                        <p className="font-light text-sm">{interview.interview_data.length} questions</p>
                                        <p className="font-light text-sm flex justify-start items-center gap-1"><CiClock1 />{computeDuration(new Date(interview.interviewStartTime), new Date(interview.interviewEndTime))}</p>
                                    </div>

                                    <div className="flex gap-2 justify-start items-center">
                                        <button className=" bg-black text-white px-3 py-2 rounded-md text-center cursor-pointer mt-2" onClick={() => navigate(`/interview/session/result/${interview._id}`)}>View Details</button>
                                        <button className=" bg-black text-white px-3 py-2 rounded-md text-center cursor-pointer mt-2" onClick={() => handleDelete(interview._id)}>Delete Interview</button>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center">
                                    <p className="text-4xl font-medium">{interview.overallScore?.toFixed(1)}</p>
                                    <p className="font-light">out of 10</p>
                                </div>
                            </div>
                        )
                    })
                ) : <p className="text-black/70 font-light text-center py-6">
                    No interview sessions available.
                </p>}
            </div>
        </>
    )
}

export default SessionCard