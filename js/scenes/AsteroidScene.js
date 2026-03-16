import * as THREE from 'three';
import { Asteroid } from '../entities/Asteroid.js';
import { Planet } from '../entities/Planet.js';
import { DESTINATION_MAP } from '../data/solarSystem.js';
import { GameState } from '../game.js';

export class AsteroidScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
    this.ship = null;
    this.asteroids = [];
    this.lasers = [];
    this.progress = 0;
    this.duration = 15; // seconds
    this.spawnTimer = 0;
    this.spawnInterval = 0.6;
    this.asteroidSpeed = 40;
    this.laneWidth = 12;
    this.laneHeight = 8;
    this.localScore = 0;
    this.planetData = null;
    this.fireTimer = 0;
    this.fireCooldown = 0.25; // seconds between shots
  }

  init() {
    this.scene = new THREE.Scene();
    // No fog — stars should be clearly visible on the distant shell
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

    // Starfield
    const starCount = 1500;
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
    // Create a circular star texture to avoid square points
    const starCanvas = document.createElement('canvas');
    starCanvas.width = 32;
    starCanvas.height = 32;
    const ctx = starCanvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    const starTexture = new THREE.CanvasTexture(starCanvas);
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.5, map: starTexture, transparent: true, depthWrite: false,
    })));

    // Lights
    this.scene.add(new THREE.AmbientLight(0x334455, 0.6));
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    // Build ship (simplified version for this scene)
    const sc = this.game.getShipColors();
    this.ship = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.6, 2.5, 8);
    this._bodyMat = new THREE.MeshStandardMaterial({ color: sc.body, metalness: 0.5, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, this._bodyMat);
    body.rotation.x = -Math.PI / 2;
    this.ship.add(body);

    const wingGeo = new THREE.BoxGeometry(3, 0.1, 1);
    this._wingMat = new THREE.MeshStandardMaterial({ color: sc.wings });
    const wings = new THREE.Mesh(wingGeo, this._wingMat);
    wings.position.z = 0.5;
    this.ship.add(wings);

    const engineGeo = new THREE.SphereGeometry(0.3, 8, 8);
    this._engineMat = new THREE.MeshStandardMaterial({ color: sc.engine, emissive: sc.engine, emissiveIntensity: 2 });
    this.engineGlow = new THREE.Mesh(engineGeo, this._engineMat);
    this.engineGlow.position.z = 1.3;
    this.ship.add(this.engineGlow);

    this.ship.position.z = 0;
    this.scene.add(this.ship);

    // Camera behind ship
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 0, -10);

    this._initialized = true;
  }

  enter(data) {
    this.planetData = data?.planet;
    this.progress = 0;
    this.spawnTimer = 0;
    this.localScore = 0;
    this.destroyedCount = 0;
    this.wasHit = false;
    this.ship.position.set(0, 0, 0);

    // Update ship colors in case player changed style
    const sc = this.game.getShipColors();
    this._bodyMat.color.setHex(sc.body);
    this._wingMat.color.setHex(sc.wings);
    this._engineMat.color.setHex(sc.engine);
    this._engineMat.emissive.setHex(sc.engine);

    // Clear old asteroids and lasers
    for (const a of this.asteroids) this.scene.remove(a.mesh);
    this.asteroids = [];
    for (const l of this.lasers) this.scene.remove(l.mesh);
    this.lasers = [];
    this.fireTimer = 0.5; // delay so the Enter press that started the scene doesn't fire

    // Remove old backdrop planet and parent
    if (this.backdropPlanet) {
      this.scene.remove(this.backdropPlanet.group);
      this.backdropPlanet = null;
    }
    if (this.backdropParent) {
      this.scene.remove(this.backdropParent.group);
      this.backdropParent = null;
    }

    // Add destination planet in the background
    if (this.planetData) {
      this.backdropPlanet = new Planet(this.planetData);
      const scale = this.planetData.size * 1.5;
      this.backdropPlanet.group.scale.setScalar(scale);
      this.backdropPlanet.group.position.set(15, 5, -120);
      this.scene.add(this.backdropPlanet.group);

      // If destination is a moon, show parent planet as large backdrop
      if (this.planetData.parent && DESTINATION_MAP[this.planetData.parent]) {
        const parentData = DESTINATION_MAP[this.planetData.parent];
        this.backdropParent = new Planet(parentData);
        const parentScale = parentData.size * 3;
        this.backdropParent.group.scale.setScalar(parentScale);
        this.backdropParent.group.position.set(-30, 15, -200);
        this.scene.add(this.backdropParent.group);
      }
    }

    this.game.ui.showAsteroidHUD();
    this.game.ui.updateAsteroidProgress(0);
    this.game.ui.updateAsteroidScore(this.game.score);
  }

  exit() {
    this.game.ui.hideAsteroidHUD();
  }

  update(dt) {
    const { input } = this.game;
    this.progress += dt / this.duration;

    // Rotate backdrop planet and slowly bring it closer as we progress
    if (this.backdropPlanet) {
      this.backdropPlanet.mesh.rotation.y += dt * 0.2;
      // Drift closer: from z=-120 toward z=-60 over the course of the minigame
      this.backdropPlanet.group.position.z = -120 + this.progress * 60;
    }
    // Rotate parent planet backdrop (for moons)
    if (this.backdropParent) {
      this.backdropParent.mesh.rotation.y += dt * 0.1;
    }

    // Ship movement (rail style — no forward movement, just dodge)
    const moveSpeed = 15;
    const sx = input.steerX;
    const sy = input.steerY;
    this.ship.position.x += sx * moveSpeed * dt;
    this.ship.position.y -= sy * moveSpeed * dt;

    // Clamp to lane
    this.ship.position.x = THREE.MathUtils.clamp(this.ship.position.x, -this.laneWidth / 2, this.laneWidth / 2);
    this.ship.position.y = THREE.MathUtils.clamp(this.ship.position.y, -this.laneHeight / 2, this.laneHeight / 2);

    // Bank animation
    const bankTarget = -sx * 0.4;
    this.ship.rotation.z += (bankTarget - this.ship.rotation.z) * 5 * dt;

    // Engine pulse
    this.engineGlow.scale.setScalar(0.8 + Math.sin(Date.now() * 0.01) * 0.2);

    // Firing — Space or Enter to shoot
    this.fireTimer -= dt;
    if ((input.isDown('Space') || input.isDown('Enter')) && this.fireTimer <= 0) {
      this.fireLaser();
      this.fireTimer = this.fireCooldown;
    }

    // Update lasers
    const laserSpeed = 120;
    for (const l of this.lasers) {
      l.mesh.position.z -= laserSpeed * dt;

      // Check laser-asteroid collisions
      for (const a of this.asteroids) {
        if (!a.active) continue;
        const dist = l.mesh.position.distanceTo(a.mesh.position);
        if (dist < a.size + 0.3) {
          a.active = false;
          a.mesh.visible = false;
          l.active = false;
          l.mesh.visible = false;
          this.destroyedCount++;
          this.game.addScore(2);
          this.localScore += 2;
          this.game.ui.updateAsteroidScore(this.game.score);
          this.game.playTone(1200, 0.08, 'square', 0.06);
          break;
        }
      }

      // Remove if too far
      if (l.mesh.position.z < -120) {
        l.active = false;
        l.mesh.visible = false;
      }
    }

    // Clean up inactive lasers
    this.lasers = this.lasers.filter(l => {
      if (!l.active) {
        this.scene.remove(l.mesh);
        return false;
      }
      return true;
    });

    // Spawn asteroids
    this.spawnTimer += dt;
    if (this.spawnTimer > this.spawnInterval && this.progress < 1) {
      this.spawnTimer = 0;
      this.spawnAsteroid();
    }

    // Update asteroids
    for (const a of this.asteroids) {
      if (!a.active) continue;
      a.mesh.position.z += this.asteroidSpeed * dt;
      a.update(dt);

      // Collision check (forgiving — sphere check)
      const dist = a.mesh.position.distanceTo(this.ship.position);
      if (dist < a.size + 0.8) {
        a.active = false;
        a.mesh.visible = false;
        this.wasHit = true;
        this.game.addScore(-1);
        this.localScore = Math.max(0, this.localScore - 1);
        this.game.ui.updateAsteroidScore(this.game.score);
        this.game.ui.flashScreen('hit');
        this.game.playTone(200, 0.3, 'sawtooth', 0.08);
      }

      // Remove if past camera
      if (a.mesh.position.z > 15) {
        a.active = false;
        a.mesh.visible = false;
        // Score for dodging
        this.game.addScore(1);
        this.localScore++;
        this.game.ui.updateAsteroidScore(this.game.score);
      }
    }

    // Clean up inactive
    this.asteroids = this.asteroids.filter(a => {
      if (!a.active) {
        this.scene.remove(a.mesh);
        return false;
      }
      return true;
    });

    // Update UI
    this.game.ui.updateAsteroidProgress(Math.min(this.progress, 1));

    // Done?
    if (this.progress >= 1 && this.asteroids.length === 0) {
      // Track asteroid stats for achievements
      this.game.asteroidsDestroyedThisRun = this.destroyedCount;
      this.game.wasHitThisRun = this.wasHit;
      this.game._justFinishedAsteroid = true;
      this.game.checkAchievements();
      this.game._justFinishedAsteroid = false;

      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      // Route to mini-game if destination has one, otherwise orbit
      if (this.planetData?.miniGame) {
        this.game.setState(GameState.MINI_GAME, { planet: this.planetData });
      } else {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }
    }
  }

  spawnAsteroid() {
    const asteroid = new Asteroid();
    asteroid.mesh.position.set(
      (Math.random() - 0.5) * this.laneWidth,
      (Math.random() - 0.5) * this.laneHeight,
      -80 - Math.random() * 20,
    );
    this.scene.add(asteroid.mesh);
    this.asteroids.push(asteroid);
  }

  fireLaser() {
    const geo = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6);
    geo.rotateX(Math.PI / 2); // point forward along Z
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00FFAA,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this.ship.position);
    mesh.position.z -= 1.5; // spawn in front of ship

    // Add glow light
    const light = new THREE.PointLight(0x00FFAA, 1, 6);
    mesh.add(light);

    this.scene.add(mesh);
    this.lasers.push({ mesh, active: true });

    this.game.playTone(1600, 0.06, 'square', 0.04);
  }
}
