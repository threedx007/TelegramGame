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
  initializeAudio: () => void;
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
    bassOscillator?: OscillatorNode;
    isPlaying: boolean;
  }>({ isPlaying: false });

  // Функция инициализации AudioContext (требует пользовательского взаимодействия на мобильных)
  const initializeAudioContext = useCallback(() => {
    if (!enabled) return false;
    
    try {
      // Создаем AudioContext если его нет
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('AudioContext создан, состояние:', audioContextRef.current.state);
      }
      
      // Пытаемся возобновить AudioContext если он заблокирован
      if (audioContextRef.current.state === 'suspended') {
        console.log('Попытка возобновить AudioContext...');
        audioContextRef.current.resume().then(() => {
          console.log('AudioContext возобновлен, состояние:', audioContextRef.current?.state);
        }).catch((error) => {
          console.error('Ошибка возобновления AudioContext:', error);
        });
      }
      
      return audioContextRef.current.state === 'running';
    } catch (error) {
      console.error('Ошибка инициализации AudioContext:', error);
      return false;
    }
  }, [enabled]);

  // Инициализация AudioContext
  useEffect(() => {
    if (enabled && !audioContextRef.current) {
      initializeAudioContext();
    }
  }, [enabled, initializeAudioContext]);

  // Сохранение настроек в localStorage
  useEffect(() => {
    localStorage.setItem('septicSurferSoundEnabled', JSON.stringify(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('septicSurferSoundVolume', volume.toString());
  }, [volume]);

  // Базовая функция для создания звукового тона
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', fadeOut: boolean = true) => {
    if (!enabled) return;
    
    // Пытаемся инициализировать AudioContext при каждом звуке
    const initialized = initializeAudioContext();
    if (!audioContextRef.current || audioContextRef.current.state !== 'running') {
      console.log('AudioContext недоступен для воспроизведения звука');
      return;
    }

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
    if (!enabled) return;
    
    // Инициализируем аудио контекст при первом использовании
    if (!audioContextRef.current) {
      initializeAudioContext();
    }
    
    // Проверяем состояние контекста и возобновляем при необходимости
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (!audioContextRef.current) return;

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
        
        // Создаем основную мелодию
        const melodyOsc = ctx.createOscillator();
        const melodyGain = ctx.createGain();
        
        // Создаем басовую линию для ритма
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        
        // Подключаем мелодию
        melodyOsc.connect(melodyGain);
        melodyGain.connect(ctx.destination);
        
        // Подключаем бас
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        
        // Настройки громкости
        melodyGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
        bassGain.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
        
        // Энергичная мелодия в стиле игры
        const melody = [
          330, 392, 440, 523,  // E4, G4, A4, C5
          494, 440, 392, 330,  // B4, A4, G4, E4  
          349, 415, 494, 587,  // F4, Ab4, B4, D5
          523, 494, 440, 392   // C5, B4, A4, G4
        ];
        
        // Басовая линия для ритма
        const bassLine = [131, 131, 165, 165]; // C3, C3, E3, E3
        
        let melodyIndex = 0;
        let bassIndex = 0;
        
        // Настройки осцилляторов
        melodyOsc.type = 'square'; // Более яркий звук
        bassOsc.type = 'sawtooth';  // Богатый бас
        
        melodyOsc.frequency.setValueAtTime(melody[0], ctx.currentTime);
        bassOsc.frequency.setValueAtTime(bassLine[0], ctx.currentTime);
        
        // Быстрая смена нот для динамичности
        const changeMelodyNote = () => {
          if (backgroundMusicRef.current.isPlaying && audioContextRef.current) {
            melodyIndex = (melodyIndex + 1) % melody.length;
            melodyOsc.frequency.setTargetAtTime(melody[melodyIndex], ctx.currentTime, 0.02);
            setTimeout(changeMelodyNote, 300); // Быстрый темп - каждые 300мс
          }
        };
        
        // Басовая линия меняется реже для создания ритма
        const changeBassNote = () => {
          if (backgroundMusicRef.current.isPlaying && audioContextRef.current) {
            bassIndex = (bassIndex + 1) % bassLine.length;
            bassOsc.frequency.setTargetAtTime(bassLine[bassIndex], ctx.currentTime, 0.05);
            setTimeout(changeBassNote, 600); // Басовый ритм каждые 600мс
          }
        };
        
        melodyOsc.start();
        bassOsc.start();
        
        // Запускаем смену нот
        setTimeout(changeMelodyNote, 300);
        setTimeout(changeBassNote, 600);
        
        backgroundMusicRef.current = {
          oscillator: melodyOsc, // Сохраняем основной осциллятор для остановки
          gainNode: melodyGain,
          isPlaying: true,
          bassOscillator: bassOsc // Дополнительно сохраняем басовый осциллятор
        };
      } catch (error) {
        console.warn('Ошибка запуска фоновой музыки:', error);
      }
    }, [enabled, volume]),

    // Остановить фоновую музыку
    stopBackgroundMusic: useCallback(() => {
      if (backgroundMusicRef.current.isPlaying) {
        try {
          if (backgroundMusicRef.current.oscillator) {
            backgroundMusicRef.current.oscillator.stop();
          }
          if (backgroundMusicRef.current.bassOscillator) {
            backgroundMusicRef.current.bassOscillator.stop();
          }
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
    }, [enabled, playTone]),

    // Инициализация аудио для мобильных устройств
    initializeAudio: initializeAudioContext
  };

  return {
    sounds,
    enabled,
    setEnabled,
    volume,
    setVolume: (newVolume: number) => setVolume(Math.max(0, Math.min(1, newVolume)))
  };
}