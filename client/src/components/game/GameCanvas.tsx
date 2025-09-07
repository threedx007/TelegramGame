import { useEffect, useRef, useCallback } from 'react';
import { Player, Obstacle, Bonus, Particle, GameState } from '@/types/game';

interface GameCanvasProps {
  gameState: GameState;
  player: Player;
  obstacles: Obstacle[];
  bonuses: Bonus[];
  particles: Particle[];
  onPlayerUpdate: (player: Player) => void;
  onObstaclesUpdate: (obstacles: Obstacle[]) => void;
  onBonusesUpdate: (bonuses: Bonus[]) => void;
  onParticlesUpdate: (particles: Particle[]) => void;
  onGameStateUpdate: (gameState: GameState) => void;
  onBonusCollect: (bonus: Bonus) => void;
  onObstacleHit: (obstacle: Obstacle) => void;
  onJump: () => void;
}

export default function GameCanvas({
  gameState,
  player,
  obstacles,
  bonuses,
  particles,
  onPlayerUpdate,
  onObstaclesUpdate,
  onBonusesUpdate,
  onParticlesUpdate,
  onGameStateUpdate,
  onBonusCollect,
  onObstacleHit,
  onJump
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

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

    return {
      x: canvasWidth,
      y: canvasHeight - 150 - Math.random() * 100,
      width: 30 + Math.random() * 20,
      height: 30 + Math.random() * 20,
      type,
      color: colors[type]
    };
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

    return {
      x: canvasWidth,
      y: canvasHeight - 200 - Math.random() * 150,
      width: 25,
      height: 25,
      type,
      color: colors[type],
      value: type === 'key' ? 50 : type === 'bacteria' ? 10 : 5
    };
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, player: Player) => {
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
  }, []);

  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obstacle: Obstacle) => {
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }, []);

  const drawBonus = useCallback((ctx: CanvasRenderingContext2D, bonus: Bonus) => {
    ctx.save();
    ctx.fillStyle = bonus.color;
    
    if (bonus.type === 'bacteria') {
      ctx.beginPath();
      ctx.arc(bonus.x + 12, bonus.y + 12, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (bonus.type === 'bubble') {
      ctx.strokeStyle = bonus.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bonus.x + 12, bonus.y + 12, 10, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillRect(bonus.x, bonus.y, bonus.width, bonus.height);
    }
    
    ctx.restore();
  }, []);

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
    
    console.log('Update called with', obstacles.length, 'obstacles,', bonuses.length, 'bonuses');

    // Update player physics
    const updatedPlayer = { ...player };
    if (!updatedPlayer.grounded) {
      updatedPlayer.velocityY += 0.8; // gravity
    }
    updatedPlayer.y += updatedPlayer.velocityY;

    // Ground collision
    const groundY = canvas.height - 150;
    if (updatedPlayer.y >= groundY) {
      updatedPlayer.y = groundY;
      updatedPlayer.velocityY = 0;
      updatedPlayer.grounded = true;
    }

    onPlayerUpdate(updatedPlayer);

    // Update game state
    const newDistance = gameState.distance + gameState.gameSpeed;
    const newLevel = Math.floor(newDistance / 500) + 1;
    const newSpeed = Math.min(2 + (newLevel - 1) * 0.5, 8);

    onGameStateUpdate({
      ...gameState,
      distance: newDistance,
      level: newLevel,
      gameSpeed: newSpeed
    });

    // Spawn obstacles and bonuses
    if (Math.random() < 0.03) { // Уменьшили немного чтобы не спамить
      const newObstacle = spawnObstacle(canvas.width, canvas.height);
      onObstaclesUpdate([...obstacles, newObstacle]);
    }
    if (Math.random() < 0.02) {
      const newBonus = spawnBonus(canvas.width, canvas.height);
      onBonusesUpdate([...bonuses, newBonus]);
    }

    // Update obstacles
    const updatedObstacles = obstacles.filter(obstacle => {
      obstacle.x -= gameState.gameSpeed;
      if (obstacle.x + obstacle.width < 0) return false;
      
      if (checkCollision(updatedPlayer, obstacle)) {
        onObstacleHit(obstacle);
        return false;
      }
      return true;
    });
    console.log('Obstacles after update:', updatedObstacles.length, 'from', obstacles.length);
    onObstaclesUpdate(updatedObstacles);

    // Update bonuses
    const updatedBonuses = bonuses.filter(bonus => {
      bonus.x -= gameState.gameSpeed;
      if (bonus.x + bonus.width < 0) return false;
      
      if (checkCollision(updatedPlayer, bonus)) {
        onBonusCollect(bonus);
        return false;
      }
      return true;
    });
    onBonusesUpdate(updatedBonuses);

    // Update particles
    const updatedParticles = particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    });
    onParticlesUpdate(updatedParticles);
  }, [gameState.state, gameState.distance, gameState.gameSpeed, player, obstacles, bonuses, particles, onPlayerUpdate, onObstaclesUpdate, onBonusesUpdate, onParticlesUpdate, onGameStateUpdate, onBonusCollect, onObstacleHit, spawnObstacle, spawnBonus, checkCollision]);

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

    // Draw ground
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);

    // Draw game objects
    drawPlayer(ctx, player);
    obstacles.forEach(obstacle => drawObstacle(ctx, obstacle));
    bonuses.forEach(bonus => drawBonus(ctx, bonus));
    particles.forEach(particle => drawParticle(ctx, particle));
    
    // Debug info - показываем позиции первых объектов
    if (obstacles.length > 0) {
      console.log('Drawing obstacles:', obstacles.map(o => ({x: o.x, y: o.y, type: o.type})));
    }
    if (bonuses.length > 0) {
      console.log('Drawing bonuses:', bonuses.map(b => ({x: b.x, y: b.y, type: b.type})));
    }
  }, [player, obstacles, bonuses, particles, drawPlayer, drawObstacle, drawBonus, drawParticle]);

  // Удаляем отдельную функцию gameLoop, так как логика перенесена в useEffect

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const handleInput = useCallback(() => {
    if (gameState.state === 'playing' && player.grounded) {
      onJump();
    }
  }, [gameState.state, player.grounded, onJump]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up event listeners
    canvas.addEventListener('click', handleInput);
    canvas.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', resizeCanvas);

    // Initialize canvas size
    resizeCanvas();

    return () => {
      canvas.removeEventListener('click', handleInput);
      canvas.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resizeCanvas);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleInput, handleTouchStart, handleKeyDown, resizeCanvas]);

  // Game loop management
  useEffect(() => {
    if (gameState.state !== 'playing') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Прямые вызовы без зависимостей
      if (gameState.state !== 'playing') return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      console.log('Game loop running with', obstacles.length, 'obstacles,', bonuses.length, 'bonuses');

      // Update player physics
      const updatedPlayer = { ...player };
      if (!updatedPlayer.grounded) {
        updatedPlayer.velocityY += 0.8; // gravity
      }
      updatedPlayer.y += updatedPlayer.velocityY;

      // Ground collision
      const groundY = canvas.height - 150;
      if (updatedPlayer.y >= groundY) {
        updatedPlayer.y = groundY;
        updatedPlayer.velocityY = 0;
        updatedPlayer.grounded = true;
      }

      onPlayerUpdate(updatedPlayer);

      // Update game state
      const newDistance = gameState.distance + gameState.gameSpeed;
      const newLevel = Math.floor(newDistance / 500) + 1;
      const newSpeed = Math.min(2 + (newLevel - 1) * 0.5, 8);

      onGameStateUpdate({
        ...gameState,
        distance: newDistance,
        level: newLevel,
        gameSpeed: newSpeed
      });

      // Spawn obstacles and bonuses
      if (Math.random() < 0.03) {
        const newObstacle = spawnObstacle(canvas.width, canvas.height);
        onObstaclesUpdate([...obstacles, newObstacle]);
      }
      if (Math.random() < 0.02) {
        const newBonus = spawnBonus(canvas.width, canvas.height);
        onBonusesUpdate([...bonuses, newBonus]);
      }

      // Update obstacles
      const updatedObstacles = obstacles.filter(obstacle => {
        obstacle.x -= gameState.gameSpeed;
        if (obstacle.x + obstacle.width < 0) return false;
        
        if (checkCollision(updatedPlayer, obstacle)) {
          onObstacleHit(obstacle);
          return false;
        }
        return true;
      });
      onObstaclesUpdate(updatedObstacles);

      // Update bonuses
      const updatedBonuses = bonuses.filter(bonus => {
        bonus.x -= gameState.gameSpeed;
        if (bonus.x + bonus.width < 0) return false;
        
        if (checkCollision(updatedPlayer, bonus)) {
          onBonusCollect(bonus);
          return false;
        }
        return true;
      });
      onBonusesUpdate(updatedBonuses);

      // Update particles
      const updatedParticles = particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        return particle.life > 0;
      });
      onParticlesUpdate(updatedParticles);

      // Draw
      draw();

      if (gameState.state === 'playing') {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [gameState.state]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full touch-none"
      style={{ touchAction: 'none' }}
    />
  );
}
