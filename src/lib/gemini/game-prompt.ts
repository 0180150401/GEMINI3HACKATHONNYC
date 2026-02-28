import type { UserMetrics } from '@/types';

export const GAME_TYPES = ['endless_runner', 'obstacle_dodge', 'rhythm_tap'] as const;

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
      description: 'Brief explanation of why this game was chosen based on the data',
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
      },
      required: ['scrollSpeed', 'obstacleDensity', 'theme'],
    },
  },
  required: ['gameType', 'reasoning', 'config'],
};

export function buildGamePrompt(metrics: UserMetrics): string {
  return `You are a game designer. Given the user's data and current world events below, infer the best mini-game type and generate a config. Use real-world news to personalize the game—themes, difficulty, or obstacle style can reflect current events.

Available game types:
- endless_runner: For terrain-driven games. Use elevation/landscape data for terrain heights.
- obstacle_dodge: For mixed data. Place types, elevation, or news themes drive obstacle patterns.
- rhythm_tap: For music-focused. Spotify tempo = beat pattern. High screen time → calming slow tempo.

User data:
${JSON.stringify(metrics, null, 2)}

Rules:
- Steep terrain (elevation >500m) or elevationPath present → endless_runner with terrainHeights from elevation data
- Upbeat music (tempo >100) + landscape data → endless_runner, scrollSpeed from tempo
- High screen time (>4h) → rhythm_tap with slow tempo (calming)
- Music-focused with moderate tempo → rhythm_tap
- Place types (park, mountain, etc.) can influence theme and obstacle style
- Mixed/neutral → obstacle_dodge
- NEWS: Use headlines, categories, and dominantThemes to personalize. Sports → energetic; politics → tension; tech/science → futuristic. Reference themes in reasoning.
- WEATHER: Rain/snow → night theme; clear/sunny → day. Extreme temps can affect difficulty.
- Map elevation to terrainHeights: normalize elevationPath or single elevation to 0.2-0.8 range
- Map Spotify tempo to scrollSpeed: tempo/15, clamped 3-12
- Always provide 15 terrain heights for endless_runner

Generate the game config as JSON.`;
}
