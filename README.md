# Agent Dave

Daily noon-UTC email brief for market + tech news.

## What it does

Every day at **12:00 UTC** (Hobby timing may land anytime in the 12:00–12:59 window), Vercel Cron hits `/api/daily-brief`, which:

1. Pulls the last 24 hours of Google News headlines for **TSLA, MU, META, BTC**
2. Checks for speeches/announcements by **Andrej Karpathy, Jensen Huang, Alex Karp, Sam Altman**
3. Summarizes with **Vercel AI Gateway** (`google/gemini-2.5-flash-lite` by default — cheap free-tier friendly)
4. Emails `streethouse4@gmail.com` via **Resend**

## Setup

1. Copy env template:

```bash
cp .env.example .env
```

2. Fill in:
   - `RESEND_API_KEY` + `EMAIL_FROM` (verified Resend domain)
   - `CRON_SECRET` (random string; same value in Vercel env)
   - `AI_GATEWAY_API_KEY` for local runs ([AI Gateway](https://vercel.com/docs/ai-gateway) dashboard)

3. Install and run locally:

```bash
npm install
npm run dev
```

4. Trigger once (dev, no cron secret required):

```bash
curl http://localhost:3000/api/daily-brief
```

## Deploy on Vercel (Hobby / free)

1. Push to GitHub and import the project in Vercel
2. Set env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`, `CRON_SECRET`
3. Deploy to **Production** (crons only run on production)
4. AI Gateway free monthly credits cover this once-daily load if you stay on a lite/flash model

Optional: set `AI_MODEL` to any free-tier Gateway model slug.

## Free-tier notes

- **Vercel Hobby**: daily crons only — this schedule qualifies
- **Resend free**: 100 emails/day — one daily digests is fine
- **AI Gateway free**: use lite/flash models; monitor credits in the Vercel AI Gateway dashboard so you do not top up unless you choose to
