import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEON • Întreabă-te dacă ești gata",
  description:
    "Landing page NEON – experiență digitală de lux, lumină violet neon și mister controlat."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

