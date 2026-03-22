const NICK_RE = /^[a-zA-Z0-9_]{3,20}$/;

export type NicknameParseResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Trimmed; must match [a-zA-Z0-9_] length 3–20 */
export function parseNickname(raw: unknown): NicknameParseResult {
  if (typeof raw !== "string") {
    return { ok: false, error: "Invalid nickname" };
  }
  const s = raw.trim();
  if (s.length < 3) {
    return { ok: false, error: "Nickname must be at least 3 characters" };
  }
  if (s.length > 20) {
    return { ok: false, error: "Nickname must be at most 20 characters" };
  }
  if (!NICK_RE.test(s)) {
    return { ok: false, error: "Use only letters, numbers, and underscores" };
  }
  return { ok: true, value: s };
}
