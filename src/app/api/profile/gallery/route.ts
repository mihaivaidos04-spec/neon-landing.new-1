import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { sanitizeGalleryImageUrl } from "@/src/lib/gallery-image-url";

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null;
  return s?.userId ?? s?.user?.id;
}

/** GET current user’s 3 gallery slots (null = empty). */
export async function GET() {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await prisma.profileGalleryImage.findMany({
      where: { userId },
      orderBy: { slot: "asc" },
    });
    const slots: (string | null)[] = [null, null, null];
    for (const r of rows) {
      if (r.slot >= 0 && r.slot <= 2) slots[r.slot] = r.imageUrl;
    }
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("[api/profile/gallery GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PUT one slot: { slot: 0|1|2, imageUrl: string | null } — null clears. */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const slot = Number(body?.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot > 2) {
      return NextResponse.json({ error: "Invalid slot (0–2)" }, { status: 400 });
    }

    const rawUrl = body?.imageUrl;
    if (rawUrl === null || rawUrl === "") {
      await prisma.profileGalleryImage.deleteMany({
        where: { userId, slot },
      });
      return NextResponse.json({ ok: true, slots: await loadSlots(userId) });
    }

    const imageUrl = sanitizeGalleryImageUrl(rawUrl);
    if (!imageUrl) {
      return NextResponse.json({ error: "Invalid image URL or data" }, { status: 400 });
    }

    await prisma.profileGalleryImage.upsert({
      where: { userId_slot: { userId, slot } },
      create: { userId, slot, imageUrl },
      update: { imageUrl },
    });

    return NextResponse.json({ ok: true, slots: await loadSlots(userId) });
  } catch (err) {
    console.error("[api/profile/gallery PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function loadSlots(userId: string): Promise<(string | null)[]> {
  const rows = await prisma.profileGalleryImage.findMany({
    where: { userId },
    orderBy: { slot: "asc" },
  });
  const slots: (string | null)[] = [null, null, null];
  for (const r of rows) {
    if (r.slot >= 0 && r.slot <= 2) slots[r.slot] = r.imageUrl;
  }
  return slots;
}
