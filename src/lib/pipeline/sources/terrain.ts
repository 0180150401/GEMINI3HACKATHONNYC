import { getElevation, type NearbyPlace } from '@/lib/api/google-maps';

export interface TerrainData {
  elevation: number;
  lat: number;
  lng: number;
  placeTypes?: string[];
  nearbyPlaces?: NearbyPlace[];
}

export async function ingestTerrain(lat = 40.7128, lng = -74.006): Promise<TerrainData | null> {
  try {
    const result = await getElevation(lat, lng);
    if (!result) return null;
    return {
      elevation: result.elevation,
      lat: result.location.lat,
      lng: result.location.lng,
    };
  } catch {
    return null;
  }
}
