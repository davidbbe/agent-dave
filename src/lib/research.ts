import Parser from "rss-parser";
import { PEOPLE, TICKERS } from "@/lib/config";

export type NewsItem = {
  title: string;
  link: string;
  publishedAt: string;
  source?: string;
};

export type ResearchBundle = {
  collectedAt: string;
  windowHours: number;
  tickers: Record<string, NewsItem[]>;
  people: Record<string, NewsItem[]>;
};

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "agent-dave-daily-brief/1.0",
  },
});

function googleNewsRssUrl(query: string) {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

function isWithinHours(date: Date, hours: number) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

async function fetchRecentNews(query: string, hours = 24): Promise<NewsItem[]> {
  const feed = await parser.parseURL(googleNewsRssUrl(query));
  const items: NewsItem[] = [];

  for (const item of feed.items.slice(0, 20)) {
    const published = item.isoDate || item.pubDate;
    if (!published || !item.title || !item.link) continue;

    const date = new Date(published);
    if (Number.isNaN(date.getTime()) || !isWithinHours(date, hours)) continue;

    items.push({
      title: item.title,
      link: item.link,
      publishedAt: date.toISOString(),
      source: item.source?.name || item.creator || undefined,
    });
  }

  return items.slice(0, 8);
}

export async function collectResearch(hours = 24): Promise<ResearchBundle> {
  const tickers: Record<string, NewsItem[]> = {};
  const people: Record<string, NewsItem[]> = {};

  await Promise.all([
    ...TICKERS.map(async (ticker) => {
      tickers[ticker.id] = await fetchRecentNews(ticker.query, hours);
    }),
    ...PEOPLE.map(async (person) => {
      people[person.id] = await fetchRecentNews(person.query, hours);
    }),
  ]);

  return {
    collectedAt: new Date().toISOString(),
    windowHours: hours,
    tickers,
    people,
  };
}
