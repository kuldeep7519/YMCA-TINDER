import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addFeed, removeUserFromFeed } from "../utils/feedSlice";
import SwipeCard from "../components/SwipeCard";
import MatchModal from "../components/MatchModal";
import FilterModal from "../components/FilterModal";
import TeaserFeed from "../components/TeaserFeed";
import DailyLimitModal from "../components/DailyLimitModal";
import {
  RefreshCw,
  Sparkles,
  HeartCrack,
  Users,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { Link } from "react-router-dom";

const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const loggedInUser = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [matchedUser, setMatchedUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [swipeQuota, setSwipeQuota] = useState(null);

  const [filters, setFilters] = useState({
    gender: "all",
    branch: "all",
    year: "all",
  });

  const activeFilterCount =
    (filters.gender !== "all" ? 1 : 0) +
    (filters.branch !== "all" ? 1 : 0) +
    (filters.year !== "all" ? 1 : 0);

  const getFeed = async (activeFilters = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.gender !== "all") params.gender = activeFilters.gender;
      if (activeFilters.branch !== "all") params.branch = activeFilters.branch;
      if (activeFilters.year !== "all") params.year = activeFilters.year;

      const res = await axiosClient.get("/user/feed", { params });
      dispatch(addFeed(res.data.data));
      if (res.data.quota) {
        setSwipeQuota(res.data.quota);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInUser && !feed) {
      getFeed();
    }
  }, [feed, loggedInUser]);

  // If visitor is unauthenticated, render the Teaser / Blurred Feed
  if (!loggedInUser) {
    return <TeaserFeed />;
  }

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    getFeed(newFilters);
    setToastMessage("Preferences updated! Loading customized feed...");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleResetFilters = () => {
    const defaultFilters = { gender: "all", branch: "all", year: "all" };
    setFilters(defaultFilters);
    getFeed(defaultFilters);
    setToastMessage("Filters reset to all YMCA students.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSwipe = async (status, targetUserId) => {
    // If daily campus swipe limit reached on like/superlike, show limit modal
    if (
      (status === "interested" || status === "superlike") &&
      swipeQuota &&
      swipeQuota.remainingSwipes <= 0
    ) {
      setShowDailyLimitModal(true);
      return;
    }

    const currentCard = feed?.find((u) => u._id === targetUserId);

    // Optimistically remove card from deck
    dispatch(removeUserFromFeed(targetUserId));

    try {
      const res = await axiosClient.post(`/request/send/${status}/${targetUserId}`);

      if (res.data?.remainingSwipes !== undefined) {
        setSwipeQuota((prev) => ({
          ...prev,
          remainingSwipes: res.data.remainingSwipes,
          dailyLimit: res.data.dailyLimit || 20,
        }));
      }

      if (status === "superlike") {
        setToastMessage(`You Super Liked ${currentCard?.firstName || "this student"}! ⭐ Campus Crush sent!`);
      } else if (status === "interested") {
        setToastMessage(`You liked ${currentCard?.firstName || "this student"}! 💖`);
      } else {
        setToastMessage(`Passed on ${currentCard?.firstName || "student"}.`);
      }

      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      if (err.response?.status === 429 || err.response?.data?.limitReached) {
        setSwipeQuota((prev) => ({ ...prev, remainingSwipes: 0 }));
        setShowDailyLimitModal(true);
      }
      console.error("Error sending swipe:", err);
    }
  };

  const handleBlock = async (targetUserId) => {
    const student = feed?.find((u) => u._id === targetUserId);
    dispatch(removeUserFromFeed(targetUserId));
    try {
      await axiosClient.post(`/user/block/${targetUserId}`);
      setToastMessage(`Blocked ${student?.firstName || "user"}. They won't appear again.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  const handleReport = (targetUserId, wasBlocked) => {
    if (wasBlocked) {
      dispatch(removeUserFromFeed(targetUserId));
    }
    setToastMessage("Report submitted. Thank you for keeping YMCA Match safe.");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 z-40 bg-[#111422]/95 backdrop-blur-xl border border-purple-500/30 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A855F7]" />
          {toastMessage}
        </div>
      )}

      {/* Discovery Filters Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Match Popup Modal */}
      <MatchModal
        isOpen={!!matchedUser}
        matchedUser={matchedUser}
        loggedInUser={loggedInUser}
        onClose={() => setMatchedUser(null)}
      />

      {/* Daily Campus Swipe Limit Modal */}
      <DailyLimitModal
        isOpen={showDailyLimitModal}
        onClose={() => setShowDailyLimitModal(false)}
        dailyLimit={swipeQuota?.dailyLimit || 20}
      />

      {/* Discovery Header Controls */}
      <div className="w-full max-w-sm sm:max-w-md flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Flame className="w-4 h-4 text-[#A855F7] fill-[#A855F7]" />
            <span>Discover</span>
          </div>

          {/* Daily Swipes Counter Badge */}
          {swipeQuota && (
            <button
              onClick={() => {
                if (swipeQuota.remainingSwipes <= 0) setShowDailyLimitModal(true);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                swipeQuota.remainingSwipes === 0
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300 cursor-pointer animate-pulse"
                  : swipeQuota.remainingSwipes <= 5
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                  : "bg-purple-500/15 border-purple-500/30 text-purple-300"
              }`}
              title="Daily free campus swipes left for today (Resets at midnight)"
            >
              <Sparkles className="w-3 h-3 text-[#EC4899]" />
              <span>{swipeQuota.remainingSwipes}/{swipeQuota.dailyLimit || 20} left</span>
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            activeFilterCount > 0
              ? "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/20"
              : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-4 text-center py-20">
          <span className="loading loading-spinner loading-lg text-[#A855F7]"></span>
          <p className="text-slate-400 font-medium text-sm animate-pulse">
            Finding YMCA students near you...
          </p>
        </div>
      ) : feed && feed.length > 0 ? (
        <div className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center">
          {/* Deck Stacking Effect */}
          {feed.length > 1 && (
            <div className="absolute top-2 w-[92%] h-[560px] sm:h-[620px] rounded-3xl bg-[#0c0d16] border border-white/5 opacity-50 scale-95 pointer-events-none -z-10 shadow-lg" />
          )}

          {/* Top Card */}
          <SwipeCard
            key={feed[0]._id}
            user={feed[0]}
            isTop={true}
            onSwipe={handleSwipe}
            onBlock={handleBlock}
            onReport={handleReport}
          />

          {/* Remaining Count Indicator */}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <Users className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>{feed.length} students in queue</span>
            {activeFilterCount > 0 && (
              <span className="text-[#EC4899] text-[11px] font-bold">
                ({activeFilterCount} filter active)
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Empty Deck State */
        <div className="max-w-md w-full bg-[#111422] rounded-3xl p-8 text-center border border-white/10 shadow-2xl space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-[#A855F7]">
            <HeartCrack className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">
              {activeFilterCount > 0 ? "No Students Match Filters" : "That's Everyone for Today!"}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {activeFilterCount > 0
                ? "Try broadening your department, gender, or academic year preferences to discover more YMCA students."
                : "You've swiped through all available JC Bose UST profiles. Check back later or review your incoming requests!"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {activeFilterCount > 0 ? (
              <button
                onClick={handleResetFilters}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filters & Refresh
              </button>
            ) : (
              <button
                onClick={() => getFeed()}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Deck
              </button>
            )}

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
