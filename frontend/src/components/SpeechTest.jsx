import React, { useState, useRef } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const SpeechTest = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const recognitionRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const checkSupport = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;
    
    addLog(`Browser: ${navigator.userAgent}`, 'info');
    addLog(`HTTPS: ${window.isSecureContext}`, window.isSecureContext ? 'success' : 'error');
    addLog(`SpeechRecognition: ${!!window.SpeechRecognition}`, !!window.SpeechRecognition ? 'success' : 'error');
    addLog(`webkitSpeechRecognition: ${!!window.webkitSpeechRecognition}`, !!window.webkitSpeechRecognition ? 'success' : 'error');
    addLog(`Overall Support: ${isSupported}`, isSupported ? 'success' : 'error');
    
    return isSupported;
  };

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('Microphone access granted', 'success');
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      addLog(`Microphone error: ${error.name} - ${error.message}`, 'error');
      return false;
    }
  };

  const startListening = async () => {
    setError('');
    setTranscript('');
    
    if (!checkSupport()) {
      setError('Speech recognition not supported');
      return;
    }

    if (!(await testMicrophone())) {
      setError('Microphone not accessible');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        addLog('Speech recognition started', 'success');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0];
        const transcript = result.transcript;
        const confidence = result.confidence;
        
        addLog(`Result: "${transcript}" (confidence: ${confidence})`, 'success');
        setTranscript(transcript);
      };

      recognition.onerror = (event) => {
        addLog(`Error: ${event.error}`, 'error');
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        addLog('Speech recognition ended', 'info');
        setIsListening(false);
      };

      recognition.start();
      addLog('Starting speech recognition...', 'info');
      
    } catch (error) {
      addLog(`Failed to start: ${error.message}`, 'error');
      setError(`Failed to start speech recognition: ${error.message}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      addLog('Stopping speech recognition...', 'info');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setError('');
    setTranscript('');
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">🎤 Speech Recognition Test</h1>
      
      {/* Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isListening}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          <span>{isListening ? 'Listening... Click to stop' : 'Start Speech Test'}</span>
        </button>
        
        <button
          onClick={checkSupport}
          className="px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
        >
          Check Support
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
        >
          Clear Logs
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transcript */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Transcript:</h3>
          <div className="bg-white p-3 rounded border min-h-[100px]">
            {transcript || <span className="text-gray-400">No speech detected yet...</span>}
          </div>
        </div>

        {/* Error */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Error:</h3>
          <div className="bg-white p-3 rounded border min-h-[100px]">
            {error ? (
              <span className="text-red-500">{error}</span>
            ) : (
              <span className="text-green-500">No errors</span>
            )}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Debug Logs:</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click "Check Support" or "Start Speech Test"</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex items-center space-x-2 mb-1">
                {getLogIcon(log.type)}
                <span className="text-gray-400">[{log.timestamp}]</span>
                <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First click "Check Support" to verify browser compatibility</li>
          <li>Use Chrome or Edge browser for best results</li>
          <li>Ensure you're on HTTPS (required for speech recognition)</li>
          <li>Click "Start Speech Test" and allow microphone permissions</li>
          <li>Speak clearly when you see "Listening..."</li>
          <li>Check the logs for detailed debugging information</li>
        </ol>
      </div>
    </div>
  );
};

export default SpeechTest;
