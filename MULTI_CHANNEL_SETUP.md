# 🌐 Multi-Channel Setup Guide

This guide will help you set up the AI chatbot to accept queries from multiple channels: Web, Mobile, WhatsApp, and Slack.

## 📊 **Supported Channels**

| Channel | Status | Features |
|---------|--------|----------|
| **🌐 Web** | ✅ Ready | Full features, voice messages, real-time chat |
| **📱 Mobile** | ✅ Ready | React Native app, offline support |
| **💬 WhatsApp** | ✅ Ready | Text messages, media support, templates |
| **💼 Slack** | ✅ Ready | Slash commands, mentions, interactive buttons |

## 🚀 **Quick Start**

### **1. Install Dependencies**

```bash
# Backend dependencies
cd backend
npm install @slack/web-api @slack/events-api

# Mobile app dependencies (optional)
cd ../mobile
npm install
```

### **2. Environment Configuration**

Update your `backend/.env` file:

```env
# WhatsApp Integration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_USER_ID=your_bot_user_id
SLACK_ESCALATION_CHANNEL=escalations
```

### **3. Start All Services**

```bash
# Start backend (supports all channels)
npm run dev

# Start mobile app (optional)
cd mobile && npm start
```

## 💬 **WhatsApp Integration Setup**

### **Step 1: Create WhatsApp Business Account**

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → Business → WhatsApp
3. Add WhatsApp product to your app

### **Step 2: Get Credentials**

1. **Access Token**: From WhatsApp → API Setup
2. **Phone Number ID**: From WhatsApp → API Setup  
3. **Verify Token**: Create a random string (e.g., `whatsapp_verify_123`)

### **Step 3: Configure Webhook**

1. **Webhook URL**: `https://your-domain.com/api/whatsapp/webhook`
2. **Verify Token**: Use the token from Step 2
3. **Subscribe to**: `messages`

### **Step 4: Test WhatsApp**

```bash
# Send test message to your WhatsApp number
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_PHONE_NUMBER",
    "type": "text",
    "text": {"body": "Hello from AI Chatbot!"}
  }'
```

## 💼 **Slack Integration Setup**

### **Step 1: Create Slack App**

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Choose app name and workspace

### **Step 2: Configure Bot**

1. **OAuth & Permissions**:
   - Add scopes: `chat:write`, `channels:read`, `users:read`
   - Install app to workspace
   - Copy "Bot User OAuth Token"

2. **Event Subscriptions**:
   - Enable events
   - Request URL: `https://your-domain.com/api/slack/events`
   - Subscribe to: `message.channels`, `app_mention`

3. **Slash Commands**:
   - Create `/chatbot` command
   - Request URL: `https://your-domain.com/api/slack/commands`

### **Step 3: Get Credentials**

1. **Bot Token**: From OAuth & Permissions (starts with `xoxb-`)
2. **Signing Secret**: From Basic Information
3. **Bot User ID**: From App Home

### **Step 4: Test Slack**

```bash
# Test in Slack
/chatbot Hello, how are you?

# Or mention the bot
@YourBot What's the weather like?
```

## 📱 **Mobile App Setup**

### **Step 1: Install Expo CLI**

```bash
npm install -g @expo/cli
```

### **Step 2: Start Mobile App**

```bash
cd mobile
npm install
expo start
```

### **Step 3: Test on Device**

1. **Install Expo Go** app on your phone
2. **Scan QR code** from terminal
3. **Test chat functionality**

### **Step 4: Build for Production**

```bash
# Android
expo build:android

# iOS (requires Apple Developer account)
expo build:ios
```

## 🔧 **Channel-Specific Features**

### **Web Channel**
```javascript
// Full feature support
- ✅ Rich text formatting
- ✅ Voice messages
- ✅ File uploads
- ✅ Real-time typing indicators
- ✅ Sentiment analysis display
- ✅ Escalation notifications
```

### **Mobile Channel**
```javascript
// Native mobile experience
- ✅ Offline message queuing
- ✅ Push notifications
- ✅ Native UI components
- ✅ Voice recording
- ✅ Camera integration
```

### **WhatsApp Channel**
```javascript
// WhatsApp-optimized
- ✅ Text messages
- ✅ Media messages (images, audio)
- ✅ Template messages
- ✅ Quick replies
- ❌ Rich formatting (limited)
```

### **Slack Channel**
```javascript
// Slack-optimized
- ✅ Slash commands
- ✅ Interactive buttons
- ✅ Rich text blocks
- ✅ Thread support
- ✅ Channel mentions
```

## 🧪 **Testing Multi-Channel**

### **Test Scenario 1: Cross-Channel Conversation**

1. **Start conversation on WhatsApp**: "I need help with my order"
2. **Continue on Slack**: `/chatbot What's my order status?`
3. **Finish on Web**: Login and check chat history
4. **Verify**: All messages appear in unified history

### **Test Scenario 2: Escalation Flow**

1. **Send negative message**: "I'm very frustrated with this service"
2. **Check escalation**: Should trigger on all channels
3. **Verify notifications**: Email and Slack alerts sent
4. **Test handoff**: Human agent can respond

### **Test Scenario 3: Channel-Specific Features**

```bash
# WhatsApp: Test media
Send image → Bot acknowledges media

# Slack: Test buttons
Send message → Click feedback buttons

# Web: Test voice
Record voice message → Bot processes

# Mobile: Test offline
Disconnect → Send message → Reconnect → Message delivered
```

## 📊 **Monitoring & Analytics**

### **Channel Usage Stats**

```javascript
// API endpoint: GET /api/chat/channel-stats
{
  "web": { "messages": 1250, "users": 45 },
  "mobile": { "messages": 890, "users": 32 },
  "whatsapp": { "messages": 567, "users": 23 },
  "slack": { "messages": 234, "users": 12 }
}
```

### **Performance Metrics**

- **Response Time**: < 2 seconds across all channels
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1% failed messages
- **User Satisfaction**: Track via feedback buttons

## 🔒 **Security Considerations**

### **WhatsApp Security**
- Webhook signature verification
- Rate limiting per phone number
- Message content filtering

### **Slack Security**
- Request signature verification
- OAuth token rotation
- Workspace-specific permissions

### **Mobile Security**
- JWT token authentication
- SSL/TLS encryption
- Biometric authentication (optional)

## 🚀 **Production Deployment**

### **Environment Variables**

```env
# Production URLs
FRONTEND_URL=https://your-domain.com
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook
SLACK_WEBHOOK_URL=https://your-domain.com/api/slack/events

# SSL Configuration
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### **Scaling Considerations**

- **Load Balancing**: Multiple server instances
- **Database**: MongoDB/PostgreSQL for high volume
- **Caching**: Redis for session management
- **CDN**: Static assets and media files

## 🆘 **Troubleshooting**

### **WhatsApp Issues**

**"Webhook verification failed"**
- Check WHATSAPP_VERIFY_TOKEN matches
- Ensure HTTPS is enabled
- Verify webhook URL is accessible

**"Messages not sending"**
- Check access token validity
- Verify phone number is verified
- Check rate limits

### **Slack Issues**

**"Events not received"**
- Verify signing secret
- Check event subscription URL
- Ensure bot has proper permissions

**"Slash commands not working"**
- Check command configuration
- Verify request URL
- Test bot permissions

### **Mobile Issues**

**"App won't connect"**
- Check API_URL in mobile config
- Verify backend is running
- Test network connectivity

---

**🌐 Multi-channel chatbot ready!** Users can now interact via Web, Mobile, WhatsApp, and Slack! 🚀
