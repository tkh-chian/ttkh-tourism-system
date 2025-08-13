@echo off
title TTKH旅游管理系统 - 推送到GitHub

echo ================================
echo TTKH旅游管理系统 - 推送到GitHub
echo ================================

REM 检查是否已安装Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Git，请先安装Git
    echo 请访问 https://git-scm.com/downloads 下载并安装Git
    pause
    exit /b 1
)

echo ✅ Git已安装

REM 检查当前目录是否为Git仓库
if not exist ".git" (
    echo 🔧 初始化Git仓库...
    git init
    git add .
    git commit -m "Initial commit: TTKH旅游管理系统"
    echo ✅ Git仓库初始化完成
) else (
    echo ✅ Git仓库已存在
)

echo.
echo 请按照以下步骤操作：
echo.
echo 1. 如果您还没有GitHub仓库，请先在GitHub上创建一个新仓库
echo    访问: https://github.com/new
echo    仓库名称建议使用: ttkh-tourism-system
echo.
echo 2. 创建仓库后，复制仓库的HTTPS地址，例如：
echo    https://github.com/您的用户名/您的仓库名.git
echo.
echo 3. 在下方粘贴您的仓库地址并按回车：

set /p repo_url="请输入仓库地址: "

if "%repo_url%"=="" (
    echo ❌ 仓库地址不能为空
    pause
    exit /b 1
)

echo.
echo 4. 设置远程仓库并推送代码...
git remote add origin %repo_url%
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ 代码已成功推送到GitHub！
    echo.
    echo 接下来请按照以下步骤在Render上部署：
    echo 1. 访问 Render Dashboard: https://dashboard.render.com
    echo 2. 点击 "New+" 按钮，选择 "Web Service"
    echo 3. 连接您的GitHub账户并选择刚刚推送的仓库
    echo 4. 按照SIMPLE-DEPLOY-GUIDE.md文件中的说明进行配置
    echo.
    echo 详细配置说明请查看项目中的 SIMPLE-DEPLOY-GUIDE.md 文件
) else (
    echo.
    echo ❌ 推送失败，请检查：
    echo 1. 网络连接是否正常
    echo 2. 仓库地址是否正确
    echo 3. 您是否有该仓库的推送权限
    echo.
    echo 如果您看到 "Authentication failed" 错误，请确保您有权限推送到该仓库
)

echo.
pause