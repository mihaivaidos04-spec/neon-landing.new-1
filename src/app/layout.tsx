import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

