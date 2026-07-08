@echo off
setlocal

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 goto NoNode

:: Define remote script URL and local temp path
:: UPDATE THIS URL to point to your raw screenshotaf.cjs on GitHub
set SCRIPT_URL=https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/screenshotaf/main/screenshotaf.cjs
set TEMP_JS=%TEMP%\screenshotaf.cjs

:: Check specifically for playwright in node_modules
:CheckPlaywright
if exist "node_modules\playwright\" goto DownloadApp
echo [INFO] Missing required dependency: Playwright.
echo [INFO] Installing Playwright (this won't modify your package.json)...
call npm install playwright --no-save
if %errorlevel% neq 0 goto InstallFail

:DownloadApp
echo [INFO] Checking for latest ScreenshotAF engine...
powershell -Command "try { Invoke-WebRequest -Uri '%SCRIPT_URL%' -OutFile '%TEMP_JS%' -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo [WARN] Could not reach the server to update the engine.
    if not exist "%TEMP_JS%" (
        echo [ERROR] No cached engine found. Please check your internet connection.
        pause
        exit /b 1
    ) else (
        echo [INFO] Using previously downloaded version.
    )
)

:RunApp
echo [INFO] Starting Dashboard server...
node "%TEMP_JS%" "%CD%"
pause
exit /b 0

:NoNode
echo [ERROR] Node.js is not installed or not in your PATH.
echo Please install Node.js from https://nodejs.org/ and try again.
pause
exit /b 1

:InstallFail
echo [ERROR] npm install failed.
pause
exit /b 1
