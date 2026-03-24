/** True when mobile UA or viewport width is under 768px (client-only). */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );
}

export function isDesktop(): boolean {
  return !isMobile();
}
