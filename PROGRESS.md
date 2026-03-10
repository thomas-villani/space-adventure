# Space Adventure — Technical Debt & Cleanup Tracker

Items identified during code review (2026-03-10). These are pre-existing patterns accumulated during rapid development — the codebase works well, but addressing these will improve maintainability and performance.

---

## HIGH Priority

### 1. Three.js Object Disposal (GPU Memory Leaks)

**Impact:** Hundreds of leaked GPU objects over a full playthrough.

There are zero `.dispose()` calls in the entire codebase. When scenes call `scene.remove(mesh)`, the Three.js geometry and material remain allocated in VRAM. Every scene transition leaks objects.

**Worst offenders (objects created in `enter()`, called every visit):**
- `MoonBounceScene.js` — ship + 20 star collectibles
- `MiningScene.js` — ship + rocks + crystals + laser bolts
- `StormSurferScene.js` — backdrop planet + ship + obstacles + bonuses
- `GeyserRideScene.js` — ship + 30 crystals + 20 cliff ledges + geyser particles
- `RingCatcherScene.js` — backdrop planet + catcher torus + rings
- `IceCrackerScene.js` — 12 ice blocks (24 meshes) + cursor
- `SatelliteLaunchScene.js` — planet + orbit + arrow + power bar + satellites
- `AsteroidScene.js` — laser bolts + asteroids (via `Asteroid` constructor)
- `OrbitScene.js` / `LandingScene.js` — new `Planet` object each enter
- `VictoryScene.js` — 40 firework geo+mat per second, unbounded

**Fix:** Add `dispose()` calls when removing objects, or pool/reuse meshes. For fireworks, share a single geometry and pool materials by color.

### 2. Starfield Duplication (12 Scenes)

**Impact:** ~180 lines of identical code, 12 separate GPU allocations for the same visual.

Every scene's `init()` independently creates a starfield with the same spherical-distribution algorithm (random `theta`/`phi`/`r`, `BufferGeometry`, `PointsMaterial`). Only `starCount` varies.

**Files:** `SolarSystemScene.js`, `AsteroidScene.js`, `OrbitScene.js`, `LandingScene.js`, `VictoryScene.js`, `MoonBounceScene.js`, `MiningScene.js`, `StormSurferScene.js`, `GeyserRideScene.js`, `RingCatcherScene.js`, `IceCrackerScene.js`, `SatelliteLaunchScene.js`

Additionally, `AsteroidScene.js` creates its own inline star texture canvas instead of using the shared `LandingScene._starTexture()`.

**Fix:** Extract a `createStarfield(count)` utility (e.g., `js/systems/SceneHelpers.js`) that returns a `THREE.Points`. Move `_starTexture()` from `LandingScene` to the shared module. Replace all 12 sites with one-liners.

---

## MEDIUM Priority

### 3. Mini-Game Ship Mesh Duplication (5 Scenes)

**Impact:** ~60 lines of near-identical ship construction code.

Five mini-game scenes each build a ship mesh (cone body + box wings) from scratch. Three are identical (MoonBounce, StormSurfer, GeyserRide), Mining is close, and AsteroidScene matches the full Ship.js dimensions with an added engine glow.

| Scene | Cone (r, h) | Wings (w, h, d) |
|---|---|---|
| AsteroidScene | 0.6, 2.5 | 3.0, 0.1, 1.0 |
| MoonBounceScene | 0.5, 1.8 | 2.2, 0.08, 0.7 |
| MiningScene | 0.5, 2.0 | 2.5, 0.08, 0.8 |
| StormSurferScene | 0.5, 1.8 | 2.2, 0.08, 0.7 |
| GeyserRideScene | 0.5, 1.8 | 2.2, 0.08, 0.7 |

**Fix:** Add a static `Ship.createMini(colors, scale)` factory that returns a `THREE.Group`. Use `scale = 1.0` for AsteroidScene (full size + engine glow) and `scale = 0.8` for the rest. Alternatively, two presets: `'full'` and `'mini'`.

### 4. Hex Color Utility

**Impact:** Minor — 5 instances of the same inline pattern.

The pattern `'#' + value.toString(16).padStart(6, '0')` appears in `UIManager.js` (4 times) and `PhotoManager.js` (1 time).

**Fix:** Extract a `hexColor(n)` one-liner utility.

---

## LOW Priority

### 5. Default Player Name in Multiple Places

`'Space Explorer'` appears as a fallback in `game.js` (constructor), `UIManager.js` (`getMenuChoices`), and `index.html` (placeholder attribute). The HTML placeholder can't reference a JS constant, so full unification isn't possible, but the two JS sites could share a constant.

### 6. Victory Melody Repeated 9 Times

The melody `[[523, 0.12], [659, 0.12], [784, 0.2]]` (C5-E5-G5 arpeggio) is the "success jingle" in all 7 mini-game scenes plus `AsteroidScene` and `game.js`. A named constant like `VICTORY_MELODY` would let it be tuned in one place.

### 7. Laser/Blaster Duplication (2 Scenes)

`AsteroidScene.fireLaser()` and `MiningScene._fireLaser()` both create a green cylinder bolt with a point light. Dimensions differ slightly. A shared `createLaserBolt()` factory would reduce this.

### 8. Collectible Creation Pattern (4 Scenes)

Four scenes create collectible items using nearly identical `OctahedronGeometry` + emissive material: MoonBounce (stars), Mining (crystals), GeyserRide (crystals), StormSurfer (bonuses). A `createCollectible(pos, color, size)` helper could serve all four.
