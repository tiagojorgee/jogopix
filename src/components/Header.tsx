import React from 'react';
import { PlayerStats } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { Shield, Sparkles, Heart, Trophy, ShoppingBag, Coins, Swords, History, Wallet, Award } from 'lucide-react';
import { playSound } from '../utils/audio';
import { getLevelForPoints } from '../utils/levelManager';

interface HeaderProps {
  stats: PlayerStats;
  activeTab: 'games' | 'avatar' | 'shop' | 'logs' | 'saque';
  setActiveTab: (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'saque') => void;
  openCheckoutForQuickBuy: (itemId: string) => void;
  realBalance?: number;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  setActiveTab,
  openCheckoutForQuickBuy,
  realBalance
}) => {
  const handleTabClick = (tab: 'games' | 'avatar' | 'shop' | 'logs' | 'saque') => {
    setActiveTab(tab);
    playSound.click();
  };

  const handleQuickBuyClick = (itemId: string) => {
    openCheckoutForQuickBuy(itemId);
    playSound.click();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-900 px-3 py-2.5 md:px-6 md:py-3.5 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/10 hover:scale-105 transition-transform duration-300">
              <Swords className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white font-sans uppercase flex items-center gap-1">
                  GAME<span className="text-indigo-400 bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ZONE</span>
                </h1>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-indigo-950/60 text-indigo-300 rounded border border-indigo-800/40 font-bold">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400">Arcade &amp; Customização Premium</p>
            </div>
          </div>

          {/* Quick Mini Avatar badge on mobile header right */}
          <div className="md:hidden flex items-center gap-2">
            <div 
              className="p-1 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => handleTabClick('avatar')}
            >
              <AvatarRenderer config={stats.avatar} size="xs" animate={true} />
            </div>
          </div>
        </div>

        {/* Player Stats Panel */}
        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-none pb-1 md:pb-0 -mx-3 px-3 md:mx-0 md:px-0 w-auto max-w-full flex-nowrap shrink-0">
          
          {/* SALDO REAL (Simulado) */}
          {realBalance !== undefined && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-950/35 border border-emerald-500/25 rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.06)] shrink-0">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-left">
                <div className="text-[8px] text-emerald-400 leading-none font-extrabold uppercase tracking-wider">Saldo Sacável</div>
                <div className="text-xs md:text-sm font-bold text-emerald-300 font-mono leading-tight">R$ {realBalance.toFixed(2)}</div>
              </div>
              <button
                onClick={() => handleTabClick('saque')}
                className="ml-1 text-[9px] px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-md cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-700/20"
                id="btn-nav-saque"
              >
                Sacar
              </button>
            </div>
          )}

          {/* VIP BADGE */}
          {stats.isVip ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/40 rounded-lg shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black text-amber-300 font-mono tracking-tight">VIP</span>
            </div>
          ) : (
            <button
              onClick={() => handleQuickBuyClick('vip_all_access')}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-slate-900 to-indigo-950 hover:to-indigo-900 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-105 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>VIP</span>
            </button>
          )}

          {/* LUCKY BOOST SPINS */}
          {stats.rtpBoostSpins !== undefined && stats.rtpBoostSpins > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-cyan-300 font-mono text-[10px] shrink-0">
              <span className="animate-pulse">🍀 Sorte+</span>
              <span className="font-bold text-cyan-400">{stats.rtpBoostSpins}x</span>
            </div>
          )}

          {/* LIVES */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800/80 rounded-lg shrink-0">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <div className="text-left">
              <div className="text-[8px] text-slate-400 leading-none">Vidas</div>
              <div className="text-xs md:text-sm font-bold text-white font-mono leading-tight">{stats.lives}</div>
            </div>
            {stats.lives <= 1 && (
              <button
                onClick={() => handleQuickBuyClick('pack_lives_5')}
                className="ml-1 text-[9px] px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer transition-colors"
                id="btn-quick-buy-lives"
              >
                + Vidas
              </button>
            )}
          </div>

          {/* COINS / POINTS */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800/80 rounded-lg shrink-0">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-left">
              <div className="text-[8px] text-slate-400 leading-none">Moedas</div>
              <div className="text-xs md:text-sm font-bold text-amber-400 font-mono leading-tight">{stats.coins}</div>
            </div>
            <button
              onClick={() => handleQuickBuyClick('coins_500')}
              className="ml-1 text-[9px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded cursor-pointer transition-colors"
              id="btn-quick-buy-coins"
            >
              + Moedas
            </button>
          </div>

          {/* PLAYER LEVEL PROGRESS */}
          {(() => {
            const currentPoints = stats.points ?? 0;
            const currentLevel = stats.level ?? 1;
            const { nextLevelPoints, currentLevelMinPoints } = getLevelForPoints(currentPoints);
            const levelRange = nextLevelPoints - currentLevelMinPoints;
            const currentProgress = currentPoints - currentLevelMinPoints;
            const percentage = Math.min(100, Math.max(0, (currentProgress / levelRange) * 100));

            return (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800/80 rounded-lg shadow-inner group relative shrink-0" title={`${currentPoints} XP acumulados`}>
                <Award className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-[8px] text-indigo-300 font-extrabold leading-none uppercase flex items-center gap-1">
                    Lvl {currentLevel}
                  </div>
                  <div className="w-10 h-1 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800/60">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE LEVEL */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/60 border border-slate-800/80 rounded-lg shrink-0">
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-left">
              <div className="text-[8px] text-slate-400 leading-none">Estágio</div>
              <div className="text-xs md:text-sm font-bold text-cyan-400 font-mono leading-tight">Fase {stats.currentStage}</div>
            </div>
            <button
              onClick={() => handleQuickBuyClick('pack_skips_3')}
              className="text-[9px] px-1.5 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer transition-colors"
              id="btn-quick-skip"
            >
              Pular
            </button>
          </div>

          {/* AVATAR BADGE */}
          <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-2 shrink-0">
            <div className="p-0.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => handleTabClick('avatar')}>
              <AvatarRenderer config={stats.avatar} size="sm" animate={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-900/60 flex items-center justify-start gap-1.5 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0 flex-nowrap w-auto max-w-full">
        <button
          onClick={() => handleTabClick('games')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'games'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
          id="tab-games"
        >
          <Swords className="w-3.5 h-3.5 text-indigo-400" />
          Jogar Arcade
        </button>
        <button
          onClick={() => handleTabClick('avatar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'avatar'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
          id="tab-avatar"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Customizar Avatar
        </button>
        <button
          onClick={() => handleTabClick('shop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'shop'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
          id="tab-shop"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
          Loja Segura
        </button>
        <button
          onClick={() => handleTabClick('logs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
          id="tab-logs"
        >
          <History className="w-3.5 h-3.5 text-blue-400" />
          Extrato Seguro
        </button>
        <button
          onClick={() => handleTabClick('saque')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'saque'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border border-indigo-500/30 shadow-lg shadow-indigo-600/15 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
          id="tab-saque"
        >
          <Wallet className="w-3.5 h-3.5 text-teal-400" />
          Saque &amp; Caixa
        </button>
      </div>
    </header>
  );
};
