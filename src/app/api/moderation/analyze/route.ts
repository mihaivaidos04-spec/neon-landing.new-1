import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { analyzeContent, analyzeImage } from "@/src/lib/content-sentinel";
import { prisma } from "@/src/lib/prisma";

/**
 * POST: Analyze text and/or image. If flagged, shadow-ban user and persist.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text : "";
    const imageBase64 = typeof body.image === "string" ? body.image : undefined;

    let flagged = false;
    let reason: string | undefined;

    if (text) {
      const result = await analyzeContent(text);
      if (result.flagged && result.shouldShadowBan) {
        flagged = true;
        reason = result.reason;
      }
    }

    if (!flagged && imageBase64) {
      const result = await analyzeImage(imageBase64);
      if (result.flagged && result.shouldShadowBan) {
        flagged = true;
        reason = result.reason;
      }
    }

    if (flagged && reason) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { moderationFlags: true },
      });
      const flags = (user?.moderationFlags ? JSON.parse(user.moderationFlags) : {}) as Record<string, unknown>;
      const toxicCount = ((flags.toxicCount as number) ?? 0) + 1;
      const nsfwCount = (flags.nsfwCount as number) ?? 0;
      const newFlags = {
        ...flags,
        toxicCount: reason === "nsfw" || reason === "violence" ? (flags.toxicCount as number) ?? 0 : toxicCount,
        nsfwCount: reason === "nsfw" ? nsfwCount + 1 : nsfwCount,
        lastFlaggedAt: new Date().toISOString(),
      };
      await prisma.user.update({
        where: { id: userId },
        data: {
          isShadowBanned: true,
          moderationFlags: JSON.stringify(newFlags),
        },
      });
    }

    return NextResponse.json({
      flagged,
      reason: flagged ? reason : undefined,
      shadowBanned: flagged,
    });
  } catch (err) {
    console.error("[api/moderation/analyze]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
