import * as THREE from 'three';
import { LandingScene } from './LandingScene.js';
import { GameState } from '../game.js';

const SKINS = {
  europa: {
    title: 'Ice Cracker!',
    iceColor: 0xCCDDFF,
    revealColor: 0x2244AA,
    revealLabel: 'Ocean revealed!',
    speak: 'Crack the ice!',
  },
  triton: {
    title: 'Ice Cracker!',
    iceColor: 0xCCDDCC,
    revealColor: 0x88CCAA,
    revealLabel: 'Geyser found!',
    speak: 'Crack the ice!',
  },
  pluto: {
    title: 'Ice Cracker!',
    iceColor: 0xDDCCAA,
    revealColor: 0xFF8899,
    revealLabel: 'Heart glacier!',
    speak: 'Crack the ice!',
  },
  ganymede: {
    title: 'Ice Cracker!',
    iceColor: 0x998877,
    revealColor: 0x4466AA,
    revealLabel: 'Ocean below!',
    speak: 'Crack the ice!',
  },
  callisto: {
    title: 'Ice Cracker!',
    iceColor: 0x666677,
    revealColor: 0x887766,
    revealLabel: 'Ancient surface!',
    speak: 'Crack the ice!',
  },
  charon: {
    title: 'Ice Cracker!',
    iceColor: 0x999999,
    revealColor: 0xAA4444,
    revealLabel: 'Red ice found!',
    speak: 'Crack the ice!',
  },
  makemake: {
    title: 'Ice Cracker!',
    iceColor: 0xDDAACC,
    revealColor: 0x664455,
    revealLabel: 'Surface found!',
    speak: 'Crack the ice!',
  },
  eris: {
    title: 'Ice Cracker!',
    iceColor: 0xEEEEDD,
    revealColor: 0x8888AA,
    revealLabel: 'Discovery!',
    speak: 'Crack the ice!',
  },
};

const DEFAULT_SKIN = SKINS.europa;

export class IceCrackerScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 0, 14);
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
    this.cracked = 0;
    this.totalBlocks = 12;
    this.done = false;

    // Grid cursor position
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.cols = 4;
    this.rows = 3;
    this._moveTimer = 0;

    // Clean up old objects
    for (const b of (this._oldBlocks || [])) {
      this.scene.remove(b.iceMesh);
      this.scene.remove(b.revealMesh);
    }
    this._oldBlocks = [];

    // Create ice block grid
    this._blocks = [];
    const spacingX = 2.8;
    const spacingY = 2.5;
    const offsetX = -(this.cols - 1) * spacingX / 2;
    const offsetY = -(this.rows - 1) * spacingY / 2;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = offsetX + c * spacingX;
        const y = offsetY + r * spacingY;

        // Ice block on top
        const iceGeo = new THREE.BoxGeometry(2.2, 2, 0.8);
        const iceMat = new THREE.MeshStandardMaterial({
          color: this.skin.iceColor,
          transparent: true,
          opacity: 0.85,
          roughness: 0.2,
          metalness: 0.3,
        });
        const iceMesh = new THREE.Mesh(iceGeo, iceMat);
        iceMesh.position.set(x, y, 0.4);
        this.scene.add(iceMesh);

        // Reveal surface underneath
        const revealGeo = new THREE.BoxGeometry(2.2, 2, 0.5);
        const revealMat = new THREE.MeshStandardMaterial({
          color: this.skin.revealColor,
          emissive: this.skin.revealColor,
          emissiveIntensity: 0.3,
          roughness: 0.6,
        });
        const revealMesh = new THREE.Mesh(revealGeo, revealMat);
        revealMesh.position.set(x, y, -0.1);
        revealMesh.visible = false;
        this.scene.add(revealMesh);

        this._blocks.push({
          row: r, col: c,
          x, y,
          iceMesh,
          revealMesh,
          cracked: false,
        });
      }
    }

    // Drill cursor
    if (this._cursor) this.scene.remove(this._cursor);
    this._cursor = new THREE.Group();

    // Glowing frame around selected block
    const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.5, 2.3, 1));
    const frameMat = new THREE.LineBasicMaterial({ color: 0x00FFAA, linewidth: 2 });
    const frame = new THREE.LineSegments(frameGeo, frameMat);
    this._cursor.add(frame);

    // Drill point
    const drillGeo = new THREE.ConeGeometry(0.25, 0.8, 8);
    const drillMat = new THREE.MeshBasicMaterial({
      color: 0x00FFAA,
      transparent: true,
      opacity: 0.8,
    });
    const drill = new THREE.Mesh(drillGeo, drillMat);
    drill.rotation.x = Math.PI;
    drill.position.z = 1;
    this._cursor.add(drill);

    this.scene.add(this._cursor);
    this._updateCursorPosition();

    this.game.ui.showMiniGameHUD(this.skin.title);
    this.game.ui.updateMiniGameProgress(0);
    this.game.tts.speak(this.skin.speak);
  }

  exit() {
    this.game.ui.hideMiniGameHUD();
    for (const b of this._blocks) {
      this.scene.remove(b.iceMesh);
      this.scene.remove(b.revealMesh);
    }
    this._oldBlocks = this._blocks;
    this._blocks = [];
  }

  update(dt) {
    this.timer += dt;
    const progress = Math.min(this.timer / this.duration, 1);
    this.game.ui.updateMiniGameProgress(progress);

    const { input } = this.game;

    // Move cursor with arrow keys (with repeat delay)
    this._moveTimer -= dt;
    if (this._moveTimer <= 0) {
      let moved = false;
      if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
        this.cursorCol = Math.max(0, this.cursorCol - 1); moved = true;
      } else if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
        this.cursorCol = Math.min(this.cols - 1, this.cursorCol + 1); moved = true;
      } else if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
        this.cursorRow = Math.min(this.rows - 1, this.cursorRow + 1); moved = true;
      } else if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
        this.cursorRow = Math.max(0, this.cursorRow - 1); moved = true;
      }
      if (moved) {
        this._moveTimer = 0.15;
        this._updateCursorPosition();
        this.game.playTone(600, 0.04, 'sine', 0.03);
      }
    }

    // Crack block on Space/Enter
    if (input.wasPressed('Space') || input.wasPressed('Enter')) {
      this._crackBlock();
    }

    // Animate cursor pulse
    const pulse = 0.9 + Math.sin(this.timer * 5) * 0.1;
    this._cursor.scale.setScalar(pulse);

    // Animate drill rotation
    if (this._cursor.children[1]) {
      this._cursor.children[1].rotation.y += dt * 8;
    }

    // Done
    if (this.timer >= this.duration && !this.done) {
      this._finish();
    }
  }

  _updateCursorPosition() {
    const block = this._blocks.find(b => b.row === this.cursorRow && b.col === this.cursorCol);
    if (block) {
      this._cursor.position.set(block.x, block.y, 0.6);
    }
  }

  _crackBlock() {
    const block = this._blocks.find(b => b.row === this.cursorRow && b.col === this.cursorCol);
    if (!block || block.cracked) return;

    block.cracked = true;
    block.iceMesh.visible = false;
    block.revealMesh.visible = true;
    this.cracked++;

    this.game.addScore(2);
    this.game.ui.showScorePopup(2, this.skin.revealLabel);

    // Shatter particles
    const pos = new THREE.Vector3(block.x, block.y, 0.4);
    this.game.particles.sparkle(pos, this.skin.iceColor, 12);
    this.game.playTone(400 + this.cracked * 60, 0.12, 'square', 0.06);

    // Check if all blocks cracked — bonus!
    if (this.cracked >= this.totalBlocks && !this.done) {
      this.game.addScore(5);
      this.game.ui.showScorePopup(5, 'All cracked! Bonus!');
      this.game.playMelody([[880, 0.1], [1047, 0.1], [1319, 0.15]]);
      this._finish();
    }
  }

  _finish() {
    if (this.done) return;
    this.done = true;
    const msg = this.cracked >= this.totalBlocks ? 'Perfect cracker!' : 'Great cracking!';
    this.game.ui.showScorePopup(0, msg);
    this.game.tts.speak(msg);
    this.game.playMelody([[523, 0.12], [659, 0.12], [784, 0.2]]);
    setTimeout(() => {
      this.game.setState(GameState.ORBIT, { planet: this.planetData });
    }, 1500);
  }
}
