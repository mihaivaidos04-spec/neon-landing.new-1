import { NextRequest, NextResponse } from "next/server";

/**
 * Free translation via MyMemory API (no key required, rate limited).
 * GET /api/translate?text=hello&from=en&to=ro
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text");
    const from = searchParams.get("from") || "en";
    const to = searchParams.get("to") || "ro";

    if (!text || text.length > 500) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.responseStatus !== 200) {
      return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }

    return NextResponse.json({
      translated: data.responseData?.translatedText ?? text,
    });
  } catch (err) {
    console.error("[api/translate]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
