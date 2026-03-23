import { getSupabase } from "@/src/lib/supabase";
import { prisma } from "@/src/lib/prisma";
import { createNotification } from "@/src/lib/create-notification";

const MS_PER_DAY = 86400000;

/**
 * If filter pass expires in exactly 3 calendar days (UTC ceil), enqueue one VIP notice per 6-day window.
 */
export async function maybeNotifyVipPassExpiringSoon(userId: string): Promise<void> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_profiles")
      .select("gender_pass_expiry, location_pass_expiry")
      .eq("user_id", userId)
      .maybeSingle();

    const g = data?.gender_pass_expiry as string | null | undefined;
    const l = data?.location_pass_expiry as string | null | undefined;
    const now = Date.now();
    const candidates: Date[] = [];
    for (const raw of [g, l]) {
      if (!raw) continue;
      const d = new Date(raw);
      if (!Number.isFinite(d.getTime()) || d.getTime() <= now) continue;
      candidates.push(d);
    }
    if (candidates.length === 0) return;

    const expiry = new Date(Math.max(...candidates.map((d) => d.getTime())));
    const msLeft = expiry.getTime() - now;
    const daysLeft = Math.ceil(msLeft / MS_PER_DAY);
    if (daysLeft !== 3) return;

    const recent = await prisma.notification.findFirst({
      where: {
        userId,
        type: "vip",
        title: "Pass expiring soon",
        createdAt: { gte: new Date(Date.now() - 6 * MS_PER_DAY) },
      },
    });
    if (recent) return;

    await createNotification({
      userId,
      type: "vip",
      title: "Pass expiring soon",
      message: "⚠️ Your VIP expires in 3 days. Renew now!",
      link: "/billing",
    });
  } catch (e) {
    console.warn("[maybeNotifyVipPassExpiringSoon]", e);
  }
}
