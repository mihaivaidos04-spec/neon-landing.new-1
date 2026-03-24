import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const TOKEN_TTL_SEC = 3600;

export async function GET(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  const room = req.nextUrl.searchParams.get("room")?.trim();
  const identity = req.nextUrl.searchParams.get("identity")?.trim() || "anonymous";

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET." },
      { status: 500 }
    );
  }

  if (!room) {
    return NextResponse.json({ error: "Missing room" }, { status: 400 });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity.slice(0, 256),
      ttl: TOKEN_TTL_SEC,
    });
    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (err) {
    console.error("[api/livekit/token]", err);
    return NextResponse.json({ error: "Failed to generate LiveKit token" }, { status: 500 });
  }
}
