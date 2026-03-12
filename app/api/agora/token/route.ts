import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

const TOKEN_EXPIRATION_SEC = 3600;

export async function GET(req: NextRequest) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCert = process.env.AGORA_APP_CERTIFICATE;
  const channel = req.nextUrl.searchParams.get("channel");
  const uidParam = req.nextUrl.searchParams.get("uid");

  if (!appId) {
    return NextResponse.json(
      { error: "Agora not configured. Set NEXT_PUBLIC_AGORA_APP_ID." },
      { status: 500 }
    );
  }

  if (!channel) {
    return NextResponse.json({ error: "Missing channel" }, { status: 400 });
  }

  const uid = uidParam ? parseInt(uidParam, 10) : Math.floor(Math.random() * 1e9);
  if (isNaN(uid) || uid < 0) {
    return NextResponse.json({ error: "Invalid uid" }, { status: 400 });
  }

  // Testing mode: token null when no certificate (enable Testing Mode in Agora Console)
  if (!appCert) {
    return NextResponse.json({ token: null, uid, appId });
  }

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCert,
      channel,
      uid,
      RtcRole.PUBLISHER,
      TOKEN_EXPIRATION_SEC,
      TOKEN_EXPIRATION_SEC
    );

    return NextResponse.json({ token, uid, appId });
  } catch (err) {
    console.error("[api/agora/token]", err);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
