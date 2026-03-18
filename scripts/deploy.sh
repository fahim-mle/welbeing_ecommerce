#!/bin/bash
set -e

echo "🚀 Starting deployment to Hetzner VPS..."

# Configuration
DEPLOY_PATH="/root/workspace/welbeing_ecommerce"
BRANCH="001-health-wellbeing-store"

# Navigate to project directory
cd "$DEPLOY_PATH"

# Pull latest code
echo "📥 Pulling latest code from $BRANCH..."
git fetch origin
git reset --hard origin/$BRANCH

# Rebuild and restart containers
echo "🐳 Rebuilding and restarting Docker containers..."
docker compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if backend is running
if docker compose ps backend | grep -q "Up"; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start"
    docker compose logs backend --tail 50
    exit 1
fi

# Check if frontend is running
if docker compose ps frontend | grep -q "Up"; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend failed to start"
    docker compose logs frontend --tail 50
    exit 1
fi

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 5
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Site is live at: http://welbeing.mindinroot.com"
