# Game Archetype Decision Tree

This document describes the logic for selecting which mini-game archetype to generate based on aggregated user data. The decision tree is used both as prompt guidance for Gemini and as a reference for the team.

---

## Input Dimensions

| Dimension | Source | Key Metrics | Typical Ranges |
|-----------|--------|-------------|----------------|
| **Digital landscape** | Google Cloud Elevation API, Places API, Open Topo Data | elevation, elevationPath, placeTypes | elevation: 0–4000+ m |
| **Music** | Spotify | tempo (BPM), isPlaying | tempo: 60–180 |
| **Digital usage** | Manual | screenTimeHours | 0–24 |

---

## Decision Tree

```
START
  │
  ├─► [elevation > 500] OR [elevationPath present]
  │       └─► ENDLESS_RUNNER (terrain-driven)
  │           "Steep terrain or path data → elevation-shaped platformer"
  │
  ├─► [tempo > 100] AND [landscape data present]
  │       └─► ENDLESS_RUNNER
  │           "Upbeat music + landscape → active runner"
  │
  ├─► [screenTimeHours > 4]
  │       └─► RHYTHM_TAP (calming)
  │           "High screen time → slow, relaxing rhythm game"
  │
  ├─► [tempo present] AND [tempo 80–120]
  │       └─► RHYTHM_TAP
  │           "Moderate tempo, music-focused → beat-sync game"
  │
  ├─► [placeTypes present] (park, mountain, etc.)
  │       └─► OBSTACLE_DODGE or ENDLESS_RUNNER
  │           "Place types influence obstacle style and theme"
  │
  ├─► [mixed / neutral / sparse data]
  │       └─► OBSTACLE_DODGE
  │           "Default: adaptable, works with any data"
  │
  └─► [no data at all]
          └─► OBSTACLE_DODGE (default config)
              "Fallback: generic game"
```

---

## Archetype Definitions

### 1. Endless Runner

**When to choose:** Terrain/elevation data, or upbeat music + landscape.

**Config parameters:**
- `scrollSpeed`: Map from `tempo` (BPM/15, clamped 4–12) or default 6
- `terrainHeights`: From `elevation` or `elevationPath` (normalize to 0.2–0.8)
- `theme`: From place types or default `day`

### 2. Obstacle Dodge

**When to choose:** Mixed data, place types, or default fallback.

**Config parameters:**
- `obstacleDensity`: From elevation variance or default 0.3
- `scrollSpeed`: Default 6
- `theme`: From place types or default `day`

### 3. Rhythm Tap

**When to choose:** High screen time (calming), or music-focused with moderate tempo.

**Config parameters:**
- `scrollSpeed`: From `tempo` (tempo/20, clamped 3–8); slower for calming
- `theme`: Default `day`

---

## Tie-Breaking Rules

When multiple branches could apply:

1. **Landscape + music** → prefer Endless Runner over Rhythm Tap
2. **High screen time** → prefer Rhythm Tap (calming) over Obstacle Dodge
3. **Terrain only** → Endless Runner
4. **Music only (no landscape)** → Rhythm Tap
5. **Landscape only (no music)** → Obstacle Dodge or Endless Runner

---

## Data Availability Matrix

| Data available | Preferred archetype |
|----------------|---------------------|
| Elevation + Spotify | Endless Runner |
| Screen time | Rhythm Tap |
| Elevation / path | Endless Runner |
| Place types | Obstacle Dodge / Endless Runner |
| Spotify only | Rhythm Tap |
| Landscape only | Endless Runner |
| None | Obstacle Dodge (default) |
