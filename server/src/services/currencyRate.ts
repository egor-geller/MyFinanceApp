interface RateCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

const cache = new Map<string, RateCache>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getRates(base: string): Promise<Record<string, number>> {
  const cached = cache.get(base);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.rates;

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) return {};

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`);
    const data = await res.json() as { conversion_rates: Record<string, number> };
    const rates = data.conversion_rates ?? {};
    cache.set(base, { rates, fetchedAt: Date.now() });
    return rates;
  } catch {
    return cached?.rates ?? {};
  }
}
