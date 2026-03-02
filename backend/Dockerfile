# =============================================================================
# INACORTS Backend Dockerfile
# =============================================================================
# Python 3.11 (compatible with project requirement of 3.10+)
# Serves FastAPI via Uvicorn on port 8000
#
# Paths inside the container:
#   /app/           — Backend application code (WORKDIR)
#   /database/      — SQLite database + weekly backups (Docker volume)
#   /app/logs/      — Active logs (7 days) + archived logs (14 days) (Docker volume)
# =============================================================================

FROM python:3.11-slim

# Metadata
LABEL maintainer="INACORTS" \
      description="FastAPI backend for INACORTS" \
      version="1.1.0"

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal system dependencies required by bcrypt / cryptography
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies (layer cached separately from source code)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create directories that will be overlaid by volume mounts on first run.
# Docker volumes preserve existing content only on first mount, so these
# ensure the directory tree exists even without volumes.
RUN mkdir -p /database/backups logs/backups

# Expose the API port
EXPOSE 8000

# Healthcheck — polls the /health endpoint added in main.py
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start Uvicorn (single-worker; for multi-worker prod use, switch to gunicorn)
# --host 0.0.0.0 binds to all interfaces so Docker port mapping works.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
