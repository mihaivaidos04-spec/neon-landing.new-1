import { prisma } from "@/src/lib/prisma";
import { analyzeReportPriority } from "@/src/lib/moderation";

export async function applyReportAiTriage(
  reportId: string,
  reason: string,
  details: string | null
): Promise<void> {
  try {
    const priority = await analyzeReportPriority(reason, details ?? "");
    await prisma.report.update({
      where: { id: reportId },
      data: { aiPriority: priority },
    });
  } catch (e) {
    console.error("[report-ai-triage]", e);
  }
}
