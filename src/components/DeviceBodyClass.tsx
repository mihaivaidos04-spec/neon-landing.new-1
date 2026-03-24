"use client";

import { useEffect } from "react";
import { useDevice } from "../hooks/useDevice";

/** Sets `data-device` and `device-mobile` / `device-desktop` on `body` for global CSS hooks. */
export default function DeviceBodyClass() {
  const { isMobile, isDesktop } = useDevice();

  useEffect(() => {
    const body = document.body;
    body.dataset.device = isMobile ? "mobile" : "desktop";
    body.classList.toggle("device-mobile", isMobile);
    body.classList.toggle("device-desktop", isDesktop);
    return () => {
      delete body.dataset.device;
      body.classList.remove("device-mobile", "device-desktop");
    };
  }, [isMobile, isDesktop]);

  return null;
}
