import { useEffect, useRef, useCallback, useState } from 'react';
import { Player, Obstacle, Bonus, Particle, GameState, Pit, Platform } from '@/types/game';
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
  pits: Pit[];
  platforms: Platform[];
  particles: Particle[];
  jumpRequestRef: React.MutableRefObject<boolean>;
  onPlayerUpdate: (player: Player) => void;
  onObstaclesUpdate: (obstacles: Obstacle[]) => void;
  onBonusesUpdate: (bonuses: Bonus[]) => void;
  onPitsUpdate: (pits: Pit[]) => void;
  onPlatformsUpdate: (platforms: Platform[]) => void;
  onParticlesUpdate: (particles: Particle[]) => void;
  onGameStateUpdate: (gameState: GameState) => void;
  onBonusCollect: (bonus: Bonus) => void;
  onObstacleHit: (obstacle: Obstacle) => void;
  onPitFall: (pit: Pit) => void;
  onJump: () => void;
  onUpdateGameLogic: () => void;
  sounds: GameSounds;
}

export default function GameCanvas({
  gameState,
  player,
  obstacles,
  bonuses,
  pits,
  platforms,
  particles,
  jumpRequestRef,
  onPlayerUpdate,
  onObstaclesUpdate,
  onBonusesUpdate,
  onPitsUpdate,
  onPlatformsUpdate,
  onParticlesUpdate,
  onGameStateUpdate,
  onBonusCollect,
  onObstacleHit,
  onPitFall,
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

  const spawnPit = useCallback((canvasWidth: number, canvasHeight: number) => {
    const groundLevel = canvasHeight - 50; // Уровень земли
    const pitWidth = 80 + Math.random() * 40; // Ширина ямы 80-120px
    const pitDepth = 30 + Math.random() * 20; // Глубина ямы 30-50px

    const pit: Pit = {
      x: canvasWidth + 100,
      y: groundLevel, // Ямы всегда на уровне земли
      width: pitWidth,
      height: 50, // Высота равна высоте земли для визуализации
      type: 'pit',
      color: '#2E1B0E', // Темно-коричневый цвет для ямы
      depth: pitDepth
    };

    return pit;
  }, []);

  const spawnPlatform = useCallback((canvasWidth: number, canvasHeight: number) => {
    const materials: Platform['material'][] = ['stone', 'wood', 'metal'];
    const material = materials[Math.floor(Math.random() * materials.length)];
    const colors = {
      stone: '#808080',
      wood: '#8B4513', 
      metal: '#C0C0C0'
    };

    const platformWidth = 100 + Math.random() * 60; // Ширина платформы 100-160px
    const groundLevel = canvasHeight - 50;
    
    // Платформы на разных высотах для добавления вертикальности
    const heightVariants = [
      groundLevel - 80,  // Низкие платформы
      groundLevel - 120, // Средние платформы
      groundLevel - 160, // Высокие платформы
    ];
    const yPosition = heightVariants[Math.floor(Math.random() * heightVariants.length)];

    const platform: Platform = {
      x: canvasWidth + 120,
      y: yPosition,
      width: platformWidth,
      height: 15, // Толщина платформы
      type: 'platform',
      color: colors[material],
      material
    };

    return platform;
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

  const drawPit = useCallback((ctx: CanvasRenderingContext2D, pit: Pit) => {
    ctx.save();
    
    // Рисуем яму как темное углубление в земле
    ctx.fillStyle = pit.color;
    ctx.fillRect(pit.x, pit.y, pit.width, pit.height);
    
    // Добавляем градиент для создания эффекта глубины
    const gradient = ctx.createLinearGradient(pit.x, pit.y, pit.x, pit.y + pit.height);
    gradient.addColorStop(0, '#4A4A4A');
    gradient.addColorStop(0.5, pit.color);
    gradient.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(pit.x + 5, pit.y + 5, pit.width - 10, pit.height - 10);
    
    // Рисуем края ямы
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(pit.x, pit.y, pit.width, pit.height);
    
    ctx.restore();
  }, []);

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, platform: Platform) => {
    ctx.save();
    
    // Основная платформа
    ctx.fillStyle = platform.color;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Добавляем текстуру в зависимости от материала
    if (platform.material === 'stone') {
      // Каменная текстура
      ctx.fillStyle = '#696969';
      for (let i = 0; i < platform.width; i += 20) {
        ctx.fillRect(platform.x + i, platform.y + 2, 15, 2);
        ctx.fillRect(platform.x + i + 5, platform.y + 8, 10, 2);
      }
    } else if (platform.material === 'wood') {
      // Деревянная текстура
      ctx.fillStyle = '#A0522D';
      ctx.fillRect(platform.x, platform.y + 6, platform.width, 3);
      for (let i = 0; i < platform.width; i += 25) {
        ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
      }
    } else if (platform.material === 'metal') {
      // Металлическая текстура
      ctx.fillStyle = '#A9A9A9';
      for (let i = 0; i < platform.width; i += 10) {
        ctx.fillRect(platform.x + i, platform.y + 3, 8, 2);
      }
    }
    
    // Тень под платформой
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(platform.x + 2, platform.y + platform.height, platform.width - 2, 3);
    
    ctx.restore();
  }, []);

  const update = useCallback((deltaTime: number) => {
    if (gameState.state !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Создаем локальные копии массивов для работы  
    let currentObstacles = [...obstacles];
    let currentBonuses = [...bonuses];
    let currentPits = [...pits];
    let currentPlatforms = [...platforms];

    // Обработка запроса на прыжок
    const updatedPlayer = { ...player };
    if (jumpRequestRef.current) {
      // Прыжок доступен, если есть оставшиеся прыжки
      if (updatedPlayer.jumpsRemaining > 0) {
        // Первый прыжок (с земли или платформы)
        if (updatedPlayer.jumpsRemaining === 2) {
          updatedPlayer.velocityY = -12;
          updatedPlayer.grounded = false;
          updatedPlayer.jumpsRemaining = 1;
          sounds.jump();
        }
        // Второй прыжок (двойной прыжок в воздухе)
        else if (updatedPlayer.jumpsRemaining === 1) {
          updatedPlayer.velocityY = -10;
          updatedPlayer.jumpsRemaining = 0;
          updatedPlayer.doubleJumpAvailable = false; // Для совместимости
          sounds.doubleJump();
        }
      }
      jumpRequestRef.current = false; // Сбрасываем запрос
    }

    // Calculate frame-rate independent movement multiplier (normalized to 60 FPS)
    const deltaMultiplier = deltaTime / 16.67;
    
    // Update player physics
    if (!updatedPlayer.grounded) {
      updatedPlayer.velocityY += 0.5 * deltaMultiplier; // gravity
    }
    updatedPlayer.y += updatedPlayer.velocityY * deltaMultiplier;

    // Сначала проверяем коллизии с ямами ДО обработки земли
    let inPit = false;
    for (const pit of currentPits) {
      if (updatedPlayer.x + updatedPlayer.width > pit.x && 
          updatedPlayer.x < pit.x + pit.width) {
        const groundY = canvas.height - 50 - updatedPlayer.height;
        // Если игрок на уровне земли и в области ямы
        if (updatedPlayer.y >= groundY) {
          // Игрок проваливается в яму
          onPitFall(pit);
          inPit = true;
          return; // Прерываем выполнение, игра окончена
        }
      }
    }

    // Platform collision - проверяем коллизии с платформами
    let onPlatform = false;
    let currentPlatformY = null;
    
    for (const platform of currentPlatforms) {
      // Проверяем, находится ли игрок НАД платформой (приземляется сверху)
      const playerBottom = updatedPlayer.y + updatedPlayer.height;
      const playerLeft = updatedPlayer.x;
      const playerRight = updatedPlayer.x + updatedPlayer.width;
      const platformLeft = platform.x;
      const platformRight = platform.x + platform.width;
      const platformTop = platform.y;
      const platformBottom = platform.y + platform.height;
      
      // Проверяем пересечение по X и что игрок приземляется на платформу сверху
      if (playerRight > platformLeft && playerLeft < platformRight &&
          playerBottom >= platformTop && playerBottom <= platformBottom + 5 &&
          updatedPlayer.velocityY >= 0) {
        updatedPlayer.y = platformTop - updatedPlayer.height;
        updatedPlayer.velocityY = 0;
        updatedPlayer.grounded = true;
        updatedPlayer.doubleJumpAvailable = true; // Для совместимости
        updatedPlayer.jumpsRemaining = 2; // Восстанавливаем все прыжки
        onPlatform = true;
        currentPlatformY = platformTop;
        break;
      }
    }

    // Ground collision - только если не на платформе и не в яме
    if (!onPlatform && !inPit) {
      const groundY = canvas.height - 50 - updatedPlayer.height; // 50px земли + высота игрока
      if (updatedPlayer.y >= groundY) {
        updatedPlayer.y = groundY;
        updatedPlayer.velocityY = 0;
        updatedPlayer.grounded = true;
        updatedPlayer.doubleJumpAvailable = true; // Для совместимости
        updatedPlayer.jumpsRemaining = 2; // Восстанавливаем все прыжки
      } else {
        // Игрок в воздухе - не на земле
        updatedPlayer.grounded = false;
      }
    }
    
    // Если игрок был на платформе, но теперь не над ней - он должен упасть
    if (!onPlatform && updatedPlayer.grounded && currentPlatformY !== null) {
      // Проверяем, есть ли платформа под игроком
      let platformUnder = false;
      for (const platform of currentPlatforms) {
        if (updatedPlayer.x + updatedPlayer.width > platform.x && 
            updatedPlayer.x < platform.x + platform.width &&
            Math.abs(updatedPlayer.y + updatedPlayer.height - platform.y) < 5) {
          platformUnder = true;
          break;
        }
      }
      if (!platformUnder) {
        updatedPlayer.grounded = false; // Игрок начинает падать
        updatedPlayer.doubleJumpAvailable = true; // Для совместимости
        updatedPlayer.jumpsRemaining = 2; // Полный набор прыжков при сходе с платформы!
      }
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
    
    // Спавн ям (реже чем препятствия, только на земле)
    const pitSpawnRate = 0.008; // Низкий шанс спавна ям
    if (Math.random() < pitSpawnRate && currentPits.length < 2) {
      const newPit = spawnPit(canvas.width, canvas.height);
      // Ямы не должны пересекаться с другими объектами
      const allObjects = [...currentObstacles, ...currentBonuses, ...currentPits, ...currentPlatforms];
      if (!checkObjectOverlap(newPit, allObjects)) {
        currentPits.push(newPit);
      }
    }
    
    // Спавн платформ (средняя частота спавна)
    const platformSpawnRate = 0.012; // Умеренный шанс спавна платформ
    if (Math.random() < platformSpawnRate && currentPlatforms.length < 3) {
      const newPlatform = spawnPlatform(canvas.width, canvas.height);
      const allObjects = [...currentObstacles, ...currentBonuses, ...currentPits, ...currentPlatforms];
      if (!checkObjectOverlap(newPlatform, allObjects)) {
        currentPlatforms.push(newPlatform);
      }
    }

    // Update obstacles
    const updatedObstacles = currentObstacles.filter(obstacle => {
      obstacle.x -= gameState.gameSpeed * deltaMultiplier;
      
      // Обновляем движение по вертикали для движущихся препятствий
      if (obstacle.velocityY !== undefined && obstacle.oscillationCenter !== undefined && obstacle.oscillationRange !== undefined) {
        obstacle.y += obstacle.velocityY * deltaMultiplier;
        
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
      bonus.x -= gameState.gameSpeed * deltaMultiplier;
      if (bonus.x + bonus.width < 0) return false;
      
      if (checkCollision(updatedPlayer, bonus)) {
        onBonusCollect(bonus);
        return false;
      }
      return true;
    });
    
    // Update pits 
    const updatedPits = currentPits.filter(pit => {
      pit.x -= gameState.gameSpeed * deltaMultiplier;
      if (pit.x + pit.width < 0) return false;
      // Коллизии с ямами теперь обрабатываются в основной логике физики
      return true;
    });
    
    // Update platforms
    const updatedPlatforms = currentPlatforms.filter(platform => {
      platform.x -= gameState.gameSpeed * deltaMultiplier;
      if (platform.x + platform.width < 0) return false;
      return true;
    });
    
    // Обновляем состояния
    onObstaclesUpdate(updatedObstacles);
    onBonusesUpdate(updatedBonuses);
    onPitsUpdate(updatedPits);
    onPlatformsUpdate(updatedPlatforms);

    // Update particles
    const updatedParticles = particles.filter(particle => {
      particle.x += particle.vx * deltaMultiplier;
      particle.y += particle.vy * deltaMultiplier;
      particle.life--;
      return particle.life > 0;
    });
    onParticlesUpdate(updatedParticles);
    
    // Обновляем игровую логику (комбо, таймеры)
    onUpdateGameLogic();
  }, [gameState.state, gameState.distance, gameState.gameSpeed, player, obstacles, bonuses, pits, platforms, particles, jumpRequestRef, onPlayerUpdate, onObstaclesUpdate, onBonusesUpdate, onPitsUpdate, onPlatformsUpdate, onParticlesUpdate, onGameStateUpdate, onBonusCollect, onObstacleHit, onPitFall, spawnObstacle, spawnBonus, spawnPit, spawnPlatform, checkCollision, checkCollisionWithPadding, onUpdateGameLogic]);

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
    pits.forEach(pit => drawPit(ctx, pit));
    platforms.forEach(platform => drawPlatform(ctx, platform));
    particles.forEach(particle => drawParticle(ctx, particle));
    
  }, [player, obstacles, bonuses, pits, platforms, particles, drawPlayer, drawObstacle, drawBonus, drawPit, drawPlatform, drawParticle]);

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
