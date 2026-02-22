import Transcribing from "./Transcribing"
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import { useEffect, useState, useRef } from "react";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { useNavigate, useLocation, replace } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/authContext.jsx";
import FacialAnalysis from "./Facial Anaylsis.jsx";


const InterviewContainer = () => {

    const [questions, setQuestions] = useState([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [transcript, setTranscript] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [hasSpoken, setHasSpoken] = useState(false)
    const recognitionRef = useRef(null)
    const [voiceReady, setVoiceReady] = useState(false)
    const [voice, setVoice] = useState(null)
    const navigate = useNavigate()
    const location = useLocation();
    const interview = location.state;
    const { interviewQuestions, interviewPreferences, interviewSessionId } = interview || {};
    const { category, level } = interviewPreferences || {};
    const [answer, setAnswer] = useState({
        ...interviewQuestions?.[currentQuestionIndex],
        user_answer: "",
    });
    // const [interviewData, setInterviewData] = useState([]); // Store interview data
    const { user } = useAuth()

    const [facialData, setFacialData] = useState(null)

    // function to load voices for speech synthesis
    const loadVoices = () => {
        return new Promise((resolve) => {
            let voices = speechSynthesis.getVoices();
            if (voices.length) {
                resolve(voices);
            } else {
                speechSynthesis.onvoiceschanged = () => {
                    voices = speechSynthesis.getVoices();
                    resolve(voices);
                };
            }
        });
    }

    // function to speak text using the selected voice
    const speak = (text) => {
        if (!voice || !text) return;
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = voice
        utterance.lang = voice.lang
        utterance.rate = 1
        utterance.pitch = 1
        speechSynthesis.cancel()
        speechSynthesis.speak(utterance)
    }

    // load voices on component mount
    useEffect(() => {
        console.log("Loading voices...");
        loadVoices().then((voices) => {
            const selected =
                voices.find((v) => v.lang === 'en-GB' && !v.name.toLowerCase().includes('male')) ||
                voices.find((v) => v.lang === 'en-GB') ||
                voices.find((v) => v.lang.startsWith('en')) ||
                voices[0];
            setVoice(selected);
            setVoiceReady(true);
        });
    }, []);

    // speak welcome message to the user and first question on component mount
    useEffect(() => {
        console.log("Speaking welcome message and first question...");

        // check if voice is ready and questions are available
        if (!voiceReady || !voice || questions.length === 0) return;

        const welcome = `Welcome ${user.firstname}, Let's begin your interview.`;
        const question = `Question ${currentQuestionIndex + 1}: ${questions[currentQuestionIndex]?.question}`;

        setTimeout(speak(`${welcome} ${question}`), 1000);
    }, [voiceReady, voice, questions]);

    // speak the next question when the current question index changes
    useEffect(() => {
        console.log("Speaking next question...");
        if (!voiceReady || !voice || currentQuestionIndex === 0) return;
        const question = `Question ${currentQuestionIndex + 1}: ${questions[currentQuestionIndex]?.question}`;
        setTimeout(speak(question), 1000);
    }, [currentQuestionIndex]);

    // initialize speech recognition and set up event handlers
    useEffect(() => {
        console.log("Initializing speech recognition...");

        // check if interviewQuestions are available
        if (!interviewQuestions || interviewQuestions.length === 0) {
            toast.error("No questions available for this interview session.");
            navigate("/interview");
            return;
        }

        setQuestions(interviewQuestions || []);

        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            toast.error("You browser doesn't support Web Speech API")
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'en-IN'
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                finalTranscript += event.results[i][0].transcript
            }

            setTranscript(finalTranscript)

            // update the answer state with the final transcript
            setAnswer(prev => ({
                ...prev,
                user_answer: finalTranscript
            }))

            if (finalTranscript.trim()) {
                setHasSpoken(true) // mark that the user has started speaking
            }
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error: ", event.error)
        }

        recognitionRef.current = recognition
    }, [])

    // handle recording state changes
    useEffect(() => {
        console.log("Recording state changed: ", isRecording);
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isRecording) {
            setTranscript('');
            setHasSpoken(false) // reset for new recording
            setTimeout(() => recognition.start(), 500);
        } else {
            recognition.stop()
        }
    }, [isRecording])

    // function to handle transcript changes: when the user edit the transcript manually
    const handleTranscriptChange = (newTranscript) => {
        setTranscript(newTranscript);
        setAnswer(prev => ({
            ...prev,
            user_answer: newTranscript
        }));
    }

    // function to handle next question 
    const handleNext = async () => {

        if (!hasSpoken || transcript.trim() === '') {
            toast.error("Please answer this question !!")
            return;
        }

        if (isRecording) {
            toast.error("Please stop recording before going to the next question.");
            return;
        }

        // reset the recording state if the current question is answered
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)

            setTranscript('');
            setHasSpoken(false); // reset for next question
            setIsRecording(false); // reset recording state

        }

        // send the answer to the backend for feedback
        try {
            console.log("Sending answer to backend")
            const response = await axios.post("http://127.0.0.1:5000/getFeedback", {
                ...answer
            })
            console.log("Feedback received");

            // store the answer in interviewData
            console.log("Storing answer in interviewData");

            // saving the question answer in the interview session
            let interviewData = {
                interviewId: interviewSessionId,
                questionId: response.data.question_id,
                question: response.data.question,
                questionKeypoints: response.data.keypoints,
                userAnswer: response.data.user_answer,
                detectedKeypoints: response.data.detected_keypoints,
                missingKeypoints: response.data.missing_keypoints,
                feedback: response.data.feedback,
                rating: response.data.rating,
                rating_average: response.data.rating_average,

            }


            const res = await axios.post("http://localhost:4000/api/interview/add-question-answer", {
                ...interviewData
            }, {
                headers: {
                    type: "application/json"
                }
            })

            if (res.status === 201) {
                console.log("Added question to the current interview session")
            }

        } catch (error) {
            console.error("Error sending answer to backend:", error);
            toast.error("Failed to send answer to backend. Please try again later.");
        }

        // reset the answer state for the next question
        console.log("Resetting answer for next question");
        setAnswer({
            ...interviewQuestions[currentQuestionIndex + 1],
            user_answer: "",
        });

    }

    // function to handle interview submission
    const handleSubmit = async () => {

        // check if the user has spoken for the last question
        if (!hasSpoken || transcript.trim() === '') {
            toast.error("Please answer the last question !!")
            return;
        }

        if (isRecording) {
            toast.error("Please stop recording before submitting the interview.");
            return;
        }

        // send the last answer to the backend for feedback
        try {
            console.log("Sending answer to backend")
            const response = await axios.post("http://127.0.0.1:5000/getFeedback", {
                ...answer
            })
            console.log("Feedback received");

            // // store the answer in interviewData
            console.log("Storing last answer in interviewData");
            // saving the question answer in the interview session

            let interviewData = {
                interviewId: interviewSessionId,
                questionId: response.data.question_id,
                question: response.data.question,
                questionKeypoints: response.data.keypoints,
                userAnswer: response.data.user_answer,
                detectedKeypoints: response.data.detected_keypoints,
                missingKeypoints: response.data.missing_keypoints,
                feedback: response.data.feedback,
                rating: response.data.rating,
                rating_average: response.data.rating_average,

            }

            const res = await axios.post("http://localhost:4000/api/interview/add-question-answer", {
                ...interviewData,
            }, {
                headers: {
                    type: "application/json"
                }
            })

            if (res.status === 201) {
                console.log("Added question to the current interview session")
            }

            toast.success("Interview Submitted")

            // adding nonverbal feedback
            console.log("Computing Non Verbal Metrics");
            const nonVerbalMetrics = computeMetrics(stateCountRef.current, metrics)
            console.log("Getting Feedback on Non Verbal Metrics");
            const nonVerbalResponse = await axios.post("http://127.0.0.1:5000/getFacialFeedback", {nonVerbalMetrics}, {
                headers: "application/json"
            } )

            if(nonVerbalResponse.status === 200){
                console.log("Non Verbal Feedback Data Generated")
                console.log(nonVerbalResponse.data)
            }

            // update the status of interview status
            const updateInterviewStatus = await axios.patch("http://localhost:4000/api/interview/update", {
                interviewId: interviewSessionId,
                interview_status: "completed",
                interviewEndTime: new Date(),
                facialAnaylsis: nonVerbalResponse?.data
            }, {
                headers: {
                    type: "application/json"
                }
            })

            if (updateInterviewStatus.status === 200) {
                console.log("Updated the interview status to completed")
            }

        } catch (error) {
            console.error("Error sending answer to backend:", error);
            toast.error("Failed to send answer to backend. Please try again later.");
        }

        navigate(`/interview/session/result/${interviewSessionId}`, { replace: true })
    }


    const handleFacialAnaylsis = (data) => {
        setFacialData(data)
    }

    // analyzing non-verbal state data
    const stateCountRef = useRef({
        eye: { "Looking Left": 0, "Looking Right": 0, "Looking Up": 0, "Looking Down": 0 },
        head: { "Looking Left": 0, "Looking Right": 0, "Looking Up": 0, "Looking Down": 0, "Center": 0 },
        mouth: { "Speaking": 0, "Silent": 0 }
    });

    const allowedStates = {
        eye: ["Looking Left", "Looking Right", "Looking Up", "Looking Down"],
        head: ["Looking Left", "Looking Right", "Looking Up", "Looking Down", "Center"],
        mouth: ["Speaking", "Silent"]
    };

    const lastFacialStateRef = useRef({});

    useEffect(() => {
        if (!facialData) return

        const lastState = lastFacialStateRef.current

        for (const category of ["eye", "head", "mouth"]) {
            const newState = facialData[category]
            const prevState = lastState?.[category]

            if (newState && newState !== prevState && allowedStates[category]?.includes(newState)) {
                stateCountRef.current[category][newState] += 1;
            }
        }

        lastFacialStateRef.current = facialData
    }, [facialData])

    // Define categories with rules
    const metrics = {
        Distracted: {
            eye: ["Looking Left", "Looking Right"],
            head: ["Looking Left", "Looking Right"]
        },
        Confident: {
            eye: ["Looking Up"],
            head: ["Center"],
            mouth: ["Speaking"]
        },
        Nervous: {
            eye: ["Looking Down"],
            head: ["Looking Down"],
            mouth: ["Silent"]
        }
    };

    // Function to compute percentages
    function computeMetrics(stateCounts, metrics) {
        const results = {};
        let total = 0;

        // Calculate total counts across all categories
        Object.values(stateCounts).forEach(category => {
            total += Object.values(category).reduce((a, b) => a + b, 0);
        });

        // Calculate contribution for each metric
        for (const [label, rules] of Object.entries(metrics)) {
            let score = 0;
            const usedMetrics = [];

            for (const [category, states] of Object.entries(rules)) {
                states.forEach(state => {
                    if (stateCounts[category]?.[state] !== undefined) {
                        score += stateCounts[category][state];
                        usedMetrics.push(`${category}: ${state} (${stateCounts[category][state]})`);
                    }
                });
            }

            results[label] = {
                percentage: ((score / total) * 100).toFixed(2) + "%",
                metricsUsed: usedMetrics
            };
        }

        return results;
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-5 max-w-[1024px] h-screen mx-auto mt-[-76px] px-2">

                <div className="flex flex-col gap-10 outline-1 outline-gray-400/50 rounded-md py-10 px-10 w-full">
                    {/* Heading */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-semibold">{category?.charAt(0).toUpperCase() + category?.slice(1)} Mock Interview</h1>
                        <p className="text-right font-light text-sm text-black/60">Question {currentQuestionIndex + 1} of {questions.length} </p>
                    </div>

                    {/* Body */}
                    <div className="flex justify-around gap-8">
                        {/* Left Card */}
                        <div className="flex flex-col justify-around items-start gap-3 w-full">
                            <div className="flex flex-col gap-1 w-full">
                                <p className="font-medium">Question {currentQuestionIndex + 1}:</p>
                                <p className="">{questions[currentQuestionIndex]?.question}<HiMiniSpeakerWave onClick={() => speak(questions[currentQuestionIndex]?.question)} className="cursor-pointer" /></p>
                            </div>
                            <div className="flex flex-col gap-1 w-full">
                                <p className="font-medium">Transcribing:</p>
                                <Transcribing
                                    key={currentQuestionIndex}
                                    isRecording={isRecording}
                                    speechText=
                                    {isRecording
                                        ? hasSpoken
                                            ? transcript || "Listening..."
                                            : "Listening..."
                                        : (transcript || "")}
                                    onTranscriptChange={handleTranscriptChange}
                                />

                            </div>
                            <div className="flex flex-col justify-between gap-2 bg-neutral-100/80 rounded-md px-3 py-3 outline-1 outline-gray-400/50">
                                <p className="font-medium flex items-center gap-2 mx-2 text-black/80"><MdOutlineTipsAndUpdates size={30} />
                                    Quick Tips</p>
                                <ul className="list-disc pl-8 text-sm text-black/80">
                                    <li>Take your time to think through your answer.</li>
                                    <li>Speak clearly and at a steady pace.</li>
                                    <li>Look at the camera when answering.</li>
                                    <li>If you're not happy with your answer, you can try again.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Card */}
                        <div className=" flex flex-col justify-between gap-4 w-full ">
                            <div className="outline-1 rounded-md outline-gray-400/50 bg-neutral-100/80 text-black/80 shadow-md">
                                <FacialAnalysis onUpdate={handleFacialAnaylsis} />
                            </div>

                            <div className="flex flex-col gap-2 justify-center items-center h-30 outline-1 rounded-md outline-gray-400/50 bg-neutral-100/80 text-black/80">
                                <p className="text-black/70 text-md"><strong>Non-verbal Feedback</strong></p>

                                <div>
                                    <p className="text-black/70 text-sm"><strong>Eye Direction:</strong> {facialData?.eye}</p>
                                    <p className="text-black/70 text-sm"><strong>Head Position:</strong> {facialData?.head}</p>
                                    <p className="text-black/70 text-sm"><strong>Mouth State:</strong> {facialData?.mouth}</p>
                                </div>
                            </div>


                            <div className="flex justify-center items-center gap-2">
                                {currentQuestionIndex < questions.length - 1 ? (
                                    <>
                                        <button className="bg-black text-white px-8 py-2 rounded-md cursor-pointer" onClick={() => setIsRecording(prev => !prev)}>{isRecording ? "Stop" : "Record"}</button>
                                        <button className="bg-black text-white px-8 py-2 rounded-md cursor-pointer" onClick={handleNext}>Next</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="bg-black text-white px-8 py-2 rounded-md cursor-pointer" onClick={() => setIsRecording(prev => !prev)}>{isRecording ? "Stop" : "Record"}</button>
                                        <button className="bg-black text-white px-8 py-2 rounded-md cursor-pointer" onClick={handleSubmit}>Submit</button>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    )
}

export default InterviewContainer