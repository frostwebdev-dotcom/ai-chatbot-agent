const { getFirestore } = require('../config/firebase');
const { generateResponse, analyzeSentiment, detectLanguage, translateText } = require('./openaiService');
const { sendEscalationEmail } = require('./emailService');

const db = getFirestore();

const ESCALATION_KEYWORDS = [
  'agent', 'human', 'representative', 'manager', 'supervisor', 'help me', 'speak to someone',
  'agente', 'humano', 'representante', 'gerente', 'supervisor', 'ayúdame', 'hablar con alguien'
];

const storeVoiceMessage = async (userId, voiceData) => {
  try {
    const voiceMessageData = {
      userId,
      audioData: voiceData.audioData,
      duration: voiceData.duration,
      mimeType: voiceData.mimeType,
      timestamp: voiceData.timestamp || new Date().toISOString(),
      type: 'voice_message'
    };

    await db.collection('voice_messages').add(voiceMessageData);
    console.log(`Voice message stored for user ${userId}`);
  } catch (error) {
    console.error('Error storing voice message:', error);
  }
};

const handleChatMessage = async ({ userId, message, language, isVoiceMessage = false, voiceData = null, channel = 'web', metadata = {} }) => {
  try {
    let actualMessage = message;

    // Handle voice messages
    if (isVoiceMessage && voiceData) {
      // For voice messages, we'll acknowledge receipt and potentially transcribe
      actualMessage = language === 'es'
        ? 'Mensaje de voz recibido'
        : 'Voice message received';

      // Store voice message data
      await storeVoiceMessage(userId, voiceData);
    }

    // Detect language if not provided
    if (!language && actualMessage) {
      language = await detectLanguage(actualMessage);
    }

    // Analyze sentiment (skip for voice acknowledgments)
    const sentiment = isVoiceMessage ? 'neutral' : await analyzeSentiment(actualMessage);

    // Get user profile
    const userDoc = await db.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data() : {};

    // Check for escalation keywords or negative sentiment
    const hasEscalationKeywords = ESCALATION_KEYWORDS.some(keyword =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    const hasNegativeSentiment = sentiment === 'negative';
    const needsEscalation = hasEscalationKeywords || hasNegativeSentiment;

    console.log('🔍 Escalation Check:', {
      message: message.substring(0, 100),
      hasEscalationKeywords,
      hasNegativeSentiment,
      needsEscalation,
      sentiment,
      userId
    });

    let botResponse;
    let escalated = false;

    if (needsEscalation) {
      // Escalate to human
      escalated = true;
      console.log('🚨 ESCALATING TO HUMAN:', { userId, message: message.substring(0, 50) });

      botResponse = language === 'es'
        ? 'Entiendo tu situación. Te estoy conectando con un agente humano que podrá ayudarte mejor. Por favor, espera un momento.'
        : 'I understand your situation. I\'m connecting you with a human agent who can better assist you. Please wait a moment.';

      // Send escalation email
      try {
        await sendEscalationEmail({
          userId,
          message,
          sentiment,
          userProfile,
          timestamp: new Date().toISOString()
        });
        console.log('✅ Escalation email sent');
      } catch (emailError) {
        console.error('❌ Escalation email failed:', emailError.message);
      }

      // Send Slack escalation notification
      try {
        const { sendSlackEscalationNotification } = require('../integrations/slack');
        const escalationId = await sendSlackEscalationNotification(
          null, // channelId not needed
          userId,
          message,
          'web' // userChannel
        );
        console.log('✅ Slack escalation sent:', escalationId);
      } catch (slackError) {
        console.error('❌ Slack escalation failed:', slackError.message);
      }
    } else {
      // Check if user is in active escalation
      try {
        const { sendUserMessageToSlack, isUserInActiveEscalation } = require('../integrations/slack');
        const inEscalation = await isUserInActiveEscalation(userId);

        if (inEscalation) {
          // User is talking to human agent - forward message to Slack and don't generate AI response
          console.log('👤 User in active escalation - forwarding to human agent');
          const forwarded = await sendUserMessageToSlack(userId, message);

          if (forwarded) {
            console.log('📤 User message forwarded to Slack thread');
            // Return a response indicating human agent will respond
            botResponse = language === 'es'
              ? 'Tu mensaje ha sido enviado al agente de soporte. Te responderá en breve.'
              : 'Your message has been sent to the support agent. They will respond shortly.';
          } else {
            // Fallback if forwarding fails
            botResponse = language === 'es'
              ? 'Estás conectado con un agente humano, pero hubo un problema enviando tu mensaje. Por favor, intenta de nuevo.'
              : 'You are connected to a human agent, but there was an issue sending your message. Please try again.';
          }
        } else {
          // No active escalation - generate AI response normally
          console.log('🤖 No active escalation - generating AI response');
          botResponse = await generateResponse(message, {
            language,
            sentiment,
            userProfile
          });
        }
      } catch (forwardError) {
        console.error('❌ Failed to check escalation status:', forwardError.message);
        // Fallback to AI response if there's an error
        botResponse = await generateResponse(message, {
          language,
          sentiment,
          userProfile
        });
      }
    }

    // Save chat message to Firestore
    const chatData = {
      userId,
      userMessage: actualMessage,
      botResponse,
      sentiment,
      language,
      escalated,
      channel,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: userProfile.userAgent || 'unknown',
        sessionId: userProfile.sessionId || 'unknown'
      }
    };

    await db.collection('chats').add(chatData);

    // Update user's last activity
    await db.collection('users').doc(userId).update({
      lastActivity: new Date().toISOString(),
      messageCount: (userProfile.messageCount || 0) + 1
    });

    return {
      message: botResponse,
      sentiment,
      language,
      escalated,
      timestamp: chatData.timestamp
    };

  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
};

const getChatHistory = async (userId, limit = 50) => {
  try {
    const chatsRef = db.collection('chats')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    const snapshot = await chatsRef.get();
    const chats = [];

    snapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });

    return chats.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Get chat history error:', error);
    throw error;
  }
};

const getUserStats = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    
    // Get chat statistics
    const chatsRef = db.collection('chats').where('userId', '==', userId);
    const chatsSnapshot = await chatsRef.get();
    
    let totalMessages = 0;
    let sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    let escalationCount = 0;

    chatsSnapshot.forEach(doc => {
      const chat = doc.data();
      totalMessages++;
      sentimentCounts[chat.sentiment] = (sentimentCounts[chat.sentiment] || 0) + 1;
      if (chat.escalated) escalationCount++;
    });

    return {
      ...userData,
      stats: {
        totalMessages,
        sentimentCounts,
        escalationCount,
        averageSentiment: calculateAverageSentiment(sentimentCounts)
      }
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
};

const calculateAverageSentiment = (sentimentCounts) => {
  const total = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;
  if (total === 0) return 'neutral';
  
  const score = (sentimentCounts.positive - sentimentCounts.negative) / total;
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
};

module.exports = {
  handleChatMessage,
  getChatHistory,
  getUserStats
};
