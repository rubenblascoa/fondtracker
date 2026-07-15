@echo off
echo.
echo  FondTracker — Deploy a XAMPP
echo  ─────────────────────────────
echo.

REM 1. Build client
echo [1/3] Building client...
"C:\Users\Ruben\AppData\Local\Microsoft\WinGet\Packages\Oven-sh.Bun_Microsoft.Winget.Source_8wekyb3d8bbwe\bun-windows-x64\bun.exe" run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

REM 2. Clean htdocs destination
echo [2/3] Deploying to htdocs\fondtracker...
if exist "C:\xampp\htdocs\fondtracker" rmdir /s /q "C:\xampp\htdocs\fondtracker"
mkdir "C:\xampp\htdocs\fondtracker"

REM 3. Copy dist files
xcopy /e /i /q "dist\*" "C:\xampp\htdocs\fondtracker\"
copy /y "deploy\.htaccess" "C:\xampp\htdocs\fondtracker\.htaccess" >nul 2>&1

echo [3/3] Done!
echo.
echo  ─────────────────────────────────────────────
echo  Archivos copiados a: C:\xampp\htdocs\fondtracker
echo.
echo  Pasos:
echo   1. Inicia Apache desde XAMPP Control Panel
echo   2. Ejecuta start-api.bat (servidor de API en puerto 3741)
echo   3. Abre http://localhost/fondtracker/
echo  ─────────────────────────────────────────────
echo.
pause
