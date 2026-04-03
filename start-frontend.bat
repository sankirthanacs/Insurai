@echo off
echo Starting InsurAI Frontend Server...
echo ======================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python from https://www.python.org/downloads/
    echo Or use Node.js instead:
    echo npm install -g http-server
    echo http-server frontend -p 3000
    pause
    exit /b 1
)

REM Change to the frontend directory
cd frontend

REM Start Python HTTP server on port 3000
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo ======================================
python -m http.server 3000