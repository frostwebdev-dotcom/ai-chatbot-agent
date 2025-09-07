# 🤖 AI Chatbot Demo

A full-stack AI-powered chatbot with sentiment analysis, multilingual support, and human escalation capabilities.

## ✨ Features

- **🧠 AI-Powered Responses**: OpenAI GPT-3.5 integration with context-aware responses
- **😊 Sentiment Analysis**: Real-time emotion detection and empathetic responses
- **🌍 Multilingual Support**: English and Spanish with auto-detection
- **🎤 Voice Input**: Speech-to-text functionality (browser-supported)
- **🎵 Voice Messages**: Record, send, and play voice messages with waveform visualization
- **🌐 Multi-Channel Support**: Web, Mobile, WhatsApp, and Slack integrations
- **👨‍💼 Human Escalation**: Automatic escalation to human agents for complex issues
- **🔐 Authentication**: Firebase Authentication with email/password
- **💾 Data Persistence**: Firestore database for chat history and user profiles
- **⚡ Real-time Chat**: Socket.IO for instant messaging
- **📱 Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🏗️ Architecture

```
Frontend (React + Vite)     Backend (Node.js + Express)     External Services
├── Web Interface           ├── Socket.IO Server            ├── OpenAI API
├── Voice Messages          ├── REST API                    ├── Firebase Auth
├── Real-time Chat          ├── AI Integration              ├── Firestore DB
└── Authentication          ├── WhatsApp Integration        ├── WhatsApp API
                            ├── Slack Integration           ├── Slack API
Mobile App (React Native)   └── Email Service               └── Email Service
├── Native Chat UI
├── Offline Support
├── Push Notifications
└── Voice Recording
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- OpenAI API key
- Email account (for escalations)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd chatbot
npm run install-all
```

### 2. Environment Setup

Copy environment files and configure:

```bash
# Backend environment
cp .env.example .env

# Frontend environment  
cp frontend/.env.example frontend/.env
```

### 3. Configure Services

#### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Generate service account key
5. Update environment variables

#### OpenAI Setup
1. Get API key from https://platform.openai.com
2. Add to backend `.env` file

### 4. Run Development

```bash
# Start both frontend and backend
npm run dev

# Or run separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 5173
```

## 📋 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
```

### Frontend (frontend/.env)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

## 🧪 Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] User registration
   - [ ] User login/logout
   - [ ] Profile creation

2. **Chat Functionality**
   - [ ] Send text messages
   - [ ] Receive AI responses
   - [ ] Real-time updates
   - [ ] Message history

3. **AI Features**
   - [ ] Sentiment analysis
   - [ ] Language detection
   - [ ] Context-aware responses
   - [ ] Escalation triggers

4. **Voice Features** (Chrome/Edge)
   - [ ] Voice recording (speech-to-text)
   - [ ] Voice messages (audio recording)
   - [ ] Voice message playback
   - [ ] Language support

5. **Multilingual Support**
   - [ ] English responses
   - [ ] Spanish responses
   - [ ] Language switching

### Test Scenarios

#### Positive Sentiment
```
User: "I love this service! It's amazing!"
Expected: Enthusiastic, positive response
```

#### Negative Sentiment + Escalation
```
User: "I'm frustrated, I need to speak to a human agent"
Expected: Empathetic response + escalation email
```

#### Spanish Language
```
User: "Hola, necesito ayuda con mi pedido"
Expected: Spanish response with helpful information
```

#### Voice Message Testing
```
1. Click the 🔊 voice message button
2. Allow microphone permissions
3. Record a test message (5-10 seconds)
4. Preview and send the voice message
5. Verify voice message appears in chat
6. Test playback functionality
7. Try downloading the voice message
```

## 🚀 Deployment

### Render.com Deployment

#### Backend Deployment
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure build and start commands:
   ```
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```
4. Add environment variables in Render dashboard
5. Deploy

#### Frontend Deployment
1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```
2. Deploy `frontend/dist` to Render Static Site or Vercel

### Environment Variables for Production

Update these for production deployment:

```env
# Backend
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
PORT=10000  # Render assigns this automatically

# Frontend
VITE_API_URL=https://your-backend-domain.onrender.com
```

## 📁 Project Structure

```
chatbot/
├── backend/                 # Node.js backend
│   ├── config/             # Firebase configuration
│   ├── middleware/         # Authentication middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── config/         # Firebase config
│   │   └── main.jsx        # Entry point
│   └── public/             # Static assets
├── firebase/               # Firebase configuration
│   ├── firestore.rules     # Security rules
│   └── firestore.indexes.json
└── docs/                   # Additional documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/profile` - Create/update user profile
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/preferences` - Update preferences
- `DELETE /api/auth/account` - Delete account

### Chat
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/stats` - Get user statistics
- `POST /api/chat/test` - Test AI response
- `DELETE /api/chat/history` - Clear chat history
- `GET /api/chat/export` - Export chat data

### WebSocket Events
- `chat_message` - Send text/voice message to AI
- `bot_response` - Receive AI response
- `voice_message` - Send voice message
- `escalation_alert` - Human escalation notification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting guide below
2. Search existing GitHub issues
3. Create a new issue with detailed information

## 🔍 Troubleshooting

### Common Issues

**Firebase Connection Error**
- Verify all Firebase environment variables
- Check Firebase project settings
- Ensure Firestore is enabled

**OpenAI API Error**
- Verify API key is correct
- Check API usage limits
- Ensure billing is set up

**Voice Input Not Working**
- Use Chrome or Edge browser
- Allow microphone permissions
- Check HTTPS requirement for production

**Socket.IO Connection Failed**
- Verify backend is running
- Check CORS configuration
- Confirm WebSocket support

### Debug Mode

Enable debug logging:
```bash
# Backend
DEBUG=* npm run dev

# Check browser console for frontend logs
```

## 🎯 Next Steps

- [ ] Add more languages
- [ ] Implement file upload
- [ ] Add chat analytics dashboard
- [ ] Mobile app with React Native
- [ ] Integration with CRM systems
- [ ] Advanced AI training with custom data

---

**Made with ❤️ for AI chatbot enthusiasts**
