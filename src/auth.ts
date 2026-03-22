/**
 * Auth.js v5 reads AUTH_SECRET / AUTH_URL. Many hosts still set NEXTAUTH_* — mirror before NextAuth loads.
 */
if (typeof process !== "undefined") {
  if (process.env.NEXTAUTH_SECRET?.trim() && !process.env.AUTH_SECRET?.trim()) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET.trim();
  }
  if (process.env.NEXTAUTH_URL?.trim() && !process.env.AUTH_URL?.trim()) {
    process.env.AUTH_URL = process.env.NEXTAUTH_URL.trim();
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
        subject: "Conectează-te la NEON",
        html: `<p>Apasă pentru a te conecta: <a href="${url}">${url}</a></p>`,
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
