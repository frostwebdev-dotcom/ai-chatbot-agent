import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download } from 'lucide-react';

const VoiceMessage = ({ audioUrl, duration, isUser = false, timestamp }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      console.error('Error loading audio');
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audio.duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `voice-message-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const progress = audioRef.current ? (currentTime / audioRef.current.duration) * 100 : 0;

  return (
    <div className={`voice-message p-3 rounded-lg max-w-xs ${
      isUser 
        ? 'bg-blue-500 text-white ml-auto' 
        : 'bg-white border border-gray-200 mr-auto'
    }`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center space-x-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          disabled={isLoading}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isUser
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Waveform/Progress */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-3 h-3 opacity-60" />
            <span className="text-xs opacity-75">Voice Message</span>
          </div>
          
          {/* Progress Bar */}
          <div 
            className="relative h-2 bg-black bg-opacity-20 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ${
                isUser ? 'bg-white bg-opacity-60' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
            
            {/* Waveform Effect */}
            <div className="absolute inset-0 flex items-center justify-center space-x-0.5">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 rounded-full transition-all duration-200 ${
                    isUser ? 'bg-white bg-opacity-40' : 'bg-gray-400'
                  }`}
                  style={{
                    height: `${Math.random() * 8 + 2}px`,
                    opacity: i / 20 <= progress / 100 ? 1 : 0.3
                  }}
                />
              ))}
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-xs opacity-75">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || audioRef.current?.duration || 0)}</span>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadAudio}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            isUser
              ? 'hover:bg-blue-600 text-white'
              : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Download voice message"
        >
          <Download className="w-3 h-3" />
        </button>
      </div>

      {/* Timestamp */}
      {timestamp && (
        <div className="mt-2 text-xs opacity-60 text-right">
          {new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      )}
    </div>
  );
};

export default VoiceMessage;
