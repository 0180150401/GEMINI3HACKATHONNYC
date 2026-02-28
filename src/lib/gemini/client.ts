import { GoogleGenAI, createPartFromBase64 } from '@google/genai';
import type { UserMetrics } from '@/types';
import type { GameConfig } from '@/types';
import { buildGamePrompt, GAME_CONFIG_SCHEMA } from './game-prompt';

export interface GenerateGameOptions {
  imageBase64?: string;
  imageMimeType?: string;
  nicheContext?: {
    placeVibe?: string;
    newsVibe?: string;
    weatherVibe?: string;
    musicVibe?: string;
  };
}

const DEFAULT_CONFIG: GameConfig = {
  gameType: 'real_world_task',
  reasoning: 'Demo mode: no API key. Using default task.',
  config: {
    task: 'Take a photo of your hand holding something green (plant, leaf, or grass)',
    verificationCriteria: 'hand visible holding a green plant, leaf, or grass',
    travelItinerary: '1. Step outside. 2. Find a park, yard, or any spot with plants. 3. Complete your task there.',
    sideQuest: 'Spot something green you\'ve never noticed before.',
    theme: 'day',
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
        reasoning: 'Rate limit reached. Using default task. Check quota at ai.google.dev.',
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

  parsed.gameType = 'real_world_task';
  const defaultTask = 'Take a photo of your hand holding something green (plant, leaf, or grass)';
  const defaultCriteria = 'hand visible holding a green plant, leaf, or grass';
  const defaultItinerary = '1. Step outside. 2. Find a park or spot with plants. 3. Complete your task there.';
  const defaultSideQuest = 'Spot something unexpected along the way.';
  parsed.config = {
    theme: parsed.config?.theme ?? 'day',
    ...parsed.config,
    task: parsed.config?.task ?? defaultTask,
    verificationCriteria: parsed.config?.verificationCriteria ?? defaultCriteria,
    travelItinerary: parsed.config?.travelItinerary ?? defaultItinerary,
    sideQuest: parsed.config?.sideQuest ?? defaultSideQuest,
  };

  return parsed;
}
