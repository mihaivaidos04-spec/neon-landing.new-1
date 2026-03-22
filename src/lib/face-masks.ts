/** AR face mask modes (Jeeliz FaceFilter + canvas overlay). */
export type FaceMaskId = "none" | "anonymous" | "neon_glasses" | "beauty";

export const NEON_GLASSES_COST = 10;

export const DETECT_THRESHOLD = 0.72;

export function drawAnonymousMask(
  ctx: CanvasRenderingContext2D,
  f: { x: number; y: number; w: number; h: number }
) {
  const pad = f.w * 0.06;
  const rx = f.w * 0.32;
  ctx.save();
  ctx.fillStyle = "rgba(28, 28, 34, 0.92)";
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(
      f.x - pad,
      f.y - pad,
      f.w + pad * 2,
      f.h + pad * 2,
      rx
    );
  } else {
    const x = f.x - pad,
      y = f.y - pad,
      w = f.w + pad * 2,
      h = f.h + pad * 2;
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + w - rx, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rx);
    ctx.lineTo(x + w, y + h - rx);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h);
    ctx.lineTo(x + rx, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rx);
    ctx.lineTo(x, y + rx);
    ctx.quadraticCurveTo(x, y, x + rx, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const ew = f.w * 0.2;
  const eh = f.w * 0.11;
  const ecx = f.w * 0.28;
  const ey = f.y + f.h * 0.36;
  ctx.fillStyle = "#080808";
  ctx.beginPath();
  ctx.ellipse(f.x + ecx, ey, ew / 2, eh / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(f.x + f.w - ecx, ey, ew / 2, eh / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.ellipse(f.x + f.w / 2, f.y + f.h * 0.7, f.w * 0.18, f.h * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawNeonGlasses(
  ctx: CanvasRenderingContext2D,
  f: { x: number; y: number; w: number; h: number }
) {
  const y = f.y + f.h * 0.34;
  const lensW = f.w * 0.26;
  const lensH = f.h * 0.14;
  const gap = f.w * 0.1;
  const cxL = f.x + f.w / 2 - gap / 2 - lensW / 2;
  const cxR = f.x + f.w / 2 + gap / 2 + lensW / 2;
  const r = Math.min(12, lensH * 0.35);

  ctx.save();
  ctx.shadowColor = "#39ff14";
  ctx.shadowBlur = 22;
  ctx.strokeStyle = "#39ff14";
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    const rr = ctx as CanvasRenderingContext2D & {
      roundRect: (x: number, y: number, w: number, h: number, radii: number) => void;
    };
    rr.roundRect(cxL - lensW / 2, y, lensW, lensH, r);
    ctx.stroke();
    ctx.beginPath();
    rr.roundRect(cxR - lensW / 2, y, lensW, lensH, r);
  } else {
    ctx.rect(cxL - lensW / 2, y, lensW, lensH);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(cxR - lensW / 2, y, lensW, lensH);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(236, 72, 153, 0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(f.x + f.w * 0.2, y + lensH / 2);
  ctx.lineTo(f.x + f.w * 0.8, y + lensH / 2);
  ctx.stroke();
  ctx.restore();
}

export function drawBeautyOverlay(
  ctx: CanvasRenderingContext2D,
  f: { x: number; y: number; w: number; h: number },
  cw: number,
  ch: number
) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const mk = (px: number, py: number) => {
    const g = ctx.createRadialGradient(px, py, 0, px, py, f.w * 0.38);
    g.addColorStop(0, "rgba(255, 214, 196, 0.42)");
    g.addColorStop(1, "rgba(255, 214, 196, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  };
  mk(f.x + f.w * 0.32, f.y + f.h * 0.46);
  mk(f.x + f.w * 0.68, f.y + f.h * 0.46);
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = "rgba(255, 250, 245, 0.06)";
  ctx.fillRect(0, 0, cw, ch);
  ctx.restore();
}
