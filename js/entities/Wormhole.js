import * as THREE from 'three';

export class Wormhole {
  constructor(position, label) {
    this.group = new THREE.Group();
    this.label = label;
    this.collisionRadius = 8;
    this._time = Math.random() * Math.PI * 2;
    this._cooldown = 0;

    // Main torus — purple/blue swirling ring
    const torusGeo = new THREE.TorusGeometry(4, 0.6, 16, 48);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x6633CC,
      emissive: 0x4422AA,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    this.torus = new THREE.Mesh(torusGeo, torusMat);
    this.group.add(this.torus);

    // Second inner torus for depth
    const innerTorusGeo = new THREE.TorusGeometry(2.8, 0.3, 12, 32);
    const innerTorusMat = new THREE.MeshBasicMaterial({
      color: 0x8866FF,
      transparent: true,
      opacity: 0.5,
    });
    this.innerTorus = new THREE.Mesh(innerTorusGeo, innerTorusMat);
    this.group.add(this.innerTorus);

    // Central glow — the "eye" of the wormhole
    const glowGeo = new THREE.SphereGeometry(2.5, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x9966FF,
      transparent: true,
      opacity: 0.2,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glow);

    // Bright core
    const coreGeo = new THREE.SphereGeometry(1, 12, 12);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xCCAAFF,
      transparent: true,
      opacity: 0.4,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    // Point light for ambient glow — visible from distance
    this.light = new THREE.PointLight(0x7744DD, 2, 60);
    this.group.add(this.light);

    // Swirling particle ring
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    this._particleAngles = new Float32Array(particleCount);
    this._particleRadii = new Float32Array(particleCount);
    this._particleSpeeds = new Float32Array(particleCount);
    this._particleY = new Float32Array(particleCount);
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      this._particleAngles[i] = Math.random() * Math.PI * 2;
      this._particleRadii[i] = 2 + Math.random() * 3;
      this._particleSpeeds[i] = 1.5 + Math.random() * 2;
      this._particleY[i] = (Math.random() - 0.5) * 2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xAA88FF,
      size: 0.4,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(particleGeo, particleMat);
    this.group.add(this.particles);

    this.group.position.copy(position);
  }

  update(dt) {
    this._time += dt;
    if (this._cooldown > 0) this._cooldown -= dt;

    // Rotate torus rings
    this.torus.rotation.z += dt * 0.4;
    this.torus.rotation.x += dt * 0.15;
    this.innerTorus.rotation.z -= dt * 0.6;
    this.innerTorus.rotation.y += dt * 0.3;

    // Pulse glow
    const pulse = 1 + Math.sin(this._time * 2) * 0.2;
    this.glow.scale.setScalar(pulse);
    this.core.scale.setScalar(0.8 + Math.sin(this._time * 3) * 0.3);
    this.light.intensity = 2 + Math.sin(this._time * 2.5) * 0.8;

    // Torus color shift
    const hue = 0.72 + Math.sin(this._time * 0.5) * 0.05;
    this.torus.material.emissive.setHSL(hue, 0.7, 0.3);

    // Update swirling particles
    const positions = this.particles.geometry.attributes.position.array;
    const count = this._particleAngles.length;
    for (let i = 0; i < count; i++) {
      this._particleAngles[i] += this._particleSpeeds[i] * dt;
      const a = this._particleAngles[i];
      const r = this._particleRadii[i];
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = this._particleY[i] + Math.sin(a * 2) * 0.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  get position() {
    return this.group.position;
  }

  get onCooldown() {
    return this._cooldown > 0;
  }

  setCooldown(seconds) {
    this._cooldown = seconds;
  }
}
