import { GameState, EducationalMessage, Reward } from '@/types/game';

interface GameModalsProps {
  gameState: GameState;
  educationalMessage: EducationalMessage | null;
  onStartGame: () => void;
  onRestartGame: () => void;
  onResumeGame: () => void;
  onShareScore: () => void;
  onCloseEducation: () => void;
}

const REWARDS: Reward[] = [
  { points: 100, title: 'Стикер "Капля Чистюля"', description: 'Фирменный стикер', emoji: '🎖️', unlocked: false },
  { points: 300, title: 'Чек-лист проблем септика', description: '5 признаков неисправности', emoji: '📋', unlocked: false },
  { points: 500, title: 'Скидка 3% на услуги', description: 'На любые услуги Александра', emoji: '💰', unlocked: false },
  { points: 1000, title: 'Бесплатная консультация', description: 'По телефону', emoji: '📞', unlocked: false },
  { points: 2000, title: 'Скидка 5% на установку', description: 'На установку септика', emoji: '🔧', unlocked: false },
  { points: 3000, title: 'Бесплатная диагностика', description: 'Выезд для диагностики', emoji: '🔍', unlocked: false },
  { points: 5000, title: 'Скидка 10% на все услуги', description: 'Максимальная скидка', emoji: '💎', unlocked: false }
];

export default function GameModals({
  gameState,
  educationalMessage,
  onStartGame,
  onRestartGame,
  onResumeGame,
  onShareScore,
  onCloseEducation
}: GameModalsProps) {
  const rewardsWithStatus = REWARDS.map(reward => ({
    ...reward,
    unlocked: gameState.score >= reward.points
  }));

  return (
    <>
      {/* Start Screen Modal */}
      {gameState.state === 'start' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Game Title Section */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💧</div>
              <h1 className="text-2xl font-bold text-primary mb-2">Септик-Серфер</h1>
              <p className="text-gray-600 mb-4">Чистая вода</p>
              <p className="text-sm text-gray-500 mb-6">
                Помогите Капле Чистюле пройти через систему септика, избегая загрязнений!
              </p>
            </div>

            {/* Advertisement Section */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="text-4xl mr-3">🏠</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 text-left">
                    Ваш надёжный помощник
                  </h2>
                  <p className="text-sm text-gray-600 text-left">в автономной канализации:</p>
                </div>
              </div>

              

              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-sm font-bold text-blue-800 mb-1">Контакты для заказа услуг:</div>
                <div className="text-sm text-blue-700">
                  <div data-testid="phone-1">📞 8 (985) 478-11-38</div>
                  <div data-testid="phone-2">📞 8 (985) 991-04-24</div>
                </div>
              </div>
            </div>

            <button 
              data-testid="button-start-game"
              onClick={onStartGame}
              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors"
            >
              🎮 Начать игру
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.state === 'gameOver' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-2xl font-bold text-destructive mb-4">Игра окончена!</h2>
            
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Финальный счет</div>
                <div className="text-xl font-bold text-primary" data-testid="text-final-score">
                  {gameState.score}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Дистанция</div>
                <div className="text-lg font-bold text-primary" data-testid="text-final-distance">
                  {Math.floor(gameState.distance)} м
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Лучший результат</div>
                <div className="text-lg font-bold text-yellow-600" data-testid="text-best-score">
                  {gameState.bestScore}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                data-testid="button-restart"
                onClick={onRestartGame}
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors"
              >
                🔄 Играть еще раз
              </button>
              <button 
                data-testid="button-share"
                onClick={onShareScore}
                className="w-full bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-600 transition-colors"
              >
                📤 Поделиться результатом
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Educational Modal */}
      {educationalMessage && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 text-center shadow-2xl">
            <div className="text-4xl mb-4">{educationalMessage.emoji}</div>
            <h3 className="text-lg font-bold text-primary mb-3">{educationalMessage.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{educationalMessage.text}</p>
            <button 
              data-testid="button-close-education"
              onClick={onCloseEducation}
              className="w-full bg-primary text-white font-bold py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors"
            >
              ✅ Понятно
            </button>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {gameState.state === 'paused' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">⏸️</div>
            <h3 className="text-xl font-bold text-primary mb-6">Игра на паузе</h3>
            <div className="space-y-3">
              <button 
                data-testid="button-resume"
                onClick={onResumeGame}
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors"
              >
                ▶️ Продолжить
              </button>
              <button 
                data-testid="button-restart-from-pause"
                onClick={onRestartGame}
                className="w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-600 transition-colors"
              >
                🔄 Начать заново
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Modal (Hidden by default - can be shown later) */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm items-center justify-center z-50 hidden" id="rewards-modal">
        <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-xl font-bold text-primary">Система наград</h3>
          </div>
          
          <div className="space-y-3 mb-6">
            {rewardsWithStatus.map((reward, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{reward.emoji}</div>
                  <div>
                    <div className="font-bold text-sm">{reward.points} очков</div>
                    <div className="text-xs text-gray-600">{reward.title}</div>
                  </div>
                </div>
                <div className={`text-xs font-bold ${reward.unlocked ? 'text-green-600' : 'text-gray-400'}`}>
                  {reward.unlocked ? '✓' : 'Не получено'}
                </div>
              </div>
            ))}
          </div>

          <button 
            data-testid="button-close-rewards"
            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-600 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  );
}
