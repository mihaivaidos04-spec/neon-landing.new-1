import { redirect } from "next/navigation";
import { auth } from "@/src/auth";
import NeonProfileView from "@/src/components/profile/NeonProfileView";

export default async function ProfileMePage() {
  const session = await auth();
  const userId =
    (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? null;
  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <NeonProfileView mode="me" userId={userId} />
    </div>
  );
}
