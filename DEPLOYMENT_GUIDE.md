# 🚀 Deployment Guide - Render.com

This guide covers deploying your AI Chatbot to Render.com for production use.

## 📋 Prerequisites

- Completed local development setup
- GitHub repository with your code
- Render.com account (free tier available)
- Production environment variables ready

## 🔧 Step 1: Prepare for Deployment

### 1.1 Update Package.json Scripts

Ensure your `backend/package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 1.2 Environment Variables Checklist

Prepare these environment variables for production:

**Backend Environment Variables:**
```env
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=your_openai_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 1.3 Create Production Build Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "build": "cd frontend && npm run build",
    "start": "cd backend && npm start",
    "postinstall": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

## 🌐 Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name**: `ai-chatbot-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

**Build & Deploy:**
- **Root Directory**: Leave empty (or specify if different)
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

### 2.2 Add Environment Variables

In the Render dashboard, go to **Environment** tab and add all backend environment variables:

1. Click **"Add Environment Variable"**
2. Add each variable from your production list
3. For `FIREBASE_PRIVATE_KEY`, ensure proper formatting with `\n` for line breaks

**Important Notes:**
- `PORT` will be automatically set by Render (usually 10000)
- `FRONTEND_URL` should be your frontend domain (set this after frontend deployment)

### 2.3 Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Note your backend URL: `https://your-service-name.onrender.com`

### 2.4 Test Backend Deployment

Test the health endpoint:
```bash
curl https://your-backend-url.onrender.com/health
```

Expected response:
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z"}
```

## 🎨 Step 3: Deploy Frontend

### Option A: Vercel (Recommended)

#### 3.1 Install Vercel CLI
```bash
npm install -g vercel
```

#### 3.2 Build and Deploy
```bash
cd frontend
npm run build
vercel --prod
```

#### 3.3 Configure Environment Variables
In Vercel dashboard, add frontend environment variables:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=https://your-backend-url.onrender.com
```

### Option B: Render Static Site

#### 3.1 Build Frontend Locally
```bash
cd frontend
npm run build
```

#### 3.2 Create Static Site
1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Connect your repository
3. Configure:
   - **Name**: `ai-chatbot-frontend`
   - **Build Command**: `cd frontend && npm run build`
   - **Publish Directory**: `frontend/dist`

#### 3.3 Add Environment Variables
Add the same frontend environment variables as above.

## 🔗 Step 4: Connect Frontend and Backend

### 4.1 Update Backend CORS

Update your backend's `FRONTEND_URL` environment variable with your frontend domain:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 4.2 Update Frontend API URL

Ensure your frontend's `VITE_API_URL` points to your backend:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### 4.3 Redeploy Services

After updating environment variables:
1. Redeploy backend service in Render
2. Redeploy frontend (automatic if using Vercel)

## 🔒 Step 5: Security Configuration

### 5.1 Update Firebase Security Rules

Deploy production-ready Firestore rules:

```bash
cd firebase
firebase deploy --only firestore:rules
```

### 5.2 Configure CORS for Production

Ensure your backend CORS configuration allows your production frontend:

```javascript
// In backend/server.js
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true
}));
```

### 5.3 Enable HTTPS

Both Render and Vercel provide HTTPS by default. Ensure all URLs use `https://`.

## 📊 Step 6: Monitoring and Logging

### 6.1 Render Monitoring

- View logs in Render dashboard
- Set up alerts for service downtime
- Monitor resource usage

### 6.2 Application Monitoring

Add basic monitoring to your backend:

```javascript
// In backend/server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 6.3 Error Tracking

Consider adding error tracking services:
- Sentry for error monitoring
- LogRocket for user session recording
- Google Analytics for usage tracking

## 🧪 Step 7: Production Testing

### 7.1 Functionality Testing

Test all features in production:

1. **Authentication**: Sign up, login, logout
2. **Chat**: Send messages, receive AI responses
3. **Real-time**: Multiple browser tabs
4. **Voice Input**: Test in supported browsers
5. **Language Switching**: English/Spanish
6. **Escalation**: Trigger human escalation

### 7.2 Performance Testing

- Test with multiple concurrent users
- Monitor response times
- Check memory usage
- Verify database performance

### 7.3 Mobile Testing

Test on various devices:
- iOS Safari
- Android Chrome
- Different screen sizes
- Touch interactions

## 🔧 Step 8: Troubleshooting Production Issues

### Common Production Issues

**"Service Unavailable" Error**
- Check Render service status
- Verify environment variables
- Check application logs

**CORS Errors**
- Verify FRONTEND_URL is correct
- Check CORS configuration
- Ensure HTTPS is used

**Database Connection Issues**
- Verify Firebase credentials
- Check Firestore security rules
- Monitor Firebase usage quotas

**OpenAI API Errors**
- Check API key validity
- Monitor usage limits
- Verify billing status

### Debug Production Issues

**View Render Logs:**
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. Filter by error level

**Test API Endpoints:**
```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-backend-url.onrender.com/api/auth/profile
```

## 📈 Step 9: Scaling and Optimization

### 9.1 Performance Optimization

- Enable gzip compression
- Implement caching strategies
- Optimize database queries
- Use CDN for static assets

### 9.2 Scaling Options

**Render Scaling:**
- Upgrade to paid plans for better performance
- Enable auto-scaling
- Use multiple regions

**Database Scaling:**
- Monitor Firestore usage
- Optimize queries with indexes
- Consider read replicas

### 9.3 Cost Optimization

- Monitor OpenAI API usage
- Implement rate limiting
- Cache frequent responses
- Use Firebase free tier efficiently

## ✅ Step 10: Go Live Checklist

Before announcing your chatbot:

- [ ] All features tested in production
- [ ] Error monitoring set up
- [ ] Performance benchmarks established
- [ ] Security review completed
- [ ] Backup and recovery plan in place
- [ ] User documentation updated
- [ ] Support processes defined

## 🎉 Congratulations!

Your AI Chatbot is now live in production! 

### Next Steps:
1. Monitor usage and performance
2. Gather user feedback
3. Plan feature enhancements
4. Scale based on demand

### Support Resources:
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

Happy deploying! 🚀
