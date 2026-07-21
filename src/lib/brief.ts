import { generateObject } from "ai";
import { z } from "zod";
import { getModel, PEOPLE, TICKERS } from "@/lib/config";
import type { ResearchBundle } from "@/lib/research";
import { buildBriefTrends, type BriefTrends } from "@/lib/trends";

const briefSchema = z.object({
  tickers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      bullets: z.array(z.string()),
    }),
  ),
  people: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      summary: z.string(),
    }),
  ),
});

export type DailyBrief = {
  tickers: Array<{ id: string; label: string; bullets: string[] }>;
  people: Array<{ id: string; name: string; summary: string }>;
  trends: BriefTrends;
  generatedAt: string;
  model: string;
  windowHours: number;
};

function formatSources(bundle: ResearchBundle) {
  const lines: string[] = [];

  for (const ticker of TICKERS) {
    const items = bundle.tickers[ticker.id] ?? [];
    lines.push(`\n## ${ticker.label}`);
    if (items.length === 0) {
      lines.push("- (no headlines in the last 24 hours)");
      continue;
    }
    for (const item of items.slice(0, 5)) {
      lines.push(
        `- ${item.publishedAt} | ${item.title}${item.source ? ` [${item.source}]` : ""}`,
      );
    }
  }

  for (const person of PEOPLE) {
    const items = bundle.people[person.id] ?? [];
    lines.push(`\n## ${person.name}`);
    if (items.length === 0) {
      lines.push("- (no headlines in the last 24 hours)");
      continue;
    }
    for (const item of items.slice(0, 5)) {
      lines.push(
        `- ${item.publishedAt} | ${item.title}${item.source ? ` [${item.source}]` : ""}`,
      );
    }
  }

  return lines.join("\n");
}

function normalizeBrief(
  object: z.infer<typeof briefSchema>,
  meta: { model: string; windowHours: number; trends: BriefTrends },
): DailyBrief {
  return {
    model: meta.model,
    windowHours: meta.windowHours,
    generatedAt: new Date().toISOString(),
    trends: meta.trends,
    tickers: TICKERS.map((ticker) => {
      const found = object.tickers.find((t) => t.id === ticker.id);
      const bullets = (found?.bullets ?? [])
        .map((b) => b.trim())
        .filter(Boolean)
        .slice(0, 5);
      return {
        id: ticker.id,
        label: ticker.label,
        bullets:
          bullets.length > 0
            ? bullets
            : ["No material headlines in the last 24 hours."],
      };
    }),
    people: PEOPLE.map((person) => {
      const found = object.people.find((p) => p.id === person.id);
      const summary = found?.summary?.trim() || "None found";
      return {
        id: person.id,
        name: person.name,
        summary,
      };
    }),
  };
}

export async function generateDailyBrief(
  bundle: ResearchBundle,
): Promise<DailyBrief> {
  const model = getModel();

  const [briefResult, trends] = await Promise.all([
    generateObject({
      model,
      schema: briefSchema,
      maxOutputTokens: 4096,
      system: `You are a concise market and tech briefing analyst.
Only use the provided headlines from the last ${bundle.windowHours} hours.
Do not invent events. Prefer material news over rumor.
Keep every bullet under 25 words.
For each ticker return 3-5 short bullets (fewer is fine if coverage is thin).
For each person return one short sentence about speeches/announcements, or exactly "None found".
Always include every requested id.`,
      prompt: `Create today's brief from these sources collected at ${bundle.collectedAt}:
${formatSources(bundle)}

Return ticker ids exactly: ${TICKERS.map((t) => t.id).join(", ")}.
Return people ids exactly: ${PEOPLE.map((p) => p.id).join(", ")}.
Labels: ${TICKERS.map((t) => `${t.id}=${t.label}`).join("; ")}.
Names: ${PEOPLE.map((p) => `${p.id}=${p.name}`).join("; ")}.`,
    }),
    buildBriefTrends(bundle),
  ]);

  return normalizeBrief(briefResult.object, {
    model,
    windowHours: bundle.windowHours,
    trends,
  });
}
