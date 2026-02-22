from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import CountVectorizer

# load sentence transformer model
model = SentenceTransformer('all-mpnet-base-v2', device="cpu")

# calculate user answer overlap on keypoints
def calculate_ngram_overlap(user_answer, key_point):
    if not user_answer.strip():
        return 0  # no overlap

    vectorizer = CountVectorizer(ngram_range=(1, 2)).fit([user_answer, key_point])
    ngrams_user = set(vectorizer.get_feature_names_out())
    ngrams_key = set(vectorizer.get_feature_names_out())
    overlap = len(ngrams_user.intersection(ngrams_key)) / len(ngrams_key)
    return overlap

# calculate confidence score based on similarity score and n-gram overlap
def calculate_confidence_score(similarity_score, ngram_overlap):
    return (similarity_score + ngram_overlap) / 2

# detect matched and missing keypoints in the user answer
def detect_keypoints(data):
    # if user answer is empty
    if not data["user_answer"].strip():
        return {
            "question_id": data["question_id"],
            "question_level": data["question_level"],
            "question": data["question"],
            "keypoints": data["keypoints"],
            "user_answer": data["user_answer"],
            "detected_keypoints": [],
            "missing_keypoints": data["keypoints"] # all keypoints are missing
        }

    # generate embeddings for key points and user answer
    key_point_embeddings = model.encode(data["keypoints"], convert_to_tensor=True)
    user_embedding = model.encode(data["user_answer"], convert_to_tensor=True)
    
    # hybrid detection (keyword + semantic similarity + n-gram overlap)
    similarity_threshold = 0.6  #  adjust threshold for phrasing variations
    detected_key_points = []
    missing_key_points = []

    for i, key_point in enumerate(data["keypoints"]):
        # check for exact keyword match
        if key_point.lower() in data["user_answer"].lower():
            detected_key_points.append(key_point)
        else:
            # check for semantic similarity
            similarity_score = util.cos_sim(user_embedding, key_point_embeddings[i]).item()
            # check for n-gram overlap
            ngram_overlap = calculate_ngram_overlap(data["user_answer"].lower(), key_point.lower())
            # calculate confidence score
            confidence_score = calculate_confidence_score(similarity_score, ngram_overlap)
            if confidence_score >= similarity_threshold:
                detected_key_points.append(key_point)
            else:
                missing_key_points.append(key_point)

    # return the original data with detected and missing keypoints
    result = {
        "question_id": data["question_id"],
        "question_level": data["question_level"],
        "question": data["question"],
        "keypoints": data["keypoints"],
        "user_answer": data["user_answer"],
        "detected_keypoints": detected_key_points,
        "missing_keypoints": missing_key_points
    }
    
    return result