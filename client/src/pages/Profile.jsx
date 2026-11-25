import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { addUser } from "../utils/userSlice";
import { YMCA_BRANCHES, YEARS, INTEREST_TAGS } from "../utils/constants";
import { compressImage } from "../utils/imageCompressor";
import {
  Save,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Flame,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Moon,
  EyeOff,
  Eye,
} from "lucide-react";

const Profile = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

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
    isPaused: false,
  });

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
        isPaused: user.isPaused || false,
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

  // Handle Photo Upload directly from phone camera/gallery or laptop
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    const previousPhotoUrl = formData.photoUrl;

    try {
      setUploadingPhoto(true);
      setErrorMessage(null);

      // Compress large phone/camera images (e.g. 5MB-10MB -> ~180KB) to prevent HTTP 413
      const compressedFile = await compressImage(file, 1200, 0.82);

      const uploadData = new FormData();
      uploadData.append("photo", compressedFile);

      const res = await axiosClient.post("/upload/profile-photo", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.photoUrl) {
        setFormData((prev) => ({
          ...prev,
          photoUrl: res.data.photoUrl,
        }));

        if (res.data.user) {
          dispatch(addUser(res.data.user));
        }

        setSuccessMessage("Photo successfully uploaded and saved! 📸");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error("No photo URL returned from server");
      }
    } catch (err) {
      // Revert to previous valid photoUrl so user never gets stuck with a blob
      setFormData((prev) => ({
        ...prev,
        photoUrl: previousPhotoUrl,
      }));
      setErrorMessage(
        err.response?.status === 413
          ? "Photo file is too large. Please select a smaller photo."
          : err.response?.data?.message || err.message || "Photo upload failed"
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Toggle Snooze / Pause Profile
  const handleTogglePause = async (nextPausedState) => {
    try {
      const res = await axiosClient.patch("/profile/edit", {
        isPaused: nextPausedState,
      });
      dispatch(addUser(res.data.data));
      setFormData((prev) => ({ ...prev, isPaused: nextPausedState }));

      setSuccessMessage(
        nextPausedState
          ? "Discovery paused. You are now hidden from the Discover feed."
          : "Discovery resumed! You are visible on the campus queue again. 🔥"
      );
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setErrorMessage("Failed to toggle snooze mode.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (uploadingPhoto) {
      setErrorMessage("Please wait for your photo to finish uploading.");
      return;
    }

    if (formData.photoUrl && formData.photoUrl.startsWith("blob:")) {
      setErrorMessage("Photo upload is invalid or still in progress. Please re-upload.");
      return;
    }

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: Number(formData.age),
        gender: formData.gender,
        branch: formData.branch,
        year: formData.year,
        photoUrl: formData.photoUrl,
        bio: formData.bio,
        interest: formData.interest,
        isPaused: formData.isPaused,
      };

      const res = await axiosClient.patch("/profile/edit", payload);
      dispatch(addUser(res.data.data));
      setSuccessMessage("Your YMCA profile was successfully updated! ✨");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-lg">
          <span className="text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Snooze / Pause Profile Banner */}
      <div className="mb-8 bg-[#181A20] border border-white/10 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {formData.isPaused ? (
              <Moon className="w-5 h-5 text-amber-400" />
            ) : (
              <Flame className="w-5 h-5 text-[#FF4458]" />
            )}
            <h3 className="text-sm font-bold text-white">
              Snooze / Pause Discovery
            </h3>
            {formData.isPaused ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> Paused
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Active on Feed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Temporarily hide your profile from other students in the JC Bose UST Discover queue (great during semester exams or when you want a break). Existing matches and chat remain 100% active.
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-white/5 px-4 py-2 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
          <span className="text-xs font-semibold text-slate-300">
            {formData.isPaused ? "Paused" : "Active"}
          </span>
          <input
            type="checkbox"
            checked={formData.isPaused}
            onChange={(e) => handleTogglePause(e.target.checked)}
            className="checkbox checkbox-sm checkbox-error"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-[#161820] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF4458] to-[#FF6B4A] flex items-center justify-center text-white shadow-md shadow-red-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Edit Profile</h2>
              <p className="text-xs text-slate-400">
                Update your details visible to JC Bose UST students
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Device Photo Upload Banner */}
            <div className="p-4 rounded-2xl bg-[#1B1E28] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FF4458]" />
                    Profile Picture
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Upload from your phone camera, gallery, or laptop files
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadingPhoto ? "Uploading..." : "Upload New Photo"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {uploadingPhoto ? (
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
                    <span className="loading loading-spinner loading-sm text-red-400"></span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <p className="text-red-400 font-semibold">Compressing & uploading photo...</p>
                    <p className="text-[11px] text-slate-400">Updating photo in cloud storage</p>
                  </div>
                </div>
              ) : formData.photoUrl && (
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-red-500/30 flex-shrink-0">
                    <img
                      src={formData.photoUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    <span className="text-emerald-400 font-semibold">Active photo:</span>{" "}
                    <span className="truncate">{formData.photoUrl}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full bg-[#1B1E28] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full bg-[#1B1E28] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Age</label>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full bg-[#1B1E28] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full bg-[#1B1E28] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              </div>
            </div>

            {/* YMCA Academic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#FF6B4A]" />
                  Department / Branch
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  className="w-full bg-[#1B1E28] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  {YMCA_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Academic Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="w-full bg-[#1B1E28] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Bio (About You)
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Mention what you're studying, favorite campus hangout spots, hobbies..."
                className="w-full bg-[#1B1E28] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            {/* Campus Interests */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Select Your Campus Interests
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_TAGS.map((tag) => {
                  const selected = formData.interest.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selected
                          ? "bg-red-500/20 border-red-500/60 text-red-300 shadow-sm"
                          : "bg-[#1B1E28] border-white/5 text-slate-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF4458] to-[#FF6B4A] text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving Changes..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Live Card Preview Column */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="sticky top-24 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-[#161820] border border-white/10 h-[560px] relative select-none">
            <img
              src={
                formData.photoUrl ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
              }
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600";
              }}
            />

            {/* Top Verification & Paused badge */}
            <div className="absolute top-4 inset-x-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white">
                <Flame className="w-3.5 h-3.5 text-[#FF4458] fill-[#FF4458]" />
                <span>JC Bose UST</span>
              </div>
              {formData.isPaused && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/80 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 shadow-md">
                  <Moon className="w-3 h-3" /> Snoozed
                </span>
              )}
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
