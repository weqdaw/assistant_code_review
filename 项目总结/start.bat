@echo off
echo Starting backend...
start cmd /k "cd /d backend && npm run dev"

echo Starting frontend...
start cmd /k "cd /d frontend && npm run serve"

echo Both backend and frontend are starting. Press any key to exit this window.
pause