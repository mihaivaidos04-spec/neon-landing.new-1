/**
 * Must match `MAX_CHAT_DISPLAY_USERNAME_CODEPOINTS` from
 * `src/lib/chat-display-username-limit.ts` (longest generated chat handle).
 * Refresh: `npx tsx -e "import { MAX_CHAT_DISPLAY_USERNAME_CODEPOINTS } from './src/lib/chat-display-username-limit.ts'; console.log(MAX_CHAT_DISPLAY_USERNAME_CODEPOINTS)"`
 */
export const MAX_GLOBAL_PULSE_USERNAME_LEN = 65;
