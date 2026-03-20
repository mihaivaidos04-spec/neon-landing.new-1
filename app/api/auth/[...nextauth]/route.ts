/**
 * Auth.js / NextAuth App Router handler.
 * `prismaAuthAdapter` → PostgreSQL `User`, `Account`, `Session`, `VerificationToken` (see `prisma/schema.prisma`).
 */
import { handlers, prismaAuthAdapter } from "@/src/auth";

export const { GET, POST } = handlers;

/** Same adapter instance passed to `NextAuth({ adapter })` in `src/auth.ts` — Google logins write to DB. */
export { prismaAuthAdapter };