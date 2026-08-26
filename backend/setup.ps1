# One-shot backend setup: creates the venv, installs deps, seeds .env.
# Usage: cd backend; .\setup.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Creating virtual environment..."
python -m venv venv

$venvPython = ".\venv\Scripts\python.exe"

Write-Host "Installing dependencies..."
& $venvPython -m pip install --upgrade pip -q
& $venvPython -m pip install -r requirements-dev.txt -q

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env from .env.example."
}

Write-Host ""
Write-Host "Setup complete. Next steps:"
Write-Host "  1. Add your free GEMINI_API_KEY to backend\.env"
Write-Host "     (get one at https://aistudio.google.com/apikey)"
Write-Host "  2. Build the corpus:   python scripts/ingest.py"
Write-Host "  3. Run the API:        uvicorn app.main:app --reload"
Write-Host "  4. Run the tests:      pytest"
