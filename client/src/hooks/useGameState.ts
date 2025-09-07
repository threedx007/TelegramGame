import { useState, useCallback, useEffect } from 'react';
import { GameState, Player, Obstacle, Bonus, Particle, EducationalMessage } from '@/types/game';

const EDUCATIONAL_MESSAGES: Record<string, EducationalMessage> = {
  fat: { emoji: '🧈', title: 'Жировая пробка!', text: 'Не сливайте жир в септик! Это основная причина засоров.' },
  waste: { emoji: '🗑️', title: 'Твердые отходы!', text: 'Твердые отходы засоряют систему и нарушают работу септика.' },
  chemical: { emoji: '🧪', title: 'Химическое загрязнение!', text: 'Бытовая химия убивает полезные бактерии в септике.' },
  ice: { emoji: '🧊', title: 'Замерзание!', text: 'Утеплите септик на зиму, чтобы избежать замерзания.' },
  lightning: { emoji: '⚡', title: 'Электрические проблемы!', text: 'Регулярно проверяйте компрессор и электрооборудование.' },
  roots: { emoji: '🌳', title: 'Корни деревьев!', text: 'Не устанавливайте септик рядом с большими деревьями.' }
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    state: 'start',
    score: 0,
    distance: 0,
    level: 1,
    combo: 0,
    gameSpeed: 2,
    bestScore: parseInt(localStorage.getItem('septicSurferBest') || '0')
  });

  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: window.innerHeight - 150, // Правильная позиция на земле
    width: 40,
    height: 40,
    velocityY: 0,
    grounded: true,
    color: '#00A8FF'
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [educationalMessage, setEducationalMessage] = useState<EducationalMessage | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const [lastBonusTime, setLastBonusTime] = useState<number>(0);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      state: 'playing',
      score: 0,
      distance: 0,
      level: 1,
      combo: 0,
      gameSpeed: 2
    }));

    setPlayer({
      x: 50,
      y: window.innerHeight - 150, // Правильная позиция на земле
      width: 40,
      height: 40,
      velocityY: 0,
      grounded: true,
      color: '#00A8FF'
    });

    setObstacles([]);
    setBonuses([]);
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
  }, []);

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
      
      console.log('Bonus collected! Points:', points, 'Combo:', newCombo);
      
      if (newCombo > 1) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 2000);
      }

      return {
        ...prev,
        score: prev.score + points,
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
  }, [gameState.state]);

  const hitObstacle = useCallback((obstacle: Obstacle) => {
    const message = EDUCATIONAL_MESSAGES[obstacle.type];
    setEducationalMessage(message);
    setTimeout(() => gameOver(), 1000);
  }, [gameOver]);

  const shareScore = useCallback(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showPopup({
        title: 'Поделиться',
        message: `Я набрал ${gameState.score} очков в игре Септик-Серфер! Попробуй побить мой рекорд!`,
        buttons: [
          { id: 'share', type: 'default', text: 'Поделиться' },
          { type: 'cancel' }
        ]
      });
    }
  }, [gameState.score]);

  // Функция обновления игрового состояния (сброс комбо по времени)
  const updateGameLogic = useCallback(() => {
    if (gameState.state === 'playing') {
      const now = Date.now();
      // Сбрасываем комбо через 3 секунды без бонусов
      if (gameState.combo > 0 && lastBonusTime > 0 && now - lastBonusTime > 3000) {
        console.log('Resetting combo due to timeout');
        setGameState(prev => ({ ...prev, combo: 0 }));
        setLastBonusTime(0);
      }
    }
  }, [gameState.state, gameState.combo, lastBonusTime]);

  return {
    gameState,
    player,
    obstacles,
    bonuses,
    particles,
    educationalMessage,
    showCombo,
    setGameState,
    setPlayer,
    setObstacles,
    setBonuses,
    setParticles,
    setEducationalMessage,
    resetGame,
    pauseGame,
    resumeGame,
    gameOver,
    collectBonus,
    hitObstacle,
    shareScore,
    updateGameLogic
  };
}
