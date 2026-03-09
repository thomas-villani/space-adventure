import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

const SKINS = {
  earth: {
    title: 'Launch Satellite!',
    planetColor: 0x4488FF,
    satelliteColor: 0xCCCCCC,
    speak: 'Launch into orbit!',
  },
  mercury: {
    title: 'Launch Probe!',
    planetColor: 0xAAAAAA,
    satelliteColor: 0xDDCC88,
    speak: 'Launch the probe!',
  },
  venus: {
    title: 'Cloud Probe!',
    planetColor: 0xFFCC66,
    satelliteColor: 0xEEEEDD,
    speak: 'Launch through the clouds!',
  },
  mars: {
    title: 'Launch Rover!',
    planetColor: 0xDD4422,
    satelliteColor: 0xDDCC88,
    speak: 'Launch the rover!',
  },
};

const DEFAULT_SKIN = SKINS.earth;

export class SatelliteLaunchScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 0, 25);
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
    this.launches = 0;
    this.successes = 0;
    this.done = false;

    // Launch phases: 'aiming' → 'powering' → 'flying' → 'result' → 'aiming' ...
    this.phase = 'aiming';
    this.angle = 0;
    this.angleDir = 1;
    this.power = 0;
    this.powerDir = 1;

    // Clean up old satellites
    for (const s of (this._oldSatellites || [])) this.scene.remove(s.mesh);
    this._oldSatellites = [];
    this._satellites = [];

    // Planet at center
    if (this._planet) this.scene.remove(this._planet);
    const planetGeo = new THREE.SphereGeometry(3, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: this.skin.planetColor,
      roughness: 0.5,
    });
    this._planet = new THREE.Mesh(planetGeo, planetMat);
    this.scene.add(this._planet);

    // Orbit ring (visual target)
    if (this._orbitRing) this.scene.remove(this._orbitRing);
    const orbitGeo = new THREE.TorusGeometry(7, 0.05, 8, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x44FF88,
      transparent: true,
      opacity: 0.3,
    });
    this._orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
    this.scene.add(this._orbitRing);

    // Arrow indicator
    if (this._arrow) this.scene.remove(this._arrow);
    this._arrow = new THREE.Group();
    const arrowGeo = new THREE.ConeGeometry(0.3, 1.5, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xFF8844 });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.y = 1;
    this._arrow.add(arrowMesh);
    const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6);
    const shaftMat = new THREE.MeshBasicMaterial({ color: 0xFF8844 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0;
    this._arrow.add(shaft);
    this._arrow.position.set(0, -4.5, 0);
    this.scene.add(this._arrow);

    // Power bar (3D bar in scene)
    if (this._powerBar) this.scene.remove(this._powerBar);
    if (this._powerFill) this.scene.remove(this._powerFill);
    const barGeo = new THREE.BoxGeometry(0.5, 6, 0.2);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
    this._powerBar = new THREE.Mesh(barGeo, barMat);
    this._powerBar.position.set(-10, 0, 0);
    this._powerBar.visible = false;
    this.scene.add(this._powerBar);

    const fillGeo = new THREE.BoxGeometry(0.4, 0.01, 0.3);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x44FF88 });
    this._powerFill = new THREE.Mesh(fillGeo, fillMat);
    this._powerFill.position.set(-10, -3, 0);
    this._powerFill.visible = false;
    this.scene.add(this._powerFill);

    this.game.ui.showMiniGameHUD(this.skin.title);
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak(this.skin.speak);
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
    for (const s of this._satellites) this.scene.remove(s.mesh);
    this._oldSatellites = this._satellites;
    this._satellites = [];
  }

  update(dt) {
    this.timer += dt;
    const progress = Math.min(this.timer / this.duration, 1);
    this.game.ui.updateMiniGameProgress(progress);

    // Rotate planet
    if (this._planet) this._planet.rotation.y += dt * 0.2;

    const { input } = this.game;
    const actionPressed = input.wasPressed('Space') || input.wasPressed('Enter');

    if (this.phase === 'aiming') {
      // Arrow rotates back and forth (slow for kids)
      this.angle += this.angleDir * dt * 1.4;
      if (this.angle > Math.PI * 0.4) { this.angle = Math.PI * 0.4; this.angleDir = -1; }
      if (this.angle < -Math.PI * 0.4) { this.angle = -Math.PI * 0.4; this.angleDir = 1; }
      // Negate so arrow tip visually matches the launch direction
      this._arrow.rotation.z = -this.angle;
      this._arrow.visible = true;
      this._powerBar.visible = false;
      this._powerFill.visible = false;

      if (actionPressed && this.timer < this.duration - 3) {
        this.phase = 'powering';
        this.power = 0;
        this.powerDir = 1;
        this._powerBar.visible = true;
        this._powerFill.visible = true;
        this.game.playTone(500, 0.08, 'sine', 0.05);
      }
    } else if (this.phase === 'powering') {
      // Power bar fills up and down (slow for kids)
      this.power += this.powerDir * dt * 1.0;
      if (this.power > 1) { this.power = 1; this.powerDir = -1; }
      if (this.power < 0) { this.power = 0; this.powerDir = 1; }

      // Update power bar visual
      const fillHeight = this.power * 5.8;
      this._powerFill.scale.y = Math.max(1, fillHeight * 100);
      this._powerFill.position.y = -3 + fillHeight / 2;

      // Color changes from green to yellow to red
      if (this.power < 0.5) {
        this._powerFill.material.color.setHex(0x44FF88);
      } else if (this.power < 0.8) {
        this._powerFill.material.color.setHex(0xFFDD44);
      } else {
        this._powerFill.material.color.setHex(0xFF4444);
      }

      if (actionPressed) {
        this.phase = 'flying';
        this._launchSatellite();
        this._arrow.visible = false;
        this._powerBar.visible = false;
        this._powerFill.visible = false;
        this.game.playMelody([[440, 0.08], [660, 0.08], [880, 0.12]]);
      }
    } else if (this.phase === 'flying') {
      // Animate satellite
      const sat = this._satellites[this._satellites.length - 1];
      if (sat && !sat.done) {
        sat.vel.y -= 2 * dt; // gentle gravity toward planet
        // Sideways pull for orbit
        const toCenter = new THREE.Vector3().sub(sat.mesh.position).normalize();
        sat.vel.add(toCenter.multiplyScalar(3 * dt));
        sat.mesh.position.add(sat.vel.clone().multiplyScalar(dt));
        sat.mesh.rotation.z += dt * 2;
        sat.flightTime += dt;

        const distFromCenter = sat.mesh.position.length();

        // Check orbit success (close to orbit ring radius of 7)
        if (sat.flightTime > 0.5) {
          if (distFromCenter >= 4.5 && distFromCenter <= 10 && sat.flightTime > 0.8) {
            // Good orbit!
            sat.done = true;
            this.successes++;
            this.game.addScore(5);
            this.game.ui.showScorePopup(5, 'Perfect orbit!');
            this.game.particles.sparkle(sat.mesh.position.clone(), 0x44FF88);
            this.game.playTone(1000, 0.15, 'sine', 0.08);
            this._resetToAiming();
          } else if (distFromCenter < 3.2) {
            // Crashed into planet — close attempt
            sat.done = true;
            this.game.addScore(3);
            this.game.ui.showScorePopup(3, 'Close try!');
            this.game.playTone(300, 0.1, 'sine', 0.05);
            this._resetToAiming();
          } else if (distFromCenter > 15 || sat.flightTime > 5) {
            // Flew too far — still get points for launching
            sat.done = true;
            this.game.addScore(2);
            this.game.ui.showScorePopup(2, 'Nice try!');
            this.game.playTone(400, 0.1, 'sine', 0.05);
            this._resetToAiming();
          }
        }
      }
    } else if (this.phase === 'waiting') {
      // Brief pause between launches
      this._waitTimer -= dt;
      if (this._waitTimer <= 0) {
        this.phase = 'aiming';
      }
    }

    // Update all orbiting satellites (visual)
    for (const sat of this._satellites) {
      if (sat.orbiting) {
        sat.orbitAngle += dt * 1.5;
        sat.mesh.position.x = Math.cos(sat.orbitAngle) * 7;
        sat.mesh.position.y = Math.sin(sat.orbitAngle) * 7;
        sat.mesh.rotation.z += dt * 2;
      }
    }

    // Done
    if (this.timer >= this.duration && !this.done) {
      this.done = true;
      const msg = this.successes >= 2 ? 'Launch expert!' : 'Great launches!';
      this.game.ui.showScorePopup(0, msg);
      this.game.tts.speak(msg);
      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      setTimeout(() => {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }, 1500);
    }
  }

  _launchSatellite() {
    const geo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
    const mat = new THREE.MeshStandardMaterial({
      color: this.skin.satelliteColor,
      metalness: 0.6,
      roughness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);

    // Add solar panels
    const panelGeo = new THREE.BoxGeometry(1.2, 0.05, 0.6);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x2244AA });
    const panel1 = new THREE.Mesh(panelGeo, panelMat);
    panel1.position.x = 0.9;
    mesh.add(panel1);
    const panel2 = new THREE.Mesh(panelGeo, panelMat);
    panel2.position.x = -0.9;
    mesh.add(panel2);

    // Launch position — bottom of planet
    mesh.position.set(0, -4.5, 0);

    // Launch velocity based on angle and power
    const speed = 8 + this.power * 6;
    const vel = new THREE.Vector3(
      Math.sin(this.angle) * speed,
      Math.cos(this.angle) * speed,
      0,
    );

    this.scene.add(mesh);
    this.launches++;
    this._satellites.push({
      mesh,
      vel,
      done: false,
      orbiting: false,
      orbitAngle: 0,
      flightTime: 0,
    });
  }

  _resetToAiming() {
    this.phase = 'waiting';
    this._waitTimer = 0.8;

    // If last satellite achieved orbit, make it visually orbit
    const lastSat = this._satellites[this._satellites.length - 1];
    if (lastSat && lastSat.done) {
      const dist = lastSat.mesh.position.length();
      if (dist >= 4.5 && dist <= 10) {
        lastSat.orbiting = true;
        lastSat.orbitAngle = Math.atan2(lastSat.mesh.position.y, lastSat.mesh.position.x);
      }
    }
  }
}
