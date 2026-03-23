import type { Options } from "canvas-confetti";

type ConfettiFn = (options?: Options) => Promise<null>;

async function loadConfetti(): Promise<ConfettiFn | null> {
  if (typeof window === "undefined") return null;
  if (typeof document === "undefined" || document.body == null) return null;
  try {
    const mod = await import("canvas-confetti");
    return mod.default as ConfettiFn;
  } catch {
    return null;
  }
}

/** Single burst; lazy-loads canvas-confetti only in the browser when `document.body` exists. */
export function safeConfetti(options?: Options): void {
  void (async () => {
    const c = await loadConfetti();
    if (!c) return;
    try {
      await c(options);
    } catch {
      /* ignore — canvas / WebGL quirks */
    }
  })();
}

/**
 * Run multiple bursts with one dynamic import (e.g. timed sequences, dual cannons).
 * All calls must stay inside `fn` so they share the loaded module.
 */
export function withConfetti(fn: (c: ConfettiFn) => void): void {
  void (async () => {
    const c = await loadConfetti();
    if (!c) return;
    try {
      fn(c);
    } catch {
      /* ignore */
    }
  })();
}
