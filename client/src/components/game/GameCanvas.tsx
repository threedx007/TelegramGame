import { useEffect, useRef, useCallback, useState } from 'react';
import { Player, Obstacle, Bonus, Particle, GameState } from '@/types/game';

// Импорты изображений спрайтов (обновленные с прозрачным фоном)
import playerSprite from '@assets/generated_images/Clean_water_droplet_no_text_b578573b.png';
// Бонусы
import bacteriaSprite from '@assets/generated_images/Green_bacteria_transparent_d6f77a2d.png';
import bubbleSprite from '@assets/generated_images/White_bubble_transparent_be8c2489.png';
import filterSprite from '@assets/generated_images/Blue_filter_transparent_a9bcbcb9.png';
import keySprite from '@assets/generated_images/Golden_key_transparent_dde83671.png';
// Препятствия
import fatSprite from '@assets/generated_images/Fat_blob_transparent_3310b9a6.png';
import wasteSprite from '@assets/generated_images/Waste_matter_transparent_1a8e49a7.png';
import chemicalSprite from '@assets/generated_images/Chemical_poison_transparent_60cf080d.png';
import iceSprite from '@assets/generated_images/Ice_crystal_transparent_8628b41e.png';
import lightningSprite from '@assets/generated_images/Lightning_bolt_transparent_a4cbabf9.png';
import rootsSprite from '@assets/generated_images/Tree_roots_transparent_cf0691c2.png';

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
  onUpdateGameLogic
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // Состояние для загруженных изображений
  const [images, setImages] = useState<{
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
    const obstacleHeight = 50 + Math.random() * 20; // Предварительный расчет размера
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
      width: 50 + Math.random() * 20, // Увеличенный размер для лучшей видимости
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
    if (images.player) {
      // Отрисовка спрайта игрока
      ctx.drawImage(
        images.player,
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
  }, [images.player]);

  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    const obstacleImage = images.obstacles?.[obstacle.type];
    if (obstacleImage) {
      // Отрисовка спрайта препятствия
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
  }, [images.obstacles]);

  const drawBonus = useCallback((ctx: CanvasRenderingContext2D, bonus: Bonus) => {
    const bonusImage = images.bonuses?.[bonus.type];
    if (bonusImage) {
      // Отрисовка спрайта бонуса
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
  }, [images.bonuses]);

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
        updatedPlayer.velocityY = -15;
        updatedPlayer.grounded = false;
        updatedPlayer.doubleJumpAvailable = true; // Восстанавливаем двойной прыжок
      }
      // Двойной прыжок в воздухе
      else if (updatedPlayer.doubleJumpAvailable) {
        updatedPlayer.velocityY = -12; // Чуть слабее чем обычный прыжок
        updatedPlayer.doubleJumpAvailable = false; // Тратим двойной прыжок
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
      
      if (checkCollision(updatedPlayer, obstacle)) {
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
  }, [gameState.state, gameState.distance, gameState.gameSpeed, player, obstacles, bonuses, particles, jumpRequestRef, onPlayerUpdate, onObstaclesUpdate, onBonusesUpdate, onParticlesUpdate, onGameStateUpdate, onBonusCollect, onObstacleHit, spawnObstacle, spawnBonus, checkCollision, onUpdateGameLogic]);

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

  // Загрузка изображений при монтировании компонента
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const loadAllImages = async () => {
      try {
        const [
          playerImg,
          bacteriaImg, bubbleImg, filterImg, keyImg,
          fatImg, wasteImg, chemicalImg, iceImg, lightningImg, rootsImg
        ] = await Promise.all([
          loadImage(playerSprite),
          // Бонусы
          loadImage(bacteriaSprite),
          loadImage(bubbleSprite),
          loadImage(filterSprite),
          loadImage(keySprite),
          // Препятствия
          loadImage(fatSprite),
          loadImage(wasteSprite),
          loadImage(chemicalSprite),
          loadImage(iceSprite),
          loadImage(lightningSprite),
          loadImage(rootsSprite)
        ]);

        setImages({
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
        console.error('Ошибка загрузки изображений:', error);
      }
    };

    loadAllImages();
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
