#!/usr/bin/env bash
# One-shot backend setup: creates the venv, installs deps, seeds .env.
# Usage: cd backend && ./setup.sh
set -euo pipefail
cd "$(dirname "$0")"

PYTHON="${PYTHON:-python3}"
command -v "$PYTHON" >/dev/null 2>&1 || PYTHON=python

echo "Creating virtual environment..."
"$PYTHON" -m venv venv

if [ -f venv/bin/activate ]; then
  VENV_PY=venv/bin/python
else
  VENV_PY=venv/Scripts/python.exe
fi

echo "Installing dependencies..."
"$VENV_PY" -m pip install --upgrade pip -q
"$VENV_PY" -m pip install -r requirements-dev.txt -q

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example."
fi

cat <<'EOF'

Setup complete. Next steps:
  1. Add your free GEMINI_API_KEY to backend/.env
     (get one at https://aistudio.google.com/apikey)
  2. Build the corpus:   python scripts/ingest.py
  3. Run the API:        uvicorn app.main:app --reload
  4. Run the tests:      pytest
EOF
