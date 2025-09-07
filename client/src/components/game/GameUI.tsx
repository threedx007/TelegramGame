import { GameState } from '@/types/game';
import { useEffect, useState } from 'react';

interface GameUIProps {
  gameState: GameState;
  showCombo: boolean;
  soundEnabled: boolean;
  volume: number;
  onPause: () => void;
  onToggleSound: () => void;
  onVolumeChange: (volume: number) => void;
}

export default function GameUI({ gameState, showCombo, soundEnabled, volume, onPause, onToggleSound, onVolumeChange }: GameUIProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (gameState.state === 'playing' && gameState.score < 100) {
      // Для Telegram WebApp добавляем небольшую задержку, чтобы интерфейс успел прогрузиться
      const isInTelegram = !!(window as any).Telegram?.WebApp;
      const delay = isInTelegram ? 500 : 0;
      
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, delay);

      // Пропадает через 5 секунд
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, delay + 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    } else {
      setShowTooltip(false);
    }
  }, [gameState.state, gameState.score]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        {/* Очки */}
        <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
          <div className="text-primary font-bold text-xl">{gameState.score}</div>
          <div className="text-xs text-muted-foreground">Очки</div>
        </div>
        
        {/* Подсказка о бонусах */}
        <div className="pointer-events-auto bg-blue-100/90 backdrop-blur-sm rounded-xl p-3 shadow-lg max-w-xs">
          <div className="text-xs font-bold text-blue-800 mb-1">🏆 Собирайте бонусы:</div>
          <div className="text-xs text-blue-700 space-y-1">
            <div>🗝️ Ключ = 50 очков</div>
            <div>🧿 Бактерия = 10 очков</div>
            <div>🔧 Фильтр = 5 очков</div>
            <div>💭 Пузырь = 5 очков</div>
          </div>
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
      {showTooltip && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
          <div className="bg-white border-2 border-blue-300 rounded-xl p-4 text-center shadow-xl animate-bounce">
            <div className="text-sm font-bold text-blue-800 mb-2">🎮 Управление</div>
            <div className="text-xs font-medium text-blue-700">Тап - прыжок</div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      {gameState.state === 'playing' && (
        <div className="absolute top-32 right-4 flex flex-col gap-2">
          {/* Sound Toggle Button */}
          <button 
            data-testid="button-sound-toggle"
            onClick={onToggleSound}
            className={`pointer-events-auto bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors ${
              soundEnabled ? 'text-gray-700' : 'text-gray-400'
            }`}
          >
            {soundEnabled ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.793a1 1 0 011.617.793zm1.617 4.924l1.8-1.8a1 1 0 111.4 1.4l-1.8 1.8 1.8 1.8a1 1 0 11-1.4 1.4l-1.8-1.8-1.8 1.8a1 1 0 11-1.4-1.4l1.8-1.8-1.8-1.8a1 1 0 111.4-1.4l1.8 1.8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.793a1 1 0 011.617.793zM18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* Pause Button */}
          <button 
            data-testid="button-pause"
            onClick={onPause}
            className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
