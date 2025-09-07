import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import Icon from 'react-native-vector-icons/MaterialIcons';

const API_URL = 'http://localhost:5000'; // Change for production

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    initializeApp();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Get or create user ID
      let storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        storedUserId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('userId', storedUserId);
      }
      setUserId(storedUserId);

      // Load chat history
      const storedMessages = await AsyncStorage.getItem('chatMessages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }

      // Initialize socket connection
      initializeSocket(storedUserId);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize the app');
    }
  };

  const initializeSocket = (userId) => {
    const newSocket = io(API_URL, {
      auth: {
        token: `mobile_${userId}` // Simple auth for mobile
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('bot_response', (response) => {
      setIsTyping(false);
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        content: response.message,
        timestamp: new Date().toISOString(),
        sentiment: response.sentiment,
        escalated: response.escalated
      };

      setMessages(prev => {
        const updated = [...prev, botMessage];
        AsyncStorage.setItem('chatMessages', JSON.stringify(updated));
        return updated;
      });

      if (response.escalated) {
        Alert.alert(
          'Escalated to Human Agent',
          'Your conversation has been escalated to a human agent who will contact you shortly.',
          [{ text: 'OK' }]
        );
      }
    });

    newSocket.on('error', (error) => {
      setIsTyping(false);
      Alert.alert('Error', error.message || 'Something went wrong');
    });

    setSocket(newSocket);
  };

  const sendMessage = () => {
    if (!inputText.trim() || !socket || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      AsyncStorage.setItem('chatMessages', JSON.stringify(updated));
      return updated;
    });

    setIsTyping(true);
    socket.emit('chat_message', {
      message: inputText.trim(),
      language: 'en', // Could add language selection
      channel: 'mobile'
    });

    setInputText('');
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            AsyncStorage.removeItem('chatMessages');
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.type === 'user';
    const sentimentColor = {
      positive: '#10B981',
      negative: '#EF4444',
      neutral: '#6B7280'
    };

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.botMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.botText
          ]}>
            {item.content}
          </Text>
          
          {item.escalated && (
            <View style={styles.escalationBadge}>
              <Icon name="warning" size={12} color="#F59E0B" />
              <Text style={styles.escalationText}>Escalated to human</Text>
            </View>
          )}
        </View>
        
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          
          {!isUser && item.sentiment && (
            <View style={[
              styles.sentimentBadge,
              { backgroundColor: sentimentColor[item.sentiment] }
            ]}>
              <Text style={styles.sentimentText}>
                {item.sentiment}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.botMessage]}>
        <View style={[styles.messageBubble, styles.botBubble]}>
          <Text style={styles.typingText}>AI is typing...</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="smart-toy" size={24} color="white" />
          <Text style={styles.headerTitle}>AI Chatbot</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[
            styles.connectionStatus,
            { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
          ]} />
          <TouchableOpacity onPress={clearChat} style={styles.headerButton}>
            <Icon name="delete" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || !isConnected) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
          >
            <Icon name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        {!isConnected && (
          <Text style={styles.disconnectedText}>
            Disconnected - Check your internet connection
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  headerButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#374151',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  sentimentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sentimentText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  escalationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  escalationText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 4,
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  disconnectedText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
  },
});
