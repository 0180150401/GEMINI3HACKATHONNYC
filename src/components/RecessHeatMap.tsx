'use client';

import { useCallback, useMemo, useState } from 'react';
import { useJsApiLoader, GoogleMap, HeatmapLayer, Marker, InfoWindow } from '@react-google-maps/api';

export interface HeatMapPoint {
  lat: number;
  lng: number;
  weight?: number;
  /** Friend username for this point */
  username?: string;
  /** Task they completed */
  task?: string;
  /** URL to their task verification photo */
  photoUrl?: string;
}

/** Mock data: friends performing tasks with verification photos (NYC area). */
const MOCK_FRIEND_ACTIVITY: HeatMapPoint[] = [
  { lat: 40.7831, lng: -73.9712, weight: 2, username: 'alex', task: 'Hand holding a plant', photoUrl: 'https://picsum.photos/seed/alex1/200/200' },
  { lat: 40.758, lng: -73.9855, weight: 3, username: 'jordan', task: 'Feet on grass', photoUrl: 'https://picsum.photos/seed/jordan1/200/200' },
  { lat: 40.7306, lng: -73.9352, weight: 2, username: 'sam', task: 'Coffee by the window', photoUrl: 'https://picsum.photos/seed/sam1/200/200' },
  { lat: 40.7128, lng: -74.006, weight: 4, username: 'riley', task: 'Holding a leaf', photoUrl: 'https://picsum.photos/seed/riley1/200/200' },
  { lat: 40.7484, lng: -73.9857, weight: 2, username: 'casey', task: 'Something green in hand', photoUrl: 'https://picsum.photos/seed/casey1/200/200' },
  { lat: 40.7614, lng: -73.9776, weight: 3, username: 'morgan', task: 'Plant on desk', photoUrl: 'https://picsum.photos/seed/morgan1/200/200' },
  { lat: 40.7282, lng: -73.9942, weight: 2, username: 'quinn', task: 'Outdoor drink', photoUrl: 'https://picsum.photos/seed/quinn1/200/200' },
  { lat: 40.7505, lng: -73.9934, weight: 2, username: 'taylor', task: 'Hand with grass', photoUrl: 'https://picsum.photos/seed/taylor1/200/200' },
  { lat: 40.6892, lng: -74.0445, weight: 1, username: 'skyler', task: 'Feet in sand', photoUrl: 'https://picsum.photos/seed/skyler1/200/200' },
  { lat: 40.6782, lng: -73.9442, weight: 2, username: 'jamie', task: 'Holding a rock', photoUrl: 'https://picsum.photos/seed/jamie1/200/200' },
];

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 40.7128, lng: -74.006 };
const defaultZoom = 11;

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
    { elementType: 'labels.text.fill', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#1e1e1e' }] },
    { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

interface RecessHeatMapProps {
  /** Override points (e.g. from API). Falls back to mock friend data if empty. */
  points?: HeatMapPoint[];
  /** Real friends list: maps to mock locations when no real location data exists */
  friends?: { id: string; displayName: string; username: string }[];
  className?: string;
  height?: string;
}

/** NYC-area coords for placing friends without real location. Spread across the map. */
const FRIEND_PLACEMENT_COORDS = [
  [40.7831, -73.9712], [40.758, -73.9855], [40.7306, -73.9352], [40.7128, -74.006], [40.7484, -73.9857],
  [40.7614, -73.9776], [40.7282, -73.9942], [40.7505, -73.9934], [40.6892, -74.0445], [40.6782, -73.9442],
  [40.8041, -73.9588], [40.7058, -74.0089], [40.7420, -73.9882], [40.7195, -73.9873], [40.7357, -73.9910],
];

const MOCK_TASKS = ['Hand holding a plant', 'Feet on grass', 'Coffee by the window', 'Holding a leaf', 'Something green in hand', 'Plant on desk', 'Outdoor drink', 'Hand with grass', 'Feet in sand', 'Holding a rock'];

export function RecessHeatMap({ points, friends, className = '', height = '560px' }: RecessHeatMapProps) {
  const resolvedPoints = useMemo((): HeatMapPoint[] => {
    if (points && points.length > 0) return points;
    if (friends && friends.length > 0) {
      return friends.map((f, i) => {
        const [lat, lng] = FRIEND_PLACEMENT_COORDS[i % FRIEND_PLACEMENT_COORDS.length] ?? [40.7128, -74.006];
        const task = MOCK_TASKS[i % MOCK_TASKS.length];
        return { lat, lng, weight: 2, username: f.username, task, photoUrl: `https://picsum.photos/seed/${f.username}${i}/200/200` };
      });
    }
    return MOCK_FRIEND_ACTIVITY;
  }, [points, friends]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
    return resolvedPoints.map((p) => ({
      location: new g.maps.LatLng(p.lat, p.lng),
      weight: p.weight ?? 1,
    })) as google.maps.visualization.WeightedLocation[];
  }, [resolvedPoints, isLoaded]);

  if (loadError) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-zinc-900 p-4 ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-white/60">Map failed to load. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.</p>
        <p className="text-xs text-white/40 text-center">
          If you see ApiNotActivatedMapError, enable{' '}
          <a
            href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            Maps JavaScript API
          </a>{' '}
          in Google Cloud Console.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 animate-pulse ${className}`}
        style={{ height }}
      >
        <span className="text-xs text-white/40">Loading map...</span>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-zinc-900 p-4 ${className}`}
        style={{ height }}
      >
        <p className="text-sm text-white/60">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
        <p className="text-xs text-white/40 text-center">
          Then enable{' '}
          <a
            href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            Maps JavaScript API
          </a>{' '}
          for your project.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`} style={{ height }}>
      <div className="flex-1 min-h-0 overflow-hidden">
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
        {resolvedPoints.map((p, i) => (
          <Marker
            key={i}
            position={{ lat: p.lat, lng: p.lng }}
            onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }}
          />
        ))}
        {selectedIndex != null && resolvedPoints[selectedIndex] && (() => {
          const p = resolvedPoints[selectedIndex];
          return (
            <InfoWindow
              position={{ lat: p.lat, lng: p.lng }}
              onCloseClick={() => setSelectedIndex(null)}
            >
              <div className="bg-black text-white p-2 min-w-[200px]">
                <p className="text-xs font-bold uppercase text-white/60 mb-1">{p.username}</p>
                <p className="text-sm mb-2">{p.task}</p>
                {p.photoUrl && (
                  <img src={p.photoUrl} alt={p.task} className="w-full h-32 object-cover rounded" />
                )}
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>
      </div>
    </div>
  );
}
