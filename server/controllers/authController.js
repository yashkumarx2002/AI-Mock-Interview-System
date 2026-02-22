import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import 'dotenv/config'

const salt = bcrypt.genSaltSync(10)

// Register User

export const registerUser = async (req, res) => {

    const { firstname, lastname, email, password } = req.body

    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }


    try {

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        const newUser = new User({
            firstname,
            lastname,
            email,
            password: bcrypt.hashSync(password, salt)
        })

        await newUser.save()

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        })

    } catch (error) {
        console.error(error.message) // debugging 
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Login User

export const loginUser = async (req, res) => {

    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        })
    }

    try {

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Error generating token"
                });
            }

            return res.cookie('token', token, {
                httpOnly: true, 
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            }).json({
                success: true,
                message: "Login successful",
                user: {
                    id: user._id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email
                },
                token: token
            })
        })

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}
