import React, { useState, useEffect } from "react";
import { Heart, X, Sparkles, GraduationCap, MapPin, BookOpen, Flame, Info } from "lucide-react";

const SwipeCard = ({ user, onSwipe, isTop = false }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  // Handle keyboard arrow navigation for the top card
  useEffect(() => {
    if (!isTop) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        triggerSwipe("ignored");
      } else if (e.key === "ArrowRight") {
        triggerSwipe("interested");
      } else if (e.key === "ArrowUp" || e.key === " ") {
        setShowDetails((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTop, user]);

  const triggerSwipe = (status) => {
    setSwipeDirection(status === "interested" ? "right" : "left");
    setTimeout(() => {
      onSwipe(status, user._id);
    }, 280);
  };

  const getAnimationClass = () => {
    if (swipeDirection === "right") {
      return "translate-x-[150%] rotate-12 opacity-0";
    }
    if (swipeDirection === "left") {
      return "-translate-x-[150%] -rotate-12 opacity-0";
    }
    return "translate-x-0 rotate-0 opacity-100";
  };

  const fallbackPhoto =
    user.gender === "female"
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600";

  return (
    <div
      className={`relative w-full max-w-sm sm:max-w-md h-[560px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ease-out select-none bg-[#16181F] border border-white/10 ${getAnimationClass()}`}
    >
      {/* Background Profile Image */}
      <img
        src={user.photoUrl || fallbackPhoto}
        alt={user.firstName}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        onError={(e) => {
          e.target.src = fallbackPhoto;
        }}
      />

      {/* Swipe Overlay Badges */}
      {swipeDirection === "right" && (
        <div className="absolute top-8 left-8 border-4 border-emerald-400 bg-emerald-500/20 backdrop-blur-md text-emerald-300 font-extrabold text-3xl px-6 py-2 rounded-2xl -rotate-12 z-30 uppercase tracking-widest shadow-xl animate-fade-in">
          LIKE 💖
        </div>
      )}
      {swipeDirection === "left" && (
        <div className="absolute top-8 right-8 border-4 border-rose-500 bg-rose-500/20 backdrop-blur-md text-rose-300 font-extrabold text-3xl px-6 py-2 rounded-2xl rotate-12 z-30 uppercase tracking-widest shadow-xl animate-fade-in">
          PASS ❌
        </div>
      )}

      {/* Top Floating Tags (Campus verified) */}
      <div className="absolute top-4 inset-x-4 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90">
          <Flame className="w-3.5 h-3.5 text-[#FF4458] fill-[#FF4458]" />
          <span>JC Bose UST Verified</span>
        </div>
        {user.gender && (
          <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-300 capitalize">
            {user.gender}
          </span>
        )}
      </div>

      {/* Dark Vignette Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

      {/* Content Section */}
      <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 z-20 flex flex-col justify-end">
        {/* Name, Age, Branch */}
        <div className="space-y-2 mb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
              {user.firstName} {user.lastName}
            </h2>
            {user.age && (
              <span className="text-2xl font-bold text-slate-200">
                {user.age}
              </span>
            )}
          </div>

          {/* Academic Info Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {user.branch && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-[#FF6B4A]" />
                {user.branch}
              </span>
            )}
            {user.year && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Year {user.year}
              </span>
            )}
          </div>
        </div>

        {/* Bio (Collapsible / Full) */}
        {user.bio && (
          <p
            onClick={() => setShowDetails(!showDetails)}
            className={`text-slate-200 text-sm leading-relaxed mb-3 transition-all cursor-pointer ${
              showDetails ? "line-clamp-none bg-black/60 p-3 rounded-2xl backdrop-blur-md border border-white/10" : "line-clamp-2"
            }`}
          >
            "{user.bio}"
          </p>
        )}

        {/* Interests Badges */}
        {user.interest && user.interest.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 max-h-16 overflow-hidden">
            {user.interest.slice(0, showDetails ? user.interest.length : 4).map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-slate-200 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
            {!showDetails && user.interest.length > 4 && (
              <button
                onClick={() => setShowDetails(true)}
                className="px-2 py-1 rounded-lg bg-white/10 text-xs text-white/80 hover:text-white"
              >
                +{user.interest.length - 4} more
              </button>
            )}
          </div>
        )}

        {/* Action Buttons: Pass, Superlike, Like */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
          {/* Pass Button */}
          <button
            onClick={() => triggerSwipe("ignored")}
            aria-label="Pass"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1e2029]/90 hover:bg-rose-500/20 text-rose-500 border border-white/10 hover:border-rose-500/40 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 group"
          >
            <X className="w-7 h-7 sm:w-8 sm:h-8 group-hover:rotate-12 transition-transform duration-200" />
          </button>

          {/* Info toggle button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            aria-label="Details"
            className="w-10 h-10 rounded-full bg-[#1e2029]/70 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Like Button */}
          <button
            onClick={() => triggerSwipe("interested")}
            aria-label="Like"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#FF4458] to-[#FF6B4A] text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-110 active:scale-95 transition-all duration-200 group"
          >
            <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-white group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-3 hidden sm:block">
          <span className="text-[11px] text-slate-400 font-medium">
            Use <kbd className="kbd kbd-xs bg-white/10 text-white border-0">←</kbd> to Pass or{" "}
            <kbd className="kbd kbd-xs bg-white/10 text-white border-0">→</kbd> to Like
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
