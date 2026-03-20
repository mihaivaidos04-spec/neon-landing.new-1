import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

const systemLogs: { id: number; message: string; level: string; timestamp: string }[] = [];
let logId = 0;

export function addSystemLog(message: string, level = "info") {
  systemLogs.push({
    id: ++logId,
    message,
    level,
    timestamp: new Date().toISOString(),
  });
  while (systemLogs.length > 50) systemLogs.shift();
}


export async function GET() {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (e) {
      addSystemLog(`DB check failed: ${(e as Error).message}`, "error");
    }

    const logs = [...systemLogs].reverse().slice(0, 50);

    return NextResponse.json({
      dbConnected: dbOk,
      timestamp: new Date().toISOString(),
      logs,
    });
  } catch (err) {
    console.error("[api/admin/health]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
