import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

function sessionUserId(session: unknown): string | undefined {
  const s = session as { userId?: string; user?: { id?: string } } | null;
  return s?.userId ?? s?.user?.id;
}

type FriendUser = {
  id: string;
  name: string | null;
  image: string | null;
  lastSeenAt: string;
};

async function mapFriendUsers(rows: { requesterId: string; addresseeId: string }[], me: string): Promise<FriendUser[]> {
  const ids = [...new Set(rows.map((r) => (r.requesterId === me ? r.addresseeId : r.requesterId)))];
  if (ids.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, image: true, lastSeenAt: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return ids.map((id) => {
    const u = byId.get(id);
    return {
      id,
      name: u?.name ?? null,
      image: u?.image ?? null,
      lastSeenAt: u?.lastSeenAt?.toISOString() ?? new Date(0).toISOString(),
    };
  });
}

/** List friends + pending requests. */
export async function GET() {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [acceptedRows, incomingRows, outgoingRows] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          status: "accepted",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
      prisma.friendship.findMany({
        where: { addresseeId: userId, status: "pending" },
        include: {
          requester: { select: { id: true, name: true, image: true, lastSeenAt: true } },
        },
      }),
      prisma.friendship.findMany({
        where: { requesterId: userId, status: "pending" },
        include: {
          addressee: { select: { id: true, name: true, image: true, lastSeenAt: true } },
        },
      }),
    ]);

    const friends = await mapFriendUsers(acceptedRows, userId);

    const incoming = incomingRows.map((r) => ({
      id: r.id,
      user: {
        id: r.requester.id,
        name: r.requester.name,
        image: r.requester.image,
        lastSeenAt: r.requester.lastSeenAt?.toISOString() ?? new Date(0).toISOString(),
      },
    }));

    const outgoing = outgoingRows.map((r) => ({
      id: r.id,
      user: {
        id: r.addressee.id,
        name: r.addressee.name,
        image: r.addressee.image,
        lastSeenAt: r.addressee.lastSeenAt?.toISOString() ?? new Date(0).toISOString(),
      },
    }));

    return NextResponse.json({ friends, incoming, outgoing });
  } catch (err) {
    console.error("[api/friends GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST body:
 * { action: "request", targetUserId }
 * { action: "accept", requesterId }
 * { action: "decline", requesterId }
 * { action: "remove", targetUserId }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = sessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";
    const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId.trim() : "";
    const requesterId = typeof body?.requesterId === "string" ? body.requesterId.trim() : "";

    if (action === "request") {
      if (!targetUserId || targetUserId === userId) {
        return NextResponse.json({ error: "Invalid target" }, { status: 400 });
      }
      const exists = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
      if (!exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const dup = await prisma.friendship.findUnique({
        where: {
          requesterId_addresseeId: { requesterId: userId, addresseeId: targetUserId },
        },
      });
      if (dup) {
        return NextResponse.json({ error: "Request already exists" }, { status: 409 });
      }
      const reverse = await prisma.friendship.findUnique({
        where: {
          requesterId_addresseeId: { requesterId: targetUserId, addresseeId: userId },
        },
      });
      if (reverse) {
        if (reverse.status === "pending") {
          await prisma.friendship.update({
            where: { id: reverse.id },
            data: { status: "accepted" },
          });
          return NextResponse.json({ ok: true, autoAccepted: true });
        }
        return NextResponse.json({ error: "Already connected" }, { status: 409 });
      }
      await prisma.friendship.create({
        data: { requesterId: userId, addresseeId: targetUserId, status: "pending" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "accept") {
      if (!requesterId) {
        return NextResponse.json({ error: "Missing requesterId" }, { status: 400 });
      }
      const row = await prisma.friendship.findUnique({
        where: {
          requesterId_addresseeId: { requesterId, addresseeId: userId },
        },
      });
      if (!row || row.status !== "pending") {
        return NextResponse.json({ error: "No pending request" }, { status: 404 });
      }
      await prisma.friendship.update({
        where: { id: row.id },
        data: { status: "accepted" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "decline") {
      if (!requesterId) {
        return NextResponse.json({ error: "Missing requesterId" }, { status: 400 });
      }
      await prisma.friendship.deleteMany({
        where: { requesterId, addresseeId: userId, status: "pending" },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      if (!targetUserId) {
        return NextResponse.json({ error: "Invalid target" }, { status: 400 });
      }
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { requesterId: userId, addresseeId: targetUserId },
            { requesterId: targetUserId, addresseeId: userId },
          ],
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[api/friends POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
