'use client';

import { useCallback, useMemo, useState } from 'react';
import { useJsApiLoader, GoogleMap, HeatmapLayer } from '@react-google-maps/api';

export interface HeatMapPoint {
  lat: number;
  lng: number;
  weight?: number;
}

/** Mock data: where people are playing Recesss (NYC area) */
const MOCK_PLAY_ACTIVITY: HeatMapPoint[] = [
  { lat: 40.7831, lng: -73.9712, weight: 3 },
  { lat: 40.758, lng: -73.9855, weight: 5 },
  { lat: 40.7306, lng: -73.9352, weight: 4 },
  { lat: 40.7128, lng: -74.006, weight: 6 },
  { lat: 40.7484, lng: -73.9857, weight: 2 },
  { lat: 40.7614, lng: -73.9776, weight: 4 },
  { lat: 40.7282, lng: -73.9942, weight: 3 },
  { lat: 40.7505, lng: -73.9934, weight: 2 },
  { lat: 40.6892, lng: -74.0445, weight: 1 },
  { lat: 40.6782, lng: -73.9442, weight: 2 },
  { lat: 40.8041, lng: -73.9588, weight: 2 },
  { lat: 40.7058, lng: -74.0089, weight: 3 },
  { lat: 40.7420, lng: -73.9882, weight: 4 },
  { lat: 40.7195, lng: -73.9873, weight: 2 },
  { lat: 40.7357, lng: -73.9910, weight: 3 },
];

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 40.7128, lng: -74.006 };
const defaultZoom = 11;

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  ],
};

interface RecessHeatMapProps {
  /** Override points (e.g. from API). Falls back to mock data if empty. */
  points?: HeatMapPoint[];
  className?: string;
  height?: string;
}

export function RecessHeatMap({ points = MOCK_PLAY_ACTIVITY, className = '', height = '320px' }: RecessHeatMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  // Must use NEXT_PUBLIC_* — client-side; read from .env.local
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'recess-heatmap',
    version: 'weekly',
    libraries: ['visualization'],
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const heatmapData = useMemo((): google.maps.visualization.WeightedLocation[] => {
    if (!isLoaded || typeof window === 'undefined') return [];
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g?.maps?.visualization) return [];
    return points.map((p) => ({
      location: new g.maps.LatLng(p.lat, p.lng),
      weight: p.weight ?? 1,
    })) as google.maps.visualization.WeightedLocation[];
  }, [points, isLoaded]);

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-white/60">Map failed to load. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 rounded-lg animate-pulse ${className}`}
        style={{ height }}
      >
        <span className="text-xs text-white/40">Loading map...</span>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-white/60">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`} style={{ height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        <HeatmapLayer
          data={heatmapData}
          options={{
            radius: 80,
            opacity: 0.8,
            gradient: [
              'rgba(0,0,0,0)',
              'rgba(24,48,160,0.55)',
              '#2044FF',
              '#FF00FF',
              '#FF3B30',
            ],
          }}
        />
      </GoogleMap>
    </div>
  );
}
