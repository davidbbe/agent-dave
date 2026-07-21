export const TICKERS = [
  { id: "TSLA", label: "Tesla (TSLA)", query: "TSLA OR Tesla stock" },
  { id: "MU", label: "Micron (MU)", query: "MU OR Micron Technology stock" },
  { id: "META", label: "Meta (META)", query: "META OR Meta Platforms stock" },
  { id: "BTC", label: "Bitcoin (BTC)", query: "Bitcoin OR BTC crypto" },
] as const;

export const PEOPLE = [
  { id: "karpathy", name: "Andrej Karpathy", query: "Andrej Karpathy" },
  { id: "huang", name: "Jensen Huang", query: "Jensen Huang NVIDIA" },
  { id: "karp", name: "Alex Karp", query: "Alex Karp Palantir" },
  { id: "altman", name: "Sam Altman", query: "Sam Altman OpenAI" },
] as const;

/** Cheap free-tier-friendly model via Vercel AI Gateway */
export const DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

export function getModel() {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getEmailTo() {
  return process.env.EMAIL_TO?.trim() || "streethouse4@gmail.com";
}

export function getEmailFrom() {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error("EMAIL_FROM is required");
  }
  return from;
}
