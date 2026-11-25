import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { createSocketConnection } from "../utils/socket";
import { clearUnreadCount } from "../utils/notificationSlice";
import { removeConnection, addConnections } from "../utils/connectionSlice";
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
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Calendar,
  X,
  Flame,
} from "lucide-react";

const ICEBREAKERS = [
  "chai pivan chala gi k? 🍵",
  "Maakah kya haal hn laadlee ",
  "aap konsi year me ho vese? 😅",
  "hey whats'up i have seen u multiple times in clg u look pretty 🚀😊👌",
];

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

  // Moderation state
  const [reportingUser, setReportingUser] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);
  const [unmatchingUser, setUnmatchingUser] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isUserOnline = Boolean(targetUserId && onlineUsers.includes(targetUserId.toString()));

  // 1. Fetch Target User (from Redux cache or API)
  useEffect(() => {
    if (!targetUserId) return;

    const findOrFetchUser = async () => {
      // Check if user is in Redux connections
      const foundInStore = connections?.find((c) => c._id === targetUserId);
      if (foundInStore) {
        setTargetUser(foundInStore);
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
        } else {
          // If not in accepted matches, redirect with toast
          setToastMessage("You can only chat with accepted campus matches.");
          setTimeout(() => navigate("/matches"), 2000);
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

    socket.on("messageReceived", handleMessageReceived);
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

  // Send text message with duplicate emission lock
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
    });

    setTimeout(() => {
      setSendingMessage(false);
    }, 300);
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
      dispatch(removeConnection(blockingUser._id));
      setBlockingUser(null);
      setShowInfoModal(false);
      navigate("/matches");
    } catch (err) {
      console.error("Failed to block user:", err);
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
    }
  };

  const handleReportSuccess = () => {
    setReportingUser(null);
    setShowInfoModal(false);
    setToastMessage("Report submitted. Thank you for keeping YMCA Match safe.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="h-full w-full max-w-4xl mx-auto flex flex-col bg-[#0E101A] sm:border-x sm:border-white/10 relative overflow-hidden">
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
      <header className="h-16 px-4 bg-[#111422] border-b border-white/10 flex items-center justify-between z-20 flex-shrink-0">
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
              <h3 className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                {targetUser ? `${targetUser.firstName} ${targetUser.lastName || ""}` : "Loading..."}
              </h3>
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
            onClick={() => setShowInfoModal(true)}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Chat Details & Safety"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CHAT MESSAGES STREAM                                      */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

        {/* Icebreaker Suggestions (shown when messages count is low) */}
        {!loadingChat && chatMessages.length < 3 && (
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

            return (
              <div
                key={msg._id || index}
                className={`flex ${isSenderMe ? "justify-end" : "justify-start"}`}
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
                    {isSenderMe &&
                      (msg.isRead ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" title="Seen" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-white/70" title="Sent" />
                      ))}
                  </div>
                </div>
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
      {/* INSTAGRAM-STYLE BOTTOM MESSAGE INPUT                      */}
      {/* ======================================================== */}
      <footer className="p-3 bg-[#111422] border-t border-white/10 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Message..."
            value={inputMessage}
            onChange={handleInputChange}
            className="flex-1 bg-[#181B2B] border border-white/10 rounded-full px-5 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-500"
          />

          {inputMessage.trim() ? (
            <button
              type="submit"
              className="px-4 py-3 rounded-full bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-xs flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/25"
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

            {/* Safety & Moderation Actions */}
            <div className="pt-2 border-t border-white/10 space-y-2">
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
    </div>
  );
};

export default Chat;
