import React, { useState, useEffect } from "react";
import {
  Heart,
  X,
  Star,
  Sparkles,
  GraduationCap,
  MapPin,
  BookOpen,
  Flame,
  Info,
  MoreVertical,
  Ban,
  ShieldAlert,
} from "lucide-react";
import ReportModal from "./ReportModal";

const SwipeCard = ({
  user,
  onSwipe,
  onBlock,
  onReport,
  isTop = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  // Handle keyboard arrow navigation for the top card
  useEffect(() => {
    if (!isTop) return;

    const handleKeyDown = (e) => {
      if (showReportModal || confirmBlock) return;

      if (e.key === "ArrowLeft") {
        triggerSwipe("ignored");
      } else if (e.key === "ArrowRight") {
        triggerSwipe("interested");
      } else if (e.key === "ArrowUp" || e.key === "s" || e.key === "S") {
        triggerSwipe("superlike");
      } else if (e.key === " ") {
        setShowDetails((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTop, user, showReportModal, confirmBlock]);

  const triggerSwipe = (status) => {
    if (status === "interested") {
      setSwipeDirection("right");
    } else if (status === "superlike") {
      setSwipeDirection("up");
    } else {
      setSwipeDirection("left");
    }

    setTimeout(() => {
      onSwipe(status, user._id);
    }, 280);
  };

  const handleBlockConfirm = () => {
    setConfirmBlock(false);
    setShowMenu(false);
    if (onBlock) {
      onBlock(user._id);
    }
  };

  const handleReportSuccess = (targetUserId, wasBlocked) => {
    if (onReport) {
      onReport(targetUserId, wasBlocked);
    }
  };

  const getAnimationClass = () => {
    if (swipeDirection === "right") {
      return "translate-x-[150%] rotate-12 opacity-0";
    }
    if (swipeDirection === "left") {
      return "-translate-x-[150%] -rotate-12 opacity-0";
    }
    if (swipeDirection === "up") {
      return "-translate-y-[150%] scale-95 opacity-0";
    }
    return "translate-x-0 rotate-0 opacity-100";
  };

  const fallbackPhoto =
    user?.gender === "female"
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600";

  const getValidPhotoUrl = () => {
    if (!user?.photoUrl || user.photoUrl.includes("geographyandyou")) {
      return fallbackPhoto;
    }
    return user.photoUrl;
  };

  return (
    <>
      {/* Moderation / Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        targetUser={user}
        onClose={() => setShowReportModal(false)}
        onReportSuccess={handleReportSuccess}
      />

      {/* Block Confirmation Modal */}
      {confirmBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-white">
                Block {user.firstName}?
              </h3>
              <p className="text-xs text-slate-400">
                They will be immediately removed from your feed, matches, and chat. Neither of you will see each other on YMCA Match again.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmBlock(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all"
              >
                Block Student
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative w-full max-w-sm sm:max-w-md h-[560px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ease-out select-none bg-[#111422] border border-white/10 ${getAnimationClass()}`}
      >
        {/* Background Profile Image */}
        <img
          src={getValidPhotoUrl()}
          alt={user.firstName}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackPhoto;
          }}
        />

        {/* Swipe Overlay Badges */}
        {swipeDirection === "right" && (
          <div className="absolute top-8 left-8 border-4 border-fuchsia-400 bg-fuchsia-500/20 backdrop-blur-md text-fuchsia-300 font-extrabold text-3xl px-6 py-2 rounded-2xl -rotate-12 z-30 uppercase tracking-widest shadow-xl animate-fade-in">
            LIKE 💖
          </div>
        )}
        {swipeDirection === "left" && (
          <div className="absolute top-8 right-8 border-4 border-rose-500 bg-rose-500/20 backdrop-blur-md text-rose-300 font-extrabold text-3xl px-6 py-2 rounded-2xl rotate-12 z-30 uppercase tracking-widest shadow-xl animate-fade-in">
            PASS ❌
          </div>
        )}
        {swipeDirection === "up" && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-cyan-400 bg-cyan-500/30 backdrop-blur-md text-cyan-200 font-black text-2xl sm:text-3xl px-6 py-2 rounded-2xl z-30 uppercase tracking-wider shadow-2xl shadow-cyan-500/50 animate-bounce flex items-center gap-2 whitespace-nowrap">
            ⭐ SUPER LIKE!
          </div>
        )}

        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 inset-x-4 flex justify-between items-center z-30">
          {/* Campus Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/95">
            <Flame className="w-3.5 h-3.5 text-[#A855F7] fill-[#A855F7]" />
            <span>JC Bose UST Verified</span>
          </div>

          {/* Right: Gender + 3-Dot Safety Menu */}
          <div className="flex items-center gap-2">
            {user.gender && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-medium text-purple-200 capitalize">
                {user.gender}
              </span>
            )}

            {isTop && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Safety Options"
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-md"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-44 bg-[#171A2B] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-40 animate-fade-in text-xs space-y-1">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmBlock(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-semibold transition-colors"
                    >
                      <Ban className="w-4 h-4 text-rose-400" />
                      Block Student
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-500/10 font-semibold transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Report Account
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dark Vignette Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent pointer-events-none" />

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
                  <GraduationCap className="w-3.5 h-3.5 text-[#A855F7]" />
                  {user.branch}
                </span>
              )}
              {user.year && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-purple-200 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                  Year {user.year}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p
              onClick={() => setShowDetails(!showDetails)}
              className={`text-slate-200 text-sm leading-relaxed mb-3 transition-all cursor-pointer ${
                showDetails
                  ? "line-clamp-none bg-black/60 p-3 rounded-2xl backdrop-blur-md border border-white/10"
                  : "line-clamp-2"
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

          {/* Action Buttons: Pass, Super Like, Info, Like */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 pt-2">
            {/* Pass Button */}
            <button
              onClick={() => triggerSwipe("ignored")}
              aria-label="Pass"
              title="Pass"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#171A2B]/90 hover:bg-rose-500/20 text-rose-400 border border-white/10 hover:border-rose-500/40 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 group p-3"
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform duration-200" />
            </button>

            {/* Super Like Button ⭐ (Campus Crush) */}
            <button
              onClick={() => triggerSwipe("superlike")}
              aria-label="Super Like"
              title="Super Like (Campus Crush)"
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/35 hover:shadow-cyan-500/60 hover:scale-115 active:scale-95 transition-all duration-200 group border border-cyan-300/30 p-2.5"
            >
              <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-white group-hover:rotate-45 transition-transform duration-300" />
            </button>

            {/* Info toggle button */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              aria-label="Details"
              title="Details"
              className="w-10 h-10 rounded-full bg-[#171A2B]/80 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Like Button */}
            <button
              onClick={() => triggerSwipe("interested")}
              aria-label="Like"
              title="Like"
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white flex items-center justify-center shadow-lg shadow-purple-500/35 hover:shadow-purple-500/55 hover:scale-110 active:scale-95 transition-all duration-200 group p-3"
            >
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="text-center mt-3 hidden sm:block">
            <span className="text-[11px] text-slate-400 font-medium">
              <kbd className="kbd kbd-xs bg-white/10 text-white border-0">←</kbd> Pass •{" "}
              <kbd className="kbd kbd-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">↑ or S</kbd> Super Like ⭐ •{" "}
              <kbd className="kbd kbd-xs bg-white/10 text-white border-0">→</kbd> Like
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwipeCard;
