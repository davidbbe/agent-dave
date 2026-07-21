import { generateDailyBrief } from "@/lib/brief";
import { sendBriefEmail } from "@/lib/email";
import { collectResearch } from "@/lib/research";

export const runtime = "nodejs";
export const maxDuration = 90;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Allow local/dev runs without CRON_SECRET; require it in production.
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const research = await collectResearch(24);
    const brief = await generateDailyBrief(research);
    const email = await sendBriefEmail(brief);

    return Response.json({
      ok: true,
      emailId: email?.id ?? null,
      model: brief.model,
      generatedAt: brief.generatedAt,
      tickerCounts: Object.fromEntries(
        Object.entries(research.tickers).map(([id, items]) => [id, items.length]),
      ),
      peopleCounts: Object.fromEntries(
        Object.entries(research.people).map(([id, items]) => [id, items.length]),
      ),
      trendCounts: Object.fromEntries(
        Object.entries(research.trends).map(([id, items]) => [id, items.length]),
      ),
      crossRegionCount: brief.trends.crossRegion.length,
    });
  } catch (error) {
    console.error("daily-brief failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
