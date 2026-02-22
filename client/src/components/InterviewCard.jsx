import { useForm } from "react-hook-form"
import { FaArrowRightLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/authContext";
import { toast } from "react-toastify";

const InterviewCard = () => {
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm();

    const { user } = useAuth()

    // function to handle form submission
    // It will fetch questions based on the selected category, level, and number of questions
    // and then navigate to the interview session page with the fetched questions
    // if there is an error while fetching questions, it will log the error to the console
    const handleStartInterview = async (data) => {
        if (data) {
            console.log("Fetching questions from database...")

            await axios.get("http://127.0.0.1:5000/fetchQuestions", {
                params: {
                    technicalDomain: data.category,
                    questionLevel: data.level,
                    noOfQuestions: data.questionQuantity
                }
            }).then(async (response) => {
                const question = response.data;
                const updatedQuestions = question.map((q, index) => ({
                    ...q,
                    sequence_id: index + 1
                }))
                console.log("Fetched questions");

                // creating interview session
                const res = await axios.post("http://localhost:4000/api/interview/create", {
                    userId: user.id,
                    interviewCategory: data.category,
                    interviewLevel: data.level,
                    interviewStartTime: new Date(),
                    shareToken: generateShareToken()
                }, {
                    headers: {
                        type: "application/json"
                    }
                })

                if (res.status === 201) {
                    console.log("Interview Session Created")
                }

                navigate("/interview/session", {
                    state: {
                        interviewPreferences: {
                            category: data.category,
                            level: data.level,
                            questionQuantity: data.questionQuantity
                        },
                        interviewQuestions: updatedQuestions,
                        interviewSessionId: res.data.interview._id
                    }
                });

            }).catch((error) => {
                console.error("Error fetching questions:", error);
            });


        }
    }

    // utility function
    function generateShareToken() {
        const array = new Uint8Array(16); 
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-5 max-w-[600px] h-screen mx-auto mt-[-76px] text-center ">
                <div className="flex flex-col w-full sm:hidden">
                    <h2 className="text-xl font-semibold">Oops! You're on a small screen</h2>
                    <p className="text-gray-600 mt-1">
                        This app is designed for desktop use. For the best experience, please open it on a laptop or PC.
                    </p>

                </div>
                <div className="hidden sm:flex flex-col gap-6 w-full px-15 py-20 rounded-md outline-gray-400/50 outline-1 ">

                    <div className=" flex flex-col gap-2">
                        <h2 className="text-5xl font-semibold">Practice Technical Interview</h2>
                        <p className="text-center font-light text-md text-black/70">Select question category, level and no. of questions to generate interview questions and practice answering them.</p>
                    </div>

                    <form onSubmit={handleSubmit(handleStartInterview)} className="flex flex-col gap-2">

                        <div className="flex flex-col gap-1 text-left">
                            <label>Select Category:</label>
                            <p className="text-sm font-light text-black/70">Choose the programming language or technology</p>
                            <select id="category" {...register("category", { required: "This field is required" })} className="px-2 py-2 mt-1 rounded-md outline-gray-400 font-light text-sm outline-1 w-full ">
                                <option value="" className="font-light">--Select--</option>
                                <option value="javascript" className="font-light">JavaScript</option>
                                <option value="java" className="font-light">Java</option>
                                <option value="python" className="font-light">Python</option>
                                <option value="operating system" className="font-light">Operating System</option>
                                <option value="computer networks" className="font-light">Computer Networks</option>
                                <option value="database management system" className="font-light">Database Management System</option>
                                <option value="software engineering" className="font-light">Software Engineering</option>
                            </select>
                            <p className="text-red-600 text-sm mt-1">{errors.category?.message}</p>
                        </div>

                        <div className="flex flex-col items-start gap-0.5">
                            <label>Select Level:</label>
                            <p className="text-sm font-light text-black/70">Choose the difficulty level of questions</p>
                            <select id="category" {...register("level", { required: "This field is required" })} className="px-2 py-2 mt-1 rounded-md outline-gray-400 font-light text-sm outline-1 w-full ">
                                <option value="" className="font-light">--Select--</option>
                                <option value="beginner" className="font-light">Beginner</option>
                                <option value="intermediate" className="font-light">Intermediate</option>
                                <option value="advanced" className="font-light">Advanced</option>
                            </select>
                            <p className="text-red-600 text-sm mt-1">{errors.level?.message}</p>
                        </div>

                        <div className="flex flex-col items-start gap-0.5">
                            <label>Select Questions:</label>
                            <p className="text-sm font-light text-black/70">Choose no. of questions</p>
                            <select id="category" {...register("questionQuantity", { required: "This field is required" })} className="px-2 py-2 mt-1 rounded-md outline-gray-400 font-light text-sm outline-1 w-full ">
                                <option value="" className="font-light">--Select--</option>
                                <option value="3" className="font-light">3</option>
                                <option value="5" className="font-light">5</option>
                                <option value="10" className="font-light">10</option>
                            </select>
                            <p className="text-red-600 text-sm mt-1">{errors.questionQuantity?.message}</p>
                        </div>

                        <button type="submit" className="w-full bg-black text-white px-10 py-4 rounded-md flex items-center gap-2 justify-center cursor-pointer mt-2">Generate Questions<FaArrowRightLong /></button>
                    </form>
                </div>
            </div>
        </>
    )
}


export default InterviewCard