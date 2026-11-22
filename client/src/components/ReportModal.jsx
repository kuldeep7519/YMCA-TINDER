import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, X, Check } from "lucide-react";
import axiosClient from "../utils/axiosClient";

const REPORT_REASONS = [
  "Inappropriate Photos",
  "Harassment / Abuse",
  "Fake Profile",
  "Spam",
  "Other",
];

const ReportModal = ({ isOpen, onClose, targetUser, onReportSuccess }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [blockAlso, setBlockAlso] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !targetUser) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError("Please select a reason for reporting");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await axiosClient.post(`/user/report/${targetUser._id}`, {
        reason: selectedReason,
        details: details.trim(),
      });

      if (blockAlso) {
        await axiosClient.post(`/user/block/${targetUser._id}`);
      }

      onReportSuccess(targetUser._id, blockAlso);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-up text-white">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                Report {targetUser.firstName}
              </h3>
              <p className="text-xs text-slate-400">
                Help keep the JC Bose UST campus safe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Reason options */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Why are you reporting this profile?
            </label>
            <div className="space-y-2 mt-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? "bg-purple-500/15 border-purple-500/50 text-white font-medium"
                      : "bg-[#171A2B] border-white/5 text-slate-300 hover:border-white/20"
                  }`}
                  onClick={() => setSelectedReason(reason)}
                >
                  <span>{reason}</span>
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="radio radio-xs radio-secondary"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Details input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Additional context (optional)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any details about the incident or profile..."
              className="w-full bg-[#171A2B] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Block toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer text-xs text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={blockAlso}
              onChange={(e) => setBlockAlso(e.target.checked)}
              className="checkbox checkbox-xs checkbox-secondary"
            />
            <span>Also block {targetUser.firstName} from my feed and chat</span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedReason}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/25 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
