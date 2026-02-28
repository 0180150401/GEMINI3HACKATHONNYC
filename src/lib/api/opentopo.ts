const BASE = 'https://api.opentopodata.org/v1';

export interface ElevationResult {
  elevation: number;
  location: { lat: number; lng: number };
}

/** Free fallback when Google Maps API key is not set */
export async function getElevation(
  lat: number,
  lng: number,
  dataset: string = 'mapzen'
): Promise<ElevationResult | null> {
  const url = `${BASE}/${dataset}?locations=${lat},${lng}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: { elevation: number; location: { lat: number; lng: number } }[] };
  const first = data.results?.[0];
  return first ?? null;
}
