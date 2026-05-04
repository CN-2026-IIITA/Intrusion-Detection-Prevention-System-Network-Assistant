import time
import socketio
import socket
import numpy as np
import threading
import subprocess
import json
import warnings
import os
import sys
from collections import defaultdict

# Silence the annoying sklearn feature name warning
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ML MODEL INITIALIZATION
ml_model = None
label_encoder = None

try:
    import joblib

    MODEL_FILE = "models/ids_model.pkl"
    ENCODER_FILE = "models/label_encoder.pkl"

    if os.path.exists(MODEL_FILE) and os.path.exists(ENCODER_FILE):
        ml_model = joblib.load(MODEL_FILE)
        ml_model.verbose = 0
        label_encoder = joblib.load(ENCODER_FILE)
        print(f"[+] Flow-Based ML Model loaded: {MODEL_FILE}")
        print(f"[+] Multiclass Label Encoder loaded: {ENCODER_FILE}")
        print(f"[+] Phase 2 ACTIVE — Real-time flow classification enabled.")
    else:
        print(f"[!] WARNING: Model or Encoder file not found.")
        print(f"    Sensor will run WITHOUT ML classification (Phase 1 mode).")
except ImportError:
    print("[!] WARNING: joblib/scikit-learn not installed.")

# SOCKET.IO CLIENT SETUP
sio = socketio.Client()
NODE_SERVER_URL = 'http://localhost:3000'
connected_to_server = False

@sio.event
def connect():
    global connected_to_server
    connected_to_server = True
    print(f"\n[+] Successfully connected to Node.js backend at {NODE_SERVER_URL}")

@sio.event
def disconnect():
    global connected_to_server
    connected_to_server = False
    print("\n[-] Disconnected from Node.js backend")

def connect_to_backend():
    try:
        if not connected_to_server:
            sio.connect(NODE_SERVER_URL)
    except socketio.exceptions.ConnectionError:
        pass

# DNS IDENTIFICATION
dns_cache = {}

def get_hostname(ip):
    if ip in dns_cache:
        return dns_cache[ip]
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        dns_cache[ip] = hostname
        return hostname
    except:
        dns_cache[ip] = ip
        return ip

# IPS (INTRUSION PREVENTION SYSTEM) MODULE
whitelist_ips = {"127.0.0.1", "localhost", "10.11.100.16", "0.0.0.0", "255.255.255.255"}
blocked_ips = set()

port_scan_tracker = defaultdict(set)
last_tracker_reset = time.time()

def block_attacker(ip_address, attack_name):
    # dont block localhost or already blocked IPs
    if ip_address in blocked_ips or ip_address in whitelist_ips:
        return

    print(f"\n[!!!] INTRUSION PREVENTION TRIGGERED [!!!]")
    print(f"[*] Action: Isolating Malicious IP {ip_address} (Detected: {attack_name})")

    try:
        # tell the kernel to DROP all incoming traffic from this IP
        subprocess.run(["iptables", "-I", "INPUT", "-s", ip_address, "-j", "DROP"], check=True)
        blocked_ips.add(ip_address)
        print(f"[+] SUCCESS: {ip_address} has been blocked at the kernel level.\n")

        # tell server.js to pop up a massive alert on the frontend
        if connected_to_server:
            sio.emit('ip_blocked', {
                'ip': ip_address,
                'reason': attack_name,
                'timestamp': time.time()
            })

    except subprocess.CalledProcessError as e:
        print(f"[-] ERROR: Failed to block IP: {e}")

# C++ BRIDGE
def start_sniffing():
    print("[*] Starting IDS Sensor (Module A - HYBRID ARCHITECTURE)...")
    connect_to_backend()

    if not os.path.exists("./sensor_core"):
        print("[!] ERROR: ./sensor_core executable not found. Please run 'make' first.")
        sys.exit(1)

    bpf_filter = "tcp or udp"

    # run sensor_core
    cmd = ["./sensor_core", "wlp1s0", bpf_filter]
    print(f"[*] Executing C++ core: {' '.join(cmd)}")
    print("[*] Listening for network traffic. Press Ctrl+C to stop.")

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        # read lines from C++ stdout
        for line in iter(process.stdout.readline, ''):
            if not line:
                continue

            try:
                flow = json.loads(line)
            except json.JSONDecodeError:
                continue

            features = flow.get("features", [])
            if len(features) != 21:
                continue

            # ignore traffic originating from OUR server (prevent friendly fire)
            if flow["src_ip"] in whitelist_ips:
                continue

            # if the attacker is already blocked, ignore
            if flow["src_ip"] in blocked_ips:
                continue

            # HEURISTIC LAYER: PORT SCAN DETECTION
            global last_tracker_reset

            # reset tracker every 2 seconds
            current_time = time.time()
            if current_time - last_tracker_reset > 2.0:
                port_scan_tracker.clear()
                last_tracker_reset = current_time

            port_scan_tracker[flow["src_ip"]].add(flow["dst_port"])

            # more than 15 unique ports
            if len(port_scan_tracker[flow["src_ip"]]) > 15:
                ml_label = "PortScan (Heuristic)"
                ml_confidence = 100.0

                block_attacker(flow["src_ip"], ml_label)

                approx_flow_size = features[3] + features[4]
                payload = {
                    "timestamp": time.time(),
                    "source_ip": flow["src_ip"],
                    "source_name": get_hostname(flow["src_ip"]),
                    "destination_ip": flow["dst_ip"],
                    "destination_name": get_hostname(flow["dst_ip"]),
                    "protocol": flow["protocol"],
                    "packet_size": approx_flow_size,
                    "source_port": flow["src_port"],
                    "destination_port": flow["dst_port"],
                    "speed_kbps": round((approx_flow_size / 1024.0) / 2.0, 2),
                    "ml_classification": ml_label,
                    "ml_confidence": ml_confidence
                }

                if connected_to_server:
                    sio.emit('live_traffic', payload)
                    print(f"🔴 ALERT: {ml_label} Detected from {payload['source_ip']}! Reporting to dashboard...")

                continue

            ml_label = "Normal"
            ml_confidence = 0.0

            # Predict
            if ml_model is not None and label_encoder is not None:
                try:
                    feat_array = np.array([features])
                    feat_array = np.nan_to_num(feat_array, nan=0.0, posinf=0.0, neginf=0.0)

                    # Get the raw probability scores for every single attack type
                    probs = ml_model.predict_proba(feat_array)[0]
                    classes = label_encoder.classes_

                    # Find the index for "BENIGN" (Normal traffic)
                    benign_idx = -1
                    for i, c in enumerate(classes):
                        if c.upper() == "BENIGN":
                            benign_idx = i
                            break

                    # Find the highest probability among ALL attacks (ignoring Normal)
                    max_attack_prob = 0.0
                    attack_name = "Unknown"
                    for i, p in enumerate(probs):
                        if i != benign_idx and p > max_attack_prob:
                            max_attack_prob = p
                            attack_name = classes[i]

                    # SENSITIVITY
                    # if model more than 15% confident it's an attack, flag it
                    if max_attack_prob >= 0.15:
                        ml_label = attack_name
                        ml_confidence = round(max_attack_prob * 100, 1)

                        block_attacker(flow["src_ip"], ml_label)

                    else:
                        ml_label = "Normal"
                        # Use the normal probability score
                        ml_confidence = round(probs[benign_idx] * 100, 1) if benign_idx != -1 else 0.0

                except Exception as e:
                    ml_label = "Error"
                    ml_confidence = 0.0

            # Approximate packet size / speed logic
            approx_flow_size = features[3] + features[4] # fwd_len + bwd_len

            payload = {
                "timestamp": time.time(),
                "source_ip": flow["src_ip"],
                "source_name": get_hostname(flow["src_ip"]),
                "destination_ip": flow["dst_ip"],
                "destination_name": get_hostname(flow["dst_ip"]),
                "protocol": flow["protocol"],
                "packet_size": approx_flow_size,
                "source_port": flow["src_port"],
                "destination_port": flow["dst_port"],
                "speed_kbps": round((approx_flow_size / 1024.0) / 2.0, 2),
                "ml_classification": ml_label,
                "ml_confidence": ml_confidence
            }

            if connected_to_server:
                try:
                    sio.emit('live_traffic', payload)
                    status_icon = "🟢" if ml_label == "Normal" else "🔴"
                    print(f"{status_icon} FLOW [2s Window] {flow['protocol']} | {payload['source_name']} -> {payload['destination_name']} [{ml_label} {ml_confidence}%]")
                except Exception:
                    pass

    except KeyboardInterrupt:
        pass
    finally:
        if 'process' in locals():
            process.terminate()

if __name__ == "__main__":
    try:
        start_sniffing()
    except KeyboardInterrupt:
        pass
    finally:
        if 'process' in locals() and process is not None:
            print("\n[*] Terminating C++ sensor core...")
            process.kill()
            process.wait()

            if process.stdout:
                process.stdout.close()
            if process.stderr:
                process.stderr.close()
