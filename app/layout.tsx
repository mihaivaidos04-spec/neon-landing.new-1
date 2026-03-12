import type { Metadata } from "next";
import Script from "next/script";
import { Poppins, Geist_Mono, Dancing_Script } from "next/font/google";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/src/components/AuthProvider";
import Footer from "@/src/components/Footer";
import UtmCapture from "@/src/components/UtmCapture";
import { SocketProviderWithAuth } from "@/src/contexts/SocketContext";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const scriptFont = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neon.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Neon | Mystery Video Chat",
  description:
    "The first video chat where every match is a mystery. Win rewards while you talk.",
  openGraph: {
    title: "Neon | Mystery Video Chat",
    description: "The first video chat where every match is a mystery. Win rewards while you talk.",
    url: "/",
    siteName: "Neon",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Neon - Mystery Video Chat. Join Now.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neon | Mystery Video Chat",
    description: "The first video chat where every match is a mystery. Win rewards while you talk.",
    images: ["/og-image.png"],
  },
};

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      {adsenseClient && (
        <head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body
        className={`${poppins.variable} ${geistMono.variable} ${scriptFont.variable} bg-black text-white antialiased`}
      >
        {/* Memory Wall – colaj blurat pe margini (desktop) */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 left-0 z-0 hidden w-32 -skew-y-3 flex-col gap-4 opacity-30 blur-md sm:flex lg:w-40"
        >
          <div className="mx-2 h-28 rounded-3xl bg-gradient-to-br from-white/15 to-white/0" />
          <div className="mx-4 h-32 rounded-3xl bg-gradient-to-br from-white/12 to-white/0" />
          <div className="mx-6 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/0" />
          <div className="mx-3 h-28 rounded-3xl bg-gradient-to-br from-white/14 to-white/0" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 right-0 z-0 hidden w-32 skew-y-3 flex-col gap-4 opacity-30 blur-md sm:flex lg:w-40"
        >
          <div className="mx-3 h-24 rounded-3xl bg-gradient-to-br from-white/12 to-white/0" />
          <div className="mx-5 h-32 rounded-3xl bg-gradient-to-br from-white/16 to-white/0" />
          <div className="mx-4 h-28 rounded-3xl bg-gradient-to-br from-white/10 to-white/0" />
          <div className="mx-2 h-24 rounded-3xl bg-gradient-to-br from-white/14 to-white/0" />
        </div>
        <Script
          src="https://app.lemonsqueezy.com/js/lemon.js"
          strategy="afterInteractive"
        />
        {adsenseClient && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        <div className="relative z-10">
          <UtmCapture />
          <AuthProvider>
            <SocketProviderWithAuth>{children}</SocketProviderWithAuth>
          </AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(15, 23, 42, 0.95)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              },
            }}
          />
          <Footer locale="en" />
        </div>
      </body>
    </html>
  );
}

