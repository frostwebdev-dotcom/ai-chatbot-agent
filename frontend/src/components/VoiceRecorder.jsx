import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Send, X, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ onSendVoiceMessage, language = 'en' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    // Check if browser supports MediaRecorder
    setIsSupported(!!navigator.mediaDevices && !!window.MediaRecorder);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setShowRecordingModal(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('🎤 Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      toast.success('🎤 Recording stopped');
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob && onSendVoiceMessage) {
      onSendVoiceMessage(audioBlob, recordingTime);
      resetRecording();
      setShowRecordingModal(false);
      toast.success('🎵 Voice message sent!');
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    resetRecording();
    setShowRecordingModal(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Voice Record Button */}
      <button
        type="button"
        onClick={startRecording}
        disabled={isRecording}
        className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
        title="Record voice message"
      >
        <Volume2 className="w-4 h-4" />
      </button>

      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {language === 'es' ? 'Mensaje de Voz' : 'Voice Message'}
              </h3>
              <button
                onClick={cancelRecording}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recording Status */}
            <div className="text-center mb-6">
              {isRecording ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-medium">
                      {language === 'es' ? 'Grabando...' : 'Recording...'}
                    </span>
                  </div>
                  
                  {/* Waveform Animation */}
                  <div className="flex items-center justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      ></div>
                    ))}
                  </div>
                  
                  <div className="text-2xl font-mono text-gray-700">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              ) : audioBlob ? (
                <div className="space-y-4">
                  <div className="text-green-600 font-medium">
                    {language === 'es' ? 'Grabación completa' : 'Recording complete'}
                  </div>
                  <div className="text-lg font-mono text-gray-700">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  {language === 'es' ? 'Preparando...' : 'Preparing...'}
                </div>
              )}
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="mb-6">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={playRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 
                      (language === 'es' ? 'Pausar' : 'Pause') : 
                      (language === 'es' ? 'Reproducir' : 'Play')
                    }</span>
                  </button>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center space-x-3">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <MicOff className="w-4 h-4" />
                  <span>{language === 'es' ? 'Detener' : 'Stop'}</span>
                </button>
              ) : audioBlob ? (
                <>
                  <button
                    onClick={cancelRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>{language === 'es' ? 'Cancelar' : 'Cancel'}</span>
                  </button>
                  <button
                    onClick={sendVoiceMessage}
                    className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{language === 'es' ? 'Enviar' : 'Send'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Mic className="w-4 h-4" />
                  <span>{language === 'es' ? 'Grabar' : 'Record'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;
