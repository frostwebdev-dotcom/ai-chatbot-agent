const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { getChatHistory, getUserStats } = require('../services/chatService');
const { generateResponse, analyzeSentiment } = require('../services/openaiService');

const router = express.Router();

// Get chat history for authenticated user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const limit = parseInt(req.query.limit) || 50;

    const chatHistory = await getChatHistory(uid, limit);
    
    res.json({ 
      chats: chatHistory,
      count: chatHistory.length
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    const userStats = await getUserStats(uid);
    
    if (!userStats) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ stats: userStats.stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

// Test AI response (for development/testing)
router.post('/test', optionalAuth, async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Analyze sentiment
    const sentiment = await analyzeSentiment(message);

    // Generate response
    const response = await generateResponse(message, {
      language,
      sentiment,
      userProfile: req.user ? { name: req.user.name } : {}
    });

    res.json({
      userMessage: message,
      botResponse: response,
      sentiment,
      language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test chat error:', error);
    res.status(500).json({ error: 'Failed to process test message' });
  }
});

// Clear chat history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();

    // Delete all chats for the user
    const chatsQuery = db.collection('chats').where('userId', '==', uid);
    const chatsSnapshot = await chatsQuery.get();
    
    const batch = db.batch();
    chatsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Reset user message count
    await db.collection('users').doc(uid).update({
      messageCount: 0,
      lastActivity: new Date().toISOString()
    });

    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// Export chat history
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const format = req.query.format || 'json';

    const chatHistory = await getChatHistory(uid, 1000); // Get all chats

    if (format === 'csv') {
      const csv = chatHistory.map(chat => 
        `"${chat.timestamp}","${chat.userMessage.replace(/"/g, '""')}","${chat.botResponse.replace(/"/g, '""')}","${chat.sentiment}","${chat.language}"`
      ).join('\n');

      const csvHeader = 'Timestamp,User Message,Bot Response,Sentiment,Language\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="chat-history.csv"');
      res.send(csvHeader + csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="chat-history.json"');
      res.json({ 
        exportDate: new Date().toISOString(),
        userId: uid,
        chats: chatHistory 
      });
    }
  } catch (error) {
    console.error('Export chat history error:', error);
    res.status(500).json({ error: 'Failed to export chat history' });
  }
});

module.exports = router;
