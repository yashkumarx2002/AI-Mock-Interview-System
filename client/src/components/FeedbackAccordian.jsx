import { useState } from "react";
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";

const FeedbackAccordian = ({ data }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAccordian = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const nonVerbalFeedback = [
        {
            title: "Confident",
            value: data?.nonVerbalFeedback?.Confident
        },
        {
            title: "Nervous",
            value: data?.nonVerbalFeedback?.Nervous
        },
        {
            title: "Distracted",
            value: data?.nonVerbalFeedback?.Distracted
        }
    ]

    return (
        <div className="w-full flex flex-col gap-2">
            
            {Array.isArray(nonVerbalFeedback) &&
                nonVerbalFeedback.map((feedback, index) => (
                    <div key={index} className="w-full">
                        <button
                            className="gap-10 outline-1 outline-gray-400/50 rounded-md py-2 px-5 w-full flex justify-between items-center cursor-pointer"
                            onClick={() => toggleAccordian(index)}
                        >
                            {feedback?.title}
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
                                    {feedback?.value}
                                </p>

                            </div>
                        )}
                    </div>
                ))}
        </div>
    );
};

export default FeedbackAccordian;
