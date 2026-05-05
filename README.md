# 🛡️ Intrusion Detection & Prevention System (IDS/IPS)

A real-time **Network Intrusion Detection and Prevention System (IDS/IPS)** built on Arch Linux.
This project combines a high-performance **C++ packet sniffer**, a **flow-based Random Forest ML model**, a **Node.js backend**, and a **React dashboard** to detect and actively block malicious traffic at the kernel level.

---

## 🧠 System Overview

This system follows a **hybrid, modular architecture** designed for performance, scalability, and real-time response:

### 🏗️ Architecture Layers

#### 1. Sensor Core (C++)

* Built using `libpcap`
* Captures raw packets in **promiscuous mode**
* Performs **stateful flow tracking**
* Extracts **21 flow-based features** including:

  * Flow Duration
  * Inter-Arrival Time (IAT)
  * Packet Length Stats
  * TCP Flags
* Outputs structured JSON data for downstream processing

---

#### 2. ML Engine (Python)

* Acts as the **decision-making brain**
* Uses a **Random Forest Classifier**
* Trained on the **CIC-IDS2017 dataset**
* Performs:

  * Feature preprocessing
  * Probability-based classification
* Outputs:

  * `BENIGN` or attack type
  * Confidence score

---

#### 3. Prevention Layer (iptables)

* Implements **active defense**
* Dynamically blocks malicious IPs using:

  ```bash
  iptables -I INPUT -s <ip> -j DROP
  ```
* Operates at the **Linux kernel level** → zero-latency blocking

---

#### 4. Observer Layer (Node.js + React)

* Real-time monitoring dashboard
* Built with:

  * WebSockets (`socket.io`)
  * SQLite for persistent logging
* Displays:

  * Live traffic flows
  * Attack alerts
  * Blocked IPs

---

## 🔄 Data Flow Pipeline

```
[C++ Packet Sniffer]
        ↓
[Flow Feature Extraction (21 features)]
        ↓
[Python ML Classification + Heuristics]
        ↓
[Intrusion Prevention (iptables)]
        ↓
[Node.js Backend]
        ↓
[React Dashboard + SQLite Logs]
```

---

## 🛡️ Threat Detection Capabilities

The system detects both **ML-based** and **heuristic-based** attacks:

### 🔴 1. Volumetric Attacks

* Example: **DoS Hulk**
* Detection via:

  * High packet rates
  * Abnormal flow size patterns

---

### 🟠 2. Resource Exhaustion Attacks

* Examples:

  * **Slowloris**
  * **Slowhttptest**
* Detection via:

  * Long-lived connections
  * Low data throughput
  * Idle socket abuse

---

### 🟡 3. Reconnaissance (Port Scanning)

* Heuristic detection layer
* Identifies:

  * High number of unique destination ports
  * Short time window scanning behavior

---

## ⚙️ Setup & Installation

### 1️⃣ Backend (Node.js API & Logger)

```bash
cd backend
npm install
node server.js
```

---

### 2️⃣ Frontend (React Dashboard)

```bash
cd frontend
npm install
npm run dev
```

---

### 3️⃣ C++ Sensor Core (Compilation)

Ensure `libpcap` is installed:

```bash
sudo pacman -S libpcap   # Arch Linux
```

Then compile:

```bash
cd sensor
make
```

---

### 4️⃣ Python Sensor (ML + IPS Engine)

#### Create virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

#### Install dependencies:

```bash
pip install scapy "python-socketio[client]" numpy scikit-learn joblib pandas
```

#### Run sensor (requires root):

```bash
sudo .venv/bin/python sensor/ids_sensor.py
```

---

## 📊 Dataset & Model

* Dataset: **CIC-IDS2017**

* Source:
  https://www.unb.ca/cic/datasets/ids-2017.html

* Kaggle Mirror:
  https://www.kaggle.com/datasets/cicdataset/cicids2017

### 📈 Model Performance

* Algorithm: Random Forest
* Task: Binary + Multi-class Classification
* Accuracy: **~98% on test dataset**

---

## 🛠️ Tech Stack

### 💻 Frontend

* React
* Tailwind CSS
* Framer Motion
* Lucide Icons

---

### 🌐 Backend

* Node.js
* Express.js
* Socket.io
* SQLite3

---

### 🤖 Machine Learning

* Scikit-learn
* Pandas
* NumPy
* Joblib

---

### ⚡ Low-Level System

* C++17
* libpcap
* Multithreading (std::thread)

---

## 🔐 Key Features

* ✅ Real-time packet inspection
* ✅ Flow-based ML detection
* ✅ Kernel-level attack blocking
* ✅ Hybrid detection (ML + heuristics)
* ✅ Live dashboard visualization
* ✅ Modular and scalable design

---

## ⚠️ Notes

* Requires **root privileges** for packet capture
* Tested on **Arch Linux**
* Network interface may need to be adjusted in code (e.g., `wlp1s0`)

---

## 📌 Future Improvements

* Distributed deployment (multi-node IDS)
* Rule-based signature engine (Snort-style) to detect more types of attack 
* Implement active sniffing instead of the current passive sniffing to make all traffic move through IDS before being sent to target
* Train the ML model with more data to gradually make it more accurate at detecting attacks

---
