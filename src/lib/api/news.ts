export interface NewsHeadline {
  title: string;
  source?: string;
  publishedAt?: string;
  description?: string;
}

/** Fetch top headlines from NewsAPI (requires NEWS_API_KEY) or fallback RSS */
export async function getTopHeadlines(country = 'us', limit = 10): Promise<NewsHeadline[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?country=${country}&pageSize=${limit}&apiKey=${apiKey}`
      );
      const data = (await res.json()) as {
        articles?: { title?: string; source?: { name?: string }; publishedAt?: string; description?: string }[];
      };
      return (data.articles ?? []).map((a) => ({
        title: a.title ?? '',
        source: a.source?.name,
        publishedAt: a.publishedAt,
        description: a.description,
      }));
    } catch {
      // fall through to fallback
    }
  }

  return getHeadlinesFallback(limit);
}

/** Fallback: fetch from public Google News RSS (no API key) */
async function getHeadlinesFallback(limit: number): Promise<NewsHeadline[]> {
  try {
    const res = await fetch(
      'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
      { headers: { 'User-Agent': 'Recesss/1.0' } }
    );
    const text = await res.text();
    const titles = text.match(/<title>([^<]+)<\/title>/g)?.slice(1, limit + 1) ?? [];
    return titles.map((t) => ({
      title: t.replace(/<\/?title>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'"),
    }));
  } catch {
    return [];
  }
}
