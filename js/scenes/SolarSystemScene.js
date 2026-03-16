import * as THREE from 'three';
import { Ship } from '../entities/Ship.js';
import { Planet } from '../entities/Planet.js';
import { Collectible } from '../entities/Collectible.js';
import { Wormhole } from '../entities/Wormhole.js';
import { LandingScene } from './LandingScene.js';
import { DESTINATIONS, DESTINATION_MAP, PLANETS, MOONS } from '../data/solarSystem.js';
import { GameState } from '../game.js';

export class SolarSystemScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
    this.ship = null;
    this.planets = [];
    this.collectibles = [];
    this.nearestPlanet = null;
    this.proximityThreshold = 12;
    this._lastSpokenPlanet = null;
    this.beltRocks = [];
    this.kuiperRocks = [];
    this.lasers = [];
    this.fireTimer = 0;
    this.fireCooldown = 0.25;
  }

  init() {
    this.scene = new THREE.Scene();
    // No fog — space is clear and stars should be visible at any distance

    // Camera — far plane large enough to see distant stars
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);

    // Starfield — placed on a very distant shell, well outside the solar system
    const starCount = 4000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1500 + Math.random() * 1500;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starTex = LandingScene._starTexture();
    const starMat = new THREE.PointsMaterial({
      color: 0xFFFFFF, size: 2, sizeAttenuation: false,
      map: starTex, transparent: true, depthWrite: false,
    });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // Ambient light — bright enough to see everything
    this.scene.add(new THREE.AmbientLight(0x8888AA, 1.0));

    // Sun is now created as a Planet entity from the data (type: 'star')
    // It includes its own glow and point light

    // Directional light for better planet visibility at distance
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 1.2);
    dirLight.position.set(0, 50, 0);
    this.scene.add(dirLight);

    // Hemisphere light for fill from below
    this.scene.add(new THREE.HemisphereLight(0x4466AA, 0x223344, 0.6));

    // Create planets and moons
    this.planetMap = {};
    for (const data of DESTINATIONS) {
      const planet = new Planet(data);

      if (data.type === 'planet' || data.type === 'star' || !data.parent || !DESTINATION_MAP[data.parent]) {
        // Place at orbital distance from sun (sun itself at origin)
        const yOffset = data.distance === 0 ? 0 : (Math.random() - 0.5) * 5;
        planet.group.position.set(
          Math.cos(data.angle) * data.distance,
          yOffset,
          Math.sin(data.angle) * data.distance,
        );
      }

      this.planetMap[data.id] = planet;
      this.planets.push(planet);
      this.scene.add(planet.group);
    }

    // Position moons relative to their parent planets
    for (const data of MOONS) {
      if (data.parent && this.planetMap[data.parent]) {
        const parentPos = this.planetMap[data.parent].group.position;
        const moon = this.planetMap[data.id];
        moon.group.position.set(
          parentPos.x + Math.cos(data.angle) * data.distance,
          parentPos.y + (Math.random() - 0.5) * 2,
          parentPos.z + Math.sin(data.angle) * data.distance,
        );
      }
    }

    // Asteroid belt visual (scattered rocks between Mars and Jupiter)
    const beltCount = 300;
    const beltInner = 145;
    const beltOuter = 200;
    for (let i = 0; i < beltCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = beltInner + Math.random() * (beltOuter - beltInner);
      const size = 0.2 + Math.random() * 0.5;
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const shade = 0.3 + Math.random() * 0.3;
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(shade, shade * 0.9, shade * 0.8) });
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 4,
        Math.sin(angle) * dist,
      );
      rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      this.scene.add(rock);
      this.beltRocks.push(rock);
    }

    // Kuiper Belt — sparse icy debris ring beyond Neptune
    const kuiperCount = 500;
    const kuiperInner = 440;
    const kuiperOuter = 520;
    for (let i = 0; i < kuiperCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = kuiperInner + Math.random() * (kuiperOuter - kuiperInner);
      const size = 0.15 + Math.random() * 0.4;
      const geo = new THREE.DodecahedronGeometry(size, 0);
      // Icy blue-grey tones
      const shade = 0.4 + Math.random() * 0.3;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(shade * 0.8, shade * 0.85, shade),
      });
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 8,
        Math.sin(angle) * dist,
      );
      rock.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      this.scene.add(rock);
      this.kuiperRocks.push(rock);
    }

    // Boundary wall — visible force field at edge of solar system
    const boundaryGeo = new THREE.IcosahedronGeometry(520, 1);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x4466FF,
      wireframe: true,
      transparent: true,
      opacity: 0.03,
    });
    this.boundary = new THREE.Mesh(boundaryGeo, boundaryMat);
    this.scene.add(this.boundary);

    // Wormholes — bidirectional portal pair
    const outerAngle = Math.PI * 0.7;
    const innerAngle = Math.PI * 1.2;
    this.wormholeOuter = new Wormhole(
      new THREE.Vector3(Math.cos(outerAngle) * 475, 0, Math.sin(outerAngle) * 475),
      'outer',
    );
    this.wormholeInner = new Wormhole(
      new THREE.Vector3(Math.cos(innerAngle) * 155, 0, Math.sin(innerAngle) * 155),
      'inner',
    );
    this.scene.add(this.wormholeOuter.group);
    this.scene.add(this.wormholeInner.group);
    this._warpCooldown = 0;

    // Ship
    this.ship = new Ship(this.game.particles);
    this.ship.group.position.set(95, 5, 0); // Start near Earth
    this.scene.add(this.ship.group);

    // Spawn collectible crystals
    this._spawnCrystals();

    // Add particle system to scene
    this.game.particles.addToScene(this.scene);

    this._initialized = true;
  }

  _spawnCrystals() {
    // Get planet positions for avoidance
    const planetPositions = this.planets.map(p => p.group.position);

    for (let i = 0; i < 50; i++) {
      // Random position between distance 30-500 from origin
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 470;
      const pos = new THREE.Vector3(
        Math.cos(angle) * dist,
        (Math.random() - 0.5) * 6,
        Math.sin(angle) * dist,
      );

      // Avoid placing within 15 units of any planet
      let tooClose = false;
      for (const pp of planetPositions) {
        if (pos.distanceTo(pp) < 15) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const crystal = new Collectible(pos);
      this.collectibles.push(crystal);
      this.scene.add(crystal.group);
    }
  }

  enter() {
    const isNewGame = this.game.visited.size === 0;

    // Reset ALL planets to unvisited first, then re-apply current visited set
    for (const planet of this.planets) {
      planet.visited = false;
      planet.beacon.visible = true;
      planet.visitedStar.visible = false;
    }

    // Sync visited state
    for (const id of this.game.visited) {
      if (this.planetMap[id]) {
        this.planetMap[id].setVisited();
      }
    }

    // Respawn crystals — all on new game, 50% otherwise
    for (const c of this.collectibles) {
      if (c.collected && (isNewGame || Math.random() < 0.5)) {
        c.collected = false;
        c.group.visible = true;
      }
    }

    // Reset ship position on new game
    if (isNewGame) {
      this.ship.group.position.set(95, 5, 0);
      this.ship.group.quaternion.identity();
      this.ship.bankAngle = 0;
    }
  }

  exit() {
    this.game.ui.hideProximity();
    // Clean up active lasers
    for (const l of this.lasers) this.scene.remove(l.mesh);
    this.lasers = [];
  }

  update(dt) {
    const { input } = this.game;

    // Speed toggle with Q key
    if (input.wasPressed('KeyQ')) {
      this.ship.cycleSpeed();
      this.game.ui.showSpeedLabel(this.ship.getSpeedLabel());
      this.game.playTone(600, 0.1);
    }

    // Proximity slowdown — find distance to nearest planet
    let closestDist = Infinity;
    for (const planet of this.planets) {
      const dist = this.ship.position.distanceTo(planet.position);
      if (dist < closestDist) closestDist = dist;
    }
    const slowdownRange = 35;
    if (closestDist < slowdownRange) {
      // Smoothly slow to 10% speed near planets so player can stop
      const t = closestDist / slowdownRange;
      this.ship.proximitySlowdown = 0.1 + 0.9 * (t * t); // quadratic for sharper slowdown
    } else {
      this.ship.proximitySlowdown = 1;
    }

    // Update ship
    this.ship.update(dt, input);

    // Camera follow with lerp
    const cameraOffset = new THREE.Vector3(0, 5, 15);
    cameraOffset.applyQuaternion(this.ship.group.quaternion);
    const targetCamPos = this.ship.position.clone().add(cameraOffset);
    this.camera.position.lerp(targetCamPos, 4 * dt);

    const lookTarget = this.ship.position.clone();
    lookTarget.y += 1;
    this.camera.lookAt(lookTarget);

    // Update planets
    for (const planet of this.planets) {
      planet.update(dt);
    }

    // Update collectibles and check collection
    for (const crystal of this.collectibles) {
      if (crystal.collected) continue;
      crystal.update(dt);

      const dist = this.ship.position.distanceTo(crystal.position);
      if (dist < crystal.collisionRadius) {
        crystal.collect();
        this.game.crystalsCollected++;
        this.game.addScore(2);
        this.game.ui.showScorePopup(2, 'Crystal collected!');
        this.game.particles.sparkle(crystal.position.clone(), crystal.color);
        this.game.playTone(1200, 0.12, 'sine', 0.08);
      }
    }

    // Update wormholes and check for teleport
    this.wormholeOuter.update(dt);
    this.wormholeInner.update(dt);
    if (this._warpCooldown > 0) this._warpCooldown -= dt;

    if (this._warpCooldown <= 0) {
      const distOuter = this.ship.position.distanceTo(this.wormholeOuter.position);
      const distInner = this.ship.position.distanceTo(this.wormholeInner.position);

      if (distOuter < this.wormholeOuter.collisionRadius) {
        this._teleportTo(this.wormholeInner);
      } else if (distInner < this.wormholeInner.collisionRadius) {
        this._teleportTo(this.wormholeOuter);
      }
    }

    // Boundary — hard wall at edge of solar system
    const maxDist = 520;
    const warnDist = maxDist - 30;
    const shipPos = this.ship.group.position;
    const shipDist = shipPos.length();

    // Hard wall: clamp position, don't change ship orientation
    if (shipDist > maxDist) {
      shipPos.setLength(maxDist);
    }

    if (shipDist > warnDist) {
      const overshoot = Math.min(1, (shipDist - warnDist) / (maxDist - warnDist));
      // Slow down as we approach edge
      this.ship.boundarySlowdown = Math.max(0.05, 1 - overshoot * 0.95);
      // Make boundary wall glow when near
      this.boundary.material.opacity = 0.03 + overshoot * 0.12;
    } else {
      this.ship.boundarySlowdown = 1;
      this.boundary.material.opacity = 0.03;
    }

    // Blaster — fire on Space
    this.fireTimer -= dt;
    if (input.isDown('Space') && this.fireTimer <= 0) {
      this._fireLaser();
      this.fireTimer = this.fireCooldown;
    }
    this._updateLasers(dt);

    // Proximity detection — skip visited planets
    let nearest = null;
    let nearestDist = this.proximityThreshold;
    for (const planet of this.planets) {
      if (this.game.visited.has(planet.data.id)) continue;
      const dist = this.ship.position.distanceTo(planet.position);
      // Scale threshold by planet size
      const threshold = this.proximityThreshold + planet.data.size;
      if (dist < threshold && dist < nearestDist + planet.data.size) {
        nearest = planet;
        nearestDist = dist;
      }
    }

    // Unhighlight previous
    if (this.nearestPlanet && this.nearestPlanet !== nearest) {
      this.nearestPlanet.setHighlighted(false);
      this.game.ui.hideProximity();
      this._lastSpokenPlanet = null;
    }

    this.nearestPlanet = nearest;
    if (nearest) {
      nearest.setHighlighted(true);
      this.game.ui.showProximity(nearest.data.name);
      // Read planet name aloud when first approaching
      if (this._lastSpokenPlanet !== nearest.data.id) {
        this._lastSpokenPlanet = nearest.data.id;
        this.game.tts.speak(`You're near ${nearest.data.name}!`);
      }

      // Visit on Enter
      if (input.enter) {
        this.game.currentPlanet = nearest.data;
        this.game.playTone(880, 0.2);
        // Skip asteroid minigame for the Sun and special destinations
        if (nearest.data.type === 'star' || nearest.data.skipAsteroid) {
          if (nearest.data.miniGame) {
            this.game.setState(GameState.MINI_GAME, { planet: nearest.data });
          } else {
            this.game.setState(GameState.ORBIT, { planet: nearest.data });
          }
        } else {
          this.game.setState(GameState.ASTEROID, { planet: nearest.data });
        }
      }
    }

    // Update particles
    this.game.particles.update(dt);

    // Update HUD destination
    if (nearest) {
      this.game.ui.setDestination(nearest.data.name);
    } else {
      this.game.ui.setDestination('');
    }
  }

  _fireLaser() {
    const geo = new THREE.CylinderGeometry(0.08, 0.08, 3, 6);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00FFAA, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);

    const fwd = new THREE.Vector3(0, 0, -2);
    fwd.applyQuaternion(this.ship.group.quaternion);
    mesh.position.copy(this.ship.group.position).add(fwd);

    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.ship.group.quaternion);
    mesh.quaternion.copy(this.ship.group.quaternion);

    const light = new THREE.PointLight(0x00FFAA, 1, 8);
    mesh.add(light);

    this.scene.add(mesh);
    this.lasers.push({ mesh, direction: dir, active: true });
    this.game.playTone(1600, 0.06, 'square', 0.04);
  }

  _updateLasers(dt) {
    const speed = 200;
    for (const l of this.lasers) {
      if (!l.active) continue;
      l.mesh.position.addScaledVector(l.direction, speed * dt);

      // Check belt rocks
      for (const rock of this.beltRocks) {
        if (!rock.visible) continue;
        if (l.mesh.position.distanceTo(rock.position) < 2.5) {
          rock.visible = false;
          l.active = false;
          l.mesh.visible = false;
          this.game.addScore(2);
          this.game.ui.showScorePopup(2, 'Asteroid blasted!');
          this.game.particles.sparkle(rock.position.clone(), 0xFFAA44);
          this.game.playTone(1200, 0.08, 'square', 0.06);
          break;
        }
      }
      if (!l.active) continue;

      // Check kuiper rocks
      for (const rock of this.kuiperRocks) {
        if (!rock.visible) continue;
        if (l.mesh.position.distanceTo(rock.position) < 2.5) {
          rock.visible = false;
          l.active = false;
          l.mesh.visible = false;
          this.game.addScore(2);
          this.game.ui.showScorePopup(2, 'Ice chunk blasted!');
          this.game.particles.sparkle(rock.position.clone(), 0x88CCFF);
          this.game.playTone(1200, 0.08, 'square', 0.06);
          break;
        }
      }

      // Remove if too far from ship
      if (l.active && l.mesh.position.distanceTo(this.ship.position) > 150) {
        l.active = false;
        l.mesh.visible = false;
      }
    }

    // Clean up inactive
    this.lasers = this.lasers.filter(l => {
      if (!l.active) { this.scene.remove(l.mesh); return false; }
      return true;
    });
  }

  _teleportTo(exitWormhole) {
    // Move ship to exit wormhole position, offset slightly so we don't re-trigger
    const offset = exitWormhole.position.clone().normalize().multiplyScalar(12);
    this.ship.group.position.copy(exitWormhole.position).add(offset);

    // Cooldown prevents immediate re-teleport
    this._warpCooldown = 2;

    // Visual + audio feedback
    this.game.ui.flashScreen('warp');
    this.game.particles.sparkle(this.ship.position.clone(), 0x9966FF, 30);
    this.game.particles.sparkle(exitWormhole.position.clone(), 0x9966FF, 20);

    // Warp sound — descending whoosh
    this.game.playTone(1200, 0.3, 'sine', 0.12);
    setTimeout(() => this.game.playTone(400, 0.4, 'sine', 0.1), 100);
    setTimeout(() => this.game.playTone(200, 0.3, 'sine', 0.08), 250);

    this.game.tts.speak('Wormhole!');
    this.game.ui.showScorePopup(0, 'Wormhole Jump!');

    // Track achievement
    this.game.wormholeUsed = true;
    this.game.checkAchievements();
  }
}
