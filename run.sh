#!/usr/bin/env bash
# ==============================================================================
# GenCV: Startup Script
# Launches the FastAPI server and serves the portfolio UI & REST API
# ==============================================================================

set -e

PORT=${PORT:-8000}
HOST=${HOST:-"0.0.0.0"}

# Detect and activate virtual environment if present
if [ -d ".venv" ]; then
    echo "Activating virtual environment (.venv)..."
    source .venv/bin/activate
elif [ -d "venv" ]; then
    echo "Activating virtual environment (venv)..."
    source venv/bin/activate
fi

# Initialize database & seed sample records if not initialized
python3 -c "from backend.database import init_db; from backend.seed_data import seed_database; init_db(); seed_database()"

echo "======================================================================"
echo " GenCV: AI-Powered Portfolio Management & Dynamic Resume Generator"
echo " Local Web UI: http://localhost:${PORT}"
echo " REST API Docs: http://localhost:${PORT}/docs"
echo "======================================================================"

exec uvicorn backend.app:app --host "$HOST" --port "$PORT" --reload
