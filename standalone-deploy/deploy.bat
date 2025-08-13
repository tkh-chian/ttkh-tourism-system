@echo off
echo 🚀 一键部署脚本
echo 正在检查环境...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 需要安装 Node.js
    pause
    exit /b 1
)

echo 📦 安装依赖...
npm install

echo 🚀 启动服务...
npm start
