@echo off
echo Stopping Waka-Anki server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /C:":3456"') do (
  if not "%%a"=="" (
    taskkill /F /PID %%a >nul 2>&1 && echo Server stopped.
  )
)
timeout /t 1 /nobreak >nul
