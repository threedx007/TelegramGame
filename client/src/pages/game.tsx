import { useEffect, useRef } from 'react';
import { useGameState } from '@/hooks/useGameState';
import GameCanvas from '@/components/game/GameCanvas';
import GameUI from '@/components/game/GameUI';
import GameModals from '@/components/game/GameModals';

export default function Game() {
  const {
    gameState,
    player,
    obstacles,
    bonuses,
    pits,
    platforms,
    particles,
    educationalMessage,
    showCombo,
    gameStartTime,
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
    collectBonus,
    hitObstacle,
    fallIntoPit,
    shareScore,
    updateGameLogic,
    sounds,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume
  } = useGameState();

  const jumpRequestRef = useRef(false);

  const handleJump = () => {
    // Агрессивно инициализируем аудио при каждом взаимодействии
    try {
      sounds.initializeAudio();
      console.log('Инициализация аудио при взаимодействии');
    } catch (error) {
      console.error('Ошибка инициализации аудио:', error);
    }
    
    if (gameState.state !== 'playing') return;
    jumpRequestRef.current = true; // Сигнализируем о запросе на прыжок
  };

  const handleStartGame = () => {
    try {
      sounds.initializeAudio();
      console.log('Инициализация аудио при старте игры');
    } catch (error) {
      console.error('Ошибка инициализации аудио при старте:', error);
    }
    resetGame();
  };

  const handlePauseGame = () => {
    try {
      sounds.initializeAudio();
    } catch (error) {
      console.error('Ошибка инициализации аудио при паузе:', error);
    }
    pauseGame();
  };

  const handleResumeGame = () => {
    try {
      sounds.initializeAudio();
    } catch (error) {
      console.error('Ошибка инициализации аудио при возобновлении:', error);
    }
    resumeGame();
  };

  const handleShareScore = () => {
    try {
      sounds.initializeAudio();
    } catch (error) {
      console.error('Ошибка инициализации аудио при расшаривании:', error);
    }
    shareScore();
  };

  const handleCloseEducation = () => {
    setEducationalMessage(null);
  };

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // Попытка разблокировать звук при загрузке для iOS
    const unlockAudio = () => {
      try {
        sounds.initializeAudio();
        console.log('Попытка разблокировки аудио при загрузке');
      } catch (error) {
        console.error('Ошибка разблокировки аудио при загрузке:', error);
      }
    };

    // Добавляем слушатели событий для разблокировки звука на iOS
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, unlockAudio);
      });
    };
  }, [sounds]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-blue-900">
      <GameCanvas
        gameState={gameState}
        player={player}
        obstacles={obstacles}
        bonuses={bonuses}
        pits={pits}
        platforms={platforms}
        particles={particles}
        gameStartTime={gameStartTime}
        jumpRequestRef={jumpRequestRef}
        onPlayerUpdate={setPlayer}
        onObstaclesUpdate={setObstacles}
        onBonusesUpdate={setBonuses}
        onPitsUpdate={setPits}
        onPlatformsUpdate={setPlatforms}
        onParticlesUpdate={setParticles}
        onGameStateUpdate={setGameState}
        onBonusCollect={collectBonus}
        onObstacleHit={hitObstacle}
        onPitFall={fallIntoPit}
        onJump={handleJump}
        onUpdateGameLogic={updateGameLogic}
        sounds={sounds}
      />
      
      <GameUI
        gameState={gameState}
        showCombo={showCombo}
        soundEnabled={soundEnabled}
        volume={volume}
        onPause={handlePauseGame}
        onToggleSound={() => {
          try {
            sounds.initializeAudio();
          } catch (error) {
            console.error('Ошибка инициализации аудио при переключении звука:', error);
          }
          setSoundEnabled(!soundEnabled);
        }}
        onVolumeChange={setVolume}
      />
      
      <GameModals
        gameState={gameState}
        educationalMessage={educationalMessage}
        onStartGame={handleStartGame}
        onRestartGame={handleStartGame}
        onResumeGame={handleResumeGame}
        onShareScore={handleShareScore}
        onCloseEducation={handleCloseEducation}
      />
    </div>
  );
}
