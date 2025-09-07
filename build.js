#!/usr/bin/env node

/**
 * Build script for Render.com deployment
 * Builds frontend and copies to backend public folder
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...');

try {
  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('cd backend && npm install --production', { stdio: 'inherit' });

  // Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });

  // Build frontend
  console.log('🏗️ Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });

  // Create backend public directory
  const publicDir = path.join(__dirname, 'backend', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('📁 Created backend/public directory');
  }

  // Copy frontend build to backend public
  console.log('📁 Copying frontend build to backend...');
  const frontendDist = path.join(__dirname, 'frontend', 'dist');
  
  if (fs.existsSync(frontendDist)) {
    execSync(`cp -r ${frontendDist}/* ${publicDir}/`, { stdio: 'inherit' });
    console.log('✅ Frontend copied successfully');
  } else {
    throw new Error('Frontend dist directory not found');
  }

  // Verify files were copied
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html found in backend/public');
  } else {
    throw new Error('index.html not found after copy');
  }

  console.log('🎉 Build completed successfully!');
  console.log('🎯 Backend ready to serve frontend and API');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
