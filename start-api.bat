@echo off
title FondTracker API Server
echo.
echo  FondTracker API Server
echo  ──────────────────────
echo  Puerto: 3741
echo  Base de datos: fondtracker (MySQL/XAMPP)
echo.
echo  Accede desde Apache: http://localhost/fondtracker/
echo  Accede directamente: http://localhost:3741/
echo.
echo  Ctrl+C para detener
echo.

"C:\Users\Ruben\AppData\Local\Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64\bun.exe" run src/server/index.ts
pause
