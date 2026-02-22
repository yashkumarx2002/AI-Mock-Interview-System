import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

prompt = """

give me 75 python questions in json format.

promptData = {
    "question_id": <integer>, // question id from the question_db
    "question_level": <string>, // level of the question
    "question": <string>, // question that is asked to the candidate. remove backticks, single quotes, double quotes from the question
    "keypoints": [arrayofstrings], // Keypoints that must be there to analyze the accuracy of the answer. keypoints should be single worded also doesn't contain any symbols, space, punctuation
    "possible_answers": [arrayofstrings], // different ways to answer the question (phrasing of words depend on the user)
}

create 3 categories: beginner, intermediate, advanced
the response should be in this format
[
{"beginner": [25 question in json format]},
{"intermediate": [25 question in json format]},
{"advanced": [25 question in json format]}

]

"""

model = genai.GenerativeModel('gemini-2.0-flash')
response = model.generate_content(prompt)

print(response.text)