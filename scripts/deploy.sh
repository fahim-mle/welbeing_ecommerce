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

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker compose ps

echo "🎉 Deployment completed successfully!"
echo "🌐 Site is live at: http://welbeing.mindinroot.com"
