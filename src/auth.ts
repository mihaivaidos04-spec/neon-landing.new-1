/**
 * Auth.js v5 reads AUTH_SECRET / AUTH_URL. Many hosts still set NEXTAUTH_* — mirror before NextAuth loads.
 */
function normalizePublicBaseUrl(input: string | undefined): string | undefined {
  if (!input?.trim()) return undefined;
  let s = input.trim();
  while (s.endsWith(".")) s = s.slice(0, -1);
  s = s.replace(/\/+$/, "");
  try {
    const u = new URL(s);
    let host = u.hostname;
    while (host.endsWith(".")) host = host.slice(0, -1);
    return `${u.protocol}//${host}`;
  } catch {
    return s;
  }
}

if (typeof process !== "undefined") {
  if (process.env.NEXTAUTH_SECRET?.trim() && !process.env.AUTH_SECRET?.trim()) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET.trim();
  }
  if (process.env.NEXTAUTH_URL?.trim() && !process.env.AUTH_URL?.trim()) {
    process.env.AUTH_URL = process.env.NEXTAUTH_URL.trim();
  }
  const authNorm = normalizePublicBaseUrl(process.env.AUTH_URL);
  const nextNorm = normalizePublicBaseUrl(process.env.NEXTAUTH_URL);
  const canonical = authNorm ?? nextNorm;
  if (canonical) {
    process.env.AUTH_URL = canonical;
    process.env.NEXTAUTH_URL = canonical;
  }
}

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Discord from "next-auth/providers/discord";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "@/src/lib/prisma";
import { getWalletBalance } from "@/src/lib/wallet";
import { getSupabase } from "@/src/lib/supabase";
import { addLoginXp } from "@/src/lib/login-xp";
import { neonVipGlowVariant } from "@/src/lib/neon-vip-style";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMagicLinkEmailHtml(url: string): string {
  const safeUrl = escapeHtml(url);
  const logoMarkup = EMAIL_LOGO_URL
    ? `<img src="${escapeHtml(EMAIL_LOGO_URL)}" width="120" alt="NEON" style="display:block;width:120px;max-width:40vw;height:auto;border:0;outline:none;text-decoration:none;" />`
    : `<span style="display:inline-block;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:42px;line-height:1;font-weight:800;letter-spacing:0.22em;color:#A855F7;text-shadow:0 0 14px rgba(168,85,247,0.8),0 0 34px rgba(168,85,247,0.45);">NEON</span>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>Enter Neon Live</title>
    <style>
      @media screen and (max-width: 600px) {
        .email-shell { width: 100% !important; border-radius: 0 !important; }
        .email-inner { padding: 26px 20px !important; }
        .cta-btn { width: 100% !important; font-size: 15px !important; }
      }
      @keyframes neonPulse {
        0% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.04); opacity: 1; }
        100% { transform: scale(1); opacity: 0.85; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#000000;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:560px;max-width:560px;background:#000000;border:1px solid #1f1f1f;border-radius:20px;">
            <tr>
              <td class="email-inner" style="padding:36px 34px;text-align:center;">
                <div style="display:inline-block;animation:neonPulse 2s ease-in-out infinite;">
                  ${logoMarkup}
                </div>
                <p style="margin:24px 0 0;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:16px;line-height:1.55;color:#FFFFFF;">
                  Click the button below to sign in. If you didn&apos;t request this, just ignore it.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px auto 0;">
                  <tr>
                    <td align="center" style="border-radius:999px;background:#A855F7;box-shadow:0 0 24px rgba(168,85,247,0.55);">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="display:inline-block;padding:16px 34px;border-radius:999px;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:0.04em;color:#FFFFFF;text-decoration:none;background:#A855F7;">
                        ENTER NEON LIVE
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:22px 0 0;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.45;color:#B5B5B5;word-break:break-word;">
                  If the button doesn&apos;t work, open this link:<br />
                  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#C084FC;text-decoration:underline;">${safeUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Email Magic Link – no password (Resend sau EMAIL_SERVER) */
async function sendVerificationRequest(params: { identifier: string; url: string }) {
  const { identifier, url } = params;
  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const r = new Resend(RESEND_API_KEY);
      await r.emails.send({
        from: EMAIL_FROM,
        to: identifier,
        subject: "Enter Neon Live",
        html: buildMagicLinkEmailHtml(url),
        text: `Click the link below to sign in:\n${url}\n\nIf you didn't request this, just ignore it.`,
      });
    } catch (e) {
      console.error("[NEON Magic Link send error]", e);
    }
  } else {
    console.log("[NEON Magic Link]", identifier, url);
  }
}

const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
const FACEBOOK_ID = process.env.FACEBOOK_CLIENT_ID ?? process.env.AUTH_FACEBOOK_ID;
const FACEBOOK_SECRET = process.env.FACEBOOK_CLIENT_SECRET ?? process.env.AUTH_FACEBOOK_SECRET;
const DISCORD_ID = process.env.DISCORD_CLIENT_ID ?? process.env.AUTH_DISCORD_ID;
const DISCORD_SECRET = process.env.DISCORD_CLIENT_SECRET ?? process.env.AUTH_DISCORD_SECRET;
const RESEND_API_KEY = process.env.AUTH_RESEND_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
const EMAIL_SERVER = process.env.EMAIL_SERVER?.trim() || process.env.AUTH_EMAIL_SERVER?.trim();
const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() || process.env.AUTH_EMAIL_FROM?.trim() || "NEON <onboarding@resend.dev>";
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL?.trim() || process.env.NEON_LOGO_URL?.trim();

function resolvedAuthBaseUrl(): string | undefined {
  return process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
}

function resolveAuthSecret(): string | undefined {
  const s =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    (process.env.NODE_ENV === "development" ? "dev-secret-min-32-chars-for-local" : undefined);
  if (!s && process.env.NODE_ENV === "production") {
    console.error(
      "[auth] Set AUTH_SECRET or NEXTAUTH_SECRET in production — without it JWT cookies cannot persist across requests."
    );
  }
  return s;
}

if (typeof process !== "undefined") {
  const authBase = resolvedAuthBaseUrl();
  if (authBase) {
    const cleaned = authBase.replace(/\/+$/, "");
    console.log("[auth] Expected OAuth callback URLs:", {
      discord: `${cleaned}/api/auth/callback/discord`,
      google: `${cleaned}/api/auth/callback/google`,
      facebook: `${cleaned}/api/auth/callback/facebook`,
    });
  }
}

/** Exported for `app/api/auth/[...nextauth]/route.ts` — Google OAuth persists `User` + `Account` here. */
export const prismaAuthAdapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAuthAdapter,
  secret: resolveAuthSecret(),
  providers: [
    /** Discord — PrismaAdapter creates `User` + `Account` on first OAuth; we sync profile fields in `signIn`. */
    ...(DISCORD_ID && DISCORD_SECRET
      ? [
          Discord({
            clientId: DISCORD_ID,
            clientSecret: DISCORD_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: { params: { scope: "identify email" } },
          }),
        ]
      : []),
    ...(GOOGLE_ID && GOOGLE_SECRET
      ? [
          Google({
            clientId: GOOGLE_ID,
            clientSecret: GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(FACEBOOK_ID && FACEBOOK_SECRET
      ? [
          Facebook({
            clientId: FACEBOOK_ID,
            clientSecret: FACEBOOK_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    EmailProvider({
      server: EMAIL_SERVER ? EMAIL_SERVER : ({} as Record<string, unknown>),
      from: EMAIL_FROM,
      sendVerificationRequest: async (p) => sendVerificationRequest({ identifier: p.identifier, url: p.url }),
    }),
  ],
  pages: {
    signIn: "/login",
    /** La eșec OAuth (ex. deschizi callback fără `code`), nu trimite la / — rămâi pe login */
    error: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const configuredBase = resolvedAuthBaseUrl()?.replace(/\/+$/, "");
      const fallbackBase = baseUrl.replace(/\/+$/, "");
      const effectiveBase = configuredBase || fallbackBase;

      try {
        const resolved = new URL(url, effectiveBase);
        const preferred = new URL(effectiveBase);

        const resolvedHost = resolved.hostname.toLowerCase();
        const preferredHost = preferred.hostname.toLowerCase();
        const neonHosts = new Set(["neonlive.chat", "www.neonlive.chat"]);

        // Keep OAuth callbacks stable if one side uses www and the other apex.
        if (neonHosts.has(resolvedHost) && neonHosts.has(preferredHost)) {
          resolved.protocol = preferred.protocol;
          resolved.host = preferred.host;
          return resolved.toString();
        }

        if (resolved.origin === preferred.origin) {
          return resolved.toString();
        }

        if (url.startsWith("/")) {
          return `${effectiveBase}${url}`;
        }
      } catch {
        // Fall back to configured base URL if parsing fails.
      }

      return effectiveBase;
    },
    async signIn({ user, account, profile }) {
      if (user?.id && typeof user.id === "string") {
        addLoginXp(user.id).catch(() => {});

        if (account?.provider === "discord") {
          const p = profile as Record<string, unknown> | null | undefined;
          const discordName =
            (typeof p?.global_name === "string" && p.global_name.trim()) ||
            (typeof p?.username === "string" && p.username.trim()) ||
            (typeof user.name === "string" && user.name.trim()) ||
            undefined;
          const email =
            (typeof p?.email === "string" && p.email.trim()) ||
            (typeof user.email === "string" && user.email.trim()) ||
            undefined;
          const image =
            (typeof user.image === "string" && user.image.trim()) ||
            (typeof p?.image_url === "string" && p.image_url.trim()) ||
            undefined;

          await prisma.user
            .update({
              where: { id: user.id },
              data: {
                ...(discordName ? { name: discordName } : {}),
                ...(email ? { email } : {}),
                ...(image ? { image } : {}),
                lastLogin: new Date(),
              },
            })
            .catch((e) => console.error("[auth] Discord profile sync", e));
        }
      }
      return true;
    },
    async session({ session, token }) {
      const userId = (token?.sub ?? token?.id) as string | undefined;
      if (session?.user && userId && typeof userId === "string") {
        session.userId = userId;
        session.user.id = userId;
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              tier: true,
              xp: true,
              currentLevel: true,
              ghostModeUntil: true,
              isGhost: true,
              country: true,
              coins: true,
              totalSpent: true,
              isVip: true,
            },
          });
          if (user) {
            session.tier = user.tier;
            session.xp = user.xp;
            session.currentLevel = user.currentLevel;
            session.totalSpent = user.totalSpent ?? 0;
            session.countryCode = user.country ?? null;
            const ghostActive = user.ghostModeUntil ? user.ghostModeUntil > new Date() : user.isGhost;
            session.isGhost = ghostActive;
            session.isNeonVip = user.isVip === true;
            session.neonVipGlow = user.isVip ? neonVipGlowVariant(userId) : undefined;
          }
          const walletCoins = await getWalletBalance(userId);
          const coins = walletCoins ?? user?.coins ?? 0;
          session.coins = coins;
          session.user.coins = coins;
          const supabase = getSupabase();
          if (session.isGhost === undefined) {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("is_ghost_mode_enabled")
              .eq("user_id", userId)
              .single();
            session.isGhost = !!profile?.is_ghost_mode_enabled;
          }
        } catch (e) {
          console.error("[auth session]", e);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id && typeof user.id === "string") {
        token.id = user.id;
        token.sub = user.id;
      }
      return token;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
});
