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

/** Email Magic Link – no password (Resend sau EMAIL_SERVER) */
async function sendVerificationRequest(params: { identifier: string; url: string }) {
  const { identifier, url } = params;
  if (process.env.AUTH_RESEND_KEY) {
    try {
      const { Resend } = await import("resend");
      const r = new Resend(process.env.AUTH_RESEND_KEY);
      await r.emails.send({
        from: process.env.EMAIL_FROM ?? "NEON <onboarding@resend.dev>",
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-min-32-chars-for-local" : undefined),
  providers: [
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
    ...(DISCORD_ID && DISCORD_SECRET
      ? [
          Discord({
            clientId: DISCORD_ID,
            clientSecret: DISCORD_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    EmailProvider({
      server: (process.env.EMAIL_SERVER as unknown as Record<string, unknown>) ?? {},
      from: process.env.EMAIL_FROM ?? "noreply@neon.app",
      sendVerificationRequest: async (p) => sendVerificationRequest({ identifier: p.identifier, url: p.url }),
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/",
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.id && typeof user.id === "string") {
        addLoginXp(user.id).catch(() => {});
      }
      return true;
    },
    async session({ session, token }) {
      const userId = (token?.sub ?? token?.id) as string | undefined;
      if (session?.user && userId && typeof userId === "string") {
        (session.user as unknown as Record<string, unknown>).id = userId;
        (session as unknown as Record<string, unknown>).userId = userId;
        // Fetch user data from DB for frontend
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
            },
          });
          if (user) {
            (session as unknown as Record<string, unknown>).tier = user.tier;
            (session as unknown as Record<string, unknown>).xp = user.xp;
            (session as unknown as Record<string, unknown>).currentLevel = user.currentLevel;
            (session as unknown as Record<string, unknown>).countryCode =
              user.country ?? null;
            const ghostActive = user.ghostModeUntil ? user.ghostModeUntil > new Date() : user.isGhost;
            (session as unknown as Record<string, unknown>).isGhost = ghostActive;
          }
          const coins = await getWalletBalance(userId);
          (session as unknown as Record<string, unknown>).coins = coins ?? 0;
          const supabase = getSupabase();
          if ((session as unknown as Record<string, unknown>).isGhost === undefined) {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("is_ghost_mode_enabled")
              .eq("user_id", userId)
              .single();
            (session as unknown as Record<string, unknown>).isGhost = !!profile?.is_ghost_mode_enabled;
          }
        } catch (e) {
          console.error("[auth session]", e);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
  },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
});
