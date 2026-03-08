# Space Adventure v2 — Roadmap

## Design Principles
- Keep it forgiving: no game-over, no punishment, always rewarding
- Ages 3-6: simple controls, big visuals, read-aloud support
- No build tools, no asset files: procedural everything (Three.js primitives, Web Audio, canvas textures, browser TTS)
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

Use the browser's built-in `SpeechSynthesis` API to read facts, planet names, quiz questions, and "Did You Know?" tips aloud.

### What Gets Read
- Planet name when approaching ("You're near Jupiter!")
- All facts on the fact screen (read sequentially)
- Quiz questions (not the options — let kids read/discuss those)
- "Did You Know?" pop-ups
- Victory message
- Postcard text

### Implementation
- `js/systems/TTSManager.js` wrapping `window.speechSynthesis`
- Methods: `speak(text)`, `stop()`, `setRate(speed)`, `setVoice(voice)`
- Settings in pause menu: TTS on/off, speed (slow/normal), voice selection
- Queue system: if something is being read, new speech waits or interrupts
- Speak rate default: 0.85 (slightly slower than normal for young listeners)
- Prefer voices with "child" or "female" in the name for friendliness (fall back to default)

### Considerations
- Not all browsers/OSes have the same voices — graceful fallback
- Mobile browsers may require user gesture before first speech
- Add a "Read Again" button on fact screens
- Don't read during asteroid minigame (distracting)

---

## 7. Other Quality-of-Life Ideas (Future)

These are good ideas but lower priority. Capture here for later.

- **Minimap/radar** — small 2D overhead view showing planet positions relative to the ship. Huge help for navigation, especially in the sparse outer solar system.
- **Autopilot/waypoint** — select a destination from the journal and the ship steers toward it. Essential for the youngest players (3-4) who can't navigate well.
- **Difficulty settings** — "Explorer mode" (no asteroids, just fly and learn) vs "Adventurer mode" (current). Lets younger kids enjoy without minigame pressure.
- **Ship customization** — pick ship color/shape at game start. Kids love personalizing.
- **Background music** — procedural ambient music via Web Audio. Warm tones near Sun, eerie near Neptune, playful near Earth.
- **Animated moons** — moons slowly orbit their parent planets instead of sitting still.
- **Constellation outlines** — connect background stars to show real constellations.
- **Scale comparison** — a "how big?" screen that lines up planets side-by-side.
- **Multiple pilot profiles** — siblings get separate saves with their own name/progress.
- **Solar flare events** — occasional golden particle wave from the Sun. Purely visual.
- **Alien radio signal** — strange tones as you approach Voyager. Mystery element.

---

## Progress Tracker

| # | Feature | Status |
|---|---------|--------|
| 1 | TTS (Text-to-Speech) | DONE |
| 2 | "Did You Know?" Random Facts | DONE |
| 3 | Wormhole / Secret Passage | DONE |
| 4 | Planet Mini-Games | IN PROGRESS (3/12: Ring Catcher, Moon Bounce, Mining) |
| 5 | Mission System | TODO |
| 6 | Photo Mode & Postcards | TODO |
| 7 | Minimap / Autopilot | TODO |

## Priority Order (Suggested)

1. **TTS** — high impact, low effort, transforms accessibility for pre-readers
2. **"Did You Know?" facts** — low effort, adds life to exploration downtime
3. **Wormhole** — moderate effort, big fun factor, solves navigation pain
4. **Planet mini-games** — high effort but the kids' favorite feature request (start with 2-3)
5. **Mission system** — moderate effort, adds replayability and structure
6. **Photo mode & postcards** — moderate effort, unique and memorable
7. **Minimap / autopilot** — important for youngest players
