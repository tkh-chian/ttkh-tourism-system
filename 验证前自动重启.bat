@echo off
chcp 65001 >nul
echo 🔄 验证前自动重启系统...
echo.

cd /d "%~dp0"
node auto-restart-system.js

pause