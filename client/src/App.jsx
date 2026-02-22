import { Routes, Route } from 'react-router-dom'
import NotFound from './pages/NotFound'
import HomePage from './pages/HomePage'
import Register from './pages/Register'
import Login from './pages/Login'
import Interview from './pages/Interview'
import InterviewSession from './pages/InterviewSession'
import MyInterviews from './pages/MyInterviews'
import InterviewHistory from './pages/InterviewHistory'
import ProfileSettings from './pages/ProfileSettings'
import Profile from './pages/Profile'
import ProtectedRoute from './context/ProtectedRoute.jsx'
import { ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './toast.css'
import ResultPage from './pages/ResultPage.jsx'

const App = () => {

  return (
    <>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/register' element={<Register />} />
        <Route path='/login' element={<Login />} />

        <Route path='/interview' element={
          <ProtectedRoute>
            <Interview />
          </ProtectedRoute>} />

        <Route path='/interview/session' element={
          <ProtectedRoute>
            <InterviewSession />
          </ProtectedRoute>} />

        <Route path='/interview/session/result/:id' element={
          <ProtectedRoute>
            <ResultPage />
          </ProtectedRoute>} />

        <Route path='/my-interviews' element={
          <ProtectedRoute>
            <MyInterviews />
          </ProtectedRoute>} />

        <Route path='/interview-history' element={
          <ProtectedRoute>
            <InterviewHistory />
          </ProtectedRoute>} />


        <Route path='/profile-settings' element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>} />

        <Route path='/user-profile' element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>} />

        <Route path='*' element={<NotFound />} />

      </Routes >
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{ background: "white", color: "black" }}
        iconTheme={{
          primary: "black",
          secondary: "white",
        }}
        transition={Bounce}
      />
    </>
  )
}

export default App