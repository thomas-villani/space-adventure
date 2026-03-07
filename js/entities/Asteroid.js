import * as THREE from 'three';

export class Asteroid {
  constructor() {
    const size = 0.5 + Math.random() * 1.5;
    const geo = new THREE.DodecahedronGeometry(size, 1);
    // Deform vertices slightly for organic look
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.3);
      pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.3);
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.3);
    }
    geo.computeVertexNormals();

    const shade = 0.3 + Math.random() * 0.4;
    const color = new THREE.Color(shade, shade * 0.9, shade * 0.8);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1 });

    this.mesh = new THREE.Mesh(geo, mat);
    this.size = size;
    this.rotSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    );
    this.active = true;
  }

  update(dt) {
    this.mesh.rotation.x += this.rotSpeed.x * dt;
    this.mesh.rotation.y += this.rotSpeed.y * dt;
    this.mesh.rotation.z += this.rotSpeed.z * dt;
  }
}
