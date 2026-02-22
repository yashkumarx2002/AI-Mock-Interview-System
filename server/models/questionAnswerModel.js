import mongoose from "mongoose";

const questionAnswerSchema = new mongoose.Schema({
    interview_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'interview',
        required: true,
    },
    questionId: {
        type: Number,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    questionKeypoints: {
        type: [String], // array of strings
        required: true,
    },
    userAnswer: {
        type: String,
        required: true,
    },
    detectedKeypoints: {
        type: [String],
        default: [],
    },
    missingKeypoints: {
        type: [String],
        default: [],
    },
    feedback: {
        type: String,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    rating_average: {
        type: Number,
        min: 0,
        max: 10,
    },
}, { _id: false }); // prevent auto _id for each subdocument

export { questionAnswerSchema };

const QuestionAnswer = mongoose.models.questionAnswer || mongoose.model('questionAnswer', questionAnswerSchema);

export default QuestionAnswer;