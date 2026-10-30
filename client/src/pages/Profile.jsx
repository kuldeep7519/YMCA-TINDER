import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addUser } from "../utils/userSlice";
import { YMCA_BRANCHES, YEARS, INTEREST_TAGS } from "../utils/constants";
import { Save, Sparkles, CheckCircle2, GraduationCap, BookOpen, Flame, User as UserIcon } from "lucide-react";

const Profile = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: 20,
    gender: "male",
    branch: YMCA_BRANCHES[0],
    year: "3rd Year (Junior)",
    photoUrl: "",
    bio: "",
    interest: [],
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        age: user.age || 20,
        gender: user.gender || "male",
        branch: user.branch || YMCA_BRANCHES[0],
        year: user.year || "3rd Year (Junior)",
        photoUrl: user.photoUrl || "",
        bio: user.bio || "",
        interest: user.interest || [],
      });
    }
  }, [user]);

  const toggleInterest = (tag) => {
    const exists = formData.interest.includes(tag);
    if (exists) {
      setFormData({
        ...formData,
        interest: formData.interest.filter((t) => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        interest: [...formData.interest, tag],
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        age: Number(formData.age),
        gender: formData.gender,
        branch: formData.branch,
        year: formData.year,
        photoUrl: formData.photoUrl,
        bio: formData.bio,
        interest: formData.interest,
      };

      const res = await axiosClient.patch("/profile/edit", payload);
      dispatch(addUser(res.data.data));
      setSuccessMessage("Your YMCA profile was successfully updated! ✨");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Edit Your Campus Profile</h1>
        <p className="text-slate-400 text-sm">
          Keep your profile fresh to get more matches across YMCA University
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 bg-[#161820] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
          {successMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm animate-fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Age</label>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                <label className="text-xs font-semibold text-slate-300">Branch / Department</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
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
                <label className="text-xs font-semibold text-slate-300">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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

            {/* Photo URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Profile Photo URL</label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">Bio</label>
                <span className="text-slate-400">{formData.bio?.length || 0}/250</span>
              </div>
              <textarea
                rows={3}
                maxLength={250}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-[#1F222C] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            {/* Interests Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Interests & Hobbies ({formData.interest?.length || 0} selected)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {INTEREST_TAGS.map((tag) => {
                  const selected = formData.interest?.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                        selected
                          ? "bg-red-500/20 border-red-500/50 text-red-300 font-semibold"
                          : "bg-[#1F222C] border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Live Preview Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF4458]" />
            Live Card Preview (What Others See)
          </div>

          <div className="relative w-full max-w-sm h-[520px] rounded-3xl overflow-hidden shadow-2xl bg-[#16181F] border border-white/10">
            <img
              src={
                formData.photoUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500"
              }
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500";
              }}
            />

            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90">
              <Flame className="w-3.5 h-3.5 text-[#FF4458] fill-[#FF4458]" />
              <span>JC Bose UST Verified</span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none" />

            <div className="absolute bottom-0 inset-x-0 p-5 z-20 space-y-2">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-white">
                  {formData.firstName || "Your"} {formData.lastName || "Name"}
                </h3>
                <span className="text-xl font-bold text-slate-200">
                  {formData.age}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs">
                {formData.branch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-md text-white">
                    <GraduationCap className="w-3 h-3 text-[#FF6B4A]" />
                    {formData.branch}
                  </span>
                )}
                {formData.year && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 backdrop-blur-md text-slate-200">
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    {formData.year}
                  </span>
                )}
              </div>

              {formData.bio && (
                <p className="text-slate-200 text-xs italic line-clamp-2">
                  "{formData.bio}"
                </p>
              )}

              {formData.interest?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {formData.interest.slice(0, 4).map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-slate-300 text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
