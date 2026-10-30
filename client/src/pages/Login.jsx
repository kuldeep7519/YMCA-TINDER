import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosClient from "../utils/axiosClient";
import { addUser } from "../utils/userSlice";
import { Flame, Lock, Mail, User, GraduationCap, Calendar, Sparkles, AlertCircle, Image as ImageIcon } from "lucide-react";
import { YMCA_BRANCHES, YEARS, INTEREST_TAGS } from "../utils/constants";

const SAMPLE_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300",
];

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState(20);
  const [gender, setGender] = useState("male");
  const [branch, setBranch] = useState(YMCA_BRANCHES[0]);
  const [year, setYear] = useState("3rd Year (Junior)");
  const [photoUrl, setPhotoUrl] = useState(SAMPLE_AVATARS[0]);
  const [bio, setBio] = useState("Proud JC Bose UST student! Let's grab some Maggi at canteen.");
  const [interest, setInterest] = useState(["💻 Coding", "☕ Chai Pe Charcha", "🏸 Badminton"]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleInterest = (tag) => {
    if (interest.includes(tag)) {
      setInterest(interest.filter((t) => t !== tag));
    } else {
      setInterest([...interest, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Register API
        const res = await axiosClient.post("/signup", {
          firstName,
          lastName,
          email,
          password,
          age: Number(age),
          gender,
          branch,
          year,
          photoUrl,
          bio,
          interest,
        });

        // Backend returns token and user
        dispatch(addUser(res.data.user || res.data.data));
        navigate("/");
      } else {
        // Login API
        const res = await axiosClient.post("/login", {
          email,
          password,
        });

        dispatch(addUser(res.data.user || res.data.data));
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Authentication failed. Please check your inputs."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10 relative">
      {/* Background glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl bg-[#161820]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF4458] to-[#FF6B4A] shadow-lg shadow-red-500/25 mb-1">
            <Flame className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {isSignUp ? "Join YMCA Match" : "Welcome Back"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isSignUp
              ? "Connect with batchmates, seniors & crush at JC Bose UST"
              : "Sign in to see who liked your profile today"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#0F1117] p-1 rounded-2xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              !isSignUp
                ? "bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white shadow-md shadow-red-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isSignUp
                ? "bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white shadow-md shadow-red-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{typeof error === "string" ? error : JSON.stringify(error)}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sign Up Specific Fields */}
          {isSignUp && (
            <>
              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Rahul"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#1F222C] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    placeholder="Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="60"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="others">Other</option>
                  </select>
                </div>
              </div>

              {/* Branch & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Branch / Dept</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors truncate"
                  >
                    {YMCA_BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">College Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profile Photo selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Profile Photo</span>
                  <span className="text-[11px] text-slate-400">Choose preset or paste URL</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {SAMPLE_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                        photoUrl === url ? "border-[#FF4458] scale-105 ring-2 ring-red-500/20" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-[#1F222C] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Bio</label>
                <textarea
                  rows={2}
                  maxLength={250}
                  placeholder="What are you looking for on campus?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              {/* Interests Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select Interests & Hobbies ({interest.length} picked)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {INTEREST_TAGS.map((tag) => {
                    const selected = interest.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleInterest(tag)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          selected
                            ? "bg-red-500/20 border-red-500/40 text-red-300 font-semibold"
                            : "bg-[#1F222C] border-white/5 text-slate-400 hover:text-white hover:border-white/15"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Student Email {isSignUp && <span className="text-slate-400 font-normal">(@jcboseust.ac.in or personal)</span>}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="student@jcboseust.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1F222C] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1F222C] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-base shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : isSignUp ? (
              <>
                <Sparkles className="w-5 h-5" />
                Create YMCA Account
              </>
            ) : (
              "Sign In to Discover"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
