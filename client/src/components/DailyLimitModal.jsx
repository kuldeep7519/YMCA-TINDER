import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Clock, MessageCircle, Sparkles, X, Heart, ShieldCheck, Flame, Compass } from "lucide-react";

const DailyLimitModal = ({ isOpen, onClose, dailyLimit = 15, remainingSwipes = 0 }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight

      const diffMs = midnight - now;
      if (diffMs <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const padZero = (n) => String(n).padStart(2, "0");
  const isLimitReached = remainingSwipes <= 0;
  const percentage = Math.min(100, Math.max(0, Math.round((remainingSwipes / (dailyLimit || 15)) * 100)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#121526]/95 border border-purple-500/30 shadow-2xl p-6 text-center overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full bg-purple-600/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-pink-600/25 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Badge */}
        {isLimitReached ? (
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4 animate-bounce">
            <Moon className="w-8 h-8 text-white fill-white/20" />
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center ring-2 ring-[#121526]">
              ✨
            </span>
          </div>
        ) : (
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-400 text-black text-[9px] font-black ring-2 ring-[#121526]">
              ACTIVE
            </span>
          </div>
        )}

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#EC4899]" />
          Spam-Free Campus Guarantee
        </span>

        {isLimitReached ? (
          <>
            <h3 className="text-xl font-black text-white tracking-tight mb-2">
              Daily Limit Reached!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              You've used all <strong className="text-purple-300">{dailyLimit} free swipes</strong> for today.
              We limit daily swipes to make sure every match on YMCA campus is genuine, thoughtful, and spam-free — <span className="text-pink-300 font-semibold">100% free, no money required!</span>
            </p>
          </>
        ) : (
          <>
            <h3 className="text-xl font-black text-white tracking-tight mb-2">
              ✨ {remainingSwipes} Free Swipes Left
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              You have <strong className="text-purple-300">{remainingSwipes} of {dailyLimit}</strong> campus swipes left today. Every student gets <span className="text-pink-300 font-semibold">{dailyLimit} free swipes</span> recharged every night at midnight!
            </p>

            {/* Quota Progress Bar */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-3 mb-4">
              <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 px-1">
                <span className="text-slate-400">Remaining Balance</span>
                <span className="text-purple-300">{remainingSwipes} / {dailyLimit} left</span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Midnight Countdown Box */}
        <div className="bg-[#181B2E] border border-white/10 rounded-2xl p-3.5 mb-5 shadow-inner">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            <Clock className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Swipes Recharge At Midnight</span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5 min-w-[50px]">
              <span className="text-lg font-black text-white font-mono">{padZero(timeLeft.hours)}</span>
              <p className="text-[9px] text-slate-400">Hours</p>
            </div>
            <span className="text-white/40 font-bold">:</span>
            <div className="bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5 min-w-[50px]">
              <span className="text-lg font-black text-white font-mono">{padZero(timeLeft.minutes)}</span>
              <p className="text-[9px] text-slate-400">Mins</p>
            </div>
            <span className="text-white/40 font-bold">:</span>
            <div className="bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/5 min-w-[50px]">
              <span className="text-lg font-black text-white font-mono">{padZero(timeLeft.seconds)}</span>
              <p className="text-[9px] text-slate-400">Secs</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {isLimitReached ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate("/matches");
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat With Your Matches Now</span>
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Back to Campus
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Continue Discovering ({remainingSwipes} left)</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  navigate("/matches");
                }}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>View Campus Matches</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyLimitModal;
