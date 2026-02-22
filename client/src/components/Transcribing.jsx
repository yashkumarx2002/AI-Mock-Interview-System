import { useState, useEffect } from "react";

const Transcribing = ({ speechText, isRecording, onTranscriptChange }) => {

    const [text, setText] = useState("");

    // updating the text state when speechText changes and recording is active
    useEffect(() => {
        if( isRecording){
            setText(speechText);
        }
    }, [speechText, isRecording]);

    // function to handle changes in the textarea
    // this will allow users to edit the transcribed text if needed
    // and also notify the parent component of the changes
    // this is useful if you want to allow users to correct any mistakes in the transcription
    // or add additional context before sending the text to the backend
    const handleChange = (e) => {
        const newText = e.target.value
        setText(newText);
        onTranscriptChange?.(newText)
    }

    return (
        <>
            {
                text ? <textarea value={text} onChange={handleChange} className="w-full italic text-black/60  overflow-auto resize-none scroll-auto" rows={3}></textarea> : <p className="w-full italic text-black/60">Your speech will be displayed here as text.</p>
            }

        </>
    );
};

export default Transcribing;
