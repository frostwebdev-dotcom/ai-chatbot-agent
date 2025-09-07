#!/bin/bash

# Render.com Build Script for AI Chatbot
echo "🚀 Starting Render.com build process..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
npm run build

# Copy frontend build to backend public folder
echo "📁 Copying frontend build to backend..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

# Return to backend directory
cd ../backend

echo "✅ Build completed successfully!"
echo "🎯 Backend ready to serve frontend and API"
