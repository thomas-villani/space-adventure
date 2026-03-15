# Space Adventure

A 3D space exploration game for kids ages 3-6. Fly a spaceship through the solar system, dodge asteroids, visit planets and moons, and learn fun space facts along the way.

Built with Three.js -- no build tools, no bundler, just open and play.

## Play

Serve the project directory with any static file server:

```bash
npx serve . -l tcp://127.0.0.1:3000
```

Or: `python -m http.server 3000`

Then open http://127.0.0.1:3000 in a browser.

Works on desktop (keyboard) and tablets/phones (touch).

## Features

- **28 destinations** -- the Sun, 8 planets, 5 dwarf planets, 12 moons, and 2 Kuiper Belt objects
- **Planet mini-games** -- ring catching on Saturn, storm surfing on Jupiter, geyser riding on Enceladus, ice cracking on Europa, and more
- **Asteroid dodge minigame** -- fly through asteroid fields and blast rocks with your blaster
- **Space facts and quizzes** -- every destination has real facts and a quiz question
- **Achievements** -- earn badges for exploration milestones, quiz streaks, and high scores
- **Missions** -- up to 3 active missions that guide exploration
- **Space Journal** -- tracks every destination you've visited with its facts
- **Photo mode** -- orbit your ship and snap screenshots
- **Ship customization** -- pick your pilot name and ship color
- **Read-aloud** -- optional TTS narration of facts and quizzes with pre-generated MP3 audio
- **Save system** -- 10 manual save slots plus automatic crash recovery (auto-saves progress to localStorage)
- **High scores** -- persistent leaderboard across playthroughs
- **Forgiving gameplay** -- no game over, score never goes negative, points awarded even for wrong answers

## Controls

### Keyboard

| Key | Action |
|---|---|
| Arrow keys / WASD | Fly ship / dodge asteroids |
| Enter / Space | Visit planet, advance dialog, fire blaster |
| Q | Cycle speed (Slow / Normal / Fast) |
| Esc | Pause / resume |
| P | Photo mode |
| J | Space Journal |
| M | Mission board |
| G | Photo gallery |

### Touch (tablet / phone)

- **Drag anywhere** on the left side of the screen to steer (a virtual joystick appears at your touch point)
- **Star button** (bottom-right) to interact, visit planets, fire blaster
- **Pause button** and **speed button** below the star
- All menus and screens have tappable buttons

## Tech

- **Three.js** (v0.160.0) loaded from CDN via import map
- **No bundler** -- native ES modules, open `index.html` and go
- **No texture files** -- all visuals are Three.js primitives (spheres, cones, boxes) with procedural colors
- **Procedural audio** -- Web Audio API oscillators for sound effects and melodies
- **Pre-generated TTS** -- MP3 files in `audio/` for read-aloud narration
- **DOM overlays** -- UI panels (HUD, facts, quizzes, menus) are HTML/CSS on top of the canvas
- **localStorage** -- saves, achievements, journal, photos, and auto-save persistence

## Scoring

| Action | Points |
|---|---|
| Explore a destination | +5 |
| Correct quiz answer | +10 |
| Wrong quiz answer | +3 |
| Shoot an asteroid | +2 |
| Dodge an asteroid | +1 |
| Hit by an asteroid | -1 (min 0) |

## License

GPL-3.0
