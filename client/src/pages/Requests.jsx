import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { Check, X, Sparkles, GraduationCap, BookOpen, Heart, Inbox, Star } from "lucide-react";
import MatchModal from "../components/MatchModal";
import { Link } from "react-router-dom";

const Requests = () => {
  const requests = useSelector((store) => store.requests);
  const loggedInUser = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [newMatch, setNewMatch] = useState(null);

  const getRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/user/request/recieved");
      dispatch(addRequests(res.data.data));
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRequests();
  }, []);

  const handleReview = async (status, fromUserId, studentObj) => {
    try {
      await axiosClient.patch(`/request/review/${status}/${fromUserId}`);
      dispatch(removeRequest(fromUserId));

      if (status === "accepted") {
        setNewMatch(studentObj);
      }
    } catch (err) {
      console.error("Review request failed:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Match Modal */}
      <MatchModal
        isOpen={!!newMatch}
        matchedUser={newMatch}
        loggedInUser={loggedInUser}
        onClose={() => setNewMatch(null)}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          Pending Campus Requests
          <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 font-bold">
            {requests?.length || 0}
          </span>
        </h1>
        <p className="text-slate-400 text-sm">
          These YMCA students swiped right on you! Accept to match and start talking.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-lg text-[#A855F7]"></span>
          <p className="text-slate-400 text-sm">Checking your requests...</p>
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((item) => {
            const student = item.fromuserid;
            if (!student) return null;
            const isSuperLike = item.status === "superlike";

            return (
              <div
                key={item._id}
                className={`rounded-3xl p-4 flex items-center justify-between gap-4 shadow-xl transition-all duration-300 group ${
                  isSuperLike
                    ? "bg-gradient-to-r from-cyan-950/30 via-[#111422] to-[#111422] border-2 border-cyan-400/50 shadow-cyan-500/20 ring-1 ring-cyan-400/30"
                    : "bg-[#111422] border border-white/10 hover:border-purple-500/40 hover:shadow-purple-500/10"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ${
                      isSuperLike
                        ? "ring-2 ring-cyan-400 shadow-md shadow-cyan-400/40"
                        : "ring-2 ring-purple-500/30"
                    }`}
                  >
                    <img
                      src={
                        student.photoUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                      }
                      alt={student.firstName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";
                      }}
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    {isSuperLike && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-extrabold text-[10px] uppercase tracking-wider shadow-sm animate-pulse">
                        <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                        <span>Campus Crush (Super Liked You!)</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-bold text-white text-base truncate">
                        {student.firstName} {student.lastName}
                      </h3>
                      {student.age && (
                        <span className="text-xs text-slate-400 font-semibold">
                          {student.age}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 text-[11px] text-slate-400">
                      {student.branch && (
                        <span className="inline-flex items-center gap-1 text-purple-400 font-medium">
                          <GraduationCap className="w-3 h-3 text-[#A855F7]" />
                          <span className="truncate max-w-[120px]">{student.branch}</span>
                        </span>
                      )}
                      {student.year && (
                        <span>• Year {student.year}</span>
                      )}
                    </div>

                    {student.bio && (
                      <p className="text-xs text-slate-400 italic line-clamp-1">
                        "{student.bio}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Accept or Reject */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleReview("rejected", student._id, student)}
                    aria-label="Decline"
                    className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-white/5 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleReview("accepted", student._id, student)}
                    aria-label="Accept"
                    className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="max-w-md mx-auto bg-[#111422] border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-5 animate-fade-in mt-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#A855F7]">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">No Pending Requests</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              When students at JC Bose UST swipe right on you, their requests will appear here for you to accept!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Discover More Students
          </Link>
        </div>
      )}
    </div>
  );
};

export default Requests;
