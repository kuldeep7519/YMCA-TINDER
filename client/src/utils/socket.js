import { io } from "socket.io-client";
import { BASE_URL } from "./constants";

export const createSocketConnection = () => {
  const socketUrl =
    BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:7777");
  return io(socketUrl, {
    withCredentials: true,
  });
};
