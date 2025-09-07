#!/bin/bash

# Build script for frontend static site deployment
echo "🚀 Building frontend for static deployment..."

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build the project
echo "🏗️ Building frontend..."
npm run build

echo "✅ Frontend build complete!"
echo "📁 Built files are in dist/ directory"
