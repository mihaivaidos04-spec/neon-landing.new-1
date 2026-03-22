import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";

const MAX_IMAGE_CHARS = 650_000;
const MAX_TRANSCRIPT_CHARS = 8_000;
const MIN_INTERVAL_MS = 12_000;

const lastCallByUser = new Map<string, number>();

function getUserId(session: Awaited<ReturnType<typeof auth>>): string | null {
  const s = session as { userId?: string; user?: { id?: string } } | null;
  return s?.userId ?? s?.user?.id ?? null;
}

/**
 * Neon Whisper: vision + transcript → one edgy conversation tip (OpenAI gpt-4o-mini).
 * Authenticated only; rate-limited per user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    const last = lastCallByUser.get(userId) ?? 0;
    if (now - last < MIN_INTERVAL_MS) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const imageBase64 =
      typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const transcript =
      typeof body.transcript === "string"
        ? body.transcript.slice(0, MAX_TRANSCRIPT_CHARS)
        : "";

    if (!imageBase64.startsWith("data:image/jpeg") && !imageBase64.startsWith("data:image/png")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }
    if (imageBase64.length > MAX_IMAGE_CHARS) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Neon Whisper is not configured" },
        { status: 503 }
      );
    }

    lastCallByUser.set(userId, now);

    const instruction = `Give a 1-sentence short, edgy tip to keep this conversation interesting.

Recent things I (the local user) said in the last ~30 seconds of transcribed audio from my mic — may be empty if I was quiet:
"""
${transcript || "(no speech captured)"}
"""

The image is a single frame from my video chat partner's camera. Use only general vibe, energy, or setting — stay PG-13, no sexualization, no comments on specific body parts, no hate or harassment.

Reply with ONLY that one sentence. No quotes, no preamble.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 120,
        temperature: 0.95,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              {
                type: "image_url",
                image_url: { url: imageBase64, detail: "low" },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[neon-whisper] OpenAI error", res.status, errText.slice(0, 200));
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
    const tip = raw.replace(/^["'“”]|[""'']$/g, "").split("\n")[0]?.trim() ?? "";

    if (!tip) {
      return NextResponse.json({ error: "Empty response" }, { status: 502 });
    }

    return NextResponse.json({ tip });
  } catch (e) {
    console.error("[neon-whisper]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
