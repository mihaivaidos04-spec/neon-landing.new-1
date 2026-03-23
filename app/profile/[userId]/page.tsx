import { redirect } from "next/navigation";
import { auth } from "@/src/auth";
import NeonProfileView from "@/src/components/profile/NeonProfileView";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  if (!userId || userId === "me") {
    redirect("/profile/me");
  }

  const session = await auth();
  const myId =
    (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id ?? null;
  if (myId && myId === userId) {
    redirect("/profile/me");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <NeonProfileView mode="public" userId={userId} />
    </div>
  );
}
