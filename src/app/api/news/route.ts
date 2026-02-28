import { NextResponse } from 'next/server';
import { getTopHeadlines } from '@/lib/api/news';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const country = url.searchParams.get('country') ?? 'us';
  const limit = Math.min(20, parseInt(url.searchParams.get('limit') ?? '10', 10) || 10);

  const headlines = await getTopHeadlines(country, limit);
  return NextResponse.json({ headlines });
}
