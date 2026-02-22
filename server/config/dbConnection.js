import mongoose from 'mongoose'

const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interview'

export const connectDB = () => {
    mongoose.connect(dbURI)
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err))
}