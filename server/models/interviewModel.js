import mongoose from 'mongoose';
import questionAnswerSchema from './questionAnswerModel.js'; // Adjust the import path as necessary

const interviewSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    interview_category: {
        type: String,
        required: true
    },
    interview_level: {
        type: String,
        required: true 
    },
    interview_date: {
        type: Date,
        default: Date.now,
    },
    interview_data : [questionAnswerSchema.schema],
    interview_status: {
        type: String,
        enum: ['inProgress','completed', 'cancelled'],
        default: 'inProgress'
    },
    interviewStartTime: {
        type: Date
    },
    interviewEndTime: {
        type: Date
    },
    facialAnaylsis: {
        type: Object
    },
    overallScore: {
        type: Number
    },
    shareToken: {
        type: String,
        unique: true
    }
}, {
    timestamps: true    
})


const Interview = mongoose.models.interview || mongoose.model('interview', interviewSchema);

export default Interview