import React, { useState } from 'react';
import { X, Check, Zap, ShieldCheck, CreditCard, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { SonaTheme } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  theme?: SonaTheme;
  isProUser: boolean;
  onClose: () => void;
  onSubscriptionSuccess?: () => void;
  onUpgradeSuccess?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  theme = 'stealth_athletic',
  isProUser,
  onClose,
  onSubscriptionSuccess,
  onUpgradeSuccess,
}) => {
  const isLight = theme === 'pure_light';
  const triggerSuccess = () => {
    if (onSubscriptionSuccess) onSubscriptionSuccess();
    if (onUpgradeSuccess) onUpgradeSuccess();
  };
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gpay' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const proPerks = [
    {
      title: 'Ultra-Fast 360p/480p Stream Switching',
      desc: 'Instant zero-buffering song skipping tuned for all network conditions.',
    },
    {
      title: 'Unlimited Spotify Playlist Imports',
      desc: 'Import and stream any Spotify playlist directly into your Sona library.',
    },
    {
      title: '100% Ad-Free Continuous Playback',
      desc: 'Zero sponsored audio clips, banner ads, or interruptions forever.',
    },
    {
      title: 'Audiophile Studio DSP & Bass Boost',
      desc: 'Unlock 32-bit DSP audio expansion and custom graphic equalizers.',
    },
    {
      title: 'Exclusive Themes & Custom Accent Studio',
      desc: 'Access all current and upcoming themes with custom neon colors.',
    },
  ];

  const handleFormatCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = val.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : val);
  };

  const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      setCardExpiry(`${val.substring(0, 2)}/${val.substring(2, 4)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setErrorMsg('Please enter a valid 16-digit credit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setErrorMsg('Please enter a valid card expiration date (MM/YY).');
        return;
      }
      if (cardCvc.length < 3) {
        setErrorMsg('Please enter a valid 3 or 4 digit security code (CVC).');
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setSuccessNotice(true);
      localStorage.setItem('sona_subscription_tier', 'PRO');

      setTimeout(() => {
        triggerSuccess();
        onClose();
      }, 1400);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    localStorage.setItem('sona_subscription_tier', 'FREE');
    triggerSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-10 sm:pt-6 pb-6 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`sona-subscription-container w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0C0C0E] border-[#26262B] text-white'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 flex items-center justify-between border-b transition-colors ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-[#242428] bg-[#141418]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-md ${
              isLight ? 'bg-slate-900 text-white shadow-slate-900/15' : 'bg-[#CCFF00] text-black shadow-[#CCFF00]/20'
            }`}>
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className={`text-base font-black uppercase tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>Sona Pro Membership</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                Next-generation streaming without limitations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:bg-slate-200 hover:text-slate-900' : 'text-[#8E8E93] hover:bg-[#242428] hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className={`p-5 overflow-y-auto space-y-5 flex-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {successNotice ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className={`text-xl font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Welcome to Sona Pro!</h3>
              <p className={`text-xs max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                Your subscription has been activated successfully. Enjoy ultra-fast streaming and unlimited imports!
              </p>
            </div>
          ) : isProUser ? (
            <div className="py-6 space-y-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4" /> Active Pro Member
              </div>
              <h3 className={`text-lg font-black uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>You Are On Sona Pro</h3>
              <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                Your membership is active and renews automatically. You have full access to high-speed stream switching, custom themes, and unlimited Spotify imports.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleCancelSubscription}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold transition-colors bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                >
                  Cancel Pro Membership (Revert to Free)
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Choice Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedPlan('monthly')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPlan === 'monthly'
                      ? isLight
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-sm'
                        : 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]'
                      : isLight
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-[#242428] bg-[#141418] hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Monthly</span>
                    {selectedPlan === 'monthly' && (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>$4.99</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                    Billed each month
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan('annual')}
                  className={`p-4 rounded-2xl border cursor-pointer relative transition-all ${
                    selectedPlan === 'annual'
                      ? isLight
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-sm'
                        : 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]'
                      : isLight
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-[#242428] bg-[#141418] hover:border-white/20'
                  }`}
                >
                  <div className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm ${
                    isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'
                  }`}>
                    Save 33%
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>Annual Plan</span>
                    {selectedPlan === 'annual' && (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'}`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className={`text-xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>$39.99</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                    $3.33/mo • Billed yearly
                  </div>
                </div>
              </div>

              {/* Perks List */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-[#242428] bg-[#141418]'
              }`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-slate-900' : 'text-[#CCFF00]'}`} />
                  <span>Pro Benefits Included:</span>
                </div>
                {proPerks.map((p) => (
                  <div key={p.title} className="flex items-start gap-2.5 text-xs">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 stroke-[3] ${isLight ? 'text-slate-900' : 'text-[#CCFF00]'}`} />
                    <div>
                      <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.title}</div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card', icon: CreditCard },
                    { id: 'gpay', label: 'Google Pay', icon: Zap },
                    { id: 'paypal', label: 'PayPal', icon: ShieldCheck },
                  ].map((method) => {
                    const Icon = method.icon;
                    const isActive = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          isActive
                            ? isLight
                              ? 'border-slate-900 bg-slate-900 text-white font-black shadow-sm'
                              : 'border-[#CCFF00] bg-[#242428] text-white font-black ring-1 ring-[#CCFF00]'
                            : isLight
                            ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            : 'border-[#242428] bg-[#141418] text-[#8E8E93] hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Form Details */}
              <form onSubmit={handleCheckout} className="space-y-3">
                {paymentMethod === 'card' && (
                  <>
                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
                        Name on Card
                      </label>
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                          isLight
                            ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white placeholder:text-slate-400'
                            : 'border-[#2A2A30] bg-[#18181D] text-white focus:border-[#CCFF00]'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8921"
                        value={cardNumber}
                        onChange={handleFormatCardNumber}
                        maxLength={19}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none font-mono tracking-wider transition-colors ${
                          isLight
                            ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white placeholder:text-slate-400'
                            : 'border-[#2A2A30] bg-[#18181D] text-white focus:border-[#CCFF00]'
                        }`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
                          Expiration
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleFormatExpiry}
                          maxLength={5}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none font-mono text-center transition-colors ${
                            isLight
                              ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white placeholder:text-slate-400'
                              : 'border-[#2A2A30] bg-[#18181D] text-white focus:border-[#CCFF00]'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className={`block text-[11px] font-bold uppercase mb-1 ${isLight ? 'text-slate-700' : 'text-[#8E8E93]'}`}>
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvc}
                          onChange={(e) =>
                            setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))
                          }
                          maxLength={4}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none font-mono text-center transition-colors ${
                            isLight
                              ? 'border-slate-300 bg-slate-50 text-slate-900 focus:border-slate-900 focus:bg-white placeholder:text-slate-400'
                              : 'border-[#2A2A30] bg-[#18181D] text-white focus:border-[#CCFF00]'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === 'gpay' && (
                  <div className={`p-4 rounded-xl border text-center space-y-2 ${
                    isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-[#2A2A30] bg-[#18181D] text-[#8E8E93]'
                  }`}>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                      Fast 1-touch checkout with your linked Google Account.
                    </p>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isLight ? 'bg-slate-200 text-slate-900' : 'bg-white/10 text-white'
                    }`}>
                      <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-slate-900' : 'text-[#CCFF00]'}`} /> Instant Verification
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className={`p-4 rounded-xl border text-center space-y-2 ${
                    isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-[#2A2A30] bg-[#18181D] text-[#8E8E93]'
                  }`}>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                      You will be redirected securely to PayPal to confirm your billing authorization.
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 border border-blue-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Buyer Protection Included
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.98] disabled:opacity-50 ${
                      isLight
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                        : 'bg-[#CCFF00] text-black shadow-[#CCFF00]/25 hover:brightness-110'
                    }`}
                  >
                    {isProcessing ? (
                      <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                        isLight ? 'border-white' : 'border-black'
                      }`} />
                    ) : (
                      <>
                        <span>
                          Activate {selectedPlan === 'annual' ? 'Annual ($39.99)' : 'Monthly ($4.99)'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className={`text-[10px] text-center mt-2 ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                    Cancel anytime in settings. 14-day full refund guarantee.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
