import { useNavigate, Link } from 'react-router-dom';
import Button from './Button'
import { LuBrain } from "react-icons/lu";
import { PiUserCircleFill } from "react-icons/pi";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/authContext.jsx';

const Navbar = (props) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { token, logout } = useAuth();

    const isAuthenticated = Boolean(token)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <>
            <div className=' flex items-center justify-between max-w-[1240px] mx-auto py-5 px-5'>

                {/* Logo */}
                <div className='w-full flex items-center cursor-pointer' onClick={(() => navigate("/"))}>
                    <LuBrain size={30} color="black" className='mx-1' />
                    <div className='text-black font-medium text-lg'>
                        InterviewAI
                    </div>
                </div>


                {/* Button */}
                <div className='flex w-full items-center justify-end gap-4'>

                    {/* If user is not authenticated */}
                    {(!isAuthenticated) &&
                        (
                            <>
                                <p className='hidden sm:flex font-light text-sm text-black/80'>{props.buttonMessage}</p>
                                <Button text={props.text} onclick={props.onclick} />
                            </>
                        )}

                    {/* If user is authenticated */}
                    {isAuthenticated &&
                        <div className='font-light text-sm text-black/80 flex flex-row items-center justify-end gap-4 '>
                            <Link to="/my-interviews" className='hidden sm:flex hover:text-black'>My Interviews</Link>
                            {/* <Link to="/interview-history" className='hidden sm:flex hover:text-black'>Interview History</Link> */}

                            <div className='relative inline-block' ref={dropdownRef}>
                                <button onClick={() => setIsOpen(!isOpen)} className='flex justify-center items-center'>
                                    <PiUserCircleFill size={35} className='cursor-pointer ' />
                                </button>

                                {isOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white outline-gray-400/50 outline-1 rounded drop-shadow-md z-50">
                                        <ul className="flex flex-col p-2 text-sm text-black/80">
                                            <Link to={"/profile-settings"} className="hover:bg-gray-100 px-4 py-2 cursor-pointer">Profile Settings</Link>
                                            <Link to="/my-interviews" className='sm:hidden hover:bg-gray-100 px-4 py-2 cursor-pointer'>My Interviews</Link>
                                            <Link to="/interview-history" className='sm:hidden hover:bg-gray-100 px-4 py-2 cursor-pointer'>Interview History</Link>
                                            <Link onClick={logout} className="hover:bg-gray-100 px-4 py-2 cursor-pointer">Logout</Link>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>}
                </div>

            </div>

            {/* Horizontal Line */}
            <hr className='h-px bg-gray-200 border-0 dark:bg-gray-200' />
        </>
    )
}

export default Navbar