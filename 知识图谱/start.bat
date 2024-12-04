@echo off
echo Starting backend...
start cmd /k "cd /d h && node src/app.js"

echo Starting frontend...
start cmd /k "cd /d q && npm run serve"

echo Both backend and frontend are starting. Press any key to exit this window.
pause