import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../types';
import { Coins, Play, RefreshCw, Sparkles, HelpCircle, AlertCircle, Award } from 'lucide-react';
import { playSound } from '../utils/audio';
import { registerBet, registerWin, checkRTPApproval, getFormattedRTP } from '../utils/rtpManager';
import { AdBanner } from './AdBanner';

interface TigerGameProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  onExit: () => void;
}

const TIGER_SYMBOLS = [
  { symbol: '🐯', name: 'Tigrinho Solitário', weight: 10, reward: 20 }, // 20x bet
  { symbol: '🍊', name: 'Laranja da Sorte', weight: 40, reward: 3 },      // 3x bet
  { symbol: '🧧', name: 'Envelope Vermelho', weight: 30, reward: 4 },    // 4x bet
  { symbol: '💰', name: 'Saco de Ouro', weight: 15, reward: 10 },        // 10x bet
  { symbol: ' fireworks', symbolChar: '🧨', name: 'Bombinha', weight: 25, reward: 5 }, // 5x bet
];

export const TigerGame: React.FC<TigerGameProps> = ({
  stats,
  updateStats,
  addLog,
  onExit
}) => {
  const playerLevel = stats.level ?? 1;
  const [bet, setBet] = useState<number>(20);
  const [grid, setGrid] = useState<string[][]>([
    ['🍊', '🧧', '🍊'],
    ['🐯', '💰', '🧨'],
    ['🧧', '🍊', '🧧']
  ]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinMessage, setSpinMessage] = useState<string>('Solte a pata do tigre e fature multiplicadores de até 20x!');
  const [recentWin, setRecentWin] = useState<number | null>(null);
  const [isRoundBoosted, setIsRoundBoosted] = useState<boolean>(false);

  const availableBets = [10, 20, 50, 100, 250];

  const getBetLevelReq = (amt: number): number => {
    if (amt <= 20) return 1;
    if (amt === 50) return 2;
    if (amt === 100) return 4;
    if (amt === 250) return 6;
    return 1;
  };

  const isBetLocked = (amt: number): boolean => {
    return playerLevel < getBetLevelReq(amt);
  };

  const getRandomSymbol = () => {
    const totalWeight = TIGER_SYMBOLS.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of TIGER_SYMBOLS) {
      if (rand < item.weight) return item.symbolChar || item.symbol;
      rand -= item.weight;
    }
    return '🍊';
  };

  const handleSpin = () => {
    if (isSpinning) return;
    if (stats.coins < bet) {
      setSpinMessage('Saldo de Moedas insuficiente! Compre moedas na loja para continuar apostando no Tigrinho.');
      playSound.click();
      return;
    }

    setRecentWin(null);
    setIsSpinning(true);
    setSpinMessage('O Tigrinho está correndo...');

    const boosted = stats.rtpBoostSpins ? stats.rtpBoostSpins > 0 : false;
    setIsRoundBoosted(boosted);

    // Deduct bet coins
    updateStats((prev) => ({
      ...prev,
      coins: prev.coins - bet,
      rtpBoostSpins: prev.rtpBoostSpins && prev.rtpBoostSpins > 0 ? prev.rtpBoostSpins - 1 : prev.rtpBoostSpins
    }));
    addLog('purchase_booster', `Aposta no Fortune Tiger`, bet, 'coins');
    registerBet(bet);

    // Roll animation
    let ticks = 0;
    const interval = setInterval(() => {
      setGrid([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ]);
      playSound.tick();
      ticks++;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);

      // Define standard random result
      let rGrid = [
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()]
      ];

      // Check diagonal/horizontal win matches
      // Simple 3 horizontal lines and 2 diagonals
      const lines = [
        [rGrid[0][0], rGrid[0][1], rGrid[0][2]], // Row 1
        [rGrid[1][0], rGrid[1][1], rGrid[1][2]], // Row 2
        [rGrid[2][0], rGrid[2][1], rGrid[2][2]], // Row 3
        [rGrid[0][0], rGrid[1][1], rGrid[2][2]], // Diag 1
        [rGrid[0][2], rGrid[1][1], rGrid[2][0]]  // Diag 2
      ];

      let totalMultiplier = 0;
      lines.forEach(line => {
        if (line[0] === line[1] && line[1] === line[2]) {
          const sym = TIGER_SYMBOLS.find(x => (x.symbolChar || x.symbol) === line[0]);
          totalMultiplier += sym ? sym.reward : 2;
        }
      });

      const candidatePayout = bet * totalMultiplier;

      const bypassOverride = isRoundBoosted || (stats.isVip && Math.random() < 0.5);

      // STRICT 10% RTP CONSTRAINT OVERRIDE
      if (candidatePayout > 0 && !bypassOverride && !checkRTPApproval(candidatePayout, bet)) {
        // Force a guaranteed mismatch lose grid
        rGrid = [
          ['🍊', '🧧', '💰'],
          ['🐯', '🧨', '🍊'],
          ['🧧', '💰', '🧨']
        ];
        totalMultiplier = 0;
      }

      setGrid(rGrid);
      setIsSpinning(false);

      if (totalMultiplier > 0) {
        const payout = bet * totalMultiplier;
        registerWin(payout);
        updateStats(prev => ({ 
          ...prev, 
          coins: prev.coins + payout,
          points: (prev.points ?? 0) + 30 // +30 XP for winning
        }));
        addLog('earn', `Vitória no Fortune Tiger (${totalMultiplier}x)`, payout, 'coins');
        setRecentWin(payout);
        playSound.victory();
        setSpinMessage(`🐯 Miau! O Tigre Rugiu! Você alinhou combinações de {${totalMultiplier}x} e ganhou 🪙 ${payout} moedas!`);
      } else {
        updateStats(prev => ({
          ...prev,
          points: (prev.points ?? 0) + 10 // +10 XP for play effort
        }));
        playSound.gameover();
        setSpinMessage('Não foi dessa vez. Solte a pata novamente, o tigre está faminto!');
      }

    }, 1800);
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Tiger Machine Container */}
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.25)] relative">
        
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-4 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600/20 text-amber-400 p-2 rounded-lg border border-amber-500/30 text-xs">
              🐯
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                FORTUNE TIGER <span className="text-[10px] text-red-400">VIP</span>
              </h3>
              <p className="text-[10px] text-amber-300 font-mono flex items-center gap-1.5 flex-wrap">
                <span>RTP: <strong className="text-emerald-400">10.0% Max</strong></span>
                <span>•</span>
                <span>RTP Atual: {getFormattedRTP()}</span>
                {stats.isVip && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">👑 VIP (+50% RTP)</span>
                  </>
                )}
                {stats.rtpBoostSpins && stats.rtpBoostSpins > 0 ? (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-0.5">🍀 {stats.rtpBoostSpins} Giros com Super Sorte (+200%)</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
          
          <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-amber-400 font-bold">🪙 {stats.coins}</span>
          </div>
        </div>

        {/* Slot Screen */}
        <div className="p-6 md:p-8 bg-slate-950 flex flex-col items-center justify-center relative">
          
          {/* Neon tiger stripe decoration */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
          
          {/* Main 3x3 Border */}
          <div className="w-full max-w-xs bg-gradient-to-b from-amber-600/20 to-orange-600/20 border-2 border-amber-500/30 rounded-2xl p-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] z-10 relative">
            
            {/* Payline indicators */}
            <div className="absolute left-1.5 top-[23%] text-[9px] text-amber-400 font-black animate-pulse font-mono">▶</div>
            <div className="absolute left-1.5 top-[50%] text-[9px] text-amber-400 font-black animate-pulse font-mono">▶</div>
            <div className="absolute left-1.5 top-[77%] text-[9px] text-amber-400 font-black animate-pulse font-mono">▶</div>
            
            <div className="absolute right-1.5 top-[23%] text-[9px] text-amber-400 font-black animate-pulse font-mono">◀</div>
            <div className="absolute right-1.5 top-[50%] text-[9px] text-amber-400 font-black animate-pulse font-mono">◀</div>
            <div className="absolute right-1.5 top-[77%] text-[9px] text-amber-400 font-black animate-pulse font-mono">◀</div>

            {/* 3x3 Grid of Reels */}
            <div className="grid grid-cols-3 gap-2">
              {grid.map((row, rIdx) => 
                row.map((symbol, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`aspect-square bg-slate-900 border rounded-lg flex items-center justify-center text-2xl md:text-3xl transition-all duration-100 ${
                      isSpinning 
                        ? 'border-amber-500/50 scale-98 brightness-110' 
                        : 'border-slate-800'
                    }`}
                  >
                    <span className={isSpinning ? 'animate-bounce' : 'scale-100'}>
                      {symbol}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prompt result */}
          <div className="w-full max-w-xs mt-5 bg-amber-950/20 border border-amber-500/10 p-3 rounded-xl text-center z-10 relative">
            <p className="text-[11px] text-amber-200 leading-relaxed font-sans">
              {spinMessage}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-5 bg-slate-900/95 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="space-y-1.5 w-full sm:w-auto text-center sm:text-left">
            <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              Definir Aposta
            </span>
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              {availableBets.map((amount) => {
                const locked = isBetLocked(amount);
                const req = getBetLevelReq(amount);
                return (
                  <button
                    key={amount}
                    disabled={isSpinning}
                    onClick={() => {
                      if (locked) {
                        setSpinMessage(`Aposta bloqueada! O valor 🪙 ${amount} requer Nível ${req}.`);
                        try {
                          playSound.gameover();
                        } catch (err) {}
                        return;
                      }
                      setBet(amount);
                      playSound.click();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      bet === amount
                        ? 'bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30'
                        : locked
                        ? 'bg-slate-950/40 text-slate-600 border border-slate-950/60 cursor-not-allowed opacity-50'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                    title={locked ? `Requer Nível ${req}` : `Aposta de 🪙 ${amount}`}
                  >
                    {locked ? `🔒 ${amount}` : amount}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg uppercase tracking-wide ${
              isSpinning
                ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 shadow-amber-500/15 hover:scale-103'
            }`}
          >
            {isSpinning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Girando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                Girar o Tigre (🪙 {bet})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paytable */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          Multiplicadores Fortune Tiger
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px] font-mono">
          {TIGER_SYMBOLS.map((item) => (
            <div key={item.name} className="bg-slate-950/50 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
              <span className="text-lg mr-1.5">{item.symbolChar || item.symbol}</span>
              <div className="text-right flex-1">
                <span className="block text-slate-400 text-[9px] truncate max-w-[80px]">{item.name}</span>
                <strong className="text-amber-400">{item.reward}x</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Sponsored Ad Banner */}
      <AdBanner position="bottom" />
    </div>
  );
};
