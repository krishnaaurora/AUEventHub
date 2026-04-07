@echo off
echo 🚀 Starting AUEventHub Backend (Flask)...
cd /d "%~dp0"

:: Check if venv exists, create if not
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies
echo Installing dependencies...
pip install -r requirements.txt -q

:: Start the Flask application as a module
echo 🚀 Starting Flask app on http://localhost:5001...
set PYTHONPATH=.
python -m src.app
pause
