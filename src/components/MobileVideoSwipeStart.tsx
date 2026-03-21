"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lockRef = useRef<AxisLock>("none");
  const widthRef = useRef(320);
  const activePointerRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const apply = () => {
      setNarrow(mq.matches);
      if (!mq.matches) {
        setDragX(0);
        setDragging(false);
        setAxisLock("none");
        startRef.current = null;
        lockRef.current = "none";
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const maxDrag = useCallback(() => -Math.max(140, widthRef.current * 0.42), []);

  const endDrag = useCallback(
    (clientX: number) => {
      const start = startRef.current;
      const w = widthRef.current;
      const threshold = Math.max(MIN_COMMIT_PX, w * COMMIT_RATIO);
      const dx = clientX - (start?.x ?? clientX);
      const shouldCommit = lockRef.current === "horizontal" && dx < -threshold && !disabled;

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

      setDragging(false);
      setDragX(0);
      setAxisLock("none");
      startRef.current = null;
      lockRef.current = "none";
      activePointerRef.current = null;
    },
    [disabled, onCommit]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!narrow || disabled) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = e.currentTarget;
    widthRef.current = el.getBoundingClientRect().width || 320;
    startRef.current = { x: e.clientX, y: e.clientY };
    lockRef.current = "none";
    setAxisLock("none");
    setDragging(true);
    setDragX(0);
    activePointerRef.current = e.pointerId;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!narrow || disabled || !startRef.current || activePointerRef.current !== e.pointerId) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (lockRef.current === "none") {
      if (Math.abs(dx) >= DOMINANCE_PX && Math.abs(dx) > Math.abs(dy) * 1.15) {
        lockRef.current = "horizontal";
        setAxisLock("horizontal");
      } else if (Math.abs(dy) >= DOMINANCE_PX && Math.abs(dy) > Math.abs(dx) * 1.15) {
        lockRef.current = "vertical";
        setAxisLock("vertical");
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        setDragging(false);
        startRef.current = null;
        activePointerRef.current = null;
        return;
      }
    }

    if (lockRef.current !== "horizontal") return;

    if (dx > 8) return;
    e.preventDefault();
    const cap = maxDrag();
    const clamped = Math.max(dx, cap);
    setDragX(clamped);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    endDrag(e.clientX);
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    setDragging(false);
    setDragX(0);
    setAxisLock("none");
    startRef.current = null;
    lockRef.current = "none";
    activePointerRef.current = null;
  };

  const rotate = dragX * ROTATION_PER_PX;
  const progress = narrow && dragX < 0 ? Math.min(1, Math.abs(dragX) / Math.max(MIN_COMMIT_PX, widthRef.current * COMMIT_RATIO)) : 0;

  if (!narrow) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full [perspective:1100px]">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={`relative overflow-hidden rounded-2xl ${dragging && axisLock === "horizontal" ? "touch-none select-none" : "touch-pan-y"}`}
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
