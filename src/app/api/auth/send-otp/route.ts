import { NextResponse } from "next/server";
import { buildOtpEmailHtml, formatOtpDisplay } from "@/src/lib/otp-email-html";
import { generateSixDigitOtp, hashOtpPlain, normalizeOtpEmail } from "@/src/lib/otp-login";
import { prisma } from "@/src/lib/prisma";

const RESEND_API_KEY = process.env.AUTH_RESEND_KEY?.trim() || process.env.RESEND_API_KEY?.trim();
const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() ||
  process.env.AUTH_EMAIL_FROM?.trim() ||
  "NeonLive <login@neonlive.chat>";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const emailRaw = typeof body === "object" && body && "email" in body ? String((body as { email: unknown }).email) : "";
  const email = normalizeOtpEmail(emailRaw);
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const plain = generateSixDigitOtp();
  const hashed = hashOtpPlain(plain);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  await prisma.otpCode.create({
    data: { email, code: hashed, expiresAt },
  });

  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const r = new Resend(RESEND_API_KEY);
      await r.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "NeonLive — cod de autentificare",
        html: buildOtpEmailHtml(plain),
        text: `Codul tău de autentificare este: ${formatOtpDisplay(plain)}\nExpiră în 5 minute.`,
      });
    } catch (e) {
      console.error("[send-otp] Resend error", e);
      return NextResponse.json({ error: "Could not send email" }, { status: 502 });
    }
  } else {
    console.log("[send-otp] DEV no RESEND_API_KEY — OTP for", email, plain);
  }

  return NextResponse.json({ ok: true });
}
