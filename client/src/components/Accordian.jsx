import { useState } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";

const Accordian = ({ data }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAccordian = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    return (
        <div className="w-full flex flex-col gap-2">
            {Array.isArray(data) &&
                data.map((interview, index) => (
                    <div key={interview.questionId || index} className="w-full">
                        <button
                            className="gap-10 outline-1 outline-gray-400/50 rounded-md py-2 px-5 w-full flex justify-between items-center cursor-pointer"
                            onClick={() => toggleAccordian(index)}
                        >
                            {interview.question}
                            <span>
                                {openIndex === index ? (
                                    <MdOutlineKeyboardArrowUp />
                                ) : (
                                    <MdOutlineKeyboardArrowDown />
                                )}
                            </span>
                        </button>

                        {openIndex === index && (
                            <div
                                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? "max-h-[9999px] p-4" : "max-h-0"
                                    }`}
                            >
                                <p className="text-md text-black/70">
                                    <strong>Answer Rating:</strong> {interview.rating_average}
                                </p>
                                <p className="text-md text-black/70">
                                    <strong>Your answer:</strong> {interview.userAnswer}
                                </p>
                                {
                                    interview.detectedKeypoints.length === 0 ? <p className="text-md text-black/70">
                                        <strong>Detected Keypoints:</strong> All keypoints are not covered </p> : <p className="text-md text-black/70">
                                        <strong>Detected Keypoints:</strong> {
                                            Array.isArray(interview.detectedKeypoints) &&
                                            interview.detectedKeypoints.map((keypoints, i) => (
                                                <button
                                                    key={i}
                                                    value={keypoints}
                                                    className="px-2 py-1 m-1 rounded outline-1 outline-gray-400/50 text-sm"
                                                >
                                                    {keypoints}
                                                </button>
                                            ))
                                        }
                                    </p>
                                }
                                {
                                    interview.missingKeypoints.length === 0 ? <p className="text-md text-black/70">
                                        <strong>Missing Keypoints:</strong> All keypoints are covered </p> : <p className="text-md text-black/70">
                                        <strong>Missing Keypoints:</strong> {
                                            Array.isArray(interview.missingKeypoints) &&
                                            interview.missingKeypoints.map((keypoints, i) => (
                                                <button
                                                    key={i}
                                                    value={keypoints}
                                                    className="px-2 py-1 m-1 rounded outline-1 outline-gray-400/50 text-sm"
                                                >
                                                    {keypoints}
                                                </button>
                                            ))
                                        }
                                    </p>
                                }
                                <p className="text-md text-black/70">
                                    <strong>Feedback:</strong> {interview.feedback}
                                </p>

                            </div>
                        )}
                    </div>
                ))}
        </div>
    );
};

export default Accordian;
