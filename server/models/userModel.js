import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        length: 20
    },
    lastname: {
        type: String, 
        required: true,
        length: 20
    },
    email: {
        type: String, 
        required: true,
        unique: true
    },
    password: {
        type: String, 
        required: true,
        length: 30
    }
}, {
    timestamps: true
})

const User = mongoose.models.user || mongoose.model('user', userSchema)

export default User