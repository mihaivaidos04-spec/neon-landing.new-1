"use client";

import { useEffect, useRef, useState } from "react";
import { createSocket } from "../lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket(userId: string | null) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("register", userId);
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return { socket: socketRef.current, connected };
}
