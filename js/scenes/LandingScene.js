import * as THREE from 'three';
import { Planet } from '../entities/Planet.js';
import { GameState } from '../game.js';
import { DESTINATIONS, DESTINATION_MAP, REQUIRED_DESTINATIONS } from '../data/solarSystem.js';

const Phase = { ENTERING: 'ENTERING', FACTS: 'FACTS', QUIZ: 'QUIZ', WAIT_DISMISS: 'WAIT_DISMISS', POSTCARD_OFFER: 'POSTCARD_OFFER', COMPOSING: 'COMPOSING', DONE: 'DONE' };

export class LandingScene {
  constructor(game) {
    this.game = game;
    this.scene = null;
    this.camera = null;
    this.planet = null;
    this.phase = Phase.ENTERING;
    this.planetData = null;
    this.enterDelay = 0;
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    this.camera.position.set(0, 2, 12);
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

    // Lights
    this.scene.add(new THREE.AmbientLight(0x334455, 0.6));
    const dirLight = new THREE.DirectionalLight(0xFFEECC, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    this._initialized = true;
  }

  enter(data) {
    this.planetData = data?.planet;
    // Brief delay so the enter/space press from asteroid scene doesn't carry over
    this.phase = Phase.ENTERING;
    this.enterDelay = 0.3;

    // Remove old planet and parent
    if (this.planet) {
      this.scene.remove(this.planet.group);
    }
    if (this._parentPlanet) {
      this.scene.remove(this._parentPlanet.group);
      this._parentPlanet = null;
    }

    if (this.planetData) {
      this.planet = new Planet(this.planetData);
      // Scale up for backdrop
      this.planet.group.scale.setScalar(1.5);
      this.scene.add(this.planet.group);

      // If moon, show parent planet in background
      if (this.planetData.parent && DESTINATION_MAP[this.planetData.parent]) {
        const parentData = DESTINATION_MAP[this.planetData.parent];
        this._parentPlanet = new Planet(parentData);
        const pScale = parentData.size * 1.5;
        this._parentPlanet.group.scale.setScalar(pScale);
        this._parentPlanet.group.position.set(-20, 8, -40);
        this.scene.add(this._parentPlanet.group);
      }

      // Show facts and read them aloud
      this.game.ui.showFacts(this.planetData);
      this.game.tts.speak(
        this.planetData.name + '. ' + this.planetData.facts.join('. ')
      );
      this.game.playTone(660, 0.3, 'sine', 0.06);
    }
  }

  exit() {
    this.game.ui.hideFacts();
    this.game.ui.hideQuiz();
    this.game.ui.hidePostcardPrompt();
  }

  update(dt) {
    // Rotate planet backdrop
    if (this.planet) {
      this.planet.mesh.rotation.y += dt * 0.2;
    }
    if (this._parentPlanet) {
      this._parentPlanet.mesh.rotation.y += dt * 0.08;
    }

    const { input } = this.game;

    switch (this.phase) {
      case Phase.ENTERING:
        // Wait a brief moment so stale key presses are consumed
        this.enterDelay -= dt;
        if (this.enterDelay <= 0) {
          this.phase = Phase.FACTS;
        }
        break;

      case Phase.FACTS:
        if (input.enter) {
          this.game.ui.hideFacts();
          if (this.planetData.quizzes && this.planetData.quizzes.length > 0) {
            this.phase = Phase.QUIZ;
            const quiz = this.planetData.quizzes[Math.floor(Math.random() * this.planetData.quizzes.length)];
            this.game.tts.speak(quiz.question);
            this.game.ui.showQuiz(quiz, (correct) => {
              if (correct) {
                this.game.quizStreak++;
                this.game.addScore(10);
                this.game.ui.showScorePopup(10, 'Correct! Amazing!');
                this.game.ui.flashScreen('celebrate');
                this.game.tts.speak('Correct! Amazing!');
                this.game.playMelody([[784, 0.1], [988, 0.1], [1175, 0.2]]);
              } else {
                this.game.quizStreak = 0;
                this.game.addScore(3);
                this.game.ui.showScorePopup(3, 'Good try! Keep exploring!');
                this.game.tts.speak('Good try! Keep exploring!');
                this.game.playTone(440, 0.2);
              }
              this.game.checkAchievements();
              // After answering, wait for Enter to dismiss
              this.phase = Phase.WAIT_DISMISS;
            });
          } else if (this.game.photos && !document.body.classList.contains('touch-device')) {
            this.phase = Phase.POSTCARD_OFFER;
            this.game.ui.showPostcardPrompt();
          } else {
            this.phase = Phase.DONE;
          }
        }
        break;

      case Phase.QUIZ:
        // Waiting for user to click a quiz option (handled by callback above)
        break;

      case Phase.WAIT_DISMISS:
        if (input.enter) {
          // Offer postcard if photo system is available (skip on touch devices)
          if (this.game.photos && !document.body.classList.contains('touch-device')) {
            this.game.ui.hideQuiz();
            this.phase = Phase.POSTCARD_OFFER;
            this.game.ui.showPostcardPrompt();
          } else {
            this.phase = Phase.DONE;
          }
        }
        break;

      case Phase.POSTCARD_OFFER:
        if (input.enter) {
          // Skip postcard
          this.game.ui.hidePostcardPrompt();
          this.phase = Phase.DONE;
        } else if (this.game.input.wasPressed('KeyC')) {
          this.game.ui.hidePostcardPrompt();
          // Get photo from orbit auto-capture or capture current scene
          const photoUrl = this.game._lastOrbitPhoto ||
            this.game.photos.capture(this.game.renderer, this.scene, this.camera);
          this.phase = Phase.COMPOSING;
          this.game.photos.composePostcard(photoUrl, this.planetData, this.game.playerName)
            .then(postcardUrl => {
              this.game.photos.savePostcard(postcardUrl, {
                planet: this.planetData.name,
                planetId: this.planetData.id,
              });
              this.game.ui.showScorePopup(0, 'Postcard saved!');
              this.game.playMelody([[660, 0.1], [880, 0.1], [1047, 0.15]]);
              this.game.tts.speak('Postcard saved!');
              setTimeout(() => { this.phase = Phase.DONE; }, 800);
            });
        }
        break;

      case Phase.COMPOSING:
        // Waiting for postcard to finish composing
        break;

      case Phase.DONE:
        this.game.ui.hideQuiz();
        // Mark as visited and award exploration points
        if (this.planetData) {
          this.game.addScore(5);
          this.game.ui.showScorePopup(5, `${this.planetData.name} explored!`);
          this.game.markVisited(this.planetData.id);
          // Add journal entry
          this.game.storage.addJournalEntry(this.planetData.id, this.planetData);
        }

        // Check victory — only required destinations count
        const requiredVisited = REQUIRED_DESTINATIONS.filter(d => this.game.visited.has(d.id)).length;
        if (requiredVisited >= REQUIRED_DESTINATIONS.length) {
          this.game.setState(GameState.VICTORY);
        } else {
          this.game.setState(GameState.SOLAR_SYSTEM);
        }
        break;
    }
  }

  static _starTexture() {
    if (LandingScene._cachedTex) return LandingScene._cachedTex;
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    LandingScene._cachedTex = new THREE.CanvasTexture(c);
    return LandingScene._cachedTex;
  }
}
