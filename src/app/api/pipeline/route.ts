import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline/pipeline';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');

  const options =
    !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : undefined;

  const context = await runPipeline(options);
  return NextResponse.json(context);
}
