import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../types';
import { 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle, 
  Loader2, 
  Coins, 
  CheckCircle2, 
  Copy, 
  Check, 
  Settings, 
  Banknote, 
  ArrowRightLeft,
  PiggyBank
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface WithdrawSectionProps {
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: any, desc: string, amount: number, currency: 'coins' | 'real') => void;
  realBalance: number;
  setRealBalance: React.Dispatch<React.SetStateAction<number>>;
  withdrawLimit: number;
  setWithdrawLimit: React.Dispatch<React.SetStateAction<number>>;
  openShop?: () => void;
}

export const WithdrawSection: React.FC<WithdrawSectionProps> = ({
  stats,
  updateStats,
  addLog,
  realBalance,
  setRealBalance,
  withdrawLimit,
  setWithdrawLimit,
  openShop
}) => {
  // Operator receiving account details state (can be configured by admin)
  const [opPixKey, setOpPixKey] = useState<string>(() => {
    return localStorage.getItem('gamezone_op_pix_key') || 'tiagojorgeengenheiro@gmail.com';
  });
  const [opName, setOpName] = useState<string>(() => {
    return localStorage.getItem('gamezone_op_name') || 'Tiago Jorge Engenheiro';
  });
  const [opBank, setOpBank] = useState<string>(() => {
    return localStorage.getItem('gamezone_op_bank') || 'Banco Inter S.A.';
  });
  const [opKeyType, setOpKeyType] = useState<string>(() => {
    return localStorage.getItem('gamezone_op_key_type') || 'E-mail';
  });

  // User input states for withdrawal
  const [userPixKey, setUserPixKey] = useState<string>('');
  const [userKeyType, setUserKeyType] = useState<string>('CPF');
  const [userPixName, setUserPixName] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50.00');

  // Conversion of coins to real balance state
  const [coinConvertAmount, setCoinConvertAmount] = useState<string>('100');

  // Logic & UI Control States
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<boolean>(false);
  const [successAmount, setSuccessAmount] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('gamezone_op_pix_key', opPixKey);
    localStorage.setItem('gamezone_op_name', opName);
    localStorage.setItem('gamezone_op_bank', opBank);
    localStorage.setItem('gamezone_op_key_type', opKeyType);
  }, [opPixKey, opName, opBank, opKeyType]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Convert game coins to withdrawable balance
  const handleConvertCoins = () => {
    const coinsToConvert = parseInt(coinConvertAmount);
    if (isNaN(coinsToConvert) || coinsToConvert <= 0) {
      setErrorMsg('Quantidade de moedas inválida.');
      return;
    }

    if (stats.coins < coinsToConvert) {
      setErrorMsg(`Moedas insuficientes! Você possui apenas 🪙 ${stats.coins} moedas no inventário.`);
      playSound.gameover();
      return;
    }

    if (coinsToConvert < 10) {
      setErrorMsg('A conversão mínima é de 10 moedas.');
      return;
    }

    // Conversion rate: 100 coins = R$ 1.00 (or 1 coin = R$ 0.01)
    const gainedCash = coinsToConvert * 0.01;

    updateStats(prev => ({
      ...prev,
      coins: prev.coins - coinsToConvert
    }));

    setRealBalance(prev => prev + gainedCash);
    addLog('purchase_booster', `Conversão: ${coinsToConvert} moedas → R$ ${gainedCash.toFixed(2)}`, coinsToConvert, 'coins');
    
    setErrorMsg(null);
    playSound.collect();
    showToast(`Conversão concluída! 🪙 ${coinsToConvert} moedas convertidas em R$ ${gainedCash.toFixed(2)}.`);
  };

  // Process withdrawal requests
  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Valor de saque inválido.');
      return;
    }

    if (amount < 20.00) {
      setErrorMsg('O valor mínimo permitido para saques é de R$ 20,00.');
      return;
    }

    if (amount > realBalance) {
      setErrorMsg(`Saldo insuficiente! Seu saldo disponível para saque é de R$ ${realBalance.toFixed(2)}.`);
      return;
    }

    if (amount > withdrawLimit) {
      setErrorMsg(`Limite de Saque insuficiente! Seu limite máximo de retirada atual é de R$ ${withdrawLimit.toFixed(2)}. Para sacar R$ ${amount.toFixed(2)}, você precisa aumentar seu limite. Você pode adquirir o upgrade de limite (+R$ 500) na Loja Segura ou ativar o VIP PREMIUM que dobra seus limites instantaneamente!`);
      return;
    }

    if (!userPixKey.trim()) {
      setErrorMsg('Chave Pix destinatária é obrigatória.');
      return;
    }

    if (!userPixName.trim()) {
      setErrorMsg('Nome completo do titular da conta é obrigatório.');
      return;
    }

    // Reset errors and start beautiful processing flow
    setErrorMsg(null);
    setIsProcessing(true);
    setProcessingStep('Autenticando requisição de saque com assinatura criptográfica...');
    playSound.click();

    setTimeout(() => {
      setProcessingStep('Verificando saldo e limites ativos no livro de transações...');
      
      setTimeout(() => {
        setProcessingStep('Consultando chaves de endereçamento no diretório Pix do Banco Central...');
        
        setTimeout(() => {
          setProcessingStep('Autenticando transação com a conta de pagamentos bancários...');
          
          setTimeout(() => {
            // Deduct balance & limit
            setRealBalance(prev => prev - amount);
            setWithdrawLimit(prev => Math.max(0, prev - amount));
            addLog('stage_skip', `Saque Pix Aprovado (${userKeyType})`, amount, 'real');
            
            setSuccessAmount(amount);
            setIsProcessing(false);
            setWithdrawSuccess(true);
            playSound.purchase();
          }, 1200);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleSaveOpAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfiguring(false);
    playSound.click();
    showToast('Conta de recebimento salva e sincronizada com o sistema de pagamento!');
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-900 border border-emerald-700 text-emerald-100 rounded-xl shadow-2xl flex items-center gap-2 animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold font-sans">{toastMsg}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center justify-center md:justify-start gap-2">
            <Wallet className="w-6 h-6 text-indigo-400" />
            Central de Saques &amp; Caixa
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Converta moedas acumuladas nos jogos, consulte seu limite ativo e efetue saques instantâneos via Pix.
          </p>
        </div>

        {/* Security seal */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl self-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-300">
            Saques Autorizados BCB
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Balance card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
            Saldo Disponível (Real)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-slate-400">R$</span>
            <span className="text-3xl font-black text-white font-mono">{realBalance.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Saldo acumulado por vitórias em jogos de apostas ou conversão de moedas.
          </p>
        </div>

        {/* Limit card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block flex items-center justify-between">
            <span>Limite de Saque Ativo</span>
            {openShop && (
              <button
                onClick={() => { playSound.click(); openShop(); }}
                className="text-[9px] text-amber-400 font-sans font-extrabold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                ⚡ Aumentar Limite
              </button>
            )}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-slate-400">R$</span>
            <span className="text-3xl font-black text-emerald-400 font-mono">{withdrawLimit.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Limite restante. Adquira pacotes de moedas na loja ou faça upgrades para aumentar seu limite.
          </p>
        </div>

        {/* Coins Converter card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Conversor de Moedas
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={coinConvertAmount}
              onChange={(e) => setCoinConvertAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="100"
              className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-center text-white font-mono focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleConvertCoins}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-1.5 rounded-lg transition-colors cursor-pointer text-center"
            >
              Converter
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Taxa: 100 moedas = R$ 1,00. Seu saldo de moedas: <strong className="text-amber-400 font-mono">🪙 {stats.coins}</strong>.
          </p>
        </div>

      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Interactive withdraw section layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* WITHDRAW CONTAINER (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-indigo-400" />
              Solicitar Retirada de Recursos via Pix
            </h3>

            {isProcessing ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <h4 className="text-sm font-bold text-white">Processando Transferência Pix...</h4>
                <p className="text-slate-400 text-xs font-mono max-w-sm animate-pulse">{processingStep}</p>
                <div className="w-48 bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full w-2/3 animate-pulse rounded-full" />
                </div>
              </div>
            ) : withdrawSuccess ? (
              <div className="py-6 text-center space-y-4 animate-scaleIn">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
                <h4 className="text-md font-black text-white">Saque Enviado com Sucesso!</h4>
                <p className="text-slate-300 text-xs max-w-md mx-auto">
                  A quantia de <strong className="text-emerald-400 font-mono">R$ {successAmount.toFixed(2)}</strong> foi transferida instantaneamente para a sua chave Pix bancária vinculada.
                </p>
                
                <div className="bg-slate-950/65 border border-slate-850 p-3 rounded-xl text-[10px] font-mono text-slate-400 text-left space-y-1 max-w-xs mx-auto">
                  <div>• Beneficiário: <strong className="text-slate-200">{userPixName}</strong></div>
                  <div>• Chave Pix: <strong className="text-slate-200">{userPixKey}</strong> ({userKeyType})</div>
                  <div>• Valor Liquidado: <strong className="text-emerald-400">R$ {successAmount.toFixed(2)}</strong></div>
                </div>

                <button
                  onClick={() => {
                    setWithdrawSuccess(false);
                    setUserPixKey('');
                    setUserPixName('');
                    playSound.click();
                  }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Fazer outro saque
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawRequest} className="space-y-4">
                
                {/* Pix key and type */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                      Tipo de Chave
                    </label>
                    <select
                      value={userKeyType}
                      onChange={(e) => { setUserKeyType(e.target.value); playSound.click(); }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    >
                      <option value="CPF">CPF</option>
                      <option value="Celular">Celular</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Chave Aleatória">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                      Digite sua Chave Pix
                    </label>
                    <input
                      type="text"
                      required
                      value={userPixKey}
                      onChange={(e) => setUserPixKey(e.target.value)}
                      placeholder={userKeyType === 'CPF' ? '123.456.789-00' : userKeyType === 'Celular' ? '(11) 99999-9999' : 'exemplo@email.com'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                </div>

                {/* Account owner name */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Nome Completo do Titular (Conta Bancária)
                  </label>
                  <input
                    type="text"
                    required
                    value={userPixName}
                    onChange={(e) => setUserPixName(e.target.value)}
                    placeholder="JOÃO SILVA DO AMARAL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 uppercase"
                  />
                </div>

                {/* Amount to withdraw */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Valor a Sacar (R$)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="50.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500/50"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-slate-500">Mínimo R$ 20,00</span>
                  </div>
                </div>

                {/* Interactive status check */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-[11px] text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Seu Saldo Real:</span>
                    <strong className="text-white">R$ {realBalance.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Seu Limite de Saque:</span>
                    <strong className="text-emerald-400">R$ {withdrawLimit.toFixed(2)}</strong>
                  </div>
                  <div className="border-t border-slate-850/80 pt-1.5 flex justify-between font-bold text-white">
                    <span>Saque Desejado:</span>
                    <span className="text-indigo-400">R$ {parseFloat(withdrawAmount || '0').toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer transition-all flex items-center justify-center gap-1.5 uppercase"
                >
                  <Banknote className="w-4 h-4" />
                  Efetuar Saque Pix Imediato
                </button>

              </form>
            )}
          </div>
        </div>

        {/* RECEIVING ACCOUNT & PARAMETERS CONFIG (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Operator settings panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
                Conta de Recebimento
              </h3>
              <button
                type="button"
                onClick={() => { setIsConfiguring(!isConfiguring); playSound.click(); }}
                className="text-[10px] px-2.5 py-1 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 cursor-pointer transition-all"
              >
                {isConfiguring ? 'Cancelar' : 'Configurar'}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Define os dados da conta bancária corporativa do <strong>operador da plataforma</strong>. Todos os depósitos e compras que os usuários fizerem na Loja Segura serão direcionados para esta conta de destino.
            </p>

            {isConfiguring ? (
              <form onSubmit={handleSaveOpAccount} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Tipo de Chave Pix</label>
                  <select
                    value={opKeyType}
                    onChange={(e) => setOpKeyType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="CNPJ">CNPJ (Pessoa Jurídica)</option>
                    <option value="CPF">CPF (Pessoa Física)</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Celular">Celular</option>
                    <option value="Chave Aleatória">Chave Aleatória</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Chave Pix de Recebimento</label>
                  <input
                    type="text"
                    required
                    value={opPixKey}
                    onChange={(e) => setOpPixKey(e.target.value)}
                    placeholder="12.345.678/0001-99"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Nome do Titular/Beneficiário</label>
                  <input
                    type="text"
                    required
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                    placeholder="ARENA ARCADE LTDA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Banco Receptor</label>
                  <input
                    type="text"
                    required
                    value={opBank}
                    onChange={(e) => setOpBank(e.target.value)}
                    placeholder="Banco Inter S.A."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Salvar Configurações de Recebimento
                </button>
              </form>
            ) : (
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                  <div className="p-1 bg-amber-500/10 rounded border border-amber-500/20 text-xs">🏦</div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Canal Oficial Ativo</h4>
                    <p className="text-[9px] text-slate-500">Liquidando em tempo real</p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Chave Pix ({opKeyType}):</span>
                    <strong className="text-slate-200 select-all">{opPixKey}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Beneficiário:</span>
                    <strong className="text-slate-200 uppercase">{opName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Instituição Bancária:</span>
                    <strong className="text-slate-200">{opBank}</strong>
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/10 rounded-lg p-2 text-[10px] text-amber-200 leading-relaxed flex gap-1 items-start">
                  <span className="text-[12px] mt-0.5">💡</span>
                  <span>Os QR Codes gerados nas compras da Loja apontarão para esta chave Pix, simulando recebimento real!</span>
                </div>
              </div>
            )}
          </div>

          {/* Guidebox */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              Regulamento de Liquidez
            </h4>
            <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed list-disc list-inside">
              <li><strong>Conversão:</strong> Seus créditos virtuais (moedas) podem ser convertidos para saldo de saque a qualquer momento (100 moedas = R$ 1,00).</li>
              <li><strong>Limite de Saque:</strong> Para garantir a integridade de liquidez da plataforma, cada compra de pacotes na Loja Segura concede limite adicional correspondente.</li>
              <li><strong>Auditoria Pix:</strong> Todas as transferências Pix são processadas por meio de criptografia AES-256 e registradas no Extrato Seguro.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
