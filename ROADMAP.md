# Space Adventure v2 — Roadmap

## Design Principles
- Keep it forgiving: no game-over, no punishment, always rewarding
- Ages 3-6: simple controls, big visuals, read-aloud support
- No build tools: procedural visuals (Three.js primitives, Web Audio, canvas textures) with pre-generated TTS audio
- Existing features to KEEP: asteroid blaster minigame, fact screens, quizzes, crystals, achievements, save/load

---

## 1. Planet Mini-Games

Each destination (or category of destinations) gets a unique mini-game in addition to the existing asteroid dodge. The player plays the mini-game AFTER the asteroid run (or instead of it for some destinations). Mini-games should be 15-30 seconds, simple, and always winnable.

### Ideas by Destination

| Destination | Mini-Game | Description |
|---|---|---|
| Saturn | Ring Catcher | Rings fly toward the screen, tilt ship to catch them on the planet |
| Io | Eruption Dodge | Volcanoes erupt from below, dodge the lava blobs (side-scroller style) |
| Moon | Low-Gravity Bounce | Ship bounces in low gravity, collect stars on the way up |
| Europa | Ice Cracker | Tap/click to crack ice blocks and reveal the ocean underneath |
| Mars | Rover Driver | Simple top-down maze: drive a rover to collect rock samples |
| Titan | Rain Dodge | Methane rain falls, steer an umbrella/shield to stay dry |
| Enceladus | Geyser Ride | Ride a water geyser upward, tilt to collect crystals |
| Earth | Satellite Launch | Aim and launch a satellite into orbit (angle + power) |
| Jupiter | Storm Surfer | Fly through the Great Red Spot, dodge lightning bolts |
| Neptune | Wind Rider | Ride the fastest winds — lean into gusts to go faster |

### Asteroid Belt Mini-Games

| Location | Mini-Game | Description |
|---|---|---|
| Vesta / Ceres | Asteroid Mining | Dig for crystals/metals in a simple click-to-break-rocks game |
| Kuiper Belt | Ice Fishing | "Fish" for icy objects with a grappling beam |

### Implementation Notes
- Each mini-game is a new scene class (e.g., `RingCatcherScene.js`, `MiningScene.js`)
- Planet data gets a `miniGame: 'ring-catcher'` field to map destination to mini-game
- Mini-games award bonus score (5-15 points) and possibly unique collectibles
- Some mini-games can be shared across destinations with different skins/speeds

---

## 2. Mission System

A mission board accessible from the pause menu or a new "Mission Control" UI element. Missions provide structured goals beyond free exploration.

### Mission Types

**Delivery / Taxi Missions**
- "Zorp the alien wants to visit Saturn! Pick them up on Mars and fly to Saturn."
- "Deliver a care package from Earth to the Space Station."
- "A scientist on Titan needs ice samples from Enceladus."
- Visual: a small alien/package sprite attached to the ship while carrying

**Collection Missions**
- "Collect the titanium asteroid in the asteroid belt — it contains more metal than all of Earth!"
- "Gather 3 ice crystals from the Kuiper Belt."
- "Find the golden asteroid near Jupiter — it has more gold than all the gold on Earth!"
- Special collectible objects spawned at specific locations when mission is active

**Route Missions**
- "Visit Mercury, Venus, and Earth in order — the inner planet tour!"
- "Fly from Neptune to the Sun as fast as you can — the Grand Tour!"
- "Visit all 4 of Jupiter's big moons without leaving Jupiter's neighborhood."

**Discovery Missions**
- "Something strange is beeping near Voyager. Investigate!"
- "A new comet has been spotted. Find it before it leaves the solar system!"
- "Photograph 5 different planets." (ties into Photo Mode)

### Implementation Notes
- `js/data/missions.js` — mission definitions with type, objectives, rewards
- `js/systems/MissionManager.js` — tracks active mission, progress, completion
- Missions available from a "Mission Board" UI overlay (like the journal)
- 3-5 missions available at a time, new ones appear as old ones complete
- Reward: bonus score + unique achievement badges
- Keep missions optional — free exploration always works

---

## 3. Photo Mode & Postcards

### Photo Mode
- Press `P` (or a camera button) to enter photo mode
- Game pauses, UI hides, camera can be rotated freely around the ship
- "Snap!" button (Enter) captures the current Three.js render to a canvas
- Photo saved to an in-game gallery (stored as data URLs in localStorage, with size limits)
- Fun overlay frames: "Greetings from Saturn!", planet-themed borders

### Postcards
- After visiting a planet, option to "Send a Postcard"
- Auto-generated message: "Dear Mom, I visited Jupiter today. It's VERY big! Love, [player name]"
- Uses the photo from photo mode (or auto-captures one during orbit flyby)
- Postcard can be saved/printed (render to a styled canvas, offer download)
- Gallery of postcards in the journal

### Implementation Notes
- `renderer.domElement.toDataURL()` for screenshot capture
- Postcard template rendered on a 2D canvas with text overlay
- Gallery stored in localStorage (limit to ~10 postcards to avoid storage limits)
- Could tie into missions: "Photograph 5 different planets"

---

## 4. "Did You Know?" Random Facts

- While flying in the solar system, a small toast notification pops up every 30-60 seconds
- Fun space facts not tied to any specific planet
- Dismisses automatically after 5 seconds or on any key press
- Facts pool in `js/data/funFacts.js`

### Example Facts
- "Did you know astronauts grow up to 2 inches taller in space?"
- "A day on Venus is longer than a year on Venus!"
- "There are more stars in the universe than grains of sand on Earth!"
- "In space, no one can hear you scream — there's no air to carry sound!"
- "The footprints on the Moon will last for millions of years!"
- "A spacesuit costs about $12 million!"
- "Saturn's rings would fit between Earth and the Moon!"
- "Neutron stars are so dense that a teaspoon would weigh a billion tons!"
- "Space smells like seared steak and gunpowder, according to astronauts!"
- "There's a planet made of diamonds called 55 Cancri e!"

### Implementation Notes
- Small non-intrusive toast in the corner (not the center popup)
- Don't show during mini-games, quizzes, or menus
- Track shown facts to avoid repeats within a session
- TTS reads the fact aloud (see Section 6)

---

## 5. Wormhole / Secret Passage

A hidden wormhole in the outer reaches of the solar system that teleports the ship to the inner solar system (and vice versa).

### Design
- **Location**: Near the Kuiper Belt (distance ~460-490), visually distinct — a swirling vortex of purple/blue particles
- **Exit**: Near the asteroid belt (distance ~150-160), matching vortex
- **Activation**: Fly into the vortex center
- **Effect**: Screen flash, wooshing sound, ship teleports to the other end
- **Bidirectional**: Works both ways
- **Visual**: Rotating torus with particle effect, pulsing glow, visible from moderate distance

### Implementation Notes
- Two special objects in the scene (not destinations — no facts/quiz)
- Collision detection like planets but triggers teleport instead of visit
- Fun warp animation: brief tunnel of stars effect (stretch starfield) during transition
- Could tie into a mission: "Discover the ancient wormhole!"
- Achievement: "Wormhole Explorer — Use the wormhole for the first time"

---

## 6. Text-to-Speech (TTS)

Pre-generated audio using OpenAI's `gpt-4o-mini-tts` API with the **Shimmer** voice. Falls back to browser `SpeechSynthesis` for any text without a pre-generated file.

### What Gets Read
- Planet name when approaching ("You're near Jupiter!")
- All facts on the fact screen (read sequentially)
- Quiz questions (not the options — let kids read/discuss those)
- "Did You Know?" pop-ups
- Victory message
- Mini-game intros and completion messages
- Mission completion announcements

### Implementation
- 274 pre-generated `.wav` files in `audio/` (organized by category: planets, quizzes, visits, proximity, funfacts, missions, ui)
- `audio/text-lookup.json` maps exact spoken text → audio file path
- `js/systems/TTSManager.js` loads the lookup, plays `.wav` via HTML `Audio` API, caches loaded audio elements
- Falls back to browser `SpeechSynthesis` if audio files unavailable
- Regenerate audio: `uv run --with requests generate_audio.py`
- Pronunciation fixes applied during generation: Makemake → "Mak-ee Mak-ee", blanks → "blank", Haumea → "How-may-ah"

---

## 7. New Destinations

### Saturn Moons
- **Mimas** — giant crater makes it look like the Death Star. Visually striking. Mini-game: moon-bounce.
- **Iapetus** — one half bright white, the other jet black. "Two-face" moon. Unique half-and-half 3D model.

### More Uranus/Neptune Moons
- **Titania** — largest Uranus moon, huge canyons. Mini-game: ice-cracker.
- **Oberon** — dark, mysterious, cratered. Mini-game: mining.

### Spacecraft Encounters (bonus destinations)
- **James Webb Space Telescope** — orbiting at L2. Could show mirror segments unfolding or just cool facts about seeing the oldest light in the universe.
- **Perseverance Rover** — on Mars's surface. A "visit the rover" branch off Mars. Mini-game: help the rover collect rock samples.
- **Cassini** (memorial) — near Saturn. Tribute to the spacecraft that dove into Saturn's atmosphere.

### Other
- **Asteroid Bennu** — near asteroid belt. OSIRIS-REx grabbed a sample. Mini-game: sample collection.

---

## 8. New Activities & Systems

### Ship Customization
- Pick ship color/shape at game start or from pause menu
- Add stickers/decals (procedural shapes)
- Name your ship
- Unlock new ship parts by completing missions
- Kids love personalizing — high engagement feature

### Creature Collection ("Space Zoo")
- Friendly alien creatures found at specific destinations
- Purely cosmetic collectibles — "Space Zoo" page in the journal
- Each creature has a silly name and fun description
- Kids love collecting things

### Space Races
- Timed point-to-point courses (e.g., "Earth to Mars dash")
- Ghost trail shows the path with waypoint markers
- Non-competitive — you always "win" but get bonus points for collecting stars along the route
- Reuses the solar system scene

### Constellation Finder
- When near Earth, a mini-game connecting stars to form constellations (Big Dipper, Orion)
- Arrow between stars, press Enter to connect
- Educational + satisfying line-drawing feel

### Gravity Slingshot
- Mini-game where you aim your ship to swing around a planet using its gravity
- Simple trajectory preview line, press Enter to launch
- Watch the ship curve around — teaches real space navigation concepts

### Space Weather Events
- Random events during solar system flight (low effort, high delight):
  - **Solar flare** — golden particle wave from the Sun
  - **Meteor shower** — sparkles across the screen, collect them for bonus points
  - **Aurora near Earth** — green/purple shimmer effect

---

## 9. Quality-of-Life (Future)

- **Minimap/radar** — small 2D overhead view showing planet positions relative to the ship. Huge help for navigation, especially in the sparse outer solar system.
- **Autopilot/waypoint** — select a destination from the journal and the ship steers toward it. Essential for the youngest players (3-4) who can't navigate well.
- **Difficulty settings** — "Explorer mode" (no asteroids, just fly and learn) vs "Adventurer mode" (current). Lets younger kids enjoy without minigame pressure.
- **Background music** — procedural ambient music via Web Audio. Warm tones near Sun, eerie near Neptune, playful near Earth.
- **Animated moons** — moons slowly orbit their parent planets instead of sitting still.
- **Scale comparison** — a "how big?" screen that lines up planets side-by-side.
- **Multiple pilot profiles** — siblings get separate saves with their own name/progress.
- **Alien radio signal** — strange tones as you approach Voyager. Mystery element.
- ~~**Better TTS voice-overs**~~ — DONE (OpenAI gpt-4o-mini-tts Shimmer voice, 274 pre-generated .wav files)

---

## Progress Tracker

| # | Feature | Status |
|---|---------|--------|
| 1 | TTS (Text-to-Speech) | DONE |
| 2 | "Did You Know?" Random Facts | DONE |
| 3 | Wormhole / Secret Passage | DONE |
| 4 | Planet Mini-Games | DONE (7/7: Ring Catcher, Moon Bounce, Mining, Storm Surfer, Geyser Ride, Satellite Launch, Ice Cracker) |
| 5 | Mission System | DONE (15 missions: routes, collections, deliveries, discoveries) |
| 6 | Photo Mode & Postcards | DONE |
| 7 | Pre-generated TTS Audio | DONE (274 .wav files, OpenAI Shimmer voice) |
| 8 | Ship Customization | DONE (8 color presets, player name, saved to profile) |
| 9 | New Destinations | TODO (Mimas, Iapetus, Titania, Oberon, JWST, Perseverance, Cassini, Bennu) |
| 10 | Creature Collection | TODO |
| 11 | Space Weather Events | TODO |
| 12 | Minimap / Autopilot | TODO |
| 13 | Gallery Lightbox Fix | DONE |
| 14 | Player Name + High Score Board | DONE |

## Priority Order (Next Up)

1. ~~**Ship customization**~~ — DONE
2. **Mimas + Iapetus** — visually distinctive moons, reuse existing mini-games
3. **Space weather events** — low effort, adds life and surprise
4. **Creature collection** — high engagement for the collecting instinct
5. **Minimap / autopilot** — important for youngest players
6. **Constellation finder** — educational mini-game, ties to Earth visits
7. **More destinations** — JWST, Perseverance, Bennu, etc.
