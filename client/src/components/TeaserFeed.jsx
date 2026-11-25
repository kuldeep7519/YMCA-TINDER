import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  X,
  Star,
  Sparkles,
  Lock,
  Unlock,
  GraduationCap,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Mic,
  Zap,
  Coffee,
  Eye,
  Info,
  Radio,
  MapPin,
  MessageCircle,
} from "lucide-react";
import axiosClient from "../utils/axiosClient";

const FALLBACK_TEASER_PROFILES = [
  {
    _id: "teaser_1",
    firstName: "Aanchal",
    age: 20,
    gender: "female",
    branch: "Computer Engineering (CE)",
    year: "3rd Year",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    bio: "Looking for someone to explain DSA and share Maggi at Canteen 🍜 | Culmyca dancer ✨",
    interest: ["Coding", "NescafeChai", "Dance", "HostelLife"],
  },
  {
    _id: "teaser_2",
    firstName: "Rohan",
    age: 21,
    gender: "male",
    branch: "Mechanical Engineering (ME)",
    year: "4th Year",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    bio: "Final year Mech engineer surviving on 2 hours of sleep and Nescafe cutting chai ☕",
    interest: ["Gym", "LateNightRides", "RockMusic", "Badminton"],
  },
  {
    _id: "teaser_3",
    firstName: "Priya",
    age: 19,
    gender: "female",
    branch: "Information Technology (IT)",
    year: "2nd Year",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    bio: "Always down for spontaneous road trips outside campus gate & fest prep meetings 🎸",
    interest: ["Photography", "FestCoordinator", "Aesthetics", "Chai"],
  },
  {
    _id: "teaser_4",
    firstName: "Aryan",
    age: 20,
    gender: "male",
    branch: "Electrical Engineering (EE)",
    year: "3rd Year",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    bio: "Will debug your circuit and make you laugh between back-to-back lectures ⚡",
    interest: ["Anime", "Guitar", "Gaming", "StreetFood"],
  },
  {
    _id: "teaser_5",
    firstName: "Sneha",
    age: 21,
    gender: "female",
    branch: "Electronics & Comm (ECE)",
    year: "Final Year",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
    bio: "Hostel terrace gossip > Any Netflix series 🌙 Book lover & coffee addict",
    interest: ["Books", "SunsetWalks", "Coffee", "Podcasts"],
  },
];

const LIVE_CAMPUS_RADAR_ALERTS = [
  {
    id: 1,
    title: "Swipe Right in CS!",
    dept: "Computer Engg (3rd Yr)",
    badge: "💖 Match Alert",
    time: "2m ago",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  },
  {
    id: 2,
    title: "🔥 7-Day Streak Active!",
    dept: "Boys Hostel 2",
    badge: "🔥 Hot Streak",
    time: "1m ago",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    id: 3,
    title: "Canteen Chai Partner Found",
    dept: "Mechanical Dept",
    badge: "☕ Chai Date",
    time: "4m ago",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  {
    id: 4,
    title: "⭐ Secret Crush Notification",
    dept: "Information Tech",
    badge: "⭐ Crush Sent",
    time: "3m ago",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  },
  {
    id: 5,
    title: "⚡ 98% Vibe Match!",
    dept: "Electrical Engg",
    badge: "⚡ Chemistry",
    time: "Just now",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    id: 6,
    title: "🎙️ Late-Night Voice Note",
    dept: "Girls Hostel",
    badge: "🎙️ Voice Audio",
    time: "15s ago",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
];

const TeaserFeed = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(FALLBACK_TEASER_PROFILES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    totalSwiping: 52,
    departments: ["CS", "Mechanical", "Electrical", "IT", "ECE"],
    campus: "JC Bose UST (YMCA), Faridabad",
    activeNow: 24,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalAction, setModalAction] = useState("swipe");
  const [targetStudentName, setTargetStudentName] = useState("");
  const [swipeAnim, setSwipeAnim] = useState(null);

  const canvasRef = useRef(null);

  // 1. Fetch real + curated teaser profiles
  useEffect(() => {
    const fetchTeasers = async () => {
      try {
        const res = await axiosClient.get("/user/teaser-feed");
        if (res.data?.success && res.data?.data?.length > 0) {
          setProfiles(res.data.data);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      } catch (err) {}
    };
    fetchTeasers();
  }, []);

  // 2. Cosmic Constellation & Radar Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes definition
    const particleCount = Math.min(36, Math.floor(width / 38));
    const particles = [];
    const colors = ["#8B5CF6", "#EC4899", "#6366F1", "#A855F7", "#38BDF8"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 1,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw constellation connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Connect to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.22 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Connect to cursor if close
        const mdx = p1.x - mouse.x;
        const mdy = p1.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 140) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(236, 72, 153, ${0.4 * (1 - mdist / 140)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw glowing particle node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.globalAlpha = p1.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p1.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const currentProfile = profiles[currentIndex] || profiles[0];
  const nextProfile = profiles[(currentIndex + 1) % profiles.length];

  const handleAction = (type) => {
    setModalAction(type);
    setTargetStudentName(currentProfile?.firstName || "this student");
    setShowAuthModal(true);

    if (type === "like") setSwipeAnim("right");
    else if (type === "pass") setSwipeAnim("left");
    else if (type === "superlike") setSwipeAnim("up");

    setTimeout(() => {
      setSwipeAnim(null);
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
    }, 380);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start p-3 sm:p-6 overflow-hidden select-none">
      {/* ======================================================== */}
      {/* 1. INTERACTIVE CANVAS CONSTELLATION NETWORK              */}
      {/* ======================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* ======================================================== */}
      {/* 2. CIRCULAR CAMPUS RADAR & EXPANDING PULSE RINGS         */}
      {/* ======================================================== */}
      <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 flex items-center justify-center">
        {/* Radar Ring 1 */}
        <div className="w-[320px] h-[320px] rounded-full border border-purple-500/15 animate-ping [animation-duration:4s]" />
        {/* Radar Ring 2 */}
        <div className="absolute w-[480px] h-[480px] rounded-full border border-pink-500/10" />
        {/* Radar Ring 3 */}
        <div className="absolute w-[680px] h-[680px] rounded-full border border-indigo-500/10 border-dashed animate-spin [animation-duration:50s]" />
        {/* Rotating Radar Sweep Beam */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-600/10 via-pink-500/5 to-transparent animate-spin [animation-duration:12s] opacity-75" />

        {/* Pulsing Landmark Radar Blips */}
        <div className="absolute -top-40 -left-48 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-purple-500/30 text-[10px] font-bold text-purple-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span>☕ Nescafe Tapri (14 Singles)</span>
        </div>

        <div className="absolute -top-36 right-48 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-pink-500/30 text-[10px] font-bold text-pink-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
          <span>🍜 Central Canteen (19 Singles)</span>
        </div>

        <div className="absolute bottom-20 -left-52 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>🛠️ Mech Workshop (9 Singles)</span>
        </div>

        <div className="absolute bottom-24 right-52 hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-sky-500/30 text-[10px] font-bold text-sky-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>🏢 Hostel Gate 2 (22 Singles)</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FLOATING 3D CAMPUS EMOJIS (Drifting across screen)     */}
      {/* ======================================================== */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[18%] left-[7%] animate-float-slow opacity-30 text-3xl">☕</div>
        <div className="absolute top-[28%] right-[8%] animate-float-reverse opacity-35 text-3xl">🍜</div>
        <div className="absolute bottom-[24%] left-[10%] animate-float-reverse opacity-25 text-3xl">💻</div>
        <div className="absolute bottom-[18%] right-[12%] animate-float-slow opacity-30 text-3xl">💖</div>
        <div className="absolute top-[68%] left-[4%] animate-float-slow opacity-20 text-2xl">🔥</div>
        <div className="absolute top-[12%] right-[22%] animate-float-slow opacity-25 text-2xl">⚡</div>
      </div>

      {/* ======================================================== */}
      {/* 4. LIVE CAMPUS ACTIVITY STREAM (Left & Right Flanks)      */}
      {/* ======================================================== */}
      {/* Left Flank Alerts */}
      <div className="hidden xl:flex flex-col gap-3 absolute left-6 top-28 w-64 z-10 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-extrabold text-purple-300 w-fit mb-1">
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Live YMCA Radar Feed</span>
        </div>
        {LIVE_CAMPUS_RADAR_ALERTS.slice(0, 3).map((item, idx) => (
          <div
            key={item.id}
            onClick={() => handleAction("live_feed")}
            style={{ animationDelay: `${idx * 0.4}s` }}
            className="p-3 rounded-2xl bg-[#0F1222]/80 hover:bg-[#151930] backdrop-blur-xl border border-white/10 hover:border-purple-500/40 shadow-xl transition-all cursor-pointer group space-y-1 animate-slide-up"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className={`px-2 py-0.5 rounded-md font-black border ${item.badgeColor}`}>
                {item.badge}
              </span>
              <span className="text-slate-400">{item.time}</span>
            </div>
            <p className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
              {item.title}
            </p>
            <p className="text-[10px] text-slate-400">{item.dept}</p>
          </div>
        ))}
      </div>

      {/* Right Flank Alerts */}
      <div className="hidden xl:flex flex-col gap-3 absolute right-6 top-28 w-64 z-10 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] font-extrabold text-pink-300 w-fit mb-1">
          <Zap className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>Real-time Swipes</span>
        </div>
        {LIVE_CAMPUS_RADAR_ALERTS.slice(3, 6).map((item, idx) => (
          <div
            key={item.id}
            onClick={() => handleAction("live_feed")}
            style={{ animationDelay: `${idx * 0.5}s` }}
            className="p-3 rounded-2xl bg-[#0F1222]/80 hover:bg-[#151930] backdrop-blur-xl border border-white/10 hover:border-pink-500/40 shadow-xl transition-all cursor-pointer group space-y-1 animate-slide-up"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className={`px-2 py-0.5 rounded-md font-black border ${item.badgeColor}`}>
                {item.badge}
              </span>
              <span className="text-slate-400">{item.time}</span>
            </div>
            <p className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
              {item.title}
            </p>
            <p className="text-[10px] text-slate-400">{item.dept}</p>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 5. TOP LIVE ACTIVITY TICKER & FOMO BANNER                */}
      {/* ======================================================== */}
      <div className="w-full max-w-lg mx-auto text-center space-y-2 mb-3 z-10 animate-fade-in relative">
        {/* Pulsing Live Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-4" />
          <span>CAMPUS RADAR ACTIVE</span>
          <span className="text-white/40">•</span>
          <span className="text-white font-black">{stats.totalSwiping}+ Students Swiping</span>
        </div>

        {/* Dynamic Campus Headline */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
          50+ students from{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            CS, Mechanical & Electrical
          </span>{" "}
          are swiping right now! 🔥
        </h1>

        <p className="text-xs text-slate-400 max-w-md mx-auto">
          YMCA's official matchmaking & networking deck. Preview profiles below or sign in to unblur and match!
        </p>

        {/* Department Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {["Computer Engg", "Mechanical", "IT", "Electrical", "ECE"].map((dept) => (
            <button
              key={dept}
              onClick={() => handleAction("filter")}
              className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-[11px] font-semibold text-slate-300 transition-colors"
            >
              #{dept}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. THE TEASER SWIPE CARD DECK                            */}
      {/* ======================================================== */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[460px] sm:h-[490px] flex items-center justify-center z-10">
        {/* Background Card for 3D stack depth */}
        {nextProfile && (
          <div className="absolute inset-0 scale-95 translate-y-3 opacity-40 rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl pointer-events-none blur-[2px]">
            <img
              src={nextProfile.photoUrl}
              alt=""
              className="w-full h-full object-cover filter blur-lg"
            />
          </div>
        )}

        {/* Foreground Active Teaser Card */}
        {currentProfile && (
          <div
            className={`relative w-full h-full rounded-3xl overflow-hidden bg-[#131625] border border-white/15 shadow-2xl transition-all duration-300 flex flex-col justify-end group ${
              swipeAnim === "left"
                ? "-translate-x-32 -rotate-12 opacity-0"
                : swipeAnim === "right"
                ? "translate-x-32 rotate-12 opacity-0"
                : swipeAnim === "up"
                ? "-translate-y-32 scale-95 opacity-0"
                : "translate-x-0 rotate-0 opacity-100"
            }`}
          >
            {/* Blurred Image with Frosted Glass Privacy Effect */}
            <div className="absolute inset-0">
              <img
                src={currentProfile.photoUrl}
                alt={currentProfile.firstName}
                className="w-full h-full object-cover filter blur-[8px] scale-105 transition-all duration-500 group-hover:blur-[6px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D17] via-[#0B0D17]/60 to-black/30" />
            </div>

            {/* Privacy Lock Badge & Unblur Prompt in Center of Photo */}
            <div
              onClick={() => handleAction("unblur")}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-[280px] p-4 rounded-2xl bg-black/65 backdrop-blur-xl border border-purple-500/30 shadow-2xl text-center space-y-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group/lock"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-purple-500/40 flex items-center justify-center mx-auto text-[#EC4899] shadow-lg group-hover/lock:rotate-12 transition-transform">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs font-black text-white tracking-wide">
                Photo Blurred for Safety
              </p>
              <p className="text-[10px] text-purple-200/90 leading-tight">
                Sign in with YMCA student ID to unblur full photo & details ✨
              </p>
              <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500 hover:to-pink-500 text-[10px] font-bold text-white border border-purple-500/30 mt-1 shadow-sm transition-all">
                Tap to Unblur 🔓
              </span>
            </div>

            {/* Card Content & Student Information */}
            <div className="relative p-5 space-y-3 z-10 text-white">
              {/* Department & Year Pill */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-[11px] font-extrabold text-purple-300">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{currentProfile.branch}</span>
                </span>
                <span className="px-2 py-1 rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
                  {currentProfile.year || "Student"}
                </span>
              </div>

              {/* Name & Age */}
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>
                    {currentProfile.firstName}, {currentProfile.age}
                  </span>
                  <span
                    className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center text-xs font-bold"
                    title="YMCA Verified"
                  >
                    ✓
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 italic">
                  "{currentProfile.bio || "JC Bose UST student exploring campus connections ☕"}"
                </p>
              </div>

              {/* Interest Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(currentProfile.interest || []).slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] font-semibold text-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center justify-center gap-4">
                {/* Pass Button */}
                <button
                  type="button"
                  onClick={() => handleAction("pass")}
                  className="w-13 h-13 rounded-full bg-white/10 hover:bg-rose-500/20 border border-white/15 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-all hover:scale-115 active:scale-95 shadow-lg group/btn"
                  title="Pass"
                >
                  <X className="w-6 h-6 group-hover/btn:rotate-90 transition-transform" />
                </button>

                {/* Super Like Button */}
                <button
                  type="button"
                  onClick={() => handleAction("superlike")}
                  className="w-11 h-11 rounded-full bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 flex items-center justify-center transition-all hover:scale-115 active:scale-95 shadow-lg group/btn"
                  title="Super Like / Secret Crush"
                >
                  <Star className="w-5 h-5 group-hover/btn:scale-125 transition-transform" />
                </button>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={() => handleAction("like")}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#EC4899] to-[#8B5CF6] text-white flex items-center justify-center transition-all hover:scale-115 active:scale-95 shadow-xl shadow-pink-500/30 group/btn"
                  title="Swipe Right / Like"
                >
                  <Heart className="w-7 h-7 fill-white group-hover/btn:scale-125 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. BOTTOM VALUE REASSURANCE                              */}
      {/* ======================================================== */}
      <div className="w-full max-w-sm mt-3 text-center z-10 flex items-center justify-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Only Verified YMCA IDs</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          <span>Privacy Blurred Previews</span>
        </span>
      </div>

      {/* ======================================================== */}
      {/* 8. HIGH-CONVERTING SIGN-IN / CURIOSITY MODAL             */}
      {/* ======================================================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#121526] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-white relative text-center">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-[#EC4899] shadow-xl shadow-purple-500/20">
              <Lock className="w-7 h-7 text-pink-400 animate-pulse" />
            </div>

            {/* Modal Heading */}
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-[10px] font-black uppercase tracking-wider text-purple-300">
                JC Bose UST Exclusive
              </span>
              <h3 className="text-xl font-black text-white leading-snug">
                Sign in with YMCA Student ID to see who's waiting for you!
              </h3>
              <p className="text-xs text-slate-300">
                {targetStudentName
                  ? `You tried to interact with ${targetStudentName}. Create a free profile to match & chat!`
                  : "Join 50+ students from CS, Mechanical, Electrical & IT swiping right now."}
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>See 100% unblurred photos & full bios</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span>Swipe right & match with your campus crush</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Send voice notes & build daily chat streaks</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>100% safe & verified college community</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-black text-sm shadow-xl shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In with Student Email</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Continue Previewing Blurred Profiles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeaserFeed;
