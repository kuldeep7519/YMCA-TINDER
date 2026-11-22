import { io } from "socket.io-client";

export const createSocketConnection = () => {
  // On localhost connect directly to port 7777; in production connect to current origin root namespace
  const socketUrl =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:7777"
      : "/";

  return io(socketUrl, {
    withCredentials: true,
  });
};
