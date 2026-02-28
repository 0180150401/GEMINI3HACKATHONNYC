import type { PipelineContext } from './types';
import { ingestNewsAPI, ingestNewsRSS } from './sources/news';
import { ingestWeather } from './sources/weather';
import { ingestTerrain, type TerrainData } from './sources/terrain';
import { getNearbyPlaces } from '@/lib/api/google-maps';
import { transform } from './transform';

export interface PipelineOptions {
  lat?: number;
  lng?: number;
  image?: {
    base64: string;
    mimeType: string;
  };
}

/** Run full pipeline: ingest → transform → enrich → output */
export async function runPipeline(options: PipelineOptions = {}): Promise<PipelineContext> {
  const lat = options.lat ?? 40.7128;
  const lng = options.lng ?? -74.006;
  const runAt = new Date().toISOString();
  const sourcesIngested: string[] = [];
  const stagesCompleted: string[] = ['ingest', 'transform', 'enrich'];

  // Stage 1: Ingest (parallel)
  const [newsGeneral, newsTech, newsSports, newsEnt, newsRss, weather, terrain, nearbyPlaces] = await Promise.all([
    process.env.NEWS_API_KEY ? ingestNewsAPI('general', 5) : [],
    process.env.NEWS_API_KEY ? ingestNewsAPI('technology', 3) : [],
    process.env.NEWS_API_KEY ? ingestNewsAPI('sports', 3) : [],
    process.env.NEWS_API_KEY ? ingestNewsAPI('entertainment', 3) : [],
    !process.env.NEWS_API_KEY ? ingestNewsRSS(10) : [],
    ingestWeather(lat, lng),
    ingestTerrain(lat, lng),
    getNearbyPlaces(lat, lng).catch(() => []),
  ]);

  if (newsGeneral.length) sourcesIngested.push('news:general');
  if (newsTech.length) sourcesIngested.push('news:technology');
  if (newsSports.length) sourcesIngested.push('news:sports');
  if (newsEnt.length) sourcesIngested.push('news:entertainment');
  if (newsRss.length) sourcesIngested.push('news:rss');
  if (weather) sourcesIngested.push('weather');
  if (terrain) sourcesIngested.push('terrain');

  const newsByCategory: Record<string, { title: string; source?: string; category?: string; publishedAt?: string }[]> = {
    general: newsGeneral,
    technology: newsTech,
    sports: newsSports,
    entertainment: newsEnt,
    rss: newsRss,
  };

  const allNews = [...newsGeneral, ...newsTech, ...newsSports, ...newsEnt, ...newsRss];

  // Stage 2: Transform
  const terrainInput: TerrainData | null = terrain
    ? {
        ...terrain,
        placeTypes: nearbyPlaces?.length ? [...new Set(nearbyPlaces.flatMap((p) => p.types))] : undefined,
        nearbyPlaces,
      }
    : null;

  const transformed = transform({
    news: allNews,
    newsByCategory,
    weather,
    terrain: terrainInput,
  });

  // Stage 3: Enrich → PipelineContext
  const context: PipelineContext = {
    image: options.image,
    news: {
      headlines: transformed.headlines,
      categories: transformed.categories,
      dominantThemes: transformed.dominantThemes,
    },
    weather: transformed.weather
      ? {
          temp: transformed.weather.temp,
          condition: transformed.weather.condition,
          humidity: transformed.weather.humidity,
        }
      : undefined,
    terrain: transformed.terrain
      ? {
          elevation: transformed.terrain.elevation,
          lat: transformed.terrain.lat,
          lng: transformed.terrain.lng,
          placeTypes: transformed.terrain.placeTypes,
          nearbyPlaces: transformed.terrain.nearbyPlaces,
        }
      : undefined,
    metadata: {
      pipelineRunAt: runAt,
      sourcesIngested,
      stagesCompleted,
    },
  };

  return context;
}
