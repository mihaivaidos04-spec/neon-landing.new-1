"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { createSocket } from "../lib/socket";
import type { Socket } from "socket.io-client";

type SocketContextValue = {
  socket: Socket | null;
  connected: boolean;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function SocketProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = createSocket();
    socketRef.current = s;

    s.on("connect", () => {
      setConnected(true);
      s.emit("register", userId);
      setSocket(s);
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  return useContext(SocketContext);
}

/** Wrapper that gets userId from session - use in layout */
export function SocketProviderWithAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const userId =
    status === "authenticated"
      ? ((session as any)?.userId ?? session?.user?.id) ?? null
      : null;
  return <SocketProvider userId={userId}>{children}</SocketProvider>;
}
