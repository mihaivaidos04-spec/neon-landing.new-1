import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEON • Payment Successful",
};

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
