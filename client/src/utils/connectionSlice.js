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
    updateLastMessage: (state, action) => {
      if (!state) return state;
      const { targetUserId, lastMessage } = action.payload;
      const index = state.findIndex((c) => c._id?.toString() === targetUserId?.toString());
      if (index === -1) return state;
      const updatedItem = {
        ...state[index],
        lastMessage,
      };
      const newState = [...state];
      newState.splice(index, 1);
      newState.unshift(updatedItem);
      return newState;
    },
    removeConnections: () => {
      return null;
    },
  },
});

export const {
  addConnections,
  removeConnection,
  updateConnection,
  updateLastMessage,
  removeConnections,
} = connectionSlice.actions;
export default connectionSlice.reducer;
