import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/src/auth";
import StudioSidebar from "@/src/components/studio/StudioSidebar";
import { StudioLocaleProvider } from "@/src/components/studio/StudioLocaleContext";
import { isRtl } from "@/src/i18n";
import type { I18nLocale } from "@/src/i18n";

export const revalidate = 60;

const VALID_LOCALES: I18nLocale[] = ["en", "ar", "id"];

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
  if (!userId) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("studio_locale")?.value;
  const locale: I18nLocale =
    localeCookie && VALID_LOCALES.includes(localeCookie as I18nLocale)
      ? (localeCookie as I18nLocale)
      : "en";

  return (
    <StudioLocaleProvider locale={locale}>
      <div
        className="flex min-h-screen flex-col bg-[#050508] md:flex-row"
        dir={isRtl(locale) ? "rtl" : "ltr"}
      >
        <StudioSidebar locale={locale} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </StudioLocaleProvider>
  );
}
