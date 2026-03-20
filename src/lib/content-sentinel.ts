/**
 * AI Content Sentinel: analyzeContent(text, imageUrl)
 * - Uses OpenAI Moderation API if key available
 * - Falls back to regex/bad-words for text
 * - For images: uses Sightengine or mock
 * - Shadow-bans content and flags user when toxic/NSFW
 */

import { moderateText, type ModerationResult } from "./text-moderation";

export type ContentAnalysisResult = {
  flagged: boolean;
  reason?: "toxic" | "nsfw" | "spam" | "violence";
  shouldShadowBan: boolean;
  textResult?: ModerationResult;
};

const NSFW_PATTERNS = [
  /\b(nude|naked|xxx|porn|nsfw|onlyfans)\b/i,
  /\b(sex|nude|naked)\s*(pic|photo|img|video)\b/i,
];

const VIOLENCE_PATTERNS = [
  /\b(kill|murder|bomb|terror)\b/i,
  /\b(weapon|gun|knife)\s*(pic|photo)\b/i,
];

function checkTextPatterns(text: string): ContentAnalysisResult["reason"] | null {
  if (NSFW_PATTERNS.some((p) => p.test(text))) return "nsfw";
  if (VIOLENCE_PATTERNS.some((p) => p.test(text))) return "violence";
  return null;
}

/**
 * Analyze text content. Uses OpenAI Moderation if available, else bad-words + regex.
 */
export async function analyzeContent(
  text: string,
  _imageUrl?: string | null
): Promise<ContentAnalysisResult> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return { flagged: false, shouldShadowBan: false };
  }

  // 1. Pattern-based checks (regex)
  const patternReason = checkTextPatterns(trimmed);
  if (patternReason) {
    return {
      flagged: true,
      reason: patternReason === "violence" ? "violence" : "nsfw",
      shouldShadowBan: true,
    };
  }

  // 2. OpenAI Moderation API (if key available)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({ input: trimmed }),
      });
      if (res.ok) {
        const data = (await res.json()) as { results?: { flagged?: boolean; categories?: Record<string, boolean> }[] };
        const result = data?.results?.[0];
        if (result?.flagged) {
          const cat = result.categories ?? {};
          let reason: ContentAnalysisResult["reason"] = "toxic";
          if (cat.sexual || cat["sexual/minors"]) reason = "nsfw";
          else if (cat.violence || cat["violence/graphic"]) reason = "violence";
          else if (cat.harassment) reason = "toxic";
          return {
            flagged: true,
            reason,
            shouldShadowBan: true,
          };
        }
      }
    } catch (err) {
      console.warn("[content-sentinel] OpenAI moderation error:", err);
    }
  }

  // 3. Fallback: bad-words + phone/links
  const textResult = moderateText(trimmed);
  if (textResult.wasModified && (textResult.hadBannedWords || textResult.hadExternalLink)) {
    return {
      flagged: true,
      reason: textResult.hadBannedWords ? "toxic" : "spam",
      shouldShadowBan: textResult.hadBannedWords,
      textResult,
    };
  }

  return { flagged: false, shouldShadowBan: false, textResult };
}

/**
 * Analyze image (base64). Uses Sightengine if available, else returns not-flagged.
 */
export async function analyzeImage(imageBase64: string): Promise<ContentAnalysisResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    return { flagged: false, shouldShadowBan: false };
  }

  try {
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

    if (!res.ok) return { flagged: false, shouldShadowBan: false };

    const data = (await res.json()) as Record<string, unknown>;
    const nudity = (data?.nudity as Record<string, number>) ?? {};
    const wep = (data?.weapon as Record<string, number>) ?? {};
    const nudityProb = nudity.raw ?? nudity.partial ?? nudity.sexy ?? 0;
    const weaponProb = wep.weapon ?? wep.weapons ?? 0;

    if (nudityProb >= 0.85) {
      return { flagged: true, reason: "nsfw", shouldShadowBan: true };
    }
    if (weaponProb >= 0.85) {
      return { flagged: true, reason: "violence", shouldShadowBan: true };
    }
  } catch (err) {
    console.warn("[content-sentinel] Image analysis error:", err);
  }

  return { flagged: false, shouldShadowBan: false };
}
