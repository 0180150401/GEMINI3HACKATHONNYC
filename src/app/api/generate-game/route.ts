import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateGameConfig } from '@/lib/gemini/client';
import type { UserMetrics } from '@/types';
import { getPlaybackState } from '@/lib/api/spotify';
import { runPipeline } from '@/lib/pipeline/pipeline';
import { evaluateDecisionTree } from '@/lib/game-engine/decision-tree';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    lat?: number;
    lng?: number;
    metrics?: Partial<UserMetrics>;
    imageBase64?: string;
    imageMimeType?: string;
  };

  const lat = body.lat ?? 40.7128;
  const lng = body.lng ?? -74.006;

  // Run full data pipeline (ingest → transform → enrich), inject user image when present
  const pipelineContext = await runPipeline({
    lat,
    lng,
    image: body.imageBase64 && body.imageMimeType
      ? { base64: body.imageBase64, mimeType: body.imageMimeType }
      : undefined,
  });

  const metrics: UserMetrics = {
    landscape: pipelineContext.terrain
      ? {
          elevation: pipelineContext.terrain.elevation,
          lat: pipelineContext.terrain.lat,
          lng: pipelineContext.terrain.lng,
          placeTypes: pipelineContext.terrain.placeTypes,
        }
      : undefined,
    news: {
      headlines: pipelineContext.news.headlines,
      categories: pipelineContext.news.categories,
      dominantThemes: pipelineContext.news.dominantThemes,
    },
    weather: pipelineContext.weather,
    ...body.metrics,
  };

  // Spotify (if connected)
  const { data: spotifyConn } = await supabase
    .from('data_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'spotify')
    .single();
  if (spotifyConn?.access_token) {
    try {
      const playback = await getPlaybackState(spotifyConn.access_token);
      if (playback) {
        metrics.spotify = {
          isPlaying: playback.is_playing,
          tempo: playback.tempo,
          trackName: playback.item?.name,
          artistName: playback.item?.artists?.[0]?.name,
        };
      }
    } catch {
      // ignore
    }
  }

  // Fetch recent game types for user to encourage variety (Gemini + Gaming: persistent memory)
  const { data: recentSessions } = await supabase
    .from('game_sessions')
    .select('game_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentGameTypes = (recentSessions ?? []).map((s) => s.game_type).filter(Boolean);

  try {
    const dtResult = evaluateDecisionTree(metrics, {
      hasImage: !!pipelineContext.image,
      recentGameTypes,
    });

    const gameConfig = await generateGameConfig(metrics, {
      imageBase64: pipelineContext.image?.base64,
      imageMimeType: pipelineContext.image?.mimeType ?? 'image/jpeg',
      suggestedType: dtResult.suggestedType,
      dtPath: dtResult.path,
      recentGameTypes,
      signalScores: dtResult.signalScores,
      nicheContext: dtResult.nicheContext,
    });

    const { data: session, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        game_type: gameConfig.gameType,
        config: gameConfig.config,
        reasoning: gameConfig.reasoning,
      })
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      gameType: gameConfig.gameType,
      reasoning: gameConfig.reasoning,
      config: gameConfig.config,
      pipeline: {
        sourcesIngested: pipelineContext.metadata.sourcesIngested,
        runAt: pipelineContext.metadata.pipelineRunAt,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate game';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
