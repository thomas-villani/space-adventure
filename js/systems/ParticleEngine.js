import * as THREE from 'three';

const MAX_PARTICLES = 500;

export class ParticleEngine {
  constructor() {
    this.particles = [];

    // Use a single Points object with dynamic buffer
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.sizes = new Float32Array(MAX_PARTICLES);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  addToScene(scene) {
    scene.add(this.points);
  }

  emit(position, options = {}) {
    const {
      count = 1,
      color = 0xFFFFFF,
      size = 0.2,
      life = 1,
      speed = 1,
      direction = null,
      spread = 0.5,
    } = options;

    const c = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      const vel = direction
        ? direction.clone().multiplyScalar(speed).add(
            new THREE.Vector3(
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread,
              (Math.random() - 0.5) * spread,
            ),
          )
        : new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed,
          );

      this.particles.push({
        position: position.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
          ),
        ),
        velocity: vel,
        color: c.clone(),
        size,
        life,
        maxLife: life,
      });
    }
  }

  // Emit a burst of sparkles (for score/celebration)
  sparkle(position, color = 0xFFD700, count = 15) {
    this.emit(position, {
      count,
      color,
      size: 0.3,
      life: 0.8,
      speed: 5,
      spread: 2,
    });
  }

  update(dt) {
    let alive = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) continue;

      p.position.addScaledVector(p.velocity, dt);
      const t = p.life / p.maxLife;

      const idx = alive * 3;
      this.positions[idx] = p.position.x;
      this.positions[idx + 1] = p.position.y;
      this.positions[idx + 2] = p.position.z;
      this.colors[idx] = p.color.r * t;
      this.colors[idx + 1] = p.color.g * t;
      this.colors[idx + 2] = p.color.b * t;
      this.sizes[alive] = p.size * t;

      this.particles[alive] = p;
      alive++;
    }

    this.particles.length = alive;

    // Zero out remaining
    for (let i = alive; i < MAX_PARTICLES; i++) {
      this.positions[i * 3] = 0;
      this.positions[i * 3 + 1] = 0;
      this.positions[i * 3 + 2] = 0;
      this.sizes[i] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.setDrawRange(0, alive);
  }
}
