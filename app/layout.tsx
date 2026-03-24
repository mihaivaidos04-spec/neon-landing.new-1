import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Syne, Orbitron, Inter, Geist_Mono, Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { getPublicSiteOrigin } from "@/src/lib/public-site-url";
import AuthProvider from "@/src/components/AuthProvider";
import Footer from "@/src/components/Footer";
import CookieConsentBanner from "@/src/components/CookieConsentBanner";
import UtmCapture from "@/src/components/UtmCapture";
import DeviceBodyClass from "@/src/components/DeviceBodyClass";
import GiftNotificationListener from "@/src/components/GiftNotificationListener";
import LegendPurchaseListener from "@/src/components/LegendPurchaseListener";
import MiniMessengerDock from "@/src/components/MiniMessengerDock";
import TrustSafetyFloatingBadge from "@/src/components/TrustSafetyFloatingBadge";
import { SocketProviderWithAuth } from "@/src/contexts/SocketContext";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Script wordmark for “NeonLive” only — love / connection accent */
const neonLiveMark = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-neonlive-mark",
  display: "swap",
});

const siteUrl = getPublicSiteOrigin();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "NeonLive",
  description: "Live video chat",
  icons: {
    icon: "/favicon.svg",
  },
  keywords: ["video chat", "anonymous chat", "live streaming", "gifting", "random chat", "neon"],
  openGraph: {
    title: "NeonLive",
    description: "Live video chat",
    url: "https://www.neonlive.chat",
    siteName: "NeonLive",
    images: [
      {
        url: "https://www.neonlive.chat/og-image.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NeonLive",
    description: "Live video chat",
    images: ["https://www.neonlive.chat/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      </head>
      <body
        className={`${syne.variable} ${orbitron.variable} ${inter.variable} ${geistMono.variable} ${cormorant.variable} ${neonLiveMark.variable} bg-[#050508] text-[#faf5eb] antialiased`}
      >
        {/* Violet + neon green ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background: "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(139, 92, 246, 0.05) 0%, rgba(57, 255, 20, 0.02) 35%, transparent 55%)",
          }}
        />
        {/* Subtle grain texture */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
        />
        {adsenseClient && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            strategy="lazyOnload"
            crossOrigin="anonymous"
          />
        )}
        <div className="relative z-10">
          <DeviceBodyClass />
          <UtmCapture />
          <AuthProvider>
            <SocketProviderWithAuth>
              <GiftNotificationListener />
              <LegendPurchaseListener />
              <MiniMessengerDock />
              {children}
              <TrustSafetyFloatingBadge />
            </SocketProviderWithAuth>
          </AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(5, 5, 8, 0.95)",
                color: "#faf5eb",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                backdropFilter: "blur(16px)",
              },
            }}
          />
          <Footer locale="en" />
          <CookieConsentBanner />
        </div>
      </body>
    </html>
  );
}

