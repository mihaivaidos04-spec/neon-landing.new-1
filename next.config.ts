import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"],
  // Permite conexiuni din Chrome / localhost fără avertisment cross-origin în dev
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.136:3000",
  ],
};

export default nextConfig;
