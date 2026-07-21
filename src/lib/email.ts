import { Resend } from "resend";
import { getEmailFrom, getEmailTo, PEOPLE, TICKERS } from "@/lib/config";
import type { DailyBrief } from "@/lib/brief";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderBriefHtml(brief: DailyBrief) {
  const date = new Date(brief.generatedAt).toUTCString();

  const tickerSections = TICKERS.map((ticker) => {
    const section = brief.tickers.find((t) => t.id === ticker.id);
    const bullets =
      section?.bullets?.length
        ? section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")
        : "<li>No material headlines in the last 24 hours.</li>";

    return `<h2 style="margin:24px 0 8px;font-size:18px;">${escapeHtml(ticker.label)}</h2><ul style="margin:0;padding-left:20px;line-height:1.5;">${bullets}</ul>`;
  }).join("");

  const peopleSections = PEOPLE.map((person) => {
    const section = brief.people.find((p) => p.id === person.id);
    const summary = section?.summary?.trim() || "None found";
    return `<h3 style="margin:16px 0 6px;font-size:16px;">${escapeHtml(person.name)}</h3><p style="margin:0;line-height:1.5;">${escapeHtml(summary)}</p>`;
  }).join("");

  return `<!DOCTYPE html>
<html>
  <body style="font-family:Georgia,serif;color:#111;max-width:680px;margin:0 auto;padding:24px;">
    <h1 style="font-size:24px;margin:0 0 8px;">Daily Market &amp; Tech Brief</h1>
    <p style="margin:0 0 24px;color:#555;font-size:14px;">Past ${brief.windowHours} hours · Generated ${escapeHtml(date)} · Model ${escapeHtml(brief.model)}</p>
    <h2 style="margin:0 0 8px;font-size:20px;">Markets</h2>
    ${tickerSections}
    <h2 style="margin:32px 0 8px;font-size:20px;">Speeches &amp; announcements</h2>
    ${peopleSections}
  </body>
</html>`;
}

export function renderBriefText(brief: DailyBrief) {
  const lines = [
    "Daily Market & Tech Brief",
    `Past ${brief.windowHours} hours · ${brief.generatedAt} · ${brief.model}`,
    "",
    "MARKETS",
  ];

  for (const ticker of TICKERS) {
    const section = brief.tickers.find((t) => t.id === ticker.id);
    lines.push("", ticker.label);
    if (section?.bullets?.length) {
      for (const bullet of section.bullets) lines.push(`- ${bullet}`);
    } else {
      lines.push("- No material headlines in the last 24 hours.");
    }
  }

  lines.push("", "SPEECHES & ANNOUNCEMENTS");
  for (const person of PEOPLE) {
    const section = brief.people.find((p) => p.id === person.id);
    lines.push("", person.name, section?.summary?.trim() || "None found");
  }

  return lines.join("\n");
}

export async function sendBriefEmail(brief: DailyBrief) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required");
  }

  const resend = new Resend(apiKey);
  const dateLabel = new Date(brief.generatedAt).toISOString().slice(0, 10);

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: [getEmailTo()],
    subject: `Daily Brief · ${dateLabel}`,
    html: renderBriefHtml(brief),
    text: renderBriefText(brief),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return data;
}
