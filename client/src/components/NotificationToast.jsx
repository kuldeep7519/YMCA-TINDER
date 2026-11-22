import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { dismissToast, clearUnreadCount } from "../utils/notificationSlice";
import { MessageCircle, X, Flame } from "lucide-react";

const NotificationToast = () => {
  const toast = useSelector((store) => store.notifications.toast);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!toast) return;

    // Automatically dismiss toast after 5 seconds
    const timer = setTimeout(() => {
      dispatch(dismissToast());
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  if (!toast) return null;

  const handleReply = () => {
    dispatch(dismissToast());
    dispatch(clearUnreadCount());
    navigate("/matches");
  };

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-slide-up shadow-2xl">
      <div className="bg-[#111422]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-purple-500/10 flex items-start gap-3 text-white">
        {/* Pulsing Avatar/Icon */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] flex items-center justify-center text-white shadow-md shadow-purple-500/30">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-pink-400 border-2 border-[#111422] rounded-full animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-pink-400 border-2 border-[#111422] rounded-full" />
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-white truncate">
              {toast.senderName || "New Match"} sent you a message!
            </h4>
            <button
              onClick={() => dispatch(dismissToast())}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1 line-clamp-2 italic bg-white/5 p-2 rounded-xl border border-white/5">
            "{toast.text}"
          </p>

          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              onClick={handleReply}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-sm shadow-purple-500/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Reply Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
