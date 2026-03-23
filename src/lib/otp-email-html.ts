function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Spaced digits e.g. "4 7 2 9 1 3" */
export function formatOtpDisplay(six: string): string {
  return six.split("").join(" ");
}

export function buildOtpEmailHtml(plainSixDigits: string): string {
  const spaced = escapeHtml(formatOtpDisplay(plainSixDigits));
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid #2a2a3a;">
        <tr><td align="center" style="padding:40px 32px 20px;">
          <div style="font-size:32px;font-weight:900;font-family:Arial Black,sans-serif;letter-spacing:2px;">
            <span style="color:#ffffff;">NEON</span><span style="color:#a855f7;">LIVE</span>
          </div>
          <div style="width:40px;height:3px;background:#a855f7;margin:12px auto;border-radius:2px;"></div>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 16px;">
          <p style="color:#aaaaaa;font-size:15px;line-height:1.6;margin:0;">
            Codul tău de autentificare este:
          </p>
        </td></tr>
        <tr><td align="center" style="padding:16px 32px 24px;">
          <div style="font-size:36px;font-weight:800;letter-spacing:0.35em;color:#ffffff;font-family:Arial Black,sans-serif;">
            ${spaced}
          </div>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 20px;">
          <p style="color:#888888;font-size:14px;line-height:1.5;margin:0;">
            Expiră în 5 minute.<br/>
            Dacă nu ai solicitat acest cod, ignoră acest email.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 24px;">
          <p style="color:#c4b5fd;font-size:14px;line-height:1.55;margin:0;">
            Știai? NeonLive traduce conversațiile live cu AI.<br/>
            <a href="https://neonlive.chat" style="color:#f0abfc;text-decoration:underline;">Începe primul chat tradus</a>
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 32px;border-top:1px solid #1a1a2a;">
          <p style="color:#333;font-size:11px;margin:16px 0 0;">
            © 2025 NeonLive · neonlive.chat
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
