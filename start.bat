@echo off
cd /d "%~dp0"

:: Kill any existing process on port 3456
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":3456"') do (
  if not "%%a"=="" taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo Starting Waka-Anki server...
echo.
echo Open http://localhost:3456 in your browser
echo.
start http://localhost:3456
node server.js
pause
