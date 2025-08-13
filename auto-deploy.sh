#!/bin/bash

# TTKH旅游管理系统自动化部署脚本
# 此脚本帮助您将项目部署到GitHub，然后通过Render自动部署

echo "🚀 TTKH旅游管理系统部署脚本"
echo "================================"

# 检查是否已安装Git
if ! command -v git &> /dev/null
then
    echo "❌ 未检测到Git，请先安装Git"
    exit 1
fi

echo "✅ Git已安装"

# 检查当前目录是否为Git仓库
if [ ! -d ".git" ]; then
    echo "🔧 初始化Git仓库..."
    git init
    git add .
    git commit -m "Initial commit: TTKH旅游管理系统"
else
    echo "✅ Git仓库已存在"
fi

echo ""
echo "📋 部署步骤："
echo "1. 请在GitHub上创建一个新的仓库（名称如ttkh-tourism-system）"
echo "2. 将此本地仓库推送到您的GitHub仓库"
echo "3. 在Render.com上连接您的GitHub仓库并部署"
echo ""
echo "📌 具体操作命令（请根据您的GitHub用户名和仓库名修改）："
echo "   git remote add origin https://github.com/您的用户名/您的仓库名.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "🔗 Render部署说明："
echo "1. 访问 https://dashboard.render.com"
echo "2. 点击 'New+' 按钮，选择 'Web Service'"
echo "3. 连接您的GitHub账户并选择刚刚创建的仓库"
echo "4. Render会自动检测render.yaml文件并配置部署"
echo "5. 点击 'Create Web Service' 开始部署"
echo ""
echo "⏱  部署完成后："
echo "• 后端服务将部署到类似 https://your-app-name.onrender.com"
echo "• 前端服务将部署到类似 https://your-app-name-frontend.onrender.com"
echo ""
echo "📝 注意事项："
echo "• 部署过程大约需要5-10分钟"
echo "• 首次部署后，后续push会自动触发重新部署"
echo "• 免费套餐每月有750小时运行时长限制"