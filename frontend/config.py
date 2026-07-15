import os

# Define the base URL for the FastAPI backend
DEFAULT_API_BASE_URL = "https://finspark-production-72a1.up.railway.app"

api_base_url = os.getenv("API_BASE_URL", DEFAULT_API_BASE_URL).strip().rstrip("/")

# Railway shared variables may still contain the local dev value. In production,
# prefer the deployed backend so the frontend does not call itself on localhost.
if os.getenv("RAILWAY_ENVIRONMENT") and api_base_url.startswith("http://localhost"):
    api_base_url = DEFAULT_API_BASE_URL

API_BASE_URL = api_base_url
