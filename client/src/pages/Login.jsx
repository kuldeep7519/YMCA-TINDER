import React, { useState, useRef, useEffect } from "react";
import axiosClient from "../utils/axiosClient";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
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

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState(20);
  const [gender, setGender] = useState("male");
  const [branch, setBranch] = useState(YMCA_BRANCHES[0]);
  const [year, setYear] = useState("3rd Year (Junior)");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("Proud JC Bose UST student! Let's grab some Maggi at canteen.");
  const [interest, setInterest] = useState(["💻 Coding", "☕ Chai Pe Charcha", "🏸 Badminton"]);

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

      // Local preview
      setPhotoUrl(URL.createObjectURL(file));

      const uploadData = new FormData();
      uploadData.append("photo", file);

      const res = await axiosClient.post("/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPhotoUrl(res.data.photoUrl);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
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

    if (!photoUrl) {
      setError("Profile photo is compulsory! Please upload a photo of yourself from your phone or laptop.");
      return;
    }

    if (!email || !password || !firstName) {
      setError("Please fill out all required fields.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAllowedEmail = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalizedEmail);
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

    try {
      setLoading(true);
      setError(null);

      const signupPayload = {
        firstName,
        lastName,
        email: email.trim(),
        password,
        age: Number(age),
        gender,
        branch,
        year,
        photoUrl,
        bio,
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
    const isAllowed = /^[a-zA-Z0-9._%+-]+@(?:gmail\.com|jcboseust\.ac\.in)$/i.test(normalized);
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10 relative">
      {/* Background glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-xl bg-[#111422]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 animate-fade-in">
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
                  placeholder="yourname@gmail.com"
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
                    placeholder="New secure password"
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
                    placeholder="Re-enter new password"
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

                  {photoUrl && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-purple-500/40 flex-shrink-0">
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
                    <label className="text-xs font-semibold text-slate-300">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder=""
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
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Age</label>
                    <input
                      type="number"
                      min="18"
                      max="60"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
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
                      JC Bose UST Branch
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
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
                      Academic Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">About You (Bio)</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell campus who you are, your hobbies, favorite canteen dish..."
                    className="w-full bg-[#171A2B] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
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
                  placeholder="yourname@gmail.com"
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
                  placeholder="••••••••"
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
