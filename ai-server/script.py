import base64
from io import BytesIO
import time
import uuid
from collections import deque
import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from PIL import Image
import json

# create fastapi web server
app = FastAPI()

# initialize mediapipe face detection: this will detect face landmarks (468 points on the face)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1, # only track one face
    refine_landmarks=True, # get more precise landmarks for iris and lips 
    min_detection_confidence=0.5, # minimum confidence to detect face
    min_tracking_confidence=0.5, # minimum confidence to track face
)


# mediapipe landmarks indices for specific facial features
LEFT_EYE_CORNERS = (362, 263) # outer and inner corners of left eye
RIGHT_EYE_CORNERS = (33, 133) # outer and inner  corners of right eye
LEFT_IRIS = 473 # center of left iris
RIGHT_IRIS = 468 # center of right iris
LEFT_UPPER = 159 # top of left eyelid
LEFT_LOWER = 145 # bottom of left eyelid
RIGHT_UPPER = 386 # top of right eyelid
RIGHT_LOWER = 374 # bottom of right eyelid

HEAD_LANDMARKS = [33, 263, 1, 61, 291, 199] # landmarks for headpose estimation

UPPER_LIP_IDS = [185,40,39,37,0,267,269,270,409,415,310,311,312,13,82,81,42,183,78] # landmarks for upper lip regions
LOWER_LIP_IDS = [61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,95] # landmarks for lower lip regions

clients = {} # dictionary to store each client's tracking data
CALIBRATION_SECONDS = 3.0 # calibration time 
HISTORY_LEN = 8  # number of recent measurements to average (for smoothing)

# function to create a new client state
def new_client_state():
    return {
        "id": str(uuid.uuid4()),                           # unique client ID
        "horiz_hist": deque(maxlen=HISTORY_LEN),          # recent horizontal eye positions
        "vert_hist": deque(maxlen=HISTORY_LEN),           # recent vertical eye positions  
        "mouth_hist": deque(maxlen=HISTORY_LEN),          # recent mouth opening percentages
        "calibrating": True,                              # whether still calibrating
        "calib_start": time.time(),                       # when calibration started
        "calib_samples": [],                              # eye positions during calibration
        "center_h": None,                                 # calibrated center horizontal position
        "center_v": None,                                 # calibrated center vertical position
    }

# utility function
def decode_base64_to_bgr(data_url: str):
    if "," in data_url:
        data_url = data_url.split(",")[1]
    img_bytes = base64.b64decode(data_url) # decode base64 to image bytes
    img = Image.open(BytesIO(img_bytes)).convert("RGB") # convert to PIL image, then numpy array, then BGR format for opencv 
    arr = np.array(img)
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
    return bgr

# function to calculate where the iris is positioned within each eye: return horizontal_ratio (0=far left, 1=far right) and vertical_ratio (0=top, 1=b0ttom)
def compute_eye_ratios(face_landmarks, w, h):
    
    # get pixel coordinates of eye corners
    lx_outer = np.array([face_landmarks.landmark[LEFT_EYE_CORNERS[0]].x * w,
                         face_landmarks.landmark[LEFT_EYE_CORNERS[0]].y * h])
    lx_inner = np.array([face_landmarks.landmark[LEFT_EYE_CORNERS[1]].x * w,
                         face_landmarks.landmark[LEFT_EYE_CORNERS[1]].y * h])
    rx_outer = np.array([face_landmarks.landmark[RIGHT_EYE_CORNERS[0]].x * w,
                         face_landmarks.landmark[RIGHT_EYE_CORNERS[0]].y * h])
    rx_inner = np.array([face_landmarks.landmark[RIGHT_EYE_CORNERS[1]].x * w,
                         face_landmarks.landmark[RIGHT_EYE_CORNERS[1]].y * h])

    # get pixel coordinates of iris centers
    left_iris = np.array([face_landmarks.landmark[LEFT_IRIS].x * w,
                          face_landmarks.landmark[LEFT_IRIS].y * h])
    right_iris = np.array([face_landmarks.landmark[RIGHT_IRIS].x * w,
                           face_landmarks.landmark[RIGHT_IRIS].y * h])

    # calculate eye widths (distance between corners)
    left_eye_width = np.linalg.norm(lx_inner - lx_outer) + 1e-6 # +1e-6 prevents division by zero
    right_eye_width = np.linalg.norm(rx_inner - rx_outer) + 1e-6

    # calculate how far across the eye the iris is (0.0 = outer corner, 1.0 = inner corner)
    left_ratio = np.linalg.norm(left_iris - lx_outer) / left_eye_width
    right_ratio = np.linalg.norm(right_iris - rx_outer) / right_eye_width
    horizontal_ratio = float((left_ratio + right_ratio) / 2.0)

    # calculate vertical position within left eye (using eyelid landmarks)
    left_upper_y = face_landmarks.landmark[LEFT_UPPER].y * h
    left_lower_y = face_landmarks.landmark[LEFT_LOWER].y * h
    vertical_ratio = float((left_iris[1] - left_upper_y) / (left_lower_y - left_upper_y + 1e-6))

    return horizontal_ratio, vertical_ratio

# function to calculate head position using 3d geometry
def compute_head_direction(face_landmarks, img_w, img_h):
    face_3d = [] # 3d coordinates for face landmarks
    face_2d = [] # 2d coordinates for face landmarks
    nose_2d = None
    nose_3d = None
    
    # extract 3d and 2d coordinates for key face landmarks
    for idx in HEAD_LANDMARKS:
        lm = face_landmarks.landmark[idx]
        x, y = int(lm.x * img_w), int(lm.y * img_h)
        face_2d.append([x, y])
        face_3d.append([x, y, lm.z])
        
        # store node landmark separately (landmark #1 is for nose tip)
        if idx == 1:
            nose_2d = (lm.x * img_w, lm.y * img_h)
            nose_3d = (lm.x * img_w, lm.y * img_h, lm.z * 3000)

    # convert to numpy arrays for math operations
    face_2d = np.array(face_2d, dtype=np.float64)
    face_3d = np.array(face_3d, dtype=np.float64)
    
    # create camera matrix
    focal_length = img_w
    cam_matrix = np.array([[focal_length, 0, img_h / 2],
                           [0, focal_length, img_w / 2],
                           [0, 0, 1]])
    dist_matrix = np.zeros((4, 1), dtype=np.float64) # assume no lens distortion

    # solve for head pose using perspective-n-point algorithm
    success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_matrix, flags=cv2.SOLVEPNP_ITERATIVE)
    
    # convert rotation vector to rotation matrix, then to euler angles
    rmat, _ = cv2.Rodrigues(rot_vec)
    angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

    # extract pitch (x) and yaw (y) angles and convert to degrees
    x_ang = angles[0] * 360 # pitch (up/down)
    y_ang = angles[1] * 360 # yaw (left/right)

    # classify head direction based on angle thresholds
    if y_ang < -10:
        return "Looking Left"
    elif y_ang > 10:
        return "Looking Right"
    elif x_ang < -10:
        return "Looking Down"
    elif x_ang > 10:
        return "Looking Up"
    else:
        return "Center"

# function to determine eye gaze direction by comparing current position to calibrated center
# uses thresholds to determine if eyes have moved significantly from center
def classify_eye_direction(sm_h, sm_v, center_h, center_v):
    h_thresh = 0.08 # horizontal threshold for left/right detection
    v_thresh = 0.06 # vertical threshold for up/down detection

    # calculate difference from calibrated center position
    dh = sm_h - center_h
    dv = sm_v - center_v

    # classify based on which threshold is exceeded
    if dh < -h_thresh:
        return "Looking Left"
    elif dh > h_thresh:
        return "Looking Right"
    elif dv > v_thresh:
        return "Looking Down"
    else:
        return "Looking Up"

# function to calculate mouth opening percentage: returns opening_percent & mouth_state
def compute_mouth_opening(face_landmarks, w, h, threshold=2):
    
    # collect coordinates for upper & lower lip sets
    upper_points = np.array([[face_landmarks.landmark[i].x * w,
                              face_landmarks.landmark[i].y * h]
                             for i in UPPER_LIP_IDS])
    lower_points = np.array([[face_landmarks.landmark[i].x * w,
                              face_landmarks.landmark[i].y * h]
                             for i in LOWER_LIP_IDS])

    # calculate average position of upper and lower lip regions: (x,y) coordinates
    upper_mean = np.mean(upper_points, axis=0)   
    lower_mean = np.mean(lower_points, axis=0)   

    # vertical distance between upper and lower lips (mouth opening) 
    mouth_open = max(0.0, lower_mean[1] - upper_mean[1]) # prevent from negative

    # get mouth width using corner landmarks (61 and 291 are mouth corners)
    left_corner = np.array([face_landmarks.landmark[61].x * w,
                            face_landmarks.landmark[61].y * h])
    right_corner = np.array([face_landmarks.landmark[291].x * w,
                             face_landmarks.landmark[291].y * h])
    mouth_width = np.linalg.norm(right_corner - left_corner) + 1e-6

    # calculate opening as percentage of mouth width
    opening_ratio = (mouth_open / mouth_width) * 100.0
    opening_ratio = round(float(opening_ratio), 2)

    # determine if person is speaking based on threshold
    mouth_state = "Speaking" if opening_ratio > threshold else "Silent"
    return opening_ratio, mouth_state


# websocket endpoints
@app.websocket("/ws")
# function to receive video frames and sends back anaylsis data
async def websocket_endpoint(websocket: WebSocket):
    
    await websocket.accept()
    client_key = str(uuid.uuid4()) # unique ID
    state = new_client_state() # initialize tracking state
    clients[client_key] = state # store in global clients dictionary
    print(f"[{client_key}] connected")

    try:
        while True:
            # wait for data from client
            data = await websocket.receive_text()
            # if data.strip().lower() == "recalibrate":
            #     state = new_client_state()
            #     clients[client_key] = state
            #     await websocket.send_text(json.dumps({"status": "recalibrating"}))
            #     continue


            try:
                # decode the received image frame
                frame = decode_base64_to_bgr(data)
            except Exception as e:
                await websocket.send_text(json.dumps({"error": "bad_image", "detail": str(e)}))
                continue

            # process the image with mediapipe face detection
            h, w = frame.shape[:2] # get image dimensions
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) # convert to RGB for mediapipe
            results = face_mesh.process(rgb) # run face detection

            # check if any faces were detected
            if not results.multi_face_landmarks:
                await websocket.send_json({"eye_direction": "No face detected", "head_direction": "No face detected"})
                continue

            # get the first detected face
            face_landmarks = results.multi_face_landmarks[0]

            # calculate eye position ratios
            try:
                h_ratio, v_ratio = compute_eye_ratios(face_landmarks, w, h)
            except Exception as e:
                await websocket.send_json({"eye_direction": "error", "head_direction": "error", "detail": str(e)})
                continue

            # add new measurements to smoothing history
            state["horiz_hist"].append(h_ratio)
            state["vert_hist"].append(v_ratio)
            
            # calculate smoothed values by averaging recent measurements
            sm_h = float(np.mean(state["horiz_hist"]))
            sm_v = float(np.mean(state["vert_hist"]))

            # calculate mouth opening with smoothing
            mouth_opening_pct, _ = compute_mouth_opening(face_landmarks, w, h)
            state["mouth_hist"].append(mouth_opening_pct)
            smoothed_mouth_pct = float(np.mean(state["mouth_hist"]))
            mouth_state = "Speaking" if smoothed_mouth_pct > 20 else "Silent"

            # handle calibration phase 
            if state["calibrating"]:
                
                # collect sampesl during calibration period
                state["calib_samples"].append((h_ratio, v_ratio))
                elapsed = time.time() - state["calib_start"]
                
                # end calibration after enough time or samples
                if elapsed >= CALIBRATION_SECONDS or len(state["calib_samples"]) >= 40:
                    # calculate average eye position during calibration
                    ch = float(np.mean([s[0] for s in state["calib_samples"]])) # center horizontal
                    cv = float(np.mean([s[1] for s in state["calib_samples"]])) # center vertical
                    state["center_h"] = ch
                    state["center_v"] = cv
                    state["calibrating"] = False
                    print(f"[{client_key}] calibration done: center_h={ch:.3f}, center_v={cv:.3f}")
                else:
                    # send calibrating progress update
                    await websocket.send_json({"eye_direction": "Calibrating", "head_direction": "Calibrating", "progress": elapsed / CALIBRATION_SECONDS})
                    continue

            # classify eye direction based on deviation from calibrated center
            eye_dir = classify_eye_direction(sm_h, sm_v, state["center_h"], state["center_v"])

            # calcualte head direction using 3d pose estimation
            try:
                head_dir = compute_head_direction(face_landmarks, w, h)
            except Exception as e:
                head_dir = "error"

            # collect facial anaylsis data
            response = {
                "eye_direction": eye_dir,
                "head_direction": head_dir,
                "smoothed_horizontal": sm_h,
                "smoothed_vertical": sm_v,
                "center_horizontal": state["center_h"],
                "center_vertical": state["center_v"],
                "mouth_opening_percent": round(smoothed_mouth_pct, 2),
                "mouth_state": mouth_state,
            }

            await websocket.send_json(response)

    except WebSocketDisconnect:
        print(f"[{client_key}] disconnected (ws disconnect)")
    except Exception as e:
        print(f"[{client_key}] error: {e}")
    finally:
        if client_key in clients:
            del clients[client_key] # clean up when client disconnects
        try:
            await websocket.close()
        except:
            pass

# start the fastapi server on port 8000
if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)