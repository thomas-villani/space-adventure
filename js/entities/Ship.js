import * as THREE from 'three';

export class Ship {
  constructor(particleEngine) {
    this.group = new THREE.Group();
    this.baseSpeed = 30;
    this.speed = 30;
    this.minSpeed = 8;
    this.maxSpeed = 60;
    this.speedLevel = 1; // 0=slow, 1=normal, 2=fast
    this.speedMultipliers = [0.4, 1.0, 2.0];
    this.proximitySlowdown = 1; // 0-1, reduced when near planets
    this.boundarySlowdown = 1; // 0-1, reduced at edge of solar system
    this.turnSpeed = 2.0;
    this.verticalSpeed = 15;
    this.bankAngle = 0;
    this.particleEngine = particleEngine;
    this.trailColor = 0xFF4400;

    // Body — a cone pointing forward (-Z)
    const bodyGeo = new THREE.ConeGeometry(0.6, 2.5, 8);
    this.bodyMat = new THREE.MeshStandardMaterial({ color: 0x4488FF, metalness: 0.5, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, this.bodyMat);
    body.rotation.x = -Math.PI / 2; // point forward
    this.group.add(body);

    // Cockpit — small sphere at front
    const cockpitGeo = new THREE.SphereGeometry(0.35, 8, 8);
    this.cockpitMat = new THREE.MeshStandardMaterial({ color: 0x88DDFF, metalness: 0.8, roughness: 0.1 });
    const cockpit = new THREE.Mesh(cockpitGeo, this.cockpitMat);
    cockpit.position.set(0, 0.15, -0.8);
    this.group.add(cockpit);

    // Wings
    const wingGeo = new THREE.BoxGeometry(3, 0.1, 1);
    this.wingMat = new THREE.MeshStandardMaterial({ color: 0x3366DD, metalness: 0.4, roughness: 0.4 });
    const wings = new THREE.Mesh(wingGeo, this.wingMat);
    wings.position.set(0, 0, 0.5);
    this.group.add(wings);

    // Engine glow
    const engineGeo = new THREE.SphereGeometry(0.3, 8, 8);
    this.engineMat = new THREE.MeshStandardMaterial({
      color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 2,
    });
    this.engineGlow = new THREE.Mesh(engineGeo, this.engineMat);
    this.engineGlow.position.set(0, 0, 1.3);
    this.group.add(this.engineGlow);

    // Engine light
    this.engineLight = new THREE.PointLight(0xFF4400, 2, 8);
    this.engineLight.position.set(0, 0, 1.5);
    this.group.add(this.engineLight);
  }

  applyStyle(style) {
    if (!style) return;
    this.bodyMat.color.setHex(style.body);
    this.cockpitMat.color.setHex(style.cockpit);
    this.wingMat.color.setHex(style.wings);
    this.engineMat.color.setHex(style.engine);
    this.engineMat.emissive.setHex(style.engine);
    this.engineLight.color.setHex(style.engine);
    this.trailColor = style.trail;
  }

  cycleSpeed() {
    this.speedLevel = (this.speedLevel + 1) % 3;
  }

  getSpeedLabel() {
    return ['Slow', 'Normal', 'Fast'][this.speedLevel];
  }

  update(dt, input) {
    // Compute effective speed: base * player multiplier * proximity slowdown * boundary slowdown
    this.speed = this.baseSpeed * this.speedMultipliers[this.speedLevel] * this.proximitySlowdown * this.boundarySlowdown;

    // Always move forward
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.group.quaternion);
    this.group.position.addScaledVector(forward, this.speed * dt);

    // Steering — yaw
    if (input.left) this.group.rotation.y += this.turnSpeed * dt;
    if (input.right) this.group.rotation.y -= this.turnSpeed * dt;

    // Vertical movement
    if (input.up) this.group.position.y += this.verticalSpeed * dt;
    if (input.down) this.group.position.y -= this.verticalSpeed * dt;

    // Bank animation
    let targetBank = 0;
    if (input.left) targetBank = 0.4;
    if (input.right) targetBank = -0.4;
    this.bankAngle += (targetBank - this.bankAngle) * 5 * dt;
    this.group.rotation.z = this.bankAngle;

    // Engine glow pulse
    this.engineGlow.scale.setScalar(0.8 + Math.sin(Date.now() * 0.01) * 0.2);

    // Emit engine particles
    if (this.particleEngine) {
      const enginePos = new THREE.Vector3(0, 0, 1.5);
      enginePos.applyMatrix4(this.group.matrixWorld);
      this.particleEngine.emit(enginePos, {
        count: 1,
        color: this.trailColor,
        size: 0.15,
        life: 0.4,
        speed: 2,
        direction: forward.clone().negate(),
      });
    }
  }

  get position() {
    return this.group.position;
  }
}
