import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { dailyLimitMinutesForTier, translationTierFromUser } from "@/src/lib/translation-limits";
import {
  getTranslationStatusForUser,
  refreshTranslationDayIfNeeded,
} from "@/src/lib/translation-user-status";

export const runtime = "nodejs";

/**
 * POST /api/translation/use — consume translation minutes (typically 1 per minute of active AI subtitles).
 * Gold / unlimited: succeeds without incrementing usage.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = body?.minutes;
    const minutes = typeof raw === "number" && Number.isFinite(raw) ? Math.floor(raw) : 1;
    if (minutes < 1 || minutes > 120) {
      return NextResponse.json({ error: "Invalid minutes" }, { status: 400 });
    }

    await refreshTranslationDayIfNeeded(prisma, userId);

    const result = await prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({
        where: { id: userId },
        select: {
          translationMinutesToday: true,
          isVip: true,
        },
      });
      if (!u) return { error: "not_found" as const };

      const tier = translationTierFromUser({
        isVip: u.isVip === true,
      });
      if (tier === "gold") {
        return { ok: true as const, skipped: true };
      }

      const limit = dailyLimitMinutesForTier(tier);
      const used = u.translationMinutesToday ?? 0;
      if (used + minutes > limit) {
        return { error: "limit_exceeded" as const, used, limit };
      }

      await tx.user.update({
        where: { id: userId },
        data: { translationMinutesToday: { increment: minutes } },
      });
      return { ok: true as const, skipped: false };
    });

    if (result.error === "not_found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (result.error === "limit_exceeded") {
      return NextResponse.json(
        {
          error: "Translation limit reached for today",
          code: "limit_exceeded",
          usedMinutesToday: result.used,
          dailyLimitMinutes: result.limit,
        },
        { status: 403 }
      );
    }

    const next = await getTranslationStatusForUser(prisma, userId);
    return NextResponse.json({ ok: true, status: next });
  } catch (err) {
    console.error("[api/translation/use]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
