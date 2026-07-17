import logging
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routes.predictions import router as predictions_router
from app.routes.demo import router as demo_router
from app.routes.quantum_secure import router as quantum_router
from app.routes.dashboard import router as dashboard_router
from app.services import ml_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://finspark-ai-fraud.vercel.app",
}


def _is_allowed_origin(origin: str | None) -> bool:
    return bool(
        origin in ALLOWED_ORIGINS
        or (origin and origin.startswith("https://") and origin.endswith(".vercel.app"))
    )

# Initialize FastAPI application
app = FastAPI(
    title="FinSpark PS2 Fraud Detection System",
    description="FastAPI backend for predicting fraudulent transactions.",
    version="1.0.0"
)

# Add CORS middleware. Keep this explicit for hosted frontends; "*" with
# credentials can produce missing/invalid CORS headers in browsers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(predictions_router, prefix="/predict", tags=["Predictions"])
app.include_router(demo_router, prefix="/demo", tags=["Demo"])
app.include_router(quantum_router, prefix="/demo", tags=["Quantum Vault"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error while processing %s", request.url.path)
    origin = request.headers.get("origin")
    headers = {}
    if _is_allowed_origin(origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Vary"] = "Origin"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers,
    )

@app.on_event("startup")
async def startup_event():
    """Startup event to load ML models."""
    logger.info("Starting up FastAPI application...")
    logger.info("Loading ML Models in background...")
    asyncio.create_task(load_models_background())


async def load_models_background():
    """Load model artifacts without blocking Railway from serving health checks."""
    try:
        await asyncio.to_thread(ml_service.load_models)
    except Exception as e:
        logger.error(f"Error loading ML models in background: {e}")

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to the FinSpark PS2 Fraud Detection System API"}

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "models_loaded": ml_service.models is not None,
    }
