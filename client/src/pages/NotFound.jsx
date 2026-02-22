import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { BiError } from "react-icons/bi";
import Navbar from '../components/Navbar'

const NotFound = () => {
    const navigate = useNavigate()
    useEffect(() => {
        setTimeout(() => {
            navigate('/')
        }, 1000)
    })
    return (
        <>
        <Navbar text="Login" buttonMessage="Already have an account?" onclick={() => navigate("/login")} /> {/* use context api to dynamically change */}
        <div className="flex flex-col justify-center items-center gap-2 max-w-[1024px] h-screen mx-auto mt-[-96px]">
            <BiError size={70} />
            <h1 className="text-5xl font-semibold">Page Not Found</h1>
        </div>
        </>
    )
}

export default NotFound