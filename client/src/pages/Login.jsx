import React, { useState, useRef, useEffect } from "react";
import axiosClient from "../utils/axiosClient";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate, Link } from "react-router-dom";
import { compressImage } from "../utils/imageCompressor";
import {
  Flame,
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  BookOpen,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { YMCA_BRANCHES, YEARS, INTEREST_TAGS } from "../utils/constants";

export const BG_THEMES = {
  midnight: {
    id: "midnight",
    name: "Midnight Campus",
    icon: "🌌",
    tagline: "Cosmic JC Bose UST Night",
    orb1: "bg-purple-600/30",
    orb2: "bg-indigo-600/25",
    orb3: "bg-pink-600/20",
    glowColor: "rgba(168, 85, 247, 0.4)",
    cardBorder: "border-purple-500/25",
    badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  },
  romance: {
    id: "romance",
    name: "Sunset Romance",
    icon: "💖",
    tagline: "Romantic Sunset Dating Vibe",
    orb1: "bg-rose-500/30",
    orb2: "bg-pink-600/25",
    orb3: "bg-amber-500/20",
    glowColor: "rgba(236, 72, 153, 0.4)",
    cardBorder: "border-pink-500/25",
    badgeBg: "bg-pink-500/10 text-pink-300 border-pink-500/30",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Neon",
    icon: "⚡",
    tagline: "Electric Tech & Campus Coders",
    orb1: "bg-cyan-500/30",
    orb2: "bg-emerald-500/25",
    orb3: "bg-violet-600/20",
    glowColor: "rgba(6, 182, 212, 0.4)",
    cardBorder: "border-cyan-500/25",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  },
  canteen: {
    id: "canteen",
    name: "Canteen Chai",
    icon: "☕",
    tagline: "Maggi, Chai & Campus Charcha",
    orb1: "bg-amber-500/30",
    orb2: "bg-orange-600/25",
    orb3: "bg-rose-600/20",
    glowColor: "rgba(249, 115, 22, 0.4)",
    cardBorder: "border-amber-500/25",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  },
};

const Login = () => {
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("ymca_theme") || "midnight";
  });

  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [bio, setBio] = useState("");
  const [interest, setInterest] = useState([]);

  // 6-digit OTP states (Signup)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  // Forgot Password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotTimer, setForgotTimer] = useState(60);
  const [forgotCanResend, setForgotCanResend] = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  const forgotOtpRefs = useRef([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Resend OTP countdown timer (Signup)
  useEffect(() => {
    let interval = null;
    if (step === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  // Resend OTP countdown timer (Forgot Password)
  useEffect(() => {
    let interval = null;
    if (step === "forgot_reset" && forgotTimer > 0) {
      interval = setInterval(() => {
        setForgotTimer((prev) => prev - 1);
      }, 1000);
    } else if (forgotTimer === 0) {
      setForgotCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, forgotTimer]);

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    try {
      localStorage.setItem("ymca_theme", themeId);
    } catch (e) {
      // Ignore storage errors in private browsing
    }
  };

  const currentTheme = BG_THEMES[selectedTheme] || BG_THEMES.midnight;

  const handleDevicePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid photo file (PNG, JPG, WEBP)");
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);

      // Show immediate local preview while uploading
      const localBlob = URL.createObjectURL(file);
      setPreviewUrl(localBlob);
      // Explicitly clear photoUrl so form cannot submit until cloud upload succeeds
      setPhotoUrl("");

      // Compress large phone/camera images (e.g. 5MB-10MB -> ~180KB) to prevent HTTP 413
      const compressedFile = await compressImage(file, 1200, 0.82);

      const uploadData = new FormData();
      uploadData.append("photo", compressedFile);

      const res = await axiosClient.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.photoUrl) {
        setPhotoUrl(res.data.photoUrl);
        setPreviewUrl(res.data.photoUrl);
      } else {
        throw new Error("No photo URL returned from server");
      }
    } catch (err) {
      setPhotoUrl("");
      setPreviewUrl("");
      const errMsg =
        err.response?.status === 413
          ? "Photo is too large. Please select a smaller photo."
          : err.response?.data?.message || err.message || "Failed to upload photo";
      setError(errMsg);
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleInterest = (tag) => {
    if (interest.includes(tag)) {
      setInterest(interest.filter((t) => t !== tag));
    } else {
      setInterest([...interest, tag]);
    }
  };

  // Step 1: Send OTP to Email
  const handleInitiateSignup = async (e) => {
    e?.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (uploadingPhoto) {
      setError("Please wait for your photo to finish uploading.");
      return;
    }

    if (!photoUrl || photoUrl.startsWith("blob:")) {
      setError("Profile photo is compulsory! Please upload a photo of yourself from your phone or laptop.");
      return;
    }

    if (!firstName || !firstName.trim() || !email || !password) {
      setError("Please fill out your name, email, and password.");
      return;
    }

    if (!age || Number(age) < 18 || Number(age) > 60) {
      setError("Please enter your age (must be between 18 and 60).");
      return;
    }

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    if (!branch) {
      setError("Please select your JC Bose UST department/branch.");
      return;
    }

    if (!year) {
      setError("Please select your academic year.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.includes("+")) {
      setError("Email aliases and plus-tags (+tag) are strictly blocked on YMCA Match. Please use your standard email.");
      return;
    }
    const isAllowedEmail = /^[a-zA-Z0-9._%-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalizedEmail);
    if (!isAllowedEmail) {
      setError("Only genuine @gmail.com email addresses are allowed. Temporary, disposable, and fake emails are blocked!");
      return;
    }

    try {
      setOtpSending(true);
      const res = await axiosClient.post("/send-otp", {
        email: email.trim(),
        firstName: firstName.trim(),
      });

      setStep("otp");
      setOtpTimer(60);
      setCanResend(false);
      setInfoMessage("We sent a 6-digit verification code to your email.");
      // Focus first OTP input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setOtpSending(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || otpSending) return;
    try {
      setOtpSending(true);
      setError(null);
      const res = await axiosClient.post("/send-otp", {
        email: email.trim(),
        firstName: firstName.trim(),
      });
      setOtpTimer(60);
      setCanResend(false);
      setInfoMessage("A new 6-digit code has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    } finally {
      setOtpSending(false);
    }
  };

  // OTP Input Changes
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const digit = value.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next box if filled
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation across OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Pasting full 6-digit code
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Step 2: Complete Signup with verified OTP
  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    if (uploadingPhoto) {
      setError("Please wait for your photo to finish uploading.");
      return;
    }

    if (!photoUrl || photoUrl.startsWith("blob:")) {
      setError("Valid profile photo is required. Please go back and re-upload your photo.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const signupPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        age: Number(age),
        gender,
        branch,
        year,
        photoUrl,
        bio: bio.trim() || "Proud JC Bose UST student!",
        interest,
        otp: enteredOtp,
      };

      const res = await axiosClient.post("/signup", signupPayload);
      dispatch(addUser(res.data.user || res.data.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.post("/login", {
        email: email.trim(),
        password,
      });

      dispatch(addUser(res.data.user || res.data.data));
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password: OTP Input Handlers
  const handleForgotOtpChange = (index, value) => {
    const digit = value.slice(-1);
    if (digit && !/^\d$/.test(digit)) return;

    const newOtp = [...forgotOtp];
    newOtp[index] = digit;
    setForgotOtp(newOtp);

    if (digit && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtp[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleForgotOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setForgotOtp(pastedData.split(""));
      forgotOtpRefs.current[5]?.focus();
    }
  };

  // Forgot Password: Step 1 - Send OTP to registered email
  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!forgotEmail || !forgotEmail.trim()) {
      setError("Please enter your registered student email.");
      return;
    }

    const normalized = forgotEmail.toLowerCase().trim();
    if (normalized.includes("+")) {
      setError("Email aliases and plus-tags (+tag) are strictly blocked. Please use your standard email.");
      return;
    }
    const isAllowed = /^[a-zA-Z0-9._%-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalized);
    if (!isAllowed) {
      setError("Only genuine @gmail.com email addresses are allowed.");
      return;
    }

    try {
      setForgotSending(true);
      await axiosClient.post("/forgot-password/send-otp", {
        email: normalized,
      });

      setStep("forgot_reset");
      setForgotTimer(60);
      setForgotCanResend(false);
      setInfoMessage("We sent a 6-digit password reset code to your email.");
      setTimeout(() => forgotOtpRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code. Please check your email.");
    } finally {
      setForgotSending(false);
    }
  };

  // Forgot Password: Resend OTP
  const handleResendForgotOtp = async () => {
    if (!forgotCanResend || forgotSending) return;
    try {
      setForgotSending(true);
      setError(null);
      await axiosClient.post("/forgot-password/send-otp", {
        email: forgotEmail.toLowerCase().trim(),
      });
      setForgotTimer(60);
      setForgotCanResend(false);
      setInfoMessage("A new 6-digit password reset code has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend reset code.");
    } finally {
      setForgotSending(false);
    }
  };

  // Forgot Password: Step 2 - Verify OTP and Reset
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const enteredOtp = forgotOtp.join("");
    if (enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post("/forgot-password/reset", {
        email: forgotEmail.toLowerCase().trim(),
        otp: enteredOtp,
        newPassword,
      });

      dispatch(addUser(res.data.user || res.data.data));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed. Please check your verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10 relative overflow-hidden">
      {/* Dynamic Themed Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Subtle Ambient Grid */}
        <div className="absolute inset-0 bg-grid-cyber opacity-70" />

        {/* Ambient Gradient Glow Orbs */}
        <div
          className={`absolute -top-24 -left-24 w-96 sm:w-[32rem] h-96 sm:h-[32rem] ${currentTheme.orb1} rounded-full blur-[130px] animate-pulse-slow transition-all duration-700`}
        />
        <div
          className={`absolute top-1/3 -right-24 w-80 sm:w-[28rem] h-80 sm:h-[28rem] ${currentTheme.orb2} rounded-full blur-[140px] animate-pulse-slow transition-all duration-700`}
        />
        <div
          className={`absolute -bottom-24 left-1/4 w-96 sm:w-[30rem] h-96 sm:h-[30rem] ${currentTheme.orb3} rounded-full blur-[130px] transition-all duration-700`}
        />

        {/* Ambient Floating Campus Badges */}
        <div className="hidden lg:block select-none pointer-events-none">
          <div className="absolute top-[16%] left-[7%] animate-float-slow opacity-25 text-3xl">
            🎓
          </div>
          <div className="absolute top-[26%] right-[8%] animate-float-reverse opacity-30 text-3xl">
            🔥
          </div>
          <div className="absolute bottom-[24%] left-[10%] animate-float-reverse opacity-25 text-3xl">
            ☕
          </div>
          <div className="absolute bottom-[18%] right-[9%] animate-float-slow opacity-30 text-3xl">
            💖
          </div>
          <div className="absolute top-[68%] left-[5%] animate-float-slow opacity-20 text-2xl">
            🏸
          </div>
          <div className="absolute top-[12%] right-[20%] animate-float-reverse opacity-25 text-2xl">
            ✨
          </div>
          <div className="absolute bottom-[40%] right-[6%] animate-float-slow opacity-20 text-2xl">
            💬
          </div>
        </div>
      </div>

      <div
        className={`w-full max-w-xl bg-[#111422]/95 backdrop-blur-xl border ${currentTheme.cardBorder} rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 animate-fade-in transition-all duration-500`}
      >
        {/* Background Theme Switcher */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-slate-300">Theme</span>
            <span className="hidden sm:inline text-[11px] text-slate-500">• {currentTheme.tagline}</span>
          </div>

          <div className="flex items-center gap-1 bg-[#0E101A] p-1 rounded-xl border border-white/10">
            {Object.values(BG_THEMES).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedTheme === t.id
                    ? "bg-white/15 text-white shadow-sm ring-1 ring-white/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                title={t.name}
              >
                <span>{t.icon}</span>
                <span className="hidden sm:inline text-[11px]">{t.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
        {/* Preview Campus Feed Link (Teaser Mode) */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 border border-purple-500/30 hover:border-pink-500/50 text-xs font-bold text-purple-200 hover:text-white transition-all shadow-sm group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>50+ Students Swiping Now • Preview Blurred Campus Deck</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] shadow-lg shadow-purple-500/25 mb-1">
            {step.startsWith("forgot") ? (
              <KeyRound className="w-8 h-8 text-white" />
            ) : (
              <Flame className="w-8 h-8 text-white fill-white" />
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {step === "forgot_email"
              ? "Reset Password"
              : step === "forgot_reset"
              ? "Create New Password"
              : isSignUp
              ? step === "otp"
                ? "Verify Your Email"
                : "Join YMCA Match"
              : "Welcome Back"}
          </h1>
          <p className="text-slate-400 text-sm">
            {step === "forgot_email"
              ? "Enter your registered email to receive a 6-digit recovery code"
              : step === "forgot_reset"
              ? `Enter the code sent to ${forgotEmail} and choose a new password`
              : isSignUp
              ? step === "otp"
                ? `Enter the 6-digit code sent to ${email}`
                : "Connect with batchmates, seniors & crush at JC Bose UST"
              : "Sign in to see who liked your profile today"}
          </p>
        </div>

        {/* Tab Toggle (Only visible in regular form step) */}
        {step === "form" && (
          <div className="flex bg-[#07080E] p-1 rounded-2xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                !isSignUp
                  ? "bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white shadow-md shadow-purple-500/20"
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
                setInfoMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isSignUp
                  ? "bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white shadow-md shadow-purple-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Info & Error Alerts */}
        {infoMessage && (
          <div className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs p-3.5 rounded-2xl mb-6 animate-fade-in flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-6 animate-fade-in flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* OTP VERIFICATION STEP                                    */}
        {/* ======================================================== */}
        {isSignUp && step === "otp" ? (
          <form onSubmit={handleVerifyAndSignup} className="space-y-6 animate-slide-up">
            <div className="p-5 rounded-2xl bg-[#171A2B] border border-purple-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">Student Email Verification</h3>
                <p className="text-xs text-slate-400 mt-1">
                  We've sent a 6-digit campus verification code to{" "}
                  <span className="text-purple-300 font-semibold">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-xs text-purple-400 hover:underline mt-1 font-medium"
                >
                  Edit email address
                </button>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-black text-xl text-white bg-[#0E101A] border border-white/15 focus:border-[#A855F7] focus:ring-2 focus:ring-purple-500/30 rounded-2xl transition-all outline-none"
                  />
                ))}
              </div>

              {/* Resend Timer */}
              <div className="text-xs text-slate-400">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpSending}
                    className="text-purple-400 hover:text-purple-300 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                ) : (
                  <span>Resend code in <strong className="text-white">{otpTimer}s</strong></span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Form
              </button>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verify & Create Account
                  </>
                )}
              </button>
            </div>
          </form>
        ) : step === "forgot_email" ? (
          /* ======================================================== */
          /* FORGOT PASSWORD: STEP 1 (EMAIL)                          */
          /* ======================================================== */
          <form onSubmit={handleSendForgotOtp} className="space-y-6 animate-slide-up">
            <div className="p-5 rounded-2xl bg-[#171A2B] border border-purple-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Find Your Account</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your registered student email and we'll send you a 6-digit recovery OTP.
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Registered Student Email <span className="text-purple-400">(genuine @gmail.com)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder=""
                  autoComplete="off"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#171A2B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError(null);
                  setInfoMessage(null);
                }}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>

              <button
                type="submit"
                disabled={forgotSending || !forgotEmail}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {forgotSending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reset Code
                  </>
                )}
              </button>
            </div>
          </form>
        ) : step === "forgot_reset" ? (
          /* ======================================================== */
          /* FORGOT PASSWORD: STEP 2 (OTP + NEW PASSWORD)             */
          /* ======================================================== */
          <form onSubmit={handleForgotResetPassword} className="space-y-5 animate-slide-up">
            <div className="p-5 rounded-2xl bg-[#171A2B] border border-purple-500/30 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[#A855F7] mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">Enter 6-Digit Reset Code</h3>
                <p className="text-xs text-slate-400 mt-1">
                  We've sent a 6-digit recovery code to{" "}
                  <span className="text-purple-300 font-semibold">{forgotEmail}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setStep("forgot_email")}
                  className="text-xs text-purple-400 hover:underline mt-1 font-medium"
                >
                  Change email address
                </button>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {forgotOtp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (forgotOtpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleForgotOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleForgotOtpKeyDown(index, e)}
                    onPaste={handleForgotOtpPaste}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-black text-xl text-white bg-[#0E101A] border border-white/15 focus:border-[#A855F7] focus:ring-2 focus:ring-purple-500/30 rounded-2xl transition-all outline-none"
                  />
                ))}
              </div>

              {/* Resend Timer */}
              <div className="text-xs text-slate-400">
                {forgotCanResend ? (
                  <button
                    type="button"
                    onClick={handleResendForgotOtp}
                    disabled={forgotSending}
                    className="text-purple-400 hover:text-purple-300 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                ) : (
                  <span>Resend code in <strong className="text-white">{forgotTimer}s</strong></span>
                )}
              </div>
            </div>

            {/* Password Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">New Password (min 6 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder=""
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder=""
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError(null);
                  setInfoMessage(null);
                }}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="submit"
                disabled={loading || forgotOtp.join("").length !== 6 || !newPassword || !confirmNewPassword}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Reset & Sign In
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ======================================================== */
          /* SIGNUP / LOGIN FORM STEP                                 */
          /* ======================================================== */
          <form
            onSubmit={isSignUp ? handleInitiateSignup : handleLogin}
            className="space-y-4"
          >
            {isSignUp && (
              <>
                {/* Photo Upload from Phone/PC (Compulsory) */}
                <div className="p-4 rounded-2xl bg-[#171A2B] border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#A855F7]" />
                        Upload Your Photo <span className="text-purple-400">*Compulsory</span>
                      </label>
                      <p className="text-[11px] text-slate-400">
                        Upload directly from your phone gallery or laptop
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/20 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      {uploadingPhoto ? "Uploading..." : photoUrl ? "Change Photo" : "Upload Photo"}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDevicePhotoUpload}
                    />
                  </div>

                  {uploadingPhoto && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-purple-500/40 flex-shrink-0 relative bg-black/40 flex items-center justify-center">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Uploading preview"
                            className="w-full h-full object-cover opacity-40"
                          />
                        )}
                        <span className="loading loading-spinner loading-sm text-purple-400 absolute"></span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <p className="text-purple-400 font-semibold flex items-center gap-1">
                          Optimizing & uploading photo...
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Compressing image and uploading to cloud storage
                        </p>
                      </div>
                    </div>
                  )}

                  {!uploadingPhoto && photoUrl && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-emerald-500/50 flex-shrink-0">
                        <img
                          src={photoUrl}
                          alt="Uploaded preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs text-slate-300">
                        <p className="text-emerald-400 font-semibold flex items-center gap-1">
                          ✓ Photo ready for YMCA Match
                        </p>
                        <p className="text-[11px] text-slate-400">
                          This real photo will be shown to other YMCA students
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      autoComplete="off"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Last Name</label>
                    <input
                      type="text"
                      placeholder=""
                      autoComplete="off"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Age *</label>
                    <input
                      type="number"
                      min="18"
                      max="60"
                      required
                      placeholder=""
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Gender *</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="" disabled className="text-slate-500">
                        Select Gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                </div>

                {/* YMCA Branch & Academic Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#EC4899]" />
                      JC Bose UST Branch *
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      required
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="" disabled className="text-slate-500">
                        Select JC Bose UST Branch
                      </option>
                      {YMCA_BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                      Academic Year *
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="" disabled className="text-slate-500">
                        Select Academic Year
                      </option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">About You (Bio)</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder=""
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                {/* Interests Picker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Select Interests & Hobbies ({interest.length} picked)
                    </label>
                    {interest.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setInterest([])}
                        className="text-[10px] text-purple-400 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>
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
                              ? "bg-purple-500/20 border-purple-500/50 text-purple-300 font-semibold"
                              : "bg-[#171A2B] border-white/5 text-slate-400 hover:text-white hover:border-white/15"
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
                Student Email {isSignUp && <span className="text-purple-400 font-medium">(Only genuine @gmail.com)</span>}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder=""
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#171A2B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                  placeholder=""
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#171A2B] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              {!isSignUp && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email || "");
                      setStep("forgot_email");
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otpSending}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading || otpSending ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : isSignUp ? (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Verify Email & Continue
                </>
              ) : (
                "Sign In to Discover"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
