/**
 * Auth.js / NextAuth App Router handler.
 * `prismaAuthAdapter` → PostgreSQL `User`, `Account`, `Session`, `VerificationToken`.
 */
import { handlers, prismaAuthAdapter } from "@/src/auth";

export const { GET, POST } = handlers;
export { prismaAuthAdapter };
