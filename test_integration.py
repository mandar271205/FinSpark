import requests

def run_integration_test():
    url = "http://127.0.0.1:8000/predict/"
    
    payload = {
        "transaction_id": "TEST12345",
        "features": {
            "amount": 50000.0,
            "is_beneficiary_new": 1.0,
            "distance_from_home": 500.0,
            "time_of_day": 2.0,
            "past_fraud_attempts": 1.0,
            # We add a few more mock features just in case the scaler needs 84.
            # Our services.py logic fills missing features with 0.0 automatically, so this is fine.
        }
    }

    try:
        print("Sending POST request to:", url)
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("Response:", data)
            
            if "risk_score" in data and "is_fraud" in data:
                print("[SUCCESS] INTEGRATION SUCCESSFUL")
            else:
                print("[ERROR] INTEGRATION FAILED: Missing keys in response.")
        else:
            print(f"[ERROR] INTEGRATION FAILED: Status code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"[ERROR] INTEGRATION FAILED: Connection error: {e}")

if __name__ == "__main__":
    run_integration_test()
