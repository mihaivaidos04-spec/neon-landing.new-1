"use client";

import { useGiftNotifications } from "../hooks/useGiftNotifications";

export default function GiftNotificationListener() {
  useGiftNotifications();
  return null;
}
