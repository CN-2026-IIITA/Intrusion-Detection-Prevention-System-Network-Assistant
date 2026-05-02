import os
import subprocess
import sys

DATASET_NAME = "cicdataset/cicids2017"
TARGET_DIR = "MachineLearningCVE"

def print_manual_instructions():
    print(f"""
[!] Automatic download failed or Kaggle API is not configured.

To run the Machine Learning notebook (M101.ipynb), you must manually download the CIC-IDS2017 dataset:

1. Go to: https://www.kaggle.com/datasets/cicdataset/cicids2017
2. Create an account and accept the Terms of Service.
3. Click 'Download' (Warning: It is ~2.5 GB).
4. Extract the downloaded ZIP file.
5. Move the 'MachineLearningCVE' folder into this 'notebook/' directory.
6. Once the folder is here, you can run M101.ipynb.
""")

def fetch_dataset():
    print(f"[*] Attempting to download {DATASET_NAME} via Kaggle API...")
    
    # Check if kaggle is installed
    try:
        import kaggle
    except ImportError:
        print("[-] 'kaggle' Python module not found. Install it via: pip install kaggle")
        print_manual_instructions()
        sys.exit(1)

    try:
        # Download and unzip the specific MachineLearningCSV folder
        print("[*] This is a large dataset (2.5+ GB). Please be patient...")
        subprocess.run(["kaggle", "datasets", "download", "-d", DATASET_NAME, "--unzip"], check=True)
        print(f"[+] Successfully downloaded and extracted dataset!")
        print(f"[+] Ensure the {TARGET_DIR} folder is in the same directory as M101.ipynb.")
    except subprocess.CalledProcessError:
        print_manual_instructions()
        sys.exit(1)

if __name__ == "__main__":
    if os.path.exists(TARGET_DIR):
        print(f"[+] The dataset directory '{TARGET_DIR}' already exists. You are ready to run M101.ipynb!")
    else:
        fetch_dataset()
