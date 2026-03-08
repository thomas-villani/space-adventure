import * as THREE from 'three';
import { Planet } from '../entities/Planet.js';
import { LandingScene } from './LandingScene.js';
import { DESTINATION_MAP } from '../data/solarSystem.js';
import { GameState } from '../game.js';

export class OrbitScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
    this.planet = null;
    this.planetData = null;
    this.timer = 0;
    this.phase = 'approach'; // 'approach' | 'orbit'
    this.canSkip = false;
    this.orbitAngle = 0;
  }

  init() {
    this.scene = new THREE.Scene();
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
    const starTex = LandingScene._starTexture();
    this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 0.5, map: starTex, transparent: true, depthWrite: false,
    })));

    // Lights
    this.scene.add(new THREE.AmbientLight(0x4466AA, 0.8));
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 1.2);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    this._initialized = true;
  }

  enter(data) {
    this.planetData = data?.planet;
    this.timer = 0;
    this.phase = 'approach';
    this.canSkip = false;
    this.orbitAngle = 0;
    this._autoCaptured = false;
    this.game._lastOrbitPhoto = null;

    // Remove old planet and parent
    if (this.planet) {
      this.scene.remove(this.planet.group);
    }
    if (this._parentPlanet) {
      this.scene.remove(this._parentPlanet.group);
      this._parentPlanet = null;
    }

    if (this.planetData) {
      this.planet = new Planet(this.planetData);
      // Scale up impressively
      const scale = Math.max(3, this.planetData.size * 0.8);
      this.planet.group.scale.setScalar(scale);
      this.scene.add(this.planet.group);

      // Calculate safe camera distance based on visual size
      const visualRadius = this.planetData.size * scale;
      this._safeDistance = visualRadius + 6;

      // If moon, show parent planet in the background
      if (this.planetData.parent && DESTINATION_MAP[this.planetData.parent]) {
        const parentData = DESTINATION_MAP[this.planetData.parent];
        this._parentPlanet = new Planet(parentData);
        const pScale = parentData.size * 2;
        this._parentPlanet.group.scale.setScalar(pScale);
        this._parentPlanet.group.position.set(-40, 10, -80);
        this.scene.add(this._parentPlanet.group);
      }

      // Show orbit name UI and read aloud
      this.game.ui.showOrbitName(this.planetData.name);
      this.game.tts.speak(`You're visiting ${this.planetData.name}!`);
    } else {
      this._safeDistance = 15;
    }

    // Camera start far away — scale with planet size
    const startZ = Math.max(40, this._safeDistance * 1.8);
    this.camera.position.set(0, 5, startZ);
    this.camera.lookAt(0, 0, 0);

    // Approach melody
    this.game.playMelody([[440, 0.15], [554, 0.15], [659, 0.2]]);
  }

  exit() {
    this.game.ui.hideOrbitName();
  }

  update(dt) {
    this.timer += dt;

    // Rotate planet
    if (this.planet) {
      this.planet.mesh.rotation.y += dt * 0.15;
    }
    if (this._parentPlanet) {
      this._parentPlanet.mesh.rotation.y += dt * 0.08;
    }

    if (this.phase === 'approach') {
      // Zoom in over 2 seconds
      const t = Math.min(1, this.timer / 2);
      const ease = t * (2 - t); // ease-out quadratic
      const startZ = Math.max(40, this._safeDistance * 1.8);
      const endZ = this._safeDistance;
      this.camera.position.z = startZ + (endZ - startZ) * ease;
      this.camera.position.y = 5 + (-1) * ease; // settle from above
      this.camera.lookAt(0, 0, 0);

      if (this.timer >= 2) {
        this.phase = 'orbit';
        this.orbitAngle = 0;
      }
    } else {
      // Orbit phase — slow circle around planet, scaled to planet size
      this.orbitAngle += dt * 0.5;
      const orbitRadius = this._safeDistance;
      this.camera.position.x = Math.sin(this.orbitAngle) * orbitRadius;
      this.camera.position.z = Math.cos(this.orbitAngle) * orbitRadius;
      this.camera.position.y = 2 + Math.sin(this.orbitAngle * 0.7) * 2; // gentle bob
      this.camera.lookAt(0, 0, 0);
    }

    // Auto-capture a photo for postcards at ~3s
    if (!this._autoCaptured && this.timer >= 3 && this.game.photos) {
      this._autoCaptured = true;
      this.game._lastOrbitPhoto = this.game.photos.capture(this.game.renderer, this.scene, this.camera);
    }

    // Show skip hint after 1.5s
    if (!this.canSkip && this.timer >= 1.5) {
      this.canSkip = true;
      this.game.ui.showOrbitSkipHint();
    }

    // Auto-advance after 5s or skip on Enter
    const shouldAdvance = this.timer >= 5 ||
      (this.canSkip && this.game.input.enter);

    if (shouldAdvance) {
      this.game.setState(GameState.LANDING, { planet: this.planetData });
    }
  }
}
