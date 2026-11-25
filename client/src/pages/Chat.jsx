import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { createSocketConnection } from "../utils/socket";
import { clearUnreadCount } from "../utils/notificationSlice";
import { removeConnection, updateConnection, addConnections } from "../utils/connectionSlice";
import ReportModal from "../components/ReportModal";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Send,
  Heart,
  Check,
  CheckCheck,
  Sparkles,
  Ban,
  UserX,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Calendar,
  X,
  Flame,
  Smile,
  Reply,
  Copy,
  Trash2,
  MoreVertical,
  Palette,
} from "lucide-react";

const ICEBREAKERS = [
  "chai pivan chala gi k? 🍵",
  "Maakah kya haal hn laadlee ",
  "aap konsi year me ho vese? 😅",
  "hey whats'up i have seen u multiple times in clg u look pretty 🚀😊👌",
];

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"];

const getWallpaperSvg = (patternType, color = "#A855F7") => {
  const encColor = encodeURIComponent(color);
  if (patternType === "stars") {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140' fill='none' stroke='${encColor}' stroke-width='1.5'%3E%3Cpath d='M35 25 L37 32 L44 34 L37 36 L35 43 L33 36 L26 34 L33 32 Z' opacity='0.9' fill='${encColor}' fill-opacity='0.25'/%3E%3Ccircle cx='105' cy='35' r='2' fill='${encColor}' opacity='0.7'/%3E%3Cpath d='M95 90 L96 95 L101 96 L96 97 L95 102 L94 97 L89 96 L94 95 Z' opacity='0.85' fill='${encColor}' fill-opacity='0.3'/%3E%3Ccircle cx='35' cy='110' r='2.5' fill='${encColor}' opacity='0.6'/%3E%3Cpath d='M70 60 C68 56 62 56 60 60 C58 64 58 68 60 72 L70 82 L80 72 C82 68 82 64 80 60 C78 56 72 56 70 60 Z' opacity='0.65' fill='none'/%3E%3Cpath d='M115 70 C113 70 110 72 110 75 C110 78 113 80 115 80 C117 80 120 78 120 75' opacity='0.55'/%3E%3Ccircle cx='70' cy='20' r='1.5' fill='${encColor}' opacity='0.5'/%3E%3C/svg%3E`;
  }
  if (patternType === "hearts") {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140' fill='none' stroke='${encColor}' stroke-width='1.5'%3E%3Cpath d='M35 25 C30 20 22 20 17 25 C12 30 12 38 17 43 L35 60 L53 43 C58 38 58 30 53 25 C48 20 40 20 35 25 Z' opacity='0.85' fill='${encColor}' fill-opacity='0.2'/%3E%3Cpath d='M105 85 C101 81 95 81 91 85 C87 89 87 95 91 99 L105 113 L119 99 C123 95 123 89 119 85 C115 81 109 81 105 85 Z' opacity='0.9' fill='${encColor}' fill-opacity='0.25'/%3E%3Cpath d='M100 30 L108 30 M104 26 L104 34' opacity='0.6'/%3E%3Cpath d='M35 105 L41 105 M38 102 L38 108' opacity='0.6'/%3E%3Ccircle cx='70' cy='70' r='2' fill='${encColor}' opacity='0.6'/%3E%3Cpath d='M70 125 C68 123 65 123 63 125 C61 127 61 130 63 132 L70 138 L77 132 C79 130 79 127 77 125 C75 123 72 123 70 125 Z' opacity='0.5'/%3E%3C/svg%3E`;
  }
  if (patternType === "cyber") {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60' fill='none' stroke='${encColor}' stroke-width='1'%3E%3Cpath d='M0 30 L60 30 M30 0 L30 60' opacity='0.12'/%3E%3Cpath d='M27 30 L33 30 M30 27 L30 33' opacity='0.8' stroke-width='1.5'/%3E%3Ccircle cx='30' cy='30' r='2' fill='${encColor}' opacity='0.85'/%3E%3Ccircle cx='0' cy='0' r='1.5' fill='${encColor}' opacity='0.6'/%3E%3Ccircle cx='60' cy='60' r='1.5' fill='${encColor}' opacity='0.6'/%3E%3C/svg%3E`;
  }
  // Default: Campus Romance & Dating Doodles (Rich, visible and aesthetic)
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160' fill='none' stroke='${encColor}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M28 20 C24 16 18 16 14 20 C10 24 10 30 14 34 L28 48 L42 34 C46 30 46 24 42 20 C38 16 32 16 28 20 Z' opacity='0.85' fill='${encColor}' fill-opacity='0.15'/%3E%3Cpath d='M110 30 C110 24 116 20 124 20 C132 20 138 24 138 30 C138 34 135 37 130 39 L132 46 L124 42 C118 42 110 38 110 30 Z' opacity='0.8' fill='${encColor}' fill-opacity='0.1'/%3E%3Cpath d='M80 70 L82 77 L89 79 L82 81 L80 88 L78 81 L71 79 L78 77 Z' opacity='0.9' fill='${encColor}' fill-opacity='0.3'/%3E%3Cpath d='M30 110 L44 110 L42 124 L32 124 Z M44 113 C47 113 49 115 49 118 C49 121 47 123 44 123 M34 106 C34 104 36 103 36 101 M40 106 C40 104 42 103 42 101' opacity='0.8'/%3E%3Cpath d='M120 115 L120 100 L134 96 L134 111 M120 115 A 4 3 0 1 1 112 115 A 4 3 0 1 1 120 115 M134 111 A 4 3 0 1 1 126 111 A 4 3 0 1 1 134 111' opacity='0.85' fill='${encColor}' fill-opacity='0.25'/%3E%3Cpath d='M70 26 L80 20 L90 26 L80 32 Z M75 29 L75 35 C75 37 85 37 85 35 L85 29 M90 26 L90 34' opacity='0.8'/%3E%3Cpath d='M80 130 C76 135 74 139 74 143 C74 148 78 152 83 152 C88 152 92 148 92 143 C92 138 88 134 84 131 C84 134 82 136 80 137 C80 134 81 132 80 130 Z' opacity='0.9' fill='${encColor}' fill-opacity='0.2'/%3E%3Cpath d='M18 70 L24 70 L26 66 L34 66 L36 70 L42 70 C44 70 45 71 45 73 L45 83 C45 85 44 86 42 86 L18 86 C16 86 15 85 15 83 L15 73 C15 71 16 70 18 70 Z M30 82 A 4 4 0 1 0 30 74 A 4 4 0 1 0 30 82 Z' opacity='0.8'/%3E%3Cpath d='M118 64 L142 56 L134 80 L128 73 L118 76 Z M128 73 L142 56' opacity='0.85' fill='${encColor}' fill-opacity='0.12'/%3E%3C/svg%3E`;
};

const CHAT_THEMES = {
  classic: {
    id: "classic",
    name: "Classic YMCA",
    subtitle: "Original Purple & Pink glow",
    swatch: "from-[#6366F1] via-[#A855F7] to-[#EC4899]",
    containerBg: "bg-[#0E101A]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(168, 85, 247, 0.22), transparent 60%)",
    headerBg: "bg-[#111422]/95",
    footerBg: "bg-[#111422]",
    myBubble: "bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white shadow-purple-500/20",
    theirBubble: "bg-[#181B2B] text-slate-100 border border-white/5",
    replyQuoteBorder: "border-purple-300",
    replyQuoteText: "text-purple-200",
    accentText: "text-[#A855F7]",
    sendBtn: "bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899]",
    tintColor: "#C084FC",
    orb1: "rgba(168, 85, 247, 0.22)",
    orb2: "rgba(236, 72, 153, 0.18)",
    defaultPattern: "doodles",
  },
  ocean: {
    id: "ocean",
    name: "Ocean Cyber",
    subtitle: "Deep sea cyan & electric blue",
    swatch: "from-cyan-400 via-sky-500 to-blue-600",
    containerBg: "bg-[#0A101D]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(6, 182, 212, 0.24), transparent 60%)",
    headerBg: "bg-[#0E1729]/95",
    footerBg: "bg-[#0E1729]",
    myBubble: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white shadow-cyan-500/20",
    theirBubble: "bg-[#142035] text-slate-100 border border-cyan-500/10",
    replyQuoteBorder: "border-cyan-300",
    replyQuoteText: "text-cyan-200",
    accentText: "text-cyan-400",
    sendBtn: "bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600",
    tintColor: "#38BDF8",
    orb1: "rgba(6, 182, 212, 0.22)",
    orb2: "rgba(59, 130, 246, 0.18)",
    defaultPattern: "stars",
  },
  sunset: {
    id: "sunset",
    name: "Sunset Ember",
    subtitle: "Warm golden peach & crimson",
    swatch: "from-amber-400 via-orange-500 to-rose-600",
    containerBg: "bg-[#140D14]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(249, 115, 22, 0.24), transparent 60%)",
    headerBg: "bg-[#1C121B]/95",
    footerBg: "bg-[#1C121B]",
    myBubble: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white shadow-orange-500/20",
    theirBubble: "bg-[#251824] text-slate-100 border border-orange-500/10",
    replyQuoteBorder: "border-amber-300",
    replyQuoteText: "text-amber-200",
    accentText: "text-orange-400",
    sendBtn: "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600",
    tintColor: "#FB923C",
    orb1: "rgba(249, 115, 22, 0.22)",
    orb2: "rgba(244, 63, 94, 0.18)",
    defaultPattern: "hearts",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Mint",
    subtitle: "Mint campus lawn & forest green",
    swatch: "from-emerald-400 via-teal-500 to-cyan-600",
    containerBg: "bg-[#091512]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(16, 185, 129, 0.24), transparent 60%)",
    headerBg: "bg-[#0E1E1A]/95",
    footerBg: "bg-[#0E1E1A]",
    myBubble: "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-emerald-500/20",
    theirBubble: "bg-[#132A24] text-slate-100 border border-emerald-500/10",
    replyQuoteBorder: "border-emerald-300",
    replyQuoteText: "text-emerald-200",
    accentText: "text-emerald-400",
    sendBtn: "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-600",
    tintColor: "#34D399",
    orb1: "rgba(16, 185, 129, 0.22)",
    orb2: "rgba(20, 184, 166, 0.18)",
    defaultPattern: "doodles",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Cyber Neon",
    subtitle: "Vivid fuchsia & electric violet",
    swatch: "from-fuchsia-500 via-pink-600 to-purple-700",
    containerBg: "bg-[#100B1E]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(217, 70, 239, 0.25), transparent 60%)",
    headerBg: "bg-[#17102C]/95",
    footerBg: "bg-[#17102C]",
    myBubble: "bg-gradient-to-r from-fuchsia-500 via-pink-600 to-purple-700 text-white shadow-fuchsia-500/25",
    theirBubble: "bg-[#21173D] text-slate-100 border border-fuchsia-500/10",
    replyQuoteBorder: "border-fuchsia-300",
    replyQuoteText: "text-fuchsia-200",
    accentText: "text-fuchsia-400",
    sendBtn: "bg-gradient-to-r from-fuchsia-500 via-pink-600 to-purple-700",
    tintColor: "#F472B6",
    orb1: "rgba(217, 70, 239, 0.24)",
    orb2: "rgba(147, 51, 234, 0.2)",
    defaultPattern: "cyber",
  },
  rose: {
    id: "rose",
    name: "Sweetheart Rose",
    subtitle: "Passionate crimson & petal blush",
    swatch: "from-rose-500 via-pink-500 to-red-600",
    containerBg: "bg-[#160B11]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(244, 63, 94, 0.24), transparent 60%)",
    headerBg: "bg-[#201019]/95",
    footerBg: "bg-[#201019]",
    myBubble: "bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 text-white shadow-rose-500/20",
    theirBubble: "bg-[#2A1622] text-slate-100 border border-rose-500/10",
    replyQuoteBorder: "border-rose-300",
    replyQuoteText: "text-rose-200",
    accentText: "text-rose-400",
    sendBtn: "bg-gradient-to-r from-rose-500 via-pink-600 to-red-600",
    tintColor: "#FB7185",
    orb1: "rgba(244, 63, 94, 0.24)",
    orb2: "rgba(251, 113, 133, 0.2)",
    defaultPattern: "hearts",
  },
  stealth: {
    id: "stealth",
    name: "Midnight Stealth",
    subtitle: "Clean graphite & minimalist slate",
    swatch: "from-slate-400 via-zinc-500 to-neutral-700",
    containerBg: "bg-[#090A0F]",
    backdropGlow: "radial-gradient(circle at 50% -10%, rgba(148, 163, 184, 0.14), transparent 50%)",
    headerBg: "bg-[#12131C]/95",
    footerBg: "bg-[#12131C]",
    myBubble: "bg-gradient-to-r from-slate-600 via-zinc-700 to-slate-800 text-white shadow-slate-500/10 border border-white/10",
    theirBubble: "bg-[#181A26] text-slate-100 border border-white/5",
    replyQuoteBorder: "border-slate-300",
    replyQuoteText: "text-slate-200",
    accentText: "text-slate-300",
    sendBtn: "bg-gradient-to-r from-slate-600 via-zinc-600 to-slate-700",
    tintColor: "#94A3B8",
    orb1: "rgba(148, 163, 184, 0.14)",
    orb2: "rgba(71, 85, 105, 0.12)",
    defaultPattern: "cyber",
  },
};

const Chat = () => {
  const { targetUserId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loggedInUser = useSelector((store) => store.user);
  const connections = useSelector((store) => store.connections);
  const onlineUsers = useSelector((store) => store.notifications.onlineUsers) || [];

  const [targetUser, setTargetUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Message reply, reaction and options state
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);
  const [activeMoreMsgId, setActiveMoreMsgId] = useState(null);

  // Block & Unblock state
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [unblockingUser, setUnblockingUser] = useState(false);

  // Moderation & chat management state
  const [reportingUser, setReportingUser] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);
  const [unmatchingUser, setUnmatchingUser] = useState(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);

  // Chat Theme state
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem(`ymca_theme_${targetUserId}`) || "classic";
  });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const currentTheme = CHAT_THEMES[activeTheme] || CHAT_THEMES.classic;

  // Chat Wallpaper pattern & intensity state
  const [wallpaperPattern, setWallpaperPattern] = useState(() => {
    return localStorage.getItem(`ymca_pattern_${targetUserId}`) || currentTheme.defaultPattern || "doodles";
  });
  const [wallpaperIntensity, setWallpaperIntensity] = useState(() => {
    return localStorage.getItem("ymca_wallpaper_intensity") || "medium";
  });

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  // Dismiss floating popups on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeReactionMsgId || activeMoreMsgId) {
        if (!e.target.closest(".message-interactive-menu")) {
          setActiveReactionMsgId(null);
          setActiveMoreMsgId(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeReactionMsgId, activeMoreMsgId]);

  const isUserOnline = Boolean(targetUserId && onlineUsers.includes(targetUserId.toString()));

  // 1. Fetch Target User (from Redux cache or API)
  useEffect(() => {
    if (!targetUserId) return;

    const findOrFetchUser = async () => {
      // Check if user is in Redux connections
      const foundInStore = connections?.find((c) => c._id === targetUserId);
      if (foundInStore) {
        setTargetUser(foundInStore);
        if (foundInStore.isBlockedByMe) setIsBlockedByMe(true);
        if (foundInStore.isBlockedByThem) setIsBlockedByThem(true);
        return;
      }

      // Fetch fresh connections from API
      try {
        const res = await axiosClient.get("/user/connection");
        const list = res.data.data || [];
        dispatch(addConnections(list));
        const matched = list.find((c) => c._id === targetUserId);
        if (matched) {
          setTargetUser(matched);
          if (matched.isBlockedByMe) setIsBlockedByMe(true);
          if (matched.isBlockedByThem) setIsBlockedByThem(true);
        }
      } catch (err) {
        console.error("Failed to load connection:", err);
      }
    };

    findOrFetchUser();
    dispatch(clearUnreadCount());
  }, [targetUserId, connections, dispatch, navigate]);

  // 2. Fetch Chat History & Connect Real-Time Socket
  useEffect(() => {
    if (!targetUserId || !loggedInUser) return;

    let isSubscribed = true;

    // Initialize Socket.io connection synchronously
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.emit("joinChat", {
      userId: loggedInUser._id,
      targetUserId,
    });

    socket.emit("markMessagesRead", {
      userId: loggedInUser._id,
      targetUserId,
    });

    // Listen for incoming messages with ID deduplication
    const handleMessageReceived = (newMsg) => {
      if (!isSubscribed) return;

      setChatMessages((prev) => {
        const msgId = newMsg._id?.toString();
        // Ignore duplicate message if already present in state
        if (msgId && prev.some((m) => m._id?.toString() === msgId)) {
          return prev;
        }
        return [...prev, newMsg];
      });

      if (
        newMsg.senderId === targetUserId ||
        newMsg.senderId?._id === targetUserId
      ) {
        socket.emit("markMessagesRead", {
          userId: loggedInUser._id,
          targetUserId,
        });
      }
    };

    // Typing indicators
    const handleUserTyping = ({ userId }) => {
      if (!isSubscribed) return;
      if (userId === targetUserId) {
        setIsOtherTyping(true);
      }
    };

    const handleUserStoppedTyping = ({ userId }) => {
      if (!isSubscribed) return;
      if (userId === targetUserId) {
        setIsOtherTyping(false);
      }
    };

    // Read receipts
    const handleMessagesMarkedRead = ({ readerId }) => {
      if (!isSubscribed) return;
      if (readerId === targetUserId) {
        setChatMessages((prev) =>
          prev.map((m) => {
            const isMine =
              (typeof m.senderId === "object" ? m.senderId?._id : m.senderId) ===
              loggedInUser._id;
            return isMine ? { ...m, isRead: true } : m;
          })
        );
      }
    };

    // Real-time emoji reaction updates
    const handleMessageReacted = ({ messageId, reactions }) => {
      if (!isSubscribed) return;
      setChatMessages((prev) =>
        prev.map((m) =>
          m._id?.toString() === messageId?.toString() ? { ...m, reactions } : m
        )
      );
    };

    // Real-time message deletion (unsend)
    const handleMessageUnsent = ({ messageId }) => {
      if (!isSubscribed) return;
      setChatMessages((prev) =>
        prev.filter((m) => m._id?.toString() !== messageId?.toString())
      );
    };

    // Real-time entire chat cleared
    const handleChatCleared = () => {
      if (!isSubscribed) return;
      setChatMessages([]);
    };

    // Real-time chat theme changed
    const handleThemeChanged = ({ theme, changedBy }) => {
      if (!isSubscribed) return;
      if (theme && CHAT_THEMES[theme]) {
        setActiveTheme(theme);
        localStorage.setItem(`ymca_theme_${targetUserId}`, theme);
        setToastMessage(`${changedBy || "Match"} changed the chat theme to ${CHAT_THEMES[theme].name} ✨`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    };

    socket.on("messageReceived", handleMessageReceived);
    socket.on("messageReacted", handleMessageReacted);
    socket.on("messageUnsent", handleMessageUnsent);
    socket.on("chatCleared", handleChatCleared);
    socket.on("themeChanged", handleThemeChanged);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("messagesMarkedRead", handleMessagesMarkedRead);

    // Fetch message history asynchronously
    const fetchHistory = async () => {
      try {
        setLoadingChat(true);
        const res = await axiosClient.get(`/chat/${targetUserId}`);
        if (isSubscribed) {
          setChatMessages(res.data.messages || []);
          if (res.data.theme && CHAT_THEMES[res.data.theme]) {
            setActiveTheme(res.data.theme);
            localStorage.setItem(`ymca_theme_${targetUserId}`, res.data.theme);
          }
          if (res.data.targetUser) {
            setTargetUser(res.data.targetUser);
          }
          if (res.data.isBlockedByMe !== undefined) {
            setIsBlockedByMe(Boolean(res.data.isBlockedByMe));
          }
          if (res.data.isBlockedByThem !== undefined) {
            setIsBlockedByThem(Boolean(res.data.isBlockedByThem));
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
        if (isSubscribed) setChatMessages([]);
      } finally {
        if (isSubscribed) setLoadingChat(false);
      }
    };

    fetchHistory();

    return () => {
      isSubscribed = false;
      socket.off("messageReceived", handleMessageReceived);
      socket.off("messageReacted", handleMessageReacted);
      socket.off("messageUnsent", handleMessageUnsent);
      socket.off("chatCleared", handleChatCleared);
      socket.off("themeChanged", handleThemeChanged);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messagesMarkedRead", handleMessagesMarkedRead);
      socket.emit("leaveChat", {
        userId: loggedInUser._id,
        targetUserId,
      });
      setIsOtherTyping(false);
    };
  }, [targetUserId, loggedInUser?._id]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isOtherTyping]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    if (!targetUserId || !socketRef.current) return;

    const roomId = [loggedInUser._id.toString(), targetUserId.toString()].sort().join("_");

    socketRef.current.emit("typing", {
      roomId,
      userId: loggedInUser._id,
      senderName: loggedInUser.firstName,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping", {
        roomId,
        userId: loggedInUser._id,
      });
    }, 1500);
  };

  // Send text message with duplicate emission lock & reply context
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !targetUserId || !socketRef.current || sendingMessage) return;

    const textToSend = inputMessage.trim();
    setInputMessage("");
    setSendingMessage(true);

    const roomId = [loggedInUser._id.toString(), targetUserId.toString()].sort().join("_");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit("stopTyping", {
      roomId,
      userId: loggedInUser._id,
    });

    socketRef.current.emit("sendMessage", {
      userId: loggedInUser._id,
      targetUserId,
      text: textToSend,
      senderName: loggedInUser.firstName,
      replyTo: replyingTo
        ? {
            messageId: replyingTo._id,
            text: replyingTo.text,
            senderName: replyingTo.senderName,
          }
        : null,
    });

    // Reset reply preview after sending
    setReplyingTo(null);

    setTimeout(() => {
      setSendingMessage(false);
    }, 300);
  };

  // Toggle emoji reaction with optimistic UI
  const handleToggleReaction = (msg, emoji) => {
    if (!targetUserId || !socketRef.current || !msg?._id) return;
    const roomId = [loggedInUser._id.toString(), targetUserId.toString()].sort().join("_");

    setChatMessages((prev) =>
      prev.map((m) => {
        if (m._id?.toString() !== msg._id?.toString()) return m;
        const currentReactions = [...(m.reactions || [])];
        const existingIdx = currentReactions.findIndex(
          (r) =>
            (typeof r.userId === "object" ? r.userId?._id : r.userId)?.toString() ===
            loggedInUser._id.toString()
        );

        if (existingIdx > -1) {
          if (currentReactions[existingIdx].emoji === emoji) {
            currentReactions.splice(existingIdx, 1);
          } else {
            currentReactions[existingIdx] = { userId: loggedInUser._id, emoji };
          }
        } else {
          currentReactions.push({ userId: loggedInUser._id, emoji });
        }
        return { ...m, reactions: currentReactions };
      })
    );

    socketRef.current.emit("reactMessage", {
      roomId,
      messageId: msg._id,
      userId: loggedInUser._id,
      emoji,
    });

    setActiveReactionMsgId(null);
  };

  // Unsend message with optimistic UI
  const handleUnsendMessage = (msg) => {
    if (!targetUserId || !socketRef.current || !msg?._id) return;
    const roomId = [loggedInUser._id.toString(), targetUserId.toString()].sort().join("_");

    setChatMessages((prev) =>
      prev.filter((m) => m._id?.toString() !== msg._id?.toString())
    );

    socketRef.current.emit("unsendMessage", {
      roomId,
      messageId: msg._id,
      userId: loggedInUser._id,
    });

    setActiveMoreMsgId(null);
    setToastMessage("Message unsent");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Copy message text to clipboard
  const handleCopyText = (msg) => {
    if (!msg?.text) return;
    navigator.clipboard?.writeText(msg.text);
    setActiveMoreMsgId(null);
    setToastMessage("Copied to clipboard! 📋");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Start reply to message
  const handleStartReply = (msg, isSenderMe) => {
    setReplyingTo({
      _id: msg._id,
      text: msg.text,
      senderName: isSenderMe ? "You" : targetUser?.firstName || "Student",
    });
    setActiveMoreMsgId(null);
    setActiveReactionMsgId(null);
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 50);
  };

  // Send quick icebreaker or heart reaction with debounce lock
  const sendQuickText = (text) => {
    if (!targetUserId || !socketRef.current || sendingMessage) return;

    setSendingMessage(true);
    socketRef.current.emit("sendMessage", {
      userId: loggedInUser._id,
      targetUserId,
      text,
      senderName: loggedInUser.firstName,
    });

    setTimeout(() => {
      setSendingMessage(false);
    }, 300);
  };

  // Change Chat Theme
  const handleSelectTheme = async (themeKey) => {
    if (!themeKey || !CHAT_THEMES[themeKey]) return;

    setActiveTheme(themeKey);
    localStorage.setItem(`ymca_theme_${targetUserId}`, themeKey);

    const roomId = [loggedInUser._id.toString(), targetUserId.toString()].sort().join("_");
    socketRef.current?.emit("changeTheme", {
      roomId,
      userId: loggedInUser._id,
      targetUserId,
      theme: themeKey,
      userName: loggedInUser.firstName,
    });

    try {
      await axiosClient.post("/chat/theme", {
        targetUserId,
        theme: themeKey,
      });
    } catch (err) {
      console.error("Failed to save chat theme:", err);
    }

    setToastMessage(`Theme updated to ${CHAT_THEMES[themeKey].name} ✨`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectWallpaperPattern = (pattern) => {
    setWallpaperPattern(pattern);
    localStorage.setItem(`ymca_pattern_${targetUserId}`, pattern);
  };

  const handleSelectWallpaperIntensity = (intensity) => {
    setWallpaperIntensity(intensity);
    localStorage.setItem("ymca_wallpaper_intensity", intensity);
  };

  // Call simulation triggers
  const handleTriggerCall = (type) => {
    setToastMessage(
      type === "video"
        ? `Video calling with ${targetUser?.firstName || "match"} is coming in the next update! 🎥`
        : `Voice calling with ${targetUser?.firstName || "match"} is coming in the next update! 📞`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Block user
  const handleBlockConfirm = async () => {
    if (!blockingUser) return;
    try {
      await axiosClient.post("/user/block", { targetUserId: blockingUser._id });
      dispatch(updateConnection({ id: blockingUser._id, data: { isBlockedByMe: true } }));
      setIsBlockedByMe(true);
      setBlockingUser(null);
      setShowInfoModal(false);
      setToastMessage(`${blockingUser.firstName} has been blocked.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to block user:", err);
      setToastMessage("Failed to block user.");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Unblock user
  const handleUnblockUser = async () => {
    if (!targetUserId || unblockingUser) return;
    try {
      setUnblockingUser(true);
      await axiosClient.post("/user/unblock", { targetUserId });
      dispatch(updateConnection({ id: targetUserId, data: { isBlockedByMe: false } }));
      setIsBlockedByMe(false);
      setShowInfoModal(false);
      setToastMessage(`Unblocked ${targetUser?.firstName || "student"}. You can now chat.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to unblock user:", err);
      setToastMessage("Failed to unblock user.");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setUnblockingUser(false);
    }
  };

  // Unmatch user
  const handleUnmatchConfirm = async () => {
    if (!unmatchingUser) return;
    try {
      await axiosClient.post("/user/unmatch", { targetUserId: unmatchingUser._id });
      dispatch(removeConnection(unmatchingUser._id));
      setUnmatchingUser(null);
      setShowInfoModal(false);
      navigate("/matches");
    } catch (err) {
      console.error("Failed to unmatch:", err);
      setToastMessage("Failed to unmatch user.");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleReportSuccess = () => {
    setReportingUser(null);
    setShowInfoModal(false);
    setToastMessage("Report submitted. Thank you for keeping YMCA Match safe.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Clear chat conversation
  const handleClearChatConfirm = async () => {
    if (!targetUserId || clearingChat) return;
    try {
      setClearingChat(true);
      const roomId = [loggedInUser._id.toString(), targetUserId.toString()].sort().join("_");

      // Real-time socket notification across both users
      socketRef.current?.emit("clearChat", {
        roomId,
        userId: loggedInUser._id,
        targetUserId,
      });

      // Database clear via API
      await axiosClient.delete(`/chat/clear/${targetUserId}`);

      setChatMessages([]);
      setShowClearChatConfirm(false);
      setShowInfoModal(false);
      setToastMessage("Chat cleared successfully! 🧹");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to clear chat:", err);
      setToastMessage("Failed to clear chat.");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setClearingChat(false);
    }
  };

  return (
    <div
      className={`h-full w-full max-w-4xl mx-auto flex flex-col ${currentTheme.containerBg} sm:border-x sm:border-white/10 relative overflow-hidden transition-colors duration-500`}
    >
      {/* Background radial atmosphere glow matching active theme */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
        style={{ backgroundImage: currentTheme.backdropGlow }}
      />

      {/* Visual Aesthetic Wallpaper Pattern (Doodles / Stars / Hearts / Cyber) */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 z-0"
        style={{
          backgroundImage: `url("${getWallpaperSvg(wallpaperPattern, currentTheme.tintColor)}")`,
          backgroundSize: wallpaperPattern === "cyber" ? "60px 60px" : "180px 180px",
          backgroundRepeat: "repeat",
          opacity:
            wallpaperIntensity === "subtle"
              ? 0.22
              : wallpaperIntensity === "vibrant"
              ? 0.48
              : 0.35,
        }}
      />

      {/* Ambient Glowing Orbs */}
      <div
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 z-0"
        style={{ backgroundColor: currentTheme.orb1 }}
      />
      <div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 z-0"
        style={{ backgroundColor: currentTheme.orb2 }}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#171A2B]/95 backdrop-blur-xl border border-purple-500/30 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A855F7]" />
          {toastMessage}
        </div>
      )}

      {/* ======================================================== */}
      {/* INSTAGRAM-STYLE TOP HEADER                                */}
      {/* ======================================================== */}
      <header
        className={`h-16 px-4 ${currentTheme.headerBg} backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20 flex-shrink-0 transition-colors duration-300`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button to Matches/Inbox */}
          <button
            onClick={() => navigate("/matches")}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors flex-shrink-0"
            title="Back to Campus Matches"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* User Avatar + Online status */}
          <div
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-500/40 group-hover:ring-purple-500 transition-all">
                <img
                  src={
                    targetUser?.photoUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                  }
                  alt={targetUser?.firstName || "Match"}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111422] transition-colors ${
                  isUserOnline ? "bg-emerald-400 ring-2 ring-emerald-500/30" : "bg-slate-600"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                  {targetUser ? `${targetUser.firstName} ${targetUser.lastName || ""}` : "Loading..."}
                </h3>
                {isBlockedByMe && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                    Blocked
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                {isUserOnline ? (
                  <span className="text-emerald-400 font-semibold">Active now</span>
                ) : (
                  <span>Offline</span>
                )}
                {targetUser?.branch && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="truncate">{targetUser.branch}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Action icons (Audio, Video, Info) */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => handleTriggerCall("audio")}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleTriggerCall("video")}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Video Call"
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowThemeModal(true)}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors relative"
            title="Change Chat Theme"
          >
            <Palette className="w-4 h-4" />
            <span
              className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-r ${currentTheme.swatch} ring-1 ring-white/40 shadow-sm`}
            />
          </button>

          <button
            onClick={() => setShowInfoModal(true)}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Chat Details & Safety"
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowClearChatConfirm(true)}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CHAT MESSAGES STREAM                                      */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {/* Match Intro Card */}
        {targetUser && (
          <div className="text-center py-6 space-y-3 max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden ring-4 ring-purple-500/30 shadow-xl">
              <img
                src={targetUser.photoUrl}
                alt={targetUser.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">
                {targetUser.firstName} {targetUser.lastName}
              </h4>
              <p className="text-xs text-purple-300 font-medium">
                {targetUser.branch} {targetUser.year ? `• ${targetUser.year}` : ""}
              </p>
              {targetUser.bio && (
                <p className="text-xs text-slate-400 mt-1 italic max-w-xs mx-auto">
                  "{targetUser.bio}"
                </p>
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-semibold">
              <Flame className="w-3.5 h-3.5 text-[#EC4899]" />
              You matched on YMCA Match
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loadingChat && (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-md text-[#A855F7]"></span>
          </div>
        )}

        {/* Icebreaker Suggestions (shown when no messages exist yet) */}
        {!loadingChat && chatMessages.length === 0 && (
          <div className="bg-[#141724] border border-white/5 rounded-2xl p-3.5 space-y-2 max-w-md mx-auto">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
              Campus Icebreakers
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ICEBREAKERS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendQuickText(prompt)}
                  className="text-left text-xs bg-white/5 hover:bg-purple-500/15 border border-white/5 hover:border-purple-500/30 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {!loadingChat &&
          chatMessages.map((msg, index) => {
            const isSenderMe =
              (typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId) ===
              loggedInUser._id;
            const hasReactions = msg.reactions && msg.reactions.length > 0;
            const isMenuOpen = activeReactionMsgId === msg._id || activeMoreMsgId === msg._id;

            return (
              <div
                key={msg._id || index}
                className={`group relative flex items-center gap-1.5 message-interactive-menu ${
                  isSenderMe ? "justify-end flex-row" : "justify-start flex-row"
                } ${hasReactions ? "mb-3" : ""}`}
              >
                {/* For Sender: Action buttons appear on the LEFT of bubble */}
                {isSenderMe && (
                  <div
                    className={`flex items-center gap-0.5 transition-opacity duration-150 ${
                      isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReactionMsgId((prev) => (prev === msg._id ? null : msg._id));
                        setActiveMoreMsgId(null);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                      title="React"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartReply(msg, isSenderMe)}
                      className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMoreMsgId((prev) => (prev === msg._id ? null : msg._id));
                        setActiveReactionMsgId(null);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                      title="More"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Message Bubble + Floating Elements */}
                <div className="relative max-w-[78%]">
                  {/* Floating Emoji Picker */}
                  {activeReactionMsgId === msg._id && (
                    <div
                      className={`absolute bottom-full mb-2 z-30 flex items-center gap-1 p-1.5 bg-[#171A2B]/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-fade-in ${
                        isSenderMe ? "right-0" : "left-0"
                      }`}
                    >
                      {QUICK_REACTIONS.map((emoji) => {
                        const hasReacted = msg.reactions?.some(
                          (r) =>
                            (typeof r.userId === "object" ? r.userId?._id : r.userId)?.toString() ===
                              loggedInUser._id?.toString() && r.emoji === emoji
                        );
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg, emoji)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 transition-transform ${
                              hasReacted ? "bg-white/20 ring-1 ring-purple-400" : "hover:bg-white/10"
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Instagram-Style More Options Popup */}
                  {activeMoreMsgId === msg._id && (
                    <div
                      className={`absolute bottom-full mb-2 z-30 w-48 bg-[#171A2B]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 animate-fade-in text-xs text-white ${
                        isSenderMe ? "right-0" : "left-0"
                      }`}
                    >
                      <div className="px-3 py-2 border-b border-white/10 text-[10px] text-slate-400 font-medium">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleString([], {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyText(msg)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-colors"
                      >
                        <span>Copy</span>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartReply(msg, isSenderMe)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 hover:text-white transition-colors"
                      >
                        <span>Reply</span>
                        <Reply className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {isSenderMe ? (
                        <button
                          type="button"
                          onClick={() => handleUnsendMessage(msg)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 font-semibold transition-colors"
                        >
                          <span>Unsend</span>
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMoreMsgId(null);
                            setReportingUser(targetUser);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-amber-500/20 text-amber-400 font-semibold transition-colors"
                        >
                          <span>Report</span>
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Main Bubble Content */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs shadow-md transition-all duration-300 ${
                      isSenderMe
                        ? `${currentTheme.myBubble} rounded-br-xs`
                        : `${currentTheme.theirBubble} rounded-bl-xs`
                    }`}
                  >
                    {/* Threaded Reply Quote preview inside bubble */}
                    {msg.replyTo && (
                      <div
                        className={`mb-2 px-2.5 py-1.5 rounded-xl bg-black/25 border-l-2 ${currentTheme.replyQuoteBorder} text-[11px]`}
                      >
                        <p className={`font-bold text-[10px] ${currentTheme.replyQuoteText}`}>
                          {msg.replyTo.senderName || "Message"}
                        </p>
                        <p className="truncate text-white/80 line-clamp-1">{msg.replyTo.text}</p>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    <div className="flex items-center justify-end gap-1 text-[9px] opacity-80 mt-1">
                      <span>
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Just now"}
                      </span>
                      {isSenderMe &&
                        (msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-300" title="Seen" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/70" title="Sent" />
                        ))}
                    </div>
                  </div>

                  {/* Reaction badge at bottom corner */}
                  {hasReactions && (
                    <div
                      onClick={() => {
                        setActiveReactionMsgId((prev) => (prev === msg._id ? null : msg._id));
                      }}
                      className={`absolute -bottom-2 ${
                        isSenderMe ? "right-2" : "left-2"
                      } flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#1A1D2E] border border-white/15 text-[11px] shadow-lg cursor-pointer hover:scale-110 transition-transform`}
                      title={msg.reactions.map((r) => r.emoji).join(" ")}
                    >
                      {Array.from(new Set(msg.reactions.map((r) => r.emoji))).slice(0, 3).map((emoji, idx) => (
                        <span key={idx}>{emoji}</span>
                      ))}
                      {msg.reactions.length > 1 && (
                        <span className="text-[9px] text-slate-300 font-bold ml-0.5">
                          {msg.reactions.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* For Receiver: Action buttons appear on the RIGHT of bubble */}
                {!isSenderMe && (
                  <div
                    className={`flex items-center gap-0.5 transition-opacity duration-150 ${
                      isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReactionMsgId((prev) => (prev === msg._id ? null : msg._id));
                        setActiveMoreMsgId(null);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                      title="React"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartReply(msg, isSenderMe)}
                      className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveMoreMsgId((prev) => (prev === msg._id ? null : msg._id));
                        setActiveReactionMsgId(null);
                      }}
                      className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:scale-110"
                      title="More"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        {/* Real-time Typing Indicator */}
        {isOtherTyping && targetUser && (
          <div className="flex items-center gap-2 pt-1 animate-fade-in">
            <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-purple-500/40 flex-shrink-0">
              <img
                src={targetUser.photoUrl}
                alt={targetUser.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-[#181B2B] border border-white/5 rounded-2xl rounded-bl-xs px-3.5 py-2 flex items-center gap-2 shadow-md">
              <span className="text-[11px] text-purple-300 italic">
                {targetUser.firstName} is typing
              </span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-bounce"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ======================================================== */}
      {/* INSTAGRAM-STYLE BOTTOM MESSAGE INPUT OR UNBLOCK BAR       */}
      {/* ======================================================== */}
      <footer
        className={`${currentTheme.footerBg} border-t border-white/10 flex-shrink-0 transition-colors duration-300`}
      >
        {/* Threaded Reply Quote preview banner */}
        {replyingTo && (
          <div className="px-4 py-2 bg-[#141724] border-b border-white/10 flex items-center justify-between text-xs animate-slide-up">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                  <Reply className="w-3 h-3 text-purple-400" />
                  Replying to {replyingTo.senderName}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  {replyingTo.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors"
              title="Cancel reply"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-3">
          {isBlockedByMe ? (
            <div className="py-2.5 px-4 flex flex-col items-center justify-center gap-2 text-center animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <Ban className="w-4 h-4" />
                <span>You have blocked {targetUser?.firstName || "this student"}.</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Unblock them to resume messaging and chatting.
              </p>
              <button
                type="button"
                onClick={handleUnblockUser}
                disabled={unblockingUser}
                className="mt-1 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                {unblockingUser ? "Unblocking..." : `Unblock ${targetUser?.firstName || "Student"}`}
              </button>
            </div>
          ) : isBlockedByThem ? (
            <div className="py-3 px-4 text-center">
              <p className="text-xs text-slate-400">
                You cannot send messages to this student.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                ref={messageInputRef}
                type="text"
                placeholder={replyingTo ? `Replying to ${replyingTo.senderName}...` : "Message..."}
                value={inputMessage}
                onChange={handleInputChange}
                className="flex-1 bg-[#181B2B] border border-white/10 rounded-full px-5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-500"
              />

              {inputMessage.trim() ? (
                <button
                  type="submit"
                  className={`px-4 py-3 rounded-full ${currentTheme.sendBtn} text-white font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/25`}
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => sendQuickText("❤️")}
                  className="w-11 h-11 rounded-full bg-white/5 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  title="Send Heart"
                >
                  <Heart className="w-5 h-5 fill-rose-500" />
                </button>
              )}
            </form>
          )}
        </div>
      </footer>

      {/* ======================================================== */}
      {/* INSTAGRAM-STYLE INFO & SAFETY MODAL                       */}
      {/* ======================================================== */}
      {showInfoModal && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-up text-white relative">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Photo & Name */}
            <div className="text-center space-y-2">
              <div className="w-24 h-24 rounded-full mx-auto overflow-hidden ring-4 ring-purple-500/40 shadow-xl">
                <img
                  src={targetUser.photoUrl}
                  alt={targetUser.firstName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  {targetUser.firstName} {targetUser.lastName}
                </h3>
                <p className="text-xs text-purple-300 font-medium">
                  {targetUser.branch} {targetUser.age ? `• ${targetUser.age} yrs` : ""}
                </p>
                {targetUser.year && (
                  <p className="text-[11px] text-slate-400">{targetUser.year}</p>
                )}
              </div>
            </div>

            {/* Bio */}
            {targetUser.bio && (
              <div className="p-3 bg-[#171A2B] rounded-2xl border border-white/5 text-xs text-slate-300 italic text-center">
                "{targetUser.bio}"
              </div>
            )}

            {/* Interests */}
            {targetUser.interest && targetUser.interest.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Interests
                </p>
                <div className="flex flex-wrap gap-1">
                  {targetUser.interest.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Selector Entry in Info Modal */}
            <div
              onClick={() => {
                setShowInfoModal(false);
                setShowThemeModal(true);
              }}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentTheme.swatch} ring-2 ring-white/20 shadow-md flex items-center justify-center flex-shrink-0`}
                >
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Chat Theme
                  </p>
                  <p className="text-[10px] text-slate-400">{currentTheme.name}</p>
                </div>
              </div>
              <span className="text-xs text-purple-400 font-semibold group-hover:underline">
                Change
              </span>
            </div>

            {/* Safety & Moderation Actions */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setShowClearChatConfirm(true);
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/15 text-slate-200 hover:text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Clear Chat History
              </button>

              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setUnmatchingUser(targetUser);
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-amber-500/15 text-amber-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <UserX className="w-4 h-4" />
                Unmatch with {targetUser.firstName}
              </button>

              {isBlockedByMe ? (
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    handleUnblockUser();
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  Unblock {targetUser.firstName}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    setBlockingUser(targetUser);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-rose-500/15 text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Ban className="w-4 h-4" />
                  Block Student
                </button>
              )}

              <button
                onClick={() => {
                  setShowInfoModal(false);
                  setReportingUser(targetUser);
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                Report Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Confirmation Modals */}
      <ReportModal
        isOpen={!!reportingUser}
        targetUser={reportingUser}
        onClose={() => setReportingUser(null)}
        onReportSuccess={handleReportSuccess}
      />

      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-white">Block {blockingUser.firstName}?</h3>
              <p className="text-xs text-slate-400">
                This student will be removed from your matches and chat history. Neither of you will see each other again.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setBlockingUser(null)}
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

      {unmatchingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-white">Unmatch with {unmatchingUser.firstName}?</h3>
              <p className="text-xs text-slate-400">
                Are you sure? You will no longer be able to message each other unless you match again.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setUnmatchingUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Keep Match
              </button>
              <button
                onClick={handleUnmatchConfirm}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all"
              >
                Yes, Unmatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INSTAGRAM-STYLE THEME PICKER MODAL                       */}
      {/* ======================================================== */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white relative">
            <button
              onClick={() => setShowThemeModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Chat Themes & Wallpaper</h3>
              <p className="text-xs text-slate-400">
                Pick a vibe & doodle pattern. Both of you will see changes live.
              </p>
            </div>

            {/* Theme Swatches */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 pt-1 scrollbar-none">
              {Object.values(CHAT_THEMES).map((th) => {
                const isSelected = activeTheme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleSelectTheme(th.id)}
                    className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between text-left ${
                      isSelected
                        ? "bg-white/10 border-purple-500 ring-2 ring-purple-500/50 shadow-lg"
                        : "bg-white/5 border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-r ${th.swatch} ring-2 ${
                          isSelected ? "ring-white" : "ring-white/20"
                        } shadow-md flex-shrink-0 flex items-center justify-center`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{th.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{th.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${th.swatch}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Wallpaper Pattern Picker */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Wallpaper Pattern
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "doodles", label: "Doodles", icon: "☕" },
                  { id: "stars", label: "Stars", icon: "✨" },
                  { id: "hearts", label: "Hearts", icon: "💖" },
                  { id: "cyber", label: "Grid", icon: "⚡" },
                ].map((pat) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => handleSelectWallpaperPattern(pat.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                      wallpaperPattern === pat.id
                        ? "bg-purple-500/20 border-purple-500 text-purple-200 ring-1 ring-purple-500/40"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">{pat.icon}</span>
                    <span className="text-[10px]">{pat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper Intensity */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  Pattern Intensity
                </span>
                <span className="text-purple-400 capitalize font-medium">{wallpaperIntensity}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "subtle", label: "Subtle (22%)" },
                  { id: "medium", label: "Medium (35%)" },
                  { id: "vibrant", label: "Vibrant (48%)" },
                ].map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleSelectWallpaperIntensity(level.id)}
                    className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      wallpaperIntensity === level.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-md"
                        : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-white">
                Clear chat with {targetUser?.firstName || "this student"}?
              </h3>
              <p className="text-xs text-slate-400">
                All messages in this conversation will be cleared for you. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearChatConfirm(false)}
                disabled={clearingChat}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChatConfirm}
                disabled={clearingChat}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {clearingChat ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Chat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
