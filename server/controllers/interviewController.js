import User from "../models/userModel.js";
import Interview from "../models/interviewModel.js";
import QuestionAnswer from "../models/questionAnswerModel.js";

// function to create interview session based on user preference
export const createInterview = async (req, res) => {

    const { userId, interviewCategory, interviewLevel, interviewStartTime, shareToken } = req.body;

    try {
        const newInterview = new Interview({
            user_id: userId,
            interview_category: interviewCategory,
            interview_level: interviewLevel,
            interview_data: [],
            interview_status: 'inProgress',
            interviewStartTime: interviewStartTime,
            interviewEndTime: interviewStartTime,
            shareToken: shareToken
        })

        await newInterview.save();

        return res.status(201).json({
            success: true,
            message: "Interview created successfully",
            interview: newInterview
        })
    } catch (error) {
        console.error(error.message); // debugging
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

// function to update the interview session like status
export const updateInterview = async (req, res) => {
    const { interviewId, interview_status, interviewEndTime, facialAnaylsis, overallScore } = req.body

    if (!interviewId) {
        return res.status(400).json({
            success: false,
            message: "interviewId is required to update the interview session"
        })
    }

    try {
        const interview = await Interview.findByIdAndUpdate(interviewId, { interview_status, interviewEndTime, facialAnaylsis, overallScore }, { new: true, runValidators: true })

        if (!interview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json({
            status: true,
            message: "Interview updated successfully",
            interview
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Error updating interview"
        });
    }
}

// function to get interview session by interview Id
export const getInterviewById = async (req, res) => {
    const { interviewId } = req.params

    try {
        const interview = await Interview.findById(interviewId)

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview session not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Interview session found",
            interview
        })
    } catch (error) {
        console.error("Error fetching interview", error)
        return res.status(400).json({
            success: false,
            message: "Error fetching interview"
        })
    }
}

// function to get interview session by shareToken
export const getInterviewByShareToken = async (req, res) => {
    const { shareToken } = req.params

    try {
        const interview = await Interview.findById(shareToken)

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview session not found"
            })
        }

        res.status(200).json({
            success: true,
            message: "Interview session found",
            interview
        })
    } catch (error) {
        console.error("Error fetching interview", error)
        return res.status(400).json({
            success: false,
            message: "Error fetching interview"
        })
    }

}

// function to delete interview session by interview Id
export const deleteInterviewById = async (req, res) => {
    const { interviewId } = req.params

    try {
        const interview = await Interview.findByIdAndDelete(interviewId)

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview session not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Successfully deleted interview session"
        })
    } catch (error) {
        console.error("Error Delete interview session", error)
        return res.status(400).json({
            success: false,
            message: "Error fetching interview session"
        })
    }
}

// function to get all interview session by userId
export const getAllInterviewsById = async (req, res) => {
    const { userId } = req.params

    try {

        const interviews = await (await Interview.find({ user_id: userId, interview_status: "completed" }).sort({ createdAt: -1 }))

        if (!interviews || interviews.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No interview session found for this user"
            })
        }

        res.status(200).json({
            success: true,
            message: "Interview session found for this user",
            interviews
        })
    } catch (error) {
        console.error("Error fetching interview", error)
        return res.status(400).json({
            success: false,
            message: "Error fetching interview"
        })
    }
}

// function to add question-answers to the ongoing interview session
export const addQuestionAnswer = async (req, res) => {
    const { interviewId, questionId, question, questionKeypoints, userAnswer, detectedKeypoints, missingKeypoints, feedback, rating, rating_average } = req.body;

    if (!interviewId || !questionId || !question || !questionKeypoints || !userAnswer) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        const newQuestionAnswer = new QuestionAnswer({
            interview_id: interviewId,
            questionId,
            question,
            questionKeypoints,
            userAnswer,
            detectedKeypoints: detectedKeypoints || [],
            missingKeypoints: missingKeypoints || [],
            feedback: feedback || '',
            rating: rating || null,
            rating_average: rating_average || null
        });

        // check for duplicates

        interview.interview_data.push(newQuestionAnswer);
        await interview.save();

        // await newQuestionAnswer.save(); getting error of having _id 

        return res.status(201).json({
            success: true,
            message: "Question answer added successfully",
            questionAnswer: newQuestionAnswer
        });
    } catch (error) {
        console.error(error.message); // debugging
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}

