import { useCallback } from 'react';

const useNotificationSound = () => {
  // Create a simple beep sound using Web Audio API without blob URLs
  const playNotificationSound = useCallback(() => {
    try {
      // Check if Web Audio API is supported
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.warn('Web Audio API not supported');
        return;
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a simple two-tone beep
      const playBeep = (frequency, duration, delay = 0) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';

          // Envelope for smooth sound
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };

      // Play two-tone notification
      playBeep(800, 0.15, 0);    // First tone
      playBeep(1000, 0.15, 150); // Second tone after 150ms

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);

  return { playNotificationSound };
};

export default useNotificationSound;
