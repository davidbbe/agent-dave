import { generateObject } from "ai";
import { z } from "zod";
import { getModel, PEOPLE, TICKERS } from "@/lib/config";
import type { ResearchBundle } from "@/lib/research";

const briefSchema = z.object({
  tickers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      bullets: z.array(z.string()).min(0).max(5),
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

export type DailyBrief = z.infer<typeof briefSchema> & {
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
    for (const item of items) {
      lines.push(
        `- ${item.publishedAt} | ${item.title}${item.source ? ` [${item.source}]` : ""} | ${item.link}`,
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
    for (const item of items) {
      lines.push(
        `- ${item.publishedAt} | ${item.title}${item.source ? ` [${item.source}]` : ""} | ${item.link}`,
      );
    }
  }

  return lines.join("\n");
}

export async function generateDailyBrief(
  bundle: ResearchBundle,
): Promise<DailyBrief> {
  const model = getModel();

  const { object } = await generateObject({
    model,
    schema: briefSchema,
    system: `You are a concise market and tech briefing analyst.
Only use the provided headlines from the last ${bundle.windowHours} hours.
Do not invent events. Prefer material news over rumor.
For each ticker, write 3-5 short bullets (or fewer if little coverage).
For each person, write one short paragraph about speeches/announcements, or exactly "None found" if nothing relevant.`,
    prompt: `Create today's brief from these sources collected at ${bundle.collectedAt}:
${formatSources(bundle)}

Return ticker ids exactly as: ${TICKERS.map((t) => t.id).join(", ")}.
Return people ids exactly as: ${PEOPLE.map((p) => p.id).join(", ")}.
Use these labels/names:
${TICKERS.map((t) => `${t.id}=${t.label}`).join("; ")}
${PEOPLE.map((p) => `${p.id}=${p.name}`).join("; ")}`,
  });

  return {
    ...object,
    generatedAt: new Date().toISOString(),
    model,
    windowHours: bundle.windowHours,
  };
}
