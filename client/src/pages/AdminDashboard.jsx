import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  UserX,
  UserCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Search,
  Check,
  Flame,
  ExternalLink,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const loggedInUser = useSelector((store) => store.user);

  // Auth gate state
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("ymca_admin_key") || "");
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);

  // Dashboard data state
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "all_reports" | "banned" | "all_users"
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    reviewedReports: 0,
    dismissedReports: 0,
    totalUsers: 0,
    bannedUsers: 0,
  });
  const [reports, setReports] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [confirmBanModal, setConfirmBanModal] = useState(null); // { user, isBanning: boolean }
  const [banReasonInput, setBanReasonInput] = useState("");
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null); // user object
  const [actionLoading, setActionLoading] = useState(false);

  // Helper to attach admin headers for requests
  const getAdminHeaders = () => {
    return adminKey ? { "x-admin-key": adminKey } : {};
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Check if user is pre-authorized by session or cookie role
  useEffect(() => {
    if (
      loggedInUser?.role === "admin" ||
      loggedInUser?.email === "kuldeeprao9812@gmail.com"
    ) {
      setIsAuthenticated(true);
      return;
    }
  }, [loggedInUser]);

  // 2. Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      const headers = getAdminHeaders();

      const [statsRes, reportsRes] = await Promise.all([
        axiosClient.get("/admin/stats", { headers }),
        axiosClient.get(`/admin/reports?status=${activeTab === "pending" ? "pending" : "all"}`, {
          headers,
        }),
      ]);

      if (statsRes.data.stats) setStats(statsRes.data.stats);
      if (reportsRes.data.data) setReports(reportsRes.data.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setIsAuthenticated(false);
        sessionStorage.removeItem("ymca_admin_key");
        setAdminKey("");
      }
    } finally {
      setLoadingData(false);
    }
  };

  // 3. Fetch Users List for user management tabs
  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const headers = getAdminHeaders();
      const bannedOnly = activeTab === "banned" ? "true" : "false";
      const res = await axiosClient.get(
        `/admin/users?bannedOnly=${bannedOnly}&search=${encodeURIComponent(userSearchQuery)}`,
        { headers }
      );
      if (res.data.data) setUsersList(res.data.data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "banned" || activeTab === "all_users") {
      fetchUsers();
    } else {
      fetchDashboardData();
    }
  }, [isAuthenticated, activeTab]);

  // Handle Passcode Unlock
  const handlePasscodeSubmit = async (e) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;

    try {
      setVerifyingKey(true);
      setPasscodeError("");

      const res = await axiosClient.post("/admin/verify-passcode", {
        passcode: passcodeInput.trim(),
      });

      if (res.data.success) {
        sessionStorage.setItem("ymca_admin_key", passcodeInput.trim());
        setAdminKey(passcodeInput.trim());
        setIsAuthenticated(true);
        setPasscodeInput("");
      }
    } catch (err) {
      setPasscodeError(err.response?.data?.message || "Invalid admin passcode");
    } finally {
      setVerifyingKey(false);
    }
  };

  // Handle Update Report Status
  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      const headers = getAdminHeaders();
      const res = await axiosClient.patch(
        `/admin/report/${reportId}/status`,
        { status: newStatus },
        { headers }
      );

      if (res.data.success) {
        setReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
        );
        showToast(`Report marked as ${newStatus} ✅`);
        // Refresh counts in background
        axiosClient.get("/admin/stats", { headers }).then((r) => {
          if (r.data.stats) setStats(r.data.stats);
        });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("Error updating report status");
    }
  };

  // Handle Ban / Unban User
  const handleBanToggle = async () => {
    if (!confirmBanModal) return;
    const { user, isBanning } = confirmBanModal;

    try {
      setActionLoading(true);
      const headers = getAdminHeaders();
      const res = await axiosClient.post(
        `/admin/user/${user._id}/ban`,
        {
          isBanned: isBanning,
          banReason: isBanning ? (banReasonInput.trim() || "Violation of campus guidelines") : "",
        },
        { headers }
      );

      if (res.data.success) {
        showToast(res.data.message);
        setConfirmBanModal(null);
        setBanReasonInput("");

        // Update local reports and user lists
        setReports((prev) =>
          prev.map((r) =>
            r.reportedUserId?._id === user._id
              ? {
                  ...r,
                  reportedUserId: { ...r.reportedUserId, isBanned: isBanning },
                  status: isBanning ? "reviewed" : r.status,
                }
              : r
          )
        );

        setUsersList((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isBanned: isBanning } : u))
        );

        fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to ban user:", err);
      showToast("Failed to update user ban status");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (!confirmDeleteModal) return;
    const user = confirmDeleteModal;

    try {
      setActionLoading(true);
      const headers = getAdminHeaders();
      const res = await axiosClient.delete(`/admin/user/${user._id}`, { headers });

      if (res.data.success) {
        showToast(res.data.message);
        setConfirmDeleteModal(null);
        setReports((prev) => prev.filter((r) => r.reportedUserId?._id !== user._id));
        setUsersList((prev) => prev.filter((u) => u._id !== user._id));
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      showToast("Failed to delete account");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================================
  // VIEW: AUTHENTICATION LOCK SCREEN
  // ==========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07080E] flex flex-col items-center justify-center p-4 text-white relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15),transparent_60%)]" />

        <div className="w-full max-w-md bg-[#111422] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10 animate-fade-in text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/30">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">YMCA Moderation Portal</h2>
            <p className="text-xs text-slate-400">
              Restricted area for JC Bose UST student safety & compliance review.
            </p>
          </div>

          {passcodeError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
              {passcodeError}
            </div>
          )}

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Enter admin passcode (e.g. LUND LELE GANDU)"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#171A2B] border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={verifyingKey}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {verifyingKey ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Moderation HQ</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-white/5">
            <Link
              to="/matches"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to YMCA Match
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // VIEW: MAIN MODERATION DASHBOARD
  // ==========================================================
  return (
    <div className="min-h-screen bg-[#0A0C16] text-white flex flex-col relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#171A2B]/95 backdrop-blur-xl border border-purple-500/30 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#A855F7]" />
          {toastMessage}
        </div>
      )}

      {/* Top Admin Header */}
      <header className="h-16 px-4 sm:px-8 bg-[#111422] border-b border-white/10 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/matches"
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Return to Matches"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>YMCA Moderation HQ</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  Admin
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                JC Bose UST Campus Safety & User Reports
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === "banned" || activeTab === "all_users") {
                fetchUsers();
              } else {
                fetchDashboardData();
              }
              showToast("Dashboard refreshed! 🔄");
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem("ymca_admin_key");
              setAdminKey("");
              setIsAuthenticated(false);
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-[#111422] border border-rose-500/30 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pending Review
            </p>
            <p className="text-3xl font-black text-white mt-2">{stats.pendingReports}</p>
            <p className="text-[11px] text-slate-400 mt-1">Requires admin action</p>
          </div>

          <div className="p-4 rounded-3xl bg-[#111422] border border-white/10 shadow-lg">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Total Reports
            </p>
            <p className="text-3xl font-black text-white mt-2">{stats.totalReports}</p>
            <p className="text-[11px] text-slate-400 mt-1">{stats.reviewedReports} reviewed</p>
          </div>

          <div className="p-4 rounded-3xl bg-[#111422] border border-white/10 shadow-lg">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5" />
              Banned Users
            </p>
            <p className="text-3xl font-black text-white mt-2">{stats.bannedUsers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Suspended accounts</p>
          </div>

          <div className="p-4 rounded-3xl bg-[#111422] border border-white/10 shadow-lg">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Total Students
            </p>
            <p className="text-3xl font-black text-white mt-2">{stats.totalUsers}</p>
            <p className="text-[11px] text-slate-400 mt-1">Registered profiles</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pending Review</span>
            {stats.pendingReports > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {stats.pendingReports}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all_reports")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "all_reports"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>All Reports</span>
          </button>

          <button
            onClick={() => setActiveTab("banned")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "banned"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Banned Students</span>
            {stats.bannedUsers > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black">
                {stats.bannedUsers}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all_users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "all_users"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Students</span>
          </button>
        </div>

        {/* Tab 1 & 2: Reports Stream */}
        {(activeTab === "pending" || activeTab === "all_reports") && (
          <div className="space-y-4">
            {loadingData && (
              <div className="flex items-center justify-center py-16">
                <span className="loading loading-spinner loading-md text-[#A855F7]"></span>
              </div>
            )}

            {!loadingData && reports.length === 0 && (
              <div className="py-16 text-center space-y-3 bg-[#111422] border border-white/5 rounded-3xl p-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-base text-white">All Clear! No Reports Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeTab === "pending"
                    ? "Great news! There are zero pending reports awaiting review. The campus community is safe."
                    : "No reports have been submitted yet."}
                </p>
              </div>
            )}

            {!loadingData &&
              reports.map((rep) => {
                const reported = rep.reportedUserId;
                const reporter = rep.reporterId;

                return (
                  <div
                    key={rep._id}
                    className="bg-[#111422] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-purple-500/30 transition-all"
                  >
                    {/* Top Row: Reason, Status & Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {rep.reason}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            rep.status === "pending"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : rep.status === "reviewed"
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                          }`}
                        >
                          {rep.status}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.createdAt).toLocaleString([], {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Middle Row: Reported Student VS Reporter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reported Student Card */}
                      <div className="p-3.5 rounded-2xl bg-[#171A2B] border border-white/5 space-y-2">
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                          Reported Student (Accused)
                        </p>
                        {reported ? (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-rose-500/40 flex-shrink-0">
                              <img
                                src={reported.photoUrl}
                                alt={reported.firstName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate flex items-center gap-2">
                                <span>
                                  {reported.firstName} {reported.lastName}
                                </span>
                                {reported.isBanned && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                                    BANNED
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-purple-300 truncate">
                                {reported.branch} {reported.year ? `• ${reported.year}` : ""}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{reported.email}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">User account deleted</p>
                        )}
                      </div>

                      {/* Reporter Student Card */}
                      <div className="p-3.5 rounded-2xl bg-[#171A2B] border border-white/5 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Reported By
                        </p>
                        {reporter ? (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/30 flex-shrink-0">
                              <img
                                src={reporter.photoUrl}
                                alt={reporter.firstName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">
                                {reporter.firstName} {reporter.lastName}
                              </h4>
                              <p className="text-xs text-purple-300 truncate">
                                {reporter.branch} {reporter.year ? `• ${reporter.year}` : ""}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{reporter.email}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Anonymous or deleted account</p>
                        )}
                      </div>
                    </div>

                    {/* Complaint Details / Explanation */}
                    {rep.details ? (
                      <div className="p-3.5 rounded-2xl bg-black/25 border border-white/5 text-xs text-slate-200">
                        <span className="font-bold text-slate-400 block text-[10px] uppercase mb-1">
                          Explanation provided:
                        </span>
                        <p className="italic">"{rep.details}"</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No extra notes provided.</p>
                    )}

                    {/* Bottom Row: Moderation Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {rep.status !== "reviewed" && (
                          <button
                            onClick={() => handleUpdateReportStatus(rep._id, "reviewed")}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Reviewed
                          </button>
                        )}

                        {rep.status !== "dismissed" && (
                          <button
                            onClick={() => handleUpdateReportStatus(rep._id, "dismissed")}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Dismiss
                          </button>
                        )}
                      </div>

                      {reported && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setConfirmBanModal({
                                user: reported,
                                isBanning: !reported.isBanned,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                              reported.isBanned
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                                : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{reported.isBanned ? "Unban Student" : "Ban Student"}</span>
                          </button>

                          <button
                            onClick={() => setConfirmDeleteModal(reported)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            title="Delete Account Permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete Account</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Tab 3 & 4: Students Management View */}
        {(activeTab === "banned" || activeTab === "all_users") && (
          <div className="space-y-4">
            {/* Search filter */}
            <div className="flex items-center gap-2 bg-[#111422] p-2 rounded-2xl border border-white/10">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="Search students by name, branch, or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                className="bg-transparent flex-1 px-2 py-1 text-xs sm:text-sm text-white focus:outline-none placeholder:text-slate-500"
              />
              <button
                onClick={fetchUsers}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Search
              </button>
            </div>

            {loadingData && (
              <div className="flex items-center justify-center py-16">
                <span className="loading loading-spinner loading-md text-[#A855F7]"></span>
              </div>
            )}

            {!loadingData && usersList.length === 0 && (
              <div className="py-16 text-center text-slate-400 bg-[#111422] rounded-3xl border border-white/5">
                <p className="text-sm font-semibold">No students found.</p>
              </div>
            )}

            {!loadingData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {usersList.map((u) => (
                  <div
                    key={u._id}
                    className="p-4 bg-[#111422] border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/30 flex-shrink-0">
                        <img src={u.photoUrl} alt={u.firstName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                          {u.isBanned && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                              BANNED
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-purple-300 truncate">
                          {u.branch} {u.year ? `• ${u.year}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() =>
                          setConfirmBanModal({
                            user: u,
                            isBanning: !u.isBanned,
                          })
                        }
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                          u.isBanned
                            ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                        }`}
                        title={u.isBanned ? "Unban Student" : "Ban Student"}
                      >
                        <Ban className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setConfirmDeleteModal(u)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal: Ban / Unban */}
      {confirmBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-white animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-white">
                {confirmBanModal.isBanning ? "Ban" : "Unban"} {confirmBanModal.user.firstName}?
              </h3>
              <p className="text-xs text-slate-400">
                {confirmBanModal.isBanning
                  ? "This student will be locked out from logging in and accessing YMCA Match."
                  : "This student will regain normal access to YMCA Match."}
              </p>
            </div>

            {confirmBanModal.isBanning && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Suspension Reason (displayed to user):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inappropriate profile photos / Harassment"
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171A2B] border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setConfirmBanModal(null);
                  setBanReasonInput("");
                }}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBanToggle}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                  confirmBanModal.isBanning
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                }`}
              >
                {actionLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span>{confirmBanModal.isBanning ? "Confirm Ban" : "Confirm Unban"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Account */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-white animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-white">
                Permanently Delete {confirmDeleteModal.firstName}'s Account?
              </h3>
              <p className="text-xs text-slate-400">
                This will delete their profile, photos, chat history, matches, and all reports. This action CANNOT be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
