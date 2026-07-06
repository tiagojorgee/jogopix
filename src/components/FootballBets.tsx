import React, { useState, useEffect } from 'react';
import { PlayerStats, TransactionLog } from '../types';
import { playSound } from '../utils/audio';
import { 
  Trophy, Swords, Heart, Coins, Play, RefreshCw, CheckCircle2, 
  CreditCard, QrCode, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, HelpCircle, 
  ChevronRight, Calendar, Users, Zap, Check, Flame
} from 'lucide-react';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  league: 'Copa do Mundo' | 'Copa do Brasil' | 'Amistoso de Elite';
  status: 'AO VIVO' | 'ENCERRADO' | 'AGUARDANDO';
  possession: [number, number];
  shots: [number, number];
  corners: [number, number];
}

interface Bet {
  id: string;
  matchId: string;
  homePredict: number;
  awayPredict: number;
  wager: number;
  paymentMethod: 'pix' | 'card';
  timestamp: string;
  status: 'PENDENTE' | 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU';
  claimed: boolean;
  teamsLabel: string;
}

interface FootballBetsProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  withdrawLimit: number;
  setWithdrawLimit: React.Dispatch<React.SetStateAction<number>>;
}

// Initial live matches pool
const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-1',
    homeTeam: 'Brasil',
    awayTeam: 'Argentina',
    homeFlag: '🇧🇷',
    awayFlag: '🇦🇷',
    homeScore: 1,
    awayScore: 0,
    minute: 34,
    league: 'Copa do Mundo',
    status: 'AO VIVO',
    possession: [54, 46],
    shots: [6, 4],
    corners: [3, 2]
  },
  {
    id: 'match-2',
    homeTeam: 'Flamengo',
    awayTeam: 'Palmeiras',
    homeFlag: '🔴',
    awayFlag: '🟢',
    homeScore: 0,
    awayScore: 0,
    minute: 12,
    league: 'Copa do Brasil',
    status: 'AO VIVO',
    possession: [58, 42],
    shots: [3, 1],
    corners: [2, 0]
  },
  {
    id: 'match-3',
    homeTeam: 'França',
    awayTeam: 'Marrocos',
    homeFlag: '🇫🇷',
    awayFlag: '🇲🇦',
    homeScore: 2,
    awayScore: 1,
    minute: 78,
    league: 'Copa do Mundo',
    status: 'AO VIVO',
    possession: [48, 52],
    shots: [11, 8],
    corners: [5, 4]
  },
  {
    id: 'match-4',
    homeTeam: 'São Paulo',
    awayTeam: 'Corinthians',
    homeFlag: '⚪',
    awayFlag: '⚫',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    league: 'Copa do Brasil',
    status: 'AGUARDANDO',
    possession: [50, 50],
    shots: [0, 0],
    corners: [0, 0]
  },
  {
    id: 'match-5',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeFlag: '⚪',
    awayFlag: '🔵',
    homeScore: 2,
    awayScore: 2,
    minute: 90,
    league: 'Amistoso de Elite',
    status: 'ENCERRADO',
    possession: [51, 49],
    shots: [14, 15],
    corners: [6, 7]
  }
];

export const FootballBets: React.FC<FootballBetsProps> = ({
  stats,
  updateStats,
  addLog,
  realBalance,
  setRealBalance,
  withdrawLimit,
  setWithdrawLimit
}) => {
  const [matches, setMatches] = useState<Match[]>(() => {
    const cached = localStorage.getItem('gamezone_football_matches');
    return cached ? JSON.parse(cached) : INITIAL_MATCHES;
  });

  const [bets, setBets] = useState<Bet[]>(() => {
    const cached = localStorage.getItem('gamezone_football_bets');
    return cached ? JSON.parse(cached) : [];
  });

  // Goal celebration notification
  const [goalAlert, setGoalAlert] = useState<{ team: string; matchId: string } | null>(null);

  // Active prediction form state
  const [selectedMatchId, setSelectedMatchId] = useState<string>('match-1');
  const [homePredict, setHomePredict] = useState<number>(2);
  const [awayPredict, setAwayPredict] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Checkout Payment Modal Simulation
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'paying' | 'success'>('idle');
  const [cardName, setCardName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');

  // Save states
  useEffect(() => {
    localStorage.setItem('gamezone_football_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('gamezone_football_bets', JSON.stringify(bets));
  }, [bets]);

  // Live match simulator ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches((prevMatches) => {
        let changed = false;
        const updated = prevMatches.map((match) => {
          if (match.status !== 'AO VIVO') return match;

          changed = true;
          const nextMinute = match.minute + 1;
          const isGameOver = nextMinute >= 90;

          // Check for random goal (e.g. 1.2% chance per tick for home, 1.2% away)
          const homeGoal = Math.random() < 0.015;
          const awayGoal = Math.random() < 0.015;
          let nextHomeScore = match.homeScore;
          let nextAwayScore = match.awayScore;

          if (homeGoal && !isGameOver) {
            nextHomeScore += 1;
            triggerGoalCelebration(match.homeTeam, match.id);
          } else if (awayGoal && !isGameOver) {
            nextAwayScore += 1;
            triggerGoalCelebration(match.awayTeam, match.id);
          }

          // Random shot or corner increments
          const randomShots = [
            match.shots[0] + (Math.random() < 0.15 ? 1 : 0),
            match.shots[1] + (Math.random() < 0.15 ? 1 : 0),
          ] as [number, number];

          const randomCorners = [
            match.corners[0] + (Math.random() < 0.08 ? 1 : 0),
            match.corners[1] + (Math.random() < 0.08 ? 1 : 0),
          ] as [number, number];

          return {
            ...match,
            minute: isGameOver ? 90 : nextMinute,
            status: isGameOver ? 'ENCERRADO' : 'AO VIVO',
            homeScore: nextHomeScore,
            awayScore: nextAwayScore,
            shots: randomShots,
            corners: randomCorners,
            possession: [
              Math.min(75, Math.max(25, match.possession[0] + Math.floor(Math.random() * 5) - 2)),
              0 // Will calculate away below
            ].map((v, i, arr) => (i === 0 ? v : 100 - arr[0])) as [number, number]
          };
        });

        if (changed) {
          // Check for newly completed matches to settle bets
          setTimeout(() => evaluateBets(), 100);
        }

        return updated;
      });
    }, 12000); // Ticks every 12 seconds to keep it dynamic!

    return () => clearInterval(interval);
  }, []);

  const triggerGoalCelebration = (teamName: string, matchId: string) => {
    try {
      playSound.collect();
    } catch (e) {}
    setGoalAlert({ team: teamName, matchId });
    setTimeout(() => {
      setGoalAlert(null);
    }, 4500);
  };

  // Settle finished matches and evaluate bets
  const evaluateBets = () => {
    setBets((prevBets) => {
      let isUpdated = false;
      const updated = prevBets.map((bet) => {
        if (bet.status !== 'PENDENTE') return bet;

        const match = matches.find((m) => m.id === bet.matchId);
        if (!match || match.status !== 'ENCERRADO') return bet;

        isUpdated = true;
        // Determine outcome
        const realHome = match.homeScore;
        const realAway = match.awayScore;

        const guessedExact = (bet.homePredict === realHome && bet.awayPredict === realAway);

        const realWinner = realHome > realAway ? 'home' : (realHome < realAway ? 'away' : 'draw');
        const guessWinner = bet.homePredict > bet.awayPredict ? 'home' : (bet.homePredict < bet.awayPredict ? 'away' : 'draw');
        const guessedWinner = (realWinner === guessWinner);

        let finalStatus: 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU' = 'PERDEU';
        if (guessedExact) {
          finalStatus = 'VENCEU_EXATO';
        } else if (guessedWinner) {
          finalStatus = 'VENCEU_VENCEDOR';
        }

        return {
          ...bet,
          status: finalStatus
        };
      });

      return updated;
    });
  };

  // Restart live simulation with new parameters
  const handleResetMatches = () => {
    playSound.click();
    setMatches(INITIAL_MATCHES);
    triggerGoalCelebration('Sistemas', 'all');
  };

  // Accelerate / Skip match to 90' to resolve bets immediately!
  const handleFastForwardMatch = (matchId: string) => {
    playSound.click();
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        // Let's randomize a realistic final score or keep current and end it
        return {
          ...match,
          minute: 90,
          status: 'ENCERRADO',
          // Give them a bump in shots and corners
          shots: [match.shots[0] + 5, match.shots[1] + 4],
          corners: [match.corners[0] + 3, match.corners[1] + 2]
        };
      })
    );
    // Evaluate bets right after
    setTimeout(() => {
      setBets((prevBets) => {
        const match = matches.find((m) => m.id === matchId);
        if (!match) return prevBets;

        // Simulate score resolution
        const finalHome = match.homeScore + (Math.random() < 0.4 ? 1 : 0);
        const finalAway = match.awayScore + (Math.random() < 0.4 ? 1 : 0);

        return prevBets.map((bet) => {
          if (bet.matchId !== matchId || bet.status !== 'PENDENTE') return bet;

          const guessedExact = (bet.homePredict === finalHome && bet.awayPredict === finalAway);
          const realWinner = finalHome > finalAway ? 'home' : (finalHome < finalAway ? 'away' : 'draw');
          const guessWinner = bet.homePredict > bet.awayPredict ? 'home' : (bet.homePredict < bet.awayPredict ? 'away' : 'draw');
          const guessedWinner = (realWinner === guessWinner);

          let finalStatus: 'VENCEU_EXATO' | 'VENCEU_VENCEDOR' | 'PERDEU' = 'PERDEU';
          if (guessedExact) {
            finalStatus = 'VENCEU_EXATO';
          } else if (guessedWinner) {
            finalStatus = 'VENCEU_VENCEDOR';
          }

          return {
            ...bet,
            status: finalStatus
          };
        });
      });

      setMatches((prev) =>
        prev.map((match) => {
          if (match.id !== matchId) return match;
          return {
            ...match,
            homeScore: match.homeScore + (Math.random() < 0.4 ? 1 : 0),
            awayScore: match.awayScore + (Math.random() < 0.4 ? 1 : 0),
            minute: 90,
            status: 'ENCERRADO'
          };
        })
      );
    }, 200);
  };

  // Kick-start games that are waiting
  const handleStartWaitingMatch = (matchId: string) => {
    playSound.click();
    setMatches((prev) =>
      prev.map((match) => {
        if (match.id !== matchId) return match;
        return {
          ...match,
          status: 'AO VIVO',
          minute: 1
        };
      })
    );
  };

  // Initiates betting process, showing secure mock payment modal
  const handleInitiateBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (betAmount < 1) {
      playSound.gameover();
      alert('O valor mínimo de aposta é de R$ 1,00.');
      return;
    }
    playSound.click();
    setShowPayModal(true);
    setPaymentStep('idle');
  };

  // Confirms the simulated payment and registers the bet
  const handleConfirmPayment = () => {
    setPaymentStep('paying');
    playSound.click();

    setTimeout(() => {
      const match = matches.find((m) => m.id === selectedMatchId);
      if (!match) return;

      const randomId = `BET-${Math.floor(100000 + Math.random() * 900000)}`;
      const newBet: Bet = {
        id: randomId,
        matchId: selectedMatchId,
        homePredict,
        awayPredict,
        wager: betAmount,
        paymentMethod,
        timestamp: new Date().toLocaleString('pt-BR'),
        status: 'PENDENTE',
        claimed: false,
        teamsLabel: `${match.homeFlag} ${match.homeTeam} vs ${match.awayTeam} ${match.awayFlag}`
      };

      setBets((prev) => [newBet, ...prev]);

      // Add transaction to logs
      addLog(
        'purchase_booster',
        `Aposta de Futebol Registrada: ${match.homeTeam} ${homePredict}x${awayPredict} ${match.awayTeam}`,
        betAmount,
        'real'
      );

      // Increase withdrawal limit by bet amount (monetization reward)
      setWithdrawLimit((prev) => prev + betAmount);

      playSound.purchase();
      setPaymentStep('success');

      // Final closure of payment success overlay
      setTimeout(() => {
        setShowPayModal(false);
        setPaymentStep('idle');
      }, 1500);

    }, 2500);
  };

  // Claim awards from Won Bets
  const handleClaimReward = (bet: Bet) => {
    if (bet.claimed || (bet.status !== 'VENCEU_EXATO' && bet.status !== 'VENCEU_VENCEDOR')) return;
    playSound.jackpot();

    let livesReward = 0;
    let pointsReward = 0;
    let coinsReward = 0;
    let message = '';

    if (bet.status === 'VENCEU_EXATO') {
      livesReward = 5;
      pointsReward = 150;
      coinsReward = 200;
      message = `🏆 PLACAR EXATO! Você faturou +${livesReward} Vidas, +${pointsReward} Pontos e +${coinsReward} Moedas!`;
    } else {
      livesReward = 2;
      pointsReward = 50;
      coinsReward = 55;
      message = `⚽ ACERTOU O VENCEDOR! Consolação de +${livesReward} Vidas, +${pointsReward} Pontos e +${coinsReward} Moedas!`;
    }

    // Apply inside-the-game prizes directly
    updateStats((prev) => ({
      ...prev,
      lives: prev.lives + livesReward,
      points: (prev.points ?? 0) + pointsReward,
      coins: prev.coins + coinsReward
    }));

    // Mark as claimed
    setBets((prev) =>
      prev.map((b) => (b.id === bet.id ? { ...b, claimed: true } : b))
    );

    alert(message);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-6 space-y-6 backdrop-blur-md relative" id="football-live-betting-board">
      
      {/* Decorative soccer neon ball element */}
      <div className="absolute top-4 right-4 text-slate-800 pointer-events-none select-none opacity-20 hidden md:block">
        <Swords className="w-24 h-24 stroke-[1]" />
      </div>

      {/* Goal celebration banner overlay */}
      {goalAlert && (
        <div className="absolute inset-0 bg-emerald-950/90 rounded-2xl flex flex-col items-center justify-center text-center p-6 z-30 border-2 border-emerald-500 animate-fadeIn">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 mb-2 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>
          <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-widest">🚨 Divulgação em Tempo Real 🚨</span>
          <h2 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight animate-pulse uppercase">
            GOOOOOOL! ⚽
          </h2>
          <p className="text-emerald-200 text-sm md:text-lg font-bold mt-2">
            Maratona da Copa do Brasil &amp; Mundial: Gol de <span className="text-yellow-400 underline font-black">{goalAlert.team}</span>!
          </p>
          <p className="text-[10px] text-emerald-400/80 font-mono mt-2">O painel de apostas foi atualizado instantaneamente via API de Transmissão.</p>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-500/20">
            <Zap className="w-3 h-3 text-indigo-400 animate-pulse" /> BRASIL &amp; COPA DO MUNDO AO VIVO
          </span>
          <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
            ⚽ Chute Certeiro: Bolão de Futebol Real-Time
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
            Acompanhe lances em tempo real das principais partidas. Faça seu palpite a partir de <strong className="text-emerald-400">R$ 1,00</strong> via Pix ou Cartão e ganhe <strong className="text-indigo-400">vidas extras</strong> e <strong className="text-purple-400">pontos</strong> para evoluir o seu nível de piloto!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetMatches}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all text-xs font-bold font-mono flex items-center gap-1 cursor-pointer"
            title="Reiniciar Simulação de Jogos"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Grid of live football matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Columns: Match Listing */}
        <div className="lg:col-span-2 space-y-3.5">
          <span className="block text-[10px] font-mono text-slate-400 font-extrabold uppercase tracking-widest">📡 Transmissão dos Jogos Ativos</span>
          
          <div className="space-y-3">
            {matches.map((match) => {
              const hasActiveBet = bets.some(b => b.matchId === match.id && b.status === 'PENDENTE');
              
              return (
                <div 
                  key={match.id}
                  className={`bg-slate-950/80 border rounded-xl p-4 transition-all hover:border-slate-800/80 ${
                    match.status === 'AO VIVO' 
                      ? 'border-indigo-500/20 shadow-lg shadow-indigo-950/10' 
                      : 'border-slate-900'
                  }`}
                >
                  {/* Match header */}
                  <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-900 pb-2 mb-3">
                    <span className="text-slate-400 flex items-center gap-1 font-bold">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {match.league}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {hasActiveBet && (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-[8px] font-bold uppercase tracking-wider animate-pulse">
                          Aposta Ativa
                        </span>
                      )}

                      {match.status === 'AO VIVO' && (
                        <span className="px-1.5 py-0.5 bg-rose-600/10 border border-rose-500/30 text-rose-400 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                          AO VIVO ({match.minute}')
                        </span>
                      )}

                      {match.status === 'AGUARDANDO' && (
                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-[8px] font-extrabold uppercase tracking-wider">
                          AGUARDANDO
                        </span>
                      )}

                      {match.status === 'ENCERRADO' && (
                        <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded text-[8px] font-extrabold uppercase tracking-wider">
                          ENCERRADO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Match Scoreboard Layout */}
                  <div className="flex items-center justify-between px-2 md:px-6">
                    {/* Home team */}
                    <div className="flex flex-col items-center gap-1 w-24 text-center">
                      <span className="text-3xl md:text-4xl">{match.homeFlag}</span>
                      <span className="text-xs font-extrabold text-white truncate max-w-full">{match.homeTeam}</span>
                    </div>

                    {/* Live score display */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-3.5 bg-slate-900/90 border border-slate-850 px-4 py-2 rounded-xl">
                        <span className="text-2xl md:text-3xl font-black text-white">{match.homeScore}</span>
                        <span className="text-xs font-bold text-slate-500 font-mono">X</span>
                        <span className="text-2xl md:text-3xl font-black text-white">{match.awayScore}</span>
                      </div>
                      
                      {match.status === 'AO VIVO' && (
                        <span className="text-[8px] font-mono text-slate-400 animate-pulse">Minuto {match.minute} de jogo</span>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex flex-col items-center gap-1 w-24 text-center">
                      <span className="text-3xl md:text-4xl">{match.awayFlag}</span>
                      <span className="text-xs font-extrabold text-white truncate max-w-full">{match.awayTeam}</span>
                    </div>
                  </div>

                  {/* Live statistics bar */}
                  {match.status !== 'AGUARDANDO' && (
                    <div className="mt-4 pt-3 border-t border-slate-900 space-y-2 text-[9px] font-mono text-slate-400">
                      {/* Possession slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-[8px] uppercase tracking-wider">
                          <span>Posse: {match.possession[0]}%</span>
                          <span>Posse: {match.possession[1]}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex">
                          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${match.possession[0]}%` }} />
                          <div className="bg-slate-700 h-full transition-all duration-500 flex-1" />
                        </div>
                      </div>

                      {/* Shots & Corners */}
                      <div className="grid grid-cols-2 gap-4 text-center text-[8px] pt-1">
                        <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900/40">
                          Chutes no Alvo: <strong className="text-white">{match.shots[0]} x {match.shots[1]}</strong>
                        </div>
                        <div className="bg-slate-900/40 p-1.5 rounded border border-slate-900/40">
                          Escanteios: <strong className="text-white">{match.corners[0]} x {match.corners[1]}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational Actions */}
                  <div className="mt-3.5 pt-2 border-t border-slate-900/60 flex justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedMatchId(match.id);
                        playSound.click();
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 ${
                        selectedMatchId === match.id
                          ? 'bg-indigo-600 text-white font-extrabold'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      Palpitar neste Jogo
                    </button>

                    {match.status === 'AO VIVO' && (
                      <button
                        onClick={() => handleFastForwardMatch(match.id)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 text-[9px] font-bold font-mono rounded-lg transition-all cursor-pointer"
                        title="Acelerar simulação e resolver palpite imediatamente"
                      >
                        Acelerar Fim ⏩
                      </button>
                    )}

                    {match.status === 'AGUARDANDO' && (
                      <button
                        onClick={() => handleStartWaitingMatch(match.id)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[9px] font-bold font-mono rounded-lg transition-all cursor-pointer"
                      >
                        Dar Pontapé Inicial ⚡
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: Active Betting Form */}
        <div className="space-y-4">
          <span className="block text-[10px] font-mono text-slate-400 font-extrabold uppercase tracking-widest">📝 Registrar Seu Palpite</span>

          {(() => {
            const match = matches.find((m) => m.id === selectedMatchId);
            if (!match) return <p className="text-xs text-slate-500">Selecione uma partida para palpitar.</p>;

            const isLocked = match.status === 'ENCERRADO';

            return (
              <form onSubmit={handleInitiateBet} className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Match focus badge */}
                <div className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/30 p-2 rounded-lg border border-indigo-900/30 flex justify-between">
                  <span>Partida Selecionada:</span>
                  <span className="text-white font-extrabold">{match.homeTeam} x {match.awayTeam}</span>
                </div>

                {/* Core Score Prediction Form */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-mono text-slate-400 uppercase font-black">Previsão do Placar:</label>
                  
                  <div className="flex items-center justify-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-850">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-300">{match.homeTeam}</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        disabled={isLocked}
                        value={homePredict}
                        onChange={(e) => setHomePredict(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-12 bg-slate-950 border border-slate-850 rounded-lg text-center py-1.5 text-base text-white font-black font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <span className="text-slate-500 font-bold font-mono text-xs mt-4">x</span>

                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-300">{match.awayTeam}</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        disabled={isLocked}
                        value={awayPredict}
                        onChange={(e) => setAwayPredict(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-12 bg-slate-950 border border-slate-850 rounded-lg text-center py-1.5 text-base text-white font-black font-mono focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Betting Wager amount */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono text-slate-400 uppercase font-black">Valor do Palpite (A partir de R$ 1,00):</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">R$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      disabled={isLocked}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-emerald-400 font-black font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {[5, 10, 20, 50, 100].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        disabled={isLocked}
                        onClick={() => { setBetAmount(preset); playSound.click(); }}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                          betAmount === preset
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        R$ {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment selection */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono text-slate-400 uppercase font-black">Cobrança e Processamento:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => { setPaymentMethod('pix'); playSound.click(); }}
                      className={`flex items-center justify-center gap-1.5 py-2 border rounded-xl font-bold transition-all cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'bg-indigo-600/15 border-indigo-500 text-indigo-400'
                          : 'bg-slate-900/50 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-indigo-400" /> PIX
                    </button>
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => { setPaymentMethod('card'); playSound.click(); }}
                      className={`flex items-center justify-center gap-1.5 py-2 border rounded-xl font-bold transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-purple-600/15 border-purple-500 text-purple-400'
                          : 'bg-slate-900/50 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Cartão
                    </button>
                  </div>
                </div>

                {/* Submission CTA */}
                {isLocked ? (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-center text-[10px] rounded-lg">
                    ⚠️ Esta partida já encerrou. Por favor, escolha outro jogo da Copa ou do Brasil ativo.
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-indigo-600/20 transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 animate-bounce" />
                    Registrar Aposta de R$ {betAmount.toFixed(2)}
                  </button>
                )}

                {/* Real-time sync guarantee */}
                <div className="flex items-center gap-1.5 text-[8px] font-mono text-slate-500 pt-1 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SISTEMA DE TRANSMISSÃO OFICIAL ATIVO</span>
                </div>
              </form>
            );
          })()}
        </div>
      </div>

      {/* Rewards overview helper bar */}
      <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="block font-black text-white">💰 Tabela de Multiplicadores e Prêmios</span>
            <span className="text-slate-400 text-[10px] block">Os prêmios são concedidos no exato momento da finalização do jogo!</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
          <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-900">
            🟢 Placar Exato: <strong className="text-emerald-400">+5 Vidas, +150 Pontos, +200 Moedas</strong>
          </div>
          <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-900">
            🟡 Acerto Vencedor: <strong className="text-amber-400">+2 Vidas, +50 Pontos, +55 Moedas</strong>
          </div>
        </div>
      </div>

      {/* Historical Bets Section */}
      <div className="space-y-3">
        <span className="block text-[10px] font-mono text-slate-400 font-extrabold uppercase tracking-widest">📋 Minhas Apostas em Aberto &amp; Concluídas</span>
        
        {bets.length === 0 ? (
          <div className="p-6 bg-slate-950/50 border border-slate-900/50 rounded-xl text-center text-slate-500 text-xs">
            Nenhuma aposta cadastrada ainda nesta sessão. Seu histórico aparecerá aqui com as atualizações!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400 font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 text-[9px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">ID Aposta</th>
                  <th className="py-2.5 px-3">Partida</th>
                  <th className="py-2.5 px-3">Seu Palpite</th>
                  <th className="py-2.5 px-3">Wager</th>
                  <th className="py-2.5 px-3">Método</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {bets.map((bet) => {
                  const match = matches.find(m => m.id === bet.matchId);
                  const isMatchFinished = match?.status === 'ENCERRADO';

                  return (
                    <tr key={bet.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-300">{bet.id}</td>
                      <td className="py-3 px-3 text-white font-sans font-extrabold">{bet.teamsLabel}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-900 rounded font-black text-white text-xs">
                          {bet.homePredict} x {bet.awayPredict}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">R$ {bet.wager.toFixed(2)}</td>
                      <td className="py-3 px-3 uppercase text-[9px]">{bet.paymentMethod === 'pix' ? '🟢 PIX' : '🟣 Cartão'}</td>
                      <td className="py-3 px-3">
                        {bet.status === 'PENDENTE' && (
                          <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold">
                            ⏳ Pendente
                          </span>
                        )}
                        {bet.status === 'VENCEU_EXATO' && (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded text-[9px] font-extrabold flex items-center gap-1 w-fit">
                            🏆 Placar Exato!
                          </span>
                        )}
                        {bet.status === 'VENCEU_VENCEDOR' && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 rounded text-[9px] font-extrabold flex items-center gap-1 w-fit">
                            ⚽ Venceu Vendedor
                          </span>
                        )}
                        {bet.status === 'PERDEU' && (
                          <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-bold">
                            ❌ Perdeu
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {bet.status !== 'PENDENTE' && !bet.claimed && (
                          <button
                            onClick={() => handleClaimReward(bet)}
                            className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-black rounded hover:opacity-90 cursor-pointer"
                          >
                            Claim Prêmio 🎁
                          </button>
                        )}
                        {bet.claimed && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1 justify-end font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resgatado
                          </span>
                        )}
                        {bet.status === 'PENDENTE' && (
                          <span className="text-[10px] text-slate-500 italic">Aguardando Fim</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive payment checkout modal portal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 relative space-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500"></div>

            {paymentStep === 'idle' && (
              <>
                <h4 className="text-sm font-black text-white uppercase tracking-wider text-center flex items-center justify-center gap-1.5 pt-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Checkout Seguro Integrado
                </h4>
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  Confirme o pagamento de <strong className="text-emerald-400 font-black">R$ {betAmount.toFixed(2)}</strong> para registrar sua aposta com segurança no portal.
                </p>

                {paymentMethod === 'pix' ? (
                  <div className="space-y-3.5">
                    {/* Simulated PIX display */}
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
                      <QrCode className="w-32 h-32 text-indigo-400" />
                      <div className="space-y-1 w-full">
                        <span className="block text-[8px] font-mono text-slate-500 uppercase font-black">Chave Copia e Cola PIX</span>
                        <input
                          type="text"
                          readOnly
                          value={`00020101021126580014br.gov.bcb.pix0136arena-arcade-saques-real-futebol-pix-wager-${betAmount.toFixed(0)}`}
                          className="w-full bg-slate-900/50 border border-slate-800 text-[8px] font-mono text-slate-300 rounded px-2 py-1 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {/* Simulated Credit Card form */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Nome no Cartão</label>
                      <input
                        type="text"
                        placeholder="Ex: TIAGO JORGE"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-white font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="•••• •••• •••• ••••"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Validade</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[9px] font-mono text-slate-400 uppercase font-bold">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl cursor-pointer"
                  >
                    Confirmar Pagamento ⚡
                  </button>
                </div>
              </>
            )}

            {paymentStep === 'paying' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">Processando Transação...</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Aguardando liquidação junto ao gateway de pagamentos da Arena Arcade. Por favor, mantenha a janela aberta.
                  </p>
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center animate-scaleIn">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 animate-bounce">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider">Aposta Confirmada!</h4>
                  <p className="text-[10px] text-slate-300 leading-normal">
                    Seu Pix/Cartão foi liquidado com absoluto sucesso. O palpite foi anexado à sua conta de piloto. Boa sorte!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
