import { getElevation as getOpenTopoElevation } from './opentopo';

const GOOGLE_ELEVATION = 'https://maps.googleapis.com/maps/api/elevation/json';
const GOOGLE_PLACES_NEARBY = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

export interface ElevationResult {
  elevation: number;
  location: { lat: number; lng: number };
}

export async function getElevation(
  lat: number,
  lng: number
): Promise<ElevationResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    const url = `${GOOGLE_ELEVATION}?locations=${lat},${lng}&key=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        results?: { elevation: number; location: { lat: number; lng: number } }[];
      };
      const first = data.results?.[0];
      if (first) return { elevation: first.elevation, location: first.location };
    }
  }
  return getOpenTopoElevation(lat, lng);
}

export async function getElevationPath(
  path: { lat: number; lng: number }[]
): Promise<number[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || path.length < 2) return [];
  const encoded = encodeURIComponent(path.map((p) => `${p.lat},${p.lng}`).join('|'));
  const samples = Math.min(path.length * 2, 512);
  const url = `${GOOGLE_ELEVATION}?path=${encoded}&samples=${samples}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: { elevation: number }[] };
  return (data.results ?? []).map((r) => r.elevation);
}

export async function getNearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters = 500
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];
  const url = `${GOOGLE_PLACES_NEARBY}?location=${lat},${lng}&radius=${radiusMeters}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: { types?: string[]; name?: string }[];
  };
  const places = data.results ?? [];
  const types = new Set<string>();
  places.forEach((p) => p.types?.forEach((t) => types.add(t)));
  return [...types];
}
