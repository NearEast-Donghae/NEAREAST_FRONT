@echo off
chcp 65001 >nul
rem Node 26 is incompatible with esbuild-wasm, so use the portable Node 22 here.
set "PATH=%LOCALAPPDATA%\node22;%PATH%"
cd /d "%~dp0"
call npm run dev
pause
