import type { UserMetrics } from '@/types';

export const GAME_TYPES = [
  'endless_runner',
  'obstacle_dodge',
  'rhythm_tap',
  'memory_match',
  'trivia',
  'reaction_test',
] as const;

export const GAME_CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    gameType: {
      type: 'string',
      enum: GAME_TYPES,
      description: 'The type of game to generate',
    },
    reasoning: {
      type: 'string',
      description: 'Gen-Z memeified, ironic description of why this game was chosen. Use slang, sarcasm, and self-deprecating humor.',
    },
    config: {
      type: 'object',
      properties: {
        scrollSpeed: { type: 'number', description: 'Base scroll speed 1-15' },
        obstacleDensity: { type: 'number', description: '0-1, how many obstacles' },
        terrainHeights: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of 10-20 terrain heights 0-1 for endless runner',
        },
        theme: { type: 'string', enum: ['day', 'night'] },
        difficulty: { type: 'number', description: '1-10' },
        flavor: { type: 'string', description: 'Creative one-word vibe: chaotic, chill, intense, whimsical, etc.' },
        mood: { type: 'string', description: 'Emotional tone from data: e.g. news anxiety, music energy' },
        narrativeHook: { type: 'string', description: 'One-line story from the data: e.g. running from headlines' },
      },
      required: ['scrollSpeed', 'obstacleDensity', 'theme'],
    },
  },
  required: ['gameType', 'reasoning', 'config'],
};

export interface BuildGamePromptOptions {
  hasImage?: boolean;
  suggestedType?: string;
  dtPath?: string[];
  recentGameTypes?: string[];
  timestamp?: string;
  signalScores?: { music: number; terrain: number; news: number; image: number; weather: number };
  nicheContext?: {
    dominantSignal: string;
    placeVibe?: string;
    newsVibe?: string;
    weatherVibe?: string;
    musicVibe?: string;
  };
}

export function buildGamePrompt(
  metrics: UserMetrics,
  options?: boolean | BuildGamePromptOptions
): string {
  const opts = typeof options === 'boolean' ? { hasImage: options } : options ?? {};
  const hasImage = opts.hasImage ?? false;
  const suggestedType = opts.suggestedType;
  const dtPath = opts.dtPath;
  const recentGameTypes = opts.recentGameTypes ?? [];
  const timestamp = opts.timestamp ?? new Date().toISOString();
  const signalScores = opts.signalScores;
  const nicheContext = opts.nicheContext;

  const nicheNote =
    signalScores && nicheContext
      ? `\nNICHE SIGNAL SCORES (use for fine-tuning): music=${signalScores.music.toFixed(2)}, terrain=${signalScores.terrain.toFixed(2)}, news=${signalScores.news.toFixed(2)}, image=${signalScores.image.toFixed(2)}, weather=${signalScores.weather.toFixed(2)}. Dominant: ${nicheContext.dominantSignal}. Vibes: place=${nicheContext.placeVibe ?? 'n/a'}, news=${nicheContext.newsVibe ?? 'n/a'}, weather=${nicheContext.weatherVibe ?? 'n/a'}, music=${nicheContext.musicVibe ?? 'n/a'}. Use these to create super-personalized, niche config.\n`
      : '';

  const varietyNote =
    recentGameTypes.length > 0
      ? `\nVARIETY: User recently played: ${recentGameTypes.join(', ')}. Pick a DIFFERENT game type and config. Avoid repetition.\n`
      : '';

  const creativeDirections = [
    'Embrace chaos—make it intense and unpredictable.',
    'Go maximalist—cram in references from their data.',
    'Chill escape—soothing, low-stakes vibes.',
    'Dystopian energy—let headlines drive a darker narrative.',
    'Whimsical and absurd—surprise them.',
    'Music-first—let the track/artist define everything.',
    'News-as-story—headlines become the game world.',
  ];
  const randomDirection = creativeDirections[Math.floor(Math.random() * creativeDirections.length)];

  const imageNote = hasImage
    ? `\nIMAGE: An image was provided above. Use its colors, mood, subject matter, and visual style to personalize the game (theme, difficulty, reasoning). Reference the image in your reasoning.\n`
    : '';

  const dtNote =
    suggestedType && dtPath?.length
      ? `\nDECISION TREE: A decision tree suggested "${suggestedType}" because: ${dtPath.join(' → ')}. You may use it or override with a different gameType if the data strongly supports it; explain your choice in reasoning.\n`
      : '';

  return `You are a game designer creating a UNIQUE, PERSONALIZED mini-game. Your config MUST directly reflect the user's data below. Never output a generic config—every field should be derived from their news, weather, location, music, or the provided image.
${imageNote}${dtNote}${nicheNote}${varietyNote}
CREATIVITY (hackathon prompts): Use Gemini's long-context to build an intelligent, evolving experience. Create a narrative hook from the data. If music: personalize based on track/artist energy. If news: let headlines drive the narrative. Be creative and unexpected—never boring.
TODAY'S DIRECTION: ${randomDirection}
${timestamp ? `\nContext: ${timestamp}\n` : ''}
CRITICAL: Use ALL available data. If a field is present, you MUST use it to personalize. NEVER repeat the same config twice. Vary scrollSpeed, obstacleDensity, terrainHeights, and theme wildly based on data.

Available game types:
- endless_runner: Terrain-driven. Use elevation for terrainHeights. Good when: elevation data, mountainous placeTypes, or outdoor news themes.
- obstacle_dodge: Mixed data. Use news themes, placeTypes, weather for obstacle feel. Good when: varied data or no strong signal.
- rhythm_tap: Music-driven. Spotify tempo directly sets beat speed. Good when: spotify.tempo present, or calming themes.
- memory_match: Match pairs from uploaded image. Good when: image present and calm themes.
- trivia: Answer questions from news headlines. Good when: news dominant.
- reaction_test: Tap/click on cue. Good when: high tempo or energetic news.

User data (USE THIS):
${JSON.stringify(metrics, null, 2)}

PERSONALIZATION RULES (follow strictly):
1. NEWS: 
   - dominantThemes and headlines → reasoning should reference these (in memeified style)
   - Sports/energetic headlines → higher scrollSpeed (8-12), day theme
   - Politics/tense → obstacle_dodge, higher difficulty (6-8)
   - Tech/science → futuristic feel, rhythm_tap or obstacle_dodge
   - Entertainment → lighter difficulty (3-5)
   - categories (sports, technology, etc.) → influence game type choice

2. WEATHER:
   - Rain, snow, fog, overcast → theme: "night", slightly higher difficulty
   - Clear, sunny → theme: "day"
   - Temp >90°F or <32°F → difficulty +1
   - Thunderstorm → obstacle_dodge with higher obstacleDensity

3. LANDSCAPE:
   - elevation >500m → endless_runner, terrainHeights from elevation (normalize to 0.3-0.9)
   - elevation 100-500m → varied terrainHeights (hills)
   - placeTypes: park → day theme; mountain/hiking → endless_runner; restaurant/store → obstacle_dodge

4. SPOTIFY / UPLOADED PLAYLIST:
   - tempo 80-100 → rhythm_tap, scrollSpeed = tempo/12 (clamped 4-10)
   - tempo >120 → endless_runner or obstacle_dodge, scrollSpeed = tempo/15
   - tempo <80 → rhythm_tap with slow beats, scrollSpeed 3-5
   - uploadedPlaylist: use average tempo from tracks if available; reference track names in reasoning

5. NUMERIC MAPPINGS:
   - terrainHeights: 15 values, 0.2-0.8. From elevation: (elevation/1000) clamped, or vary by placeTypes
   - scrollSpeed: 3-12. From tempo: tempo/15. From news energy: sports=10, politics=8, tech=6
   - obstacleDensity: 0.2-0.6. Higher for tense news or bad weather
   - difficulty: 1-10. Base 5, +1 for extreme weather, +1 for tense news

6. CREATIVE FIELDS (add these):
   - flavor: one word (chaotic, chill, intense, whimsical, dystopian, etc.) from data mood
   - mood: emotional tone from headlines + weather + music combined
   - narrativeHook: one-line story from data, e.g. "dodging the news cycle" or "running to the beat of [track]"

reasoning: Write in Gen-Z memeified style with irony. Use slang (no cap, lowkey, slay, it's giving, Deadass, Jestermaxxing, Mog, Mogging, Cortisol Spike, etc.), sarcasm, and self-deprecating humor. Reference their data but make it funny and ironic—like a friend roasting their news feed or weather. 1-2 sentences max. Example vibes: "it's giving main character energy based on your chaotic news cycle fr fr" or "your weather said touch grass so we made you run through it bestie."

Generate the game config as JSON.`;
}
