export function requireAdmin(session: unknown): boolean {
  const s = session as { user?: { id?: string; email?: string | null } } | null;
  if (!s?.user) return false;
  const email = s.user.email ?? undefined;
  const userId = (s as { userId?: string })?.userId ?? s.user.id;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUserId = process.env.ADMIN_USER_ID;
  if (adminEmail && email && email.toLowerCase() === adminEmail.toLowerCase()) return true;
  if (adminUserId && userId && userId === adminUserId) return true;
  return false;
}
