import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, AvatarConfig } from '../types';
import { SKINS, ACCESSORIES, AURAS } from '../data/shopItems';
import { Heart, Coins, Trophy, Zap, RefreshCw, ShoppingCart, Play, AlertTriangle } from 'lucide-react';
import { playSound } from '../utils/audio';

interface GameRunnerProps {
  gameId: 'jumper' | 'clicker';
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip', desc: string, amount: number, currency: 'coins' | 'real') => void;
  openShop: () => void;
  onExit: () => void;
}

export const GameRunner: React.FC<GameRunnerProps> = ({
  gameId,
  stats,
  updateStats,
  addLog,
  openShop,
  onExit
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References for Canvas Game (Pixel Jumper)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Clicker Game States (Neon Clicker)
  const [clickerTimeLeft, setClickerTimeLeft] = useState(15);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number; color: string; val: number }[]>([]);
  const clickerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Grab active configurations
  const activeSkin = SKINS.find((s) => s.id === stats.avatar.skin) || SKINS[0];
  const activeAccessory = ACCESSORIES.find((a) => a.id === stats.avatar.accessory) || ACCESSORIES[0];
  const activeAura = AURAS.find((au) => au.id === stats.avatar.aura) || AURAS[0];

  // Helper to count active stage skips owned by counting 'booster_stage_skip' in stats.unlockedAccessories
  const stageSkipsOwned = stats.unlockedAccessories.filter(x => x === 'booster_stage_skip').length;

  // 1. GAME: PIXEL JUMPER (Canvas Game)
  useEffect(() => {
    if (gameId !== 'jumper' || !isPlaying || gameOver || victory) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset score
    setScore(0);

    // Player Physics State
    let playerY = 160;
    let playerYVelocity = 0;
    const gravity = 0.6;
    const jumpForce = -11;
    let isGrounded = true;
    const playerX = 60;
    const playerWidth = 40;
    const playerHeight = 40;

    // Game Speed scales with the currentStage level!
    const baseSpeed = 4.5;
    const currentSpeed = baseSpeed + stats.currentStage * 0.5;

    // Obstacles State
    let obstacles: { x: number; w: number; h: number; passed: boolean }[] = [];
    let obstacleTimer = 0;
    let currentScore = 0;
    const obstaclesToClear = 5 + stats.currentStage; // 5 obstacles + current stage difficulty count

    // Background stars/retro grids
    const stars: { x: number; y: number; s: number }[] = Array.from({ length: 40 }, () => ({
      x: Math.random() * 600,
      y: Math.random() * 200,
      s: Math.random() * 2 + 1
    }));

    const handleJump = () => {
      if (isGrounded) {
        playerYVelocity = jumpForce;
        isGrounded = false;
        playSound.jump();
      }
    };

    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Click canvas / screen controls
    const onCanvasClick = () => {
      handleJump();
    };
    canvas.addEventListener('click', onCanvasClick);

    // Game loop
    const updateGame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background cosmic grid
      ctx.fillStyle = '#0f172a'; // Deep Slate Blue background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = '#475569';
      stars.forEach(star => {
        star.x -= currentSpeed * 0.2;
        if (star.x < 0) star.x = canvas.width;
        ctx.fillRect(star.x, star.y, star.s, star.s);
      });

      // Draw ground line
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 200);
      ctx.lineTo(canvas.width, 200);
      ctx.stroke();

      // Update Player Physics
      playerYVelocity += gravity;
      playerY += playerYVelocity;

      // Ground Check
      if (playerY >= 160) {
        playerY = 160;
        playerYVelocity = 0;
        isGrounded = true;
      }

      // Draw Player Avatar (Dynamic customization representation on Canvas!)
      ctx.save();
      
      // 1. Aura glow drawing
      if (activeAura.id !== 'none') {
        ctx.shadowColor = activeAura.color === 'cyan' ? '#06b6d4' : activeAura.color === 'orange' ? '#f97316' : activeAura.color === 'green' ? '#22c55e' : '#fde047';
        ctx.shadowBlur = 15;
      }

      // 2. Skin base rect
      ctx.fillStyle = activeSkin.id === 'classic' ? '#34d399' : activeSkin.id === 'cyber-purple' ? '#d946ef' : activeSkin.id === 'golden-warrior' ? '#fbbf24' : activeSkin.id === 'matrix-hacker' ? '#22c55e' : activeSkin.id === 'phantom-shadow' ? '#0f172a' : '#a3e635';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(playerX, playerY, playerWidth, playerHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Clear shadow
      ctx.shadowBlur = 0;

      // 3. Body Emoji
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeSkin.emoji, playerX + 20, playerY + 22);

      // 4. Accessory Emoji
      if (activeAccessory.id !== 'none') {
        ctx.font = '16px Arial';
        ctx.fillText(activeAccessory.emoji, playerX + 20, playerY - 4);
      }

      ctx.restore();

      // Obstacle management
      obstacleTimer++;
      const minGap = 110 + (Math.random() * 80);
      if (obstacleTimer > minGap && obstacles.length < obstaclesToClear) {
        obstacles.push({
          x: canvas.width,
          w: 22 + Math.random() * 10,
          h: 26 + Math.random() * 14,
          passed: false
        });
        obstacleTimer = 0;
      }

      // Draw and update obstacles
      ctx.fillStyle = '#ef4444'; // Red neon spike
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;

      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        obs.x -= currentSpeed;

        // Draw retro triangular spikes
        ctx.beginPath();
        ctx.moveTo(obs.x, 200);
        ctx.lineTo(obs.x + obs.w / 2, 200 - obs.h);
        ctx.lineTo(obs.x + obs.w, 200);
        ctx.closePath();
        ctx.fill();

        // Pass obstacle and earn points
        if (!obs.passed && obs.x + obs.w < playerX) {
          obs.passed = true;
          currentScore += 1;
          setScore(currentScore);
        }

        // Collision Check (AABB box)
        const crash = (
          playerX < obs.x + obs.w &&
          playerX + playerWidth > obs.x &&
          playerY + playerHeight > 200 - obs.h
        );

        if (crash) {
          // Player hit obstacle! Deduct Life
          deductLifeOnCrash();
          playSound.gameover();
          setIsPlaying(false);
          setGameOver(true);
          window.removeEventListener('keydown', onKeyDown);
          canvas.removeEventListener('click', onCanvasClick);
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          return;
        }
      }
      ctx.shadowBlur = 0;

      // Victory Condition: Cleared all obstacles!
      if (currentScore >= obstaclesToClear) {
        completeStageVictory();
        playSound.victory();
        setIsPlaying(false);
        setVictory(true);
        window.removeEventListener('keydown', onKeyDown);
        canvas.removeEventListener('click', onCanvasClick);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        return;
      }

      // Render Stage Goal Text
      ctx.font = '11px Courier New';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`OBJETIVO: CHEGAR AO FINAL (${currentScore}/${obstaclesToClear} OBSTÁCULOS)`, 10, 25);

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (canvas) canvas.removeEventListener('click', onCanvasClick);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameId, isPlaying, gameOver, victory]);

  // 2. GAME: NEON CLICKER (Precision Clicker)
  useEffect(() => {
    if (gameId !== 'clicker' || !isPlaying || gameOver || victory) return;

    // Reset Clicker Time and Scores
    setClickerTimeLeft(15);
    setScore(0);
    spawnBubbles();

    // Setup Game Timer
    clickerTimerRef.current = setInterval(() => {
      setClickerTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished! Check if score matches stage quota
          clearInterval(clickerTimerRef.current!);
          evaluateClickerOutcome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (clickerTimerRef.current) clearInterval(clickerTimerRef.current);
    };
  }, [gameId, isPlaying]);

  const targetClickerQuota = 100 + stats.currentStage * 15;

  const spawnBubbles = () => {
    const bubbleColors = ['#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
    const newBubbles = Array.from({ length: 5 }, (_, i) => ({
      id: Math.random() + i,
      x: 10 + Math.random() * 80, // percentage x
      y: 10 + Math.random() * 75, // percentage y
      size: 40 + Math.random() * 20, // px
      color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
      val: Math.floor(Math.random() * 5) + 8 // points value
    }));
    setBubbles(newBubbles);
  };

  const handleBubbleClick = (id: number, val: number) => {
    // Increment Score
    setScore((prev) => {
      const nextScore = prev + val;
      // If quota reached inside game, show intermediate indicator or play sounds
      return nextScore;
    });

    playSound.collect();

    // Remove popped bubble and spawn more
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    
    // Spawn 1 or 2 new bubbles to keep board full
    setTimeout(() => {
      const bubbleColors = ['#06b6d4', '#d946ef', '#10b981', '#fbbf24', '#3b82f6'];
      const newB = {
        id: Math.random(),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 75,
        size: 35 + Math.random() * 25,
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        val: Math.floor(Math.random() * 5) + 8
      };
      setBubbles((prev) => [...prev, newB]);
    }, 150);
  };

  const evaluateClickerOutcome = () => {
    setIsPlaying(false);
    // Score matches score state directly in React inside trigger
    // Let's check with standard ref or state
    setScore((finalScore) => {
      if (finalScore >= targetClickerQuota) {
        completeStageVictory();
        playSound.victory();
        setVictory(true);
      } else {
        deductLifeOnCrash();
        playSound.gameover();
        setGameOver(true);
      }
      return finalScore;
    });
  };

  // Helper functions to manage state
  const deductLifeOnCrash = () => {
    updateStats((prev) => {
      const nextLives = Math.max(0, prev.lives - 1);
      return {
        ...prev,
        lives: nextLives
      };
    });
    addLog('purchase_booster', `Perdeu vida jogando ${gameId === 'jumper' ? 'Pixel Jumper' : 'Neon Clicker'}`, 1, 'coins');
  };

  const completeStageVictory = () => {
    const coinReward = 30 + stats.currentStage * 5;
    updateStats((prev) => ({
      ...prev,
      currentStage: prev.currentStage + 1,
      coins: prev.coins + coinReward,
      highScore: Math.max(prev.highScore, score)
    }));
    addLog('earn', `Ganhou recompensa por limpar Nível ${stats.currentStage}`, coinReward, 'coins');
  };

  // Skip stage booster handler
  const handleStageSkipWithBooster = () => {
    if (stageSkipsOwned <= 0) {
      setErrorMessage('Você não possui créditos para Pular de Fase! Adquira na Loja Segura.');
      playSound.click();
      return;
    }

    updateStats((prev) => {
      // Find and remove exactly one 'booster_stage_skip' from unlockedAccessories
      const index = prev.unlockedAccessories.indexOf('booster_stage_skip');
      let nextAccessories = [...prev.unlockedAccessories];
      if (index > -1) {
        nextAccessories.splice(index, 1);
      }

      return {
        ...prev,
        unlockedAccessories: nextAccessories,
        currentStage: prev.currentStage + 1,
        // Award bonus coins for clearing stage!
        coins: prev.coins + 100
      };
    });

    addLog('stage_skip', `Usou Pulo de Fase para o Nível ${stats.currentStage + 1}`, 1, 'coins');
    playSound.purchase();
    
    // Clear state
    setIsPlaying(false);
    setGameOver(false);
    setVictory(false);
    setScore(0);
    setErrorMessage(null);
    triggerQuickReset();
  };

  const startPlaying = () => {
    if (stats.lives <= 0) {
      setErrorMessage('Zero vidas restantes! Compre vidas adicionais na Loja Segura para jogar.');
      playSound.click();
      return;
    }
    setErrorMessage(null);
    setGameOver(false);
    setVictory(false);
    setIsPlaying(true);
    playSound.click();
  };

  const triggerQuickReset = () => {
    setIsPlaying(false);
    setGameOver(false);
    setVictory(false);
    setScore(0);
    playSound.click();
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Title / Back row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="text-left">
          <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            Estágio Atual: {stats.currentStage}
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white mt-1.5">
            {gameId === 'jumper' ? '🕹️ Pixel Jumper Arcade' : '⚡ Neon Portal Clicker'}
          </h2>
        </div>

        <button
          onClick={onExit}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          id="btn-exit-game"
        >
          Voltar ao Lobby
        </button>
      </div>

      {/* Main Game Screen */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 md:p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
        {/* Retro scanlines effect overlay */}
        <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-5 z-20" />

        {/* Dynamic Warning Messages */}
        {errorMessage && (
          <div className="absolute z-30 inset-x-4 top-4 p-3 bg-red-950/90 text-red-300 rounded-xl text-xs border border-red-800/60 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => {
                setErrorMessage(null);
                openShop();
              }}
              className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded transition-all cursor-pointer shrink-0"
            >
              Comprar
            </button>
          </div>
        )}

        {/* LOBBY STATE (NOT PLAYING YET) */}
        {!isPlaying && !gameOver && !victory && (
          <div className="text-center space-y-6 py-8 relative z-10 animate-fadeIn">
            
            {/* Visual Header Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl text-4xl shadow-lg relative">
              <Zap className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              {gameId === 'jumper' ? '👾' : '🎯'}
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-extrabold text-white">
                {gameId === 'jumper' ? 'Desafio do Pixel Jumper' : 'Energia dos Portais Neon'}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {gameId === 'jumper'
                  ? 'Salte sobre espinhos vermelhos usando a [Barra de Espaço] ou clicando na tela. Chegue ao final sem colidir!'
                  : `Tente estourar as esferas de luz que aparecem na tela rapidamente. Você precisa atingir ${targetClickerQuota} pontos em 15 segundos!`}
              </p>
            </div>

            {/* Stage parameters info */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 font-mono bg-slate-900/60 px-4 py-2.5 rounded-xl border border-slate-850 max-w-sm mx-auto">
              <span>Velocidade: <strong className="text-cyan-400">{1 + (stats.currentStage * 0.1)}x</strong></span>
              <span>•</span>
              <span>Recompensa: <strong className="text-amber-400">🪙 {30 + stats.currentStage * 5}</strong></span>
              <span>•</span>
              <span>Custará: <strong className="text-rose-400">❤️ 1 Vida (se perder)</strong></span>
            </div>

            {/* Start button */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={startPlaying}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg hover:scale-102"
                id="btn-start-game"
              >
                <Play className="w-4 h-4 fill-white" />
                Iniciar Jogo (❤️ 1 Vida)
              </button>
            </div>
          </div>
        )}

        {/* PIXEL JUMPER GAMEPLAY (CANVAS) */}
        {gameId === 'jumper' && isPlaying && !gameOver && !victory && (
          <div className="flex flex-col items-center w-full max-w-lg">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1">🎮 Pixel Jumper</span>
              <span>Pontos: <strong className="text-white text-sm">{score}</strong> / {5 + stats.currentStage}</span>
            </div>
            
            {/* Real retro canvas element */}
            <canvas
              ref={canvasRef}
              width={480}
              height={220}
              className="bg-slate-900 border-2 border-slate-800 rounded-xl w-full aspect-[24/11] cursor-pointer"
            />
            
            <p className="text-[10px] text-slate-500 font-mono text-center mt-3 uppercase tracking-widest animate-pulse">
              Clique na tela ou pressione [Espaço / Seta pra cima] para saltar!
            </p>
          </div>
        )}

        {/* NEON CLICKER GAMEPLAY */}
        {gameId === 'clicker' && isPlaying && !gameOver && !victory && (
          <div className="w-full flex flex-col items-center select-none">
            
            {/* Top stats */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono mb-3 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-850">
              <span>Tempo: <strong className="text-red-400 font-mono text-sm">{clickerTimeLeft}s</strong></span>
              <span>Quota: <strong className="text-cyan-400">{score}</strong> / {targetClickerQuota}</span>
            </div>

            {/* Bubble Play Field */}
            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl relative min-h-[240px] overflow-hidden">
              {bubbles.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBubbleClick(b.id, b.val)}
                  className="absolute rounded-full flex items-center justify-center font-black text-xs text-slate-950 shadow-lg cursor-pointer transform hover:scale-110 active:scale-95 transition-transform"
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                    backgroundColor: b.color,
                    boxShadow: `0 0 15px ${b.color}`
                  }}
                >
                  +{b.val}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 font-mono text-center mt-3 uppercase tracking-widest">
              Estoure os portais com cliques rápidos para acumular energia!
            </p>
          </div>
        )}

        {/* GAME OVER STATE */}
        {gameOver && (
          <div className="text-center space-y-5 py-6 max-w-sm relative z-10 animate-scaleIn">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 text-3xl mx-auto shadow-inner">
              💀
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Falha Crítica! (Game Over)</h3>
              <p className="text-slate-400 text-xs">
                {gameId === 'jumper'
                  ? 'Você colidiu com os obstáculos de alta voltagem!'
                  : `Você conseguiu ${score} pontos, mas não atingiu a quota de ${targetClickerQuota}!`
                }
              </p>
            </div>

            {/* Booster stage skip option */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-400 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span>Créditos Pular Fase:</span>
                <span className="text-cyan-400 font-bold">{stageSkipsOwned} disponíveis</span>
              </div>
              <button
                onClick={handleStageSkipWithBooster}
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 font-bold border border-cyan-800/40 rounded transition-all cursor-pointer text-xs"
              >
                Pular Fase (Usa 1 Skip)
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startPlaying}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors border border-slate-700"
                id="btn-retry-game"
              >
                Tentar Novamente (❤️ 1)
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 font-medium text-xs rounded-xl cursor-pointer transition-colors border border-transparent"
                id="btn-quit-to-lobby"
              >
                Ir para o Lobby
              </button>
            </div>
          </div>
        )}

        {/* VICTORY / STAGE CLEARED STATE */}
        {victory && (
          <div className="text-center space-y-5 py-6 max-w-sm relative z-10 animate-scaleIn">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 text-3xl mx-auto shadow-inner animate-bounce">
              👑
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white">Estágio Concluído!</h3>
              <p className="text-slate-400 text-xs">
                Você superou os desafios e limpou este nível com maestria.
              </p>
            </div>

            {/* Victory summary metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block">Sua Pontuação</span>
                <strong className="text-white">{score} Pts</strong>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block">Recompensa</span>
                <strong className="text-amber-400">+🪙 {30 + (stats.currentStage - 1) * 5} Moedas</strong>
              </div>
            </div>

            <button
              onClick={() => {
                triggerQuickReset();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm rounded-xl cursor-pointer hover:from-emerald-500 hover:to-teal-500 transition-colors"
              id="btn-next-stage"
            >
              Jogar Próximo Estágio (Nível {stats.currentStage})
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
