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
sleep 20

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
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Health check passed"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⏳ Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in 3 seconds..."
        sleep 3
    else
        echo "❌ Health check failed after $MAX_RETRIES attempts"
        docker compose logs backend --tail 20
        exit 1
    fi
done

echo "🎉 Deployment completed successfully!"
echo "🌐 Site is live at: http://welbeing.mindinroot.com"
