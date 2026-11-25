import { createSlice } from "@reduxjs/toolkit";

const connectionSlice = createSlice({
  name: "connections",
  initialState: null,
  reducers: {
    addConnections: (state, action) => {
      return action.payload;
    },
    removeConnection: (state, action) => {
      if (!state) return state;
      return state.filter((c) => c._id !== action.payload);
    },
    updateConnection: (state, action) => {
      if (!state) return state;
      return state.map((c) =>
        c._id === action.payload.id ? { ...c, ...action.payload.data } : c
      );
    },
    removeConnections: () => {
      return null;
    },
  },
});

export const { addConnections, removeConnection, updateConnection, removeConnections } = connectionSlice.actions;
export default connectionSlice.reducer;
