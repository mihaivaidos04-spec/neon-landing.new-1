/**
 * Grab a JPEG data URL from the first <video> inside a container (e.g. Agora remote view).
 */
export function captureVideoFrameFromContainer(
  container: HTMLElement | null,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): string | null {
  if (typeof document === "undefined" || !container) return null;
  const video = container.querySelector("video");
  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const maxW = options?.maxWidth ?? 640;
  const maxH = options?.maxHeight ?? 480;
  let w = vw;
  let h = vh;
  if (w > maxW) {
    h = Math.round((h * maxW) / w);
    w = maxW;
  }
  if (h > maxH) {
    w = Math.round((w * maxH) / h);
    h = maxH;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    ctx.drawImage(video, 0, 0, w, h);
  } catch {
    return null;
  }

  try {
    return canvas.toDataURL("image/jpeg", options?.quality ?? 0.72);
  } catch {
    return null;
  }
}
