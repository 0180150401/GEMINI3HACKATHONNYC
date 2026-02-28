# Data-Driven Mini Games

An open-source web platform where **Gemini** analyzes your data (health, Spotify, terrain, digital usage) and generates personalized minimal mini-games. Each game is uniquely tailored to your inputs.

## Features

- **LLM-powered game generation**: Gemini infers which game type fits your data and produces a config
- **Data sources**: Digital landscape (Google Cloud Elevation & Places APIs, Open Topo Data), Spotify Connect, manual input
- **Game types**: Endless Runner, Obstacle Dodge, Rhythm Tap
- **Config-driven engine**: Thin game executor that renders from LLM-generated JSON

## Quick Start

### Prerequisites

- Node.js 20+
- Supabase project
- Google AI Studio API key (free)
- (Optional) Spotify Developer app, Health Auto Export iOS app

### Setup

1. Clone and install:

```bash
npm install
```

2. Copy env template:

```bash
cp .env.example .env.local
```

3. Configure `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` – from [Supabase](https://supabase.com)
- `GEMINI_API_KEY` – from [Google AI Studio](https://aistudio.google.com)
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` – from [Spotify Developer](https://developer.spotify.com)
- `NEXT_PUBLIC_APP_URL` – e.g. `http://localhost:3000`

4. Run Supabase migrations:

```bash
npx supabase db push
# or apply supabase/migrations/001_initial.sql manually
```

5. Enable anonymous auth in Supabase (Dashboard → Authentication → Providers → Anonymous)

6. Start dev server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

### Demo without external data

1. Use the **Manual Input** card to enter steps, heart rate, sleep, screen time
2. Click **Save Data**
3. Click **Generate Game**
4. Play your generated game

## Data Integrations

### Digital Landscape (Google Cloud)

1. Create a [Google Cloud project](https://console.cloud.google.com)
2. Enable [Elevation API](https://developers.google.com/maps/documentation/elevation) and [Places API](https://developers.google.com/maps/documentation/places)
3. Create an API key and add to `GOOGLE_MAPS_API_KEY`
4. Without a key, the app falls back to [Open Topo Data](https://www.opentopodata.org/) (free, rate-limited)

### Spotify

1. Create an app at [Spotify Developer](https://developer.spotify.com)
2. Add redirect URI: `http://localhost:3000/api/auth/spotify/callback`
3. Click **Connect Spotify** on the dashboard

### Terrain

Enter lat/lng when generating a game. Uses [Open Topo Data](https://www.opentopodata.org/) (free, rate-limited).

## Project Structure

```
src/
├── app/
│   ├── api/           # generate-game, health-webhook, metrics, opentopo, spotify auth
│   ├── game/          # /game/new, /game/[id]
│   └── page.tsx       # Dashboard
├── components/
│   ├── games/         # EndlessRunner, ObstacleDodge, RhythmTap
│   └── dashboard/     # ConnectionCards
├── lib/
│   ├── api/           # spotify, opentopo, apple-health
│   ├── gemini/        # client, game-prompt
│   ├── game-engine/   # executor
│   └── supabase/      # client, server, middleware
└── types/
```

## Deploy

- **Vercel**: Connect repo, add env vars, deploy
- **Supabase**: Create project, run migrations, add URL/keys to Vercel

## License

MIT
