import type { Metadata } from "next";
import "./globals.css";
import { Orbitron, Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "NEON • Ask yourself if you're ready",
  description:
    "NEON – Premium random video chat. Connect with new people worldwide. Neon lights, real connections."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${orbitron.variable} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

