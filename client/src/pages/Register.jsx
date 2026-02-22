import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useForm } from 'react-hook-form'
import axios, { formToJSON } from 'axios'
import { useAuth } from '../context/authContext.jsx'
import { useEffect } from "react"
import { toast } from "react-toastify";

const Register = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    mode: "onChange"
  });

  const password = watch("password");

  useEffect(() => {
      if (token) {
        navigate('/interview');
      }
    }, [token, navigate]);

  const onSubmit = async (data) => {
    const { firstname , lastname , email, password } = data;

    try {
      const response = await axios.post('http://localhost:4000/api/auth/register', {firstname, lastname, email, password}, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 201) {
        toast.success("Account created successfully");
        navigate('/login')
      }
      
    }catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Registration failed");
      } else {
        toast.error("Something went wrong");
      }
    }
  }

  return (
    <>
      <Navbar text="Login" buttonMessage="Already have an account?" onclick={() => navigate("/login")}  />
      <div className="flex flex-col items-center justify-center gap-5 max-w-[1024px] h-screen mx-auto mt-[-96px] text-center">

        <div className="flex flex-col justify-center item-center mt-30"> 
          <h2 className="text-5xl">Create account</h2>
          <p className="text-3xl font-extralight">Start practicing interviews with AI</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-sm flex flex-col gap-2">

          {/* FirstName */}
          <div className="flex flex-col items-start w-full gap-0.5">
            <label htmlFor="Name">Firstname</label>
            <input {...register("firstname", {

              required: "Firstname is required",
              maxLength: {
                value: 20,
                message: "Firstname should be less than 20"
              },
              minLength: {
                value: 3,
                message: "Firstname should be greater than 3"
              }

            })
            }
              placeholder="Enter your firstname"
              className="px-4 py-2 rounded-md outline-gray-400 outline-1 w-full font-light text-sm" />
            <p className="text-red-600 text-sm mt-1">{errors.firstname?.message}</p> {/* need optimization */}
          </div>

          {/* LastName */}
          <div className="flex flex-col items-start w-full gap-0.5">
            <label htmlFor="Name">Lastname</label>
            <input {...register("lastname", {

              required: "Lastname is required",
              maxLength: {
                value: 20,
                message: "Lastname should be less than 20"
              },
              minLength: {
                value: 3,
                message: "Lastname should be greater than 3"
              }

            })
            }
              placeholder="Enter your lastname"
              className="px-4 py-2 rounded-md outline-gray-400 outline-1 w-full font-light text-sm" />
            <p className="text-red-600 text-sm mt-1">{errors.lastname?.message}</p>
          </div>

          {/* Email */}
          <div className="flex flex-col items-start w-full gap-0.5">
            <label htmlFor="Email">Email</label>
            <input {...register("email", {

              required: " Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address"
              }

            })
            }
              placeholder="Enter your email"
              className="px-4 py-2 rounded-md outline-gray-400 outline-1 w-full font-light text-sm" />
            <p className="text-red-600 text-sm mt-1">{errors.email?.message}</p>
          </div>


          {/* Password */}
          <div className="flex flex-col items-start w-full gap-0.5">
            <label htmlFor="Password">Password</label>
            <input type="password" {...register("password", {

              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters"
              },
              maxLength: {
                value: 30,
                message: "Password must be less than 30 characters"
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/,
                message: "Password must include uppercase, lowercase, number, and symbol"
              }

            })
            }
              placeholder="Create your password"
              className="px-4 py-2 rounded-md outline-gray-400 outline-1 w-full font-light text-sm" />
            <p className="text-red-600 text-sm mt-1">{errors.password?.message}</p>
          </div>

          {/* ConfirmPassword */}
          <div className="flex flex-col items-start w-full gap-0.5">
            <label htmlFor="Password" >Confirm password</label>
            <input type="password" {...register("confirmpassword", {

              required: "Please confirm your password",
              validate: (value) => value === password || "Passwords do not match"

            })
            }
              placeholder="Confirm your password"
              className="px-4 py-2 rounded-md outline-gray-400 outline-1 w-full font-light text-sm" />
            <p className="text-red-600 text-sm mt-1">{errors.confirmpassword?.message}</p>
          </div>

          <button type="submit" className="bg-black text-white px-10 py-3 w-full rounded-md mt-2 outline-black cursor-pointer hover:bg-neutral-800">Create account</button>
        </form>
      </div>
    </>
  )
}

export default Register