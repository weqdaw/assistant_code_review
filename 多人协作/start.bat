@echo off
echo Starting backend...
start cmd /k "cd /d h && npm run dev"

echo Starting frontend...
start cmd /k "cd /d yl && npm run serve"

echo Both backend and frontend are starting. Press any key to exit this window.
pause