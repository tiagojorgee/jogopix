import { useState, useEffect } from 'react';
import { PlayerStats, TransactionLog, ShopItem } from './types';
import { Header } from './components/Header';
import { GamePortal } from './components/GamePortal';
import { AvatarCustomizer } from './components/AvatarCustomizer';
import { Shop } from './components/Shop';
import { TransactionLogs } from './components/TransactionLogs';
import { CheckoutModal } from './components/CheckoutModal';
import { GoogleDriveSyncBar } from './components/GoogleDriveSyncBar';
import { FootballBets } from './components/FootballBets';
import { Cinema } from './components/Cinema';
import { SHOP_ITEMS, SKINS, ACCESSORIES, AURAS } from './data/shopItems';
import { ShieldCheck, Sparkles, X, Heart, Coins } from 'lucide-react';
import { playSound } from './utils/audio';
import { getLevelForPoints, SKIN_LEVELS, ACCESSORY_LEVELS, AURA_LEVELS } from './utils/levelManager';
import { AuthModal, AppUser } from './components/AuthModal';
import { googleSignOut } from './utils/googleDriveDb';

export default function App() {
  // Tabs: 'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema'
  const [activeTab, setActiveTab] = useState<'games' | 'avatar' | 'shop' | 'logs' | 'football' | 'cinema'>('games');

  // User Authentication States
  const [loggedInUser, setLoggedInUser] = useState<AppUser | null>(() => {
    const cached = localStorage.getItem('gamezone_logged_in_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached user:', e);
      }
    }
    return null;
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('gamezone_logged_in_user', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('gamezone_logged_in_user');
    }
  }, [loggedInUser]);

  const handleLogout = async () => {
    playSound.click();
    if (loggedInUser?.provider === 'google') {
      try {
        await googleSignOut();
      } catch (e) {
        console.error('Error signing out Google:', e);
      }
    }
    setLoggedInUser(null);
    triggerToast('ℹ️ Sessão finalizada com sucesso.');
  };
  
  // Checkout triggers
  const [checkoutItem, setCheckoutItem] = useState<ShopItem | null>(null);
  
  // App-level Toast notifications
  const [appToast, setAppToast] = useState<string | null>(null);

  // Initialize state with default values or localStorage
  const [stats, setStats] = useState<PlayerStats>(() => {
    const cached = localStorage.getItem('gamezone_player_stats');
    const defaultStats = {
      coins: 150, // Starts with a small bonus of 150 coins to test the customizer immediately!
      lives: 3,
      currentStage: 1,
      highScore: 0,
      unlockedSkins: ['classic'],
      unlockedAccessories: ['none'],
      unlockedAuras: ['none'],
      avatar: {
        skin: 'classic',
        accessory: 'none',
        aura: 'none'
      },
      points: 0,
      level: 1
    };
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return {
          ...defaultStats,
          ...parsed,
          points: parsed.points ?? 0,
          level: parsed.level ?? 1
        };
      } catch (e) {
        console.error('Error parsing cached player stats:', e);
      }
    }
    return defaultStats;
  });

  // Intercept stats updates to handle point awards and level-up events
  const updateStats = (updater: (prev: PlayerStats) => PlayerStats) => {
    setStats((prev) => {
      const updated = updater(prev);
      const prevPoints = prev.points ?? 0;
      const updatedPoints = updated.points ?? prevPoints;
      
      const { level: newLevel } = getLevelForPoints(updatedPoints);
      const prevLevel = prev.level ?? 1;

      // Handle unlocking of rewards automatically!
      let unlockedSkins = [...(updated.unlockedSkins ?? prev.unlockedSkins ?? ['classic'])];
      let unlockedAccessories = [...(updated.unlockedAccessories ?? prev.unlockedAccessories ?? ['none'])];
      let unlockedAuras = [...(updated.unlockedAuras ?? prev.unlockedAuras ?? ['none'])];

      // Check for rewards that get unlocked at specific levels
      if (newLevel > prevLevel) {
        // Find which items should unlock up to this level
        const newlyUnlocked: string[] = [];

        // Check skins
        Object.entries(SKIN_LEVELS).forEach(([id, reqLevel]) => {
          if (reqLevel <= newLevel && !unlockedSkins.includes(id)) {
            unlockedSkins.push(id);
            const skinName = SKINS.find(s => s.id === id)?.name || id;
            newlyUnlocked.push(`Pele ${skinName}`);
          }
        });

        // Check accessories
        Object.entries(ACCESSORY_LEVELS).forEach(([id, reqLevel]) => {
          if (reqLevel <= newLevel && !unlockedAccessories.includes(id)) {
            unlockedAccessories.push(id);
            const accName = ACCESSORIES.find(a => a.id === id)?.name || id;
            newlyUnlocked.push(`Acessório ${accName}`);
          }
        });

        // Check auras
        Object.entries(AURA_LEVELS).forEach(([id, reqLevel]) => {
          if (reqLevel <= newLevel && !unlockedAuras.includes(id)) {
            unlockedAuras.push(id);
            const auraName = AURAS.find(a => a.id === id)?.name || id;
            newlyUnlocked.push(`Aura ${auraName}`);
          }
        });

        setTimeout(() => {
          try {
            playSound.jackpot();
          } catch (err) {}
          let unlockMsg = `🎉 PARABÉNS! Você alcançou o Nível ${newLevel}! 👑`;
          if (newlyUnlocked.length > 0) {
            unlockMsg += ` Desbloqueado gratuitamente: ${newlyUnlocked.join(', ')}!`;
          }
          setAppToast(unlockMsg);
        }, 150);
      }

      return {
        ...updated,
        unlockedSkins,
        unlockedAccessories,
        unlockedAuras,
        points: updatedPoints,
        level: newLevel
      };
    });
  };

  // Lifted financial states for synchronization and monetization headers
  const [realBalance, setRealBalance] = useState<number>(() => {
    const cached = localStorage.getItem('gamezone_real_balance');
    return cached ? parseFloat(cached) : 120.00; // default initial simulated balance of R$ 120
  });

  const [withdrawLimit, setWithdrawLimit] = useState<number>(() => {
    const cached = localStorage.getItem('gamezone_withdraw_limit');
    return cached ? parseFloat(cached) : 100.00; // default initial withdrawal limit
  });

  // Synchronize financial localStorage
  useEffect(() => {
    localStorage.setItem('gamezone_real_balance', realBalance.toFixed(2));
  }, [realBalance]);

  useEffect(() => {
    localStorage.setItem('gamezone_withdraw_limit', withdrawLimit.toFixed(2));
  }, [withdrawLimit]);

  const [logs, setLogs] = useState<TransactionLog[]>(() => {
    const cached = localStorage.getItem('gamezone_transaction_logs');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error parsing cached logs:', e);
      }
    }
    // Return initial default logs to look rich
    const initialHash = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return [
      {
        id: 'TXN-INITIAL-001',
        timestamp: new Date().toLocaleString('pt-BR'),
        type: 'earn',
        description: 'Bônus de Boas-vindas creditado na criação da conta',
        amount: 150,
        currency: 'coins',
        status: 'success',
        securityHash: `0x${initialHash}`
      }
    ];
  });

  // Save changes to localStorage for state preservation
  useEffect(() => {
    localStorage.setItem('gamezone_player_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('gamezone_transaction_logs', JSON.stringify(logs));
  }, [logs]);

  // Utility to append transaction logs securely with simulated SHA256 hashes
  const addLog = (
    type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip',
    desc: string,
    amount: number,
    currency: 'coins' | 'real'
  ) => {
    const hexChars = '0123456789abcdef';
    const randomHash = Array.from({ length: 32 }, () => hexChars[Math.floor(Math.random() * 16)]).join('');
    const randomId = `TXN-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(10 + Math.random() * 89)}`;

    const newLog: TransactionLog = {
      id: randomId,
      timestamp: new Date().toLocaleString('pt-BR'),
      type,
      description: desc,
      amount,
      currency,
      status: 'success',
      securityHash: `0x${randomHash}`
    };

    setLogs((prev) => [...prev, newLog]);
  };

  // Helper to trigger direct quick-buys from headers/shortcuts
  const openCheckoutForQuickBuy = (itemId: string) => {
    const match = SHOP_ITEMS.find((it) => it.id === itemId);
    if (match) {
      setCheckoutItem(match);
    }
  };

  // Fulfill secure payments directly
  const handleCheckoutSuccess = (item: ShopItem) => {
    setStats((prev) => {
      let nextLives = prev.lives;
      let nextCoins = prev.coins;
      let nextSkins = [...prev.unlockedSkins];
      let nextAccessories = [...prev.unlockedAccessories];
      let nextAuras = [...prev.unlockedAuras];
      let nextIsVip = prev.isVip;
      let nextRtpBoostSpins = prev.rtpBoostSpins || 0;

      if (item.subCategory === 'lives') {
        nextLives += item.value;
      } else if (item.subCategory === 'pack' && item.id.includes('coins')) {
        nextCoins += item.value;
      } else if (item.id === 'limit_upgrade_500') {
        nextCoins += item.value;
        nextLives += 5; // 5 bonus lives!
      } else if (item.id === 'pack_skips_3') {
        // Push 3 copies of 'booster_stage_skip' to unlockedAccessories
        nextAccessories.push(...Array(item.value).fill('booster_stage_skip'));
      } else if (item.id === 'vip_all_access') {
        // Unlock all assets!
        nextSkins = SKINS.map((s) => s.id);
        nextAccessories = ACCESSORIES.map((a) => a.id);
        nextAuras = AURAS.map((au) => au.id);
        // Add 10 bonus lives
        nextLives += 10;
        nextIsVip = true;
      } else if (item.id === 'booster_luck_15') {
        nextRtpBoostSpins += item.value;
      }

      return {
        ...prev,
        lives: nextLives,
        coins: nextCoins,
        unlockedSkins: nextSkins,
        unlockedAccessories: nextAccessories,
        unlockedAuras: nextAuras,
        isVip: nextIsVip,
        rtpBoostSpins: nextRtpBoostSpins
      };
    });

    const isPack = item.category === 'coins';
    const logType = isPack ? 'purchase_coins' : 'purchase_booster';
    addLog(logType, `Compra Segura aprovada: ${item.name}`, item.price, 'real');

    playSound.purchase();
    setCheckoutItem(null);
    triggerToast(`Sucesso! Seu ${item.name} foi creditado com segurança no sistema.`);
  };

  function triggerToast(msg: string) {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 4000);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* Decorative Fluid Ambient Glowing Backdrops */}
      <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[50%] rounded-full bg-indigo-600/5 blur-[130px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[50%] rounded-full bg-purple-600/5 blur-[130px] pointer-events-none animate-float" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-blue-600/3 blur-[140px] pointer-events-none animate-float" style={{ animationDelay: '6s' }} />
      
      {/* Upper security announcement ribbon */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 py-1.5 text-center text-[10px] md:text-xs text-slate-400 font-mono flex items-center justify-center gap-2 relative z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>SISTEMA DE PAGAMENTO CRIPTOGRAFADO ATIVO — CONEXÃO SEGURA SSL</span>
      </div>

      {/* Main Header navigation & Player stats */}
      <Header
        stats={stats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openCheckoutForQuickBuy={openCheckoutForQuickBuy}
        realBalance={realBalance}
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Google Drive Cloud DB Sync Bar */}
      <GoogleDriveSyncBar
        stats={stats}
        realBalance={realBalance}
        withdrawLimit={withdrawLimit}
        logs={logs}
        setStats={setStats}
        setRealBalance={setRealBalance}
        setWithdrawLimit={setWithdrawLimit}
        setLogs={setLogs}
        triggerToast={triggerToast}
        loggedInUser={loggedInUser}
        setLoggedInUser={setLoggedInUser}
      />

      {/* App-level Toast notifications */}
      {appToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-900/90 text-emerald-200 border border-emerald-700/80 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn max-w-sm">
          <div className="p-1 bg-emerald-800 rounded-lg text-emerald-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs font-semibold">{appToast}</p>
          <button
            onClick={() => setAppToast(null)}
            className="text-emerald-400 hover:text-emerald-100 cursor-pointer ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-view switcher based on active tab */}
      <main className="flex-1 pb-16">
        {activeTab === 'games' && (
          <GamePortal
            stats={stats}
            updateStats={updateStats}
            addLog={addLog}
            openShop={() => setActiveTab('shop')}
            openCheckoutForQuickBuy={openCheckoutForQuickBuy}
            loggedInUser={loggedInUser}
            onOpenAuthModal={() => setShowAuthModal(true)}
            realBalance={realBalance}
            setRealBalance={setRealBalance}
            withdrawLimit={withdrawLimit}
            setWithdrawLimit={setWithdrawLimit}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'football' && (
          <div className="p-3 md:p-6 max-w-5xl mx-auto">
            <FootballBets
              stats={stats}
              updateStats={updateStats}
              addLog={addLog}
              realBalance={realBalance}
              setRealBalance={setRealBalance}
              withdrawLimit={withdrawLimit}
              setWithdrawLimit={setWithdrawLimit}
            />
          </div>
        )}

        {activeTab === 'avatar' && (
          <AvatarCustomizer
            stats={stats}
            updateStats={updateStats}
            addLog={addLog}
            openCheckoutForCoins={() => setActiveTab('shop')}
          />
        )}

        {activeTab === 'shop' && (
          <Shop
            stats={stats}
            updateStats={updateStats}
            addLog={addLog}
            openCheckout={(item) => setCheckoutItem(item)}
          />
        )}

        {activeTab === 'logs' && (
          <TransactionLogs
            logs={logs}
          />
        )}

        {activeTab === 'cinema' && (
          <Cinema
            stats={stats}
            updateStats={updateStats}
            addLog={addLog}
            loggedInUser={loggedInUser}
            onOpenLogin={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* Integrated secure checkout modal overlay */}
      {checkoutItem && (
        <CheckoutModal
          item={checkoutItem}
          onClose={() => setCheckoutItem(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* User Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(user) => {
            setLoggedInUser(user);
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* Global persistent Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-xs text-slate-500 mt-auto font-sans">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-900">
            {/* Logo and support */}
            <div className="text-center md:text-left space-y-1.5">
              <div className="text-sm font-black text-white tracking-wider font-mono">
                🚀 GAME<span className="text-indigo-400">ZONE</span> ARCADE &amp; CINE
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Sua plataforma integrada de entretenimento virtual premium e streaming.
              </p>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-slate-400 font-medium">
              <button onClick={() => setActiveTab('games')} className="hover:text-indigo-400 transition-colors cursor-pointer">Arcade</button>
              <button onClick={() => setActiveTab('cinema')} className="hover:text-red-500 transition-colors cursor-pointer">Sessão Cinema</button>
              <button onClick={() => setActiveTab('football')} className="hover:text-emerald-400 transition-colors cursor-pointer">Futebol</button>
              <button onClick={() => setActiveTab('shop')} className="hover:text-purple-400 transition-colors cursor-pointer">Loja VIP</button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 text-[11px] text-slate-500 font-mono">
            {/* Contact and copyright */}
            <div className="text-center sm:text-left space-y-1">
              <p>© 2026 GameZone Inc. Todos os direitos reservados.</p>
              <p>Contato &amp; Suporte: <a href="mailto:tiagojorgeengenheiro@gmail.com" className="text-indigo-400 hover:text-indigo-300 transition-colors underline select-all font-sans font-medium">tiagojorgeengenheiro@gmail.com</a></p>
            </div>

            {/* Security badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/40 border border-slate-900/60 px-3 py-1.5 rounded-xl text-[10px] text-slate-400">
              <span className="flex items-center gap-1">🔒 SSL Criptografado</span>
              <span className="text-slate-700">•</span>
              <span>🛡️ PCI-DSS Nível 1</span>
              <span className="text-slate-700">•</span>
              <span className="text-emerald-400 font-bold">⚡ Pix Instantâneo BC</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
