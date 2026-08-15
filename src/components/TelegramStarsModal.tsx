import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Check, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { User } from '../types';
import { triggerHaptic, fireConfetti } from '../utils/telegram';

interface TelegramStarsModalProps {
  currentUser: User;
  onClose: () => void;
  onAddStars: (amount: number) => void;
}

export const TelegramStarsModal: React.FC<TelegramStarsModalProps> = ({
  currentUser,
  onClose,
  onAddStars,
}) => {
  const [selectedPack, setSelectedPack] = useState<number>(250);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const packs = [
    { stars: 100, price: '$1.99', popular: false },
    { stars: 250, price: '$4.99', popular: true },
    { stars: 500, price: '$8.99', popular: false },
    { stars: 1000, price: '$16.99', popular: false },
    { stars: 2500, price: '$39.99', popular: false },
  ];

  const handleTopUp = () => {
    setIsProcessing(true);
    triggerHaptic('heavy');

    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      fireConfetti();
      onAddStars(selectedPack);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-yellow-400" />
            </div>
            <h2 className="text-base font-bold text-white font-['Outfit']">Telegram Stars Wallet</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Balance Banner */}
          <div className="bg-gradient-to-tr from-amber-500/20 via-yellow-500/15 to-transparent border border-yellow-500/30 rounded-2xl p-4 text-center space-y-1">
            <span className="text-xs font-semibold text-slate-300">Your Current Balance</span>
            <div className="flex items-center justify-center gap-2 text-3xl font-extrabold text-amber-300 font-['Outfit']">
              <Sparkles className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <span>{currentUser.starsCount.toLocaleString()}</span>
              <span className="text-sm font-bold text-yellow-400/80">Stars</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Use Stars to tip creators, unlock VIP content, and buy on Marketplace.
            </p>
          </div>

          {/* Star Top-up Packs */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2.5">
              Choose Top-Up Package
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {packs.map((pack) => {
                const isSelected = selectedPack === pack.stars;

                return (
                  <button
                    key={pack.stars}
                    onClick={() => {
                      triggerHaptic('selection');
                      setSelectedPack(pack.stars);
                    }}
                    className={`relative p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/10 ring-1 ring-yellow-400'
                        : 'border-slate-700 bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 text-[9px] font-extrabold rounded-full">
                        POPULAR
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-base font-bold text-amber-300">
                      <Sparkles className="w-4 h-4 fill-yellow-400" />
                      <span>+{pack.stars}</span>
                    </div>
                    <span className="text-xs font-semibold text-white mt-1">
                      {pack.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-around py-2 text-[11px] text-slate-400 border-t border-slate-800">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant Delivery
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-sky-400" /> Apple / Google Pay / TON
            </span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={handleTopUp}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-lg shadow-yellow-500/20 transition flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : success ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Stars Added Successfully!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Top-Up {selectedPack} Stars Now</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
