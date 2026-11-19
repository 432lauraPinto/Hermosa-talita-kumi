import { useState, useEffect, useRef } from 'react';

/**
 * Hook para sintetizar una campana sonora estética y agradable (Web Audio API)
 * Cumple con el Módulo 13: sonido breve, claro, suave, configurable por usuario.
 */
export function useAudioNotification() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('htk_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('htk_sound_volume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });

  const audioCtxRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('htk_sound_enabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('htk_sound_volume', volume.toString());
  }, [volume]);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playChime = () => {
    if (!soundEnabled) return;

    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;

      // Frecuencias para un acorde delicado y relajante de spa (Do sostenido mayor / Fa sostenido)
      const notes = [554.37, 830.61]; // C#5 y G#5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        // Curva de ganancia suave para efecto campana
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.25 * volume, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.3);
      });
    } catch (err) {
      console.warn('Audio playChime blocked or not supported:', err);
    }
  };

  return {
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume,
    playChime,
    initAudio
  };
}
