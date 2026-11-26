import { createSlice } from "@reduxjs/toolkit";

const quotaSlice = createSlice({
  name: "quota",
  initialState: {
    remainingSwipes: 15,
    dailyLimit: 15,
    swipesUsed: 0,
  },
  reducers: {
    setQuota: (state, action) => {
      return { ...state, ...action.payload };
    },
    decrementQuota: (state) => {
      const remaining = Math.max(0, (state.remainingSwipes ?? 15) - 1);
      return {
        ...state,
        remainingSwipes: remaining,
        swipesUsed: (state.swipesUsed || 0) + 1,
      };
    },
  },
});

export const { setQuota, decrementQuota } = quotaSlice.actions;
export default quotaSlice.reducer;
