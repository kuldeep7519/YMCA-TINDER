import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { Check, X, Sparkles, GraduationCap, BookOpen, Heart, Inbox } from "lucide-react";
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
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[#FF4458] font-bold">
            {requests?.length || 0}
          </span>
        </h1>
        <p className="text-slate-400 text-sm">
          These YMCA students swiped right on you! Accept to match and start talking.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="loading loading-spinner loading-lg text-[#FF4458]"></span>
          <p className="text-slate-400 text-sm">Checking your requests...</p>
        </div>
      ) : requests && requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((item) => {
            const student = item.fromuserid;
            if (!student) return null;

            return (
              <div
                key={item._id}
                className="bg-[#161820] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-white/20 transition-all duration-300"
              >
                {/* Photo & Info */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-red-500/30 flex-shrink-0">
                    <img
                      src={
                        student.photoUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                      }
                      alt={student.firstName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-extrabold text-white text-lg">
                        {student.firstName} {student.lastName}
                      </h3>
                      {student.age && (
                        <span className="text-slate-400 text-sm font-semibold">
                          {student.age}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 text-[11px]">
                      {student.branch && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-[#FF6B4A] font-medium border border-white/5">
                          {student.branch}
                        </span>
                      )}
                      {student.year && (
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                          {student.year}
                        </span>
                      )}
                    </div>

                    {student.bio && (
                      <p className="text-slate-300 text-xs italic line-clamp-1">
                        "{student.bio}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Reject & Accept */}
                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  <button
                    onClick={() => handleReview("rejected", student._id, student)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 transition-all hover:scale-105 active:scale-95"
                    aria-label="Reject"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleReview("accepted", student._id, student)}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-xs shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Accept Match
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="max-w-md mx-auto bg-[#161820] border border-white/10 rounded-3xl p-8 text-center shadow-xl space-y-5 animate-fade-in mt-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">Inbox is Clear</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No pending connection requests right now. Discover more students on the feed to get likes back!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Explore YMCA Deck
          </Link>
        </div>
      )}
    </div>
  );
};

export default Requests;
