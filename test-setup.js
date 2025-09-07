#!/usr/bin/env node

/**
 * Setup Test Script
 * Verifies that all required dependencies and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 AI Chatbot Setup Test\n');

const tests = [];
let passed = 0;
let failed = 0;

// Test helper function
function test(name, condition, errorMsg = '') {
  tests.push({ name, condition, errorMsg });
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${errorMsg ? ': ' + errorMsg : ''}`);
    failed++;
  }
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
test('Node.js version >= 18', majorVersion >= 18, `Found ${nodeVersion}, need >= 18`);

// Check project structure
test('Root package.json exists', fs.existsSync('package.json'));
test('Backend directory exists', fs.existsSync('backend'));
test('Frontend directory exists', fs.existsSync('frontend'));
test('Backend package.json exists', fs.existsSync('backend/package.json'));
test('Frontend package.json exists', fs.existsSync('frontend/package.json'));

// Check main files
test('Backend server.js exists', fs.existsSync('backend/server.js'));
test('Frontend index.html exists', fs.existsSync('frontend/index.html'));
test('Frontend main.jsx exists', fs.existsSync('frontend/src/main.jsx'));

// Check environment files
test('Root .env.example exists', fs.existsSync('.env.example'));
test('Frontend .env.example exists', fs.existsSync('frontend/.env.example'));

// Check if environment files are configured
const backendEnvExists = fs.existsSync('backend/.env');
const frontendEnvExists = fs.existsSync('frontend/.env');

test('Backend .env configured', backendEnvExists, 'Copy .env.example to backend/.env and configure');
test('Frontend .env configured', frontendEnvExists, 'Copy frontend/.env.example to frontend/.env and configure');

// Check environment variables if files exist
if (backendEnvExists) {
  const backendEnv = fs.readFileSync('backend/.env', 'utf8');
  test('OPENAI_API_KEY configured', backendEnv.includes('OPENAI_API_KEY=sk-'), 'Add your OpenAI API key');
  test('FIREBASE_PROJECT_ID configured', backendEnv.includes('FIREBASE_PROJECT_ID=') && !backendEnv.includes('your_firebase_project_id'), 'Add your Firebase project ID');
}

if (frontendEnvExists) {
  const frontendEnv = fs.readFileSync('frontend/.env', 'utf8');
  test('VITE_FIREBASE_API_KEY configured', frontendEnv.includes('VITE_FIREBASE_API_KEY=') && !frontendEnv.includes('your_firebase_api_key'), 'Add your Firebase API key');
}

// Check if node_modules exist
test('Root node_modules exists', fs.existsSync('node_modules'));
test('Backend node_modules exists', fs.existsSync('backend/node_modules'));
test('Frontend node_modules exists', fs.existsSync('frontend/node_modules'));

// Check key dependencies
try {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  test('Backend has express dependency', backendPkg.dependencies && backendPkg.dependencies.express);
  test('Backend has socket.io dependency', backendPkg.dependencies && backendPkg.dependencies['socket.io']);
  test('Backend has openai dependency', backendPkg.dependencies && backendPkg.dependencies.openai);
  test('Backend has firebase-admin dependency', backendPkg.dependencies && backendPkg.dependencies['firebase-admin']);
} catch (e) {
  test('Backend package.json is valid JSON', false, 'Invalid JSON in backend/package.json');
}

try {
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  test('Frontend has react dependency', frontendPkg.dependencies && frontendPkg.dependencies.react);
  test('Frontend has socket.io-client dependency', frontendPkg.dependencies && frontendPkg.dependencies['socket.io-client']);
  test('Frontend has firebase dependency', frontendPkg.dependencies && frontendPkg.dependencies.firebase);
} catch (e) {
  test('Frontend package.json is valid JSON', false, 'Invalid JSON in frontend/package.json');
}

// Check Firebase configuration
test('Firebase directory exists', fs.existsSync('firebase'));
test('Firestore rules exist', fs.existsSync('firebase/firestore.rules'));
test('Firebase config exists', fs.existsSync('firebase/firebase.json'));

// Summary
console.log('\n📊 Test Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📝 Total: ${tests.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Your setup looks good.');
  console.log('\n🚀 Next steps:');
  console.log('1. Configure your environment variables');
  console.log('2. Run: npm run install-all');
  console.log('3. Run: npm run dev');
  console.log('4. Open http://localhost:5173');
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above before proceeding.');
  console.log('\n📖 Check SETUP_GUIDE.md for detailed instructions.');
}

console.log('\n🔗 Useful commands:');
console.log('npm run install-all  # Install all dependencies');
console.log('npm run dev          # Start development servers');
console.log('npm run server       # Start backend only');
console.log('npm run client       # Start frontend only');

process.exit(failed > 0 ? 1 : 0);
