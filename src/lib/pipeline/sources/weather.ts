export interface WeatherData {
  temp: number;
  condition: string;
  humidity?: number;
  code: number;
}

/** Open-Meteo: free, no API key */
export async function ingestWeather(lat = 40.7128, lng = -74.006): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=America/New_York`
    );
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number };
    };
    const cur = data.current;
    if (!cur) return null;
    return {
      temp: cur.temperature_2m ?? 0,
      condition: weatherCodeToLabel(cur.weather_code ?? 0),
      humidity: cur.relative_humidity_2m,
      code: cur.weather_code ?? 0,
    };
  } catch {
    return null;
  }
}

function weatherCodeToLabel(code: number): string {
  const map: Record<number, string> = {
    0: 'clear', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
    45: 'foggy', 48: 'foggy', 51: 'drizzle', 53: 'drizzle', 55: 'drizzle',
    61: 'rain', 63: 'rain', 65: 'heavy rain', 71: 'snow', 73: 'snow', 75: 'heavy snow',
    80: 'rain showers', 81: 'rain showers', 82: 'heavy showers',
    95: 'thunderstorm', 96: 'thunderstorm', 99: 'thunderstorm',
  };
  return map[code] ?? 'unknown';
}
