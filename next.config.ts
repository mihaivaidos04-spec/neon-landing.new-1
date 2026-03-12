import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"],
  // Permite conexiuni din Chrome / localhost în dev și din domeniul de producție
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.136:3000",
    "https://neonlive.chat",
    "https://www.neonlive.chat",
  ],
};

export default nextConfig;
