import { io } from "socket.io-client";

let socketInstance = null;

export const createSocketConnection = () => {
  if (!socketInstance || !socketInstance.connected) {
    const socketUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_BASE_URL ||
      (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:7777"
        : "/");

    socketInstance = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  return socketInstance;
};
