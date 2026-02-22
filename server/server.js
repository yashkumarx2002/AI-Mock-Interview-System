import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/dbConnection.js'
import authRouter from './routes/authRoutes.js'
import { interviewRouter } from './routes/interviewRoutes.js';


// creating express server

const app = express()

const port = process.env.PORT || 4000

app.use(express.json())
app.use(cookieParser())
app.use(cors({Credential: true}))

// connecting to database

connectDB()

// api endpoints

app.get('/', (req, res) => {
    res.send("API is running")
})

app.use('/api/auth', authRouter)

app.use('/api/interview', interviewRouter)

app.listen(port, () => console.log(`Server is running on port ${port}`))

