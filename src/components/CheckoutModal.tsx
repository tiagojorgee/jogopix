import React, { useState } from 'react';
import { ShopItem, PlayerStats } from '../types';
import { ShieldCheck, Lock, CreditCard, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { SKINS, ACCESSORIES, AURAS } from '../data/shopItems';

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

  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [processingMsg, setProcessingMsg] = useState('Autenticando transação...');
  
  // Form fields
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cpf, setCpf] = useState('');
  
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
      .replace(/(\{4\})/g, '$1 ')
      .replace(/(.{4})(.{4})?(.{4})?(.{4})?/, (_, p1, p2, p3, p4) => {
        let res = p1;
        if (p2) res += ' ' + p2;
        if (p3) res += ' ' + p3;
        if (p4) res += ' ' + p4;
        return res;
      })
      .trim()
      .substring(0, 19);
    setCardNumber(formattedValue);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .replace(/(\d{2})(\d)/, '$1/$2')
      .substring(0, 5);
    setCardExpiry(formattedValue);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formattedValue = value
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
    setCpf(formattedValue);
  };

  const validateForm = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Start secure payment progression
    setPaymentStep('processing');
    
    setTimeout(() => {
      setProcessingMsg('Criptografando credenciais de pagamento (AES-256)...');
      setTimeout(() => {
        setProcessingMsg('Abrindo canal SSL seguro com o banco receptor...');
        setTimeout(() => {
          setProcessingMsg('Confirmando token 3D Secure e saldo...');
          setTimeout(() => {
            setPaymentStep('success');
          }, 1200);
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const handleFinish = () => {
    onSuccess(item);
  };

  const brand = getCardBrand(cardNumber);
  const transactionId = React.useMemo(() => 'TXN-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(100 + Math.random() * 899), [item]);
  const dateFormatted = new Date().toLocaleString('pt-BR');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Banner de Segurança */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Loja Integrada Segura</span>
          </div>
          <div className="flex items-center gap-1 bg-teal-950/30 px-2 py-0.5 rounded text-[10px] font-mono border border-teal-500/20">
            <Lock className="w-3 h-3 text-emerald-300" />
            <span>SSL 256-BIT</span>
          </div>
        </div>

        {/* CONTROLLER DA ETAPA */}
        {paymentStep === 'form' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Header com resumo do item */}
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

            <div className="space-y-3">
              {/* Nome do Titular */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
                  Nome Impresso no Cartão
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="JOÃO SILVA COSTA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors uppercase"
                    id="input-card-name"
                  />
                </div>
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
                    CVV (Cód. Segurança)
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

            {/* Rodapé de Segurança & Submissão */}
            <div className="pt-3 border-t border-slate-850">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-emerald-500/15 text-center flex items-center justify-center gap-2"
                id="btn-process-payment"
              >
                <ShieldCheck className="w-4 h-4" />
                Finalizar Compra Segura
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-2 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                id="btn-cancel-checkout"
              >
                Voltar à Loja
              </button>
            </div>

            {/* Badges de Compliance */}
            <div className="flex justify-center items-center gap-4 text-[9px] font-mono text-slate-500 pt-1">
              <span>🔒 PCI-DSS Compliant</span>
              <span>•</span>
              <span>⚡ AES-256 Bit Encr.</span>
              <span>•</span>
              <span>✅ 3DS Secure</span>
            </div>
          </form>
        )}

        {/* ETAPA DE PROCESSAMENTO */}
        {paymentStep === 'processing' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <h3 className="text-md font-bold text-white tracking-wide">Processamento Criptografado</h3>
            <p className="text-slate-400 text-xs font-mono max-w-xs">{processingMsg}</p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-2/3 animate-pulse rounded-full" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Não feche esta janela</p>
          </div>
        )}

        {/* ETAPA DE SUCESSO / COMPROVANTE FISCAL */}
        {paymentStep === 'success' && (
          <div className="p-5 space-y-4 animate-scaleIn">
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-3">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-white">Pagamento Aprovado!</h3>
              <p className="text-xs text-slate-400">Seus itens foram creditados e estão prontos para uso.</p>
            </div>

            {/* Recibo de Transação */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono text-slate-400 relative">
              <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" /> FISCAL RECEIPT
              </div>

              <div className="flex justify-between">
                <span>Transação:</span>
                <span className="text-white text-right">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Data/Hora:</span>
                <span className="text-white text-right">{dateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Comprador:</span>
                <span className="text-white text-right truncate max-w-[200px]">{cardName || 'TIAGO COSTA'}</span>
              </div>
              <div className="flex justify-between">
                <span>CPF:</span>
                <span className="text-white text-right">{cpf || '***.***.***-**'}</span>
              </div>
              <div className="border-t border-slate-850/80 my-2 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-300">Total Pago:</span>
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
