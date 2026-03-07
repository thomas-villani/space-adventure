export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _onKeyDown(e) {
    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
    }
    this.keys[e.code] = true;
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasPressed(code) {
    return !!this.justPressed[code];
  }

  // Call at end of each frame
  resetFrame() {
    this.justPressed = {};
  }

  // Check any key pressed this frame
  anyKeyPressed() {
    return Object.keys(this.justPressed).length > 0;
  }

  get left() {
    return this.isDown('ArrowLeft') || this.isDown('KeyA');
  }

  get right() {
    return this.isDown('ArrowRight') || this.isDown('KeyD');
  }

  get up() {
    return this.isDown('ArrowUp') || this.isDown('KeyW');
  }

  get down() {
    return this.isDown('ArrowDown') || this.isDown('KeyS');
  }

  get enter() {
    return this.wasPressed('Enter') || this.wasPressed('Space');
  }
}
