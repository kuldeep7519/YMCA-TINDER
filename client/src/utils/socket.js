import { io } from "socket.io-client";

let socketInstance = null;

export const createSocketConnection = () => {
  // On localhost connect directly to port 7777; in production connect to current origin root namespace
  if (!socketInstance || !socketInstance.connected) {
    const socketUrl =
      typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:7777"
        : "/";

    socketInstance = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
    });
  }

  return socketInstance;
};
