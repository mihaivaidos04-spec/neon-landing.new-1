"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { I18nLocale } from "@/src/i18n";
import { getT } from "@/src/i18n";

type Props = { locale?: I18nLocale };

const NAV = [
  { href: "/studio", labelKey: "studio.overview" },
  { href: "/studio/audience", labelKey: "studio.audience" },
] as const;

const LOCALES: { value: I18nLocale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ar", label: "العربية" },
  { value: "id", label: "ID" },
];

export default function StudioSidebar({ locale = "en" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const t = getT(locale);

  const setLocale = (l: I18nLocale) => {
    document.cookie = `studio_locale=${l};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <aside className="w-full border-b border-white/10 bg-[#0a0a0d] md:w-56 md:border-b-0 md:border-r">
      <div className="flex flex-row gap-2 overflow-x-auto p-4 md:flex-col md:overflow-visible">
        <Link
          href="/"
          className="mb-4 text-sm font-semibold text-violet-400 hover:text-violet-300"
        >
          ← {t("studio.title")}
        </Link>
        <div className="mb-4 flex gap-1">
          {LOCALES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLocale(value)}
              className={`rounded px-2 py-1 text-xs font-medium ${
                locale === value ? "bg-violet-500/30 text-violet-300" : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {NAV.map(({ href, labelKey }) => {
          const active = pathname === href || (href !== "/studio" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
