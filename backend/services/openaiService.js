const OpenAI = require('openai');

// Check if we're in demo mode
const isDemoMode = process.env.OPENAI_API_KEY === 'DEMO_MODE';

const openai = isDemoMode ? null : new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mock response generator for demo mode
const generateMockResponse = (message, context = {}) => {
  const { language = 'en', sentiment = 'neutral', userProfile = {} } = context;
  const lowerMessage = message.toLowerCase();

  // Mock responses based on message content
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hola')) {
    return language === 'es'
      ? `¡Hola${userProfile.name ? ' ' + userProfile.name : ''}! Soy tu asistente de IA. ¿Cómo puedo ayudarte hoy?`
      : `Hello${userProfile.name ? ' ' + userProfile.name : ''}! I'm your AI assistant. How can I help you today?`;
  }

  if (lowerMessage.includes('frustrated') || lowerMessage.includes('angry') || lowerMessage.includes('problem')) {
    return language === 'es'
      ? 'Entiendo tu frustración. Permíteme ayudarte a resolver este problema. ¿Puedes contarme más detalles?'
      : 'I understand your frustration. Let me help you resolve this issue. Can you tell me more details?';
  }

  if (lowerMessage.includes('agent') || lowerMessage.includes('human') || lowerMessage.includes('person')) {
    return language === 'es'
      ? 'Te estoy conectando con un agente humano que podrá ayudarte mejor. Por favor, espera un momento.'
      : 'I\'m connecting you with a human agent who can better assist you. Please wait a moment.';
  }

  if (lowerMessage.includes('love') || lowerMessage.includes('great') || lowerMessage.includes('amazing')) {
    return language === 'es'
      ? '¡Me alegra saber que tienes una experiencia positiva! ¿Hay algo más en lo que pueda ayudarte?'
      : 'I\'m glad to hear you\'re having a positive experience! Is there anything else I can help you with?';
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('ayuda')) {
    return language === 'es'
      ? 'Por supuesto, estoy aquí para ayudarte. Puedo responder preguntas, proporcionar información o conectarte con un agente humano si es necesario.'
      : 'Of course, I\'m here to help! I can answer questions, provide information, or connect you with a human agent if needed.';
  }

  // Default response
  return language === 'es'
    ? 'Gracias por tu mensaje. Como asistente de IA, estoy aquí para ayudarte. ¿Puedes contarme más sobre lo que necesitas?'
    : 'Thank you for your message. As an AI assistant, I\'m here to help you. Can you tell me more about what you need?';
};

const SYSTEM_PROMPTS = {
  en: `You are a helpful and empathetic customer support assistant. 
Keep responses concise (under 150 words), friendly, and professional. 
Adjust your tone based on the user's sentiment:
- Positive: Be enthusiastic and supportive
- Neutral: Be helpful and informative  
- Negative: Be understanding, apologetic, and solution-focused
If you cannot help with something, politely suggest contacting a human agent.`,
  
  es: `Eres un asistente de atención al cliente útil y empático.
Mantén las respuestas concisas (menos de 150 palabras), amigables y profesionales.
Ajusta tu tono según el sentimiento del usuario:
- Positivo: Sé entusiasta y solidario
- Neutral: Sé útil e informativo
- Negativo: Sé comprensivo, disculpándote y enfocado en soluciones
Si no puedes ayudar con algo, sugiere cortésmente contactar a un agente humano.`
};

const generateResponse = async (message, context = {}) => {
  try {
    const { language = 'en', sentiment = 'neutral', userProfile = {} } = context;

    // Demo mode - return mock responses
    if (isDemoMode) {
      return generateMockResponse(message, context);
    }

    const systemPrompt = SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Add user context if available
    if (userProfile.name) {
      messages[0].content += `\nUser's name is ${userProfile.name}.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
};

const analyzeSentiment = async (text) => {
  try {
    // Demo mode - simple sentiment analysis
    if (isDemoMode) {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('love') || lowerText.includes('great') || lowerText.includes('amazing') ||
          lowerText.includes('excellent') || lowerText.includes('wonderful')) {
        return 'positive';
      }
      if (lowerText.includes('hate') || lowerText.includes('terrible') || lowerText.includes('awful') ||
          lowerText.includes('frustrated') || lowerText.includes('angry') || lowerText.includes('bad')) {
        return 'negative';
      }
      return 'neutral';
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment of the following text. Respond with only one word: positive, negative, or neutral.'
        },
        { role: 'user', content: text }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });

    const sentiment = response.choices[0].message.content.trim().toLowerCase();
    return ['positive', 'negative', 'neutral'].includes(sentiment) ? sentiment : 'neutral';
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return 'neutral';
  }
};

const detectLanguage = async (text) => {
  try {
    // Demo mode - simple language detection
    if (isDemoMode) {
      const lowerText = text.toLowerCase();
      const spanishWords = ['hola', 'gracias', 'por favor', 'ayuda', 'necesito', 'problema', 'español'];
      const hasSpanish = spanishWords.some(word => lowerText.includes(word));
      return hasSpanish ? 'es' : 'en';
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Detect the language of the following text. Respond with only the language code: en for English, es for Spanish, or en if uncertain.'
        },
        { role: 'user', content: text }
      ],
      max_tokens: 5,
      temperature: 0.1,
    });

    const language = response.choices[0].message.content.trim().toLowerCase();
    return ['en', 'es'].includes(language) ? language : 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
};

const translateText = async (text, targetLanguage) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Translate the following text to ${targetLanguage === 'es' ? 'Spanish' : 'English'}. Only return the translation, nothing else.`
        },
        { role: 'user', content: text }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

module.exports = {
  generateResponse,
  analyzeSentiment,
  detectLanguage,
  translateText
};
