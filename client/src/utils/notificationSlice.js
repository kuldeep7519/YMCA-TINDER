import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    unreadCount: 0,
    toast: null, // { senderId, senderName, text }
    onlineUsers: [], // Array of online user IDs
  },
  reducers: {
    addNotification: (state, action) => {
      state.unreadCount += 1;
      state.toast = action.payload;
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    dismissToast: (state) => {
      state.toast = null;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload || [];
    },
  },
});

export const {
  addNotification,
  clearUnreadCount,
  dismissToast,
  setOnlineUsers,
} = notificationSlice.actions;
export default notificationSlice.reducer;
