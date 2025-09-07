import { useRef, useCallback, useState, useEffect } from 'react';

export interface SoundConfig {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
}

export interface GameSounds {
  jump: () => void;
  doubleJump: () => void;
  collectBonus: () => void;
  hitObstacle: () => void;
  comboComplete: () => void;
  levelUp: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  playGameOverMusic: () => void;
}

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('septicSurferSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('septicSurferSoundVolume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<{
    oscillator?: OscillatorNode;
    gainNode?: GainNode;
    isPlaying: boolean;
  }>({ isPlaying: false });

  // Инициализация AudioContext
  useEffect(() => {
    if (enabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext не поддерживается:', error);
      }
    }
  }, [enabled]);

  // Сохранение настроек в localStorage
  useEffect(() => {
    localStorage.setItem('septicSurferSoundEnabled', JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('septicSurferSoundVolume', volume.toString());
  }, [volume]);

  // Базовая функция для создания звукового тона
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', fadeOut: boolean = true) => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      
      if (fadeOut) {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      } else {
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      }

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Ошибка воспроизведения звука:', error);
    }
  }, [enabled, volume]);

  // Функция для создания шумового эффекта
  const playNoise = useCallback((duration: number, filterFreq?: number) => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Создаем белый шум
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      if (filterFreq) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
        source.connect(filter);
        filter.connect(gainNode);
      } else {
        source.connect(gainNode);
      }

      gainNode.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (error) {
      console.warn('Ошибка воспроизведения шума:', error);
    }
  }, [enabled, volume]);

  // Звуковые эффекты для игры
  const sounds: GameSounds = {
    // Звук обычного прыжка - короткий свист вверх
    jump: useCallback(() => {
      playTone(400, 0.1, 'sine');
      setTimeout(() => playTone(600, 0.1, 'sine'), 50);
    }, [playTone]),

    // Звук двойного прыжка - похож на обычный прыжок, но чуть выше
    doubleJump: useCallback(() => {
      playTone(500, 0.1, 'sine');
      setTimeout(() => playTone(750, 0.1, 'sine'), 50);
    }, [playTone]),

    // Звук сбора бонуса - приятная мелодия
    collectBonus: useCallback(() => {
      const notes = [523, 659, 784]; // C5, E5, G5
      notes.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 0.2, 'sine'), index * 60);
      });
    }, [playTone]),

    // Звук столкновения с препятствием - резкий и неприятный
    hitObstacle: useCallback(() => {
      playTone(150, 0.3, 'sawtooth', false);
      setTimeout(() => playNoise(0.2, 300), 50);
    }, [playTone, playNoise]),

    // Звук завершения комбо - восходящая мелодия
    comboComplete: useCallback(() => {
      const notes = [392, 440, 494, 523, 587]; // G4, A4, B4, C5, D5
      notes.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 0.15, 'sine'), index * 80);
      });
    }, [playTone]),

    // Звук повышения уровня - торжественная мелодия
    levelUp: useCallback(() => {
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 0.25, 'triangle'), index * 100);
      });
    }, [playTone]),

    // Начать фоновую музыку
    startBackgroundMusic: useCallback(() => {
      if (!enabled || !audioContextRef.current || backgroundMusicRef.current.isPlaying) return;

      try {
        const ctx = audioContextRef.current;
        
        // Создаем осциллятор для базовой мелодии
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Низкая громкость для фона
        gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
        
        // Простая повторяющаяся мелодия
        const melody = [262, 294, 330, 294]; // C4, D4, E4, D4
        let noteIndex = 0;
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(melody[0], ctx.currentTime);
        
        // Меняем ноты каждые 2 секунды
        const changeNote = () => {
          if (backgroundMusicRef.current.isPlaying && audioContextRef.current) {
            noteIndex = (noteIndex + 1) % melody.length;
            oscillator.frequency.setTargetAtTime(melody[noteIndex], ctx.currentTime, 0.1);
            setTimeout(changeNote, 2000);
          }
        };
        
        oscillator.start();
        setTimeout(changeNote, 2000);
        
        backgroundMusicRef.current = {
          oscillator,
          gainNode,
          isPlaying: true
        };
      } catch (error) {
        console.warn('Ошибка запуска фоновой музыки:', error);
      }
    }, [enabled, volume]),

    // Остановить фоновую музыку
    stopBackgroundMusic: useCallback(() => {
      if (backgroundMusicRef.current.isPlaying && backgroundMusicRef.current.oscillator) {
        try {
          backgroundMusicRef.current.oscillator.stop();
        } catch (error) {
          console.warn('Ошибка остановки фоновой музыки:', error);
        }
        backgroundMusicRef.current = { isPlaying: false };
      }
    }, []),

    // Завершающая мелодия
    playGameOverMusic: useCallback(() => {
      if (!enabled) return;

      // Грустная нисходящая мелодия
      const notes = [523, 466, 415, 370, 330]; // C5, Bb4, Ab4, F#4, E4
      notes.forEach((freq, index) => {
        setTimeout(() => playTone(freq, 0.5, 'sine'), index * 300);
      });
    }, [enabled, playTone])
  };

  return {
    sounds,
    enabled,
    setEnabled,
    volume,
    setVolume: (newVolume: number) => setVolume(Math.max(0, Math.min(1, newVolume)))
  };
}