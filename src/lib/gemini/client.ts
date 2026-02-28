import { GoogleGenAI, createPartFromBase64 } from '@google/genai';
import type { UserMetrics } from '@/types';
import type { GameConfig } from '@/types';
import { buildGamePrompt, GAME_CONFIG_SCHEMA } from './game-prompt';

export interface GenerateGameOptions {
  imageBase64?: string;
  imageMimeType?: string;
  useCamera?: boolean;
  suggestedType?: string;
  dtPath?: string[];
  recentGameTypes?: string[];
  signalScores?: { music: number; terrain: number; news: number; image: number; weather: number };
  nicheContext?: {
    dominantSignal: string;
    placeVibe?: string;
    newsVibe?: string;
    weatherVibe?: string;
    musicVibe?: string;
  };
}

const DEFAULT_CONFIG: GameConfig = {
  gameType: 'obstacle_dodge',
  reasoning: 'Demo mode: no API key. Using default config.',
  config: {
    scrollSpeed: 6,
    obstacleDensity: 0.3,
    terrainHeights: Array(15).fill(0.5),
    theme: 'day',
    difficulty: 5,
  },
};

export async function generateGameConfig(metrics: UserMetrics, options?: GenerateGameOptions): Promise<GameConfig> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { ...DEFAULT_CONFIG, reasoning: 'Demo mode: GEMINI_API_KEY not set. Add your key to .env.local to enable AI-powered generation.' };
  }

  const ai = new GoogleGenAI({ apiKey });
  const hasImage = !!(options?.imageBase64 && options?.imageMimeType);
  const prompt = buildGamePrompt(metrics, {
    hasImage,
    useCamera: options?.useCamera,
    suggestedType: options?.suggestedType,
    dtPath: options?.dtPath,
    recentGameTypes: options?.recentGameTypes,
    signalScores: options?.signalScores,
    nicheContext: options?.nicheContext,
  });

  const parts: (ReturnType<typeof createPartFromBase64> | string)[] = [];
  if (options?.imageBase64 && options?.imageMimeType) {
    parts.push(createPartFromBase64(options.imageBase64, options.imageMimeType));
  }
  parts.push(prompt);

  let res;
  try {
    res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts as Parameters<typeof ai.models.generateContent>[0]['contents'],
      config: {
        temperature: 1.1,
        topP: 0.95,
        responseMimeType: 'application/json',
        responseSchema: GAME_CONFIG_SCHEMA as object,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      return {
        ...DEFAULT_CONFIG,
        reasoning: 'Rate limit reached. Using default config. Check quota at ai.google.dev.',
      };
    }
    throw new Error(`Gemini API error: ${msg}`);
  }

  const text = res.text;
  if (!text) {
    throw new Error('No response from Gemini');
  }

  let parsed: GameConfig;
  try {
    parsed = JSON.parse(text) as GameConfig;
  } catch {
    throw new Error('Invalid JSON from Gemini');
  }

  // Ensure valid game type
  const validTypes = [
    'endless_runner',
    'obstacle_dodge',
    'rhythm_tap',
    'memory_match',
    'trivia',
    'reaction_test',
    'face_dodge',
  ];
  if (!validTypes.includes(parsed.gameType)) {
    parsed.gameType = 'obstacle_dodge';
  }

  // Ensure config has required fields
  const defaultTrivia = [
    { question: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1 },
    { question: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correctIndex: 1 },
    { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  ];
  const triviaQuestions =
    Array.isArray(parsed.config?.triviaQuestions) && parsed.config.triviaQuestions.length > 0
      ? parsed.config.triviaQuestions
      : defaultTrivia;
  parsed.config = {
    scrollSpeed: parsed.config?.scrollSpeed ?? 6,
    obstacleDensity: parsed.config?.obstacleDensity ?? 0.3,
    terrainHeights: parsed.config?.terrainHeights ?? Array(15).fill(0.5),
    theme: parsed.config?.theme ?? 'day',
    difficulty: parsed.config?.difficulty ?? 5,
    ...parsed.config,
    triviaQuestions,
  };

  return parsed;
}
