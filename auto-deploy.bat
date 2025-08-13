@echo off
title TTKH Tourism System Deployment Script

echo TTKH Tourism System Deployment Script
echo ========================================

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed. Please install Git first.
    pause
    exit /b 1
)

echo SUCCESS: Git is installed

REM Check if current directory is a Git repository
if not exist ".git" (
    echo Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: TTKH Tourism System"
) else (
    echo Git repository already exists
)

echo.
echo Deployment Steps:
echo 1. Create a new repository on GitHub (e.g., ttkh-tourism-system)
echo 2. Push this local repository to your GitHub repository
echo 3. Connect your GitHub repository to Render.com for deployment
echo.
echo Specific commands to run (update with your GitHub username and repository name):
echo    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo Render Deployment Instructions:
echo 1. Visit https://dashboard.render.com
echo 2. Click 'New+' button, select 'Web Service'
echo 3. Connect your GitHub account and select the repository you just created
echo 4. Render will automatically detect the render.yaml file and configure deployment
echo 5. Click 'Create Web Service' to start deployment
echo.
echo After deployment is complete:
echo - Backend service will be deployed to something like https://your-app-name.onrender.com
echo - Frontend service will be deployed to something like https://your-app-name-frontend.onrender.com
echo.
echo Notes:
echo - Deployment process takes about 5-10 minutes
echo - After the first deployment, subsequent pushes will automatically trigger redeployment
echo - Free tier has 750 hours of runtime per month
echo.
pause