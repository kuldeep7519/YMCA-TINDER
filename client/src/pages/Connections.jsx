import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import { addConnections, removeConnection, updateConnection } from "../utils/connectionSlice";
import { clearUnreadCount } from "../utils/notificationSlice";
import ReportModal from "../components/ReportModal";
import {
  Heart,
  GraduationCap,
  Sparkles,
  MoreVertical,
  Ban,
  UserCheck,
  ShieldAlert,
  UserX,
  Search,
  Flame,
  MessageCircle,
  X,
} from "lucide-react";

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const loggedInUser = useSelector((store) => store.user);
  const onlineUsers = useSelector((store) => store.notifications.onlineUsers) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isUserOnline = (id) => Boolean(id && onlineUsers.includes(id.toString()));

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Safety & Moderation States
  const [reportingUser, setReportingUser] = useState(null);
  const [blockingUser, setBlockingUser] = useState(null);
  const [unmatchingUser, setUnmatchingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeDropdownId && !e.target.closest(".match-action-dropdown")) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeDropdownId]);

  // Fetch all matches
  const getConnections = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/user/connection");
      const data = res.data.data || [];
      dispatch(addConnections(data));
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

  // Block a match
  const handleBlockConfirm = async () => {
    if (!blockingUser) return;
    const target = blockingUser;
    setBlockingUser(null);

    try {
      await axiosClient.post("/user/block", { targetUserId: target._id });
      dispatch(updateConnection({ id: target._id, data: { isBlockedByMe: true } }));
      setToastMessage(`Blocked ${target.firstName}. Tap their chat to unblock anytime.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to block user:", err);
      setToastMessage("Failed to block user.");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Unblock a match
  const handleUnblock = async (target) => {
    try {
      await axiosClient.post("/user/unblock", { targetUserId: target._id });
      dispatch(updateConnection({ id: target._id, data: { isBlockedByMe: false } }));
      setToastMessage(`Unblocked ${target.firstName}.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to unblock user:", err);
      setToastMessage("Failed to unblock user.");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Unmatch
  const handleUnmatchConfirm = async () => {
    if (!unmatchingUser) return;
    const target = unmatchingUser;
    setUnmatchingUser(null);

    try {
      await axiosClient.post("/user/unmatch", { targetUserId: target._id });
      dispatch(removeConnection(target._id));
      setToastMessage(`Unmatched with ${target.firstName}. Removed from matches.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error("Failed to unmatch:", err);
    }
  };

  const handleReportSuccess = () => {
    setReportingUser(null);
    setToastMessage("Report submitted. Thank you for keeping YMCA Match safe.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter matches by search query
  const filteredConnections =
    connections?.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName || ""}`.toLowerCase();
      const branch = (c.branch || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      return fullName.includes(query) || branch.includes(query);
    }) || [];

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111422]/95 backdrop-blur-xl border border-purple-500/30 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-2">
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

      {/* Unmatch Confirmation Modal */}
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
      {/* INSTAGRAM DIRECT INBOX HEADER                             */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Direct Messages</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 font-bold">
              {connections?.length || 0}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Your accepted JC Bose UST campus matches
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="loading loading-spinner loading-lg text-[#A855F7]"></span>
          <p className="text-slate-400 text-sm">Loading campus inbox...</p>
        </div>
      ) : !connections || connections.length === 0 ? (
        /* Empty State */
        <div className="bg-[#111422] border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-5 animate-fade-in mt-8">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-[#A855F7]">
            <Heart className="w-10 h-10 fill-purple-500/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">No Matches Yet</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              When both you and another JC Bose UST student swipe right, their chat will appear here in your Direct Inbox!
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
        <div className="space-y-4">
          {/* Top Campus Sparks Story / Match Bubble Reel */}
          <div className="bg-[#111422] border border-white/10 rounded-2xl p-3 shadow-lg">
            <div className="flex items-center gap-1.5 mb-2.5 px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-[#EC4899]" />
              <span>Campus Matches</span>
            </div>
            <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              {connections.map((match) => {
                const isOnline = isUserOnline(match._id);
                return (
                  <button
                    key={match._id}
                    onClick={() => navigate(`/chat/${match._id}`)}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                  >
                    <div className="relative w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] group-hover:scale-105 transition-all">
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
                            ? "bg-emerald-400 ring-2 ring-emerald-500/30"
                            : "bg-slate-600"
                        }`}
                        title={isOnline ? "Active now" : "Offline"}
                      />
                    </div>
                    <span className="text-xs font-semibold max-w-[68px] truncate text-slate-300 group-hover:text-white transition-colors">
                      {match.firstName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats by name or branch..."
              className="w-full bg-[#111422] border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Conversation List (Instagram Style) */}
          <div className="bg-[#111422] border border-white/10 rounded-2xl divide-y divide-white/5 shadow-xl">
            {filteredConnections.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No chats found matching "{searchQuery}"
              </div>
            ) : (
              filteredConnections.map((match, index) => {
                const isOnline = isUserOnline(match._id);
                const isNearBottom = index >= Math.max(1, filteredConnections.length - 2);

                return (
                  <div
                    key={match._id}
                    onClick={() => navigate(`/chat/${match._id}`)}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-all group first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/30 group-hover:ring-purple-500 transition-all">
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
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#111422] transition-colors ${
                            isOnline
                              ? "bg-emerald-400 ring-2 ring-emerald-500/30"
                              : "bg-slate-600"
                          }`}
                          title={isOnline ? "Active now" : "Offline"}
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                            {match.firstName} {match.lastName}
                          </h4>
                          {match.streak > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px]"
                              title={`${match.streak} day streak`}
                            >
                              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>{match.streak}d</span>
                            </span>
                          )}
                          {match.isBlockedByMe ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
                              Blocked
                            </span>
                          ) : isOnline ? (
                            <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">
                              Active
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-purple-300/80 font-medium truncate flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{match.branch}</span>
                          {match.year && <span className="text-slate-500">• {match.year}</span>}
                        </p>

                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {match.bio ? `"${match.bio}"` : "Matched on YMCA Match • Tap to chat 👋"}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Chat Icon & Dropdown */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => navigate(`/chat/${match._id}`)}
                        className="w-9 h-9 rounded-full bg-white/5 hover:bg-purple-500/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                        title="Open Chat"
                      >
                        <MessageCircle className="w-4 h-4 text-[#A855F7]" />
                      </button>

                      <div className="relative match-action-dropdown">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDropdownId(activeDropdownId === match._id ? null : match._id)
                          }
                          className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeDropdownId === match._id && (
                          <div
                            className={`absolute right-0 ${
                              isNearBottom ? "bottom-full mb-2" : "top-full mt-2"
                            } z-50 w-44 bg-[#171A2B] border border-white/10 rounded-2xl p-1.5 shadow-2xl space-y-1 animate-fade-in`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                setUnmatchingUser(match);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
                            >
                              <UserX className="w-4 h-4 text-amber-400" />
                              <span>Unmatch</span>
                            </button>

                            {match.isBlockedByMe ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  handleUnblock(match);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-purple-400 hover:bg-purple-500/10 rounded-xl transition-colors text-left"
                              >
                                <UserCheck className="w-4 h-4 text-purple-400" />
                                <span>Unblock</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDropdownId(null);
                                  setBlockingUser(match);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                              >
                                <Ban className="w-4 h-4 text-rose-400" />
                                <span>Block</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdownId(null);
                                setReportingUser(match);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors text-left"
                            >
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                              <span>Report</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;
