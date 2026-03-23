import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "@/src/lib/prisma";

const SCRYPT_KEYLEN = 32;

export function generateSixDigitOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpPlain(plain: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(plain, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

function verifyOtpAgainstStored(plain: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [saltHex, hashHex] = parts;
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const key = scryptSync(plain, salt, expected.length);
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

export function normalizeOtpEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verifies OTP, marks row used, ensures a User row exists. Returns Auth.js user shape or null.
 */
export async function consumeOtpAndEnsureUser(
  emailNorm: string,
  plainCode: string
): Promise<{ id: string; email: string; name: string | null } | null> {
  const cleaned = plainCode.replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return null;

  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.otpCode.findMany({
        where: { email: emailNorm, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 8,
      });
      for (const row of rows) {
        if (!verifyOtpAgainstStored(cleaned, row.code)) continue;
        await tx.otpCode.update({ where: { id: row.id }, data: { used: true } });

        let user = await tx.user.findUnique({ where: { email: emailNorm } });
        const now = new Date();
        if (!user) {
          user = await tx.user.create({
            data: {
              email: emailNorm,
              emailVerified: now,
              lastLogin: now,
            },
          });
        } else {
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              emailVerified: user.emailVerified ?? now,
              lastLogin: now,
            },
          });
        }
        return { id: user.id, email: user.email!, name: user.name };
      }
      return null;
    });
  } catch (e) {
    console.error("[otp-login] consumeOtpAndEnsureUser", e);
    return null;
  }
}
