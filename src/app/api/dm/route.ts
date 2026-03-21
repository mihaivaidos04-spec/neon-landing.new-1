import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { areFriends } from "@/src/lib/friendship-queries";
import { emitPrivateDmToUser } from "@/src/lib/emit-private-dm";

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null;
  return s?.userId ?? s?.user?.id;
}

const BODY_MAX = 2000;

/** GET ?with=userId — DM thread with friend (newest last, capped). */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withId = req.nextUrl.searchParams.get("with")?.trim() ?? "";
    if (!withId || withId === userId) {
      return NextResponse.json({ error: "Invalid peer" }, { status: 400 });
    }

    const ok = await areFriends(prisma, userId, withId);
    if (!ok) {
      return NextResponse.json({ error: "Not friends" }, { status: 403 });
    }

    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: withId },
          { senderId: withId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        body: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[api/dm GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST { toUserId, body } */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const toUserId = typeof body?.toUserId === "string" ? body.toUserId.trim() : "";
    const text = typeof body?.body === "string" ? body.body.trim().slice(0, BODY_MAX) : "";
    if (!toUserId || toUserId === userId) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const ok = await areFriends(prisma, userId, toUserId);
    if (!ok) {
      return NextResponse.json({ error: "Not friends" }, { status: 403 });
    }

    const msg = await prisma.privateMessage.create({
      data: {
        senderId: userId,
        receiverId: toUserId,
        body: text,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        body: true,
        createdAt: true,
      },
    });

    const payload = {
      id: msg.id,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    };

    emitPrivateDmToUser(toUserId, payload);

    return NextResponse.json({ message: payload });
  } catch (err) {
    console.error("[api/dm POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
