import React from 'react';
import { PlayerStats } from '../types';
import { AvatarRenderer } from './AvatarRenderer';
import { Shield, Sparkles, Heart, Trophy, ShoppingBag, Coins, Swords, History } from 'lucide-react';
import { playSound } from '../utils/audio';

interface HeaderProps {
  stats: PlayerStats;
  activeTab: 'games' | 'avatar' | 'shop' | 'logs';
  setActiveTab: (tab: 'games' | 'avatar' | 'shop' | 'logs') => void;
  openCheckoutForQuickBuy: (itemId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  activeTab,
  setActiveTab,
  openCheckoutForQuickBuy
}) => {
  const handleTabClick = (tab: 'games' | 'avatar' | 'shop' | 'logs') => {
    setActiveTab(tab);
    playSound.click();
  };

  const handleQuickBuyClick = (itemId: string) => {
    openCheckoutForQuickBuy(itemId);
    playSound.click();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3 md:px-6 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Swords className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black tracking-tighter text-white font-sans uppercase">
                GAME<span className="text-indigo-400">ZONE</span>
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-indigo-950/60 text-indigo-300 rounded border border-indigo-800/40 font-medium">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400">Arcade &amp; Customização Premium</p>
          </div>
        </div>

        {/* Player Stats Panel */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          
          {/* LIVES */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Vidas</div>
              <div className="text-sm font-bold text-white font-mono leading-tight">{stats.lives}</div>
            </div>
            {stats.lives <= 1 && (
              <button
                onClick={() => handleQuickBuyClick('pack_lives_5')}
                className="ml-1 text-[10px] px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded cursor-pointer transition-colors"
                id="btn-quick-buy-lives"
              >
                + Comprar
              </button>
            )}
          </div>

          {/* COINS / POINTS */}
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">
            <Coins className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Moedas</div>
              <div className="text-sm font-bold text-amber-400 font-mono leading-tight">{stats.coins}</div>
            </div>
            <button
              onClick={() => handleQuickBuyClick('coins_500')}
              className="ml-1 text-[10px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer transition-colors"
              id="btn-quick-buy-coins"
            >
              + Adicionar
            </button>
          </div>

          {/* STAGE LEVEL */}
          <div className="flex items-center gap-2.5 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Estágio</div>
              <div className="text-sm font-bold text-cyan-400 font-mono leading-tight">Nível {stats.currentStage}</div>
            </div>
            <button
              onClick={() => handleQuickBuyClick('pack_skips_3')}
              className="text-[10px] px-1.5 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded cursor-pointer transition-colors"
              id="btn-quick-skip"
            >
              Pular Fase
            </button>
          </div>

          {/* AVATAR BADGE */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
            <div className="p-0.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => handleTabClick('avatar')}>
              <AvatarRenderer config={stats.avatar} size="sm" animate={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-center sm:justify-start gap-2">
        <button
          onClick={() => handleTabClick('games')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all cursor-pointer ${
            activeTab === 'games'
              ? 'bg-indigo-600 text-white border border-indigo-500/40 shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
          id="tab-games"
        >
          <Swords className="w-4 h-4" />
          Jogar Arcade
        </button>
        <button
          onClick={() => handleTabClick('avatar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all cursor-pointer ${
            activeTab === 'avatar'
              ? 'bg-indigo-600 text-white border border-indigo-500/40 shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
          id="tab-avatar"
        >
          <Sparkles className="w-4 h-4" />
          Customizar Avatar
        </button>
        <button
          onClick={() => handleTabClick('shop')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all cursor-pointer ${
            activeTab === 'shop'
              ? 'bg-indigo-600 text-white border border-indigo-500/40 shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
          id="tab-shop"
        >
          <ShoppingBag className="w-4 h-4" />
          Loja Segura
        </button>
        <button
          onClick={() => handleTabClick('logs')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white border border-indigo-500/40 shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          }`}
          id="tab-logs"
        >
          <History className="w-4 h-4" />
          Extrato Seguro
        </button>
      </div>
    </header>
  );
};
