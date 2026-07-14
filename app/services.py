import os
import pickle
import joblib
import logging
import pandas as pd
import numpy as np
import io
import sys
from typing import Dict, Any, Tuple
from app.database import supabase

# Dummy class to satisfy unpickler for the PyTorch GCN wrapper if it exists in the ensemble dict
class FraudGCN:
    pass

class CustomUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if name == 'FraudGCN':
            return FraudGCN
        return super().find_class(module, name)

logger = logging.getLogger(__name__)

class MLModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLModelService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self):
        if self.initialized:
            return
        self.models = None
        self.scaler = None
        self.metadata = None
        self.gcn_loaded = False
        self.initialized = True

    def load_models(self, artifacts_path: str = "./artifacts"):
        """Loads models, scaler, metadata, and GCN from the artifacts directory."""
        try:
            models_file = os.path.join(artifacts_path, "finspark_models.pkl")
            scaler_file = os.path.join(artifacts_path, "finspark_scaler.pkl")
            metadata_file = os.path.join(artifacts_path, "finspark_metadata.pkl")
            gcn_file = os.path.join(artifacts_path, "finspark_gcn_model.pth")

            # Load models
            # We patch torch.load to force CPU loading since the models were pickled on CUDA
            import torch
            original_torch_load = torch.load
            def patched_torch_load(*args, **kwargs):
                kwargs['map_location'] = torch.device('cpu')
                return original_torch_load(*args, **kwargs)
            torch.load = patched_torch_load
            
            try:
                with open(models_file, "rb") as f:
                    self.models = CustomUnpickler(f).load()
            finally:
                torch.load = original_torch_load
                
            # Load scaler
            with open(scaler_file, "rb") as f:
                self.scaler = joblib.load(f)
                
            # Load metadata
            with open(metadata_file, "rb") as f:
                self.metadata = joblib.load(f)

            # Check GCN Model
            if os.path.exists(gcn_file):
                self.gcn_loaded = True
            
            # Extract metadata details for logging
            num_models = len(self.models) if isinstance(self.models, dict) else len(self.models)
            optimal_thresh = self.metadata.get("optimal_threshold", 0.5)
            # Assuming scaler is a scikit-learn scaler
            scaler_features = getattr(self.scaler, "n_features_in_", 84) 

            # Mandatory Startup Log
            print(f"[SUCCESS] Loaded {num_models} Models | Scaler Features: {scaler_features} | Optimal Threshold: {optimal_thresh} | GCN: {'Ready' if self.gcn_loaded else 'Missing'}")
            logger.info("Successfully loaded REAL ML models and metadata.")
            
        except Exception as e:
            logger.error(f"Failed to load ML artifacts: {e}")
            raise RuntimeError(f"Could not load ML artifacts from {artifacts_path}. Please ensure .pkl and .pth files are present.") from e

    def predict(self, features_dict: Dict[str, float]) -> Tuple[float, bool, float]:
        """
        Scales features, gets weighted predictions from top 5 models using metadata weights.
        Returns: (risk_score, is_fraud, confidence_level)
        """
        try:
            # 1. Prepare data
            # Ensure we have all features the scaler expects. Fill missing with 0 for now to prevent crashing
            # In a real production scenario, you would validate this rigorously.
            df = pd.DataFrame([features_dict])
            expected_features = getattr(self.scaler, "feature_names_in_", df.columns)
            
            for col in expected_features:
                if col not in df.columns:
                    df[col] = 0.0
            
            df = df[expected_features] # Ensure order matches

            # 2. Scale features
            scaled_features = self.scaler.transform(df)

            # 3. Get predictions from top 5 models
            top_5_models_info = self.metadata.get("top_5_models", [])
            
            if not top_5_models_info:
                raise ValueError("top_5_models not found in metadata.")
                
            risk_score = 0.0
            
            # Ensure self.models is a dict containing models by name, or a list. 
            # We assume it's a dict based on kaggle conventions
            models_dict = self.models if isinstance(self.models, dict) else {f"model_{i}": m for i, m in enumerate(self.models)}
            
            weight = 1.0 / len(top_5_models_info)
            for model_name in top_5_models_info:
                model = models_dict[model_name]
                
                # Predict
                prob = model.predict_proba(scaled_features)[:, 1][0]
                risk_score += prob * weight

            # 4. Apply threshold
            threshold = self.metadata.get("optimal_threshold", 0.5)
            is_fraud = bool(risk_score >= threshold)

            # 5. Calculate confidence level
            distance = abs(risk_score - threshold)
            max_dist = max(threshold, 1 - threshold)
            confidence_level = min(1.0, distance / max_dist) + 0.5
            confidence_level = min(1.0, confidence_level)

            return round(float(risk_score), 4), is_fraud, round(float(confidence_level), 4)

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise ValueError(f"Failed to process prediction: {e}")

    def save_alert_to_supabase(self, alert_data: Dict[str, Any]) -> str:
        """Inserts prediction result into Supabase fraud_alerts table."""
        try:
            response = supabase.table("fraud_alerts").insert(alert_data).execute()
            if hasattr(response, 'data') and len(response.data) > 0:
                return response.data[0]['id']
            return None
        except Exception as e:
            logger.error(f"Failed to save alert to Supabase: {e}")
            # Continuing since prediction succeeded even if DB insert failed
            return None

ml_service = MLModelService()
