import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { dismissToast, clearUnreadCount } from "../utils/notificationSlice";
import { X, Flame, ArrowRight } from "lucide-react";

const NotificationToast = () => {
  const toast = useSelector((store) => store.notifications.toast);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      dispatch(dismissToast());
      setIsExiting(false);
    }, 200);
  };

  useEffect(() => {
    if (!toast) {
      setIsExiting(false);
      return;
    }

    setIsExiting(false);
    const timer = setTimeout(() => {
      handleClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const handleReply = () => {
    const senderId = toast.senderId;
    dispatch(dismissToast());
    dispatch(clearUnreadCount());
    if (senderId) {
      navigate(`/chat/${senderId}`);
    } else {
      navigate("/matches");
    }
  };

  const previewText =
    toast.messageType === "audio" || toast.audioUrl
      ? "🎤 Sent a voice note"
      : toast.messageType === "image" || toast.imageUrl
      ? (toast.text && toast.text !== "📷 Photo" ? `📷 ${toast.text}` : "📷 Sent a photo")
      : toast.text || "Sent you a message";

  return (
    <div
      onClick={handleReply}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-auto sm:min-w-[360px] sm:max-w-md transition-all duration-200 select-none cursor-pointer ${
        isExiting
          ? "opacity-0 -translate-y-3 scale-95 pointer-events-none"
          : "opacity-100 translate-y-0 scale-100 animate-slide-up"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#121528]/95 backdrop-blur-2xl border border-purple-500/35 hover:border-purple-400/60 p-3 sm:p-3.5 shadow-[0_16px_50px_rgba(0,0,0,0.75)] shadow-purple-500/10 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group flex items-center justify-between gap-3 text-white">
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-10 bg-purple-500/25 blur-xl pointer-events-none" />

        {/* Sender Avatar with App Badge */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-purple-500/40 group-hover:ring-purple-400 transition-all shadow-md">
            {toast.senderPhoto ? (
              <img
                src={toast.senderPhoto}
                alt={toast.senderName || "Sender"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center text-white font-black text-sm">
                {(toast.senderName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Flame badge */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] flex items-center justify-center ring-2 ring-[#121528] shadow-sm">
            <Flame className="w-2.5 h-2.5 fill-white text-white" />
          </div>
        </div>

        {/* Sender & Message Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-black text-white truncate">
              {toast.senderName || "New Match"}
            </h4>
            <span className="text-[10px] text-purple-300/80 font-medium flex-shrink-0">
              • Just now
            </span>
          </div>

          <p className="text-xs text-slate-300 truncate mt-0.5 font-medium leading-snug">
            {previewText}
          </p>
        </div>

        {/* Right Action: Reply Pill & Close Button */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReply();
            }}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-[11px] shadow-md shadow-purple-500/25 flex items-center gap-1 active:scale-95 transition-all"
            title="Open Chat"
          >
            <span>Reply</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auto-Dismiss Progress Bar along bottom */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] rounded-b-2xl pointer-events-none"
          style={{ animation: "toastProgress 4.5s linear forwards" }}
        />
      </div>
    </div>
  );
};

export default NotificationToast;
