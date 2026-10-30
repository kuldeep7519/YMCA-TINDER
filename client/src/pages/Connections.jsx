import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addConnections } from "../utils/connectionSlice";
import { MessageCircle, Heart, GraduationCap, BookOpen, Send, X, Coffee, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const ICEBREAKERS = [
  "Hey! Are you studying at the library or heading to canteen?",
  "Chai pe charcha after 4th period?",
  "Which professor do you have for this semester?",
  "Hey! Saw you're also into coding, participating in any hackathons soon?",
];

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");

  const getConnections = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/user/connection");
      dispatch(addConnections(res.data.data));
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getConnections();
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeChatUser) return;

    const userMessages = messages[activeChatUser._id] || [];
    setMessages({
      ...messages,
      [activeChatUser._id]: [
        ...userMessages,
        { text: inputMessage, sender: "me", time: "Just now" },
      ],
    });
    setInputMessage("");
  };

  const sendIcebreaker = (text) => {
    const userMessages = messages[activeChatUser._id] || [];
    setMessages({
      ...messages,
      [activeChatUser._id]: [
        ...userMessages,
        { text, sender: "me", time: "Just now" },
      ],
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            Your Campus Matches
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[#FF4458] font-bold">
              {connections?.length || 0}
            </span>
          </h1>
          <p className="text-slate-400 text-sm">
            Mutual likes at JC Bose UST. Start a chat and meet up!
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-lg text-[#FF4458]"></span>
          <p className="text-slate-400 text-sm">Loading your YMCA matches...</p>
        </div>
      ) : connections && connections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {connections.map((match) => (
            <div
              key={match._id}
              className="bg-[#161820] border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:border-red-500/40 hover:shadow-red-500/10 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Photo */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={
                      match.photoUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                    }
                    alt={match.firstName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Status Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-400 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Campus Active
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-xl font-bold text-white drop-shadow-md">
                      {match.firstName} {match.lastName}
                    </h3>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {match.branch && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-200">
                        <GraduationCap className="w-3 h-3 text-[#FF6B4A]" />
                        {match.branch}
                      </span>
                    )}
                    {match.year && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300">
                        <BookOpen className="w-3 h-3 text-amber-400" />
                        {match.year}
                      </span>
                    )}
                  </div>

                  {match.bio && (
                    <p className="text-slate-300 text-xs italic line-clamp-2">
                      "{match.bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Chat action button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => setActiveChatUser(match)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white text-xs font-bold shadow-md shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with {match.firstName}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="max-w-md mx-auto bg-[#161820] border border-white/10 rounded-3xl p-8 text-center shadow-xl space-y-5 animate-fade-in mt-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#FF4458]">
            <Heart className="w-10 h-10 fill-[#FF4458]/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">No Matches Yet</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When both you and another JC Bose UST student like each other's profiles, they'll appear here for you to chat!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Discover Students
          </Link>
        </div>
      )}

      {/* Interactive Chat Drawer / Modal */}
      {activeChatUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-[#161820] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px] animate-slide-up">
            {/* Chat Header */}
            <div className="p-4 bg-[#1B1E28] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-red-500/40">
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
                  <p className="text-[11px] text-[#FF6B4A] font-medium">
                    {activeChatUser.branch}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveChatUser(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {/* Mutual Match Banner */}
              <div className="text-center py-4 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  You matched with {activeChatUser.firstName}! 🎉
                </span>
                <p className="text-xs text-slate-400">
                  Break the ice with a quick campus conversation starter:
                </p>
              </div>

              {/* Quick Icebreakers */}
              <div className="flex flex-col gap-1.5 pb-2">
                {ICEBREAKERS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendIcebreaker(prompt)}
                    className="text-left text-xs bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>

              {/* Render User Messages */}
              {(messages[activeChatUser._id] || []).map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "me" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs ${
                      msg.sender === "me"
                        ? "bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white rounded-br-xs"
                        : "bg-[#21242E] text-slate-200 rounded-bl-xs border border-white/5"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[9px] opacity-75 mt-1 block text-right">
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[#1B1E28] border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Message ${activeChatUser.firstName}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-[#12141B] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;
