#!/bin/bash

# StackPro Local Development Startup Script
# This script sets up and starts the complete local development environment

set -e

echo "🚀 Starting StackPro Local Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.dev .env.local
    echo "✅ Created .env.local - you can edit this file to customize your environment"
    echo ""
fi

# Check if we need to rebuild (if this is first run or Dockerfiles changed)
REBUILD=""
if [ "$1" == "--rebuild" ] || [ "$1" == "-r" ]; then
    REBUILD="--build"
    echo "🔨 Forcing rebuild of Docker images..."
elif [ ! "$(docker images -q stackpro_frontend 2> /dev/null)" ]; then
    REBUILD="--build"
    echo "🔨 Building Docker images for first time..."
fi

# Start the development environment
echo "🐳 Starting Docker services..."
echo ""

if [ "$2" == "--detach" ] || [ "$2" == "-d" ]; then
    docker-compose -f docker-compose.dev.yml up -d $REBUILD
    echo ""
    echo "🎉 StackPro development environment started in background!"
    echo ""
    echo "📊 Service Status:"
    docker-compose -f docker-compose.dev.yml ps
else
    echo "Starting in foreground mode (press Ctrl+C to stop)..."
    echo "Use --detach or -d to run in background"
    echo ""
    docker-compose -f docker-compose.dev.yml up $REBUILD
fi

echo ""
echo "🌐 Access your services:"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:3002/health"
echo "  pgAdmin:     http://localhost:8080"
echo "    Login: admin@stackpro.local / admin123"
echo ""
echo "📚 View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "Happy coding! 🚀"
