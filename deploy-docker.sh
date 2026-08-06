#!/bin/bash
# Docker deploy. Works identically on any host / any AWS account — the only
# host-specific thing is the .env file sitting next to this script.
#
# First run on a new box:
#   git clone <repo> && cd pharma-field-api
#   cp .env.example .env && nano .env        # fill in real values
#   ./deploy-docker.sh
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "❌ No .env file found. Copy .env.example to .env and fill it in first."
  exit 1
fi

echo "📦 Pulling latest code..."
git pull origin main

echo "🔨 Building image..."
docker compose build

echo "🔄 Restarting container..."
docker compose up -d

echo "⏳ Waiting for health check..."
for i in $(seq 1 30); do
  status=$(docker inspect --format='{{.State.Health.Status}}' pharma_field_api 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    echo "✅ Deployed and healthy on port ${PORT:-3000}"
    echo "📄 Logs: docker compose logs -f api"
    exit 0
  fi
  if [ "$status" = "unhealthy" ]; then
    echo "❌ Container is unhealthy. Recent logs:"
    docker compose logs --tail=50 api
    exit 1
  fi
  sleep 5
done

echo "⚠️  Timed out waiting for health check. Recent logs:"
docker compose logs --tail=50 api
exit 1
