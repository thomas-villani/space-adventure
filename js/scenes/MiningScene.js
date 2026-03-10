import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

export class MiningScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 3, 15);
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
    this.mined = 0;
    this.done = false;
    this.fireTimer = 0.5;
    this.fireCooldown = 0.3;
    this.readyDelay = 2.0;

    // Clean up old objects
    for (const r of (this._rocks || [])) this.scene.remove(r.group);
    for (const l of (this._lasers || [])) this.scene.remove(l.mesh);
    for (const c of (this._crystals || [])) this.scene.remove(c.mesh);
    this._rocks = [];
    this._lasers = [];
    this._crystals = [];

    // Ship
    const sc = this.game.getShipColors();
    if (this._ship) this.scene.remove(this._ship);
    this._ship = new THREE.Group();
    const bodyGeo = new THREE.ConeGeometry(0.5, 2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: sc.body, metalness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = -Math.PI / 2;
    this._ship.add(body);
    const wingGeo = new THREE.BoxGeometry(2.5, 0.08, 0.8);
    const wingMat = new THREE.MeshStandardMaterial({ color: sc.wings });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.z = 0.4;
    this._ship.add(wings);
    this._ship.position.set(0, 0, 8);
    this.scene.add(this._ship);

    // Spawn rocks
    for (let i = 0; i < 8; i++) {
      this._spawnRock();
    }

    this.game.ui.showMiniGameHUD('Asteroid Mining!');
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak('Shoot the asteroids to mine crystals! Use arrows to move, Space to fire!');
    this.game.ui.showScorePopup(0, 'Shoot asteroids! Arrows + Space to fire!');
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
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

    const { input } = this.game;

    // Ship movement
    const moveSpeed = 12;
    if (input.left) this._ship.position.x -= moveSpeed * dt;
    if (input.right) this._ship.position.x += moveSpeed * dt;
    if (input.up) this._ship.position.y += moveSpeed * dt;
    if (input.down) this._ship.position.y -= moveSpeed * dt;
    this._ship.position.x = THREE.MathUtils.clamp(this._ship.position.x, -8, 8);
    this._ship.position.y = THREE.MathUtils.clamp(this._ship.position.y, -5, 5);

    // Bank animation
    let bank = 0;
    if (input.left) bank = 0.3;
    if (input.right) bank = -0.3;
    this._ship.rotation.z += (bank - this._ship.rotation.z) * 5 * dt;

    // Fire laser
    this.fireTimer -= dt;
    if ((input.isDown('Space') || input.isDown('Enter')) && this.fireTimer <= 0) {
      this._fireLaser();
      this.fireTimer = this.fireCooldown;
    }

    // Update lasers
    for (const laser of this._lasers) {
      if (!laser.active) continue;
      laser.mesh.position.z -= 60 * dt;

      // Check laser-rock collision
      for (const rock of this._rocks) {
        if (!rock.active) continue;
        const dist = laser.mesh.position.distanceTo(rock.group.position);
        if (dist < rock.size + 0.5) {
          laser.active = false;
          laser.mesh.visible = false;
          rock.hits--;
          this.game.playTone(800, 0.06, 'square', 0.04);

          if (rock.hits <= 0) {
            // Rock breaks — spawn crystal
            rock.active = false;
            rock.group.visible = false;
            this._spawnCrystal(rock.group.position.clone());
            this.game.particles.sparkle(rock.group.position.clone(), 0xAA8866, 10);
          } else {
            // Rock shrinks when hit
            rock.group.scale.multiplyScalar(0.8);
          }
          break;
        }
      }

      if (laser.mesh.position.z < -30) {
        laser.active = false;
        laser.mesh.visible = false;
      }
    }

    // Clean up dead lasers
    this._lasers = this._lasers.filter(l => {
      if (!l.active) { this.scene.remove(l.mesh); return false; }
      return true;
    });

    // Update rocks — slow drift
    for (const rock of this._rocks) {
      if (!rock.active) continue;
      rock.group.rotation.x += dt * rock.spin;
      rock.group.rotation.y += dt * rock.spin * 0.7;
      rock.group.position.x += Math.sin(this.timer + rock.phase) * dt * 0.3;
    }

    // Update crystals — float toward ship
    for (const crystal of this._crystals) {
      if (crystal.collected) continue;
      crystal.mesh.rotation.y += dt * 3;

      // Float toward ship
      const dir = this._ship.position.clone().sub(crystal.mesh.position);
      const dist = dir.length();
      if (dist < 2) {
        crystal.collected = true;
        crystal.mesh.visible = false;
        this.mined++;
        this.game.addScore(3);
        this.game.ui.showScorePopup(3, 'Crystal mined!');
        this.game.particles.sparkle(crystal.mesh.position.clone(), crystal.color);
        this.game.playTone(1000 + this.mined * 80, 0.1, 'sine', 0.08);
      } else if (dist < 8) {
        dir.normalize().multiplyScalar(6 * dt);
        crystal.mesh.position.add(dir);
      }
    }

    // Respawn rocks if needed
    const activeRocks = this._rocks.filter(r => r.active).length;
    if (activeRocks < 4 && this.timer < this.duration - 3) {
      this._spawnRock();
    }

    // Done
    if (this.timer >= this.duration && !this.done) {
      this.done = true;
      const totalPoints = this.mined * 3;
      const msg = this.mined >= 5 ? 'Master miner!' : 'Nice mining!';
      this.game.ui.showScorePopup(totalPoints, msg);
      this.game.tts.speak(msg);
      this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
      setTimeout(() => {
        this.game.setState(GameState.ORBIT, { planet: this.planetData });
      }, 1500);
    }
  }

  _spawnRock() {
    const group = new THREE.Group();
    const size = 1 + Math.random() * 1.5;
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const shade = 0.3 + Math.random() * 0.3;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shade, shade * 0.9, shade * 0.8),
      roughness: 0.8,
    });
    group.add(new THREE.Mesh(geo, mat));
    group.position.set(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      -5 - Math.random() * 10,
    );
    group.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    this.scene.add(group);
    this._rocks.push({
      group,
      size,
      hits: 2,
      spin: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      active: true,
    });
  }

  _spawnCrystal(position) {
    const colors = [0x00FFFF, 0xFF88FF, 0xFFD700, 0x44FF44];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const geo = new THREE.OctahedronGeometry(0.5, 0);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this._crystals.push({ mesh, color, collected: false });
  }

  _fireLaser() {
    const geo = new THREE.CylinderGeometry(0.05, 0.05, 2, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00FFAA, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(this._ship.position);
    mesh.position.z -= 1.5;
    mesh.add(new THREE.PointLight(0x00FFAA, 0.5, 4));
    this.scene.add(mesh);
    this._lasers.push({ mesh, active: true });
    this.game.playTone(1600, 0.05, 'square', 0.03);
  }
}
