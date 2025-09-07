const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeFirebase } = require('./config/firebase');
const { handleChatMessage } = require('./services/chatService');
const { authenticateSocket } = require('./middleware/auth');

// Multi-channel integrations
const whatsappIntegration = require('./integrations/whatsapp');
const slackIntegration = require('./integrations/slack');

const app = express();
const server = http.createServer(app);

// Initialize Firebase
initializeFirebase();

// Security middleware - disable CSP for Firebase compatibility
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow Firebase
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json());

// Serve static files from frontend build (for production)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'public')));
}

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Socket authentication middleware
io.use(authenticateSocket);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  socket.join(`user_${socket.userId}`);

  socket.on('chat_message', async (data) => {
    try {
      // Check if this is a voice message
      const isVoiceMessage = data.type === 'voice';

      const response = await handleChatMessage({
        userId: socket.userId,
        message: isVoiceMessage ? null : data.message,
        language: data.language || 'en',
        isVoiceMessage,
        voiceData: isVoiceMessage ? data : null
      });

      // Send response back to user
      socket.emit('bot_response', response);

      // If escalation needed, notify admin
      if (response.escalated) {
        io.to('admin_room').emit('escalation_alert', {
          userId: socket.userId,
          message: isVoiceMessage ? 'Voice message' : data.message,
          timestamp: new Date().toISOString(),
          isVoiceMessage
        });
      }
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('error', { message: 'Sorry, something went wrong. Please try again.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));

// Multi-channel integration routes
app.use('/api/whatsapp', whatsappIntegration.router);
app.use('/api/slack', slackIntegration.router);

// Serve frontend for all non-API routes (for production)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
