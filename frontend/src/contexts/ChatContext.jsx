import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import useNotificationSound from '../hooks/useNotificationSound';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { currentUser, authToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isHumanAgentActive, setIsHumanAgentActive] = useState(false);
  const [currentAgentName, setCurrentAgentName] = useState('');
  const { playNotificationSound } = useNotificationSound();

  useEffect(() => {
    if (currentUser && authToken) {
      // Use same domain if VITE_API_URL is empty (production)
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const newSocket = io(apiUrl, {
        auth: {
          token: authToken
        }
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server, Socket ID:', newSocket.id);
        console.log('🔍 Current user ID:', currentUser?.uid);
        setIsConnected(true);
        toast.success('Connected to chat server');

        // Join user room for targeted messages
        if (currentUser?.uid) {
          newSocket.emit('join_room', currentUser.uid);
          console.log('🏠 Joined room for user:', currentUser.uid);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        toast.error('Disconnected from chat server');
      });

      newSocket.on('bot_response', (response) => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'bot',
          content: response.message,
          timestamp: response.timestamp,
          sentiment: response.sentiment,
          language: response.language,
          escalated: response.escalated
        }]);

        // Play notification sound for bot responses
        playNotificationSound();

        if (response.escalated) {
          toast.success('Connected to human agent!');
        }
      });

      newSocket.on('error', (error) => {
        setIsTyping(false);
        toast.error(error.message);
      });

      // Handle admin responses from Slack escalation
      newSocket.on('admin_response', (response) => {
        console.log('📨 Received admin response:', response);
        console.log('🔍 Current user from auth:', currentUser?.uid);

        // Filter messages by user ID if targetUserId is specified
        if (response.targetUserId && response.targetUserId !== currentUser?.uid) {
          console.log('🚫 Message not for this user, ignoring');
          return;
        }

        const adminMessage = {
          id: Date.now(),
          type: 'admin',
          content: response.content,
          adminName: response.adminName,
          timestamp: response.timestamp,
          isEscalation: true
        };

        console.log('➕ Adding admin message:', adminMessage);

        setMessages(prev => {
          const newMessages = [...prev, adminMessage];
          console.log('📝 Updated messages array length:', newMessages.length);
          return newMessages;
        });

        // Set human agent as active
        setIsHumanAgentActive(true);
        setCurrentAgentName(response.adminName);

        // Play notification sound for admin messages (more prominent)
        playNotificationSound();

        // Show notification
        toast.success(`🙋‍♂️ ${response.adminName} is helping you`, {
          duration: 4000
        });
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        toast.error('Failed to connect to chat server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [currentUser, authToken]);

  const sendMessage = (message) => {
    if (!socket) return;

    // Handle voice messages
    if (typeof message === 'object' && message.type === 'voice') {
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: null,
        voiceMessage: {
          audioUrl: URL.createObjectURL(new Blob([Uint8Array.from(atob(message.audioData), c => c.charCodeAt(0))], { type: message.mimeType })),
          duration: message.duration
        },
        timestamp: message.timestamp
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      socket.emit('chat_message', {
        ...message,
        language: language
      });
      return;
    }

    // Handle text messages
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    socket.emit('chat_message', {
      message: message.trim(),
      language: language
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const loadChatHistory = async () => {
    if (!authToken) return;

    try {
      // Use same domain if VITE_API_URL is empty (production)
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const response = await fetch(`${apiUrl}/api/chat/history`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedMessages = [];

        data.chats.forEach(chat => {
          formattedMessages.push({
            id: `user-${chat.timestamp}`,
            type: 'user',
            content: chat.userMessage,
            timestamp: chat.timestamp
          });
          formattedMessages.push({
            id: `bot-${chat.timestamp}`,
            type: 'bot',
            content: chat.botResponse,
            timestamp: chat.timestamp,
            sentiment: chat.sentiment,
            language: chat.language,
            escalated: chat.escalated
          });
        });

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Load chat history error:', error);
    }
  };

  const value = {
    messages,
    isConnected,
    isTyping,
    language,
    setLanguage,
    sendMessage,
    clearMessages,
    loadChatHistory,
    isHumanAgentActive,
    currentAgentName
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
