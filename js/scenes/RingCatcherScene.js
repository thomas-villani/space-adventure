import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

export class RingCatcherScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 0, 20);
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
    this.timer = 0;
    this.duration = 30;
    this.spawnTimer = 0;
    this.caught = 0;
    this.rings = [];
    this.done = false;

    // Clean up old objects
    if (this._planet) { this.scene.remove(this._planet); this._planet = null; }
    for (const r of (this._oldRings || [])) this.scene.remove(r.group);
    this._oldRings = [];

    // Backdrop planet (Saturn-like sphere)
    const planetGeo = new THREE.SphereGeometry(3, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: this.planetData?.color || 0xEEDD88,
      roughness: 0.6,
    });
    this._planet = new THREE.Mesh(planetGeo, planetMat);
    this._planet.position.set(0, 0, -10);
    this.scene.add(this._planet);

    // Catcher — a glowing ring the player controls
    if (this._catcher) this.scene.remove(this._catcher);
    const catcherGeo = new THREE.TorusGeometry(1.2, 0.15, 8, 24);
    const catcherMat = new THREE.MeshBasicMaterial({
      color: 0x00FFAA,
      transparent: true,
      opacity: 0.8,
    });
    this._catcher = new THREE.Mesh(catcherGeo, catcherMat);
    this._catcher.position.set(0, 0, 2);
    this.scene.add(this._catcher);

    this.game.ui.showMiniGameHUD('Ring Catcher!');
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak('Catch the rings!');
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
    for (const r of this.rings) this.scene.remove(r.group);
    this._oldRings = this.rings;
    this.rings = [];
  }

  update(dt) {
    this.timer += dt;
    const progress = Math.min(this.timer / this.duration, 1);
    this.game.ui.updateMiniGameProgress(progress);

    // Rotate backdrop
    if (this._planet) this._planet.rotation.y += dt * 0.2;

    // Move catcher with arrow keys
    const speed = 14;
    const { input } = this.game;
    if (input.left) this._catcher.position.x -= speed * dt;
    if (input.right) this._catcher.position.x += speed * dt;
    if (input.up) this._catcher.position.y += speed * dt;
    if (input.down) this._catcher.position.y -= speed * dt;
    this._catcher.position.x = THREE.MathUtils.clamp(this._catcher.position.x, -8, 8);
    this._catcher.position.y = THREE.MathUtils.clamp(this._catcher.position.y, -5, 5);

    // Spin catcher ring
    this._catcher.rotation.z += dt * 2;

    // Spawn rings
    this.spawnTimer += dt;
    const interval = 1.8 + Math.random() * 0.8;
    if (this.spawnTimer > interval && this.timer < this.duration - 2) {
      this.spawnTimer = 0;
      this._spawnRing();
    }

    // Update rings
    for (const ring of this.rings) {
      if (ring.caught) continue;
      ring.group.position.addScaledVector(ring.velocity, dt);
      ring.group.rotation.x += dt * ring.spin;
      ring.group.rotation.y += dt * ring.spin * 0.7;

      // Check catch
      const dist = this._catcher.position.distanceTo(ring.group.position);
      if (dist < 3) {
        ring.caught = true;
        ring.group.visible = false;
        this.caught++;
        this.game.addScore(3);
        this.game.ui.showScorePopup(3, 'Ring caught!');
        this.game.particles.sparkle(ring.group.position.clone(), ring.color);
        this.game.playTone(800 + this.caught * 80, 0.1, 'sine', 0.08);
      }

      // Remove if off screen
      if (ring.group.position.z > 25 || Math.abs(ring.group.position.x) > 15) {
        ring.caught = true;
        ring.group.visible = false;
      }
    }

    // Done
    if (this.timer >= this.duration && !this.done) {
      this.done = true;
      const msg = this.caught >= 5 ? 'Amazing catch!' : 'Great effort!';
      this.game.ui.showScorePopup(0, msg);
      this.game.tts.speak(msg);
      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      setTimeout(() => {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }, 1500);
    }
  }

  _spawnRing() {
    const colors = [0xFF4488, 0x44AAFF, 0xFFDD00, 0x44FF88, 0xFF8844, 0xAA44FF];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const group = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.8 + Math.random() * 0.4, 0.12, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.6,
      roughness: 0.3,
    });
    group.add(new THREE.Mesh(ringGeo, ringMat));

    // Spawn from edges, heading toward center-ish
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = -12; y = (Math.random() - 0.5) * 10; }
    else if (side === 1) { x = 12; y = (Math.random() - 0.5) * 10; }
    else if (side === 2) { x = (Math.random() - 0.5) * 20; y = 8; }
    else { x = (Math.random() - 0.5) * 20; y = -8; }

    group.position.set(x, y, -5 + Math.random() * 5);

    // Velocity toward center with some randomness
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 3,
      15,
    );
    const velocity = target.sub(group.position).normalize().multiplyScalar(2.5 + Math.random() * 2);

    this.scene.add(group);
    this.rings.push({
      group,
      velocity,
      color,
      spin: 1 + Math.random() * 2,
      caught: false,
    });
  }
}
