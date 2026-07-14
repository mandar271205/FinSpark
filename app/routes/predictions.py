from fastapi import APIRouter, HTTPException, status
from app.models import PredictionRequest, PredictionResponse
from app.services import ml_service
from app.database import test_connection
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_fraud(request: PredictionRequest):
    """
    Endpoint to predict if a transaction is fraudulent based on features.
    """
    try:
        # 1. Get prediction
        risk_score, is_fraud, confidence = ml_service.predict(request.features)
        
        # 2. Save alert to Supabase
        alert_data = {
            "transaction_id": request.transaction_id,
            "risk_score": risk_score,
            "is_fraud": is_fraud,
            "model_confidence": confidence,
            "top_features": request.features, # Assuming passing input features as top features for now
            "status": "pending"
        }
        
        alert_id = None
        try:
            alert_id = ml_service.save_alert_to_supabase(alert_data)
        except Exception as e:
            logger.error(f"Could not save alert to Supabase: {e}")
            # Continuing since prediction succeeded even if DB insert failed
            
        # 3. Return response
        return PredictionResponse(
            transaction_id=request.transaction_id,
            is_fraud=is_fraud,
            risk_score=risk_score,
            confidence_level=confidence,
            alert_id=alert_id,
            status="success"
        )
        
    except Exception as e:
        logger.error(f"Error processing prediction request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Lightweight health check endpoint.
    Returns 200 OK as long as the FastAPI server is running.
    """
    models_loaded = ml_service.initialized and ml_service.models is not None
    
    return {
        "status": "Healthy",
        "models_loaded": models_loaded,
        "database_connected": "Unknown (Skipped for performance)"
    }
