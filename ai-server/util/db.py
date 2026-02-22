from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

client = MongoClient("mongodb://localhost:27017/")

db = client["questions"]

collection = db["python"]

with open("./question_dataset/javascript.json", "r") as file:
    data = json.load(file)

collection.insert_many(data)

print("Success")


