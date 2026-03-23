import Anthropic from "@anthropic-ai/sdk";

const MODEL =
  process.env.ANTHROPIC_MODERATION_MODEL?.trim() || "claude-sonnet-4-20250514";

export type ModerationSeverity = "low" | "medium" | "high";

export type TextModerationResult = {
  allowed: boolean;
  reason?: string;
  severity?: ModerationSeverity;
};

export type ReportPriority = "low" | "medium" | "urgent";

let warnedMissingKey = false;

function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    if (!warnedMissingKey && process.env.NODE_ENV !== "test") {
      warnedMissingKey = true;
      console.warn("[moderation] ANTHROPIC_API_KEY not set — AI moderation skipped (messages allowed by rules-only).");
    }
    return null;
  }
  return new Anthropic({ apiKey: key });
}

/** Extract first JSON object from model output (handles ```json fences). */
export function parseModerationJson(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const slice = fenced ? fenced[1]!.trim() : t;
  const start = slice.indexOf("{");
  const end = slice.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(slice.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeSeverity(v: unknown): ModerationSeverity | undefined {
  if (v === "low" || v === "medium" || v === "high") return v;
  return undefined;
}

function normalizePriority(v: unknown): ReportPriority {
  if (v === "urgent" || v === "medium" || v === "low") return v;
  return "low";
}

/**
 * Content moderation for global chat or nickname (context changes instructions slightly).
 */
export async function moderateText(
  text: string,
  _userId: string,
  opts?: { context?: "global_chat" | "nickname" }
): Promise<TextModerationResult> {
  const context = opts?.context ?? "global_chat";
  const client = getClient();
  if (!client) {
    return { allowed: true };
  }

  const payload = context === "nickname" ? `username: ${text}` : text;
  const systemHint =
    context === "nickname"
      ? "The input is a proposed display username. Apply the same safety rules; allow normal names and mild slang."
      : "The input is a live public chat line.";

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a content moderator for a live video chat platform.
${systemHint}
Analyze the user content and respond ONLY with a single JSON object, no markdown:
{"allowed": true or false, "reason": "short string", "severity": "low" or "medium" or "high"}

Block (allowed=false) if: hate speech, explicit sexual content, spam/ads, credible threats, personal contact info (phone/email/address), hard drug dealing, self-harm encouragement or methods.
Allow (allowed=true): normal conversation, mild profanity, flirting, emoji/reactions, benign slang.

User content (JSON string): ${JSON.stringify(payload)}`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      return { allowed: true };
    }
    const parsed = parseModerationJson(block.text);
    if (!parsed || typeof parsed.allowed !== "boolean") {
      return { allowed: true };
    }
    const severity = normalizeSeverity(parsed.severity);
    const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : undefined;
    return {
      allowed: parsed.allowed,
      reason,
      severity: severity ?? (parsed.allowed ? undefined : "medium"),
    };
  } catch (e) {
    console.error("[moderation] Anthropic error", e);
    return { allowed: true, reason: "moderation_unavailable" };
  }
}

/**
 * Triage user-submitted reports for admin queue ordering.
 */
export async function analyzeReportPriority(
  reason: string,
  details: string | null | undefined
): Promise<ReportPriority> {
  const client = getClient();
  if (!client) {
    return "medium";
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `You triage abuse reports for a live video chat app.
Respond ONLY with JSON: {"priority": "low" | "medium" | "urgent", "notes": "one short line"}

urgent: credible violence, CSAM hints, severe harassment, doxxing, self-harm.
medium: harassment, spam, inappropriate behavior, offensive language.
low: vague, duplicate-sounding, or minor issues.

Report reason (string): ${JSON.stringify(reason)}
Details (string or empty): ${JSON.stringify(details ?? "")}`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") return "medium";
    const parsed = parseModerationJson(block.text);
    if (!parsed) return "medium";
    return normalizePriority(parsed.priority);
  } catch (e) {
    console.error("[moderation] analyzeReportPriority", e);
    return "medium";
  }
}
