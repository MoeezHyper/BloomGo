@echo off
title Terminate Smart Home Gardening Servers
echo ====================================================
echo    Stopping Smart Home Gardening Servers...
echo ====================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$killed = 0;" ^
  "Get-NetTCPConnection -LocalPort 4000, 8081, 9099, 4040, 4400, 4500 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {" ^
  "  Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue;" ^
  "  Write-Host \"[OK] Terminated server process PID: $_\" -ForegroundColor Green;" ^
  "  $killed++;" ^
  "};" ^
  "if ($killed -eq 0) {" ^
  "  Write-Host 'No running servers found on ports 4000, 8081 or 9099.' -ForegroundColor Yellow;" ^
  "} else {" ^
  "  Write-Host '' ;" ^
  "  Write-Host '[SUCCESS] All servers have been terminated.' -ForegroundColor Green;" ^
  "}"

echo.
echo ====================================================
pause
