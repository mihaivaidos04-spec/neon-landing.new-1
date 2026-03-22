"use client";

import { Suspense } from "react";
import ProfileDashboard from "@/src/components/profile/ProfileDashboard";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-[#030306] text-white/70">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-500/30 border-t-fuchsia-400" />
        </div>
      }
    >
      <ProfileDashboard />
    </Suspense>
  );
}
