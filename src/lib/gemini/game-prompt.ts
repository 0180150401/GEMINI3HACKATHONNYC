import type { UserMetrics } from '@/types';

export const GAME_TYPES = ['real_world_task'] as const;

export const GAME_CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    gameType: {
      type: 'string',
      enum: ['real_world_task'],
      description: 'Always real_world_task',
    },
    reasoning: {
      type: 'string',
      description: 'Gen-Z memeified, ironic description of why this task was chosen. Use slang, sarcasm, and self-deprecating humor.',
    },
    config: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Clear instruction that MUST reference the user\'s specific location when available. Name actual places (parks, cafes, streets, neighborhoods) from nearbyPlaces/placeTypes. E.g. "Take a photo of your hand holding a leaf at [Park Name]" or "Show your coffee at [Cafe Name]". Never use generic "a park" or "a cafe"—use the real place names from user data.',
        },
        verificationCriteria: {
          type: 'string',
          description: 'What Gemini should look for in the photo to verify completion (e.g. "hand visible holding a plant, leaf, or grass")',
        },
        travelItinerary: {
          type: 'string',
          description: 'A 2-4 step itinerary that MUST name specific places from nearbyPlaces/placeTypes. E.g. "1. Walk to [Park Name] on [Street]. 2. Head to the north side near the trees. 3. Complete your task there." Use real place names—never generic "the park" or "a cafe".',
        },
        sideQuest: {
          type: 'string',
          description: 'A fun optional side quest tied to the specific location. E.g. "Find the weirdest leaf in [Park Name]" or "Spot the oldest tree in [Neighborhood]"',
        },
        theme: { type: 'string', enum: ['day', 'night'] },
        flavor: { type: 'string', description: 'One-word vibe: chaotic, chill, intense, whimsical, etc.' },
        mood: { type: 'string', description: 'Emotional tone from data' },
      },
      required: ['task', 'verificationCriteria', 'travelItinerary', 'sideQuest'],
    },
  },
  required: ['gameType', 'reasoning', 'config'],
};

export interface BuildGamePromptOptions {
  hasImage?: boolean;
  timestamp?: string;
  nicheContext?: {
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
  const timestamp = opts.timestamp ?? new Date().toISOString();
  const nicheContext = opts.nicheContext;

  const nicheNote = nicheContext
    ? `\nVibes: place=${nicheContext.placeVibe ?? 'n/a'}, news=${nicheContext.newsVibe ?? 'n/a'}, weather=${nicheContext.weatherVibe ?? 'n/a'}, music=${nicheContext.musicVibe ?? 'n/a'}. Use these to personalize the task.\n`
    : '';

  const creativeDirections = [
    'Touch grass energy—get them outside.',
    'IRL quest vibes—something they can do right now.',
    'News detox—task that breaks the scroll cycle.',
    'Music-inspired—reference their track or artist.',
    'Weather-appropriate—match the conditions.',
    'Place-based—use their location (park, cafe, etc.).',
  ];
  const randomDirection = creativeDirections[Math.floor(Math.random() * creativeDirections.length)];

  const imageNote = hasImage
    ? `\nIMAGE: An image was provided above. Use its colors, mood, subject matter to personalize the task. Reference the image in your reasoning.\n`
    : '';

  return `You are creating a REAL-WORLD TASK for the user. They will complete the task in real life, take a photo, and Gemini will verify the photo. Your output MUST be a real-world task—nothing digital or on-screen.

${imageNote}${nicheNote}
TODAY'S DIRECTION: ${randomDirection}
${timestamp ? `\nContext: ${timestamp}\n` : ''}
LOCATION CRITICAL (must follow):
- If user has landscape.nearbyPlaces or placeTypes: The task, travelItinerary, and sideQuest MUST name specific places from that data. NEVER use generic "a park", "a cafe", "the nearest"—always use the actual place names (e.g. "Take a photo at Bryant Park", "Walk to Blue Bottle on 5th Ave"). This makes the task hyper-local and specific.
- If no location data: Use weather/placeTypes to infer (e.g. "your nearest park" or "a spot with grass") but prefer location when available.

CRITICAL: 
- task: Clear instruction. MUST reference specific places when available. "Take a photo of your hand holding a leaf at [Park Name]" not "a park". Verifiable via single photo.
- verificationCriteria: What to look for in the photo. Be specific (e.g. "hand visible holding a green plant or leaf").
- travelItinerary: 2-4 steps with REAL place names. "1. Walk to [Park Name]. 2. Find the grass near [Landmark]. 3. Complete your task there." Use nearbyPlaces/placeTypes.
- sideQuest: Tied to the specific location. "Find the weirdest leaf in [Park Name]" or "Spot the oldest tree in [Neighborhood]".

PERSONALIZE from user data:
1. LANDSCAPE (PRIORITY): nearbyPlaces, placeTypes → MUST name these in task/itinerary. Park names, cafe names, street names, neighborhood names.
2. WEATHER: Clear/sunny → outdoor task. Rain? Indoor task (e.g. "show your drink by a window at [Cafe Name]"). Extreme? Suggest staying in.
3. NEWS: Reference in reasoning. Tense news? Suggest "touch grass" or outdoor task.
4. SPOTIFY: Reference track/artist in reasoning.

reasoning: Gen-Z memeified style. Slang (no cap, touch grass, it's giving, bestie). 1-2 sentences. Reference their data.

User data (USE THIS):
${JSON.stringify(metrics, null, 2)}

IMPORTANT: If landscape.nearbyPlaces exists, it contains real place names (e.g. "Bryant Park", "Starbucks"). Use these EXACT names in task, travelItinerary, and sideQuest. Do not paraphrase—use the names as given.

Generate the game config as JSON. gameType must be "real_world_task".`;
}
