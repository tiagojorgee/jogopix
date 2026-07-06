import React, { useState, useEffect } from 'react';
import { ShopItem, PlayerStats } from '../types';
import { ShieldCheck, Lock, CreditCard, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2, QrCode, Copy, Check, Clock } from 'lucide-react';
import { playSound } from '../utils/audio';

interface CheckoutModalProps {
  item: ShopItem | null;
  onClose: () => void;
  onSuccess: (item: ShopItem) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  onClose,
  onSuccess
}) => {
  if (!item) return null;

  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'pix_display' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [processingMsg, setProcessingMsg] = useState('Autenticando transação...');
  
  // Form fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  
  // Pix states
  const [pixTimeLeft, setPixTimeLeft] = useState<number>(300); // 5 minutes
  const [pixStatus, setPixStatus] = useState<string>('Aguardando pagamento do cliente...');
  const [pixCopied, setPixCopied] = useState<boolean>(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Detect card brand
  const getCardBrand = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(cleanNum)) return 'Mastercard';
    if (/^3[47]/.test(cleanNum)) return 'American Express';
    if (/^(6011|65|64[4-9])/.test(cleanNum)) return 'Discover';
    return 'Desconhecido';
  };

  // Mask inputs
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .substring(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 5);
    setCardExpiry(formattedValue);
  };

  const maskCPF = (val: string) => {
    const value = val.replace(/\D/g, '');
    return value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCPF(e.target.value));
  };

  const handleCustomerCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerCpf(maskCPF(e.target.value));
  };

  const validateCardForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!cardName.trim()) tempErrors.cardName = 'Nome completo é obrigatório.';
    if (cardNumber.replace(/\D/g, '').length < 16) tempErrors.cardNumber = 'Número de cartão inválido (mínimo 16 dígitos).';
    
    const expiryClean = cardExpiry.replace(/\D/g, '');
    if (expiryClean.length < 4) {
      tempErrors.cardExpiry = 'Data de validade incompleta.';
    } else {
      const month = parseInt(expiryClean.substring(0, 2));
      const year = parseInt(expiryClean.substring(2, 4)) + 2000;
      if (month < 1 || month > 12) {
        tempErrors.cardExpiry = 'Mês inválido.';
      } else {
        const currentDate = new Date();
        const expiryDate = new Date(year, month - 1, 28);
        if (expiryDate < currentDate) {
          tempErrors.cardExpiry = 'Cartão expirado.';
        }
      }
    }

    if (cardCvv.replace(/\D/g, '').length < 3) tempErrors.cardCvv = 'CVV inválido (mínimo 3 dígitos).';
    if (cpf.replace(/\D/g, '').length < 11) tempErrors.cpf = 'CPF incompleto ou inválido.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const validatePixForm = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!customerName.trim()) tempErrors.customerName = 'Nome completo do pagador é obrigatório.';
    if (customerCpf.replace(/\D/g, '').length < 11) tempErrors.customerCpf = 'CPF do pagador incompleto ou inválido.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'pix') {
      if (!validatePixForm()) return;
      playSound.click();
      setPaymentStep('pix_display');
      setPixTimeLeft(300); // 5 minutes countdown
      setPixStatus('Aguardando pagamento do cliente (Simulando em 10s)...');
    } else {
      if (!validateCardForm()) return;
      playSound.click();
      setPaymentStep('processing');
      
      setTimeout(() => {
        setProcessingMsg('Criptografando credenciais de pagamento (AES-256)...');
        setTimeout(() => {
          setProcessingMsg('Abrindo canal SSL seguro com o banco receptor...');
          setTimeout(() => {
            setProcessingMsg('Confirmando token 3D Secure e saldo...');
            setTimeout(() => {
              setPaymentStep('success');
              playSound.victory();
            }, 1200);
          }, 1200);
        }, 1000);
      }, 1000);
    }
  };

  // Pix countdown timer ticking
  useEffect(() => {
    if (paymentStep !== 'pix_display' || pixTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setPixTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStep, pixTimeLeft]);

  // Pix payment automatic simulation steps (for realistic flow)
  useEffect(() => {
    if (paymentStep !== 'pix_display') return;

    const t1 = setTimeout(() => {
      setPixStatus('Código lido! Banco central processando pagamento...');
      playSound.tick();
    }, 4000);

    const t2 = setTimeout(() => {
      setPixStatus('Sucesso! Transferência confirmada pelo Banco Central...');
      playSound.tick();
    }, 8000);

    const t3 = setTimeout(() => {
      setPaymentStep('success');
      playSound.purchase();
    }, 10500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [paymentStep]);

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode).then(() => {
      setPixCopied(true);
      playSound.collect();
      setTimeout(() => setPixCopied(false), 2000);
    }).catch(() => {
      setPixCopied(true);
      playSound.collect();
      setTimeout(() => setPixCopied(false), 2000);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    onSuccess(item);
  };

  const handleInstantApprove = () => {
    playSound.purchase();
    setPaymentStep('success');
  };

  const brand = getCardBrand(cardNumber);
  const transactionId = React.useMemo(() => 'TXN-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(100 + Math.random() * 899), [item]);
  const dateFormatted = new Date().toLocaleString('pt-BR');

  // Realistic EMV copy paste BRCode string
  const pixCode = React.useMemo(() => {
    return `00020101021226870014br.gov.bcb.pix2565key-${item.id}-${Math.floor(100000 + Math.random() * 900000)}5204000053039865405${item.price.toFixed(2)}5802BR5915ARENA_ARCADE_SA6009SAO_PAULO62290525TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [item]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Security / Pix Status Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-sans">
              {paymentStep === 'pix_display' ? 'Pix Pendente Seguro' : 'Checkout Criptografado'}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-teal-950/30 px-2 py-0.5 rounded text-[10px] font-mono border border-teal-500/20">
            <Lock className="w-3 h-3 text-emerald-300" />
            <span>SSL 256-BIT</span>
          </div>
        </div>

        {/* STEP 1: FORM SELECTION & INPUT FIELDS */}
        {paymentStep === 'form' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Selected item summary */}
            <div className="bg-slate-950/65 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 font-mono">Produto selecionado:</div>
                <h3 className="text-sm font-extrabold text-white">{item.name}</h3>
                <p className="text-xs text-slate-400">{item.visualValue}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Total a Pagar</span>
                <span className="text-lg font-black text-emerald-400 font-mono">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Operator Receiving Account Display */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1 text-left text-xs font-sans">
              <span className="block text-[9px] text-amber-400 font-mono font-bold uppercase tracking-wider">🏦 Destinatário / Conta de Recebimento</span>
              <div className="text-[11px] text-slate-300 space-y-0.5 leading-tight font-mono">
                <div>• Chave Pix: <strong className="text-slate-100 select-all">{localStorage.getItem('gamezone_op_pix_key') || 'tiagojorgeengenheiro@gmail.com'}</strong></div>
                <div>• Favorecido: <strong className="text-slate-100 uppercase">{localStorage.getItem('gamezone_op_name') || 'Tiago Jorge Engenheiro'}</strong></div>
                <div>• Banco: <strong className="text-slate-100">{localStorage.getItem('gamezone_op_bank') || 'Banco Inter S.A.'}</strong></div>
              </div>
            </div>

            {/* Payment Method Toggle Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Selecione o Método de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('pix'); playSound.click(); }}
                  className={`py-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  PIX Instantâneo
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod('credit_card'); playSound.click(); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === 'credit_card'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Cartão de Crédito
                </button>
              </div>
            </div>

            {/* IF PIX METHOD */}
            {paymentMethod === 'pix' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Nome do Titular / Pagador
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="JOÃO SILVA COSTA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors uppercase"
                    id="input-customer-name"
                  />
                  {errors.customerName && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.customerName}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    CPF do Pagador (Recebimento &amp; NF)
                  </label>
                  <input
                    type="text"
                    required
                    value={customerCpf}
                    onChange={handleCustomerCpfChange}
                    placeholder="123.456.789-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                    id="input-customer-cpf"
                  />
                  {errors.customerCpf && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.customerCpf}</p>}
                </div>
                
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <span className="text-emerald-400 text-sm mt-0.5">⚡</span>
                  <p>O pagamento via PIX é compensado em menos de 10 segundos. O sistema atualizará seu saldo de moedas ou vidas automaticamente assim que a liquidação for registrada.</p>
                </div>
              </div>
            )}

            {/* IF CREDIT CARD METHOD */}
            {paymentMethod === 'credit_card' && (
              <div className="space-y-3 pt-1">
                {/* Nome do Titular */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOÃO SILVA COSTA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors uppercase"
                    id="input-card-name"
                  />
                  {errors.cardName && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardName}</p>}
                </div>

                {/* Número do Cartão */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    Número do Cartão
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4000 1234 5678 9010"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                      id="input-card-number"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    {cardNumber.length > 0 && (
                      <span className="absolute right-3 top-2.5 text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono border border-slate-700">
                        {brand}
                      </span>
                    )}
                  </div>
                  {errors.cardNumber && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardNumber}</p>}
                </div>

                {/* Vencimento e CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="12/28"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-center font-mono"
                      id="input-card-expiry"
                    />
                    {errors.cardExpiry && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardExpiry}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                      CVV (Código)
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors text-center font-mono"
                      id="input-card-cvv"
                    />
                    {errors.cardCvv && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cardCvv}</p>}
                  </div>
                </div>

                {/* CPF do Titular */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                    CPF do Comprador (Para Nota Fiscal)
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="123.456.789-00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    id="input-card-cpf"
                  />
                  {errors.cpf && <p className="text-red-400 text-[10px] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.cpf}</p>}
                </div>
              </div>
            )}

            {/* Rodapé de Envio */}
            <div className="pt-3 border-t border-slate-850">
              <button
                type="submit"
                className={`w-full py-2.5 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-lg text-center flex items-center justify-center gap-2 ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/15'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/15'
                }`}
                id="btn-process-payment"
              >
                <ShieldCheck className="w-4 h-4" />
                {paymentMethod === 'pix' ? 'Gerar QR Code PIX Seguro' : 'Finalizar Compra Segura'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                id="btn-cancel-checkout"
              >
                Cancelar e Voltar
              </button>
            </div>

            {/* Badges de Compliance */}
            <div className="flex justify-center items-center gap-4 text-[9px] font-mono text-slate-500 pt-1">
              <span>🔒 PCI-DSS Compliant</span>
              <span>•</span>
              <span>⚡ AES-256 Bit Encr.</span>
              <span>•</span>
              <span>✅ Banco Central (Pix)</span>
            </div>
          </form>
        )}

        {/* STEP 2: PIX ACTIVE WAITING BOARD */}
        {paymentStep === 'pix_display' && (
          <div className="p-5 space-y-4 animate-scaleIn text-center">
            
            {/* Title / Summary */}
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wide">Pague o QR Code abaixo</h3>
              <p className="text-xs text-slate-400">Escaneie com o app do seu banco ou use Copiar/Colar</p>
            </div>

            {/* Timer countdown bar */}
            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-850 inline-flex items-center gap-2 text-xs font-mono text-amber-400">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>O Pix expira em: <strong>{formatTime(pixTimeLeft)}</strong></span>
            </div>

            {/* Physical high-craftsmanship SVG QR Code */}
            <div className="relative py-2 select-none">
              <svg viewBox="0 0 100 100" className="w-40 h-40 mx-auto bg-white p-2.5 rounded-2xl border-4 border-emerald-500/40 shadow-xl shadow-emerald-500/5">
                {/* Simulated grid of blocks */}
                <path d="M 10 10 h 20 v 20 h -20 z M 15 15 h 10 v 10 h -10 z M 70 10 h 20 v 20 h -20 z M 75 15 h 10 v 10 h -10 z M 10 70 h 20 v 20 h -20 z M 15 75 h 10 v 10 h -10 z M 40 10 h 10 v 10 h -10 z M 55 10 h 10 v 5 h -10 z M 45 25 h 10 v 10 h -10 z M 40 40 h 10 v 10 h -10 z M 55 40 h 10 v 5 h -10 z M 70 40 h 20 v 10 h -20 z M 10 40 h 20 v 10 h -20 z M 40 55 h 15 v 10 h -15 z M 60 55 h 15 v 10 h -15 z M 25 55 h 10 v 10 h -10 z M 40 70 h 10 v 20 h -10 z M 55 70 h 20 v 10 h -20 z M 80 70 h 10 v 10 h -10 z M 70 85 h 20 v 5 h -20 z M 55 85 h 10 v 5 h -10 z" fill="#064e3b" />
                {/* Beautiful central Pix badge with diamond logo */}
                <rect x="41" y="41" width="18" height="18" rx="4" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.5" />
                <path d="M 46 50 L 50 46 L 54 50 L 50 54 Z" fill="white" />
              </svg>
            </div>

            {/* Total value info */}
            <div className="bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl flex items-center justify-between text-xs max-w-xs mx-auto">
              <span className="text-slate-400">Valor a ser enviado:</span>
              <strong className="text-emerald-400 font-mono text-sm">R$ {item.price.toFixed(2)}</strong>
            </div>

            {/* Copy / Paste Box */}
            <div className="space-y-1.5 max-w-xs mx-auto">
              <span className="block text-[10px] text-slate-500 font-mono text-left uppercase">Chave Pix Copia e Cola</span>
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  readOnly 
                  value={pixCode}
                  className="flex-1 bg-slate-950 text-slate-400 border border-slate-850 rounded-xl px-3 py-2 text-[10px] font-mono outline-none select-all truncate"
                />
                <button
                  onClick={handleCopyPixCode}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 cursor-pointer transition-colors flex items-center justify-center"
                  title="Copiar Código"
                >
                  {pixCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Real-time Simulated Receiver status */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1 text-center font-mono max-w-xs mx-auto pt-3">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detector Ativo</span>
              </div>
              <p className="text-[10px] text-emerald-400 animate-pulse">{pixStatus}</p>
            </div>

            {/* Quick action buttons row */}
            <div className="pt-2 border-t border-slate-850 space-y-1.5">
              <button
                onClick={handleInstantApprove}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
              >
                ⚡ Simular Confirmação Imediata (Fast-Forward)
              </button>
              
              <button
                onClick={() => {
                  setPaymentStep('form');
                  playSound.click();
                }}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Alterar Forma de Pagamento
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CREDIT CARD ENCRYPTED PROCESSING LOADER */}
        {paymentStep === 'processing' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <h3 className="text-md font-bold text-white tracking-wide">Processamento Criptografado</h3>
            <p className="text-slate-400 text-xs font-mono max-w-xs">{processingMsg}</p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full w-2/3 animate-pulse rounded-full" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Não feche esta janela</p>
          </div>
        )}

        {/* STEP 4: PAYMENT COMPLETED FISCAL RECORD */}
        {paymentStep === 'success' && (
          <div className="p-5 space-y-4 animate-scaleIn">
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-white">Pagamento Aprovado!</h3>
              <p className="text-xs text-slate-400">Seus itens foram creditados e estão prontos para uso.</p>
            </div>

            {/* Real Fiscal Receipt */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono text-slate-400 relative">
              <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" /> FISCAL RECEIPT
              </div>

              <div className="flex justify-between">
                <span>Transação ID:</span>
                <span className="text-white text-right">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Canal Receptor:</span>
                <span className="text-emerald-400 font-bold text-right uppercase">
                  {paymentMethod === 'pix' ? '⚡ PIX BANCO CENTRAL' : '💳 GATEWAY ADQUIRENTE'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Data/Hora:</span>
                <span className="text-white text-right">{dateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Pagador:</span>
                <span className="text-white text-right truncate max-w-[200px]">{customerName || cardName || 'TIAGO COSTA'}</span>
              </div>
              <div className="flex justify-between">
                <span>CPF:</span>
                <span className="text-white text-right">{customerCpf || cpf || '***.***.***-**'}</span>
              </div>
              <div className="border-t border-slate-850/80 my-2 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-300">Total Liquidado:</span>
                <span className="text-emerald-400">R$ {item.price.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-lg text-center"
              id="btn-finish-payment"
            >
              Resgatar Itens &amp; Continuar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
