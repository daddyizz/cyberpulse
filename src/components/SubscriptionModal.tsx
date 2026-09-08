import React, { useState } from 'react';
import { X, Check, Zap, ShieldCheck, CreditCard, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { SonaTheme } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  theme?: SonaTheme;
  isProUser: boolean;
  onClose: () => void;
  onSubscriptionSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  theme = 'stealth_athletic',
  isProUser,
  onClose,
  onSubscriptionSuccess,
}) => {
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

  const isLight = theme === 'pure_light';

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
        onSubscriptionSuccess();
        onClose();
      }, 1400);
    }, 1200);
  };

  const handleCancelSubscription = () => {
    localStorage.setItem('sona_subscription_tier', 'FREE');
    onSubscriptionSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#101014] border-[#242428] text-white'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-5 flex items-center justify-between border-b ${
            isLight ? 'border-slate-100 bg-slate-50' : 'border-[#242428] bg-[#141418]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black font-black'
              }`}
            >
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">Sona Pro Subscription</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                Next-generation streaming without limitations.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLight
                ? 'hover:bg-slate-200 text-slate-600'
                : 'hover:bg-[#242428] text-[#8E8E93] hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {successNotice ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-xl font-black uppercase">Welcome to Sona Pro!</h3>
              <p className={`text-xs max-w-xs mx-auto ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                Your subscription has been activated successfully. Enjoy ultra-fast streaming and unlimited imports!
              </p>
            </div>
          ) : isProUser ? (
            <div className="py-6 space-y-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4" /> Active Pro Member
              </div>
              <h3 className="text-lg font-black uppercase">You Are On Sona Pro</h3>
              <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-[#8E8E93]'}`}>
                Your membership is active and renews automatically. You have full access to high-speed stream switching, custom themes, and unlimited Spotify imports.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleCancelSubscription}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isLight
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                      : 'bg-rose-950/40 text-rose-400 border border-rose-900/60 hover:bg-rose-900/40'
                  }`}
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
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
                        : 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]'
                      : isLight
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-[#242428] bg-[#141418] hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase">Monthly</span>
                    {selectedPlan === 'monthly' && (
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-black">$4.99</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                    Billed each month
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan('annual')}
                  className={`p-4 rounded-2xl border cursor-pointer relative transition-all ${
                    selectedPlan === 'annual'
                      ? isLight
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
                        : 'border-[#CCFF00] bg-[#CCFF00]/10 ring-1 ring-[#CCFF00]'
                      : isLight
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-[#242428] bg-[#141418] hover:border-white/20'
                  }`}
                >
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-black shadow-sm">
                    Save 33%
                  </div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold uppercase">Annual Plan</span>
                    {selectedPlan === 'annual' && (
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isLight ? 'bg-slate-900 text-white' : 'bg-[#CCFF00] text-black'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-black">$39.99</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                    $3.33/mo • Billed yearly
                  </div>
                </div>
              </div>

              {/* Perks List */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#141418] border-[#242428]'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pro Benefits Included:</span>
                </div>
                {proPerks.map((p) => (
                  <div key={p.title} className="flex items-start gap-2.5 text-xs">
                    <Check
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isLight ? 'text-emerald-600 stroke-[3]' : 'text-[#CCFF00] stroke-[3]'
                      }`}
                    />
                    <div>
                      <div className="font-bold">{p.title}</div>
                      <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#8E8E93]'}`}>
                        {p.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2">
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
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? isLight
                              ? 'border-slate-900 bg-slate-100 text-slate-900 font-black'
                              : 'border-[var(--sona-accent,#CCFF00)] bg-[#242428] text-white font-black'
                            : isLight
                            ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                      <label className="block text-[11px] font-bold uppercase mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        placeholder="Alex Morgan"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs border transition-colors outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-900'
                            : 'bg-[#18181D] border-[#2A2A30] text-white focus:border-[var(--sona-accent,#CCFF00)]'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8921"
                        value={cardNumber}
                        onChange={handleFormatCardNumber}
                        maxLength={19}
                        className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-colors outline-none ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-900'
                            : 'bg-[#18181D] border-[#2A2A30] text-white focus:border-[var(--sona-accent,#CCFF00)]'
                        }`}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase mb-1">
                          Expiry (MM/YY)
                        </label>
                        <input
                          type="text"
                          placeholder="08/28"
                          value={cardExpiry}
                          onChange={handleFormatExpiry}
                          maxLength={5}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-colors outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-900'
                            : 'bg-[#18181D] border-[#2A2A30] text-white focus:border-[var(--sona-accent,#CCFF00)]'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase mb-1">
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-colors outline-none ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-900'
                            : 'bg-[#18181D] border-[#2A2A30] text-white focus:border-[var(--sona-accent,#CCFF00)]'
                          }`}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {paymentMethod === 'gpay' && (
                  <div
                    className={`p-4 rounded-xl border text-center text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181D] border-[#2A2A30]'
                    }`}
                  >
                    Google Pay will authenticate with your saved Google Play payment method on tap.
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div
                    className={`p-4 rounded-xl border text-center text-xs ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#18181D] border-[#2A2A30]'
                    }`}
                  >
                    You will be redirected securely to PayPal to confirm your billing authorization.
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isProcessing ? 'opacity-75 cursor-wait' : 'hover:brightness-110 active:scale-98'
                  } ${
                    isLight
                      ? 'bg-slate-900 text-white shadow-slate-900/20'
                      : 'bg-[#CCFF00] text-black shadow-[#CCFF00]/20'
                  }`}
                >
                  {isProcessing ? (
                    <span>Securing Transaction...</span>
                  ) : (
                    <>
                      <span>
                        Subscribe for {selectedPlan === 'annual' ? '$39.99 / year' : '$4.99 / month'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
