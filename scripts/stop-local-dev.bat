@echo off
REM StackPro Local Development Stop Script (Windows)

echo 🛑 Stopping StackPro Local Development Environment...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Nothing to stop.
    pause
    exit /b 1
)

REM Stop the services
if "%1"=="--cleanup" goto cleanup
if "%1"=="-c" goto cleanup

echo Stopping services (keeping data)...
docker-compose -f docker-compose.dev.yml down
goto end

:cleanup
echo Stopping services and removing all data (volumes)...
docker-compose -f docker-compose.dev.yml down -v
echo Removing unused Docker resources...
docker system prune -f

:end
echo.
echo ✅ StackPro development environment stopped.
echo.
echo 🚀 To start again: scripts\start-local-dev.bat
echo 🗑️ To cleanup all data: scripts\stop-local-dev.bat --cleanup
pause
