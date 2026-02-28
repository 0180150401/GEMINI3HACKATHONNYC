/** Raw output from a single data source */
export interface IngestResult {
  source: string;
  fetchedAt: string;
  data: unknown;
  error?: string;
}

/** Normalized item after transform */
export interface TransformedItem {
  type: string;
  value: string;
  metadata?: Record<string, unknown>;
}

/** Enriched context for game generation */
export interface PipelineContext {
  /** User-uploaded image for image-based personalization */
  image?: {
    base64: string;
    mimeType: string;
  };
  news: {
    headlines: string[];
    categories: Record<string, string[]>;
    dominantThemes: string[];
  };
  weather?: {
    temp: number;
    condition: string;
    humidity?: number;
  };
  terrain?: {
    elevation: number;
    lat: number;
    lng: number;
    placeTypes?: string[];
    nearbyPlaces?: { name: string; types: string[] }[];
  };
  metadata: {
    pipelineRunAt: string;
    sourcesIngested: string[];
    stagesCompleted: string[];
  };
}
