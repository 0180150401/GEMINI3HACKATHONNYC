import { GoogleGenAI } from '@google/genai';
import type { UserMetrics } from '@/types';
import type { GameConfig } from '@/types';
import { buildGamePrompt, GAME_CONFIG_SCHEMA } from './game-prompt';

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

export async function generateGameConfig(metrics: UserMetrics): Promise<GameConfig> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ...DEFAULT_CONFIG, reasoning: 'Demo mode: GEMINI_API_KEY not set. Add your key to enable AI-powered generation.' };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildGamePrompt(metrics);

  const res = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: GAME_CONFIG_SCHEMA as object,
    },
  });

  const text = res.text;
  if (!text) {
    throw new Error('No response from Gemini');
  }

  const parsed = JSON.parse(text) as GameConfig;

  // Ensure valid game type
  const validTypes = ['endless_runner', 'obstacle_dodge', 'rhythm_tap'];
  if (!validTypes.includes(parsed.gameType)) {
    parsed.gameType = 'obstacle_dodge';
  }

  // Ensure config has required fields
  parsed.config = {
    scrollSpeed: parsed.config?.scrollSpeed ?? 6,
    obstacleDensity: parsed.config?.obstacleDensity ?? 0.3,
    terrainHeights: parsed.config?.terrainHeights ?? Array(15).fill(0.5),
    theme: parsed.config?.theme ?? 'day',
    difficulty: parsed.config?.difficulty ?? 5,
    ...parsed.config,
  };

  return parsed;
}
