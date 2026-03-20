import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { getUserAnalytics } from "@/src/lib/creator-analytics";
import { jsPDF } from "jspdf";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as { userId?: string })?.userId ?? (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = req.nextUrl.searchParams.get("month");
    const analytics = await getUserAnalytics(userId);

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("NeonLive Monthly Earnings Report", 20, 25);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

    let y = 50;
    doc.setFontSize(14);
    doc.text("Summary", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Gross Revenue: €${analytics.grossRevenue.toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Net Revenue (after 20% fee): €${analytics.netRevenue.toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Average Gift Value: ${analytics.averageGiftValue.toFixed(1)} coins`, 20, y);
    y += 7;
    doc.text(`Retention Rate: ${analytics.retentionRate.toFixed(1)}%`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text("Top Countries", 20, y);
    y += 10;
    doc.setFontSize(10);
    for (const c of analytics.topCountries) {
      doc.text(`${c.country}: ${c.coins} coins`, 20, y);
      y += 7;
    }

    const buf = doc.output("arraybuffer");
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="neonlive-report-${month ?? "monthly"}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[api/studio/report]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
