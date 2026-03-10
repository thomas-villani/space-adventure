import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

export class MoonBounceScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 8, 18);
    this.camera.lookAt(0, 6, 0);

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

    // Ground surface
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
    });
    this._ground = new THREE.Mesh(groundGeo, groundMat);
    this._ground.rotation.x = -Math.PI / 2;
    this._ground.position.y = 0;
    this.scene.add(this._ground);

    this._initialized = true;
  }

  enter(data) {
    this.planetData = data?.planet;
    this.timer = 0;
    this.duration = 30;
    this.collected = 0;
    this.done = false;

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
    this._ship.position.set(0, 1, 0);
    this.scene.add(this._ship);

    // Physics
    this._velY = 8; // initial upward velocity
    this._posX = 0;
    this._gravity = 3; // low gravity!

    // Ground color based on destination
    this._ground.material.color.set(this.planetData?.color || 0x888888);

    // Spawn collectible stars
    this._stars = [];
    for (const s of (this._oldStars || [])) this.scene.remove(s.mesh);
    this._oldStars = [];

    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = 2 + Math.random() * 14;
      const geo = new THREE.OctahedronGeometry(0.4, 0);
      const color = [0xFFD700, 0xFF88FF, 0x00FFAA, 0x44AAFF][Math.floor(Math.random() * 4)];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      this.scene.add(mesh);
      this._stars.push({ mesh, color, collected: false, baseY: y });
    }

    this.game.ui.showMiniGameHUD('Moon Bounce!');
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak('Collect the stars!');
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
    for (const s of this._stars) this.scene.remove(s.mesh);
    this._oldStars = this._stars;
    this._stars = [];
  }

  update(dt) {
    this.timer += dt;
    const progress = Math.min(this.timer / this.duration, 1);
    this.game.ui.updateMiniGameProgress(progress);

    const { input } = this.game;

    // Horizontal movement
    const moveSpeed = 10;
    if (input.left) this._posX -= moveSpeed * dt;
    if (input.right) this._posX += moveSpeed * dt;
    this._posX = THREE.MathUtils.clamp(this._posX, -8, 8);

    // Vertical physics — low gravity bounce
    this._velY -= this._gravity * dt;
    let newY = this._ship.position.y + this._velY * dt;

    // Bounce on ground
    if (newY <= 1) {
      newY = 1;
      this._velY = 7 + Math.random() * 3; // bouncy!
      this.game.playTone(300, 0.08, 'sine', 0.05);
    }

    this._ship.position.set(this._posX, newY, 0);

    // Tilt ship based on movement
    let tilt = 0;
    if (input.left) tilt = 0.3;
    if (input.right) tilt = -0.3;
    this._ship.rotation.z += (tilt - this._ship.rotation.z) * 5 * dt;

    // Camera follows ship height loosely
    this.camera.position.y += (Math.max(8, newY + 4) - this.camera.position.y) * 2 * dt;
    this.camera.lookAt(0, Math.max(6, newY), 0);

    // Animate and check star collection
    for (const star of this._stars) {
      if (star.collected) continue;
      star.mesh.rotation.y += dt * 2;
      star.mesh.rotation.x += dt * 0.5;
      // Bob gently
      star.mesh.position.y = star.baseY + Math.sin(this.timer * 2 + star.baseY) * 0.3;

      const dist = this._ship.position.distanceTo(star.mesh.position);
      if (dist < 1.5) {
        star.collected = true;
        star.mesh.visible = false;
        this.collected++;
        this.game.addScore(2);
        this.game.ui.showScorePopup(2, 'Star collected!');
        this.game.particles.sparkle(star.mesh.position.clone(), star.color);
        this.game.playTone(600 + this.collected * 60, 0.08, 'sine', 0.06);
      }
    }

    // Done
    if (this.timer >= this.duration && !this.done) {
      this.done = true;
      const msg = this.collected >= 8 ? 'Out of this world!' : 'Great bouncing!';
      this.game.ui.showScorePopup(0, msg);
      this.game.tts.speak(msg);
      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      setTimeout(() => {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }, 1500);
    }
  }
}
