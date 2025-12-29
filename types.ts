
export enum GameState {
  IDLE = 'IDLE',
  STARTING = 'STARTING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  shieldActive: boolean;
  shieldCharge: number; // 0 to 100
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'asteroid' | 'comet' | 'debris';
  rotation: number;
}

export interface GameStats {
  score: number;
  obstaclesDodged: number;
  highScore: number;
}

export interface SimulationOutput {
  briefing: string;
  report?: string;
}
