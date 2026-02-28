import type { UserMetrics, GameType } from '@/types';

/**
 * Intricate decision tree for niche, super-personalized game generation.
 * Based on patterns from: GDKeys AI design, attribute-aware preference elicitation,
 * branching narratives, and weighted multi-signal game selection.
 *
 * Structure: Priority conditions → Core signals (weighted) → Niche branches → Security leaf
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

const CALM_NEWS_CATEGORIES = new Set([
  'arts',
  'entertainment',
  'lifestyle',
  'travel',
  'culture',
  'music',
]);

const ENERGETIC_NEWS_CATEGORIES = new Set([
  'sports',
  'politics',
  'technology',
  'science',
]);

const TENSE_NEWS_THEMES = new Set([
  'crisis',
  'war',
  'disaster',
  'crime',
  'election',
  'protest',
  'emergency',
]);

const EXTREME_WEATHER = new Set([
  'thunderstorm',
  'blizzard',
  'heavy rain',
  'fog',
  'snow',
  'storm',
]);

export interface DecisionTreeResult {
  suggestedType: GameType;
  path: string[];
  /** Weighted scores 0–1 for each signal; passed to Gemini for fine-tuning */
  signalScores: {
    music: number;
    terrain: number;
    news: number;
    image: number;
    weather: number;
  };
  /** Niche context for personalization */
  nicheContext: {
    dominantSignal: string;
    placeVibe?: string;
    newsVibe?: string;
    weatherVibe?: string;
    musicVibe?: string;
  };
}

export interface DecisionTreeOptions {
  hasImage?: boolean;
  useCamera?: boolean;
  recentGameTypes?: string[];
}

/** Compute weighted signal scores (0–1) from metrics */
function computeSignalScores(metrics: UserMetrics, hasImage: boolean): DecisionTreeResult['signalScores'] {
  let music = 0;
  if (metrics.spotify?.tempo != null) {
    music = 0.7 + (metrics.spotify.trackName ? 0.2 : 0) + (metrics.spotify.artistName ? 0.1 : 0);
  } else if (metrics.uploadedPlaylist?.tracks?.length) {
    music = 0.5 + Math.min(0.3, metrics.uploadedPlaylist.tracks.length * 0.05);
  }
  music = Math.min(1, music);

  let terrain = 0;
  if (metrics.landscape?.elevation != null && metrics.landscape.elevation > 0) {
    terrain = 0.5 + Math.min(0.5, metrics.landscape.elevation / 2000);
  }
  const placeTypes = metrics.landscape?.placeTypes ?? [];
  if (placeTypes.some((t) => OUTDOOR_PLACE_TYPES.has(t.toLowerCase()))) terrain = Math.max(terrain, 0.6);
  if (placeTypes.some((t) => URBAN_PLACE_TYPES.has(t.toLowerCase()))) terrain = Math.max(terrain, 0.3);
  terrain = Math.min(1, terrain);

  const headlines = metrics.news?.headlines ?? [];
  const themes = metrics.news?.dominantThemes ?? [];
  const categories = Object.keys(metrics.news?.categories ?? {});
  let news = 0;
  if (headlines.length >= 5) news = 0.6;
  else if (headlines.length >= 2) news = 0.4;
  if (themes.length >= 3) news = Math.max(news, 0.5);
  if (categories.length >= 2) news = Math.max(news, 0.4);
  news = Math.min(1, news);

  const image = hasImage ? 0.9 : 0;

  let weather = 0;
  if (metrics.weather) {
    weather = 0.5;
    const cond = metrics.weather.condition.toLowerCase();
    if (EXTREME_WEATHER.has(cond)) weather = 0.9;
    else if (cond.includes('rain') || cond.includes('snow')) weather = 0.7;
    else if (cond.includes('clear') || cond.includes('sunny')) weather = 0.4;
  }

  return { music, terrain, news, image, weather };
}

/** Get dominant signal and niche vibes */
function getNicheContext(
  metrics: UserMetrics,
  scores: DecisionTreeResult['signalScores'],
  path: string[]
): DecisionTreeResult['nicheContext'] {
  const entries = Object.entries(scores) as [keyof typeof scores, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0]?.[0] ?? 'news';

  let placeVibe: string | undefined;
  const placeTypes = metrics.landscape?.placeTypes ?? [];
  if (placeTypes.some((t) => ['mountain', 'hiking_area'].includes(t.toLowerCase()))) placeVibe = 'mountainous';
  else if (placeTypes.some((t) => ['park', 'beach'].includes(t.toLowerCase()))) placeVibe = 'outdoor_chill';
  else if (placeTypes.some((t) => URBAN_PLACE_TYPES.has(t.toLowerCase()))) placeVibe = 'urban';

  let newsVibe: string | undefined;
  const themes = metrics.news?.dominantThemes ?? [];
  const categories = Object.keys(metrics.news?.categories ?? {});
  if (categories.some((c) => ENERGETIC_NEWS_CATEGORIES.has(c.toLowerCase()))) newsVibe = 'energetic';
  if (themes.some((t) => TENSE_NEWS_THEMES.has(t.toLowerCase()))) newsVibe = 'tense';
  if (categories.some((c) => CALM_NEWS_CATEGORIES.has(c.toLowerCase())) && !newsVibe) newsVibe = 'calm';

  let weatherVibe: string | undefined;
  if (metrics.weather) {
    const c = metrics.weather.condition.toLowerCase();
    if (EXTREME_WEATHER.has(c)) weatherVibe = 'extreme';
    else if (c.includes('rain') || c.includes('snow')) weatherVibe = 'moody';
    else if (c.includes('clear') || c.includes('sunny')) weatherVibe = 'bright';
  }

  let musicVibe: string | undefined;
  const tempo = metrics.spotify?.tempo ?? metrics.uploadedPlaylist?.tracks?.[0]?.tempo;
  if (tempo != null) {
    if (tempo > 120) musicVibe = 'high_energy';
    else if (tempo < 80) musicVibe = 'chill';
    else musicVibe = 'mid_tempo';
  }

  return {
    dominantSignal: dominant,
    placeVibe,
    newsVibe,
    weatherVibe,
    musicVibe,
  };
}

/** Pick game type avoiding recent types (palate cleanser logic) */
function applyVarietyPreference(
  preferred: GameType,
  recentGameTypes: string[],
  path: string[]
): { type: GameType; path: string[] } {
  if (recentGameTypes.length === 0) return { type: preferred, path };
  const recentSet = new Set(recentGameTypes);
  if (!recentSet.has(preferred)) return { type: preferred, path };

  const ALL_TYPES: GameType[] = [
    'endless_runner',
    'obstacle_dodge',
    'rhythm_tap',
    'memory_match',
    'trivia',
    'reaction_test',
    'face_dodge',
  ];
  const alternatives = ALL_TYPES.filter((t) => !recentSet.has(t));
  if (alternatives.length === 0) return { type: preferred, path };

  const fallback = alternatives[Math.floor(Math.random() * alternatives.length)];
  path.push('variety_override');
  path.push(`avoided_${preferred}_picked_${fallback}`);
  return { type: fallback, path };
}

export function evaluateDecisionTree(
  metrics: UserMetrics,
  options?: DecisionTreeOptions
): DecisionTreeResult {
  const path: string[] = [];
  const hasImage = options?.hasImage ?? false;
  const useCamera = options?.useCamera ?? false;
  const recentGameTypes = options?.recentGameTypes ?? [];

  const scores = computeSignalScores(metrics, hasImage);
  const nicheContext = getNicheContext(metrics, scores, path);

  // ─── CAMERA BRANCH (user requested camera game) ────────────────────────
  if (useCamera) {
    path.push('camera_requested');
    const result = applyVarietyPreference('face_dodge', recentGameTypes, path);
    return {
      suggestedType: result.type,
      path: result.path,
      signalScores: scores,
      nicheContext: { ...nicheContext, dominantSignal: 'image' },
    };
  }

  // ─── PRIORITY CONDITIONS (check first) ─────────────────────────────────
  const weatherCond = metrics.weather?.condition?.toLowerCase() ?? '';
  if (EXTREME_WEATHER.has(weatherCond) || weatherCond.includes('thunder')) {
    path.push('priority_extreme_weather');
    path.push(weatherCond);
    const result = applyVarietyPreference('obstacle_dodge', recentGameTypes, path);
    return {
      suggestedType: result.type,
      path: result.path,
      signalScores: scores,
      nicheContext: { ...nicheContext, weatherVibe: 'extreme' },
    };
  }

  const themes = metrics.news?.dominantThemes ?? [];
  const hasTenseNews = themes.some((t) => TENSE_NEWS_THEMES.has(t.toLowerCase()));
  if (hasTenseNews && scores.news > 0.5) {
    path.push('priority_tense_news');
    const result = applyVarietyPreference(
      scores.music > 0.5 ? 'reaction_test' : 'obstacle_dodge',
      recentGameTypes,
      path
    );
    return {
      suggestedType: result.type,
      path: result.path,
      signalScores: scores,
      nicheContext: { ...nicheContext, newsVibe: 'tense' },
    };
  }

  // ─── CORE BRANCHES (weighted by dominant signal) ─────────────────────────

  // Music-dominant: tempo drives game type
  if (scores.music >= 0.5) {
    path.push('core_music');
    const tracks = metrics.uploadedPlaylist?.tracks ?? [];
    const tempos = tracks.map((t) => t.tempo).filter((t): t is number => typeof t === 'number');
    const avgTempo = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : null;
    const tempo = metrics.spotify?.tempo ?? avgTempo;
    if (tempo != null) {
      if (tempo > 120) {
        path.push('tempo_high');
        const result = applyVarietyPreference('reaction_test', recentGameTypes, path);
        return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
      }
      if (tempo < 80) {
        path.push('tempo_low');
        const result = applyVarietyPreference('rhythm_tap', recentGameTypes, path);
        return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
      }
      path.push('tempo_mid');
      const result = applyVarietyPreference('rhythm_tap', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
    path.push('music_no_tempo');
    const result = applyVarietyPreference('rhythm_tap', recentGameTypes, path);
    return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
  }

  // Terrain-dominant: elevation + place types
  if (scores.terrain >= 0.5) {
    path.push('core_terrain');
    const elevation = metrics.landscape?.elevation ?? 0;
    const placeTypes = metrics.landscape?.placeTypes ?? [];
    const hasMountain = placeTypes.some((t) =>
      ['mountain', 'hiking_area', 'natural_feature'].includes(t.toLowerCase())
    );
    if (elevation > 500 || hasMountain) {
      path.push('elevation_high_or_mountain');
      const result = applyVarietyPreference('endless_runner', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
    if (elevation > 100 || placeTypes.some((t) => OUTDOOR_PLACE_TYPES.has(t.toLowerCase()))) {
      path.push('elevation_moderate_or_outdoor');
      const result = applyVarietyPreference('endless_runner', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
    path.push('terrain_urban_or_flat');
    const result = applyVarietyPreference('obstacle_dodge', recentGameTypes, path);
    return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
  }

  // Image-dominant: calm vs tense themes
  if (scores.image >= 0.5) {
    path.push('core_image');
    const categories = Object.keys(metrics.news?.categories ?? {});
    const hasCalm = categories.some((c) => CALM_NEWS_CATEGORIES.has(c.toLowerCase()));
    const hasCalmTheme = themes.some((t) => ['arts', 'entertainment', 'lifestyle', 'travel'].includes(t.toLowerCase()));
    if (hasCalm || hasCalmTheme) {
      path.push('image_calm_themes');
      const result = applyVarietyPreference('memory_match', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
    path.push('image_tense_or_mixed');
    const result = applyVarietyPreference('obstacle_dodge', recentGameTypes, path);
    return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
  }

  // News-dominant: category-driven
  if (scores.news >= 0.4) {
    path.push('core_news');
    const headlines = metrics.news?.headlines ?? [];
    const categories = Object.keys(metrics.news?.categories ?? {});
    const hasSports = categories.some((c) => c.toLowerCase() === 'sports');
    const hasTech = categories.some((c) => ['technology', 'science'].includes(c.toLowerCase()));
    const hasEntertainment = categories.some((c) => CALM_NEWS_CATEGORIES.has(c.toLowerCase()));
    if (headlines.length >= 4 && (hasTech || hasSports || !hasEntertainment)) {
      path.push('news_strong_headlines');
      const result = applyVarietyPreference('trivia', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
    if (hasSports && scores.weather > 0.3) {
      path.push('news_sports_weather');
      const result = applyVarietyPreference('obstacle_dodge', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
    path.push('news_mixed');
    const result = applyVarietyPreference('trivia', recentGameTypes, path);
    return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
  }

  // ─── SITUATIONAL (weather + weak signals) ────────────────────────────────
  if (scores.weather >= 0.6 && (weatherCond.includes('fog') || weatherCond.includes('overcast'))) {
    path.push('situational_moody_weather');
    if (hasImage) {
      const result = applyVarietyPreference('memory_match', recentGameTypes, path);
      return { suggestedType: result.type, path: result.path, signalScores: scores, nicheContext };
    }
  }

  // ─── SECURITY LEAF (fallback when no strong signal) ──────────────────────
  path.push('security_leaf');
  path.push('fallback_obstacle_dodge');
  const result = applyVarietyPreference('obstacle_dodge', recentGameTypes, path);
  return {
    suggestedType: result.type,
    path: result.path,
    signalScores: scores,
    nicheContext,
  };
}
