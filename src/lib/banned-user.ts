import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export type BanCheckRow = {
  tier: string;
  bannedUntil: Date | null;
};

export function isAccountBanned(row: BanCheckRow | null): boolean {
  if (!row) return true;
  if (row.tier === "BANNED") return true;
  if (row.bannedUntil && row.bannedUntil > new Date()) return true;
  return false;
}

/**
 * Returns a 403 JSON response if the user is banned (tier or timed).
 */
export async function bannedUserResponseIfAny(userId: string): Promise<NextResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, bannedUntil: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!isAccountBanned(user)) {
    return null;
  }
  const until = user.bannedUntil && user.bannedUntil > new Date() ? user.bannedUntil.toISOString() : null;
  return NextResponse.json(
    {
      error: "Account suspended",
      code: "banned",
      until,
      permanent: user.tier === "BANNED",
    },
    { status: 403 }
  );
}
