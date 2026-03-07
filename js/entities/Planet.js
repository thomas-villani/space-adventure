import * as THREE from 'three';

export class Planet {
  constructor(data) {
    this.data = data;
    this.group = new THREE.Group();

    // Main sphere — use emissive BasicMaterial for the Sun, StandardMaterial for everything else
    const geo = new THREE.SphereGeometry(data.size, 32, 32);
    let mat;
    if (data.type === 'star') {
      mat = new THREE.MeshBasicMaterial({ color: data.color });
      // Sun glow
      const glowGeo = new THREE.SphereGeometry(data.size * 1.25, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xFFAA00, transparent: true, opacity: 0.2,
      });
      this.group.add(new THREE.Mesh(glowGeo, glowMat));
      // Sun light
      const sunLight = new THREE.PointLight(0xFFEECC, 3, 1200);
      this.group.add(sunLight);
    } else {
      // Check for procedural texture
      const tex = Planet._getProceduralTexture(data.id);
      if (tex) {
        mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.7,
          metalness: 0.1,
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: data.color,
          roughness: 0.7,
          metalness: 0.1,
        });
      }
    }
    this.mesh = new THREE.Mesh(geo, mat);
    // Haumea egg shape — fast spin makes it elongated
    if (data.id === 'haumea') {
      this.mesh.scale.set(1.6, 0.8, 1);
    }
    this.group.add(this.mesh);

    // Rings for Saturn and Uranus
    if (data.hasRings) {
      const innerRadius = data.size * 1.3;
      const outerRadius = data.size * 2.2;
      const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: data.ringColor || 0xCCBB88,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      if (data.id === 'uranus') {
        // Uranus rotates on its side, so rings are nearly vertical
        ring.rotation.y = Math.PI / 2;
      } else {
        ring.rotation.x = -Math.PI / 2.5;
      }
      this.group.add(ring);
    }

    // Comet tail for Halley's Comet
    if (data.id === 'halley') {
      const dx = Math.cos(data.angle);
      const dz = Math.sin(data.angle);
      // Trail of glowing spheres extending away from the sun
      for (let i = 0; i < 5; i++) {
        const r = data.size * (1.5 + i * 1.2);
        const opacity = 0.18 - i * 0.03;
        const trailGeo = new THREE.SphereGeometry(r, 8, 8);
        const trailMat = new THREE.MeshBasicMaterial({
          color: i < 2 ? 0xCCDDFF : 0x88BBFF,
          transparent: true,
          opacity: Math.max(0.02, opacity),
        });
        const trailSphere = new THREE.Mesh(trailGeo, trailMat);
        trailSphere.position.set(dx * i * data.size * 3, 0, dz * i * data.size * 3);
        this.group.add(trailSphere);
      }
    }

    // Unvisited beacon — blue diamond (gold for bonus destinations)
    const beaconPrimary = data.bonus ? 0xFFAA00 : 0x4499FF;
    const beaconSecondary = data.bonus ? 0xDD8800 : 0x2266DD;
    this.beacon = new THREE.Group();
    const beaconSize = Math.max(0.6, data.size * 0.35);
    // Diamond shape (two cones tip-to-tip)
    const topCone = new THREE.Mesh(
      new THREE.ConeGeometry(beaconSize, beaconSize * 1.5, 4),
      new THREE.MeshBasicMaterial({ color: beaconPrimary, transparent: true, opacity: 0.9 }),
    );
    const bottomCone = new THREE.Mesh(
      new THREE.ConeGeometry(beaconSize, beaconSize * 1.0, 4),
      new THREE.MeshBasicMaterial({ color: beaconSecondary, transparent: true, opacity: 0.9 }),
    );
    bottomCone.rotation.x = Math.PI; // flip upside down
    bottomCone.position.y = -beaconSize * 0.6;
    topCone.position.y = beaconSize * 0.45;
    this.beacon.add(topCone);
    this.beacon.add(bottomCone);

    // Beacon glow
    const glowSphere = new THREE.Mesh(
      new THREE.SphereGeometry(beaconSize * 0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: beaconPrimary, transparent: true, opacity: 0.2 }),
    );
    this.beacon.add(glowSphere);

    this.beacon.position.y = data.size + beaconSize * 2.5;
    this.group.add(this.beacon);

    // Visited star — 3D star shape (3 intersecting boxes) that looks good from any angle
    this.visitedStar = new THREE.Group();
    const starMat = new THREE.MeshBasicMaterial({ color: 0x00FF66 });
    const s = Math.max(0.5, data.size * 0.4);
    const starThick = s * 0.2;

    // 3 intersecting elongated boxes at different rotations = 6-pointed star
    for (let i = 0; i < 3; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(s * 1.2, starThick, starThick),
        starMat,
      );
      bar.rotation.z = (i * Math.PI) / 3;
      this.visitedStar.add(bar);
    }
    // Add a second set rotated 90 degrees on Y for 3D visibility
    for (let i = 0; i < 3; i++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(starThick, starThick, s * 1.2),
        starMat,
      );
      bar.rotation.x = (i * Math.PI) / 3;
      this.visitedStar.add(bar);
    }

    // Green glow
    const starGlow = new THREE.Mesh(
      new THREE.SphereGeometry(s * 0.7, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00FF66, transparent: true, opacity: 0.15 }),
    );
    this.visitedStar.add(starGlow);

    this.visitedStar.position.y = data.size + s * 2;
    this.visitedStar.visible = false;
    this.group.add(this.visitedStar);

    this.visited = false;
    this.highlighted = false;
    this._time = 0;
  }

  setVisited() {
    this.visited = true;
    this.beacon.visible = false;
    this.visitedStar.visible = true;
  }

  setHighlighted(value) {
    this.highlighted = value;
    if (this.mesh.material.emissive) {
      this.mesh.material.emissive.setHex(value ? 0x333333 : 0x000000);
    }
  }

  update(dt) {
    this._time += dt;

    // Slow rotation
    this.mesh.rotation.y += dt * 0.3;

    // Beacon bob and spin for unvisited
    if (!this.visited && this.beacon.visible) {
      this.beacon.position.y = this.data.size + 2.5 + Math.sin(this._time * 2.5) * 0.8;
      this.beacon.rotation.y += dt * 2;
    }

    // Checkmark gentle bob for visited
    if (this.visited) {
      const cs = Math.max(0.5, this.data.size * 0.4);
      this.visitedStar.position.y = this.data.size + cs * 2 + Math.sin(this._time * 1.5) * 0.3;
      this.visitedStar.rotation.y += dt * 1.5;
      this.visitedStar.rotation.x += dt * 0.5;
    }
  }

  get position() {
    return this.group.position;
  }

  // ── Procedural textures for realistic-looking planets ──

  static _getProceduralTexture(id) {
    if (!Planet._texCache) Planet._texCache = {};
    if (Planet._texCache[id]) return Planet._texCache[id];
    let tex = null;
    if (id === 'earth') tex = Planet._earthTexture();
    else if (id === 'jupiter') tex = Planet._jupiterTexture();
    else if (id === 'saturn') tex = Planet._saturnTexture();
    if (tex) Planet._texCache[id] = tex;
    return tex;
  }

  static _earthTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    // Ocean
    ctx.fillStyle = '#2266BB';
    ctx.fillRect(0, 0, 256, 128);
    // Continents (simplified shapes)
    ctx.fillStyle = '#44AA44';
    // North America
    ctx.beginPath(); ctx.ellipse(55, 32, 18, 14, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(48, 45, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
    // South America
    ctx.beginPath(); ctx.ellipse(78, 72, 8, 18, 0.2, 0, Math.PI * 2); ctx.fill();
    // Europe
    ctx.beginPath(); ctx.ellipse(128, 30, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Africa
    ctx.fillStyle = '#66AA44';
    ctx.beginPath(); ctx.ellipse(132, 60, 10, 18, -0.1, 0, Math.PI * 2); ctx.fill();
    // Asia
    ctx.fillStyle = '#44AA44';
    ctx.beginPath(); ctx.ellipse(168, 32, 22, 14, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(185, 50, 12, 8, 0.3, 0, Math.PI * 2); ctx.fill();
    // Australia
    ctx.fillStyle = '#AA8844';
    ctx.beginPath(); ctx.ellipse(200, 78, 10, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    // Ice caps
    ctx.fillStyle = '#EEEEFF';
    ctx.fillRect(0, 0, 256, 6);
    ctx.fillRect(0, 122, 256, 6);
    // Clouds (subtle white patches)
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 12; i++) {
      const cx = Math.random() * 256, cy = 10 + Math.random() * 108;
      ctx.beginPath(); ctx.ellipse(cx, cy, 15 + Math.random() * 20, 4 + Math.random() * 6, Math.random() * 3, 0, Math.PI * 2); ctx.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  static _jupiterTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    // Horizontal bands
    const bands = [
      '#C8A060', '#E8C88A', '#AA7744', '#D8B870', '#BB8855',
      '#DDAA66', '#C89050', '#E0C080', '#AA7744', '#D8B870',
      '#CC9960', '#E8C88A', '#BB8855', '#D0B068',
    ];
    const bh = 128 / bands.length;
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(0, i * bh, 256, bh + 1);
    }
    // Slight wave distortion on band edges
    for (let i = 1; i < bands.length; i++) {
      const y = i * bh;
      ctx.strokeStyle = bands[i];
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < 256; x++) {
        ctx.lineTo(x, y + Math.sin(x * 0.08) * 2);
      }
      ctx.stroke();
    }
    // Great Red Spot
    ctx.fillStyle = '#CC4422';
    ctx.beginPath(); ctx.ellipse(100, 68, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#DD6644';
    ctx.beginPath(); ctx.ellipse(100, 68, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(c);
  }

  static _saturnTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    const bands = [
      '#E8D898', '#D4C080', '#F0E0A0', '#C8B468', '#E0D090',
      '#D0B870', '#ECD898', '#C8A858', '#E0D090', '#D4C080',
      '#E8D898', '#C8B060', '#F0E0A0', '#D0B870',
    ];
    const bh = 128 / bands.length;
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i];
      ctx.fillRect(0, i * bh, 256, bh + 1);
    }
    // Subtle north pole darker tone
    ctx.fillStyle = 'rgba(100,90,60,0.2)';
    ctx.fillRect(0, 0, 256, 12);
    return new THREE.CanvasTexture(c);
  }
}
