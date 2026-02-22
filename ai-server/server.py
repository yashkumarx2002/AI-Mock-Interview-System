from flask import Flask, jsonify, request
from pymongo import MongoClient
import keypoint_detection as key_det
import google.generativeai as genai
import json
import random
import os
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

client = MongoClient("mongodb://localhost:27017/questions")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# fetching questions from database
@app.route("/fetchQuestions", methods=["GET"])
def get_questions():
    technicalDomain = request.args.get("technicalDomain")
    questionLevel = request.args.get("questionLevel")
    noOfQuestions = int(request.args.get("noOfQuestions"))
    
    db = client["questions"]
    
    if technicalDomain in db.list_collection_names():
        
        collection = db[technicalDomain]
        
        if(questionLevel == "beginner"):
            for q in collection.find():
                try:
                    random_questions = random.sample(q[questionLevel], noOfQuestions)
                    return jsonify(random_questions)         
                except KeyError as e:
                    pass
        elif(questionLevel == "intermediate"):
            for q in collection.find():
                try:
                    random_questions = random.sample(q[questionLevel], noOfQuestions)
                    return jsonify(random_questions)               
                except KeyError as e:
                    pass
        elif(questionLevel == "advanced"):
            for q in collection.find():
                try:
                    random_questions = random.sample(q[questionLevel], noOfQuestions)
                    return jsonify(random_questions)          
                except KeyError as e:
                    pass
        else: 
            return jsonify({"error": "There is no such question level!!"}), 400
    else:
        return jsonify({"error": "There is no such question category"}), 400 
    
# getting feedback on verbal data
@app.route("/getFeedback", methods=["POST"])
def getFeedback():
    data = request.get_json()
    # detected keypoints
    prompt_data = key_det.detect_keypoints(data)

    # send data to GEMINI API
    prompt = f"""

    As an AI assistant, anaylze the userData and give feedback to the user

    {prompt_data}

    The output should be in json format like this

    previous data like
    "question_id": <integer>, // question id from the question_db
    "question_level": <string>, // level of the question
    "question": <string>, // question that is asked to the candidate. remove backticks
    "keypoints": [arrayofstrings], // Keypoints that must be there to analyze the accuracy of the answer. keypoints should be single worded also doesn't contain any symbols, space, punctuation
    "user_answer": <string>, // user answer to the question
    "detected_keypoints": [arrayofstrings], // The array should contain only the keypoints that are detected in the user answer. If the user answer have similar keyword or context then remove that keyword from this array.
    "missing_keypoints": [arrayofstrings], // The array should contain only the keypoints that are not detected in the user answer. If the user answer have similar keyword or context then remove that keyword from this array.
    "feedback" // If the user don't provide any response then tell him to answer again. If the user answered the questions,  give a detailed feedback(use correct_answer for context) note: feedback should be plain text no formatting. Ignore any gramatical mistakes, also in the answer if it is required to answer some symbol like syntax the user will answer equivalent keyword for example / slash so ignore this edge case. Also after giving feedback give reply like keep practicing. 
    
    "rating": // rating should be based on length of the answer and the points that are missing (out of 10) like
        length: int,
        keypoints: int
        
    "rating_average": length + keypoints / 2
    """

    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content(prompt)
    cleaned_response = (response.text).replace("```json","").replace("```","").strip()
    print("Response from Gemini API:", cleaned_response)
    return cleaned_response

# getting feedback on non-verbal data
@app.route("/getFacialFeedback", methods=["POST"])
def getFacialFeedback():
    data = request.get_json()
    
    prompt = f"""
        As an AI assistant, anaylze the userData and give feedback to the user
        {data}
        "nonVerbalFeedback": "here give feedback based on the above data in json format. give feedback only for metrics confident, distracted, nervous",
        "nonVerbalScore": "compute the percentage of each metrics to find the average score out of 10"
        
        The response should be in json format remove ``` from beginnning and the end
        
        the format should be like this 

            "nonVerbalFeedack": 
                "Confident": "feedback should be in plain english",
                "Distracted": "feedback should be in plain english",
                "Nervous": "feedback should be in plain english"
            ,
            "nonVerbalScore": "out of 10 as float"
        
    """

    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content(prompt)
    cleaned_response = (response.text).replace("```json","").replace("```","").strip()
    print("Response from Gemini API:", cleaned_response)
    return cleaned_response

if __name__ == "__main__":
    app.run(debug=True)
    