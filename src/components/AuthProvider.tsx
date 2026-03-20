"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Wraps the app so `useSession()` shares JWT state across navigations/refreshes.
 * `basePath` must match the App Router handler at `/api/auth/*`.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}
