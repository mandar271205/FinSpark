# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (e.g. build-essential for some pip packages if needed)
# Added libgomp1 for LightGBM/XGBoost if needed, and standard build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    git-lfs \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project (backend code, artifacts, etc.)
# Note: Ensure .dockerignore does not exclude the .pkl files in artifacts/
COPY . .

# Railway/GitHub source archives can contain Git LFS pointer files instead of
# the real ML artifacts. Pull the real artifact files during the image build.
RUN if [ -d .git ]; then git lfs install && git lfs pull --include="artifacts/**"; fi

# Expose Render's default fallback port
EXPOSE 8000

# Start command. Render injects PORT; default to 8000 for local Docker runs.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
