import React, { useState } from "react";
import { Users, X, RotateCcw, SlidersHorizontal } from "lucide-react";

const GENDER_OPTIONS = [
  { label: "Everyone", value: "all", desc: "All JC Bose UST students" },
  { label: "Women", value: "female", desc: "Show female student profiles" },
  { label: "Men", value: "male", desc: "Show male student profiles" },
  { label: "Others", value: "others", desc: "Show non-binary & other profiles" },
];

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) => {
  const [localGender, setLocalGender] = useState(filters?.gender || "all");

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({ gender: localGender });
    onClose();
  };

  const handleReset = () => {
    setLocalGender("all");
    onResetFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#111422] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-up text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#A855F7] to-[#EC4899] flex items-center justify-center text-white shadow-md shadow-purple-500/25">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Show Me</h3>
              <p className="text-[11px] text-slate-400">Select who you want to discover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gender Options */}
        <div className="space-y-2.5">
          {GENDER_OPTIONS.map((g) => {
            const isSelected = localGender === g.value;
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => setLocalGender(g.value)}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/60 shadow-lg shadow-purple-500/15"
                    : "bg-[#171A2B] border-white/5 hover:border-white/20"
                }`}
              >
                <div>
                  <h4
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {g.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{g.desc}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-pink-500 bg-gradient-to-tr from-[#6366F1] to-[#EC4899]"
                      : "border-slate-600"
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Everyone
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
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
