"use client";

import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";

export default function StudioPageHeader() {
  const locale = useStudioLocale();
  const t = getT(locale);
  return <h1 className="text-2xl font-bold text-white">{t("studio.title")}</h1>;
}
