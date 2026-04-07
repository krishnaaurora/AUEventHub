@echo off
echo 🚀 Starting AUEventHub: Frontend + Backend (Flask)...

:: Set Project Root
set ROOT=%~dp0

:: Start Backend in a new window
echo Starting Backend...
start "AUEventHub Backend (Flask)" cmd /k "cd %ROOT%backend && .\start.bat"

:: Start Frontend in a new window
echo Starting Frontend...
start "AUEventHub Frontend (Next.js)" cmd /k "cd %ROOT%frontend && npm run dev"

echo ✨ Servers are launching in separate windows!
echo 🌐 Frontend: http://localhost:3000
echo 🧠 Backend: http://localhost:5000
echo(
echo Press any key to exit this script holder (this won't close the servers).
pause
