import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

// Skin lookup per destination
const SKINS = {
  jupiter: {
    title: 'Storm Surfer!',
    bgColor: 0xDD9955,
    obstacleColor: 0xFFFF44,
    obstacleEmissive: 0xFFFF00,
    obstacleShape: 'bolt',       // lightning bolt
    pickupColor: 0x44FFAA,
    speak: 'Dodge the lightning!',
  },
  io: {
    title: 'Lava Dodger!',
    bgColor: 0xFFFF44,
    obstacleColor: 0xFF4400,
    obstacleEmissive: 0xFF2200,
    obstacleShape: 'blob',       // lava blob
    pickupColor: 0xFFDD00,
    speak: 'Watch out for lava!',
  },
  neptune: {
    title: 'Ice Storm!',
    bgColor: 0x3344DD,
    obstacleColor: 0xAADDFF,
    obstacleEmissive: 0x88BBFF,
    obstacleShape: 'shard',      // ice shard
    pickupColor: 0x00FFFF,
    speak: 'Dodge the ice shards!',
  },
  titan: {
    title: 'Methane Rain!',
    bgColor: 0xDD9944,
    obstacleColor: 0x88AA44,
    obstacleEmissive: 0x668822,
    obstacleShape: 'drop',       // raindrop
    pickupColor: 0xFF88FF,
    speak: 'Dodge the raindrops!',
  },
};

const DEFAULT_SKIN = SKINS.jupiter;

export class StormSurferScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 2, 18);
    this.camera.lookAt(0, 0, 0);

    // Starfield
    const starCount = 1000;
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

    this.scene.add(new THREE.AmbientLight(0x6666AA, 0.8));
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    this._initialized = true;
  }

  enter(data) {
    this.planetData = data?.planet;
    this.skin = SKINS[this.planetData?.id] || DEFAULT_SKIN;
    this.timer = 0;
    this.duration = 30;
    this.dodged = 0;
    this.pickups = 0;
    this.done = false;
    this.spawnTimer = 0;
    this.obstacles = [];
    this.bonuses = [];

    // Clean up old objects
    for (const o of (this._oldObstacles || [])) this.scene.remove(o.mesh);
    for (const b of (this._oldBonuses || [])) this.scene.remove(b.mesh);
    this._oldObstacles = [];
    this._oldBonuses = [];

    // Backdrop planet
    if (this._planet) this.scene.remove(this._planet);
    const planetGeo = new THREE.SphereGeometry(4, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: this.skin.bgColor,
      roughness: 0.6,
    });
    this._planet = new THREE.Mesh(planetGeo, planetMat);
    this._planet.position.set(0, 0, -15);
    this.scene.add(this._planet);

    // Ship
    if (this._ship) this.scene.remove(this._ship);
    this._ship = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.5, 1.8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488FF, metalness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this._ship.add(body);
    const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 0.7);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x3366DD });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.y = -0.3;
    this._ship.add(wings);
    this._ship.position.set(0, 0, 10);
    this.scene.add(this._ship);

    // Flash overlay (for hits)
    this._flashAlpha = 0;

    this.game.ui.showMiniGameHUD(this.skin.title);
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak(this.skin.speak);
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
    for (const o of this.obstacles) this.scene.remove(o.mesh);
    for (const b of this.bonuses) this.scene.remove(b.mesh);
    this._oldObstacles = this.obstacles;
    this._oldBonuses = this.bonuses;
    this.obstacles = [];
    this.bonuses = [];
  }

  update(dt) {
    this.timer += dt;
    const progress = Math.min(this.timer / this.duration, 1);
    this.game.ui.updateMiniGameProgress(progress);

    // Rotate backdrop
    if (this._planet) this._planet.rotation.y += dt * 0.15;

    // Move ship with arrow keys
    const speed = 14;
    const { input } = this.game;
    if (input.left) this._ship.position.x -= speed * dt;
    if (input.right) this._ship.position.x += speed * dt;
    if (input.up) this._ship.position.y += speed * dt;
    if (input.down) this._ship.position.y -= speed * dt;
    this._ship.position.x = THREE.MathUtils.clamp(this._ship.position.x, -8, 8);
    this._ship.position.y = THREE.MathUtils.clamp(this._ship.position.y, -5, 5);

    // Bank ship
    let bank = 0;
    if (input.left) bank = 0.3;
    if (input.right) bank = -0.3;
    this._ship.rotation.z += (bank - this._ship.rotation.z) * 5 * dt;

    // Spawn obstacles
    this.spawnTimer += dt;
    const interval = Math.max(0.5, 1.4 - this.timer * 0.02); // speeds up slightly
    if (this.spawnTimer > interval && this.timer < this.duration - 2) {
      this.spawnTimer = 0;
      this._spawnObstacle();
      // Occasional bonus pickup between waves
      if (Math.random() < 0.25) {
        this._spawnBonus();
      }
    }

    // Update obstacles
    const obstacleSpeed = 12 + this.timer * 0.15;
    for (const obs of this.obstacles) {
      if (obs.done) continue;
      obs.mesh.position.z += obstacleSpeed * dt;
      obs.mesh.rotation.x += dt * obs.spin;
      obs.mesh.rotation.y += dt * obs.spin * 0.6;

      // Check collision with ship
      const dist = this._ship.position.distanceTo(obs.mesh.position);
      if (dist < 1.8 && !obs.hit) {
        obs.hit = true;
        // Flash screen — no score penalty (forgiving)
        this._flashAlpha = 0.6;
        this.game.playTone(200, 0.15, 'square', 0.06);
      }

      // Passed the ship — dodged!
      if (obs.mesh.position.z > 14 && !obs.hit && !obs.scored) {
        obs.scored = true;
        this.dodged++;
        this.game.addScore(1);
      }

      // Remove when off screen
      if (obs.mesh.position.z > 22) {
        obs.done = true;
        obs.mesh.visible = false;
      }
    }

    // Update bonus pickups
    for (const bonus of this.bonuses) {
      if (bonus.done) continue;
      bonus.mesh.position.z += obstacleSpeed * 0.8 * dt;
      bonus.mesh.rotation.y += dt * 3;

      const dist = this._ship.position.distanceTo(bonus.mesh.position);
      if (dist < 2) {
        bonus.done = true;
        bonus.mesh.visible = false;
        this.pickups++;
        this.game.addScore(3);
        this.game.ui.showScorePopup(3, 'Bonus!');
        this.game.particles.sparkle(bonus.mesh.position.clone(), this.skin.pickupColor);
        this.game.playTone(900 + this.pickups * 100, 0.1, 'sine', 0.08);
      }

      if (bonus.mesh.position.z > 22) {
        bonus.done = true;
        bonus.mesh.visible = false;
      }
    }

    // Fade flash
    if (this._flashAlpha > 0) {
      this._flashAlpha -= dt * 2;
      if (this._flashAlpha < 0) this._flashAlpha = 0;
    }

    // Update flash overlay via a screen-covering plane
    this._updateFlash();

    // Done
    if (this.timer >= this.duration && !this.done) {
      this.done = true;
      const msg = this.dodged >= 10 ? 'Storm master!' : 'Great surfing!';
      this.game.ui.showScorePopup(0, msg);
      this.game.tts.speak(msg);
      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      setTimeout(() => {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }, 1500);
    }
  }

  _spawnObstacle() {
    const mesh = this._createObstacleMesh();
    mesh.position.set(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      -20,
    );
    this.scene.add(mesh);
    this.obstacles.push({
      mesh,
      spin: 1 + Math.random() * 2,
      hit: false,
      scored: false,
      done: false,
    });
  }

  _spawnBonus() {
    const geo = new THREE.OctahedronGeometry(0.5, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: this.skin.pickupColor,
      emissive: this.skin.pickupColor,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 6,
      -20,
    );
    this.scene.add(mesh);
    this.bonuses.push({ mesh, done: false });
  }

  _createObstacleMesh() {
    const shape = this.skin.obstacleShape;
    let geo;
    if (shape === 'bolt') {
      // Lightning bolt — elongated octahedron
      geo = new THREE.OctahedronGeometry(0.8, 0);
      geo.scale(0.5, 1.5, 0.5);
    } else if (shape === 'blob') {
      // Lava blob — sphere
      geo = new THREE.SphereGeometry(0.7, 8, 8);
    } else if (shape === 'shard') {
      // Ice shard — elongated tetrahedron
      geo = new THREE.TetrahedronGeometry(0.8, 0);
      geo.scale(0.6, 1.4, 0.6);
    } else {
      // Raindrop — cone
      geo = new THREE.ConeGeometry(0.4, 1.2, 8);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: this.skin.obstacleColor,
      emissive: this.skin.obstacleEmissive,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4,
    });
    return new THREE.Mesh(geo, mat);
  }

  _updateFlash() {
    if (this._flashAlpha > 0.01) {
      if (!this._flashPlane) {
        const geo = new THREE.PlaneGeometry(50, 50);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xFFFFFF,
          transparent: true,
          opacity: 0,
          depthTest: false,
        });
        this._flashPlane = new THREE.Mesh(geo, mat);
        this._flashPlane.position.z = 15;
        this._flashPlane.renderOrder = 999;
        this.scene.add(this._flashPlane);
      }
      this._flashPlane.material.opacity = this._flashAlpha;
      this._flashPlane.visible = true;
    } else if (this._flashPlane) {
      this._flashPlane.visible = false;
    }
  }
}
