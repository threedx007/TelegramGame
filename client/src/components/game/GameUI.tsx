import { GameState } from '@/types/game';

interface GameUIProps {
  gameState: GameState;
  showCombo: boolean;
  onPause: () => void;
}

export default function GameUI({ gameState, showCombo, onPause }: GameUIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <div className="text-primary font-bold text-xl">{gameState.score}</div>
          <div className="text-xs text-muted-foreground">Очки</div>
        </div>
        
        <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <div className="text-primary font-bold text-lg">{Math.floor(gameState.distance)}м</div>
          <div className="text-xs text-muted-foreground">Дистанция</div>
        </div>
        
        <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <div className="text-primary font-bold text-lg">{gameState.level}</div>
          <div className="text-xs text-muted-foreground">Уровень</div>
        </div>
      </div>

      {/* Combo Indicator */}
      {showCombo && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
            КОМБО x{gameState.combo}!
          </div>
        </div>
      )}

      {/* Control Instructions */}
      {gameState.state === 'playing' && gameState.distance < 100 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg animate-bounce">
            <div className="text-sm text-gray-700 mb-2">🎮 Управление</div>
            <div className="text-xs text-gray-600">Тап - прыжок | Свайп - движение</div>
          </div>
        </div>
      )}

      {/* Pause Button */}
      {gameState.state === 'playing' && (
        <button 
          data-testid="button-pause"
          onClick={onPause}
          className="pointer-events-auto absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
        >
          <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}
