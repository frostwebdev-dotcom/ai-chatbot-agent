# 🚀 Complete Setup Guide

This guide will walk you through setting up the AI Chatbot Demo from scratch.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** - VS Code recommended
- **Modern Browser** - Chrome, Firefox, or Edge

## 🔧 Step 1: Project Setup

### 1.1 Clone the Repository

```bash
git clone <your-repository-url>
cd chatbot
```

### 1.2 Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Or use the convenience script
npm run install-all
```

## 🔥 Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `ai-chatbot-demo`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Save changes

### 2.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (we'll add security rules later)
4. Select your preferred location
5. Click "Done"

### 2.4 Generate Service Account Key

1. Go to **Project Settings** (gear icon)
2. Click **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file
5. Keep this file secure - you'll need it for backend configuration

### 2.5 Get Firebase Config

1. In **Project Settings**, go to **General** tab
2. Scroll to "Your apps" section
3. Click **Web app** icon (`</>`)
4. Register app name: `chatbot-frontend`
5. Copy the config object - you'll need this for frontend

## 🤖 Step 3: OpenAI Setup

### 3.1 Create OpenAI Account

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key - you'll need this for backend

### 3.2 Set Up Billing (Required)

1. Go to **Billing** section
2. Add payment method
3. Set usage limits if desired

## 📧 Step 4: Email Setup (Optional)

For human escalation notifications:

### 4.1 Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

### 4.2 Alternative Email Services

You can use other email services by updating the `EMAIL_SERVICE` environment variable:
- `gmail` (default)
- `outlook`
- `yahoo`
- Custom SMTP settings

## ⚙️ Step 5: Environment Configuration

### 5.1 Backend Environment

Create `backend/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Firebase Admin SDK (from service account JSON)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5.2 Frontend Environment

Create `frontend/.env` file:

```env
# Firebase Configuration (from Firebase console)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL
VITE_API_URL=http://localhost:5000
```

## 🔒 Step 6: Firebase Security Rules

### 6.1 Deploy Firestore Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   cd firebase
   firebase init firestore
   ```

4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 6.2 Create Firestore Indexes

Deploy the indexes for optimal query performance:

```bash
firebase deploy --only firestore:indexes
```

## 🚀 Step 7: Running the Application

### 7.1 Development Mode

Start both frontend and backend:

```bash
# From project root
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:5173`

### 7.2 Individual Services

Run services separately:

```bash
# Backend only
npm run server

# Frontend only  
npm run client
```

## ✅ Step 8: Testing the Setup

### 8.1 Basic Functionality Test

1. Open `http://localhost:5173` in your browser
2. Create a new account with email/password
3. Send a test message: "Hello, how are you?"
4. Verify you receive an AI response

### 8.2 Feature Testing

Test each feature:

- **Authentication**: Sign up, login, logout
- **Chat**: Send messages, receive responses
- **Sentiment**: Try positive/negative messages
- **Language**: Switch between English/Spanish
- **Voice**: Click microphone (Chrome/Edge only)
- **Escalation**: Type "I need to speak to an agent"

### 8.3 Check Logs

Monitor the console for any errors:

```bash
# Backend logs
cd backend && npm run dev

# Frontend logs - check browser console
```

## 🔧 Troubleshooting

### Common Issues

**"Firebase Admin SDK not initialized"**
- Check all Firebase environment variables
- Ensure private key format is correct (with \n for line breaks)

**"OpenAI API Error"**
- Verify API key is correct
- Check billing is set up
- Ensure you have available credits

**"CORS Error"**
- Verify FRONTEND_URL in backend .env
- Check both servers are running

**"Voice input not working"**
- Use Chrome or Edge browser
- Allow microphone permissions
- Ensure HTTPS in production

### Debug Mode

Enable detailed logging:

```bash
# Backend debug mode
DEBUG=* npm run dev

# Check browser console for frontend logs
```

## 🌐 Step 9: Production Deployment

### 9.1 Render.com Backend Deployment

1. Create account at [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create new **Web Service**
4. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Add all backend environment variables
5. Deploy

### 9.2 Frontend Deployment Options

**Option A: Vercel**
1. Install Vercel CLI: `npm i -g vercel`
2. Build frontend: `cd frontend && npm run build`
3. Deploy: `vercel --prod`

**Option B: Render Static Site**
1. Build frontend: `cd frontend && npm run build`
2. Create new **Static Site** on Render
3. Upload `frontend/dist` folder

### 9.3 Update Environment Variables

For production, update:

```env
# Backend
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Frontend
VITE_API_URL=https://your-backend-domain.onrender.com
```

## 🎉 Congratulations!

Your AI Chatbot Demo is now ready! 

### Next Steps:
1. Customize the AI prompts in `backend/services/openaiService.js`
2. Add your own branding and styling
3. Implement additional features
4. Monitor usage and costs

### Support:
- Check the main README.md for detailed documentation
- Review the troubleshooting section
- Create GitHub issues for bugs or questions

Happy chatting! 🤖✨
