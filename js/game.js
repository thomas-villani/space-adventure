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
import { TTSManager } from './systems/TTSManager.js';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from './data/achievements.js';
import { DESTINATIONS, REQUIRED_DESTINATIONS } from './data/solarSystem.js';
import { FUN_FACTS } from './data/funFacts.js';

export const GameState = {
  MENU: 'MENU',
  SOLAR_SYSTEM: 'SOLAR_SYSTEM',
  ASTEROID: 'ASTEROID',
  ORBIT: 'ORBIT',
  LANDING: 'LANDING',
  VICTORY: 'VICTORY',
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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

    // Journal/save overlay state
    this.journalOpen = false;
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
    setTimeout(() => { this._funFactActive = false; }, 9000);
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
    if (this.journalOpen || this.saveMenuOpen || this.loadMenuOpen || this.confirmOpen) return;

    this.paused = !this.paused;
    this.ui.showPause(this.paused);

    if (!this.paused) {
      // Reset clock so we don't get a huge dt spike after unpausing
      this.clock.getDelta();
    }
    this.playTone(this.paused ? 400 : 600, 0.1);
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

    // Journal toggle (J key) — works in solar system or while paused
    if (this.input.wasPressed('KeyJ')) {
      if (this.journalOpen || this.state === GameState.SOLAR_SYSTEM || this.paused) {
        this.toggleJournal();
      }
    }

    // Save menu (S key while paused in solar system)
    if (this.input.wasPressed('KeyS') && !this.journalOpen) {
      if (this.saveMenuOpen || (this.paused && this.state === GameState.SOLAR_SYSTEM)) {
        this.toggleSaveMenu();
      }
    }

    // Load menu (L key — from menu or while paused)
    if (this.input.wasPressed('KeyL') && !this.loadMenuOpen && !this.journalOpen && !this.saveMenuOpen && !this.confirmOpen) {
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

    // Check for pause toggle (Esc)
    if (this.input.wasPressed('Escape')) {
      this.togglePause();
    }

    // TTS toggle (T key while paused)
    if (this.input.wasPressed('KeyT') && this.paused && !this.journalOpen && !this.saveMenuOpen && !this.loadMenuOpen && !this.confirmOpen) {
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
      // Dismiss fun fact on any key press
      if (this._funFactActive && this.input.anyKeyPressed()) {
        this.dismissFunFact();
      }
    }

    this.input.resetFrame();
  }
}
