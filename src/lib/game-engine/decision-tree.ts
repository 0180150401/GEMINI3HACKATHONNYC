import type { UserMetrics } from '@/types';

/**
 * Extracts niche context from user metrics for personalizing real-world tasks.
 * No game-type selection—always real_world_task.
 */

const OUTDOOR_PLACE_TYPES = new Set([
  'park',
  'mountain',
  'hiking_area',
  'natural_feature',
  'campground',
  'stadium',
  'playground',
  'beach',
  'forest',
]);

const URBAN_PLACE_TYPES = new Set([
  'restaurant',
  'cafe',
  'store',
  'shopping_mall',
  'museum',
  'gym',
  'nightclub',
]);

export interface DecisionTreeResult {
  suggestedType: 'real_world_task';
  path: string[];
  nicheContext: {
    placeVibe?: string;
    newsVibe?: string;
    weatherVibe?: string;
    musicVibe?: string;
  };
}

export interface DecisionTreeOptions {
  hasImage?: boolean;
}

export function evaluateDecisionTree(
  metrics: UserMetrics,
  options?: DecisionTreeOptions
): DecisionTreeResult {
  const path: string[] = ['real_world_task_only'];

  let placeVibe: string | undefined;
  const placeTypes = metrics.landscape?.placeTypes ?? [];
  if (placeTypes.some((t) => ['mountain', 'hiking_area', 'natural_feature'].includes(t.toLowerCase()))) {
    placeVibe = 'mountainous';
  } else if (placeTypes.some((t) => ['park', 'beach'].includes(t.toLowerCase()))) {
    placeVibe = 'outdoor_chill';
  } else if (placeTypes.some((t) => URBAN_PLACE_TYPES.has(t.toLowerCase()))) {
    placeVibe = 'urban';
  } else if (placeTypes.some((t) => OUTDOOR_PLACE_TYPES.has(t.toLowerCase()))) {
    placeVibe = 'outdoor';
  }

  let newsVibe: string | undefined;
  const themes = metrics.news?.dominantThemes ?? [];
  const categories = Object.keys(metrics.news?.categories ?? {});
  if (categories.some((c) => ['sports', 'politics', 'technology', 'science'].includes(c.toLowerCase()))) {
    newsVibe = 'energetic';
  }
  if (themes.some((t) => ['crisis', 'war', 'disaster', 'election', 'protest'].includes(t.toLowerCase()))) {
    newsVibe = 'tense';
  }
  if (categories.some((c) => ['arts', 'entertainment', 'lifestyle', 'travel'].includes(c.toLowerCase())) && !newsVibe) {
    newsVibe = 'calm';
  }

  let weatherVibe: string | undefined;
  if (metrics.weather) {
    const c = metrics.weather.condition.toLowerCase();
    if (['thunderstorm', 'blizzard', 'heavy rain', 'fog', 'snow', 'storm'].some((w) => c.includes(w))) {
      weatherVibe = 'extreme';
    } else if (c.includes('rain') || c.includes('snow')) {
      weatherVibe = 'moody';
    } else if (c.includes('clear') || c.includes('sunny')) {
      weatherVibe = 'bright';
    }
  }

  let musicVibe: string | undefined;
  const tempo = metrics.spotify?.tempo ?? metrics.uploadedPlaylist?.tracks?.[0]?.tempo;
  if (tempo != null) {
    if (tempo > 120) musicVibe = 'high_energy';
    else if (tempo < 80) musicVibe = 'chill';
    else musicVibe = 'mid_tempo';
  }

  return {
    suggestedType: 'real_world_task',
    path,
    nicheContext: {
      placeVibe,
      newsVibe,
      weatherVibe,
      musicVibe,
    },
  };
}
