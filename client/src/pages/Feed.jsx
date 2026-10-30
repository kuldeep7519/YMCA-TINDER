import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addFeed, removeUserFromFeed } from "../utils/feedSlice";
import SwipeCard from "../components/SwipeCard";
import MatchModal from "../components/MatchModal";
import { RefreshCw, Sparkles, HeartCrack, Users, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const loggedInUser = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const getFeed = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/user/feed");
      dispatch(addFeed(res.data.data));
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!feed) {
      getFeed();
    }
  }, [feed]);

  const handleSwipe = async (status, targetUserId) => {
    const currentCard = feed?.find((u) => u._id === targetUserId);

    // Optimistically remove card from deck
    dispatch(removeUserFromFeed(targetUserId));

    try {
      const res = await axiosClient.post(`/request/send/${status}/${targetUserId}`);

      if (status === "interested") {
        setToastMessage(`You liked ${currentCard?.firstName || "this student"}! 💖`);
      } else {
        setToastMessage(`Passed on ${currentCard?.firstName || "student"}.`);
      }

      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      console.error("Error sending swipe:", err);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-40 bg-[#1e2029]/95 backdrop-blur-md border border-white/10 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF4458]" />
          {toastMessage}
        </div>
      )}

      {/* Match Popup Modal */}
      <MatchModal
        isOpen={!!matchedUser}
        matchedUser={matchedUser}
        loggedInUser={loggedInUser}
        onClose={() => setMatchedUser(null)}
      />

      {loading ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="loading loading-spinner loading-lg text-[#FF4458]"></span>
          <p className="text-slate-400 font-medium text-sm animate-pulse">
            Finding YMCA students near you...
          </p>
        </div>
      ) : feed && feed.length > 0 ? (
        <div className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center">
          {/* Deck Stacking Effect */}
          {feed.length > 1 && (
            <div className="absolute top-2 w-[92%] h-[560px] sm:h-[620px] rounded-3xl bg-[#13151b] border border-white/5 opacity-50 scale-95 pointer-events-none -z-10 shadow-lg" />
          )}

          {/* Top Card */}
          <SwipeCard
            key={feed[0]._id}
            user={feed[0]}
            isTop={true}
            onSwipe={handleSwipe}
          />

          {/* Remaining Count Indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <Users className="w-3.5 h-3.5 text-[#FF6B4A]" />
            <span>{feed.length} students in YMCA queue</span>
          </div>
        </div>
      ) : (
        /* Empty Deck State */
        <div className="max-w-md w-full bg-[#181A20] rounded-3xl p-8 text-center border border-white/10 shadow-2xl space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-[#FF4458]">
            <HeartCrack className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">
              That's Everyone for Today!
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              You've swiped through all available JC Bose UST profiles. Check back later or review your incoming requests!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={getFeed}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Deck
            </button>

            <Link
              to="/requests"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-sm transition-all"
            >
              See Who Liked You
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;
