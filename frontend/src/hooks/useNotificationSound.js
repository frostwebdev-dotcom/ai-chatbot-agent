import { useRef, useCallback } from 'react';

const useNotificationSound = () => {
  const audioRef = useRef(null);

  // Initialize audio on first use
  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      // Create audio element with a notification sound
      audioRef.current = new Audio();
      
      // Use a data URL for a simple notification beep
      // This creates a short, pleasant notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Create a simple beep sound programmatically
      const createBeepSound = () => {
        return new Promise((resolve) => {
          const sampleRate = audioContext.sampleRate;
          const duration = 0.3; // 300ms
          const frameCount = sampleRate * duration;
          const arrayBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
          const channelData = arrayBuffer.getChannelData(0);
          
          // Generate a pleasant notification tone (two-tone beep)
          for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const freq1 = 800; // First tone
            const freq2 = 1000; // Second tone
            const envelope = Math.exp(-t * 3); // Fade out
            
            if (t < 0.15) {
              channelData[i] = Math.sin(2 * Math.PI * freq1 * t) * envelope * 0.3;
            } else {
              channelData[i] = Math.sin(2 * Math.PI * freq2 * t) * envelope * 0.3;
            }
          }
          
          resolve(arrayBuffer);
        });
      };
      
      // Set up the audio with our generated sound
      createBeepSound().then((buffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        
        // Convert to blob URL for the audio element
        const offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
        const offlineSource = offlineContext.createBufferSource();
        offlineSource.buffer = buffer;
        offlineSource.connect(offlineContext.destination);
        offlineSource.start();
        
        offlineContext.startRendering().then((renderedBuffer) => {
          const wav = audioBufferToWav(renderedBuffer);
          const blob = new Blob([wav], { type: 'audio/wav' });
          audioRef.current.src = URL.createObjectURL(blob);
          audioRef.current.volume = 0.5; // Set moderate volume
        });
      });
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      initializeAudio();
      
      if (audioRef.current) {
        // Reset audio to beginning and play
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.warn('Could not play notification sound:', error);
        });
      }
    } catch (error) {
      console.warn('Notification sound error:', error);
    }
  }, [initializeAudio]);

  return { playNotificationSound };
};

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
  const length = buffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  const channelData = buffer.getChannelData(0);

  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  return arrayBuffer;
}

export default useNotificationSound;
