import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.predictions import router as predictions_router
from app.routes.demo import router as demo_router
from app.routes.quantum_secure import router as quantum_router
from app.routes.dashboard import router as dashboard_router
from app.services import ml_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI application
app = FastAPI(
    title="FinSpark PS2 Fraud Detection System",
    description="FastAPI backend for predicting fraudulent transactions.",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(predictions_router, prefix="/predict", tags=["Predictions"])
app.include_router(demo_router, prefix="/demo", tags=["Demo"])
app.include_router(quantum_router, prefix="/demo", tags=["Quantum Vault"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

@app.on_event("startup")
async def startup_event():
    """Startup event to load ML models."""
    logger.info("Starting up FastAPI application...")
    logger.info("Loading ML Models...")
    try:
        ml_service.load_models()
    except Exception as e:
        logger.error(f"Error loading ML models during startup: {e}")

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to the FinSpark PS2 Fraud Detection System API"}
