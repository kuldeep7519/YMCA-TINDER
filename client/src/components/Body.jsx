import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import axiosClient from "../utils/axiosClient";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { addNotification, setOnlineUsers } from "../utils/notificationSlice";
import { addRequests } from "../utils/requestSlice";
import { addConnections, removeConnection } from "../utils/connectionSlice";
import { createSocketConnection } from "../utils/socket";
import { playNotificationSound } from "../utils/sound";
import NotificationToast from "./NotificationToast";
import { Heart, Flame, Download, Sparkles } from "lucide-react";

const Body = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const socketRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get("/profile/view");
      const userData = res.data.user || res.data;
      dispatch(addUser(userData));
    } catch (err) {
      if (location.pathname !== "/login" && location.pathname !== "/") {
        navigate("/login");
      }
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (!user) {
      fetchProfile();
    } else {
      setCheckingAuth(false);
    }
  }, [user]);

  // Fetch badge counts immediately upon authentication so navbar shows counts beforehand
  const fetchBadgeCounts = async () => {
    try {
      const [reqRes, connRes] = await Promise.allSettled([
        axiosClient.get("/user/request/recieved"),
        axiosClient.get("/user/connection"),
      ]);
      if (reqRes.status === "fulfilled") {
        dispatch(addRequests(reqRes.value.data?.data || []));
      }
      if (connRes.status === "fulfilled") {
        dispatch(addConnections(connRes.value.data?.data || []));
      }
    } catch (e) {
      console.error("Failed to load initial badge counts:", e);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    fetchBadgeCounts();
  }, [user?._id]);

  // Global Socket Listener for Live Unread Badges & Sound Notifications
  useEffect(() => {
    if (!user?._id) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    // Join personal user notification channel and register presence
    socket.emit("registerUser", user._id);
    socket.emit("getOnlineUsers");

    // Receive message notifications from any match while browsing anywhere in the app
    socket.on("newNotification", (data) => {
      if (window.location.pathname === `/chat/${data?.senderId}`) {
        return;
      }
      playNotificationSound();
      dispatch(addNotification(data));
    });

    // Real-time online users presence list
    socket.on("onlineUsersList", (list) => {
      dispatch(setOnlineUsers(list));
    });

    // Real-time notification when a new request or match is received
    socket.on("newRequestNotification", () => {
      playNotificationSound();
      fetchBadgeCounts();
    });

    // Real-time notification when an unmatch occurs
    socket.on("userUnmatched", ({ unmatcherId, targetUserId }) => {
      const otherId =
        unmatcherId?.toString() === user._id?.toString()
          ? targetUserId
          : unmatcherId;
      if (otherId) {
        dispatch(removeConnection(otherId.toString()));
      }
    });

    return () => {
      socket.off("newNotification");
      socket.off("onlineUsersList");
      socket.off("newRequestNotification");
      socket.off("userUnmatched");
      socket.disconnect();
    };
  }, [user?._id, dispatch]);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#07080E] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
          <Flame className="w-8 h-8 text-white fill-white" />
        </div>
        <p className="text-slate-400 font-semibold text-sm">
          Loading YMCA Match...
        </p>
      </div>
    );
  }

  const isChatPage =
    location.pathname.startsWith("/chat") ||
    location.pathname.startsWith("/matches/");

  return (
    <div
      className={
        isChatPage
          ? "h-screen bg-[#07080E] flex flex-col selection:bg-[#A855F7] selection:text-white relative overflow-hidden"
          : "min-h-screen bg-[#07080E] flex flex-col justify-between selection:bg-[#A855F7] selection:text-white relative"
      }
    >
      {/* Real-time incoming chat toast banner (only when not in chat) */}
      {!isChatPage && <NotificationToast />}

      <div className={isChatPage ? "flex-1 flex flex-col h-full overflow-hidden" : ""}>
        {!isChatPage && <Navbar />}
        <main className={isChatPage ? "flex-1 flex flex-col h-full overflow-hidden" : ""}>
          <Outlet />
        </main>
      </div>

      {/* Footer (hidden on chat page) */}
      {!isChatPage && (
        <footer className="border-t border-white/5 py-6 px-4 text-center mt-12 bg-[#06070B]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#A855F7] fill-[#A855F7]" />
              <span className="font-bold text-slate-300">YMCA Match</span>
              <span>— The Official JC Bose UST Dating & Campus Network</span>
            </div>

            {/* PWA Install Button */}
            {deferredPrompt && !installed && (
              <button
                onClick={handleInstallApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-xs transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Add YMCA Match to Home Screen
              </button>
            )}

            <p className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for JC Bose UST Students
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Body;
