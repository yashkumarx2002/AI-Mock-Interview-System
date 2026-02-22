import Navbar from '../components/Navbar'
import Body from '../components/Body'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
    const navigate = useNavigate();
    
    return (
        <>
            <Navbar text="Register" onclick={() => navigate("/register")} buttonMessage="Don't have an account?" />
            <Body />
        </>
    )
}

export default HomePage