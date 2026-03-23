import { NextResponse } from "next/server";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/src/auth";
import { normalizeOtpEmail } from "@/src/lib/otp-login";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email = normalizeOtpEmail(typeof o.email === "string" ? o.email : "");
  const code = typeof o.code === "string" ? o.code.replace(/\s/g, "") : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await signIn("otp-email", {
      email,
      code,
      redirect: false,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof CredentialsSignin || (e instanceof AuthError && e.type === "CredentialsSignin")) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }
    console.error("[verify-otp]", e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
