import type { IngestResult } from './types';
import type { NewsHeadline } from './sources/news';
import type { WeatherData } from './sources/weather';
import type { TerrainData } from './sources/terrain';

export interface TransformInput {
  news: NewsHeadline[];
  newsByCategory: Record<string, NewsHeadline[]>;
  weather: WeatherData | null;
  terrain: TerrainData | null;
}

/** Extract dominant themes from headlines (simple keyword extraction) */
function extractThemes(headlines: string[]): string[] {
  const stop = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'new', 'says']);
  const counts: Record<string, number> = {};
  for (const h of headlines) {
    const words = h.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && !stop.has(w)) counts[w] = (counts[w] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}

export function transform(input: TransformInput): {
  headlines: string[];
  categories: Record<string, string[]>;
  dominantThemes: string[];
  weather: TransformInput['weather'];
  terrain: TransformInput['terrain'];
} {
  const allHeadlines = [
    ...input.news,
    ...Object.values(input.newsByCategory).flat(),
  ]
    .map((h) => (typeof h === 'string' ? h : h.title))
    .filter(Boolean);
  const unique = [...new Set(allHeadlines)];

  const categories: Record<string, string[]> = {};
  for (const [cat, items] of Object.entries(input.newsByCategory)) {
    categories[cat] = items.map((h) => h.title).filter(Boolean);
  }

  return {
    headlines: unique.slice(0, 15),
    categories,
    dominantThemes: extractThemes(unique),
    weather: input.weather,
    terrain: input.terrain,
  };
}
