import { NextRequest, NextResponse } from "next/server";
import type { Server } from "socket.io";
import { prisma } from "@/src/lib/prisma";
import { purgeExpiredGlobalPulseChatMessages } from "@/src/lib/global-pulse-chat-cleanup";

export const runtime = "nodejs";

/**
 * POST — remove Global Pulse messages older than 5 minutes; notify all clients via Socket.io.
 * Called every minute from `server.js` (same host). Optional: external cron with CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await purgeExpiredGlobalPulseChatMessages(prisma);
    if (ids.length > 0) {
      const io = (globalThis as unknown as { __neonSocketIo?: Server }).__neonSocketIo;
      io?.to("global_pulse").emit("global_pulse_messages_removed", { ids });
    }
    return NextResponse.json({ deleted: ids.length, ids });
  } catch (err) {
    console.error("[cron/chat-messages-cleanup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
