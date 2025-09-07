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
    if (gameState.state !== 'playing') return;
    jumpRequestRef.current = true; // Сигнализируем о запросе на прыжок
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
        onPause={pauseGame}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onVolumeChange={setVolume}
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
