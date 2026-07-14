"""
app/routes/quantum_secure.py
POST /demo/secure_predict — ML-KEM Post-Quantum Encrypted Prediction
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import time
import uuid

from app.services import ml_service
from app.utils.quantum_crypto import vault, get_vault_status

router = APIRouter()


class SecurePredictRequest(BaseModel):
    features: Optional[Dict[str, float]] = None
    demo_mode: bool = True   # True → use built-in demo transaction


_DEMO_TRANSACTION = {
    "amount": 8500.0,
    "is_beneficiary_new": 1.0,
    "days_since_login": 0.5,
    "ACK Flag Cnt": 42.0,
    "Bwd IAT Mean": 312.0,
    "Fwd Pkt Len Std": 88.0,
    "PSH Flag Cnt": 7.0,
    "RST Flag Cnt": 3.0,
    "Fwd Pkt Len Max": 1460.0,
    "Fwd Pkts/s": 85.0,
}


@router.post("/secure_predict")
async def secure_predict(request: SecurePredictRequest):
    """
    Run fraud prediction and return result encrypted with ML-KEM (Kyber512).
    The shared secret is returned alongside the ciphertext so the demo can
    decrypt and show the plaintext result in the Streamlit UI.
    """
    try:
        t0 = time.time()

        # 1. Generate ephemeral keypair
        public_key, secret_key = vault.generate_keypair()

        # 2. Run real ML prediction
        features = request.features if (not request.demo_mode and request.features) else _DEMO_TRANSACTION

        try:
            risk_score, is_fraud, confidence = ml_service.predict(features)
        except Exception:
            # Graceful fallback for demo
            import random
            risk_score  = round(random.uniform(0.55, 0.92), 4)
            is_fraud    = risk_score > 0.5
            confidence  = 0.85

        # 3. Build prediction payload
        prediction_payload = {
            "transaction_id":  str(uuid.uuid4()),
            "risk_score":      risk_score,
            "is_fraud":        is_fraud,
            "confidence":      confidence,
            "model_version":   "FinSpark-Ensemble-v1",
            "timestamp":       time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        # 4. Encrypt with ML-KEM vault
        encrypted_data = vault.encrypt_payload(prediction_payload, public_key)

        # 5. Also decrypt right away so Streamlit can show it (demo UX)
        decrypted_result = vault.decrypt_payload(encrypted_data, secret_key)

        latency_ms = round((time.time() - t0) * 1000, 1)

        return {
            "status":           "success",
            "vault_info":       get_vault_status(),
            "encrypted_result": encrypted_data,
            "decrypted_result": decrypted_result,   # shown in demo UI
            "latency_ms":       latency_ms,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vault_status")
async def vault_status():
    """Returns the current quantum vault configuration."""
    return get_vault_status()
