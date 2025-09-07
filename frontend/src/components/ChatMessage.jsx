import React from 'react';
import { Bot, User, AlertTriangle, Heart, Meh, Frown, UserCheck } from 'lucide-react';
import VoiceMessage from './VoiceMessage';

const ChatMessage = ({ message }) => {
  const isUser = message.type === 'user';
  const isAdmin = message.type === 'admin';
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <Heart className="w-3 h-3 text-green-500" />;
      case 'negative':
        return <Frown className="w-3 h-3 text-red-500" />;
      default:
        return <Meh className="w-3 h-3 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'border-l-green-400';
      case 'negative':
        return 'border-l-red-400';
      default:
        return 'border-l-gray-300';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-xs lg:max-w-md`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-primary-500' : isAdmin ? 'bg-orange-500' : 'bg-gray-200'
          }`}>
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : isAdmin ? (
              <UserCheck className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-gray-600" />
            )}
          </div>
        </div>

        {/* Message Bubble */}
        <div className={`relative ${isUser ? 'mr-2' : 'ml-2'}`}>
          {message.voiceMessage ? (
            /* Voice Message */
            <VoiceMessage
              audioUrl={message.voiceMessage.audioUrl}
              duration={message.voiceMessage.duration}
              isUser={isUser}
              timestamp={message.timestamp}
            />
          ) : (
            /* Text Message */
            <div className={`chat-bubble ${
              isUser ? 'chat-bubble-user' :
              isAdmin ? 'chat-bubble-admin border-l-4 border-l-orange-400' :
              `chat-bubble-bot ${getSentimentColor(message.sentiment)}`
            } ${!isUser && !isAdmin ? 'border-l-4' : ''}`}>
              {/* Admin name header */}
              {isAdmin && (
                <div className="flex items-center mb-2 pb-1 border-b border-orange-200">
                  <UserCheck className="w-3 h-3 text-orange-600 mr-1" />
                  <span className="text-xs font-semibold text-orange-700">{message.adminName || 'Support Agent'}</span>
                </div>
              )}

              <p className="text-sm leading-relaxed">{message.content}</p>

              {/* Escalation indicator */}
              {message.escalated && (
                <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                  <AlertTriangle className="w-3 h-3 text-orange-500 mr-1" />
                  <span className="text-xs text-orange-600">Escalated to human agent</span>
                </div>
              )}
            </div>
          )}

          {/* Message metadata */}
          <div className={`flex items-center mt-1 space-x-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <span className="text-xs text-gray-400">{timestamp}</span>
            {!isUser && message.sentiment && (
              <>
                <span className="text-xs text-gray-300">•</span>
                {getSentimentIcon(message.sentiment)}
              </>
            )}
            {message.language && message.language !== 'en' && (
              <>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400 uppercase">{message.language}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
