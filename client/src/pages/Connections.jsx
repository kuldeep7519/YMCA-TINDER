import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addConnections } from "../utils/connectionSlice";
import { clearUnreadCount } from "../utils/notificationSlice";
import { createSocketConnection } from "../utils/socket";
import ReportModal from "../components/ReportModal";
import {
  MessageCircle,
  Heart,
  GraduationCap,
  BookOpen,
  Send,
  X,
  Sparkles,
  MoreVertical,
  Ban,
  ShieldAlert,
  UserX,
  Check,
  CheckCheck,
  Search,
  ArrowLeft,
  Flame,
  Coffee,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";

const ICEBREAKERS = [
  "chai pivan chala gi k? 🍵",
  "Maakah kya haal hn laadlee ",
  "aap konsi year me ho vese? 😅",
  "hey whats'up i have seen u multiple times in clg u look pretty 🚀😊👌",
];

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const loggedInUser = useSelector((store) => store.user);
  const onlineUsers = useSelector((store) => store.notifications.onlineUsers) || [];
  const dispatch = useDispatch();

  const isUserOnline = (id) => Boolean(id && onlineUsers.includes(id.toString()));

  const [loading, setLoading] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Real-Time Typing Indicator State
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Safety & Moderation States
  const [reportingUser, setReportingUser] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);
  const [unmatchingUser, setUnmatchingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch all matches and clear unread badge on visiting matches
  const getConnections = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/user/connection");
      const data = res.data.data || [];
      dispatch(addConnections(data));

      // Auto-select first match on desktop if none selected
      if (data.length > 0 && window.innerWidth >= 1024 && !activeChatUser) {
        setActiveChatUser(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getConnections();
    dispatch(clearUnreadCount());
  }, [dispatch]);

  // Socket Connection, Chat History loader, Typing & Read Receipts
  useEffect(() => {
    if (!activeChatUser || !loggedInUser) return;

    // Clear unread count when opening a chat
    dispatch(clearUnreadCount());

    const socket = createSocketConnection();
    socketRef.current = socket;

    const roomId = [loggedInUser._id.toString(), activeChatUser._id.toString()].sort().join("_");

    // Join the private room for both users
    socket.emit("joinChat", {
      userId: loggedInUser._id,
      targetUserId: activeChatUser._id,
    });

    // Mark messages as read upon entering the chat
    socket.emit("markMessagesRead", {
      userId: loggedInUser._id,
      targetUserId: activeChatUser._id,
    });

    // Fetch past chat history from MongoDB
    const fetchChatHistory = async () => {
      try {
        setLoadingChat(true);
        const res = await axiosClient.get(`/chat/${activeChatUser._id}`);
        setChatMessages(res.data.messages || []);
      } catch (err) {
        console.error("Failed to load chat history:", err);
        setChatMessages([]);
      } finally {
        setLoadingChat(false);
      }
    };

    fetchChatHistory();

    // Listen for real-time incoming messages
    socket.on("messageReceived", (newMsg) => {
      setChatMessages((prev) => [...prev, newMsg]);

      if (
        newMsg.senderId === activeChatUser._id ||
        newMsg.senderId?._id === activeChatUser._id
      ) {
        socket.emit("markMessagesRead", {
          userId: loggedInUser._id,
          targetUserId: activeChatUser._id,
        });
      }
    });

    // Typing Indicator Listeners
    socket.on("userTyping", ({ userId }) => {
      if (userId === activeChatUser._id) {
        setIsOtherTyping(true);
      }
    });

    socket.on("userStoppedTyping", ({ userId }) => {
      if (userId === activeChatUser._id) {
        setIsOtherTyping(false);
      }
    });

    // Read Receipt Listener (when other student views my messages)
    socket.on("messagesMarkedRead", ({ readerId }) => {
      if (readerId === activeChatUser._id) {
        setChatMessages((prev) =>
          prev.map((m) => {
            const isMine =
              (typeof m.senderId === "object" ? m.senderId?._id : m.senderId) ===
              loggedInUser._id;
            return isMine ? { ...m, isRead: true } : m;
          })
        );
      }
    });

    return () => {
      socket.off("messageReceived");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("messagesMarkedRead");
      socket.disconnect();
      setIsOtherTyping(false);
    };
  }, [activeChatUser?._id, loggedInUser?._id, dispatch]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isOtherTyping]);

  // Emit typing status with debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    if (!activeChatUser || !socketRef.current) return;

    const roomId = [loggedInUser._id.toString(), activeChatUser._id.toString()].sort().join("_");

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

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeChatUser || !socketRef.current) return;

    const roomId = [loggedInUser._id.toString(), activeChatUser._id.toString()].sort().join("_");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit("stopTyping", {
      roomId,
      userId: loggedInUser._id,
    });

    socketRef.current.emit("sendMessage", {
      userId: loggedInUser._id,
      targetUserId: activeChatUser._id,
      text: inputMessage.trim(),
      senderName: loggedInUser.firstName,
    });

    setInputMessage("");
  };

  const sendIcebreaker = (text) => {
    if (!activeChatUser || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      userId: loggedInUser._id,
      targetUserId: activeChatUser._id,
      text,
      senderName: loggedInUser.firstName,
    });
  };

  // Block a match
  const handleBlockConfirm = async () => {
    if (!blockingUser) return;
    const target = blockingUser;
    setBlockingUser(null);
    setChatMenuOpen(false);

    try {
      await axiosClient.post(`/user/block/${target._id}`);
      const updated = connections.filter((c) => c._id !== target._id);
      dispatch(addConnections(updated));

      if (activeChatUser?._id === target._id) {
        setActiveChatUser(updated.length > 0 ? updated[0] : null);
        setChatMessages([]);
      }

      setToastMessage(`Blocked ${target.firstName}. Match and chat removed.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to block match:", err);
    }
  };

  // Unmatch a match amicably
  const handleUnmatchConfirm = async () => {
    if (!unmatchingUser) return;
    const target = unmatchingUser;
    setUnmatchingUser(null);
    setChatMenuOpen(false);

    try {
      await axiosClient.post(`/request/unmatch/${target._id}`);
      const updated = connections.filter((c) => c._id !== target._id);
      dispatch(addConnections(updated));

      if (activeChatUser?._id === target._id) {
        setActiveChatUser(updated.length > 0 ? updated[0] : null);
        setChatMessages([]);
      }

      setToastMessage(`Unmatched with ${target.firstName}. Removed from matches.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to unmatch:", err);
    }
  };

  // Report a match
  const handleReportSuccess = (targetUserId, wasBlocked) => {
    if (wasBlocked) {
      const updated = connections.filter((c) => c._id !== targetUserId);
      dispatch(addConnections(updated));
      if (activeChatUser?._id === targetUserId) {
        setActiveChatUser(updated.length > 0 ? updated[0] : null);
        setChatMessages([]);
      }
    }
    setToastMessage("Report submitted. Thank you for keeping YMCA Match safe.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter matches by search query
  const filteredConnections = connections?.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName || ""}`.toLowerCase();
    const branch = (c.branch || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return fullName.includes(query) || branch.includes(query);
  }) || [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-50 bg-[#111422]/95 backdrop-blur-xl border border-purple-500/30 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A855F7]" />
          {toastMessage}
        </div>
      )}

      {/* Moderation / Report Modal */}
      <ReportModal
        isOpen={!!reportingUser}
        targetUser={reportingUser}
        onClose={() => setReportingUser(null)}
        onReportSuccess={handleReportSuccess}
      />

      {/* Block Confirmation Modal */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-white">
                Block {blockingUser.firstName}?
              </h3>
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

      {/* Unmatch Confirmation Modal */}
      {unmatchingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-white">
                Unmatch with {unmatchingUser.firstName}?
              </h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to unmatch? You will no longer be able to message each other unless you match again.
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

      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            Campus Match Lounge
            <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 font-bold">
              {connections?.length || 0} Matches
            </span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Mutual sparks across JC Bose UST. Live chat connected via Socket.io.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="loading loading-spinner loading-lg text-[#A855F7]"></span>
          <p className="text-slate-400 text-sm">Loading your campus lounge...</p>
        </div>
      ) : !connections || connections.length === 0 ? (
        /* Empty State */
        <div className="max-w-md mx-auto bg-[#111422] border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-5 animate-fade-in mt-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-[#A855F7]">
            <Heart className="w-10 h-10 fill-purple-500/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">No Matches Yet</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When both you and another JC Bose UST student swipe right on each other, they'll appear here in your match lounge!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Discover Students
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Campus Sparks Story Reel */}
          <div className="bg-[#111422] border border-white/10 rounded-3xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3 px-1 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-[#EC4899]" />
              <span>Campus Matches</span>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
              {connections.map((match) => {
                const isSelected = activeChatUser?._id === match._id;
                const isOnline = isUserOnline(match._id);
                return (
                  <button
                    key={match._id}
                    onClick={() => setActiveChatUser(match)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                  >
                    <div
                      className={`relative w-14 h-14 rounded-full p-0.5 transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] ring-2 ring-purple-500/50 scale-105"
                          : "bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-purple-500 group-hover:to-pink-500"
                      }`}
                    >
                      <img
                        src={
                          match.photoUrl ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                        }
                        alt={match.firstName}
                        className="w-full h-full object-cover rounded-full"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#111422] transition-colors ${
                          isOnline
                            ? "bg-emerald-400 ring-2 ring-emerald-500/30 animate-pulse"
                            : "bg-slate-600"
                        }`}
                        title={isOnline ? "Online now" : "Offline"}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold max-w-[68px] truncate transition-colors ${
                        isSelected ? "text-white font-bold" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {match.firstName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual Pane Studio Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px] bg-[#111422] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Left Column: Matches List */}
            <div
              className={`lg:col-span-5 border-r border-white/10 flex flex-col h-full bg-[#0E101A] ${
                activeChatUser ? "hidden lg:flex" : "flex"
              }`}
            >
              {/* Search Bar */}
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search matches by name or branch..."
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Matches List */}
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                {filteredConnections.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    No matches found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredConnections.map((match) => {
                    const isSelected = activeChatUser?._id === match._id;
                    const isOnline = isUserOnline(match._id);
                    return (
                      <div
                        key={match._id}
                        onClick={() => setActiveChatUser(match)}
                        className={`group p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-purple-500/15 to-pink-500/10 border border-purple-500/40 shadow-sm"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/10">
                              <img
                                src={
                                  match.photoUrl ||
                                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                                }
                                alt={match.firstName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0E101A] transition-colors ${
                                isOnline
                                  ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                  : "bg-slate-600"
                              }`}
                              title={isOnline ? "Online now" : "Offline"}
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4
                                className={`text-sm font-bold truncate ${
                                  isSelected ? "text-white" : "text-slate-200"
                                }`}
                              >
                                {match.firstName} {match.lastName}
                              </h4>
                              {match.age && (
                                <span className="text-xs text-slate-400">
                                  {match.age}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-purple-400 font-medium truncate flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{match.branch}</span>
                            </p>

                            {match.bio && (
                              <p className="text-[11px] text-slate-400 truncate italic mt-0.5">
                                "{match.bio}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dropdown Options */}
                        <div
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="dropdown dropdown-end">
                            <label
                              tabIndex={0}
                              className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </label>
                            <ul
                              tabIndex={0}
                              className="dropdown-content z-30 menu p-1.5 shadow-2xl bg-[#171A2B] border border-white/10 rounded-2xl w-40 text-xs space-y-1"
                            >
                              <li>
                                <button
                                  onClick={() => setUnmatchingUser(match)}
                                  className="flex items-center gap-2 text-slate-300 hover:text-white py-1.5 rounded-xl"
                                >
                                  <UserX className="w-3.5 h-3.5 text-amber-400" />
                                  Unmatch
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => setBlockingUser(match)}
                                  className="flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 py-1.5 rounded-xl"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Block
                                </button>
                              </li>
                              <li>
                                <button
                                  onClick={() => setReportingUser(match)}
                                  className="flex items-center gap-2 text-amber-400 hover:bg-amber-500/10 py-1.5 rounded-xl"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                  Report
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Interactive Chat Studio */}
            <div
              className={`lg:col-span-7 flex flex-col h-full bg-[#111422] ${
                !activeChatUser ? "hidden lg:flex" : "flex"
              }`}
            >
              {activeChatUser ? (
                <>
                  {/* Chat Studio Header */}
                  <div className="p-4 bg-[#171A2B] border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setActiveChatUser(null)}
                        className="lg:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center mr-1"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-purple-500/40 flex-shrink-0">
                        <img
                          src={activeChatUser.photoUrl}
                          alt={activeChatUser.firstName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          {activeChatUser.firstName} {activeChatUser.lastName}
                        </h4>
                        <p className="text-[11px] text-purple-300 font-medium flex items-center gap-1.5">
                          {isUserOnline(activeChatUser._id) ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50"></span>
                              <span className="text-emerald-400 font-semibold">Online now</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                              <span className="text-slate-400">Offline</span>
                            </>
                          )}
                          <span className="text-slate-600">•</span>
                          <span>{activeChatUser.branch}</span>
                          {activeChatUser.year && (
                            <span className="text-slate-400">• Year {activeChatUser.year}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Chat Safety Actions */}
                    <div className="relative">
                      <button
                        onClick={() => setChatMenuOpen(!chatMenuOpen)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {chatMenuOpen && (
                        <div className="absolute right-0 top-10 w-44 bg-[#1A1D2E] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-40 animate-fade-in text-xs space-y-1">
                          <button
                            onClick={() => {
                              setChatMenuOpen(false);
                              setUnmatchingUser(activeChatUser);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5 text-amber-400" />
                            Unmatch
                          </button>
                          <button
                            onClick={() => {
                              setChatMenuOpen(false);
                              setBlockingUser(activeChatUser);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            Block Match
                          </button>
                          <button
                            onClick={() => {
                              setChatMenuOpen(false);
                              setReportingUser(activeChatUser);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-400 hover:bg-amber-500/10 font-medium transition-colors"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            Report Match
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {/* Mutual Match Banner */}
                    <div className="text-center py-4 space-y-1">
                      <span className="text-[11px] font-bold text-purple-300 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                        You matched with {activeChatUser.firstName}! 🎉
                      </span>
                      <p className="text-xs text-slate-400">
                        Say hi or pick an icebreaker below to get the conversation started!
                      </p>
                    </div>

                    {/* Icebreaker Suggestions */}
                    {chatMessages.length < 3 && (
                      <div className="flex flex-col gap-1.5 pb-2">
                        <p className="text-[11px] text-slate-400 font-medium">Quick icebreakers:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {ICEBREAKERS.map((prompt, i) => (
                            <button
                              key={i}
                              onClick={() => sendIcebreaker(prompt)}
                              className="text-left text-xs bg-white/5 hover:bg-purple-500/15 border border-white/5 hover:border-purple-500/30 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {loadingChat ? (
                      <div className="flex items-center justify-center py-10">
                        <span className="loading loading-spinner loading-md text-[#A855F7]"></span>
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => {
                        const isSenderMe =
                          (typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId) ===
                          loggedInUser._id;

                        return (
                          <div
                            key={msg._id || index}
                            className={`flex ${
                              isSenderMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                                isSenderMe
                                  ? "bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white rounded-br-xs shadow-purple-500/15"
                                  : "bg-[#181B2B] text-slate-100 rounded-bl-xs border border-white/5"
                              }`}
                            >
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
                                {isSenderMe && (
                                  msg.isRead ? (
                                    <CheckCheck
                                      className="w-3.5 h-3.5 text-sky-300"
                                      title="Seen"
                                    />
                                  ) : (
                                    <Check
                                      className="w-3.5 h-3.5 text-white/70"
                                      title="Sent"
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Real-time Typing Bubble */}
                    {isOtherTyping && (
                      <div className="flex items-center gap-2 pt-1 animate-fade-in">
                        <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-purple-500/40 flex-shrink-0">
                          <img
                            src={activeChatUser.photoUrl}
                            alt={activeChatUser.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="bg-[#181B2B] border border-white/5 rounded-2xl rounded-bl-xs px-3 py-2 flex items-center gap-1.5 shadow-md">
                          <span className="text-[11px] text-purple-300 italic">
                            {activeChatUser.firstName} is typing
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

                  {/* Chat Input Bar */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-[#171A2B] border-t border-white/10 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder={`Message ${activeChatUser.firstName}...`}
                      value={inputMessage}
                      onChange={handleInputChange}
                      className="flex-1 bg-[#10121D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/20 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                /* Desktop Placeholder when no match selected */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A855F7]">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">
                      Your Campus Chat Studio
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Select a match from the left list to begin messaging, share campus stories, or plan a hangout at the canteen!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;
