import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Flame, Heart, Sparkles, User as UserIcon, LogOut, MessageCircleHeart } from "lucide-react";
import axiosClient from "../utils/axiosClient";
import { removeUser } from "../utils/userSlice";

const Navbar = () => {
  const user = useSelector((store) => store.user);
  const requests = useSelector((store) => store.requests);
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axiosClient.post("/logout");
      dispatch(removeUser());
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-nav transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF4458] to-[#FF6B4A] flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-105 transition-transform duration-200">
            <Flame className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-rose-200 bg-clip-text text-transparent">
                YMCA<span className="text-[#FF4458]">Match</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest hidden sm:inline-block">
                JC Bose UST
              </span>
            </div>
          </div>
        </Link>

        {/* Center Navigation (when logged in) */}
        {user && (
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive("/")
                  ? "bg-red-500/15 text-[#FF4458] border border-red-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden md:inline">Discover</span>
            </Link>

            <Link
              to="/matches"
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                isActive("/matches")
                  ? "bg-red-500/15 text-[#FF4458] border border-red-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageCircleHeart className="w-4 h-4" />
              <span className="hidden md:inline">Matches</span>
              {connections && connections.length > 0 && (
                <span className="badge badge-xs bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold px-1.5 py-2 border-0">
                  {connections.length}
                </span>
              )}
            </Link>

            <Link
              to="/requests"
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                isActive("/requests")
                  ? "bg-red-500/15 text-[#FF4458] border border-red-500/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Requests</span>
              {requests && requests.length > 0 && (
                <span className="badge badge-xs bg-red-500 text-white font-bold px-1.5 py-2 border-0 animate-bounce">
                  {requests.length}
                </span>
              )}
            </Link>
          </nav>
        )}

        {/* Right Section / Profile dropdown */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-circle avatar border border-white/10 hover:border-red-500/50 transition-colors p-0.5"
              >
                <div className="w-9 h-9 rounded-full ring-2 ring-red-500/20 overflow-hidden">
                  <img
                    src={user.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"}
                    alt={user.firstName}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";
                    }}
                  />
                </div>
              </label>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-[#181A20] rounded-2xl w-56 border border-white/10 text-slate-200"
              >
                <li className="px-3 py-2 border-b border-white/5">
                  <p className="font-bold text-white text-base">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-red-400 font-medium">
                    {user.branch || "YMCA Student"}
                  </p>
                </li>
                <li>
                  <Link to="/profile" className="flex items-center gap-2 py-2 mt-1 hover:bg-white/5 rounded-xl">
                    <UserIcon className="w-4 h-4 text-red-400" />
                    Edit Profile
                  </Link>
                </li>
                <li>
                  <Link to="/matches" className="flex items-center gap-2 py-2 hover:bg-white/5 rounded-xl">
                    <Heart className="w-4 h-4 text-pink-400" />
                    My Matches
                  </Link>
                </li>
                <div className="divider my-1 before:bg-white/5 after:bg-white/5"></div>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] hover:opacity-90 shadow-md shadow-red-500/25 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
