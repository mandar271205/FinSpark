from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class PredictionRequest(BaseModel):
    transaction_id: str = Field(..., description="Unique identifier for the transaction")
    features: Dict[str, float] = Field(..., description="Dictionary of numerical features for the model")

class PredictionResponse(BaseModel):
    transaction_id: str
    is_fraud: bool
    risk_score: float
    confidence_level: float
    alert_id: Optional[str] = None
    status: str

class FraudAlert(BaseModel):
    transaction_id: str
    risk_score: float
    is_fraud: bool
    model_confidence: float
    top_features: Optional[Dict[str, float]] = None
    shap_values: Optional[Dict[str, float]] = None
    status: str = "pending"
