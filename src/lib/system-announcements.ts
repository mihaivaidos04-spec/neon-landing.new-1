import { broadcastSystemNotificationToAllUsers } from "@/src/lib/create-notification";

/**
 * Example system broadcast (not run automatically). Call from an admin script or cron:
 * `npx tsx -e "import './src/lib/system-announcements.ts'; pushAiWhisperLanguagesAnnouncement()"`
 */
export async function pushAiWhisperLanguagesAnnouncement(): Promise<number> {
  return broadcastSystemNotificationToAllUsers(
    "New feature",
    "🎉 New feature: AI Whisper now supports 50 languages!",
    "/"
  );
}
