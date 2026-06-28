#!/bin/bash
set -e

echo "🚀 Deploying pharma-field-api..."

echo "📦 Pulling latest code..."
git pull origin main

echo "📚 Installing dependencies..."
npm install

echo "🗑️  Cleaning old build..."
rm -rf dist

echo "🔄 Restarting server..."
# Kill existing process on port 3000 if running
PID=$(lsof -ti:3000) && kill $PID && echo "Killed existing process ($PID)" || echo "No existing process on port 3000"

sleep 1

echo "▶️  Starting server..."
nohup npm run start > app.log 2>&1 &

echo "✅ Deployed! Server running on port 3000"
echo "📄 Logs: tail -f app.log"
