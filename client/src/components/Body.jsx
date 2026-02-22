import { FaArrowRightLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/authContext.jsx';

const Body = () => {
    const navigate = useNavigate();
    const {token} = useAuth();

    const handleStartInterview = () => {   
        if (token) {
            navigate('/interview');
        } else {
            navigate('/login');
        }
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-3 max-w-[1024px] h-screen mx-auto mt-[-96px] text-center">
                <div className="w-sm sm:w-lg md:w-2xl">
                    <h1 className="text-7xl sm:text-7xl md:text-7xl font-medium">Practice Interviews With AI</h1>
                </div>
                <div className="w-sm sm:w-lg md:w-2xl">
                    <p className="text-black/70 font-light text-lg sm:text-xl">Get detailed feedback and improve your technical interview skills with our AI-powered platform</p>
                </div>
                <button type="button" onClick={handleStartInterview} className="px-15 py-4 my-5 bg-black text-white text-sm rounded-4xl font-normal cursor-pointer flex items-center gap-2 hover:bg-neutral-800">Start Practicing<FaArrowRightLong />
                </button>
            </div>
        </>
    )
}

export default Body


