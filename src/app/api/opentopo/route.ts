import { NextResponse } from 'next/server';
import { getElevation } from '@/lib/api/opentopo';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lng = parseFloat(url.searchParams.get('lng') ?? '');
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: 'Missing or invalid lat, lng query params' },
      { status: 400 }
    );
  }
  const result = await getElevation(lat, lng);
  return NextResponse.json(result ?? { error: 'No elevation data' });
}
