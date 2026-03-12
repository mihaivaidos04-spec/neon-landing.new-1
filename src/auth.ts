import NextAuth from "next-auth";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Reddit from "next-auth/providers/reddit";
import EmailProvider from "next-auth/providers/email";
import type { OAuthConfig } from "next-auth/providers";

/** Snapchat OAuth2 (Snap Kit) – custom provider */
function Snapchat(options: { clientId: string; clientSecret: string }): OAuthConfig<any> {
  return {
    id: "snapchat",
    name: "Snapchat",
    type: "oauth",
    authorization: {
      url: "https://accounts.snap.com/oauth2/v2/authorize",
      params: { scope: "https://auth.snap.com/display_name https://auth.snap.com/bitmoji/avatar" },
    },
    token: "https://accounts.snap.com/oauth2/v2/token",
    userinfo: "https://api.snap.com/v2/me",
    profile(profile: any) {
      return {
        id: profile?.sub ?? profile?.id,
        name: profile?.display_name ?? profile?.name ?? null,
        image: profile?.bitmoji?.avatar_image_url ?? profile?.picture ?? null,
        email: profile?.email ?? null,
      };
    },
    style: { bg: "#FFFC00", text: "#000" },
    ...options,
  };
}

/** Email Magic Link – no password */
async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
}) {
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-min-32-chars-for-local" : undefined),
  providers: [
    Apple({
      clientId: process.env.AUTH_APPLE_ID ?? "",
      clientSecret: process.env.AUTH_APPLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Snapchat({
      clientId: process.env.AUTH_SNAPCHAT_ID ?? "",
      clientSecret: process.env.AUTH_SNAPCHAT_SECRET ?? "",
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID ?? "",
      clientSecret: process.env.AUTH_DISCORD_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Reddit({
      clientId: process.env.AUTH_REDDIT_ID ?? "",
      clientSecret: process.env.AUTH_REDDIT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {},
      from: process.env.EMAIL_FROM ?? "noreply@neon.app",
      sendVerificationRequest: async (p) => sendVerificationRequest({ identifier: p.identifier, url: p.url }),
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token?.sub) {
        (session.user as any).id = token.sub;
        (session as any).userId = token.sub;
      }
      if (token?.id) (session as any).userId = token.id;
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
