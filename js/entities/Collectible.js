import * as THREE from 'three';

const COLORS = [0x00FFFF, 0xFF66AA, 0xFFD700, 0x44FF44, 0xFF8800];

export class Collectible {
  constructor(position) {
    this.group = new THREE.Group();
    this.collected = false;
    this.collisionRadius = 2.5;

    // Pick a random color
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Octahedron crystal
    const geo = new THREE.OctahedronGeometry(0.8, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.group.add(this.mesh);

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(1.2, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.15,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glow);

    this.group.position.copy(position);
    this._time = Math.random() * Math.PI * 2; // random phase
    this._baseY = position.y;
  }

  update(dt) {
    if (this.collected) return;
    this._time += dt;
    // Bob
    this.group.position.y = this._baseY + Math.sin(this._time * 2) * 0.5;
    // Spin
    this.mesh.rotation.y += dt * 2;
    this.mesh.rotation.x += dt * 0.5;
    // Glow pulse
    this.glow.scale.setScalar(1 + Math.sin(this._time * 3) * 0.15);
  }

  collect() {
    this.collected = true;
    this.group.visible = false;
  }

  get position() {
    return this.group.position;
  }
}
