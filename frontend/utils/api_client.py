import requests
import logging
from config import API_BASE_URL

logger = logging.getLogger(__name__)


def predict_fraud(payload: dict):
    try:
        response = requests.post(f"{API_BASE_URL}/predict/", json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Predict error: {e}")
        return None


def check_backend_health():
    try:
        response = requests.get(f"{API_BASE_URL}/predict/health", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def simulate_attack():
    try:
        response = requests.post(f"{API_BASE_URL}/demo/simulate_attack", timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Simulate error: {e}")
        return None


def explain_transaction(tx_id: str):
    try:
        response = requests.get(f"{API_BASE_URL}/demo/explain_transaction/{tx_id}", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Explain error: {e}")
        return None


def validate_real_fraud(file_bytes: bytes, filename: str):
    try:
        ext = filename.rsplit(".", 1)[-1].lower()
        mime = {"csv": "text/csv", "json": "application/json",
                "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                }.get(ext, "application/octet-stream")
        files = {"file": (filename, file_bytes, mime)}
        response = requests.post(f"{API_BASE_URL}/demo/validate_real_fraud",
                                 files=files, timeout=300)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Validate error: {e}")
        return None


def test_quantum_vault():
    try:
        response = requests.post(f"{API_BASE_URL}/demo/secure_predict",
                                 json={"demo_mode": True}, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Quantum vault error: {e}")
        return None

def get_dashboard_metrics():
    try:
        response = requests.get(f"{API_BASE_URL}/dashboard/metrics", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Metrics error: {e}")
        return None
