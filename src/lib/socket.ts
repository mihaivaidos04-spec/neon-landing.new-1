"use client";

import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (typeof window === "undefined") return "";
  return window.location.origin;
};

export function createSocket() {
  return io(getSocketUrl(), {
    path: "/api/socketio",
    addTrailingSlash: false,
    autoConnect: true,
  });
}
