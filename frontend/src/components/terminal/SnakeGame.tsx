'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SnakeGameProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  autoStart?: boolean;
}

const GRID_SIZE = 20;
const CELL_SIZE = 17;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 2;
const MIN_SPEED = 60;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function SnakeGame({ onGameOver, onExit, autoStart }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'playing' | 'over'>('waiting');
  const [countdown, setCountdown] = useState(3);

  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Position>({ x: 15, y: 10 });
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Auto-start
  useEffect(() => {
    if (autoStart && gameState === 'waiting') {
      startCountdown();
    }
  }, [autoStart]);

  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);

    let count = 3;
    const timer = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        startGame();
      }
    }, 800);
  }, []);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    setScore(0);
    placeFood();
    setGameState('playing');
  }, []);

  const placeFood = useCallback(() => {
    const snake = snakeRef.current;
    let pos: Position;
    do {
      pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }, []);

  const endGame = useCallback(() => {
    setGameState('over');
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    const finalScore = scoreRef.current;
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('snakeHighScore', String(finalScore));
    }

    setTimeout(() => {
      onGameOver(finalScore);
    }, 1500);
  }, [highScore, onGameOver]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const tick = () => {
      directionRef.current = nextDirectionRef.current;
      const snake = snakeRef.current;
      const head = { ...snake[0] };

      switch (directionRef.current) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame();
        return;
      }

      // Self collision
      if (snake.some((s) => s.x === head.x && s.y === head.y)) {
        endGame();
        return;
      }

      snake.unshift(head);

      // Food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        scoreRef.current++;
        setScore(scoreRef.current);
        placeFood();

        // Speed up
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT);

        // Restart loop with new speed
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
        gameLoopRef.current = setInterval(tick, speedRef.current);
      } else {
        snake.pop();
      }

      draw();
    };

    gameLoopRef.current = setInterval(tick, speedRef.current);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, endGame, placeFood]);

  // Drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--primary-color').trim() || '#2dfe39';
    const dim = style.getPropertyValue('--primary-dim').trim() || '#1fb527';

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Snake
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? primary : dim;
      ctx.shadowColor = primary;
      ctx.shadowBlur = i === 0 ? 8 : 3;
      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    // Food
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    const food = foodRef.current;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;
  }, []);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        onExit();
        return;
      }

      if (gameState === 'waiting' && (e.key === ' ' || e.key === 'Enter')) {
        startCountdown();
        return;
      }

      if (gameState !== 'playing') return;

      const dir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (dir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
          if (dir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
          if (dir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
          if (dir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, onExit, startCountdown]);

  return (
    <div className="snake-game" style={{
      fontFamily: "'VT323', monospace",
      color: 'var(--primary-color)',
      textAlign: 'center',
    }}>
      <div style={{ marginBottom: '10px', fontSize: '20px' }}>
        SNAKE | Score: {score} | High: {highScore}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          border: '2px solid var(--primary-color)',
          borderRadius: '4px',
          boxShadow: '0 0 15px var(--primary-glow)',
        }}
      />

      {gameState === 'waiting' && (
        <div style={{ marginTop: '15px', fontSize: '18px' }}>
          Press SPACE or ENTER to start | ESC to exit
        </div>
      )}

      {gameState === 'countdown' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '80px',
          textShadow: '0 0 20px var(--primary-glow)',
        }}>
          {countdown}
        </div>
      )}

      {gameState === 'over' && (
        <div style={{ marginTop: '15px', fontSize: '24px', color: '#f87171' }}>
          GAME OVER - Score: {score}
        </div>
      )}

      <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.5 }}>
        Arrow keys / WASD to move | ESC to exit
      </div>
    </div>
  );
}
