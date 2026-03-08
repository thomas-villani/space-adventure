import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

export class VictoryScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
    this.fireworks = [];
    this.fireworkTimer = 0;
    this.phase = 'badges'; // 'badges' | 'highscore_entry' | 'highscore_table' | 'done'
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);

    // Starfield
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 100;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starTex = LandingScene._starTexture();
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.5, map: starTex, transparent: true, depthWrite: false,
    })));

    this.scene.add(new THREE.AmbientLight(0x222233, 0.5));

    this._initialized = true;
  }

  enter() {
    this.fireworks = [];
    this.fireworkTimer = 0;
    this.phase = 'badges';
    this._readyForInput = false;

    this.game.ui.showVictory(this.game.score);
    this.game.tts.speak('You did it! You explored the whole Solar System!');

    // Show badge grid
    this.game.ui.showBadgeGrid(this.game.storage.getAchievements());

    this.game.playMelody([
      [523, 0.15], [587, 0.15], [659, 0.15], [784, 0.15],
      [988, 0.15], [1175, 0.3],
    ]);

    // After a short delay, start high score flow
    setTimeout(() => {
      this._startHighScoreFlow();
    }, 1500);
  }

  _startHighScoreFlow() {
    const score = this.game.score;
    if (this.game.storage.isHighScore(score)) {
      this.phase = 'highscore_entry';
      this.game.ui.showHighScoreEntry((name) => {
        const scores = this.game.storage.addHighScore(name, score);
        this.phase = 'highscore_table';
        this.game.ui.showHighScoreTable(scores, score);
        setTimeout(() => {
          this.phase = 'done';
          this._readyForInput = false;
          this.game.ui.showVictoryPrompt();
          // Small delay before accepting input to prevent accidental restart
          setTimeout(() => { this._readyForInput = true; }, 500);
        }, 1000);
      });
    } else {
      // No high score — just show the table
      const scores = this.game.storage.getHighScores();
      if (scores.length > 0) {
        this.game.ui.showHighScoreTable(scores, -1);
      }
      this.phase = 'done';
      this.game.ui.showVictoryPrompt();
      setTimeout(() => { this._readyForInput = true; }, 500);
    }
  }

  exit() {
    // Clean up firework meshes
    for (const fw of this.fireworks) {
      for (const p of fw.particles) {
        this.scene.remove(p.mesh);
      }
    }
    this.fireworks = [];
    this.game.ui.hideHighScoreEntry();
  }

  update(dt) {
    // Spawn fireworks
    this.fireworkTimer += dt;
    if (this.fireworkTimer > 0.5) {
      this.fireworkTimer = 0;
      this.spawnFirework();
    }

    // Update fireworks
    for (const fw of this.fireworks) {
      for (const p of fw.particles) {
        p.velocity.y -= 5 * dt; // gravity
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.life -= dt;
        p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
        p.mesh.scale.setScalar(p.life / p.maxLife);
      }
    }

    // Clean up dead fireworks
    this.fireworks = this.fireworks.filter(fw => {
      if (fw.particles[0].life <= 0) {
        for (const p of fw.particles) {
          this.scene.remove(p.mesh);
        }
        return false;
      }
      return true;
    });

    // Restart on any key (only when done with high score flow)
    if (this.phase === 'done' && this._readyForInput && this.game.input.anyKeyPressed()) {
      // Reset game fully
      this.game.score = 0;
      this.game.visited.clear();
      this.game.currentPlanet = null;
      this.game.quizStreak = 0;
      this.game.crystalsCollected = 0;
      this.game.asteroidsDestroyedThisRun = 0;
      this.game.wasHitThisRun = false;
      this.game._hasSaved = false;
      this.game.storage.clearJournal();
      this.game.setState(GameState.SOLAR_SYSTEM);
    }
  }

  spawnFirework() {
    const colors = [0xFF0044, 0x00FF88, 0xFFDD00, 0x4488FF, 0xFF8800, 0xFF00FF];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const center = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    );

    const particleCount = 20;
    const fw = { particles: [] };

    for (let i = 0; i < particleCount; i++) {
      const geo = new THREE.SphereGeometry(0.15, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
      );

      fw.particles.push({ mesh, velocity, life: 1.5, maxLife: 1.5 });
      this.scene.add(mesh);
    }

    this.fireworks.push(fw);
    this.game.playTone(800 + Math.random() * 400, 0.15, 'sine', 0.04);
  }
}
