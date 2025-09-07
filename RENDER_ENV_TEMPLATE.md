# 🔐 Render.com Environment Variables Template

Copy these environment variables to your Render.com dashboard.

## 📋 **Required Variables**

### **Core Application**
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app-name.onrender.com
```

### **OpenAI Integration (REQUIRED)**
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### **Firebase Configuration (REQUIRED)**
Get these from Firebase Console → Project Settings → Service Accounts:

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-private-key-content-here
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_CLIENT_ID=your-client-id
```

## 📧 **Optional: Email Notifications**
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-support@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## 💬 **Optional: WhatsApp Integration**
```
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
```

## 💼 **Optional: Slack Integration**
```
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your-slack-signing-secret
SLACK_BOT_USER_ID=your-slack-bot-user-id
SLACK_ESCALATION_CHANNEL=escalations
```

## ⚙️ **Optional: Rate Limiting**
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔍 **How to Get These Values**

### **Firebase Configuration**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings (gear icon)
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Download the JSON file
7. Extract values from the JSON:
   ```json
   {
     "project_id": "your-project-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "firebase-adminsdk-...@your-project.iam.gserviceaccount.com",
     "private_key_id": "your-private-key-id",
     "client_id": "your-client-id"
   }
   ```

### **OpenAI API Key**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Go to API Keys section
3. Create new secret key
4. Copy the key (starts with `sk-`)

### **Gmail App Password**
1. Enable 2-factor authentication on Gmail
2. Go to Google Account settings
3. Security → 2-Step Verification → App passwords
4. Generate app password for "Mail"
5. Use this password (not your regular Gmail password)

### **WhatsApp Business API**
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create WhatsApp Business app
3. Get access token from WhatsApp → API Setup
4. Get phone number ID from WhatsApp → API Setup
5. Create custom verify token (any random string)

### **Slack Bot**
1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app
3. Get Bot User OAuth Token from OAuth & Permissions
4. Get Signing Secret from Basic Information
5. Get Bot User ID from App Home

---

## ⚠️ **Security Notes**

1. **Never commit these values to GitHub**
2. **Only add them in Render dashboard**
3. **Use strong, unique tokens**
4. **Rotate keys regularly**
5. **Monitor usage and costs**

## 🎯 **Minimum Required for Basic Functionality**

For a basic deployment, you only need:
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app-name.onrender.com
OPENAI_API_KEY=sk-your-key
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY="your-key"
FIREBASE_CLIENT_EMAIL=your-email
```

Add other integrations as needed!
