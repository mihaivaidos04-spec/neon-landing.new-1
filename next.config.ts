import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer", "stripe"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.136:3000",
    "https://neonchat.live",
    "https://www.neonchat.live",
    "https://neonlive.chat",
    "https://www.neonlive.chat",
  ],
  // Edge Caching: optimizează livrarea în Asia (imagini, fonturi, assets)
  // s-maxage permite CDN-ului (Cloudflare, Railway Edge) să cache-uiască la edge
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      { source: "/favicon.ico", headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" }] },
      { source: "/og-image.png", headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" }] },
    ];
  },
};

export default nextConfig;
