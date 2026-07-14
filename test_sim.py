import requests

r = requests.post("http://127.0.0.1:8000/demo/simulate_attack", timeout=60)
d = r.json()
if r.status_code == 200:
    txns = d["transactions"]
    fraud = [t for t in txns if t["is_fraud_predicted"]]
    print(f"Status: {r.status_code}")
    print(f"Total: {len(txns)}, Fraud detected: {len(fraud)}")
    print(f"Quantum risk score sample: {txns[0]['quantum_risk_score']}")
    print(f"Exfil volume sample: {txns[0]['data_exfil_volume_gb']} GB")
    print("ALL TESTS PASSED!")
else:
    print(f"FAILED: {d.get('detail')}")
