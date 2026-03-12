import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getSupabase } from "@/src/lib/supabase";

const THRESHOLD = 0.85;

type ModerationResult = {
  violation: boolean;
  reason?: "nudity" | "weapon";
  nudityProbability?: number;
  weaponProbability?: number;
};

async function checkSightengine(
  imageBase64: string,
  apiUser: string,
  apiSecret: string
): Promise<ModerationResult> {
  const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");

  const formData = new FormData();
  formData.append("media", new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }), "frame.jpg");
  formData.append("models", "nudity,wad");
  formData.append("api_user", apiUser);
  formData.append("api_secret", apiSecret);

  const res = await fetch("https://api.sightengine.com/1.0/check.json", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[moderation] Sightengine error:", err);
    return { violation: false };
  }

  const data = (await res.json()) as Record<string, unknown>;
  const nudity = (data?.nudity as Record<string, number>) ?? {};
  const wep = (data?.weapon as Record<string, number>) ?? {};

  const nudityProb = nudity.raw ?? nudity.partial ?? nudity.sexy ?? 0;
  const weaponProb = wep.weapon ?? wep.weapons ?? 0;

  if (nudityProb >= THRESHOLD) {
    return { violation: true, reason: "nudity", nudityProbability: nudityProb, weaponProbability: weaponProb };
  }
  if (weaponProb >= THRESHOLD) {
    return { violation: true, reason: "weapon", nudityProbability: nudityProb, weaponProbability: weaponProb };
  }

  return { violation: false, nudityProbability: nudityProb, weaponProbability: weaponProb };
}

async function logModerationIncident(params: {
  userId: string;
  partnerId?: string;
  violationType: string;
  nudityProbability?: number;
  weaponProbability?: number;
  rawResponse?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("moderation_logs").insert({
    user_id: params.userId,
    partner_id: params.partnerId ?? null,
    violation_type: params.violationType,
    nudity_probability: params.nudityProbability ?? null,
    weapon_probability: params.weaponProbability ?? null,
    raw_response: params.rawResponse ?? null,
  });
}

async function flagUser(userId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      flagged_at: new Date().toISOString(),
      matching_suspended_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session as any)?.userId ?? session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const imageBase64 = body?.image as string;
    const partnerId = body?.partnerId as string | undefined;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiUser = process.env.SIGHTENGINE_API_USER;
    const apiSecret = process.env.SIGHTENGINE_API_SECRET;

    let result: ModerationResult;

    if (apiUser && apiSecret) {
      result = await checkSightengine(imageBase64, apiUser, apiSecret);
    } else {
      return NextResponse.json(
        { error: "Moderation not configured", violation: false },
        { status: 200 }
      );
    }

    if (result.violation && result.reason) {
      await logModerationIncident({
        userId,
        partnerId,
        violationType: result.reason,
        nudityProbability: result.nudityProbability,
        weaponProbability: result.weaponProbability,
        rawResponse: result as Record<string, unknown>,
      });
      await flagUser(userId);
    }

    return NextResponse.json({
      violation: result.violation,
      reason: result.reason,
    });
  } catch (err) {
    console.error("[api/moderation/check]", err);
    return NextResponse.json({ error: "Server error", violation: false }, { status: 500 });
  }
}
