import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getWalletBalance } from "@/src/lib/wallet";
import { computeProfileBadges } from "@/src/lib/profile-badges";
import { getSqrtXpProgress } from "@/src/lib/neon-xp-level";

const BIO_MAX = 150;
const URL_MAX = 500;
const BANNER_EFFECT_LEVEL_MIN = 5;
const ALLOWED_BANNER_EFFECTS = new Set(["matrix", "waves", "stars"]);

function sanitizeProfileGifUrl(s: unknown): string | null {
  if (s == null || s === "") return null;
  const str = String(s).trim().slice(0, URL_MAX);
  if (!str) return null;
  try {
    const u = new URL(str);
    if (u.protocol !== "https:") return null;
    const path = u.pathname.toLowerCase();
    if (!path.endsWith(".gif") && !path.includes(".gif")) return null;
    return str;
  } catch {
    return null;
  }
}

function parseLanguages(raw: unknown): string[] | null {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    const out = raw
      .map((x) => String(x).trim().toLowerCase().slice(0, 12))
      .filter(Boolean)
      .slice(0, 12);
    return out;
  }
  return null;
}

function sanitizeOptionalUrl(s: unknown): string | null {
  if (s == null || s === "") return null;
  const str = String(s).trim().slice(0, URL_MAX);
  if (!str) return null;
  try {
    const u = new URL(str);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return str;
  } catch {
    return null;
  }
}

function sanitizeBannerUrl(s: unknown): string | null {
  if (s == null || s === "") return null;
  const str = String(s).trim().slice(0, URL_MAX);
  if (!str) return null;
  try {
    const u = new URL(str);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return str;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        bio: true,
        profileGender: true,
        profileBannerUrl: true,
        profileLanguages: true,
        socialInstagram: true,
        socialTiktok: true,
        socialDiscord: true,
        xp: true,
        currentLevel: true,
        totalCoinsSpent: true,
        totalSpent: true,
        country: true,
        lastSeenAt: true,
        isGhost: true,
        ghostModeUntil: true,
        currentStreak: true,
        streakBonusPopup: true,
        isVip: true,
        animatedBanner: true,
        profileGifUrl: true,
        profileBannerEffect: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let streakBonusJustGranted = 0;
    if ((user.streakBonusPopup ?? 0) > 0) {
      streakBonusJustGranted = user.streakBonusPopup;
      await prisma.user.update({
        where: { id: userId },
        data: { streakBonusPopup: 0 },
      });
    }

    const progress = getSqrtXpProgress(user.xp);

    const giftsAgg = await prisma.transaction.groupBy({
      by: ["giftType"],
      where: {
        receiverId: userId,
        type: "GIFT",
        giftType: { not: null },
      },
      _count: { _all: true },
    });

    const giftsReceivedByType: Record<string, number> = {};
    let totalGiftsReceived = 0;
    for (const row of giftsAgg) {
      const gt = row.giftType ?? "unknown";
      const c = row._count._all;
      giftsReceivedByType[gt] = c;
      totalGiftsReceived += c;
    }

    let languages: string[] = [];
    if (user.profileLanguages) {
      try {
        const parsed = JSON.parse(user.profileLanguages) as unknown;
        if (Array.isArray(parsed)) {
          languages = parsed.map((x) => String(x).trim()).filter(Boolean).slice(0, 12);
        }
      } catch {
        languages = [];
      }
    }

    const coins = (await getWalletBalance(userId)) ?? 0;

    const galleryRows = await prisma.profileGalleryImage.findMany({
      where: { userId },
      orderBy: { slot: "asc" },
    });
    const gallerySlots: (string | null)[] = [null, null, null];
    for (const r of galleryRows) {
      if (r.slot >= 0 && r.slot <= 2) gallerySlots[r.slot] = r.imageUrl;
    }

    return NextResponse.json({
      bio: user.bio ?? "",
      profileGender: user.profileGender ?? null,
      profileBannerUrl: user.profileBannerUrl,
      gallerySlots,
      lastSeenAt: user.lastSeenAt.toISOString(),
      isGhost: user.isGhost ?? false,
      ghostModeUntil: user.ghostModeUntil?.toISOString() ?? null,
      languages,
      socialInstagram: user.socialInstagram,
      socialTiktok: user.socialTiktok,
      socialDiscord: user.socialDiscord,
      coins,
      totalCoinsSpent: user.totalCoinsSpent ?? 0,
      totalSpent: user.totalSpent ?? 0,
      totalGiftsReceived,
      giftsReceivedByType,
      countryCode: user.country,
      xp: user.xp,
      currentLevel: user.currentLevel,
      levelProgress: progress,
      badges: computeProfileBadges(user),
    });
  } catch (err) {
    console.error("[api/profile/me GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const userId =
      (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? undefined;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const needsPremiumCheck =
      body?.profileGifUrl !== undefined ||
      body?.animatedBanner !== undefined ||
      body?.profileBannerEffect !== undefined;

    const self = needsPremiumCheck
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { isVip: true, currentLevel: true },
        })
      : null;

    const bioRaw = body?.bio;
    const bio =
      typeof bioRaw === "string" ? bioRaw.trim().slice(0, BIO_MAX) : undefined;

    const langs = body?.languages !== undefined ? parseLanguages(body.languages) : undefined;
    if (body?.languages !== undefined && langs === null) {
      return NextResponse.json({ error: "Invalid languages (expect array of codes)" }, { status: 400 });
    }

    const bannerUrl =
      body?.profileBannerUrl !== undefined ? sanitizeBannerUrl(body.profileBannerUrl) : undefined;
    if (body?.profileBannerUrl && bannerUrl === null && String(body.profileBannerUrl).trim()) {
      return NextResponse.json({ error: "Invalid banner URL" }, { status: 400 });
    }

    const ig =
      body?.socialInstagram !== undefined ? sanitizeOptionalUrl(body.socialInstagram) : undefined;
    const tt = body?.socialTiktok !== undefined ? sanitizeOptionalUrl(body.socialTiktok) : undefined;
    const dc = body?.socialDiscord !== undefined ? sanitizeOptionalUrl(body.socialDiscord) : undefined;

    const genderRaw = body?.profileGender;
    let profileGender: string | null | undefined;
    if (genderRaw !== undefined) {
      if (genderRaw === null || genderRaw === "") {
        profileGender = null;
      } else {
        const g = String(genderRaw).toLowerCase();
        if (g === "male" || g === "female" || g === "other") profileGender = g;
        else {
          return NextResponse.json({ error: "Invalid profileGender" }, { status: 400 });
        }
      }
    }

    if (body?.socialInstagram && body.socialInstagram !== "" && ig === null) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }
    if (body?.socialTiktok && body.socialTiktok !== "" && tt === null) {
      return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 });
    }
    if (body?.socialDiscord && body.socialDiscord !== "" && dc === null) {
      return NextResponse.json({ error: "Invalid Discord URL" }, { status: 400 });
    }

    let profileGifUrl: string | null | undefined;
    if (body?.profileGifUrl !== undefined) {
      if (!self?.isVip) {
        return NextResponse.json({ error: "GIF avatar requires Neon VIP" }, { status: 403 });
      }
      const g = sanitizeProfileGifUrl(body.profileGifUrl);
      if (body.profileGifUrl && body.profileGifUrl !== "" && g === null) {
        return NextResponse.json({ error: "Invalid profile GIF URL (https .gif only)" }, { status: 400 });
      }
      profileGifUrl = g;
    }

    let animatedBanner: string | null | undefined;
    if (body?.animatedBanner !== undefined) {
      const levelOk = (self?.currentLevel ?? 0) >= BANNER_EFFECT_LEVEL_MIN || self?.isVip;
      if (!levelOk) {
        return NextResponse.json(
          { error: `Animated banner requires level ${BANNER_EFFECT_LEVEL_MIN}+ or VIP` },
          { status: 403 }
        );
      }
      animatedBanner =
        body.animatedBanner === null || body.animatedBanner === ""
          ? null
          : sanitizeBannerUrl(body.animatedBanner);
      if (body.animatedBanner && String(body.animatedBanner).trim() && animatedBanner === null) {
        return NextResponse.json({ error: "Invalid animated banner URL" }, { status: 400 });
      }
    }

    let profileBannerEffect: string | null | undefined;
    if (body?.profileBannerEffect !== undefined) {
      if ((self?.currentLevel ?? 0) < BANNER_EFFECT_LEVEL_MIN) {
        return NextResponse.json(
          { error: `Banner effects unlock at level ${BANNER_EFFECT_LEVEL_MIN}` },
          { status: 403 }
        );
      }
      const raw = body.profileBannerEffect;
      if (raw === null || raw === "") {
        profileBannerEffect = null;
      } else {
        const fx = String(raw).toLowerCase();
        if (!ALLOWED_BANNER_EFFECTS.has(fx)) {
          return NextResponse.json({ error: "Invalid profileBannerEffect" }, { status: 400 });
        }
        profileBannerEffect = fx;
      }
    }

    const data: {
      bio?: string | null;
      profileGender?: string | null;
      profileLanguages?: string | null;
      profileBannerUrl?: string | null;
      socialInstagram?: string | null;
      socialTiktok?: string | null;
      socialDiscord?: string | null;
      profileGifUrl?: string | null;
      animatedBanner?: string | null;
      profileBannerEffect?: string | null;
    } = {};
    if (bio !== undefined) data.bio = bio || null;
    if (profileGender !== undefined) data.profileGender = profileGender;
    if (langs !== undefined) data.profileLanguages = langs?.length ? JSON.stringify(langs) : null;
    if (bannerUrl !== undefined) data.profileBannerUrl = bannerUrl;
    if (ig !== undefined) data.socialInstagram = ig;
    if (tt !== undefined) data.socialTiktok = tt;
    if (dc !== undefined) data.socialDiscord = dc;
    if (profileGifUrl !== undefined) data.profileGifUrl = profileGifUrl;
    if (animatedBanner !== undefined) data.animatedBanner = animatedBanner;
    if (profileBannerEffect !== undefined) data.profileBannerEffect = profileBannerEffect;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/profile/me PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
