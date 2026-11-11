@echo off
setlocal

REM Start the Dream Shop backend and its ngrok tunnel together.

set "BACKEND_DIR=C:\Users\ajlaz\Dream\backend"
set "NGROK_DOMAIN=catty-unwoven-babble.ngrok-free.dev"
set "BACKEND_PORT=4000"

if not exist "%BACKEND_DIR%\package.json" (
  echo ERROR: Backend package.json not found:
  echo %BACKEND_DIR%\package.json
  pause
  exit /b 1
)

where ngrok >nul 2>nul
if errorlevel 1 (
  echo ERROR: ngrok was not found on PATH.
  echo Check that "ngrok" works in a new PowerShell terminal.
  pause
  exit /b 1
)

echo Starting backend and ngrok...

REM Open backend in its own terminal.
start "Dream Shop Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && npm run dev"

REM Give the backend a moment to start before starting the tunnel.
timeout /t 5 /nobreak >nul

REM Open ngrok in its own terminal.
start "Dream Shop ngrok" cmd /k "ngrok http %BACKEND_PORT% --url https://%NGROK_DOMAIN%"

echo.
echo Both terminals have been launched.
echo Keep both open while testing payments.
echo Webhook: https://%NGROK_DOMAIN%/api/orders/webhook
echo.
pause
