import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

const SKINS = {
  enceladus: {
    title: 'Geyser Ride!',
    geyserColor: 0x88DDFF,
    crystalColors: [0x00FFFF, 0xFF88FF, 0xFFD700, 0x44FF44],
    speak: 'Ride the geyser up! Steer left and right to collect crystals!',
    intro: 'Ride the geyser! Steer with arrow keys!',
    cliff: false,
  },
  miranda: {
    title: 'Cliff Ride!',
    geyserColor: 0xAABBCC,
    crystalColors: [0xFF4488, 0x44AAFF, 0xFFDD00, 0x44FF88],
    speak: 'Fly up Miranda\'s giant cliff! Steer left and right to collect crystals!',
    intro: 'Fly up the cliff! Steer with arrow keys!',
    cliff: true,
  },
};

const DEFAULT_SKIN = SKINS.enceladus;

export class GeyserRideScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 10, 16);
    this.camera.lookAt(0, 10, 0);

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
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 1.2);
    dirLight.position.set(5, 15, 5);
    this.scene.add(dirLight);

    this._initialized = true;
  }

  enter(data) {
    this.planetData = data?.planet;
    this.skin = SKINS[this.planetData?.id] || DEFAULT_SKIN;
    this.timer = 0;
    this.duration = 30;
    this.collected = 0;
    this.done = false;
    this.height = 0;
    this.riseSpeed = 8;
    this.readyDelay = 2.0;

    // Clean up old objects
    for (const c of (this._oldCrystals || [])) this.scene.remove(c.mesh);
    if (this._geyserParticles) this.scene.remove(this._geyserParticles);
    if (this._cliffGroup) { this.scene.remove(this._cliffGroup); this._cliffGroup = null; }
    this._oldCrystals = [];

    // Ship
    const sc = this.game.getShipColors();
    if (this._ship) this.scene.remove(this._ship);
    this._ship = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.5, 1.8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: sc.body, metalness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this._ship.add(body);
    const wingGeo = new THREE.BoxGeometry(2.2, 0.08, 0.7);
    const wingMat = new THREE.MeshStandardMaterial({ color: sc.wings });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.y = -0.3;
    this._ship.add(wings);
    this._ship.position.set(0, 0, 0);
    this._shipX = 0;
    this.scene.add(this._ship);

    // Geyser particle trail below ship
    this._createGeyserParticles();

    // Spawn crystals along the path
    this._crystals = [];
    const totalHeight = this.riseSpeed * this.duration;
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = 3 + Math.random() * (totalHeight - 5);
      const colorArr = this.skin.crystalColors;
      const color = colorArr[Math.floor(Math.random() * colorArr.length)];
      const geo = new THREE.OctahedronGeometry(0.5, 0);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      this.scene.add(mesh);
      this._crystals.push({ mesh, color, collected: false, baseX: x });
    }

    // Cliff wall for Miranda
    if (this.skin.cliff) {
      const totalHeight = this.riseSpeed * this.duration;
      this._cliffGroup = new THREE.Group();
      // Main cliff face
      const cliffGeo = new THREE.BoxGeometry(5, totalHeight + 30, 3);
      const cliffMat = new THREE.MeshStandardMaterial({ color: 0x776655, roughness: 0.9 });
      const cliff = new THREE.Mesh(cliffGeo, cliffMat);
      cliff.position.set(-10.5, totalHeight / 2, -1);
      this._cliffGroup.add(cliff);
      // Rocky ledges for visual interest
      for (let i = 0; i < 20; i++) {
        const ledgeGeo = new THREE.BoxGeometry(1.5 + Math.random() * 2, 0.6 + Math.random() * 0.8, 1.5 + Math.random() * 2);
        const shade = 0.35 + Math.random() * 0.15;
        const ledgeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(shade, shade * 0.9, shade * 0.75),
          roughness: 1.0,
        });
        const ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
        ledge.position.set(-8 - Math.random() * 1.5, (i / 20) * totalHeight + Math.random() * 10, -0.5 + Math.random());
        this._cliffGroup.add(ledge);
      }
      this.scene.add(this._cliffGroup);
    }

    this.game.ui.showMiniGameHUD(this.skin.title);
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak(this.skin.speak);
    this.game.ui.showScorePopup(0, this.skin.intro);
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
    for (const c of this._crystals) this.scene.remove(c.mesh);
    this._oldCrystals = this._crystals;
    this._crystals = [];
    if (this._cliffGroup) { this.scene.remove(this._cliffGroup); this._cliffGroup = null; }
  }

  update(dt) {
    // Intro phase — show instructions before gameplay starts
    if (this.readyDelay > 0) {
      this.readyDelay -= dt;
      return;
    }

    this.timer += dt;
    const progress = Math.min(this.timer / this.duration, 1);
    this.game.ui.updateMiniGameProgress(progress);

    // Auto-rise
    this.height += this.riseSpeed * dt;

    // Ship horizontal control (analog on touch)
    const moveSpeed = 12;
    const { input } = this.game;
    const sx = input.steerX;
    this._shipX += sx * moveSpeed * dt;
    this._shipX = THREE.MathUtils.clamp(this._shipX, -7, 7);

    // Tilt ship based on movement
    const tilt = -sx * 0.3;
    this._ship.rotation.z += (tilt - this._ship.rotation.z) * 5 * dt;

    this._ship.position.set(this._shipX, this.height, 0);

    // Camera follows ship height
    this.camera.position.y += (this.height + 4 - this.camera.position.y) * 3 * dt;
    this.camera.lookAt(0, this.camera.position.y - 2, 0);

    // Update geyser particles
    this._updateGeyserParticles(dt);

    // Check crystal collection
    for (const crystal of this._crystals) {
      if (crystal.collected) continue;
      crystal.mesh.rotation.y += dt * 2;
      // Gentle horizontal bob
      crystal.mesh.position.x = crystal.baseX + Math.sin(this.timer * 1.5 + crystal.baseX) * 0.5;

      const dist = this._ship.position.distanceTo(crystal.mesh.position);
      if (dist < 2) {
        crystal.collected = true;
        crystal.mesh.visible = false;
        this.collected++;
        this.game.addScore(2);
        this.game.ui.showScorePopup(2, 'Crystal!');
        this.game.particles.sparkle(crystal.mesh.position.clone(), crystal.color);
        this.game.playTone(700 + this.collected * 50, 0.08, 'sine', 0.06);
      }
    }

    // Done
    if (this.timer >= this.duration && !this.done) {
      this.done = true;
      const totalPoints = this.collected * 2;
      const msg = this.collected >= 12 ? 'Amazing ride!' : 'Great flying!';
      this.game.ui.showScorePopup(totalPoints, msg);
      this.game.tts.speak(msg);
      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      setTimeout(() => {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }, 1500);
    }
  }

  _createGeyserParticles() {
    const count = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = -Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = -3 - Math.random() * 4;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geyserVelocities = velocities;
    this._geyserPositions = positions;
    this._geyserCount = count;

    const mat = new THREE.PointsMaterial({
      color: this.skin.geyserColor,
      size: 0.3,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this._geyserParticles = new THREE.Points(geo, mat);
    this.scene.add(this._geyserParticles);
  }

  _updateGeyserParticles(dt) {
    if (!this._geyserParticles) return;
    // Keep particles relative to ship
    this._geyserParticles.position.set(this._shipX, this.height, 0);

    const pos = this._geyserPositions;
    const vel = this._geyserVelocities;
    for (let i = 0; i < this._geyserCount; i++) {
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;

      // Reset particles that fall too far
      if (pos[i * 3 + 1] < -10) {
        pos[i * 3] = (Math.random() - 0.5) * 1.5;
        pos[i * 3 + 1] = -0.5;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      }
    }
    this._geyserParticles.geometry.attributes.position.needsUpdate = true;
  }
}
