export interface NewsHeadline {
  title: string;
  source?: string;
  category?: string;
  publishedAt?: string;
}

export async function ingestNewsAPI(category: string, limit = 5): Promise<NewsHeadline[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${limit}&apiKey=${apiKey}`
  );
  const data = (await res.json()) as { articles?: { title?: string; source?: { name?: string }; publishedAt?: string }[] };
  return (data.articles ?? []).map((a) => ({
    title: a.title ?? '',
    source: a.source?.name,
    category,
    publishedAt: a.publishedAt,
  }));
}

export async function ingestNewsRSS(limit = 10): Promise<NewsHeadline[]> {
  try {
    const res = await fetch('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', {
      headers: { 'User-Agent': 'Recesss/1.0' },
    });
    const text = await res.text();
    const titles = text.match(/<title>([^<]+)<\/title>/g)?.slice(1, limit + 1) ?? [];
    return titles.map((t) => ({
      title: t.replace(/<\/?title>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
    }));
  } catch {
    return [];
  }
}
