/** Segment config must live in this file — Next.js cannot parse re-exported `runtime`. */
export const runtime = "nodejs";

export { POST } from "@/src/app/api/cron/chat-messages-cleanup/route";
