#!/bin/bash
echo "🚀 一键部署脚本"
echo "正在检查环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要安装 Node.js"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 启动服务
echo "🚀 启动服务..."
npm start
