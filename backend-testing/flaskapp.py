from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt, jwt, json, os, uuid
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins=["http://yourdomain.com", "http://localhost:4200"])

SECRET_KEY = os.environ.get("SECRET_KEY", "change-this-in-production")
DATA_FILE = "users.json"

# --- Helpers ---

def load_data():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

def make_token(user_id):
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(req):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])["sub"]
    except:
        return None

# --- Routes ---

@app.route("/register", methods=["POST"])
def register():
    body = request.json
    username = body.get("username", "").strip()
    password = body.get("password", "")
    name = body.get("name", "").strip()

    if not username or not password or not name:
        return jsonify({"error": "Missing fields"}), 400

    data = load_data()
    if any(u["username"] == username for u in data.values()):
        return jsonify({"error": "Username taken"}), 409

    user_id = str(uuid.uuid4())
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    data[user_id] = {
        "username": username,
        "password": hashed,
        "name": name,
        "top_score": 0
    }
    save_data(data)
    return jsonify({"token": make_token(user_id), "name": name, "user_id": user_id})

@app.route("/login", methods=["POST"])
def login():
    body = request.json
    username = body.get("username", "")
    password = body.get("password", "")

    data = load_data()
    user_id, user = next(
        ((uid, u) for uid, u in data.items() if u["username"] == username),
        (None, None)
    )

    if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"token": make_token(user_id), "name": user["name"], "user_id": user_id})

@app.route("/score", methods=["POST"])
def submit_score():
    user_id = verify_token(request)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    score = request.json.get("score", 0)
    data = load_data()
    if user_id in data:
        if score > data[user_id]["top_score"]:
            data[user_id]["top_score"] = score
        save_data(data)
    return jsonify({"top_score": data[user_id]["top_score"]})

@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    data = load_data()
    board = sorted(
        [{"name": u["name"], "top_score": u["top_score"]} for u in data.values()],
        key=lambda x: x["top_score"],
        reverse=True
    )
    return jsonify(board[:10])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)