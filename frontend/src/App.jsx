import React from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import LoadingSpinner from './components/LoadingSpinner';
import SpeechTest from './components/SpeechTest';

function App() {
  const { currentUser, loading } = useAuth();

  // Check if we're in speech test mode
  const isTestMode = window.location.search.includes('test=speech');

  if (isTestMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <SpeechTest />
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser ? <ChatInterface /> : <AuthForm />}
    </div>
  );
}

export default App;
