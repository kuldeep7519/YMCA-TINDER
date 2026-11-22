import React, { useState } from "react";
import { SlidersHorizontal, X, RotateCcw, Check, Sparkles, GraduationCap, Users } from "lucide-react";
import { YMCA_BRANCHES, YEARS } from "../utils/constants";

const GENDER_OPTIONS = [
  { label: "Everyone", value: "all" },
  { label: "Women", value: "female" },
  { label: "Men", value: "male" },
  { label: "Others", value: "others" },
];

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = { gender: "all", branch: "all", year: "all" };
    setLocalFilters(defaultFilters);
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 animate-slide-up text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] flex items-center justify-center text-white shadow-md shadow-purple-500/25">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Discovery Preferences</h3>
              <p className="text-[11px] text-slate-400">Filter your YMCA campus queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Gender Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-[#A855F7]" />
            Show Me
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map((g) => {
              const isSelected = localFilters.gender === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, gender: g.value })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white border-transparent shadow-md shadow-purple-500/25"
                      : "bg-[#171A2B] border-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Branch Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-[#EC4899]" />
            Department / Branch
          </label>
          <select
            value={localFilters.branch}
            onChange={(e) => setLocalFilters({ ...localFilters, branch: e.target.value })}
            className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">All Departments (Everyone)</option>
            {YMCA_BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Academic Year Preference */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            Academic Year
          </label>
          <select
            value={localFilters.year}
            onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value })}
            className="w-full bg-[#171A2B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">All Academic Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#A855F7] to-[#EC4899] text-white text-xs font-bold shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
