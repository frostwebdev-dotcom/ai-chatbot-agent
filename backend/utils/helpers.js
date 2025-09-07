const { ESCALATION_KEYWORDS, SENTIMENT_THRESHOLDS } = require('./constants');

/**
 * Check if a message contains escalation keywords
 * @param {string} message - The message to check
 * @param {string} language - The language of the message
 * @returns {boolean} - True if escalation keywords are found
 */
const containsEscalationKeywords = (message, language = 'en') => {
  const keywords = ESCALATION_KEYWORDS[language] || ESCALATION_KEYWORDS.en;
  const lowerMessage = message.toLowerCase();
  
  return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
};

/**
 * Determine if escalation is needed based on message and sentiment
 * @param {string} message - The user message
 * @param {string} sentiment - The sentiment analysis result
 * @param {string} language - The message language
 * @returns {boolean} - True if escalation is needed
 */
const shouldEscalate = (message, sentiment, language = 'en') => {
  // Escalate if negative sentiment and contains escalation keywords
  if (sentiment === 'negative' && containsEscalationKeywords(message, language)) {
    return true;
  }
  
  // Escalate if explicitly asking for human agent
  const humanKeywords = ['agent', 'human', 'person', 'agente', 'humano', 'persona'];
  const lowerMessage = message.toLowerCase();
  
  return humanKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} - Formatted timestamp
 */
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Sanitize user input to prevent XSS and other attacks
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Generate a unique session ID
 * @returns {string} - Unique session ID
 */
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate sentiment score from counts
 * @param {Object} sentimentCounts - Object with positive, negative, neutral counts
 * @returns {number} - Sentiment score between -1 and 1
 */
const calculateSentimentScore = (sentimentCounts) => {
  const { positive = 0, negative = 0, neutral = 0 } = sentimentCounts;
  const total = positive + negative + neutral;
  
  if (total === 0) return 0;
  
  return (positive - negative) / total;
};

/**
 * Get user's preferred language from various sources
 * @param {Object} userProfile - User profile object
 * @param {string} messageLanguage - Detected message language
 * @param {string} defaultLang - Default language fallback
 * @returns {string} - Preferred language code
 */
const getUserPreferredLanguage = (userProfile = {}, messageLanguage = null, defaultLang = 'en') => {
  // Priority: user profile > detected message language > default
  return userProfile.language || messageLanguage || defaultLang;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Rate limiting helper - check if user has exceeded limits
 * @param {Array} timestamps - Array of recent action timestamps
 * @param {number} limit - Maximum allowed actions
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if rate limit exceeded
 */
const isRateLimited = (timestamps, limit, windowMs) => {
  const now = Date.now();
  const recentTimestamps = timestamps.filter(ts => now - ts < windowMs);
  return recentTimestamps.length >= limit;
};

/**
 * Extract user context from request
 * @param {Object} req - Express request object
 * @returns {Object} - User context object
 */
const extractUserContext = (req) => {
  return {
    userAgent: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  containsEscalationKeywords,
  shouldEscalate,
  formatTimestamp,
  sanitizeInput,
  generateSessionId,
  calculateSentimentScore,
  getUserPreferredLanguage,
  isValidEmail,
  isRateLimited,
  extractUserContext
};
