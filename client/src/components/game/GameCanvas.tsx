import { useEffect, useRef, useCallback, useState } from 'react';
import { Player, Obstacle, Bonus, Particle, GameState } from '@/types/game';
import { GameSounds } from '@/hooks/useSound';

// Импорты SVG спрайтов с идеальной прозрачностью
import {
  PlayerSprite,
  BacteriaSprite,
  BubbleSprite,
  FilterSprite,
  KeySprite,
  FatSprite,
  WasteSprite,
  ChemicalSprite,
  IceSprite,
  LightningSprite,
  RootsSprite,
} from './GameSprites';

interface GameCanvasProps {
  gameState: GameState;
  player: Player;
  obstacles: Obstacle[];
  bonuses: Bonus[];
  particles: Particle[];
  jumpRequestRef: React.MutableRefObject<boolean>;
  onPlayerUpdate: (player: Player) => void;
  onObstaclesUpdate: (obstacles: Obstacle[]) => void;
  onBonusesUpdate: (bonuses: Bonus[]) => void;
  onParticlesUpdate: (particles: Particle[]) => void;
  onGameStateUpdate: (gameState: GameState) => void;
  onBonusCollect: (bonus: Bonus) => void;
  onObstacleHit: (obstacle: Obstacle) => void;
  onJump: () => void;
  onUpdateGameLogic: () => void;
  sounds: GameSounds;
}

export default function GameCanvas({
  gameState,
  player,
  obstacles,
  bonuses,
  particles,
  jumpRequestRef,
  onPlayerUpdate,
  onObstaclesUpdate,
  onBonusesUpdate,
  onParticlesUpdate,
  onGameStateUpdate,
  onBonusCollect,
  onObstacleHit,
  onJump,
  onUpdateGameLogic,
  sounds
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Состояние для загруженных изображений
  const [svgImages, setSvgImages] = useState<{
    player?: HTMLImageElement;
    bonuses?: {
      bacteria?: HTMLImageElement;
      bubble?: HTMLImageElement;
      filter?: HTMLImageElement;
      key?: HTMLImageElement;
    };
    obstacles?: {
      fat?: HTMLImageElement;
      waste?: HTMLImageElement;
      chemical?: HTMLImageElement;
      ice?: HTMLImageElement;
      lightning?: HTMLImageElement;
      roots?: HTMLImageElement;
    };
  }>({});

  const checkCollision = useCallback((rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }, []);

  // Функция проверки столкновений с уменьшенной областью для более точного определения
  const checkCollisionWithPadding = useCallback((rect1: any, rect2: any, paddingPercent: number = 0.25) => {
    // Уменьшаем область второго объекта (препятствия) на указанный процент
    const padding = {
      width: rect2.width * paddingPercent,
      height: rect2.height * paddingPercent
    };
    
    const adjustedRect2 = {
      x: rect2.x + padding.width / 2,
      y: rect2.y + padding.height / 2,
      width: rect2.width - padding.width,
      height: rect2.height - padding.height
    };
    
    return rect1.x < adjustedRect2.x + adjustedRect2.width &&
           rect1.x + rect1.width > adjustedRect2.x &&
           rect1.y < adjustedRect2.y + adjustedRect2.height &&
           rect1.y + rect1.height > adjustedRect2.y;
  }, []);

  const spawnObstacle = useCallback((canvasWidth: number, canvasHeight: number) => {
    const types: Obstacle['type'][] = ['fat', 'waste', 'chemical', 'ice', 'lightning', 'roots'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = {
      fat: '#FFD700',
      waste: '#8B4513',
      chemical: '#9932CC',
      ice: '#B0E0E6',
      lightning: '#FFFF00',
      roots: '#228B22'
    };

    // Варианты высот: больше препятствий на земле для принуждения к прыжкам
    // Учитываем размер препятствий чтобы они не уходили под землю
    const obstacleHeight = 65 + Math.random() * 20; // Увеличенный размер препятствий
    const groundLevel = canvasHeight - 50; // Уровень земли
    const heightVariants = [
      groundLevel - obstacleHeight, // На земле - не уходит под землю
      groundLevel - obstacleHeight, // На земле (дублируем для увеличения вероятности)
      canvasHeight - 140, // Средняя высота - можно пройти одним прыжком
      canvasHeight - 210, // Высоко - нужен двойной прыжок
    ];
    const yPosition = heightVariants[Math.floor(Math.random() * heightVariants.length)];

    const obstacle: Obstacle = {
      x: canvasWidth + 100, // Спавним за пределами экрана
      y: yPosition,
      width: 65 + Math.random() * 20, // Увеличенный размер препятствий для лучшего различения
      height: obstacleHeight, // Используем предварительно рассчитанную высоту
      type,
      color: colors[type]
    };

    // Добавляем движение для воздушных препятствий (30% шанс)
    if (yPosition < groundLevel - obstacleHeight && Math.random() < 0.3) {
      obstacle.velocityY = 1 + Math.random() * 2; // Скорость движения 1-3 пикселя/кадр
      obstacle.oscillationCenter = yPosition;
      obstacle.oscillationRange = 50 + Math.random() * 30; // Радиус колебаний 50-80 пикселей
    }

    return obstacle;
  }, []);

  const spawnBonus = useCallback((canvasWidth: number, canvasHeight: number) => {
    const types: Bonus['type'][] = ['bacteria', 'bubble', 'filter', 'key'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = {
      bacteria: '#32CD32',
      bubble: '#FFFFFF',
      filter: '#4169E1',
      key: '#FFD700'
    };

    // Бонусы на достижимых высотах (с учетом двойного прыжка)
    // Учитываем размер бонусов чтобы они не уходили под землю
    const bonusHeight = 40;
    const groundLevel = canvasHeight - 50; // Уровень земли
    const heightVariants = [
      groundLevel - bonusHeight, // Низко - не уходит под землю
      canvasHeight - 160, // Средне
      canvasHeight - 220, // Высоко (двойной прыжок)
    ];
    const yPosition = heightVariants[Math.floor(Math.random() * heightVariants.length)];

    return {
      x: canvasWidth + 150, // Спавним за пределами экрана, чуть дальше препятствий
      y: yPosition,
      width: 40, // Увеличенный размер бонусов
      height: 40,
      type,
      color: colors[type],
      value: type === 'key' ? 50 : type === 'bacteria' ? 10 : 5
    };
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
    if (svgImages.player) {
      // Отрисовка SVG-спрайта игрока
      ctx.drawImage(
        svgImages.player,
        player.x,
        player.y,
        player.width,
        player.height
      );
    } else {
      // Fallback - рисуем как раньше если изображение не загружено
      ctx.save();
      
      // Main drop body
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(player.x + 20, player.y + 30, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Drop shape top
      ctx.beginPath();
      ctx.moveTo(player.x + 20, player.y + 5);
      ctx.quadraticCurveTo(player.x + 10, player.y + 20, player.x + 20, player.y + 30);
      ctx.quadraticCurveTo(player.x + 30, player.y + 20, player.x + 20, player.y + 5);
      ctx.fill();

      // Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(player.x + 15, player.y + 22, 4, 0, Math.PI * 2);
      ctx.arc(player.x + 25, player.y + 22, 4, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(player.x + 15, player.y + 22, 2, 0, Math.PI * 2);
      ctx.arc(player.x + 25, player.y + 22, 2, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(player.x + 17, player.y + 18, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }, [svgImages.player]);

  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const obstacleImage = svgImages.obstacles?.[obstacle.type];
    if (obstacleImage) {
      // Отрисовка SVG-спрайта препятствия
      ctx.drawImage(
        obstacleImage,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
    } else {
      // Fallback - рисуем как раньше если изображение не загружено
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      // Черная рамка для видимости
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  }, [svgImages.obstacles]);

  const drawBonus = useCallback((ctx: CanvasRenderingContext2D, bonus: Bonus) => {
    const bonusImage = svgImages.bonuses?.[bonus.type];
    if (bonusImage) {
      // Отрисовка SVG-спрайта бонуса
      ctx.drawImage(
        bonusImage,
        bonus.x,
        bonus.y,
        bonus.width,
        bonus.height
      );
    } else {
      // Fallback - рисуем как раньше если изображение не загружено
      ctx.save();
      
      ctx.fillStyle = bonus.color;
      ctx.fillRect(bonus.x, bonus.y, bonus.width, bonus.height);
      
      // Белая рамка для контраста
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(bonus.x, bonus.y, bonus.width, bonus.height);
      
      ctx.restore();
    }
  }, [svgImages.bonuses]);

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, particle: Particle) => {
    ctx.save();
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  const update = useCallback((deltaTime: number) => {
    if (gameState.state !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Создаем локальные копии массивов для работы  
    let currentObstacles = [...obstacles];
    let currentBonuses = [...bonuses];

    // Обработка запроса на прыжок
    const updatedPlayer = { ...player };
    if (jumpRequestRef.current) {
      // Обычный прыжок с земли
      if (updatedPlayer.grounded) {
        updatedPlayer.velocityY = -18; // Увеличили силу прыжка для больших спрайтов
        updatedPlayer.grounded = false;
        updatedPlayer.doubleJumpAvailable = true; // Восстанавливаем двойной прыжок
        sounds.jump();
      }
      // Двойной прыжок в воздухе
      else if (updatedPlayer.doubleJumpAvailable) {
        updatedPlayer.velocityY = -15; // Увеличили силу двойного прыжка
        updatedPlayer.doubleJumpAvailable = false; // Тратим двойной прыжок
        sounds.doubleJump();
      }
      jumpRequestRef.current = false; // Сбрасываем запрос
    }

    // Update player physics
    if (!updatedPlayer.grounded) {
      updatedPlayer.velocityY += 0.8; // gravity
    }
    updatedPlayer.y += updatedPlayer.velocityY;

    // Ground collision - скорректировано под новую землю и размер игрока
    const groundY = canvas.height - 50 - updatedPlayer.height; // 50px земли + высота игрока
    if (updatedPlayer.y >= groundY) {
      updatedPlayer.y = groundY;
      updatedPlayer.velocityY = 0;
      updatedPlayer.grounded = true;
      updatedPlayer.doubleJumpAvailable = true; // Восстанавливаем двойной прыжок при приземлении
    }

    onPlayerUpdate(updatedPlayer);

    // Update game state - более реалистичный рост дистанции
    // Дистанция растет пропорционально скорости игры, но в метрах, а не пикселях
    const distanceIncrement = gameState.gameSpeed * 0.1; // 0.1 метра за пиксель движения
    const newDistance = gameState.distance + distanceIncrement;
    const newLevel = Math.floor(newDistance / 100) + 1; // Новый уровень каждые 100 метров
    const newSpeed = Math.min(4 + (newLevel - 1) * 0.3, 8); // Увеличенная базовая скорость с плавным ускорением

    onGameStateUpdate({
      ...gameState,
      distance: newDistance,
      level: newLevel,
      gameSpeed: newSpeed
    });

    // Функция проверки пересечений объектов
    const checkObjectOverlap = (newObj: any, existingObjs: any[]) => {
      return existingObjs.some(obj => {
        const distance = Math.abs(newObj.x - obj.x);
        return distance < 150; // Минимальное расстояние между объектами
      });
    };

    // Спавн препятствий (прогрессивное увеличение сложности)
    const obstacleSpawnRate = Math.min(0.025 + gameState.level * 0.002, 0.045); // Частота растет с уровнем
    const maxObstacles = Math.min(6 + Math.floor(gameState.level / 3), 10); // Максимум препятствий растет с уровнем
    if (Math.random() < obstacleSpawnRate && currentObstacles.length < maxObstacles) {
      const newObstacle = spawnObstacle(canvas.width, canvas.height);
      if (!checkObjectOverlap(newObstacle, [...currentObstacles, ...currentBonuses])) {
        currentObstacles.push(newObstacle);
      }
    }
    
    // Спавн бонусов (с учетом сложности - чем выше уровень, тем меньше бонусов)
    const bonusSpawnRate = Math.max(0.015 - gameState.level * 0.001, 0.008);
    if (Math.random() < bonusSpawnRate && currentBonuses.length < 2) {
      const newBonus = spawnBonus(canvas.width, canvas.height);
      if (!checkObjectOverlap(newBonus, [...currentObstacles, ...currentBonuses])) {
        currentBonuses.push(newBonus);
      }
    }
    
    // Гарантируем минимальное количество объектов на экране
    const totalObjects = currentObstacles.length + currentBonuses.length;
    if (totalObjects < 2) {
      // Принудительно спавним объект если экран пустой
      if (Math.random() < 0.7) {
        // 70% шанс спавна препятствия
        const newObstacle = spawnObstacle(canvas.width, canvas.height);
        if (!checkObjectOverlap(newObstacle, [...currentObstacles, ...currentBonuses])) {
          currentObstacles.push(newObstacle);
        }
      } else {
        // 30% шанс спавна бонуса
        const newBonus = spawnBonus(canvas.width, canvas.height);
        if (!checkObjectOverlap(newBonus, [...currentObstacles, ...currentBonuses])) {
          currentBonuses.push(newBonus);
        }
      }
    }

    // Update obstacles
    const updatedObstacles = currentObstacles.filter(obstacle => {
      obstacle.x -= gameState.gameSpeed;
      
      // Обновляем движение по вертикали для движущихся препятствий
      if (obstacle.velocityY !== undefined && obstacle.oscillationCenter !== undefined && obstacle.oscillationRange !== undefined) {
        obstacle.y += obstacle.velocityY;
        
        // Отскок от границ колебаний
        if (obstacle.y <= obstacle.oscillationCenter - obstacle.oscillationRange || 
            obstacle.y >= obstacle.oscillationCenter + obstacle.oscillationRange) {
          obstacle.velocityY = -obstacle.velocityY;
        }
      }
      
      if (obstacle.x + obstacle.width < 0) return false;
      
      if (checkCollisionWithPadding(updatedPlayer, obstacle, 0.3)) {
        onObstacleHit(obstacle);
        return false;
      }
      return true;
    });
    
    // Update bonuses
    const updatedBonuses = currentBonuses.filter(bonus => {
      bonus.x -= gameState.gameSpeed;
      if (bonus.x + bonus.width < 0) return false;
      
      if (checkCollision(updatedPlayer, bonus)) {
        onBonusCollect(bonus);
        return false;
      }
      return true;
    });
    
    
    // Обновляем состояния
    onObstaclesUpdate(updatedObstacles);
    onBonusesUpdate(updatedBonuses);

    // Update particles
    const updatedParticles = particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    });
    onParticlesUpdate(updatedParticles);
    
    // Обновляем игровую логику (комбо, таймеры)
    onUpdateGameLogic();
  }, [gameState.state, gameState.distance, gameState.gameSpeed, player, obstacles, bonuses, particles, jumpRequestRef, onPlayerUpdate, onObstaclesUpdate, onBonusesUpdate, onParticlesUpdate, onGameStateUpdate, onBonusCollect, onObstacleHit, spawnObstacle, spawnBonus, checkCollision, checkCollisionWithPadding, onUpdateGameLogic]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#4682B4');
    gradient.addColorStop(1, '#1e3c72');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground - меньше места, ближе к низу
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Draw game objects
    drawPlayer(ctx, player);
    obstacles.forEach(obstacle => drawObstacle(ctx, obstacle));
    bonuses.forEach(bonus => drawBonus(ctx, bonus));
    particles.forEach(particle => drawParticle(ctx, particle));
    
  }, [player, obstacles, bonuses, particles, drawPlayer, drawObstacle, drawBonus, drawParticle]);

  // Удаляем отдельную функцию gameLoop, так как логика перенесена в useEffect

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const handleInput = useCallback(() => {
    if (gameState.state === 'playing') {
      onJump();
    }
  }, [gameState.state, onJump]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleInput();
  }, [handleInput]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleInput();
  }, [handleInput]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      handleInput();
    }
  }, [handleInput]);

  // Создание SVG спрайтов при монтировании компонента
  useEffect(() => {
    const svgToImage = (SvgComponent: React.ComponentType<{x: number; y: number; width: number; height: number}>, width: number, height: number): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        // Создаем SVG элемент
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('width', width.toString());
        svgElement.setAttribute('height', height.toString());
        svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        // Создаем виртуальный div для рендера React компонента
        const tempDiv = document.createElement('div');
        
        // Детальное SVG содержимое для каждого типа спрайта
        const getSvgContent = () => {
          // Игрок - водяная капля
          if (SvgComponent === PlayerSprite) {
            return `
              <g>
                <path d="M 25 5 C 45 5 45 20 45 35 C 45 45 35 45 25 45 C 15 45 5 45 5 35 C 5 20 5 5 25 5 Z" fill="#00A8FF" stroke="#003366" stroke-width="2"/>
                <ellipse cx="17.5" cy="15" rx="5" ry="7.5" fill="#87CEEB" opacity="0.7"/>
                <ellipse cx="32.5" cy="12.5" rx="2.5" ry="4" fill="#FFFFFF" opacity="0.9"/>
                <circle cx="17.5" cy="27.5" r="4" fill="#000000"/>
                <circle cx="32.5" cy="27.5" r="4" fill="#000000"/>
                <circle cx="18.5" cy="26" r="1.5" fill="#FFFFFF"/>
                <circle cx="33.5" cy="26" r="1.5" fill="#FFFFFF"/>
                <path d="M 15 37.5 Q 25 42.5 35 37.5" stroke="#000000" stroke-width="2" fill="none" stroke-linecap="round"/>
                <polygon points="7.5,10 9,12.5 7.5,15 6,12.5" fill="#FFFFFF" opacity="0.8"/>
                <polygon points="42.5,7.5 44,10 42.5,12.5 41,10" fill="#FFFFFF" opacity="0.8"/>
                <polygon points="45,30 46,31.5 45,33 44,31.5" fill="#FFFFFF" opacity="0.8"/>
              </g>
            `;
          }
          
          // Бонусы - лучше заполняют прямоугольную область 40x40
          if (SvgComponent === BacteriaSprite) {
            return `
              <g>
                <circle cx="20" cy="20" r="18" fill="#32CD32" stroke="#228B22" stroke-width="2"/>
                <circle cx="12" cy="12" r="4" fill="#90EE90"/>
                <circle cx="28" cy="12" r="4" fill="#90EE90"/>
                <circle cx="20" cy="28" r="5" fill="#90EE90"/>
                <path d="M 2 20 Q 8 12 14 20" stroke="#228B22" stroke-width="2" fill="none"/>
                <path d="M 26 20 Q 32 12 38 20" stroke="#228B22" stroke-width="2" fill="none"/>
                <circle cx="20" cy="20" r="3" fill="#FFFFFF"/>
                <circle cx="6" cy="25" r="2" fill="#90EE90"/>
                <circle cx="34" cy="25" r="2" fill="#90EE90"/>
              </g>
            `;
          }
          
          if (SvgComponent === BubbleSprite) {
            return `
              <g>
                <circle cx="20" cy="20" r="18" fill="#F0F8FF" stroke="#B0E0E6" stroke-width="2" opacity="0.9"/>
                <circle cx="12" cy="12" r="5" fill="#FFFFFF" opacity="0.8"/>
                <circle cx="8" cy="8" r="2.5" fill="#FFFFFF"/>
                <circle cx="32" cy="15" r="3" fill="#FFFFFF" opacity="0.7"/>
                <circle cx="28" cy="30" r="2" fill="#FFFFFF"/>
                <circle cx="15" cy="32" r="1.5" fill="#FFFFFF"/>
                <circle cx="35" cy="28" r="1" fill="#FFFFFF"/>
              </g>
            `;
          }
          
          if (SvgComponent === FilterSprite) {
            return `
              <g>
                <rect x="2" y="5" width="36" height="30" fill="#4169E1" stroke="#191970" stroke-width="2" rx="4"/>
                <rect x="5" y="8" width="30" height="24" fill="#6495ED"/>
                <line x1="5" y1="12" x2="35" y2="12" stroke="#191970" stroke-width="1"/>
                <line x1="5" y1="16" x2="35" y2="16" stroke="#191970" stroke-width="1"/>
                <line x1="5" y1="20" x2="35" y2="20" stroke="#191970" stroke-width="1"/>
                <line x1="5" y1="24" x2="35" y2="24" stroke="#191970" stroke-width="1"/>
                <line x1="5" y1="28" x2="35" y2="28" stroke="#191970" stroke-width="1"/>
                <circle cx="10" cy="14" r="1.5" fill="#FFFFFF"/>
                <circle cx="30" cy="18" r="1.5" fill="#FFFFFF"/>
                <circle cx="15" cy="26" r="1.5" fill="#FFFFFF"/>
              </g>
            `;
          }
          
          if (SvgComponent === KeySprite) {
            return `
              <g>
                <circle cx="12" cy="20" r="10" fill="#FFD700" stroke="#DAA520" stroke-width="2"/>
                <circle cx="12" cy="20" r="6" fill="none" stroke="#DAA520" stroke-width="2"/>
                <rect x="22" y="17" width="16" height="6" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
                <rect x="32" y="15" width="4" height="3" fill="#FFD700"/>
                <rect x="32" y="25" width="4" height="3" fill="#FFD700"/>
                <rect x="28" y="19" width="4" height="3" fill="#FFD700"/>
                <circle cx="12" cy="20" r="3" fill="#DAA520"/>
              </g>
            `;
          }
          
          // Препятствия - увеличены и лучше заполняют прямоугольную область 85x85
          if (SvgComponent === FatSprite) {
            return `
              <g>
                <rect x="5" y="5" width="75" height="75" rx="35" ry="35" fill="#8B4513" stroke="#654321" stroke-width="3"/>
                <ellipse cx="28" cy="28" rx="18" ry="15" fill="#A0522D"/>
                <ellipse cx="57" cy="57" rx="15" ry="12" fill="#A0522D"/>
                <circle cx="25" cy="25" r="4" fill="#654321"/>
                <circle cx="50" cy="35" r="3" fill="#654321"/>
                <circle cx="60" cy="54" r="3" fill="#654321"/>
                <circle cx="35" cy="65" r="3" fill="#654321"/>
              </g>
            `;
          }
          
          if (SvgComponent === WasteSprite) {
            return `
              <g>
                <rect x="3" y="10" width="78" height="65" rx="20" ry="20" fill="#8B4513" stroke="#654321" stroke-width="3"/>
                <ellipse cx="35" cy="35" rx="22" ry="18" fill="#A0522D"/>
                <circle cx="58" cy="28" r="8" fill="#654321"/>
                <circle cx="20" cy="50" r="6" fill="#8B4513"/>
                <line x1="12" y1="12" x2="25" y2="28" stroke="#654321" stroke-width="4"/>
                <line x1="65" y1="20" x2="55" y2="35" stroke="#654321" stroke-width="4"/>
                <line x1="42" y1="5" x2="42" y2="20" stroke="#654321" stroke-width="4"/>
                <circle cx="72" cy="58" r="4" fill="#654321"/>
              </g>
            `;
          }
          
          if (SvgComponent === ChemicalSprite) {
            return `
              <g>
                <rect x="5" y="5" width="75" height="75" rx="35" ry="35" fill="#9932CC" stroke="#8B008B" stroke-width="3"/>
                <circle cx="28" cy="28" r="15" fill="#DA70D6" opacity="0.7"/>
                <circle cx="58" cy="20" r="10" fill="#FF69B4" opacity="0.8"/>
                <circle cx="65" cy="58" r="12" fill="#FF1493" opacity="0.6"/>
                <path d="M 12 12 Q 20 20 28 12" stroke="#8B008B" stroke-width="3" fill="none"/>
                <path d="M 58 5 Q 65 12 72 5" stroke="#8B008B" stroke-width="3" fill="none"/>
                <circle cx="42" cy="42" r="6" fill="#FFFFFF"/>
                <circle cx="20" cy="65" r="4" fill="#FFFFFF" opacity="0.8"/>
              </g>
            `;
          }
          
          if (SvgComponent === IceSprite) {
            return `
              <g>
                <polygon points="42,3 78,20 74,70 11,70 7,20" fill="#87CEEB" stroke="#4682B4" stroke-width="3"/>
                <polygon points="42,12 68,25 65,60 20,60 17,25" fill="#B0E0E6"/>
                <line x1="42" y1="3" x2="42" y2="70" stroke="#4682B4" stroke-width="3"/>
                <line x1="7" y1="35" x2="78" y2="35" stroke="#4682B4" stroke-width="3"/>
                <line x1="17" y1="12" x2="65" y2="58" stroke="#4682B4" stroke-width="2"/>
                <line x1="68" y1="12" x2="20" y2="58" stroke="#4682B4" stroke-width="2"/>
                <circle cx="42" cy="35" r="4" fill="#FFFFFF"/>
                <circle cx="28" cy="50" r="3" fill="#FFFFFF"/>
                <circle cx="56" cy="50" r="3" fill="#FFFFFF"/>
              </g>
            `;
          }
          
          if (SvgComponent === LightningSprite) {
            return `
              <g>
                <polygon points="28,3 58,35 42,42 72,82 35,50 50,35 14,65 28,35" fill="#FFD700" stroke="#FFA500" stroke-width="3"/>
                <polygon points="35,12 50,32 42,40 60,68 40,45 45,32 25,50 32,28" fill="#FFFF00"/>
                <circle cx="42" cy="20" r="4" fill="#FFFFFF"/>
                <circle cx="35" cy="42" r="3" fill="#FFFFFF"/>
                <circle cx="50" cy="58" r="3" fill="#FFFFFF"/>
                <circle cx="65" cy="72" r="2" fill="#FFFFFF"/>
              </g>
            `;
          }
          
          if (SvgComponent === RootsSprite) {
            return `
              <g>
                <rect x="5" y="25" width="75" height="50" rx="15" ry="8" fill="#8B4513" stroke="#654321" stroke-width="3" opacity="0.3"/>
                <path d="M 12 42 Q 22 35 32 42 Q 42 50 52 42 Q 62 35 72 42" stroke="#8B4513" stroke-width="7" fill="none"/>
                <path d="M 20 42 Q 12 58 5 72" stroke="#654321" stroke-width="6" fill="none"/>
                <path d="M 50 42 Q 58 58 65 72" stroke="#654321" stroke-width="6" fill="none"/>
                <path d="M 35 42 Q 28 65 20 80" stroke="#654321" stroke-width="6" fill="none"/>
                <path d="M 35 42 Q 42 65 50 80" stroke="#654321" stroke-width="6" fill="none"/>
                <circle cx="8" cy="68" r="4" fill="#228B22"/>
                <circle cx="62" cy="68" r="4" fill="#228B22"/>
                <circle cx="25" cy="78" r="4" fill="#228B22"/>
                <circle cx="45" cy="78" r="4" fill="#228B22"/>
              </g>
            `;
          }
          
          // Фолбэк если тип не найден
          return '<circle cx="25" cy="25" r="20" fill="#ccc"/>';
        };
        
        svgElement.innerHTML = getSvgContent();
        
        // Конвертируем в изображение
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgData)}`;
        
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      });
    };

    const loadAllSvgImages = async () => {
      try {
        const [
          playerImg,
          bacteriaImg, bubbleImg, filterImg, keyImg,
          fatImg, wasteImg, chemicalImg, iceImg, lightningImg, rootsImg
        ] = await Promise.all([
          svgToImage(PlayerSprite, 50, 50),
          // Бонусы
          svgToImage(BacteriaSprite, 40, 40),
          svgToImage(BubbleSprite, 40, 40),
          svgToImage(FilterSprite, 40, 40),
          svgToImage(KeySprite, 40, 40),
          // Препятствия
          svgToImage(FatSprite, 85, 85),
          svgToImage(WasteSprite, 85, 85),
          svgToImage(ChemicalSprite, 85, 85),
          svgToImage(IceSprite, 85, 85),
          svgToImage(LightningSprite, 85, 85),
          svgToImage(RootsSprite, 85, 85)
        ]);

        setSvgImages({
          player: playerImg,
          bonuses: {
            bacteria: bacteriaImg,
            bubble: bubbleImg,
            filter: filterImg,
            key: keyImg
          },
          obstacles: {
            fat: fatImg,
            waste: wasteImg,
            chemical: chemicalImg,
            ice: iceImg,
            lightning: lightningImg,
            roots: rootsImg
          }
        });
      } catch (error) {
        console.error('Ошибка создания SVG спрайтов:', error);
      }
    };

    loadAllSvgImages();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', resizeCanvas);

    // Initialize canvas size
    resizeCanvas();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resizeCanvas);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseDown, handleTouchStart, handleKeyDown, resizeCanvas]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    if (gameState.state === 'playing') {
      update(deltaTime);
      draw();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameState.state, update, draw]);

  // Game loop management
  useEffect(() => {
    if (gameState.state === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [gameState.state, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full touch-none"
      style={{ touchAction: 'none' }}
    />
  );
}
