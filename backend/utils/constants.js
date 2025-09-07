// Sentiment analysis constants
const SENTIMENT_THRESHOLDS = {
  POSITIVE: 0.2,
  NEGATIVE: -0.2
};

// Language codes
const SUPPORTED_LANGUAGES = {
  EN: 'en',
  ES: 'es'
};

// Escalation keywords in multiple languages
const ESCALATION_KEYWORDS = {
  en: [
    'agent', 'human', 'representative', 'manager', 'supervisor', 
    'help me', 'speak to someone', 'talk to person', 'real person',
    'customer service', 'support', 'complaint', 'frustrated',
    'angry', 'upset', 'disappointed', 'terrible', 'awful'
  ],
  es: [
    'agente', 'humano', 'representante', 'gerente', 'supervisor',
    'ayúdame', 'hablar con alguien', 'persona real', 'atención al cliente',
    'soporte', 'queja', 'frustrado', 'enojado', 'molesto',
    'decepcionado', 'terrible', 'horrible'
  ]
};

// Quick reply templates
const QUICK_REPLIES = {
  en: {
    greeting: 'Hello! How can I help you today?',
    help: 'I can help you with questions, provide information, or connect you with a human agent if needed.',
    thanks: 'You\'re welcome! Is there anything else I can help you with?',
    escalation: 'I understand you\'d like to speak with a human agent. Let me connect you right away.',
    goodbye: 'Thank you for chatting with us today. Have a great day!'
  },
  es: {
    greeting: '¡Hola! ¿Cómo puedo ayudarte hoy?',
    help: 'Puedo ayudarte con preguntas, proporcionar información o conectarte con un agente humano si es necesario.',
    thanks: '¡De nada! ¿Hay algo más en lo que pueda ayudarte?',
    escalation: 'Entiendo que te gustaría hablar con un agente humano. Te conectaré de inmediato.',
    goodbye: 'Gracias por chatear con nosotros hoy. ¡Que tengas un gran día!'
  }
};

// Response templates based on sentiment
const RESPONSE_TEMPLATES = {
  positive: {
    en: {
      prefix: "That's great to hear! ",
      suffix: " 😊"
    },
    es: {
      prefix: "¡Qué bueno escuchar eso! ",
      suffix: " 😊"
    }
  },
  negative: {
    en: {
      prefix: "I understand your frustration. ",
      suffix: " Let me help you resolve this."
    },
    es: {
      prefix: "Entiendo tu frustración. ",
      suffix: " Permíteme ayudarte a resolver esto."
    }
  },
  neutral: {
    en: {
      prefix: "",
      suffix: ""
    },
    es: {
      prefix: "",
      suffix: ""
    }
  }
};

// Rate limiting constants
const RATE_LIMITS = {
  MESSAGES_PER_MINUTE: 10,
  MESSAGES_PER_HOUR: 100,
  ESCALATIONS_PER_DAY: 5
};

// OpenAI model configurations
const OPENAI_MODELS = {
  CHAT: 'gpt-3.5-turbo',
  SENTIMENT: 'gpt-3.5-turbo',
  TRANSLATION: 'gpt-3.5-turbo'
};

module.exports = {
  SENTIMENT_THRESHOLDS,
  SUPPORTED_LANGUAGES,
  ESCALATION_KEYWORDS,
  QUICK_REPLIES,
  RESPONSE_TEMPLATES,
  RATE_LIMITS,
  OPENAI_MODELS
};
