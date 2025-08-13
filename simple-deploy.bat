@echo off
chcp 437 >nul
title TTKH Tourism System - Simple Deploy Tool

echo ================================
echo TTKH Tourism System - Simple Deploy Tool
echo ================================

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed
    echo Please download and install Git from https://git-scm.com/downloads
    pause
    exit /b 1
)

echo Git is installed

REM Check if current directory is a Git repository
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: TTKH Tourism System"
    echo Git repository initialized
) else (
    echo Git repository already exists
)

echo.
echo What would you like to do?
echo 1. Push code to GitHub
echo 2. Deploy to Render (requires code to be pushed to GitHub first)
echo 3. Exit
echo.

choice /c 123 /m "Select an option"
if errorlevel 3 goto :exit
if errorlevel 2 goto :deploy_render
if errorlevel 1 goto :push_github

:push_github
echo.
echo Please follow these steps:
echo.
echo 1. If you don't have a GitHub repository yet, create a new one at:
echo    https://github.com/new
echo    Suggested repository name: ttkh-tourism-system
echo.
echo 2. After creating the repository, copy its HTTPS URL, for example:
echo    https://github.com/your-username/your-repo-name.git
echo.
echo 3. Paste your repository URL below and press Enter:

set /p repo_url="Enter repository URL: "

if "%repo_url%"=="" (
    echo Repository URL cannot be empty
    pause
    exit /b 1
)

echo.
echo Pushing code to GitHub...
git remote add origin %repo_url%
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo Code successfully pushed to GitHub!
    echo.
    echo You can now choose to deploy to Render
) else (
    echo.
    echo Push failed, please check:
    echo 1. Is your internet connection working?
    echo 2. Is the repository URL correct?
    echo 3. Do you have permission to push to this repository?
)

pause
goto :menu

:deploy_render
echo.
echo Deploying to Render...
echo.
echo Please follow these steps on the Render website:
echo.
echo 1. Go to Render Dashboard: https://dashboard.render.com
echo 2. Log in to your account (you can use your GitHub account)
echo 3. Click the "New+" button, then select "Web Service"
echo 4. Connect your GitHub account and select the repository you just pushed
echo.
echo Backend service configuration:
echo   - Name: ttkh-tourism-backend
echo   - Region: Singapore
echo   - Branch: main
echo   - Root Directory: (leave empty)
echo   - Environment: Node
echo   - Build Command: cd backend && npm install
echo   - Start Command: cd backend && npm start
echo.
echo Environment variables:
echo   - NODE_ENV: production
echo   - PORT: 10000
echo   - JWT_SECRET: ttkh-secret-key-2024-render-auto
echo   - DATABASE_URL: sqlite:./database.sqlite
echo.
echo 5. Click "Create Web Service"
echo.
echo Frontend service configuration:
echo 1. Click the "New+" button again, then select "Static Site"
echo 2. Select the same GitHub repository
echo.
echo Configuration:
echo   - Name: ttkh-tourism-frontend
echo   - Region: Singapore
echo   - Branch: main
echo   - Root Directory: frontend
echo   - Build Command: npm install && npm run build
echo   - Publish Directory: build
echo.
echo Environment variables:
echo   - REACT_APP_API_URL: https://ttkh-tourism-backend.onrender.com
echo     (Note: Update this to your actual backend URL after deployment)
echo.
echo 3. Click "Create Static Site"
echo.
echo After deployment is complete, check WHAT-TO-DO-NOW.md for next steps
pause
goto :menu

:menu
cls
echo ================================
echo TTKH Tourism System - Simple Deploy Tool
echo ================================

echo.
echo What would you like to do?
echo 1. Push code to GitHub
echo 2. Deploy to Render (requires code to be pushed to GitHub first)
echo 3. Exit
echo.

choice /c 123 /m "Select an option"
if errorlevel 3 goto :exit
if errorlevel 2 goto :deploy_render
if errorlevel 1 goto :push_github

:exit
echo.
echo Thank you for using the TTKH Tourism System Simple Deploy Tool!
echo.
pause