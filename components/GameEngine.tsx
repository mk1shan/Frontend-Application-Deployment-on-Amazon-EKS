
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Player, Obstacle, GameStats } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  INITIAL_SPEED, 
  SHIELD_RECHARGE_RATE,
  THEME_COLORS 
} from '../constants';

interface GameEngineProps {
  gameState: GameState;
  onGameOver: (stats: GameStats) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ gameState, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [shieldDisplay, setShieldDisplay] = useState(100);

  const playerRef = useRef<Player>({
    x: 60,
    y: CANVAS_HEIGHT / 2 - 20,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    shieldActive: true,
    shieldCharge: 100
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const frameRef = useRef(0);
  const statsRef = useRef<GameStats>({
    score: 0,
    obstaclesDodged: 0,
    highScore: Number(localStorage.getItem('astro-high-score')) || 0
  });

  const keys = useRef<{ [key: string]: boolean }>({});

  const spawn = useCallback(() => {
    const types: Obstacle['type'][] = ['asteroid', 'comet', 'debris'];
    const size = 25 + Math.random() * 45;
    const speedMultiplier = 1 + (statsRef.current.score / 2000);
    
    obstaclesRef.current.push({
      id: Math.random(),
      x: CANVAS_WIDTH + 100,
      y: Math.random() * (CANVAS_HEIGHT - size),
      width: size,
      height: size,
      speed: (INITIAL_SPEED + Math.random() * 2) * speedMultiplier,
      type: types[Math.floor(Math.random() * types.length)],
      rotation: Math.random() * Math.PI * 2
    });
  }, []);

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    // Movement
    if (keys.current['ArrowUp'] || keys.current['w']) playerRef.current.y -= 6;
    if (keys.current['ArrowDown'] || keys.current['s']) playerRef.current.y += 6;
    playerRef.current.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, playerRef.current.y));

    // Shield Recharge
    if (playerRef.current.shieldCharge < 100) {
      playerRef.current.shieldCharge += SHIELD_RECHARGE_RATE;
      if (playerRef.current.shieldCharge >= 100) {
        playerRef.current.shieldCharge = 100;
        playerRef.current.shieldActive = true;
      }
    }
    setShieldDisplay(Math.floor(playerRef.current.shieldCharge));

    // Obstacles
    obstaclesRef.current.forEach(obs => {
      obs.x -= obs.speed;
      obs.rotation += 0.02;
    });

    const beforeCount = obstaclesRef.current.length;
    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.x + obs.width > -50);
    const dodgedThisFrame = beforeCount - obstaclesRef.current.length;
    if (dodgedThisFrame > 0) {
      statsRef.current.obstaclesDodged += dodgedThisFrame;
      statsRef.current.score += dodgedThisFrame * 10;
    }

    // Scoring
    statsRef.current.score += 0.2;
    setScoreDisplay(Math.floor(statsRef.current.score));

    // Spawning
    frameRef.current++;
    if (frameRef.current % 60 === 0) spawn();

    // Collisions
    for (let i = 0; i < obstaclesRef.current.length; i++) {
      const obs = obstaclesRef.current[i];
      const p = playerRef.current;
      if (
        p.x < obs.x + obs.width - 5 &&
        p.x + p.width > obs.x + 5 &&
        p.y < obs.y + obs.height - 5 &&
        p.y + p.height > obs.y + 5
      ) {
        if (p.shieldActive) {
          p.shieldActive = false;
          p.shieldCharge = 0;
          obstaclesRef.current.splice(i, 1); // Destroy obstacle on shield hit
          break;
        } else {
          onGameOver({ ...statsRef.current, score: Math.floor(statsRef.current.score) });
          return;
        }
      }
    }
  }, [gameState, onGameOver, spawn]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = THEME_COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Starfield
    ctx.fillStyle = '#1e293b';
    for (let i = 0; i < 40; i++) {
      const x = (i * 1234 + frameRef.current * (i % 3 + 1)) % (CANVAS_WIDTH + 100) - 50;
      const y = (i * 5678) % CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }

    // Player
    const p = playerRef.current;
    ctx.save();
    ctx.translate(p.x, p.y);
    
    // Ship Body
    ctx.fillStyle = THEME_COLORS.player;
    ctx.beginPath();
    ctx.moveTo(p.width, p.height / 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, p.height / 2);
    ctx.lineTo(0, p.height);
    ctx.closePath();
    ctx.fill();

    // Engine Glow
    const engineColor = frameRef.current % 4 < 2 ? THEME_COLORS.accent : '#ef4444';
    ctx.fillStyle = engineColor;
    ctx.fillRect(-8, p.height/2 - 4, 8, 8);

    // Shield Circle
    if (p.shieldActive || p.shieldCharge > 0) {
      ctx.strokeStyle = THEME_COLORS.shield;
      ctx.lineWidth = 2;
      ctx.globalAlpha = p.shieldActive ? 0.6 : (p.shieldCharge / 100) * 0.2;
      ctx.beginPath();
      ctx.arc(p.width/2, p.height/2, p.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.save();
      ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
      ctx.rotate(obs.rotation);
      ctx.fillStyle = obs.type === 'comet' ? THEME_COLORS.comet : THEME_COLORS.asteroid;
      
      if (obs.type === 'asteroid') {
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j / 6) * Math.PI * 2;
          const r = obs.width/2 * (0.8 + Math.random() * 0.2);
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(-obs.width/2, -obs.height/2, obs.width, obs.height);
      }
      ctx.restore();
    });
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => keys.current[e.key] = true;
    const handleUp = (e: KeyboardEvent) => keys.current[e.key] = false;
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  useEffect(() => {
    if (gameState === GameState.IDLE) {
      statsRef.current = { score: 0, obstaclesDodged: 0, highScore: statsRef.current.highScore };
      obstaclesRef.current = [];
      playerRef.current.shieldActive = true;
      playerRef.current.shieldCharge = 100;
      frameRef.current = 0;
    }
  }, [gameState]);

  return (
    <div className="relative rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-900">
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto" />
      
      {gameState === GameState.PLAYING && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="space-y-1">
            <div className="text-3xl font-black text-white font-mono drop-shadow-lg">
              {scoreDisplay.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Current Telemetry</div>
          </div>
          
          <div className="w-48 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              <span>Shield Integrity</span>
              <span>{shieldDisplay}%</span>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_#22d3ee]"
                style={{ width: `${shieldDisplay}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameEngine;
