import { Suspense } from "react";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <span className="animate-pulse">Se încarcă...</span>
      </div>
    }>
      {children}
    </Suspense>
  );
}
