import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import {
  Send,
  Mic,
  MicOff,
  LogOut,
  Settings,
  MessageCircle,
  Globe,
  Trash2,
  Download,
  UserCheck
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import VoiceInput from './VoiceInput';
import VoiceRecorder from './VoiceRecorder';
import TypingIndicator from './TypingIndicator';

const ChatInterface = () => {
  const { currentUser, logout } = useAuth();
  const { 
    messages, 
    isConnected, 
    isTyping, 
    language, 
    setLanguage, 
    sendMessage, 
    clearMessages,
    loadChatHistory 
  } = useChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Load chat history when component mounts
    loadChatHistory();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleVoiceInput = (transcript) => {
    if (transcript) {
      sendMessage(transcript);
    }
  };

  const handleVoiceMessage = async (audioBlob, duration) => {
    try {
      // Convert blob to base64 for transmission
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1];

        // Send voice message through socket
        const voiceMessage = {
          type: 'voice',
          audioData: base64Audio,
          duration: duration,
          mimeType: 'audio/webm;codecs=opus',
          timestamp: new Date().toISOString()
        };

        // Add to local messages immediately for better UX
        const localMessage = {
          id: Date.now(),
          type: 'user',
          content: null,
          voiceMessage: {
            audioUrl: URL.createObjectURL(audioBlob),
            duration: duration
          },
          timestamp: new Date().toISOString()
        };

        // Use the existing sendMessage function but with voice data
        sendMessage(voiceMessage);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const quickReplies = [
    { text: 'Hello', es: 'Hola' },
    { text: 'Help', es: 'Ayuda' },
    { text: 'Thank you', es: 'Gracias' },
    { text: 'Contact agent', es: 'Contactar agente' }
  ];

  const handleQuickReply = (reply) => {
    const text = language === 'es' ? reply.es : reply.text;
    sendMessage(text);
  };

  const handleEscalation = () => {
    const escalationMessage = language === 'es'
      ? 'Necesito hablar con un agente humano, por favor.'
      : 'I need to speak with a human agent, please.';

    sendMessage(escalationMessage);

    // Show confirmation toast
    const confirmationText = language === 'es'
      ? '🚨 Escalando a agente humano...'
      : '🚨 Escalating to human agent...';

    toast.success(confirmationText, {
      duration: 3000,
      icon: '🙋‍♂️'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 p-2 rounded-full">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Chat Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={clearMessages}
                className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Chat</span>
              </button>
              <button
                onClick={() => {/* TODO: Export chat */}}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto chat-container px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-primary-100 p-4 rounded-full mb-4">
                <MessageCircle className="w-12 h-12 text-primary-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'es' ? '¡Hola! ¿Cómo puedo ayudarte?' : 'Hello! How can I help you?'}
              </h3>
              <p className="text-gray-500 mb-6">
                {language === 'es'
                  ? 'Escribe un mensaje o usa los botones de respuesta rápida a continuación.'
                  : 'Type a message or use the quick reply buttons below.'
                }
              </p>

              {/* Quick Reply Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {language === 'es' ? reply.es : reply.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={language === 'es' ? 'Escribe tu mensaje...' : 'Type your message...'}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                disabled={!isConnected}
              />

              {/* Voice Input & Voice Message Buttons */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <VoiceInput
                  onTranscript={handleVoiceInput}
                  language={language}
                  isActive={isVoiceMode}
                  onToggle={setIsVoiceMode}
                />
                <VoiceRecorder
                  onSendVoiceMessage={handleVoiceMessage}
                  language={language}
                />
              </div>
            </div>
          </div>

          {/* Escalation Button */}
          <button
            type="button"
            onClick={handleEscalation}
            disabled={!isConnected}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
            title={language === 'es' ? 'Hablar con agente humano' : 'Speak to human agent'}
          >
            <UserCheck className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {/* Status Messages */}
        {!isConnected && (
          <div className="mt-2 text-center">
            <span className="text-sm text-red-500">
              {language === 'es' ? 'Desconectado del servidor' : 'Disconnected from server'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
