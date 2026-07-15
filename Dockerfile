# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (e.g. build-essential for some pip packages if needed)
# Added libgomp1 for LightGBM/XGBoost if needed, and standard build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
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
# the real ML artifacts. Clone the public repo with Git LFS and replace them.
RUN git lfs install \
    && git clone --depth 1 https://github.com/mandar271205/FinSpark.git /tmp/finspark-lfs \
    && cd /tmp/finspark-lfs \
    && git lfs pull --include="artifacts/**" \
    && cp -f artifacts/* /app/artifacts/ \
    && rm -rf /tmp/finspark-lfs \
    && python -c "from pathlib import Path; p=Path('/app/artifacts/finspark_models.pkl'); data=p.read_bytes()[:64]; assert not data.startswith(b'version https://git-lfs.github.com/spec'), 'Git LFS artifact was not downloaded'"

# Expose Render's default fallback port
EXPOSE 8000

# Start command. Render injects PORT; default to 8000 for local Docker runs.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
