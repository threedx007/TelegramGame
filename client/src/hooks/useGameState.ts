import { useState, useCallback, useEffect } from 'react';
import { GameState, Player, Obstacle, Bonus, Particle, EducationalMessage, Pit, Platform } from '@/types/game';
import { useSound } from './useSound';

const EDUCATIONAL_MESSAGES: Record<string, EducationalMessage> = {
  fat: { emoji: '🧈', title: 'Жировая пробка!', text: 'Не сливайте жир в септик! Это основная причина засоров.' },
  waste: { emoji: '🗑️', title: 'Твердые отходы!', text: 'Твердые отходы засоряют систему и нарушают работу септика.' },
  chemical: { emoji: '🧪', title: 'Химическое загрязнение!', text: 'Бытовая химия убивает полезные бактерии в септике.' },
  ice: { emoji: '🧊', title: 'Замерзание!', text: 'Утеплите септик на зиму, чтобы избежать замерзания.' },
  lightning: { emoji: '⚡', title: 'Электрические проблемы!', text: 'Регулярно проверяйте компрессор и электрооборудование.' },
  roots: { emoji: '🌳', title: 'Корни деревьев!', text: 'Не устанавливайте септик рядом с большими деревьями.' },
  pit: { emoji: '🕳️', title: 'Провал в яму!', text: 'Следите за герметичностью септика! Вода не должна просачиваться наружу.' }
};

export function useGameState() {
  const { sounds, enabled: soundEnabled, setEnabled: setSoundEnabled, volume, setVolume } = useSound();
  
  const [gameState, setGameState] = useState<GameState>({
    state: 'start',
    score: 0,
    distance: 0,
    level: 1,
    combo: 0,
    gameSpeed: 3.0, // Оптимизированная скорость после исправления тайминга
    bestScore: parseInt(localStorage.getItem('septicSurferBest') || '0')
  });

  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: window.innerHeight - 90, // Скорректировано под новую землю (50px + размер игрока)
    width: 50, // Увеличенный размер игрока для лучшей видимости
    height: 50,
    velocityY: 0,
    grounded: true,
    color: '#00A8FF',
    doubleJumpAvailable: true, // Доступен двойной прыжок при старте
    jumpsRemaining: 2 // На старте доступно 2 прыжка
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [pits, setPits] = useState<Pit[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [educationalMessage, setEducationalMessage] = useState<EducationalMessage | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const [lastBonusTime, setLastBonusTime] = useState<number>(0);
  const [comboShowTime, setComboShowTime] = useState<number>(0);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      state: 'playing',
      score: 0,
      distance: 0,
      level: 1,
      combo: 0,
      gameSpeed: 3.0 // Оптимизированная скорость после исправления тайминга
    }));

    setPlayer({
      x: 50,
      y: window.innerHeight - 90, // Скорректировано под новую землю (50px + размер игрока)
      width: 50, // Увеличенный размер игрока для лучшей видимости
      height: 50,
      velocityY: 0,
      grounded: true,
      color: '#00A8FF',
      doubleJumpAvailable: true, // Сброс двойного прыжка при перезапуске
      jumpsRemaining: 2 // Сброс количества прыжков
    });

    setObstacles([]);
    setBonuses([]);
    setPits([]);
    setPlatforms([]);
    setParticles([]);
    setEducationalMessage(null);
    setShowCombo(false);
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, state: 'paused' }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, state: 'playing' }));
  }, []);

  const gameOver = useCallback(() => {
    // Играем завершающую мелодию
    sounds.playGameOverMusic();
    
    setGameState(prev => {
      const newBestScore = Math.max(prev.score, prev.bestScore);
      localStorage.setItem('septicSurferBest', newBestScore.toString());
      
      // Send score to Telegram if available
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify({
          score: prev.score,
          distance: Math.floor(prev.distance),
          timestamp: Date.now()
        }));
      }

      return {
        ...prev,
        state: 'gameOver',
        bestScore: newBestScore
      };
    });
  }, [sounds]);

  const collectBonus = useCallback((bonus: Bonus) => {
    console.log('Collecting bonus:', bonus, 'Game state before:', gameState.state);
    
    // Проверяем, что игра все еще идет
    if (gameState.state !== 'playing') {
      console.log('Game not playing, ignoring bonus collection');
      return;
    }
    
    const now = Date.now();
    setLastBonusTime(now);
    
    setGameState(prev => {
      const newCombo = prev.combo + 1;
      const multiplier = Math.min(newCombo, 4);
      const points = bonus.value * multiplier;
      const newScore = prev.score + points;
      const newLevel = Math.floor(newScore / 500) + 1;
      const leveledUp = newLevel > prev.level;
      
      console.log('Bonus collected! Points:', points, 'Combo:', newCombo);
      
      // Play appropriate sound effects
      sounds.collectBonus();
      
      if (newCombo > 1) {
        setShowCombo(true);
        setComboShowTime(now);
        if (newCombo >= 5) {
          sounds.comboComplete();
        }
      }
      
      if (leveledUp) {
        sounds.levelUp();
      }

      return {
        ...prev,
        score: newScore,
        level: newLevel,
        combo: newCombo
      };
    });

    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        x: bonus.x + bonus.width / 2,
        y: bonus.y + bonus.height / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 3,
        color: bonus.color,
        life: 30,
        maxLife: 30
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, [gameState.state, sounds]);

  const hitObstacle = useCallback((obstacle: Obstacle) => {
    const message = EDUCATIONAL_MESSAGES[obstacle.type];
    setEducationalMessage(message);
    // Play hit sound
    sounds.hitObstacle();
    // Игра сразу завершается при столкновении
    gameOver();
  }, [sounds, gameOver]);

  const fallIntoPit = useCallback((pit: Pit) => {
    const message = EDUCATIONAL_MESSAGES['pit'];
    setEducationalMessage(message);
    // Play hit sound
    sounds.hitObstacle();
    // Игра сразу завершается при падении в яму
    gameOver();
  }, [sounds, gameOver]);

  const shareScore = useCallback(() => {
    const shareText = `🏆 Я набрал ${gameState.score} очков в игре "Септик-Серфер"! 💧

🎮 Игра о правильном уходе за септиком
📏 Дистанция: ${Math.floor(gameState.distance)} метров

Попробуй побить мой рекорд! 🚀`;
    
    if (window.Telegram?.WebApp) {
      // Используем простой подход для Telegram Web App
      try {
        window.Telegram.WebApp.sendData(JSON.stringify({
          action: 'share_score',
          score: gameState.score,
          distance: Math.floor(gameState.distance),
          text: shareText
        }));
      } catch (error) {
        // Fallback к показу текста для ручного копирования
        prompt('📋 Скопируйте результат:', shareText);
      }
    } else {
      // Fallback для браузера (не в Telegram)
      if (navigator.share) {
        navigator.share({
          title: 'Септик-Серфер - Мой результат',
          text: shareText,
          url: window.location.href
        }).catch(() => {
          // Если не удалось поделиться, показываем текст для ручного копирования
          prompt('📋 Скопируйте результат:', shareText);
        });
      } else if (navigator.clipboard) {
        // Проверяем, что документ в фокусе перед копированием
        if (document.hasFocus()) {
          navigator.clipboard.writeText(shareText).then(() => {
            alert('✅ Результат скопирован в буфер обмена!');
          }).catch(() => {
            // Показываем текст для ручного копирования
            prompt('📋 Скопируйте результат:', shareText);
          });
        } else {
          // Документ не в фокусе - показываем текст для ручного копирования
          prompt('📋 Скопируйте результат:', shareText);
        }
      } else {
        // Показываем текст для ручного копирования
        prompt('📋 Скопируйте результат:', shareText);
      }
    }
  }, [gameState.score, gameState.distance]);

  // Функция обновления игрового состояния (сброс комбо по времени)
  const updateGameLogic = useCallback(() => {
    if (gameState.state === 'playing') {
      const now = Date.now();
      
      // Скрываем комбо через 2 секунды показа
      if (showCombo && comboShowTime > 0 && now - comboShowTime > 2000) {
        console.log('Hiding combo display');
        setShowCombo(false);
        setComboShowTime(0);
      }
      
      // Сбрасываем комбо через 3 секунды без бонусов
      if (gameState.combo > 0 && lastBonusTime > 0 && now - lastBonusTime > 3000) {
        console.log('Resetting combo due to timeout');
        setGameState(prev => ({ ...prev, combo: 0 }));
        setLastBonusTime(0);
      }
    }
  }, [gameState.state, gameState.combo, lastBonusTime, showCombo, comboShowTime]);

  return {
    gameState,
    player,
    obstacles,
    bonuses,
    pits,
    platforms,
    particles,
    educationalMessage,
    showCombo,
    setGameState,
    setPlayer,
    setObstacles,
    setBonuses,
    setPits,
    setPlatforms,
    setParticles,
    setEducationalMessage,
    resetGame,
    pauseGame,
    resumeGame,
    gameOver,
    collectBonus,
    hitObstacle,
    fallIntoPit,
    shareScore,
    updateGameLogic,
    // Sound controls
    sounds,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume
  };
}
