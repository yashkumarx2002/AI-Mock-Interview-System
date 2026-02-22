import { useEffect, useState } from 'react'
import Accordian from '../components/Accordian'
import Navbar from '../components/Navbar'
import ResultCard from '../components/ResultCard'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import FeedbackAccordian from '../components/FeedbackAccordian'
import jsPDF from 'jspdf'


const ResultPage = () => {

    const [interviewData, setInterviewData] = useState(null)
    const [isScoreUpdated, setIsScoreUpdated] = useState(false);

    const { id } = useParams()

    useEffect(() => {
        if (!id) return;

        const fetchInterviewData = async () => {
            try {
                const response = await axios.get(`http://localhost:4000/api/interview/${id}`)
                if (response.status === 200) {
                    console.log("Interview Session data retrieved !!")
                }
                setInterviewData(response.data)

            } catch (error) {
                console.log("Error Retrieving Interview Session Data", error)
                toast.error("Error retrieving interview session data")
            }
        }

        if (id) {
            fetchInterviewData()
        }

    }, [id])

    // utility function
    function formatDurationHuman(startTime, endTime) {
        const durationMs = endTime - startTime;
        const totalSeconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        let result = "";
        if (minutes > 0) {
            result += minutes === 1 ? "1 minute" : `${minutes} minutes`;
        }
        if (seconds > 0) {
            if (minutes > 0) result += " and ";
            result += seconds === 1 ? "1 second" : `${seconds} seconds`;
        }
        if (minutes === 0 && seconds === 0) {
            result = "0 seconds";
        }
        return result;
    }

    const interviewStartTime = interviewData?.interview.interviewStartTime
    const interviewEndTime = interviewData?.interview.interviewEndTime
    const duration = formatDurationHuman(new Date(interviewStartTime), new Date(interviewEndTime))

    // utility function
    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const computeOverallScore = (interviewData) => {
        const interviewAvgRating = interviewData?.interview_data.reduce((sum, i) => sum + i.rating_average, 0) / interviewData?.interview_data.length;

        const overallScore = interviewData?.facialAnaylsis.nonVerbalScore + interviewAvgRating.toFixed(2) / 2

        return Number(overallScore.toFixed(1))
    }

    const score = computeOverallScore(interviewData?.interview)

    useEffect(() => {

        if (!score || isScoreUpdated) return; // skip if score is null/undefined

        // update the interview session data
        const updateScore = async () => {
            try {
                const updateInterviewStatus = await axios.patch("http://localhost:4000/api/interview/update", {
                    interviewId: id,
                    overallScore: score
                }, {
                    headers: {
                        type: "application/json"
                    }
                })

                if (updateInterviewStatus.status === 200) {
                    console.log("Updated overallScore")
                    setIsScoreUpdated(true)
                }
            } catch (error) {
                console.error("Error updating overallScore", error)
                toast.error("Error updating overallScore")

            }
        }
        updateScore()
    }, [id, score, isScoreUpdated])


    const handleDownload = (interviewData, score) => {
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;

        let y = 20;

        // function for wrapping + auto page breaks
        const addWrappedText = (text, x, yPos, lineHeight = 6, fontStyle = "normal", fontSize = 11) => {
            doc.setFont("helvetica", fontStyle);
            doc.setFontSize(fontSize);

            const wrapped = doc.splitTextToSize(text, maxLineWidth - (x - margin));
            wrapped.forEach((line) => {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, x, y);
                y += lineHeight;
            });
            return y;
        };

        // title
        y = addWrappedText(
            `${capitalize(interviewData?.interview?.interview_category)} Mock Interview Report`,
            margin,
            y,
            8,
            "bold",
            18
        );

        // interview details
        y += 10;
        y = addWrappedText(`Category: ${capitalize(interviewData?.interview?.interview_category)}`, margin, y);
        y = addWrappedText(`Level: ${capitalize(interviewData?.interview?.interview_level)}`, margin, y);
        y = addWrappedText(
            `Interview Date: ${new Date(interviewData?.interview?.interview_date).toLocaleDateString()}`,
            margin,
            y
        );

        // overall score
        y += 10;
        y = addWrappedText(
            `Overall Score: ${interviewData?.interview?.overallScore || score}`,
            margin,
            y,
            8,
            "bold",
            14
        );

        // interview questions
        y += 10;
        y = addWrappedText("Interview Questions", margin, y, 8, "bold", 14);

        interviewData?.interview?.interview_data.forEach((item, index) => {
            y += 5;
            y = addWrappedText(`${index + 1}. ${item.question}`, margin, y, 6, "bold");

            y = addWrappedText(`Your Answer: ${item.userAnswer}`, margin + 5, y);
            y = addWrappedText(`Rating: ${item.rating_average}`, margin + 5, y);
            y = addWrappedText(`Detected Keypoints: ${item.detectedKeypoints}`, margin + 5, y);
            y = addWrappedText(`Missing Keypoints: ${item.missingKeypoints}`, margin + 5, y);
            y = addWrappedText(`Feedback: ${item.feedback}`, margin + 5, y);

            y += 6; // spacing between questions
        });

        // non verbal feedback
        y += 10;
        y = addWrappedText("Non-Verbal Feedback", margin, y, 8, "bold", 14);

        const nonVerbal = interviewData?.interview?.facialAnaylsis;
        if (nonVerbal?.nonVerbalFeedback) {
            const feedback = nonVerbal.nonVerbalFeedback;

            Object.entries(feedback).forEach(([key, value]) => {
                // print key in bold
                doc.setFont("helvetica", "bold");
                doc.setFontSize(11);
                doc.text(`${key}:`, margin + 5, y);

                // print value wrapped in normal
                doc.setFont("helvetica", "normal");
                y = addWrappedText(`${value}`, margin + 40, y, 6, "normal", 11);

                y += 4; // small spacing
            });

            if (nonVerbal.nonVerbalScore !== undefined) {
                y += 6;
                y = addWrappedText(
                    `Non-Verbal Score: ${nonVerbal.nonVerbalScore}`,
                    margin + 5,
                    y,
                    6,
                    "bold"
                );
            }
        }

        doc.save(`${capitalize(interviewData?.interview?.interview_category)} Mock Interview Report.pdf`);
    };

    return (
        <>
            <Navbar />

            <div className="flex flex-col items-center justify-center gap-5 max-w-[900px]  mx-auto mt-20 mb-20 px-2">
                <div className='flex flex-col gap-2 justify-center items-center'>
                    <h1 className='text-5xl font-semibold'>Interview Performance Report</h1>
                    <p className='text-center font-light text-md text-black/70'>Below is a summary of your performance along with detailed feedback and recommendations.</p>
                </div>

                <ResultCard level={capitalize(interviewData?.interview.interview_level)} category={capitalize(interviewData?.interview.interview_category)} questionQuantity={interviewData?.interview.interview_data.length} duration={duration} score={interviewData?.interview.overallScore || score} handleDownload={() => handleDownload(interviewData, score)} />

                <div className='w-full flex flex-col justify-center items-center gap-5'>
                    <div className='flex flex-col gap-2 justify-center items-center'>
                        <h1 className='text-3xl font-semibold'>Verbal Feedback</h1>
                        <p className='text-center font-light text-md text-black/70'>You can toggle each question to see the detailed feedback of each question</p>
                    </div>
                    <Accordian data={interviewData?.interview.interview_data} />
                </div>

                <div className='w-full flex flex-col justify-center items-center gap-5'>
                    <div className='flex flex-col gap-2 justify-center items-center'>
                        <h1 className='text-3xl font-semibold'>Non-Verbal Feedback</h1>
                        <p className='text-center font-light text-md text-black/70'>You can check your non-verbal feedback throughout the interview </p>
                    </div>
                    <FeedbackAccordian data={interviewData?.interview.facialAnaylsis} />
                </div>

            </div>

        </>
    )
}

export default ResultPage