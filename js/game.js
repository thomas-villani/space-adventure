import * as THREE from 'three';
import { InputManager } from './systems/InputManager.js';
import { UIManager } from './systems/UIManager.js';
import { ParticleEngine } from './systems/ParticleEngine.js';
import { StorageManager } from './systems/StorageManager.js';
import { SolarSystemScene } from './scenes/SolarSystemScene.js';
import { AsteroidScene } from './scenes/AsteroidScene.js';
import { OrbitScene } from './scenes/OrbitScene.js';
import { LandingScene } from './scenes/LandingScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { RingCatcherScene } from './scenes/RingCatcherScene.js';
import { MoonBounceScene } from './scenes/MoonBounceScene.js';
import { MiningScene } from './scenes/MiningScene.js';
import { StormSurferScene } from './scenes/StormSurferScene.js';
import { GeyserRideScene } from './scenes/GeyserRideScene.js';
import { SatelliteLaunchScene } from './scenes/SatelliteLaunchScene.js';
import { IceCrackerScene } from './scenes/IceCrackerScene.js';
import { TTSManager } from './systems/TTSManager.js';
import { MissionManager } from './systems/MissionManager.js';
import { PhotoManager } from './systems/PhotoManager.js';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from './data/achievements.js';
import { DESTINATIONS, REQUIRED_DESTINATIONS } from './data/solarSystem.js';
import { FUN_FACTS } from './data/funFacts.js';

export const GameState = {
  MENU: 'MENU',
  SOLAR_SYSTEM: 'SOLAR_SYSTEM',
  ASTEROID: 'ASTEROID',
  ORBIT: 'ORBIT',
  LANDING: 'LANDING',
  MINI_GAME: 'MINI_GAME',
  VICTORY: 'VICTORY',
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.clock = new THREE.Clock();
    this.input = new InputManager();
    this.ui = new UIManager();
    this.particles = new ParticleEngine();
    this.storage = new StorageManager();
    this.tts = new TTSManager();

    this.score = 0;
    this.visited = new Set();
    this.currentPlanet = null;
    this.state = GameState.MENU;
    this.paused = false;

    // Achievement tracking state
    this.quizStreak = 0;
    this.crystalsCollected = 0;
    this.asteroidsDestroyedThisRun = 0;
    this.wasHitThisRun = false;
    this.wormholeUsed = false;

    // Journal/save/mission/photo overlay state
    this.journalOpen = false;
    this.missionOpen = false;
    this.photoModeOpen = false;
    this.galleryOpen = false;
    this.saveMenuOpen = false;
    this.loadMenuOpen = false;
    this.confirmOpen = false;

    // Track whether current progress has been saved
    this._hasSaved = false;

    // Fun fact system
    this._funFactTimer = 0;
    this._funFactInterval = 40; // seconds between facts
    this._shownFacts = new Set();
    this._funFactActive = false;

    // Audio context (lazy init on first user interaction)
    this.audioCtx = null;

    // Scenes
    this.scenes = {
      [GameState.SOLAR_SYSTEM]: new SolarSystemScene(this),
      [GameState.ASTEROID]: new AsteroidScene(this),
      [GameState.ORBIT]: new OrbitScene(this),
      [GameState.LANDING]: new LandingScene(this),
      [GameState.VICTORY]: new VictoryScene(this),
    };

    // Mini-game scenes (dynamically mapped to MINI_GAME state)
    this.miniGameScenes = {
      'ring-catcher': new RingCatcherScene(this),
      'moon-bounce': new MoonBounceScene(this),
      'mining': new MiningScene(this),
      'storm-surfer': new StormSurferScene(this),
      'geyser-ride': new GeyserRideScene(this),
      'satellite-launch': new SatelliteLaunchScene(this),
      'ice-cracker': new IceCrackerScene(this),
    };

    // Mission system
    this.missions = new MissionManager(this);

    // Photo system
    this.photos = new PhotoManager(this.storage);
    this._lastOrbitPhoto = null;
    this._photoOrbitAngle = 0;
    this._photoOrbitElevation = 0;
    this._photoOrbitRadius = 15;
    this._photoTarget = null;

    // Init menu scene (reuse solar system starfield)
    this.scenes[GameState.SOLAR_SYSTEM].init();

    window.addEventListener('resize', () => this.onResize());
  }

  initAudio() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  playTone(freq, duration = 0.15, type = 'sine', volume = 0.1) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playMelody(notes) {
    let time = 0;
    for (const [freq, dur] of notes) {
      setTimeout(() => this.playTone(freq, dur, 'sine', 0.08), time * 1000);
      time += dur * 0.7;
    }
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const activeScene = this.scenes[this.state];
    if (activeScene && activeScene.camera) {
      activeScene.camera.aspect = window.innerWidth / window.innerHeight;
      activeScene.camera.updateProjectionMatrix();
    }
  }

  setState(newState, data) {
    const oldScene = this.scenes[this.state];
    if (oldScene && oldScene.exit) oldScene.exit();

    this.tts.stop();
    this.dismissFunFact();

    // Dynamically route to the correct mini-game scene
    if (newState === GameState.MINI_GAME && data?.planet?.miniGame) {
      this.scenes[GameState.MINI_GAME] = this.miniGameScenes[data.planet.miniGame];
    }

    this.state = newState;
    // Update UI before enter() so scene can show panels on top
    this.ui.onStateChange(newState, this);

    const newScene = this.scenes[this.state];
    if (newScene) {
      if (!newScene._initialized) {
        newScene.init();
        newScene._initialized = true;
      }
      if (newScene.enter) newScene.enter(data);
    }
  }

  addScore(points) {
    this.score = Math.max(0, this.score + points);
    this.ui.updateScore(this.score);
    // Check score achievements
    if (points > 0) this.checkAchievements();
  }

  markVisited(planetId) {
    this.visited.add(planetId);
    this.ui.updateVisited(this.visited);
    this.checkAchievements();
    this.missions.onVisit(planetId);
  }

  checkAchievements() {
    const check = (id, condition) => {
      if (condition && !this.storage.isAchievementUnlocked(id)) {
        if (this.storage.unlockAchievement(id)) {
          const def = ACHIEVEMENT_MAP[id];
          if (def) {
            this.ui.showBadgeNotification(def);
            // Celebratory melody
            this.playMelody([[880, 0.1], [1047, 0.1], [1319, 0.15]]);
          }
        }
      }
    };

    const v = this.visited;

    // Exploration
    check('first_visit', v.size >= 1);
    check('inner_planets', ['mercury', 'venus', 'earth', 'mars'].every(p => v.has(p)));
    check('outer_planets', ['jupiter', 'saturn', 'uranus', 'neptune'].every(p => v.has(p)));
    check('all_moons', ['moon', 'phobos', 'deimos', 'io', 'europa', 'ganymede', 'callisto', 'titan', 'enceladus', 'miranda', 'triton', 'charon'].every(m => v.has(m)));
    check('all_planets', ['mercury', 'venus', 'earth', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'makemake', 'haumea', 'eris'].every(p => v.has(p)));
    check('completionist', REQUIRED_DESTINATIONS.every(d => v.has(d.id)));
    check('voyager_found', v.has('voyager'));
    check('wormhole_explorer', this.wormholeUsed);

    // Quiz
    check('first_quiz', this.quizStreak >= 1);
    check('quiz_streak_3', this.quizStreak >= 3);
    check('quiz_streak_5', this.quizStreak >= 5);

    // Score
    check('score_50', this.score >= 50);
    check('score_100', this.score >= 100);
    check('score_200', this.score >= 200);

    // Collectibles
    check('first_crystal', this.crystalsCollected >= 1);
    check('crystals_25', this.crystalsCollected >= 25);

    // Asteroid (checked after minigame completes)
    check('sharpshooter', this.asteroidsDestroyedThisRun >= 10);
    check('untouchable', this._justFinishedAsteroid && !this.wasHitThisRun);
  }

  // ── Fun Facts ──
  _updateFunFacts(dt) {
    // Only show during solar system flight
    if (this.state !== GameState.SOLAR_SYSTEM || this.paused) return;
    if (this._funFactActive) return;

    this._funFactTimer += dt;
    if (this._funFactTimer < this._funFactInterval) return;

    this._funFactTimer = 0;
    // Randomize next interval (30-60s)
    this._funFactInterval = 30 + Math.random() * 30;

    // Pick a fact we haven't shown this session
    const available = FUN_FACTS.filter((_, i) => !this._shownFacts.has(i));
    if (available.length === 0) {
      this._shownFacts.clear(); // Reset pool if exhausted
      return;
    }
    const idx = FUN_FACTS.indexOf(available[Math.floor(Math.random() * available.length)]);
    this._shownFacts.add(idx);

    this._funFactActive = true;
    this.ui.showFunFact(FUN_FACTS[idx]);
    this.tts.speak(FUN_FACTS[idx]);
    this.playTone(900, 0.08, 'sine', 0.05);

    // Auto-clear active flag after toast dismisses
    setTimeout(() => { this._funFactActive = false; }, 31000);
  }

  dismissFunFact() {
    if (this._funFactActive) {
      this._funFactActive = false;
      this.ui.hideFunFact();
    }
  }

  togglePause() {
    // Only allow pause during active gameplay
    if (this.state === GameState.MENU || this.state === GameState.VICTORY) return;
    // Don't toggle pause if an overlay is open
    if (this.journalOpen || this.missionOpen || this.photoModeOpen || this.galleryOpen || this.saveMenuOpen || this.loadMenuOpen || this.confirmOpen) return;

    this.paused = !this.paused;
    this.ui.showPause(this.paused);

    if (!this.paused) {
      // Reset clock so we don't get a huge dt spike after unpausing
      this.clock.getDelta();
    }
    this.playTone(this.paused ? 400 : 600, 0.1);
  }

  toggleMissionBoard() {
    if (this.missionOpen) {
      this.missionOpen = false;
      this.ui.hideMissionBoard();
      if (this.paused) this.ui.showPause(true);
    } else {
      if (this.state !== GameState.SOLAR_SYSTEM && !this.paused) return;
      this.missionOpen = true;
      if (this.paused) this.ui.showPause(false);
      this.ui.showMissionBoard(this.missions.available, this.missions);
    }
    this.playTone(500, 0.08);
  }

  enterPhotoMode() {
    if (this.state !== GameState.SOLAR_SYSTEM && this.state !== GameState.ORBIT) return;
    if (this.paused || this.journalOpen || this.missionOpen || this.galleryOpen || this.saveMenuOpen || this.loadMenuOpen) return;

    this.photoModeOpen = true;
    this.dismissFunFact();

    const activeScene = this.scenes[this.state];
    const camera = activeScene.camera;

    // Save camera state
    this._savedCamPos = camera.position.clone();
    this._savedCamQuat = camera.quaternion.clone();

    // Determine orbit target and radius
    if (this.state === GameState.SOLAR_SYSTEM) {
      const shipPos = this.scenes[GameState.SOLAR_SYSTEM].ship.group.position;
      this._photoTarget = shipPos.clone();
      this._photoOrbitRadius = 18;
    } else {
      // Orbit scene — planet is at origin
      this._photoTarget = new THREE.Vector3(0, 0, 0);
      this._photoOrbitRadius = camera.position.length();
    }

    // Init orbit angles from current camera position
    const offset = camera.position.clone().sub(this._photoTarget);
    this._photoOrbitAngle = Math.atan2(offset.x, offset.z);
    this._photoOrbitElevation = Math.asin(Math.max(-1, Math.min(1, offset.y / offset.length())));

    this.ui.showPhotoHud();
    this.playTone(800, 0.08, 'sine', 0.05);
  }

  exitPhotoMode() {
    this.photoModeOpen = false;

    const activeScene = this.scenes[this.state];
    const camera = activeScene.camera;

    // Restore camera state
    camera.position.copy(this._savedCamPos);
    camera.quaternion.copy(this._savedCamQuat);

    this.ui.hidePhotoHud();
    // Restore HUD
    this.ui.onStateChange(this.state, this);
    this.playTone(400, 0.08, 'sine', 0.05);
  }

  snapPhoto() {
    const activeScene = this.scenes[this.state];
    const dataUrl = this.photos.capture(this.renderer, activeScene.scene, activeScene.camera);

    // Determine context
    let planetName = 'Space';
    if (this.state === GameState.ORBIT || this.state === GameState.LANDING) {
      planetName = activeScene.planetData?.name || 'Space';
    } else if (this.currentPlanet) {
      planetName = this.currentPlanet.name || 'Space';
    }

    this.photos.savePhoto(dataUrl, { planet: planetName });

    // Shutter effect
    this.ui.flashScreen('shutter');
    this.playMelody([[1200, 0.05], [800, 0.08]]);
    this.ui.showScorePopup(0, 'Photo saved!');
  }

  toggleGallery() {
    if (this.galleryOpen) {
      this.galleryOpen = false;
      this.ui.hideGallery();
      if (this.paused) this.ui.showPause(true);
    } else {
      if (this.state !== GameState.SOLAR_SYSTEM && !this.paused) return;
      if (this.journalOpen || this.missionOpen || this.photoModeOpen || this.saveMenuOpen || this.loadMenuOpen || this.confirmOpen) return;
      this.galleryOpen = true;
      if (this.paused) this.ui.showPause(false);
      this.ui.showGallery(this.photos.getGallery());
    }
    this.playTone(500, 0.08);
  }

  toggleJournal() {
    if (this.journalOpen) {
      this.journalOpen = false;
      this.ui.hideJournal();
      // If we were paused before opening journal, restore pause screen
      if (this.paused) this.ui.showPause(true);
    } else {
      // Only allow during solar system flight or while paused
      if (this.state !== GameState.SOLAR_SYSTEM && !this.paused) return;
      this.journalOpen = true;
      if (this.paused) this.ui.showPause(false);
      this.ui.showJournal(this.storage.getJournal());
    }
    this.playTone(500, 0.08);
  }

  toggleSaveMenu() {
    if (this.saveMenuOpen) {
      this.saveMenuOpen = false;
      this.ui.hideSaveScreen();
      if (this.paused) this.ui.showPause(true);
    } else {
      // Only while paused in solar system
      if (!this.paused || this.state !== GameState.SOLAR_SYSTEM) return;
      this.saveMenuOpen = true;
      this.ui.showPause(false);
      this.ui.showSaveScreen(this.storage.getSaves());
    }
    this.playTone(500, 0.08);
  }

  toggleLoadMenu() {
    if (this.loadMenuOpen) {
      this.loadMenuOpen = false;
      this.ui.hideLoadScreen();
      if (this.paused) this.ui.showPause(true);
    } else {
      // Allow from menu or while paused in solar system
      const fromMenu = this.state === GameState.MENU;
      const fromPause = this.paused && this.state === GameState.SOLAR_SYSTEM;
      if (!fromMenu && !fromPause) return;
      const saves = this.storage.getSaves();
      if (saves.length === 0) {
        this.playTone(300, 0.15);
        return;
      }

      // If loading from pause with unsaved progress, show confirmation first
      if (fromPause && !this._hasSaved && this.visited.size > 0) {
        this.confirmOpen = true;
        this.ui.showPause(false);
        this.ui.showConfirm(
          'You have unsaved progress! Load a saved game anyway?',
          () => {
            // Yes — proceed to load screen
            this.confirmOpen = false;
            this.ui.hideConfirm();
            this.loadMenuOpen = true;
            this.ui.showLoadScreen(saves);
          },
          () => {
            // No — go back to pause
            this.confirmOpen = false;
            this.ui.hideConfirm();
            this.ui.showPause(true);
          },
        );
        this.playTone(500, 0.08);
        return;
      }

      this.loadMenuOpen = true;
      if (fromPause) this.ui.showPause(false);
      this.ui.showLoadScreen(saves);
    }
    this.playTone(500, 0.08);
  }

  saveGameToSlot(slot) {
    const ss = this.scenes[GameState.SOLAR_SYSTEM];
    const ship = ss.ship;
    this.storage.saveGame(slot, {
      name: `Slot ${slot}`,
      score: this.score,
      visited: [...this.visited],
      crystalsCollected: this.crystalsCollected,
      quizStreak: this.quizStreak,
      shipPosition: { x: ship.position.x, y: ship.position.y, z: ship.position.z },
      shipRotation: {
        x: ship.group.quaternion.x, y: ship.group.quaternion.y,
        z: ship.group.quaternion.z, w: ship.group.quaternion.w,
      },
      achievements: this.storage.getAchievements(),
      missions: this.missions.getState(),
    });
    this._hasSaved = true;
    this.saveMenuOpen = false;
    this.ui.hideSaveScreen();
    this.ui.showPause(true);
    this.ui.showScorePopup(0, 'Game Saved!');
    this.playMelody([[660, 0.1], [880, 0.15]]);
  }

  loadGameFromSlot(slot) {
    const save = this.storage.loadGame(slot);
    if (!save) return;

    this.initAudio();
    this.loadMenuOpen = false;
    this.paused = false;
    this._hasSaved = true; // loaded game counts as "saved"
    this.ui.hideLoadScreen();
    this.ui.showPause(false);

    // Restore state
    this.score = save.score;
    this.visited = new Set(save.visited || []);
    this.crystalsCollected = save.crystalsCollected || 0;
    this.quizStreak = save.quizStreak || 0;

    // Restore achievements
    if (save.achievements) {
      for (const [id, ts] of Object.entries(save.achievements)) {
        this.storage.unlockAchievement(id);
      }
    }

    // Restore missions
    this.missions.loadState(save.missions);

    // Enter solar system
    this.setState(GameState.SOLAR_SYSTEM);

    // Restore ship position
    const ss = this.scenes[GameState.SOLAR_SYSTEM];
    if (save.shipPosition) {
      ss.ship.group.position.set(save.shipPosition.x, save.shipPosition.y, save.shipPosition.z);
    }
    if (save.shipRotation) {
      ss.ship.group.quaternion.set(
        save.shipRotation.x, save.shipRotation.y,
        save.shipRotation.z, save.shipRotation.w,
      );
    }

    this.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
  }

  start() {
    this.ui.showMenu();
    this.loop();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Photo mode toggle (P key) — works in solar system or orbit
    if (this.input.wasPressed('KeyP') && !this.paused && !this.journalOpen && !this.missionOpen && !this.galleryOpen) {
      if (this.photoModeOpen) {
        this.exitPhotoMode();
      } else if (this.state === GameState.SOLAR_SYSTEM || this.state === GameState.ORBIT) {
        this.enterPhotoMode();
      }
    }

    // Gallery toggle (G key) — works in solar system or while paused
    if (this.input.wasPressed('KeyG') && !this.journalOpen && !this.missionOpen && !this.photoModeOpen && !this.saveMenuOpen && !this.loadMenuOpen && !this.confirmOpen) {
      if (this.galleryOpen || this.state === GameState.SOLAR_SYSTEM || this.paused) {
        this.toggleGallery();
      }
    }

    // Journal toggle (J key) — works in solar system or while paused
    if (this.input.wasPressed('KeyJ') && !this.missionOpen && !this.photoModeOpen && !this.galleryOpen) {
      if (this.journalOpen || this.state === GameState.SOLAR_SYSTEM || this.paused) {
        this.toggleJournal();
      }
    }

    // Mission board toggle (M key) — works in solar system or while paused
    if (this.input.wasPressed('KeyM') && !this.journalOpen && !this.photoModeOpen && !this.galleryOpen && !this.saveMenuOpen && !this.loadMenuOpen && !this.confirmOpen) {
      if (this.missionOpen || this.state === GameState.SOLAR_SYSTEM || this.paused) {
        this.toggleMissionBoard();
      }
    }

    // Save menu (S key while paused in solar system)
    if (this.input.wasPressed('KeyS') && !this.journalOpen && !this.missionOpen && !this.photoModeOpen && !this.galleryOpen) {
      if (this.saveMenuOpen || (this.paused && this.state === GameState.SOLAR_SYSTEM)) {
        this.toggleSaveMenu();
      }
    }

    // Load menu (L key — from menu or while paused)
    if (this.input.wasPressed('KeyL') && !this.loadMenuOpen && !this.journalOpen && !this.missionOpen && !this.photoModeOpen && !this.galleryOpen && !this.saveMenuOpen && !this.confirmOpen) {
      if (this.state === GameState.MENU || (this.paused && this.state === GameState.SOLAR_SYSTEM)) {
        this.toggleLoadMenu();
        this.input.resetFrame();
        return;
      }
    }

    // Handle confirm dialog input
    if (this.confirmOpen) {
      this.ui.handleConfirmInput(this.input);
      if (this.input.wasPressed('Escape')) {
        this.confirmOpen = false;
        this.ui.hideConfirm();
        if (this.paused) this.ui.showPause(true);
      }
      this.input.resetFrame();
      const activeScene = this.scenes[this.state];
      if (activeScene && activeScene.scene && activeScene.camera) {
        this.renderer.render(activeScene.scene, activeScene.camera);
      }
      return;
    }

    // Handle save/load menu navigation
    if (this.saveMenuOpen) {
      this.ui.handleSaveLoadInput(this.input, 'save', (slot) => this.saveGameToSlot(slot));
      if (this.input.wasPressed('Escape')) {
        this.toggleSaveMenu();
      }
      this.input.resetFrame();
      // Still render
      const activeScene = this.scenes[this.state];
      if (activeScene && activeScene.scene && activeScene.camera) {
        this.renderer.render(activeScene.scene, activeScene.camera);
      }
      return;
    }

    if (this.loadMenuOpen) {
      this.ui.handleSaveLoadInput(this.input, 'load', (slot) => this.loadGameFromSlot(slot));
      if (this.input.wasPressed('Escape')) {
        this.toggleLoadMenu();
      }
      this.input.resetFrame();
      const ss = this.scenes[GameState.SOLAR_SYSTEM];
      if (ss.scene && ss.camera) {
        this.renderer.render(ss.scene, ss.camera);
      }
      return;
    }

    // If journal is open, consume input but don't update game
    if (this.journalOpen) {
      if (this.input.wasPressed('Escape')) {
        this.toggleJournal();
      }
      this.input.resetFrame();
      const activeScene = this.scenes[this.state];
      if (activeScene && activeScene.scene && activeScene.camera) {
        this.renderer.render(activeScene.scene, activeScene.camera);
      }
      return;
    }

    // If mission board is open, consume input but don't update game
    if (this.missionOpen) {
      if (this.input.wasPressed('Escape')) {
        this.toggleMissionBoard();
      }
      this.input.resetFrame();
      const activeScene = this.scenes[this.state];
      if (activeScene && activeScene.scene && activeScene.camera) {
        this.renderer.render(activeScene.scene, activeScene.camera);
      }
      return;
    }

    // If photo mode is active, handle camera orbit and snap
    if (this.photoModeOpen) {
      const activeScene = this.scenes[this.state];
      const camera = activeScene.camera;

      // Arrow keys orbit camera around target
      if (this.input.isDown('ArrowLeft')) this._photoOrbitAngle -= dt * 1.5;
      if (this.input.isDown('ArrowRight')) this._photoOrbitAngle += dt * 1.5;
      if (this.input.isDown('ArrowUp')) this._photoOrbitElevation = Math.min(1.2, this._photoOrbitElevation + dt);
      if (this.input.isDown('ArrowDown')) this._photoOrbitElevation = Math.max(-0.5, this._photoOrbitElevation - dt);

      const r = this._photoOrbitRadius;
      const cosElev = Math.cos(this._photoOrbitElevation);
      camera.position.x = this._photoTarget.x + Math.sin(this._photoOrbitAngle) * r * cosElev;
      camera.position.z = this._photoTarget.z + Math.cos(this._photoOrbitAngle) * r * cosElev;
      camera.position.y = this._photoTarget.y + Math.sin(this._photoOrbitElevation) * r;
      camera.lookAt(this._photoTarget);

      // Snap photo on Enter/Space
      if (this.input.enter) {
        this.snapPhoto();
      }

      // Exit on Escape
      if (this.input.wasPressed('Escape')) {
        this.exitPhotoMode();
      }

      this.renderer.render(activeScene.scene, camera);
      this.input.resetFrame();
      return;
    }

    // If gallery is open, handle navigation
    if (this.galleryOpen) {
      const result = this.ui.handleGalleryInput(this.input);
      if (result) {
        if (result.action === 'download') {
          const item = result.item;
          const filename = item.galleryType === 'postcard'
            ? `postcard-${item.planet || 'space'}.jpg`
            : `space-photo-${item.planet || 'space'}.jpg`;
          this.photos.downloadImage(item.dataUrl, filename);
          this.playTone(600, 0.08);
        } else if (result.action === 'delete') {
          const item = result.item;
          if (item.galleryType === 'postcard') {
            this.photos.deletePostcard(item.index);
          } else {
            this.photos.deletePhoto(item.index);
          }
          // Refresh gallery
          this.ui.showGallery(this.photos.getGallery());
          this.playTone(300, 0.1);
        }
      }
      if (this.input.wasPressed('Escape')) {
        this.toggleGallery();
      }
      this.input.resetFrame();
      const activeScene = this.scenes[this.state];
      if (activeScene && activeScene.scene && activeScene.camera) {
        this.renderer.render(activeScene.scene, activeScene.camera);
      }
      return;
    }

    // Check for pause toggle (Esc)
    if (this.input.wasPressed('Escape')) {
      this.togglePause();
    }

    // TTS toggle (T key while paused)
    if (this.input.wasPressed('KeyT') && this.paused && !this.journalOpen && !this.missionOpen && !this.photoModeOpen && !this.galleryOpen && !this.saveMenuOpen && !this.loadMenuOpen && !this.confirmOpen) {
      const enabled = this.tts.toggle();
      this.ui.updateTTSStatus(enabled);
      this.playTone(enabled ? 800 : 400, 0.1);
    }

    if (this.paused) {
      // Still render the current scene, just don't update
      const activeScene = this.scenes[this.state];
      if (activeScene && activeScene.scene && activeScene.camera) {
        this.renderer.render(activeScene.scene, activeScene.camera);
      }
      this.input.resetFrame();
      return;
    }

    if (this.state === GameState.MENU) {
      // Render starfield from solar system scene
      const ss = this.scenes[GameState.SOLAR_SYSTEM];
      if (ss.scene && ss.camera) {
        ss.camera.rotation.y += dt * 0.05;
        this.renderer.render(ss.scene, ss.camera);
      }
      // Start game on any key EXCEPT L (reserved for Load) and Escape
      if (this.input.anyKeyPressed() && !this.input.wasPressed('KeyL') && !this.input.wasPressed('Escape')) {
        this.initAudio();
        this.playMelody([[523, 0.15], [659, 0.15], [784, 0.2]]);
        this.setState(GameState.SOLAR_SYSTEM);
      }
    } else {
      const activeScene = this.scenes[this.state];
      if (activeScene) {
        activeScene.update(dt);
        if (activeScene.scene && activeScene.camera) {
          this.renderer.render(activeScene.scene, activeScene.camera);
        }
      }

      // Fun fact system
      this._updateFunFacts(dt);
    }

    this.input.resetFrame();
  }
}
