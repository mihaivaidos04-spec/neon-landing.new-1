/**
 * CSS/Canvas video filter definitions.
 * Applied to self-view (user camera) for Beauty Blur, B&W Noir, Neon Glow.
 */

export type VideoFilterId = "none" | "beauty_blur" | "noir" | "neon_glow" | "ghost_spy";

export const VIDEO_FILTERS: Record<
  Exclude<VideoFilterId, "none">,
  { cssFilter: string; labelKey: string }
> = {
  beauty_blur: {
    cssFilter: "blur(2px) brightness(1.05) contrast(0.95) saturate(1.1)",
    labelKey: "videoFilterBeautyBlur",
  },
  noir: {
    cssFilter: "grayscale(1) contrast(1.2) brightness(0.9)",
    labelKey: "videoFilterNoir",
  },
  neon_glow: {
    cssFilter:
      "saturate(1.5) contrast(1.1) brightness(1.05) drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))",
    labelKey: "videoFilterNeonGlow",
  },
  ghost_spy: {
    cssFilter: "sepia(0.4) hue-rotate(60deg) brightness(0.7) contrast(1.3)",
    labelKey: "videoFilterGhostSpy",
  },
};

export function getFilterCss(filterId: VideoFilterId): string | undefined {
  if (filterId === "none") return undefined;
  return VIDEO_FILTERS[filterId]?.cssFilter;
}
