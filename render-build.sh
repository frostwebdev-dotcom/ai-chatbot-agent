#!/bin/bash

# Render.com Build Script for AI Chatbot
echo "🚀 Starting Render.com build process..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend using npx to ensure vite is found
echo "🏗️ Building frontend with Vite..."
npx vite build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - dist directory not found"
    exit 1
fi

echo "📁 Listing dist contents..."
ls -la dist/

# Copy frontend build to backend public folder
echo "📁 Copying frontend build to backend..."
mkdir -p ../backend/public
cp -r dist/* ../backend/public/

# Verify copy was successful
echo "📁 Verifying backend/public contents..."
ls -la ../backend/public/

# Return to backend directory
cd ../backend

echo "✅ Build completed successfully!"
echo "🎯 Backend ready to serve frontend and API"
