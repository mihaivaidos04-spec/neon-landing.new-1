"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";

type AxisLock = "none" | "horizontal" | "vertical";

type Props = {
  locale: ContentLocale;
  children: React.ReactNode;
  /** Same as START / NEXT button */
  onCommit: () => void | Promise<void>;
  disabled?: boolean;
};

const LG_BREAKPOINT = 1024;
const DOMINANCE_PX = 14;
const ROTATION_PER_PX = 0.065;
const MIN_COMMIT_PX = 72;
const COMMIT_RATIO = 0.2;

/**
 * Mobile (&lt; lg): horizontal swipe-left on the video card with 3D-style rotation,
 * commits on release past threshold (same action as START / NEXT).
 */
export default function MobileVideoSwipeStart({ locale, children, onCommit, disabled = false }: Props) {
  const t = getContentT(locale);
  const [narrow, setNarrow] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [axisLock, setAxisLock] = useState<AxisLock>("none");
  const containerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<AxisLock>("none");
  const widthRef = useRef(320);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const apply = () => {
      setNarrow(mq.matches);
      if (!mq.matches) {
        setDragX(0);
        setDragging(false);
        setAxisLock("none");
        lockRef.current = "none";
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const maxDrag = useCallback(() => -Math.max(140, widthRef.current * 0.42), []);

  const resetDrag = useCallback(() => {
    setDragging(false);
    setDragX(0);
    setAxisLock("none");
    lockRef.current = "none";
  }, []);

  const commitSwipe = useCallback(
    (dx: number) => {
      const w = widthRef.current;
      const threshold = Math.max(MIN_COMMIT_PX, w * COMMIT_RATIO);
      const shouldCommit = lockRef.current === "horizontal" && dx < -threshold;

      if (shouldCommit) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(12);
          } catch {
            /* ignore */
          }
        }
        void Promise.resolve(onCommit());
      }
    },
    [onCommit]
  );

  const bind = useDrag(
    ({ first, last, movement: [mx, my], event, cancel }) => {
      if (!narrow || disabled) return;

      if (first) {
        widthRef.current = containerRef.current?.getBoundingClientRect().width || 320;
        lockRef.current = "none";
        setAxisLock("none");
        setDragging(true);
        setDragX(0);
      }

      if (lockRef.current === "none") {
        if (Math.abs(mx) >= DOMINANCE_PX && Math.abs(mx) > Math.abs(my) * 1.15) {
          lockRef.current = "horizontal";
          setAxisLock("horizontal");
        } else if (Math.abs(my) >= DOMINANCE_PX && Math.abs(my) > Math.abs(mx) * 1.15) {
          lockRef.current = "vertical";
          setAxisLock("vertical");
          setDragging(false);
          setDragX(0);
          cancel();
          return;
        }
      }

      if (lockRef.current !== "horizontal") {
        if (last) resetDrag();
        return;
      }

      const nativeEvent = event as Event;
      if (nativeEvent.cancelable) nativeEvent.preventDefault();
      const clamped = mx > 8 ? 0 : Math.max(mx, maxDrag());
      setDragX(clamped);

      if (last) {
        commitSwipe(mx);
        resetDrag();
      }
    },
    {
      enabled: narrow && !disabled,
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  const rotate = dragX * ROTATION_PER_PX;
  const progress = narrow && dragX < 0 ? Math.min(1, Math.abs(dragX) / Math.max(MIN_COMMIT_PX, widthRef.current * COMMIT_RATIO)) : 0;

  if (!narrow) {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full min-h-0 w-full [perspective:1100px] max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col">
      <div
        ref={containerRef}
        {...bind()}
        className={`relative h-full min-h-0 flex-1 overflow-hidden rounded-2xl max-md:min-h-0 ${dragging && axisLock === "horizontal" ? "touch-none select-none" : "touch-pan-y"}`}
        style={{
          transformStyle: "preserve-3d" as const,
          transform: `translate3d(${dragX}px, 0, 0) rotate(${rotate}deg)`,
          transition:
            dragging && axisLock === "horizontal" ? "none" : "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
          boxShadow:
            dragX < -4
              ? `0 12px 40px -8px rgba(139, 92, 246, ${0.15 + progress * 0.35}), 0 0 0 1px rgba(236, 72, 153, ${0.12 + progress * 0.28})`
              : undefined,
        }}
      >
        {children}
      </div>

      {!disabled && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-2 z-[25] flex justify-center px-4"
          aria-hidden
        >
          <span
            className="max-w-[min(100%,18rem)] rounded-full border border-white/10 bg-black/55 px-3 py-1 text-center text-[10px] font-medium leading-tight text-white/55 backdrop-blur-md"
            style={{
              opacity: 0.45 + progress * 0.5,
              transform: `translateX(${Math.min(0, dragX) * 0.08}px)`,
            }}
          >
            {t.videoSwipeStartHint}
          </span>
        </div>
      )}
    </div>
  );
}
