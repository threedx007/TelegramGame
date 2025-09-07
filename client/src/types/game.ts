export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  grounded: boolean;
  color: string;
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  color: string;
}

export interface Obstacle extends GameObject {
  type: 'fat' | 'waste' | 'chemical' | 'ice' | 'lightning' | 'roots';
}

export interface Bonus extends GameObject {
  type: 'bacteria' | 'bubble' | 'filter' | 'key';
  value: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface EducationalMessage {
  emoji: string;
  title: string;
  text: string;
}

export interface GameState {
  state: 'start' | 'playing' | 'paused' | 'gameOver';
  score: number;
  distance: number;
  level: number;
  combo: number;
  gameSpeed: number;
  bestScore: number;
}

export interface Reward {
  points: number;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}
