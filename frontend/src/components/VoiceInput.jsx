import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceInput = ({ onTranscript, language = 'en', isActive, onToggle }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    console.log('Speech Recognition Support:', {
      SpeechRecognition: !!window.SpeechRecognition,
      webkitSpeechRecognition: !!window.webkitSpeechRecognition,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext
    });

    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
          toast.success('🎤 Listening... Speak now!', {
            duration: 2000,
            style: {
              background: '#10B981',
              color: 'white',
            },
          });
        };

        recognition.onresult = (event) => {
          console.log('Speech recognition result:', event);
          const transcript = event.results[0][0].transcript;
          const confidence = event.results[0][0].confidence;

          console.log('Transcript:', transcript, 'Confidence:', confidence);

          onTranscript(transcript);
          setIsListening(false);
          onToggle(false);

          toast.success(`Heard: "${transcript}"`, {
            duration: 3000,
          });
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error, event);
          setIsListening(false);
          onToggle(false);

          switch (event.error) {
            case 'no-speech':
              toast.error('No speech detected. Please speak clearly and try again.');
              break;
            case 'audio-capture':
              toast.error('Microphone not accessible. Please check your microphone and permissions.');
              break;
            case 'not-allowed':
              toast.error('Microphone permission denied. Please allow microphone access and refresh the page.');
              break;
            case 'network':
              toast.error('Network error. Please check your internet connection.');
              break;
            case 'service-not-allowed':
              toast.error('Speech recognition service not allowed. Please use HTTPS.');
              break;
            default:
              toast.error(`Speech recognition error: ${event.error}. Please try again.`);
          }
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          onToggle(false);
        };

        console.log('Speech recognition initialized successfully');
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setIsSupported(false);
        toast.error('Failed to initialize speech recognition.');
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
      toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.warn('Error aborting speech recognition:', error);
        }
      }
    };
  }, [language, onTranscript, onToggle]);

  const toggleListening = async () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (!window.isSecureContext) {
      toast.error('Speech recognition requires HTTPS. Please use a secure connection.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
        console.log('Stopping speech recognition');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });

        console.log('Starting speech recognition');
        recognitionRef.current?.start();
        onToggle(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);

        if (error.name === 'NotAllowedError') {
          toast.error('Microphone permission denied. Please allow microphone access.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No microphone found. Please connect a microphone.');
        } else if (error.name === 'NotSupportedError') {
          toast.error('Speech recognition not supported in this browser.');
        } else {
          toast.error(`Failed to start voice input: ${error.message}`);
        }
      }
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-full transition-all duration-200 ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? (
        <div className="relative">
          <MicOff className="w-4 h-4" />
          <div className="absolute inset-0 rounded-full border-2 border-red-300 pulse-ring"></div>
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};

export default VoiceInput;
