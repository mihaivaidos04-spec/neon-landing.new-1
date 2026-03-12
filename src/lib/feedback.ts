/**
 * Micro-interactions: haptic (vibration) + short sounds.
 * Used on Next, gift send, daily bonus for dopamine feedback.
 */

let clickAudio: AudioContext | null = null;

function getClickAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (clickAudio) return clickAudio;
  try {
    clickAudio = new (window.AudioContext || (window as any).webkitAudioContext)();
    return clickAudio;
  } catch {
    return null;
  }
}

/** Short click/pop sound via Web Audio (no external files). */
export function playClickSound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // ignore
  }
}

/** Success / coins sound – slightly richer. */
export function playSuccessSound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.06);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.12);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore
  }
}

/** Haptic feedback (mobile). */
export function triggerHaptic(): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(10);
  } catch {
    // ignore
  }
}

/** Combined: sound + haptic for button press (e.g. Next). */
export function feedbackClick(): void {
  playClickSound();
  triggerHaptic();
}

/** Combined for success (gift sent, daily bonus). */
export function feedbackSuccess(): void {
  playSuccessSound();
  triggerHaptic();
}

/** Soft alert – când bateria scade la ultimul segment (<25%). */
export function playLowBatterySound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.setValueAtTime(262, ctx.currentTime + 0.1);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // ignore
  }
}

/** Kaching / sparkle – când primești un cadou. */
export function playGiftSound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.05);
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.15);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore
  }
}

/** Haptic pentru cadou Premium (mobil) – pattern mai pronunțat. */
export function triggerPremiumGiftHaptic(): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate([100, 50, 100]);
  } catch {
    // ignore
  }
}

/** Drumroll – Mystery Box anticipation (Web Audio). */
export function playDrumrollSound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 2);
    for (let i = 0; i < 16; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(gain);
      osc.type = "sine";
      osc.frequency.setValueAtTime(150 + i * 20, ctx.currentTime);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.08);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.1);
    }
  } catch {
    // ignore
  }
}

/** Explosion / reveal – Mystery Box prize reveal. */
export function playExplosionSound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, ctx.currentTime);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // ignore
  }
}

/** Quick whoosh – tranziție Next, schimbare partener. */
export function playWhooshSound(): void {
  try {
    const ctx = getClickAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, ctx.currentTime);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore
  }
}
