"use client";

import { useState, useEffect } from "react";
import { isMobile as checkMobile } from "../lib/device";

/**
 * Reactive device mode: UA + viewport (resizes update `isMobile`).
 */
export function useDevice() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const update = () => setIsMobileDevice(checkMobile());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return {
    isMobile: isMobileDevice,
    isDesktop: !isMobileDevice,
  };
}
