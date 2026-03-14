import { useCallback, useRef, useEffect } from 'react';

// Shared audio context for button click sounds
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  } catch {
    return null;
  }
};

export const useButtonClickSound = () => {
  const hasUserInteracted = useRef(false);
  
  // Initialize audio context on user interaction
  useEffect(() => {
    const handleInteraction = () => {
      hasUserInteracted.current = true;
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(console.warn);
      }
    };
    
    const events = ['click', 'keydown', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { once: true, passive: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, []);
  
  const playClickSound = useCallback(async () => {
    try {
      const ctx = getAudioContext();
      
      if (!ctx) return;
      
      // Resume context if suspended
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch (e) {
          console.warn('Failed to resume audio context:', e);
          return;
        }
      }
      
      if (ctx.state !== 'running') return;
      
      // Create a crisp, satisfying click sound (similar to iOS/Lovable)
      const now = ctx.currentTime;
      
      // Primary click oscillator - crisp high frequency
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Crisp click characteristics
      oscillator.frequency.setValueAtTime(2000, now);
      oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.03);
      oscillator.type = 'sine';
      
      // High-pass filter for crispness
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(500, now);
      
      // Very quick attack and decay for a sharp click
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      oscillator.start(now);
      oscillator.stop(now + 0.06);
      
      // Secondary harmonic for richness
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc2.frequency.setValueAtTime(1400, now);
      osc2.frequency.exponentialRampToValueAtTime(600, now + 0.02);
      osc2.type = 'triangle';
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.003);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      osc2.start(now);
      osc2.stop(now + 0.05);
      
      // Third layer - subtle bass thump
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      
      osc3.frequency.setValueAtTime(150, now);
      osc3.frequency.exponentialRampToValueAtTime(80, now + 0.02);
      osc3.type = 'sine';
      
      gain3.gain.setValueAtTime(0, now);
      gain3.gain.linearRampToValueAtTime(0.08, now + 0.005);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc3.start(now);
      osc3.stop(now + 0.04);
      
    } catch (error) {
      console.warn('Could not play click sound:', error);
    }
  }, []);
  
  return { playClickSound };
};

export default useButtonClickSound;
