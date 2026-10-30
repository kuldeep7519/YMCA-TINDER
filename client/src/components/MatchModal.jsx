import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { MessageCircle, Heart, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MatchModal = ({ isOpen, onClose, matchedUser, loggedInUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Fire confetti bursts!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FF4458", "#FF6B4A", "#FFC700", "#FF1493"],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !matchedUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1E202B] to-[#12141A] rounded-3xl p-6 sm:p-8 text-center border border-white/10 shadow-2xl overflow-hidden animate-slide-up">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Match Header */}
        <div className="space-y-1 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            New Match Found
          </div>
          <h2 className="text-4xl sm:text-5xl font-black italic tracking-tight bg-gradient-to-r from-[#FF4458] via-rose-300 to-[#FF6B4A] bg-clip-text text-transparent drop-shadow-lg">
            IT'S A MATCH!
          </h2>
          <p className="text-slate-300 text-sm">
            You and <span className="font-semibold text-white">{matchedUser.firstName}</span> like each other
          </p>
        </div>

        {/* Dual Avatars with Heart in center */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {/* Logged in student avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full ring-4 ring-[#FF4458] shadow-lg shadow-red-500/30 overflow-hidden">
              <img
                src={loggedInUser?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
                alt="You"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-slate-300 border border-white/10">
              You
            </span>
          </div>

          {/* Floating animated Heart */}
          <div className="w-12 h-12 -mx-3 z-10 rounded-full bg-gradient-to-tr from-[#FF4458] to-[#FF6B4A] flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>

          {/* Matched student avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full ring-4 ring-[#FF6B4A] shadow-lg shadow-orange-500/30 overflow-hidden">
              <img
                src={matchedUser.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"}
                alt={matchedUser.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-slate-300 border border-white/10">
              {matchedUser.firstName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              navigate("/matches");
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-base shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Say Hello on Campus
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-sm transition-all"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;
