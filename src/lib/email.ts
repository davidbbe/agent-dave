import { Resend } from "resend";
import { getEmailFrom, getEmailTo, PEOPLE, TICKERS } from "@/lib/config";
import type { DailyBrief } from "@/lib/brief";
import type { BriefTrendItem } from "@/lib/trends";

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const TICKER_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  TSLA: { bg: "#fff1f0", text: "#b42318", accent: "#f04438" },
  MU: { bg: "#eff8ff", text: "#175cd3", accent: "#2e90fa" },
  META: { bg: "#f4f3ff", text: "#5925dc", accent: "#7a5af8" },
  BTC: { bg: "#fff6ed", text: "#b54708", accent: "#f79009" },
};

const TREND_ACCENTS: Record<string, string> = {
  us: "#1d4ed8",
  thailand: "#c2410c",
  bulgaria: "#7c3aed",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function trendDisplayTitle(item: BriefTrendItem) {
  const en = item.titleEn.trim();
  const original = item.title.trim();
  if (en && original && en.toLowerCase() !== original.toLowerCase()) {
    return `${escapeHtml(en)} <span style="color:#94a3b8;font-weight:500;">(${escapeHtml(original)})</span>`;
  }
  return escapeHtml(en || original);
}

function trendNewsLine(item: BriefTrendItem) {
  const headline = (item.newsTitleEn || item.newsTitle || "").trim();
  if (!headline) return "";
  const source = item.newsSource ? `${escapeHtml(item.newsSource)} — ` : "";
  const text = `${source}${escapeHtml(headline)}`;
  if (item.newsUrl) {
    return `<a href="${escapeHtml(item.newsUrl)}" style="color:#64748b;text-decoration:none;">${text}</a>`;
  }
  return text;
}

function renderTrendRows(items: BriefTrendItem[]) {
  if (items.length === 0) {
    return `<tr><td style="padding:8px 0;font-size:14px;color:#94a3b8;font-style:italic;">No trends available.</td></tr>`;
  }

  return items
    .map((item) => {
      const news = trendNewsLine(item);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:28px;vertical-align:top;font-size:13px;font-weight:700;color:#94a3b8;padding-top:2px;">#${item.rank}</td>
              <td style="vertical-align:top;">
                <div style="font-size:15px;line-height:1.4;font-weight:650;color:#0f172a;">
                  ${trendDisplayTitle(item)}
                  <span style="display:inline-block;margin-left:8px;font-size:11px;font-weight:700;letter-spacing:0.02em;color:#0f766e;background:#ecfdf5;border-radius:999px;padding:2px 8px;vertical-align:middle;">${escapeHtml(item.approxTraffic)}</span>
                </div>
                ${news ? `<div style="margin-top:4px;font-size:13px;line-height:1.45;color:#64748b;">${news}</div>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");
}

/** Compact list for side-by-side Thailand / Bulgaria columns */
function renderCompactTrendRows(items: BriefTrendItem[]) {
  if (items.length === 0) {
    return `<tr><td style="padding:6px 0;font-size:12px;color:#94a3b8;font-style:italic;">No trends.</td></tr>`;
  }

  return items
    .map((item) => {
      const title = escapeHtml(item.titleEn.trim() || item.title.trim());
      const description = (item.descriptionEn || item.newsTitleEn || "").trim();
      return `<tr>
        <td style="padding:7px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:20px;vertical-align:top;font-size:11px;font-weight:700;color:#94a3b8;padding-top:1px;">#${item.rank}</td>
              <td style="vertical-align:top;">
                <div style="font-size:13px;line-height:1.35;font-weight:650;color:#0f172a;">${title}</div>
                ${
                  description
                    ? `<div style="margin-top:2px;font-size:11px;line-height:1.4;color:#64748b;">${escapeHtml(description)}</div>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");
}

function renderFullTrendSection(region: {
  id: string;
  label: string;
  items: BriefTrendItem[];
}) {
  const accent = TREND_ACCENTS[region.id] ?? "#475569";
  return `
      <tr>
        <td style="padding:0 0 14px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${accent};margin-right:8px;vertical-align:middle;"></span>
                <span style="font-size:15px;font-weight:700;color:#0f172a;vertical-align:middle;">${escapeHtml(region.label)}</span>
                <span style="margin-left:8px;font-size:12px;color:#94a3b8;vertical-align:middle;">Top ${region.items.length || 10}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 16px 8px 16px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderTrendRows(region.items)}</table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
}

function renderCompactTrendColumn(region: {
  id: string;
  label: string;
  items: BriefTrendItem[];
}) {
  const accent = TREND_ACCENTS[region.id] ?? "#475569";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${accent};margin-right:6px;vertical-align:middle;"></span>
          <span style="font-size:13px;font-weight:700;color:#0f172a;vertical-align:middle;">${escapeHtml(region.label)}</span>
          <span style="margin-left:6px;font-size:11px;color:#94a3b8;vertical-align:middle;">Top ${region.items.length || 5}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:2px 10px 6px 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderCompactTrendRows(region.items)}</table>
        </td>
      </tr>
    </table>`;
}

export function renderBriefHtml(brief: DailyBrief) {
  const date = new Date(brief.generatedAt).toUTCString();
  const dateShort = new Date(brief.generatedAt).toISOString().slice(0, 10);

  const tickerSections = TICKERS.map((ticker) => {
    const section = brief.tickers.find((t) => t.id === ticker.id);
    const colors = TICKER_COLORS[ticker.id] ?? {
      bg: "#f8fafc",
      text: "#334155",
      accent: "#64748b",
    };
    const bullets =
      section?.bullets?.length
        ? section.bullets
            .map(
              (b) =>
                `<tr>
                  <td style="padding:0 0 10px 0;vertical-align:top;width:18px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors.accent};margin-top:6px;"></span>
                  </td>
                  <td style="padding:0 0 10px 0;font-size:15px;line-height:1.55;color:#1e293b;">${escapeHtml(b)}</td>
                </tr>`,
            )
            .join("")
        : `<tr><td colspan="2" style="font-size:15px;color:#64748b;">No material headlines in the last 24 hours.</td></tr>`;

    return `
      <tr>
        <td style="padding:0 0 16px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:14px 18px;background:${colors.bg};border-bottom:1px solid #e2e8f0;">
                <span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${colors.text};background:#fff;border:1px solid ${colors.accent}33;border-radius:999px;padding:4px 10px;">${escapeHtml(ticker.id)}</span>
                <span style="display:inline-block;margin-left:8px;font-size:16px;font-weight:650;color:#0f172a;">${escapeHtml(ticker.label)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 18px 8px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${bullets}</table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join("");

  const peopleSections = PEOPLE.map((person, index) => {
    const section = brief.people.find((p) => p.id === person.id);
    const summary = section?.summary?.trim() || "None found";
    const isNone = summary.toLowerCase() === "none found";
    const accents = ["#0d9488", "#2563eb", "#db2777", "#ca8a04"];
    const accent = accents[index % accents.length];

    return `
      <tr>
        <td style="padding:0 0 12px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
            <tr>
              <td style="width:5px;background:${accent};border-radius:12px 0 0 12px;"></td>
              <td style="padding:14px 16px;">
                <div style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 6px 0;">${escapeHtml(person.name)}</div>
                <div style="font-size:14px;line-height:1.55;color:${isNone ? "#94a3b8" : "#334155"};font-style:${isNone ? "italic" : "normal"};">${escapeHtml(summary)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join("");

  const regions = brief.trends?.regions ?? [];
  const usRegion = regions.find((r) => r.id === "us");
  const thailandRegion = regions.find((r) => r.id === "thailand");
  const bulgariaRegion = regions.find((r) => r.id === "bulgaria");

  const trendSections = [
    usRegion ? renderFullTrendSection(usRegion) : "",
    thailandRegion || bulgariaRegion
      ? `<tr>
        <td style="padding:0 0 14px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="width:50%;padding:0 6px 0 0;vertical-align:top;">
                ${thailandRegion ? renderCompactTrendColumn(thailandRegion) : ""}
              </td>
              <td width="50%" style="width:50%;padding:0 0 0 6px;vertical-align:top;">
                ${bulgariaRegion ? renderCompactTrendColumn(bulgariaRegion) : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      : "",
  ].join("");

  const crossRegion =
    brief.trends?.crossRegion?.length > 0
      ? `<tr>
        <td style="padding:0 0 16px 0;">
          <div style="font-size:13px;line-height:1.5;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;">
            <span style="font-weight:700;color:#0f172a;">Also rising in 2+ regions:</span>
            ${escapeHtml(brief.trends.crossRegion.join(" · "))}
          </div>
        </td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daily Brief ${escapeHtml(dateShort)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2ff;font-family:${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#dbeafe 0%,#eef2ff 180px,#f8fafc 180px);padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;">
            <tr>
              <td style="padding:0 0 18px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f766e 0%,#1d4ed8 55%,#7c3aed 100%);border-radius:18px;overflow:hidden;">
                  <tr>
                    <td style="padding:28px 28px 24px 28px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#ccfbf1;margin:0 0 8px 0;">Agent Dave</div>
                      <div style="font-size:28px;line-height:1.2;font-weight:750;color:#ffffff;margin:0 0 10px 0;">Daily Market &amp; Tech Brief</div>
                      <div style="font-size:13px;line-height:1.5;color:#e0e7ff;">
                        Past ${brief.windowHours} hours · ${escapeHtml(date)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 4px 10px 4px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Markets</div>
              </td>
            </tr>
            ${tickerSections}

            <tr>
              <td style="padding:12px 4px 10px 4px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Speeches &amp; announcements</div>
              </td>
            </tr>
            ${peopleSections}

            <tr>
              <td style="padding:12px 4px 10px 4px;">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Web trends</div>
              </td>
            </tr>
            ${trendSections}
            ${crossRegion}

            <tr>
              <td style="padding:18px 8px 8px 8px;text-align:center;">
                <div style="font-size:12px;line-height:1.5;color:#94a3b8;">
                  Generated by Agent Dave · ${escapeHtml(brief.model)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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

  lines.push("", "WEB TRENDS");
  for (const region of brief.trends?.regions ?? []) {
    lines.push("", region.label);
    if (region.items.length === 0) {
      lines.push("- No trends available.");
      continue;
    }
    const compact = region.id === "thailand" || region.id === "bulgaria";
    for (const item of region.items) {
      const en = item.titleEn.trim();
      const original = item.title.trim();
      const title =
        !compact &&
        en &&
        original &&
        en.toLowerCase() !== original.toLowerCase()
          ? `${en} (${original})`
          : en || original;
      if (compact) {
        lines.push(`#${item.rank} ${title}`);
        const description = (item.descriptionEn || item.newsTitleEn || "").trim();
        if (description) lines.push(`  ${description}`);
      } else {
        lines.push(`#${item.rank} ${title} · ${item.approxTraffic}`);
        const headline = (item.newsTitleEn || item.newsTitle || "").trim();
        if (headline) {
          const source = item.newsSource ? `${item.newsSource} — ` : "";
          lines.push(`  ${source}${headline}`);
        }
      }
    }
  }
  if (brief.trends?.crossRegion?.length) {
    lines.push(
      "",
      `Also rising in 2+ regions: ${brief.trends.crossRegion.join(" · ")}`,
    );
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
