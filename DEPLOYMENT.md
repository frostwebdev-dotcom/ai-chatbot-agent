# 🚀 Render.com Deployment Guide

This guide will help you deploy the AI Chatbot to Render.com with proper security practices.

## 🔒 **Security First - What NOT to Commit**

**❌ NEVER commit these files to GitHub:**
- `.env` files
- `firebase-adminsdk-*.json` 
- `serviceAccountKey.json`
- Any files containing API keys or secrets

**✅ These are already in .gitignore - you're safe!**

## 📋 **Pre-Deployment Checklist**

### **1. Prepare Your Repository**
```bash
# Make sure sensitive files are not tracked
git status
# Should NOT show any .env files or service account keys

# Add all changes
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### **2. Gather Your Environment Variables**
You'll need these values for Render:

```env
# Required - Core Services
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app-name.onrender.com

# Required - OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Required - Firebase (from your Firebase project settings)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_CLIENT_ID=your-client-id

# Optional - Email Notifications
EMAIL_SERVICE=gmail
EMAIL_USER=your-support@gmail.com
EMAIL_PASS=your-app-password

# Optional - WhatsApp Integration
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Optional - Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_BOT_USER_ID=your-bot-user-id
SLACK_ESCALATION_CHANNEL=escalations

# Optional - Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 **Render.com Deployment Steps**

### **Step 1: Create Render Account**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Connect your GitHub repository

### **Step 2: Create New Web Service**
1. **Click "New +"** → **"Web Service"**
2. **Connect Repository**: Select your chatbot repository
3. **Configure Service**:
   ```
   Name: ai-chatbot (or your preferred name)
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: chmod +x render-build.sh && ./render-build.sh
   Start Command: cd backend && npm start
   ```

### **Step 3: Configure Environment Variables**
In Render dashboard → Environment:

**⚠️ IMPORTANT: Add these ONE BY ONE in Render dashboard**

```bash
# Core Settings
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app-name.onrender.com

# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-your-actual-key-here

# Firebase (REQUIRED - get from Firebase Console)
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-actual-private-key-here
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your-actual-private-key-id
FIREBASE_CLIENT_ID=your-actual-client-id

# Email (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-support@gmail.com
EMAIL_PASS=your-app-password

# WhatsApp (Optional)
WHATSAPP_ACCESS_TOKEN=your-token
WHATSAPP_PHONE_NUMBER_ID=your-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Slack (Optional)
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
SLACK_BOT_USER_ID=your-bot-id
SLACK_ESCALATION_CHANNEL=escalations
```

### **Step 4: Deploy**
1. **Click "Create Web Service"**
2. **Wait for build** (5-10 minutes)
3. **Check logs** for any errors
4. **Visit your app** at `https://your-app-name.onrender.com`

## 🔧 **Post-Deployment Configuration**

### **1. Update Frontend URL**
After deployment, update the environment variable:
```
FRONTEND_URL=https://your-actual-app-name.onrender.com
```

### **2. Configure Webhooks**
Update webhook URLs in external services:

**WhatsApp:**
```
Webhook URL: https://your-app-name.onrender.com/api/whatsapp/webhook
```

**Slack:**
```
Event Subscriptions: https://your-app-name.onrender.com/api/slack/events
Slash Commands: https://your-app-name.onrender.com/api/slack/commands
```

### **3. Test Deployment**
```bash
# Test API health
curl https://your-app-name.onrender.com/health

# Test chat API
curl -X POST https://your-app-name.onrender.com/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## 🐛 **Troubleshooting**

### **Build Failures**

**Error: "Permission denied"**
```bash
# Fix: Make build script executable
chmod +x render-build.sh
git add render-build.sh
git commit -m "Make build script executable"
git push
```

**Error: "Module not found"**
```bash
# Fix: Check package.json dependencies
# Ensure all required packages are in dependencies, not devDependencies
```

### **Runtime Errors**

**Error: "Firebase Admin SDK error"**
```bash
# Fix: Check Firebase environment variables
# Ensure FIREBASE_PRIVATE_KEY includes \n characters
# Ensure all Firebase variables are set correctly
```

**Error: "OpenAI API error"**
```bash
# Fix: Check OpenAI API key
# Ensure OPENAI_API_KEY is set correctly
# Check OpenAI account has credits
```

### **Frontend Not Loading**

**Error: "Cannot GET /"**
```bash
# Fix: Check build process
# Ensure frontend builds correctly
# Check if files are copied to backend/public
```

## 📊 **Monitoring**

### **Render Dashboard**
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory usage
- **Events**: Track deployments and restarts

### **Health Checks**
```bash
# API Health
GET https://your-app-name.onrender.com/health

# Chat Test
POST https://your-app-name.onrender.com/api/chat/test
```

## 🔄 **Updates & Redeployment**

### **Automatic Deployment**
Render automatically redeploys when you push to main branch:

```bash
git add .
git commit -m "Update chatbot features"
git push origin main
# Render will automatically redeploy
```

### **Manual Deployment**
In Render dashboard:
1. Go to your service
2. Click "Manual Deploy"
3. Select branch and deploy

## 💰 **Cost Optimization**

### **Free Tier Limits**
- **750 hours/month** (enough for 24/7)
- **Sleeps after 15 minutes** of inactivity
- **Cold start delay** (~30 seconds)

### **Upgrade Considerations**
- **Starter Plan ($7/month)**: No sleep, faster builds
- **Standard Plan ($25/month)**: More resources, better performance

## 🔐 **Security Best Practices**

### **Environment Variables**
- ✅ Use Render's environment variables
- ❌ Never commit secrets to GitHub
- ✅ Rotate API keys regularly
- ✅ Use least-privilege access

### **HTTPS**
- ✅ Render provides free SSL certificates
- ✅ All traffic is encrypted
- ✅ Webhooks work with HTTPS

### **Monitoring**
- ✅ Monitor logs for errors
- ✅ Set up alerts for failures
- ✅ Track API usage and costs

## 🎯 **Success Checklist**

After deployment, verify:

- [ ] **App loads** at your Render URL
- [ ] **Chat interface** works
- [ ] **AI responses** are generated
- [ ] **Voice messages** work (if enabled)
- [ ] **Authentication** works
- [ ] **Database** connections work
- [ ] **Email notifications** work (if configured)
- [ ] **WhatsApp** integration works (if configured)
- [ ] **Slack** integration works (if configured)
- [ ] **Error handling** works properly

## 🆘 **Support**

If you encounter issues:

1. **Check Render logs** in dashboard
2. **Review environment variables**
3. **Test API endpoints** individually
4. **Check external service configurations**
5. **Contact Render support** if needed

---

**🚀 Your AI Chatbot is now live on Render.com!** 🎉
