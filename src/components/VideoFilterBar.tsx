"use client";

import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import type { VideoFilterId } from "../lib/video-filters";

type Props = {
  locale: ContentLocale;
  activeFilter: VideoFilterId;
  onSelectFilter: (filter: VideoFilterId) => void;
};

const FILTER_OPTIONS: { id: VideoFilterId; labelKey: keyof ReturnType<typeof getContentT> }[] = [
  { id: "beauty_blur", labelKey: "videoFilterBeautyBlur" },
  { id: "noir", labelKey: "videoFilterNoir" },
  { id: "neon_glow", labelKey: "videoFilterNeonGlow" },
];

export default function VideoFilterBar({
  locale,
  activeFilter,
  onSelectFilter,
}: Props) {
  const t = getContentT(locale);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {FILTER_OPTIONS.map(({ id, labelKey }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelectFilter(activeFilter === id ? "none" : id)}
          className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
            activeFilter === id
              ? "bg-[#8b5cf6] text-white"
              : "border border-white/20 text-white/80 hover:bg-white/10"
          }`}
        >
          {typeof t[labelKey] === "string" ? t[labelKey] : ""}
        </button>
      ))}
    </div>
  );
}
