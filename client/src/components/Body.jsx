import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import axiosClient from "../utils/axiosClient";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { Heart, Flame } from "lucide-react";

const Body = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get("/profile/view");
      const userData = res.data.user || res.data;
      dispatch(addUser(userData));
    } catch (err) {
      // If unauthorized and not on login page, redirect to login
      if (location.pathname !== "/login") {
        navigate("/login");
      }
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    if (!user) {
      fetchProfile();
    } else {
      setCheckingAuth(false);
    }
  }, [user]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF4458] to-[#FF6B4A] flex items-center justify-center shadow-xl shadow-red-500/30 animate-pulse">
          <Flame className="w-8 h-8 text-white fill-white" />
        </div>
        <p className="text-slate-400 font-semibold text-sm">
          Loading YMCA Match...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col justify-between selection:bg-[#FF4458] selection:text-white">
      <div>
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-4 text-center mt-12 bg-[#0C0E14]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#FF4458] fill-[#FF4458]" />
            <span className="font-bold text-slate-400">YMCA Match</span>
            <span>— The Official JC Bose UST Dating & Campus Network</span>
          </div>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for YMCA Students
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Body;
