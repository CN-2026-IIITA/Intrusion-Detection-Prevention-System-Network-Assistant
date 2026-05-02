# Intrusion Detection and Prevention System 

A real-time Network Intrusion Prevention System (IPS) built on Arch Linux. This project utilizes a custom C++ packet sniffer, a Flow-based Random Forest Machine Learning model, a Node.js socket bridge, and a React dashboard to detect and block network attacks at the kernel level.

## Architecture
1. **Sensor Core (C++)**: Uses `libpcap` to capture raw network packets and extract 21 mathematical flow features (Duration, IAT, Flags, etc.).
2. **ML Brain (Python)**: Evaluates features against a Random Forest model trained on the CIC-IDS2017 dataset to classify traffic.
3. **Prevention (iptables)**: Dynamically drops malicious IP addresses at the kernel firewall level.
4. **Observer (Node.js & React)**: Broadcasts real-time traffic data via WebSockets to a React dashboard and logs events in SQLite.

## Threat Detection Capabilities
* Volumetric Attacks (DoS Hulk)
* Resource Exhaustion (DoS Slowloris / Slowhttptest)
* Reconnaissance (Horizontal PortScanning)

## Setup Instructions
**1. Backend:**
```bash
cd backend
npm install
node server.js
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**3. Sensor (Requires Root for Promiscuous Mode):**
```bash
cd sensor
make
```

**4. Running python sensor**

Activate .venv environment and install libraries in root folder
```bash
python -m venv .venv
source .venv/bin/activate
pip install scapy "python-socketio[client]" numpy scikit-learn joblib pandas
sudo /.venv/bin/python sensor/ids_sensor.py
```

## Dataset Attribution
The Machine Learning model was trained using the **CIC-IDS2017 Dataset** provided by the Canadian Institute for Cybersecurity.
* Link: Where we found the dataset [CIC-IDS2017 Dataset] (https://www.unb.ca/cic/datasets/ids-2017.html). Also available on kaggle (https://www.kaggle.com/datasets/cicdataset/cicids2017)
