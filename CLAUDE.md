# Space Adventure - Kids Solar System Game

## Project Overview
A 3D browser-based space game for kids (ages 3-6) where they fly a spaceship through the solar system, dodge asteroids, visit planets/moons, and learn fun space facts. No build tools — pure ES modules + Three.js from CDN.

## Running
```bash
npx serve . -l tcp://127.0.0.1:3000
```
Then open http://127.0.0.1:3000. Alternatively: `python -m http.server`.

## Architecture
- **No bundler**: Native ES modules with Three.js loaded via import map in `index.html`
- **No texture files**: All visuals are colored Three.js primitives (spheres, cones, boxes)
- **No sound files**: Procedural audio via Web Audio API OscillatorNode

### Project Structure
```
index.html              # Entry point, Three.js import map, canvas + UI overlays
css/style.css           # Fredoka One font, HUD, fact/quiz panels, popups
js/
  main.js               # Bootstrap (creates Game instance)
  game.js               # Game class: renderer, state machine, game loop, audio, pause
  scenes/
    SolarSystemScene.js  # 3rd-person flight, starfield, sun, planets, boundary
    AsteroidScene.js     # Rail-style dodge minigame with blaster
    LandingScene.js      # Planet facts display + quiz
    VictoryScene.js      # Fireworks celebration screen
  entities/
    Ship.js              # Spaceship (primitives), speed control, proximity slowdown
    Planet.js            # Planet/moon/star rendering, beacons, visited stars, rings
    Asteroid.js          # Dodecahedron obstacles
  systems/
    InputManager.js      # Keyboard state tracking (arrows + WASD + Q/Esc/Space)
    UIManager.js         # DOM overlay control (HUD, facts, quiz, pause, score popups)
    ParticleEngine.js    # Engine trails, sparkles (Points-based)
  data/
    solarSystem.js       # All 21 destinations with facts, quizzes, positions
```

### Game States
`MENU → SOLAR_SYSTEM ↔ ASTEROID ↔ LANDING → VICTORY`

State machine lives in `game.js`. The `setState()` method calls `exit()` on the old scene, updates UI via `onStateChange()`, then calls `enter()` on the new scene. UI must update before `enter()` so scenes can show panels on top.

### Controls
- **Arrow keys / WASD**: Fly ship (solar system) or dodge (asteroid minigame)
- **Enter / Space**: Interact (visit planet, advance facts) or fire blaster (asteroid minigame)
- **Q**: Cycle speed (Slow / Normal / Fast)
- **Esc**: Pause / resume

### Key Design Decisions
- **Forgiving gameplay**: No game-over, score clamped at 0, points for wrong quiz answers too
- **28 destinations**: Sun + 8 planets + 5 dwarf planets/asteroids + 12 moons + 2 KBOs
- **Compressed solar system**: Non-realistic distances so planets are close and reachable
- **Boundary system**: Ship slows and snaps to face the sun when reaching the edge (distance 520)
- **Proximity slowdown**: Ship automatically slows near planets so kids can stop
- **Sun skips asteroid minigame**: Goes straight to facts since it doesn't make sense narratively
- **Already-visited planets**: Cannot be revisited; show a spinning green 3D star marker
- **Unvisited planets**: Show a spinning blue diamond beacon above them
- **Random quizzes**: Each destination has 3 quizzes; one is randomly picked per visit
- **Stars on distant shell**: Starfield uses `sizeAttenuation: false` at distance 1500-3000 so stars are always visible as fixed-size points

### Scoring
- **+5** for exploring a destination
- **+10** for correct quiz answer
- **+3** for wrong quiz answer (encouraging)
- **+2** for shooting an asteroid with the blaster
- **+1** for dodging an asteroid
- **-1** for getting hit by an asteroid (clamped at 0)

## Code Conventions
- ES modules throughout, no CommonJS
- No TypeScript, no JSX — plain JavaScript
- Three.js imported from CDN via import map (version 0.160.0)
- DOM manipulation for UI overlays (not Three.js CSS3DRenderer)
- Star texture shared via `LandingScene._starTexture()` static method
- Asteroid belt (distance 145-200) and Kuiper Belt (distance 440-520) are decorative only
