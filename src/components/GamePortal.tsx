import React, { useState } from 'react';
import { PlayerStats, ShopItem } from '../types';
import { GameRunner } from './GameRunner';
import { RouletteGame } from './RouletteGame';
import { TigerGame } from './TigerGame';
import { AviatorGame } from './AviatorGame';
import { playSound } from '../utils/audio';
import { Swords, Zap, Trophy, Heart, Coins, ArrowRight, ShieldCheck, PlayCircle, Star, Sparkles, Flame, Plane } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface GamePortalProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip', desc: string, amount: number, currency: 'coins' | 'real') => void;
  openShop: () => void;
  openCheckoutForQuickBuy: (itemId: string) => void;
}

export const GamePortal: React.FC<GamePortalProps> = ({
  stats,
  updateStats,
  addLog,
  openShop,
  openCheckoutForQuickBuy
}) => {
  const [activeGame, setActiveGame] = useState<'jumper' | 'clicker' | 'roulette' | 'tiger' | 'aviator' | null>(null);

  // Helper to count active stage skips owned by counting 'booster_stage_skip' in stats.unlockedAccessories
  const stageSkipsOwned = stats.unlockedAccessories.filter(x => x === 'booster_stage_skip').length;

  if (activeGame === 'roulette') {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white">🎡 Roleta da Sorte</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
        <RouletteGame
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame === 'tiger') {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white">🐯 Fortune Tiger VIP</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
        <TigerGame
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame === 'aviator') {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-black text-white">✈️ Aviator Crash</h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
        <AviatorGame
          stats={stats}
          updateStats={updateStats}
          addLog={addLog}
          onExit={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame) {
    return (
      <GameRunner
        gameId={activeGame}
        stats={stats}
        updateStats={updateStats}
        addLog={addLog}
        openShop={openShop}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Hero Welcome Banner */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Tech decorative curves */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-80 bg-purple-500/5 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10 text-center md:text-left max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold font-mono rounded-full border border-indigo-500/20">
            <Zap className="w-3.5 h-3.5" /> ARENA ARCADE DISPONÍVEL
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight font-sans">
            Entre na Arena, Supere as Etapas e Colecione Troféus!
          </h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Seu personagem customizado participa ativamente de todos os jogos do portal. Ganhe moedas de ouro batendo recordes de pontuação!
          </p>
        </div>

        {/* Quick metrics visual */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 min-w-[200px] text-xs font-mono text-slate-300 relative z-10 w-full md:w-auto">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center border-b border-slate-850 pb-1.5 mb-1 font-bold">
            Status do Piloto
          </div>
          <div className="flex justify-between">
            <span>❤️ Vidas Restantes:</span>
            <span className="text-white font-bold">{stats.lives}</span>
          </div>
          <div className="flex justify-between">
            <span>🪙 Moedas do Jogo:</span>
            <span className="text-amber-400 font-bold">{stats.coins}</span>
          </div>
          <div className="flex justify-between">
            <span>⏩ Fase Atual:</span>
            <span className="text-indigo-400 font-bold">Nível {stats.currentStage}</span>
          </div>
          <div className="flex justify-between">
            <span>🚀 Skips de Fase:</span>
            <span className="text-purple-400 font-bold">{stageSkipsOwned}</span>
          </div>
        </div>
      </div>

      {/* Bento Grid: Game cards list */}
      <div className="space-y-4">
        <h3 className="text-md font-extrabold uppercase tracking-widest text-slate-400 font-mono">
          Nossos Minijogos Disponíveis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Pixel Jumper */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-indigo-500/40 hover:-translate-y-1 duration-300 flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <Swords className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-800/35">
                  Dificuldade: Média
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                  Pixel Jumper Arcade
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Um eletrizante teste de plataforma side-scroller. Controle o seu avatar customizado e salte sobre as barreiras elétricas vermelhas. Limpe a quantidade de obstáculos exigida pelo nível atual para passar ao próximo estágio!
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono">
                Custo de jogo: <strong className="text-rose-400">1 Vida (em caso de derrota)</strong>
              </div>
              <button
                onClick={() => setActiveGame('jumper')}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                id="btn-play-jumper"
              >
                <PlayCircle className="w-4 h-4" /> Jogar
              </button>
            </div>
          </div>

          {/* Card 2: Neon Clicker */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-purple-500/40 hover:-translate-y-1 duration-300 flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-full border border-purple-800/35">
                  Dificuldade: Ágil
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-extrabold text-white group-hover:text-purple-400 transition-colors">
                  Neon Portal Clicker
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Teste seus reflexos com este ágil tap-to-earn. Esferas de energia de neon aparecem aleatoriamente no quadro. Estoure todas antes que desapareçam para acumular o score quota do estágio em até 15 segundos!
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono">
                Custo de jogo: <strong className="text-rose-400">1 Vida (em caso de derrota)</strong>
              </div>
              <button
                onClick={() => setActiveGame('clicker')}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                id="btn-play-clicker"
              >
                <PlayCircle className="w-4 h-4" /> Jogar
              </button>
            </div>
          </div>

          {/* Card 4: Cyber Roulette da Sorte */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-cyan-500/40 hover:-translate-y-1 duration-300 flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
                  <Star className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-800/35">
                  Giro: Equiprovável
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-extrabold text-white group-hover:text-cyan-400 transition-colors">
                  Roleta Cyber da Sorte
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A roleta da sorte está de volta com prêmios de alta conversão! Gire a roleta de 8 quadrantes por apenas 30 moedas e fature prêmios incríveis como 500 moedas extras, vidas extras e stage skips de fase!
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono">
                Custo de jogo: <strong className="text-cyan-400">🪙 30 Moedas</strong>
              </div>
              <button
                onClick={() => {
                  setActiveGame('roulette');
                  playSound.click();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
                id="btn-play-roulette"
              >
                <PlayCircle className="w-4 h-4" /> Girar Roleta
              </button>
            </div>
          </div>

          {/* Card 5: Fortune Tiger */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-amber-500/40 hover:-translate-y-1 duration-300 flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                  <Flame className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800/35">
                  Multiplicador: Até 20x
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-extrabold text-white group-hover:text-amber-400 transition-colors">
                  Fortune Tiger VIP 🐯
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  O queridinho do Brasil chegou! Gire a pata de ouro do tigre, alinhe envelopes da sorte, sacos de ouro e fogos de artifício na grade 3x3 e fature multiplicadores explosivos no caça-níquel mais famoso das redes!
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono">
                Custo de jogo: <strong className="text-amber-400">Moedas (Sua Aposta)</strong>
              </div>
              <button
                onClick={() => {
                  setActiveGame('tiger');
                  playSound.click();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/25 transition-all cursor-pointer"
                id="btn-play-tiger"
              >
                <PlayCircle className="w-4 h-4 text-slate-950" /> Soltar o Tigre
              </button>
            </div>
          </div>

          {/* Card 6: Aviator Crash */}
          <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-rose-500/40 hover:-translate-y-1 duration-300 flex flex-col justify-between">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
                  <Plane className="w-6 h-6 text-rose-500" />
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-800/35">
                  Decolagem: Multiplicador Vivo
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-extrabold text-white group-hover:text-rose-400 transition-colors">
                  Aviator Crash ✈️
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Decole o aviãozinho da sorte e assista o multiplicador subir rapidamente em tempo real! Retire seu investimento com lucro em moedas antes que o motor entre em pane e ele decole para longe do radar.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-mono">
                Custo de jogo: <strong className="text-rose-400">Moedas (Sua Aposta)</strong>
              </div>
              <button
                onClick={() => {
                  setActiveGame('aviator');
                  playSound.click();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
                id="btn-play-aviator"
              >
                <PlayCircle className="w-4 h-4 text-slate-950" /> Decolar Saldo
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Persistent Ad Monetization Banner */}
      <AdBanner position="bottom" />

      {/* Guide Footer Info: Lives, Stage skips, etc */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Como avançar se as fases estiverem difíceis?
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
            <h5 className="font-bold text-slate-200 flex items-center gap-1">
              ❤️ Comprar Vidas
            </h5>
            <p className="leading-relaxed">
              Ficou sem vidas? Adquira pacotes de vidas na Loja Segura por Pix/Cartão para reiniciar suas jogadas imediatamente de onde parou.
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
            <h5 className="font-bold text-slate-200 flex items-center gap-1">
              ⏩ Avançar de Fase
            </h5>
            <p className="leading-relaxed">
              Algum estágio com dificuldade de alta frequência? Use um crédito de Pulo de Fase (Stage Skip) para transicionar ao próximo nível e ainda receber moedas de bônus!
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
            <h5 className="font-bold text-slate-200 flex items-center gap-1">
              🪙 Loja Integrada Segura
            </h5>
            <p className="leading-relaxed">
              Todos os checkouts na nossa loja integrada simulam os principais gateways de pagamento do mercado, protegendo dados com SSL ativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
