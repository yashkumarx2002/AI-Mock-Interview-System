import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/authContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import SessionCard from '../components/SessionCard'

const MyInterviews = () => {

  const { user } = useAuth()

  const [interviewData, setInterviewData] = useState([])
  const [isFetched, setIsFetched] = useState(false)

  console.log(user)

  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!user?.id) return;

      try {
        const response = await axios.get(`http://localhost:4000/api/interview/sessions/${user.id}`)

        if (response.status === 200) {
          console.log("Interview Data Fetched")
          setInterviewData(response.data || [])
          setIsFetched(true)
        }
      } catch (error) {
        console.error("Error Fetching Interview Data", error)
        
        // 404 error (no sessions found)
        if (error.response && error.response.status === 404) {
          console.log("Interview not found")
          toast.error("No interview session available")
          setInterviewData([]) // Set empty array for no sessions
          setIsFetched(true)
        } else {
          // handling other types of errors
          toast.error("Error retrieving sessions")
        }
      }
    }
    fetchInterviewData()
  }, [user?.id]) 

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center gap-2 max-w-[900px]  mx-auto mt-20 mb-20 px-2">

        <div className='flex flex-col gap-2 justify-center items-center'>
          <h1 className='text-5xl font-semibold'>Interview Records</h1>
          <p className='text-center font-light text-md text-black/70'>Review and manage your previous interview sessions to track progress and gain valuable insights over time.</p>
        </div>

        <SessionCard data={interviewData} setData={setInterviewData} />
      </div>
    </>
  )
}

export default MyInterviews