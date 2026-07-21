# Agent Dave

Daily noon-UTC email brief for markets, tech people, and web trends.

## What it does

Every day at **12:00 UTC** (Hobby timing may land anytime in the 12:00–12:59 window), Vercel Cron hits `/api/daily-brief`, which:

1. Pulls the last 24 hours of Google News headlines for **TSLA, MU, META, BTC**
2. Checks for speeches/announcements by **Andrej Karpathy, Jensen Huang, Alex Karp, Sam Altman**
3. Pulls Google Trends top searches for:
   - **United States** — top 10 (with traffic + related news; non-English titles translated)
   - **Thailand** and **Bulgaria** — top 5 each (English labels + short descriptions; no traffic badges)
4. Flags topics rising in **2+ regions**
5. Summarizes markets/people with **Vercel AI Gateway** (`google/gemini-2.5-flash` by default)
6. Emails `EMAIL_TO` via **Resend** as an HTML + plain-text digest

Configurable lists live in `src/lib/config.ts` (`TICKERS`, `PEOPLE`, `TREND_REGIONS`, `DEFAULT_MODEL`).

## What’s in the email (data + AI)

All LLM calls go through **Vercel AI Gateway** using the [AI SDK](https://ai-sdk.dev) `generateObject` helper. Default model: **`google/gemini-2.5-flash`** (override with `AI_MODEL`). No provider SDKs are wired directly — the Gateway routes the request.

| Email section | Data source (no AI) | LLM / API used |
| --- | --- | --- |
| **Markets** (TSLA, MU, META, BTC) | [Google News RSS](https://news.google.com/rss) — last 24h headlines per ticker | AI Gateway summarizes into 3–5 short bullets per ticker |
| **Speeches & announcements** (Karpathy, Huang, Karp, Altman) | Google News RSS — last 24h headlines per person | Same Gateway call as Markets — one sentence each, or `"None found"` |
| **Web trends · United States** | [Google Trends RSS](https://trends.google.com/trending/rss?geo=US) — top 10 + traffic + related news | AI Gateway only when a title/headline looks non-English — translates to English |
| **Web trends · Thailand / Bulgaria** | Google Trends RSS (`geo=TH`, `geo=BG`) — top 5 each + related news | AI Gateway localizes every item: English label + short description from the news headline |
| **Also rising in 2+ regions** | — | **No LLM** — plain string match on English trend titles across regions |
| **Delivery** | — | **Resend API** sends HTML + plain-text email (not an LLM) |

In practice that means **up to three** Gateway model calls per daily run:

1. One structured brief for all markets + people (`src/lib/brief.ts`)
2. One optional US translation pass if non-English strings appear (`src/lib/trends.ts`)
3. One Thailand/Bulgaria localize-and-describe pass (`src/lib/trends.ts`)

RSS fetches and email sending do not use AI credits.

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill in:

| Variable             | Required | Notes                                                                                                      |
| -------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`     | Yes      | From [Resend](https://resend.com)                                                                          |
| `EMAIL_FROM`         | Yes      | Verified Resend domain (sent as `Agent Dave <EMAIL_FROM>`)                                                 |
| `EMAIL_TO`           | No       | Defaults to `streethouse4@gmail.com`                                                                       |
| `CRON_SECRET`        | Prod     | Random string; same value in Vercel env                                                                    |
| `AI_GATEWAY_API_KEY` | Local    | From the [AI Gateway](https://vercel.com/docs/ai-gateway) dashboard; on Vercel, OIDC can work without this |
| `AI_MODEL`           | No       | Defaults to `google/gemini-2.5-flash`                                                                      |

3. Install and run locally:

```bash
npm install
npm run dev
```

4. Trigger once (dev, no cron secret required):

```bash
curl http://localhost:3000/api/daily-brief
```

In production, call with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/daily-brief
```

## Deploy on Vercel (Hobby / free)

1. Push to GitHub and import the project in Vercel
2. Set env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`, `CRON_SECRET`
3. Deploy to **Production** (crons only run on production)
4. Cron schedule is defined in `vercel.json`: `0 12 * * *` → `/api/daily-brief`

Optional: set `AI_MODEL` to any free-tier Gateway model slug.

## Free-tier notes

- **Vercel Hobby**: daily crons only — this schedule qualifies
- **Resend free**: 100 emails/day — one daily digest is fine
- **AI Gateway**: every Vercel team gets **$5 of monthly free credits** that AI Gateway uses. That is more than enough for this once-daily brief on a lite/flash model. Credits start on first Gateway request; buying paid credits moves you off the monthly free allowance. Monitor usage in the AI Gateway dashboard.
