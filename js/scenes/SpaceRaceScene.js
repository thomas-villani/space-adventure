import * as THREE from 'three';
import { GameState } from '../game.js';

export class SpaceRaceScene {
  constructor(game) {
    this.game = game;
    this.ss = null; // SolarSystemScene reference, set in init()
    this.course = null;
    this.waypoints = [];
    this.currentWaypoint = 0;
    this.timer = 0;
    this.started = false;
    this.finished = false;
    this.countdown = 0;
    this._lastCountdownN = -1;
    this._finishOrbitAngle = 0;
    this.waypointMarkers = [];
    this.lasers = [];
    this.fireTimer = 0;
    this.fireCooldown = 0.25;
    this._warpCooldown = 0;
  }

  get scene() { return this.ss.scene; }
  get camera() { return this.ss.camera; }
  get ship() { return this.ss.ship; }

  init() {
    this.ss = this.game.scenes[GameState.SOLAR_SYSTEM];
    this._initialized = true;
  }

  enter(data) {
    this.course = data.course;
    this.waypoints = data.course.waypoints;
    this.currentWaypoint = 0;
    this.timer = 0;
    this.started = false;
    this.finished = false;
    this.countdown = 3.99;
    this._lastCountdownN = -1;
    this._finishOrbitAngle = 0;
    this._warpCooldown = 0;

    // Reset ship
    this.ship.group.position.set(20, 2, 0);
    this.ship.group.quaternion.identity();
    this.ship.bankAngle = 0;
    this.ship.speedLevel = 1;

    // Face first waypoint
    const first = this.ss.planetMap[this.waypoints[0]];
    if (first) {
      const dir = new THREE.Vector3()
        .subVectors(first.group.position, this.ship.group.position);
      dir.y = 0;
      dir.normalize();
      this.ship.group.rotation.y = Math.atan2(-dir.x, -dir.z);
    }

    // Hide planet beacons and visited stars
    for (const planet of this.ss.planets) {
      planet.beacon.visible = false;
      planet.visitedStar.visible = false;
    }

    // Hide crystals in race mode
    for (const c of this.ss.collectibles) c.group.visible = false;

    // Create waypoint markers
    this._createWaypointMarkers();

    // Clean up any leftover lasers
    for (const l of this.lasers) this.ss.scene.remove(l.mesh);
    this.lasers = [];
    this.fireTimer = 0;

    // Show race UI
    this.game.ui.showRaceHud(this.course.name, this.waypoints.length);
    this.game.ui.updateRaceTimer(0);
    this._updateWaypointUI();
    this.game.ui.showRaceCountdown('3');
  }

  exit() {
    // Remove waypoint markers
    for (const m of this.waypointMarkers) this.ss.scene.remove(m);
    this.waypointMarkers = [];

    // Clean up lasers
    for (const l of this.lasers) this.ss.scene.remove(l.mesh);
    this.lasers = [];

    // Restore crystals
    for (const c of this.ss.collectibles) {
      if (!c.collected) c.group.visible = true;
    }

    // Restore planet beacons (SolarSystemScene.enter() will properly sync these)
    for (const planet of this.ss.planets) {
      planet.beacon.visible = true;
      planet.visitedStar.visible = false;
    }

    this.game.ui.hideRaceHud();
    this.game.ui.hideRaceCountdown();
    this.game.ui.hideRaceFinish();
  }

  update(dt) {
    const { input } = this.game;

    // ── Countdown phase ──
    if (!this.started && !this.finished) {
      this.countdown -= dt;
      const n = Math.ceil(Math.max(0, this.countdown));

      if (n >= 1) {
        this.game.ui.showRaceCountdown(n.toString());
        if (n !== this._lastCountdownN) {
          this._lastCountdownN = n;
          this.game.playTone(800, 0.12);
        }
      } else if (this.countdown > -0.8) {
        if (this._lastCountdownN !== 0) {
          this._lastCountdownN = 0;
          this.game.ui.showRaceCountdown('GO!');
          this.game.playMelody([[880, 0.1], [1320, 0.2]]);
        }
      } else {
        this.started = true;
        this.game.ui.hideRaceCountdown();
      }

      // Camera behind ship during countdown
      const offset = new THREE.Vector3(0, 5, 15);
      offset.applyQuaternion(this.ship.group.quaternion);
      this.camera.position.copy(this.ship.position.clone().add(offset));
      const look = this.ship.position.clone();
      look.y += 1;
      this.camera.lookAt(look);

      for (const planet of this.ss.planets) planet.update(dt);
      for (const m of this.waypointMarkers) if (m.visible) m.rotation.y += dt * 2;
      this.game.particles.update(dt);
      return;
    }

    // ── Finished phase ──
    if (this.finished) {
      this._finishOrbitAngle += dt * 0.5;
      const r = 20;
      this.camera.position.x = this.ship.position.x + Math.sin(this._finishOrbitAngle) * r;
      this.camera.position.z = this.ship.position.z + Math.cos(this._finishOrbitAngle) * r;
      this.camera.position.y = this.ship.position.y + 8;
      this.camera.lookAt(this.ship.position);

      for (const planet of this.ss.planets) planet.update(dt);
      this.game.particles.update(dt);
      return;
    }

    // ── Active race ──
    this.timer += dt;

    // Speed toggle
    if (input.wasPressed('KeyQ')) {
      this.ship.cycleSpeed();
      this.game.ui.showSpeedLabel(this.ship.getSpeedLabel());
      this.game.playTone(600, 0.1);
    }

    // NO proximity slowdown in race mode!
    this.ship.proximitySlowdown = 1;

    // Update ship
    this.ship.update(dt, input);

    // Camera follow
    const cameraOffset = new THREE.Vector3(0, 5, 15);
    cameraOffset.applyQuaternion(this.ship.group.quaternion);
    const targetCamPos = this.ship.position.clone().add(cameraOffset);
    this.camera.position.lerp(targetCamPos, 4 * dt);
    const lookTarget = this.ship.position.clone();
    lookTarget.y += 1;
    this.camera.lookAt(lookTarget);

    // Update planets
    for (const planet of this.ss.planets) planet.update(dt);

    // Boundary
    const maxDist = 520;
    const warnDist = maxDist - 30;
    const shipPos = this.ship.group.position;
    const shipDist = shipPos.length();
    if (shipDist > maxDist) shipPos.setLength(maxDist);
    if (shipDist > warnDist) {
      const overshoot = Math.min(1, (shipDist - warnDist) / (maxDist - warnDist));
      this.ship.boundarySlowdown = Math.max(0.05, 1 - overshoot * 0.95);
      this.ss.boundary.material.opacity = 0.03 + overshoot * 0.12;
    } else {
      this.ship.boundarySlowdown = 1;
      this.ss.boundary.material.opacity = 0.03;
    }

    // Wormholes
    this.ss.wormholeOuter.update(dt);
    this.ss.wormholeInner.update(dt);
    if (this._warpCooldown > 0) this._warpCooldown -= dt;
    if (this._warpCooldown <= 0) {
      const distOuter = this.ship.position.distanceTo(this.ss.wormholeOuter.position);
      const distInner = this.ship.position.distanceTo(this.ss.wormholeInner.position);
      if (distOuter < this.ss.wormholeOuter.collisionRadius) {
        this._teleportTo(this.ss.wormholeInner);
      } else if (distInner < this.ss.wormholeInner.collisionRadius) {
        this._teleportTo(this.ss.wormholeOuter);
      }
    }

    // Blaster
    this.fireTimer -= dt;
    if (input.isDown('Space') && this.fireTimer <= 0) {
      this._fireLaser();
      this.fireTimer = this.fireCooldown;
    }
    this._updateLasers(dt);

    // Waypoint check
    if (this.currentWaypoint < this.waypoints.length) {
      const targetId = this.waypoints[this.currentWaypoint];
      const targetPlanet = this.ss.planetMap[targetId];
      if (targetPlanet) {
        const dist = this.ship.position.distanceTo(targetPlanet.position);
        const threshold = 12 + targetPlanet.data.size;
        if (dist < threshold) {
          this._onCheckpoint(targetId);
        }
      }
    }

    // Update race timer UI
    this.game.ui.updateRaceTimer(this.timer);

    // Update particles
    this.game.particles.update(dt);

    // Animate waypoint markers
    for (const m of this.waypointMarkers) {
      if (m.visible) m.rotation.y += dt * 2;
    }

    // Show nearest waypoint name in HUD destination area
    if (this.currentWaypoint < this.waypoints.length) {
      const id = this.waypoints[this.currentWaypoint];
      const name = this.ss.planetMap[id]?.data?.name || id;
      this.game.ui.setDestination(name);
    }
  }

  _onCheckpoint(planetId) {
    this.currentWaypoint++;

    // Hide reached marker
    const marker = this.waypointMarkers[this.currentWaypoint - 1];
    if (marker) marker.visible = false;

    // Score + feedback
    this.game.addScore(5);
    const planetName = this.ss.planetMap[planetId]?.data?.name || planetId;
    this.game.ui.showScorePopup(5, `${planetName} reached!`);
    this.game.playMelody([[880, 0.1], [1047, 0.12]]);
    this.game.particles.sparkle(this.ship.position.clone(), 0x00FFAA, 20);
    this.game.ui.flashScreen('celebrate');

    if (this.currentWaypoint >= this.waypoints.length) {
      this._onFinish();
    } else {
      this._updateWaypointUI();
    }
  }

  _onFinish() {
    this.finished = true;
    const time = this.timer;

    // Save best time
    const isNewBest = this._saveBestTime(this.course.id, time);
    const bestTime = this._getBestTime(this.course.id);

    this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.25]]);
    this.game.ui.flashScreen('celebrate');
    this.game.ui.showRaceFinish(time, this.course.name, bestTime, isNewBest);
  }

  _createWaypointMarkers() {
    for (const m of this.waypointMarkers) this.ss.scene.remove(m);
    this.waypointMarkers = [];

    for (let i = 0; i < this.waypoints.length; i++) {
      const id = this.waypoints[i];
      const planet = this.ss.planetMap[id];
      if (!planet) continue;

      const ringSize = planet.data.size + 3;
      const geo = new THREE.TorusGeometry(ringSize, 0.3, 8, 32);
      const isNext = i === 0;
      const mat = new THREE.MeshBasicMaterial({
        color: isNext ? 0x00FFAA : 0x4488FF,
        transparent: true,
        opacity: isNext ? 0.9 : 0.4,
      });
      const marker = new THREE.Mesh(geo, mat);
      marker.position.copy(planet.group.position);
      marker.position.y += planet.data.size + 4;

      this.ss.scene.add(marker);
      this.waypointMarkers.push(marker);
    }
  }

  _updateWaypointUI() {
    // Update marker colors
    for (let i = 0; i < this.waypointMarkers.length; i++) {
      const m = this.waypointMarkers[i];
      if (i < this.currentWaypoint) {
        m.visible = false;
      } else if (i === this.currentWaypoint) {
        m.material.color.setHex(0x00FFAA);
        m.material.opacity = 0.9;
      } else {
        m.material.color.setHex(0x4488FF);
        m.material.opacity = 0.4;
      }
    }

    // Update HUD waypoint info
    const id = this.waypoints[this.currentWaypoint];
    const name = this.ss.planetMap[id]?.data?.name || id;
    this.game.ui.updateRaceWaypoint(name, this.currentWaypoint + 1, this.waypoints.length);
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

    this.ss.scene.add(mesh);
    this.lasers.push({ mesh, direction: dir, active: true });
    this.game.playTone(1600, 0.06, 'square', 0.04);
  }

  _updateLasers(dt) {
    const speed = 200;
    for (const l of this.lasers) {
      if (!l.active) continue;
      l.mesh.position.addScaledVector(l.direction, speed * dt);

      // Check belt rocks
      for (const rock of this.ss.beltRocks) {
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
      for (const rock of this.ss.kuiperRocks) {
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

    // Clean up
    this.lasers = this.lasers.filter(l => {
      if (!l.active) { this.ss.scene.remove(l.mesh); return false; }
      return true;
    });
  }

  _teleportTo(exitWormhole) {
    const offset = exitWormhole.position.clone().normalize().multiplyScalar(12);
    this.ship.group.position.copy(exitWormhole.position).add(offset);
    this._warpCooldown = 2;

    this.game.ui.flashScreen('warp');
    this.game.particles.sparkle(this.ship.position.clone(), 0x9966FF, 30);
    this.game.particles.sparkle(exitWormhole.position.clone(), 0x9966FF, 20);
    this.game.playTone(1200, 0.3, 'sine', 0.12);
    setTimeout(() => this.game.playTone(400, 0.4, 'sine', 0.1), 100);
    setTimeout(() => this.game.playTone(200, 0.3, 'sine', 0.08), 250);
    this.game.tts.speak('Wormhole!');
    this.game.ui.showScorePopup(0, 'Wormhole Jump!');
  }

  _saveBestTime(courseId, time) {
    const key = `space-race-best-${courseId}`;
    const current = parseFloat(localStorage.getItem(key));
    if (isNaN(current) || time < current) {
      localStorage.setItem(key, time.toFixed(1));
      return true;
    }
    return false;
  }

  _getBestTime(courseId) {
    const val = parseFloat(localStorage.getItem(`space-race-best-${courseId}`));
    return isNaN(val) ? null : val;
  }
}
