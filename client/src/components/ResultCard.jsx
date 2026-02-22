import { BiDownload } from "react-icons/bi"

const ResultCard = ({questionQuantity, duration, category, level, score, handleDownload }) => {

    return (
        <>
            <div className="flex flex-col justify-center items-center gap-10 outline-1 outline-gray-400/50 rounded-md py-10 px-10 w-full">
                <div className="flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-light">Overall Score</h1>
                    <p className="text-4xl font-medium">{score?.toFixed(1)}</p> 
                    <p className="font-light">out of 10</p>
                </div>

                <div className="flex gap-15 text-lg">
                    <div className="flex flex-col justify-center items-center">
                        <p className="font-medium">{questionQuantity || "N/A"}</p>
                        <p className="font-light">Questions</p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <p className="font-medium">{duration || "N/A"}</p>
                        <p className="font-light">Duration</p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <p className="font-medium">{category}</p>
                        <p className="font-light">Category</p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <p className="font-medium">{level}</p>
                        <p className="font-light">Level</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className=" bg-black text-white px-6 py-2 rounded-md flex items-center gap-2 justify-center cursor-pointer text-md" onClick={handleDownload}>Download Report<BiDownload /></button>
                    {/* <button  className=" bg-black text-white px-6 py-2 rounded-md flex items-center gap-2 justify-center cursor-pointer text-md">Share<BiShareAlt/></button> */}
                </div>
            </div>
        </>
    )
}

export default ResultCard