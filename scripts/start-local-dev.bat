@echo off
REM StackPro Local Development Startup Script (Windows)
REM This script sets up and starts the complete local development environment

echo 🚀 Starting StackPro Local Development Environment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install Docker Compose and try again.
    pause
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local from template...
    copy .env.dev .env.local >nul
    echo ✅ Created .env.local - you can edit this file to customize your environment
    echo.
)

REM Check if we need to rebuild
set REBUILD=
if "%1"=="--rebuild" set REBUILD=--build
if "%1"=="-r" set REBUILD=--build

if "%REBUILD%"=="--build" (
    echo 🔨 Rebuilding Docker images...
)

REM Start the development environment
echo 🐳 Starting Docker services...
echo.

if "%2"=="--detach" goto detached
if "%2"=="-d" goto detached

echo Starting in foreground mode (press Ctrl+C to stop)...
echo Use --detach or -d to run in background
echo.
docker-compose -f docker-compose.dev.yml up %REBUILD%
goto end

:detached
docker-compose -f docker-compose.dev.yml up -d %REBUILD%
echo.
echo 🎉 StackPro development environment started in background!
echo.
echo 📊 Service Status:
docker-compose -f docker-compose.dev.yml ps

:end
echo.
echo 🌐 Access your services:
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:3002/health
echo   pgAdmin:     http://localhost:8080
echo     Login: admin@stackpro.local / admin123
echo.
echo 📚 View logs: docker-compose -f docker-compose.dev.yml logs -f
echo 🛑 Stop services: docker-compose -f docker-compose.dev.yml down
echo.
echo Happy coding! 🚀
pause
