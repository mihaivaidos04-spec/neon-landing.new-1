import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { syncAutomaticBadges } from "@/src/lib/sync-automatic-badges";
import { badgeUi } from "@/src/lib/profile-badge-display";
import { giftEmojiForType } from "@/src/lib/profile-gift-emojis";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    if (!userId || userId.length < 8) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        name: true,
        bio: true,
        image: true,
        avatarUrl: true,
        country: true,
        isShadowBanned: true,
        socialInstagram: true,
        socialTiktok: true,
        socialTwitter: true,
        totalMatches: true,
        totalOnlineMinutes: true,
        createdAt: true,
        isVip: true,
      },
    });

    if (!user || user.isShadowBanned) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await syncAutomaticBadges(userId);

    const [badgeRows, giftsAgg] = await Promise.all([
      prisma.badge.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { type: true, createdAt: true },
      }),
      prisma.transaction.groupBy({
        by: ["giftType"],
        where: {
          receiverId: userId,
          type: "GIFT",
          giftType: { not: null },
        },
        _count: { _all: true },
      }),
    ]);

    const giftsReceived: { giftType: string; count: number; emoji: string }[] = [];
    let giftsTotal = 0;
    for (const row of giftsAgg) {
      const gt = row.giftType ?? "unknown";
      const c = row._count._all;
      giftsTotal += c;
      giftsReceived.push({ giftType: gt, count: c, emoji: giftEmojiForType(gt) });
    }

    const displayName = user.nickname?.trim() || user.name?.trim() || "Neon user";
    const avatar = user.avatarUrl?.trim() || user.image?.trim() || null;

    return NextResponse.json({
      userId: user.id,
      displayName,
      bio: user.bio ?? "",
      avatarUrl: avatar,
      countryCode: user.country,
      totalMatches: user.totalMatches ?? 0,
      totalOnlineMinutes: user.totalOnlineMinutes ?? 0,
      memberSince: user.createdAt.toISOString(),
      isVip: user.isVip ?? false,
      socialInstagram: user.socialInstagram,
      socialTiktok: user.socialTiktok,
      socialTwitter: user.socialTwitter,
      badges: badgeRows.map((b) => ({
        type: b.type,
        createdAt: b.createdAt.toISOString(),
        ...badgeUi(b.type),
      })),
      giftsReceived,
      giftsTotal,
    });
  } catch (err) {
    console.error("[api/profile/[userId] GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
