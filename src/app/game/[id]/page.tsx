import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { GameExecutor } from '@/lib/game-engine/executor';
import type { GameConfig } from '@/types';

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('game_sessions')
    .select('game_type, config, reasoning')
    .eq('id', id)
    .single();

  if (error || !data) notFound();

  const config: GameConfig = {
    gameType: data.game_type as GameConfig['gameType'],
    reasoning: data.reasoning ?? undefined,
    config: (data.config as GameConfig['config']) ?? {},
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight">
          {config.gameType === 'real_world_task' ? 'Task' : config.gameType.replace(/_/g, ' ')}
        </h1>
        <div className="flex justify-center w-full">
          <GameExecutor config={config} />
        </div>
      </div>
    </div>
  );
}
