import { useEffect } from 'react';
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
    collectBonus,
    hitObstacle,
    shareScore,
    updateGameLogic
  } = useGameState();

  const handleJump = () => {
    if (gameState.state !== 'playing') return;
    
    // Обычный прыжок с земли
    if (player.grounded) {
      setPlayer(prev => ({
        ...prev,
        velocityY: -15,
        grounded: false,
        doubleJumpAvailable: true // Восстанавливаем двойной прыжок
      }));
    }
    // Двойной прыжок в воздухе
    else if (player.doubleJumpAvailable) {
      setPlayer(prev => ({
        ...prev,
        velocityY: -12, // Чуть слабее чем обычный прыжок
        doubleJumpAvailable: false // Тратим двойной прыжок
      }));
    }
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
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-sky-300 via-blue-500 to-blue-900">
      <GameCanvas
        gameState={gameState}
        player={player}
        obstacles={obstacles}
        bonuses={bonuses}
        particles={particles}
        onPlayerUpdate={setPlayer}
        onObstaclesUpdate={setObstacles}
        onBonusesUpdate={setBonuses}
        onParticlesUpdate={setParticles}
        onGameStateUpdate={setGameState}
        onBonusCollect={collectBonus}
        onObstacleHit={hitObstacle}
        onJump={handleJump}
        onUpdateGameLogic={updateGameLogic}
      />
      
      <GameUI
        gameState={gameState}
        showCombo={showCombo}
        onPause={pauseGame}
      />
      
      <GameModals
        gameState={gameState}
        educationalMessage={educationalMessage}
        onStartGame={resetGame}
        onRestartGame={resetGame}
        onResumeGame={resumeGame}
        onShareScore={shareScore}
        onCloseEducation={handleCloseEducation}
      />
    </div>
  );
}
