"use client";

import { getT } from "@/src/i18n";
import { useStudioLocale } from "@/src/components/studio/StudioLocaleContext";

export default function ReportDownloadButton() {
  const locale = useStudioLocale();
  const t = getT(locale);

  return (
    <a
      href="/api/studio/report"
      download="neonlive-monthly-report.pdf"
      className="min-h-[44px] rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
    >
      {t("studio.downloadReport")}
    </a>
  );
}
