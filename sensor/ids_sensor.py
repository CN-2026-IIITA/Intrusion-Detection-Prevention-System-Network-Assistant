import time
import socketio
import socket
import numpy as np
import subprocess
import json
import warnings
import os

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

try:
    import joblib
    ml_model = joblib.load("models/ids_model.pkl")
    label_encoder = joblib.load("models/label_encoder.pkl")
except Exception:
    ml_model = None

sio = socketio.Client()
connected_to_server = False

@sio.event
def connect():
    global connected_to_server
    connected_to_server = True

@sio.event
def disconnect():
    global connected_to_server
    connected_to_server = False

def get_hostname(ip):
    try:
        return socket.gethostbyaddr(ip)[0]
    except:
        return ip

def start_sniffing():
    try:
        sio.connect('http://localhost:3000')
    except:
        pass

    cmd = ["./sensor_core", "wlp1s0", "tcp or udp"]
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, text=True)

    for line in iter(process.stdout.readline, ''):
        if not line: continue
        try:
            flow = json.loads(line)
        except json.JSONDecodeError:
            continue

        features = flow.get("features", [])
        if len(features) != 21: continue

        ml_label = "Normal"
        ml_confidence = 0.0

        if ml_model is not None:
            feat_array = np.nan_to_num(np.array([features]))
            probs = ml_model.predict_proba(feat_array)[0]
            classes = label_encoder.classes_

            benign_idx = list(classes).index("BENIGN") if "BENIGN" in classes else -1
            max_attack_prob = max([p for i, p in enumerate(probs) if i != benign_idx] or [0])

            if max_attack_prob >= 0.15:
                ml_label = classes[np.argmax(probs)]
                ml_confidence = round(max_attack_prob * 100, 1)
            else:
                ml_confidence = round(probs[benign_idx] * 100, 1) if benign_idx != -1 else 0.0

        approx_size = features[3] + features[4]
        payload = {
            "timestamp": time.time(),
            "source_ip": flow["src_ip"], "source_name": get_hostname(flow["src_ip"]),
            "destination_ip": flow["dst_ip"], "destination_name": get_hostname(flow["dst_ip"]),
            "protocol": flow["protocol"], "packet_size": approx_size,
            "source_port": flow["src_port"], "destination_port": flow["dst_port"],
            "speed_kbps": round((approx_size / 1024.0) / 2.0, 2),
            "ml_classification": ml_label, "ml_confidence": ml_confidence
        }

        if connected_to_server:
            sio.emit('live_traffic', payload)

if __name__ == "__main__":
    start_sniffing()
