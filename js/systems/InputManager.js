export class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._touchSteerX = 0; // analog joystick values (-1 to 1)
    this._touchSteerY = 0;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this._initTouchControls();
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

  // Analog steering (-1 to 1). Joystick gives proportional values;
  // keyboard gives full -1/0/1.
  get steerX() {
    if (this._touchSteerX !== 0) return this._touchSteerX;
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) return -1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) return 1;
    return 0;
  }

  get steerY() {
    if (this._touchSteerY !== 0) return this._touchSteerY;
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) return -1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) return 1;
    return 0;
  }

  _initTouchControls() {
    this._touchContainer = document.getElementById('touch-controls');
    if (!this._touchContainer) return;

    // Show controls on touch-capable devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this._showTouchControls();
    } else {
      // Fallback: show on first touch anywhere (covers late device-mode toggle)
      document.addEventListener('touchstart', () => this._showTouchControls(), { once: true });
    }

    // Virtual joystick for steering
    this._initJoystick();

    // Action buttons (star, pause, speed)
    const buttons = this._touchContainer.querySelectorAll('.touch-btn');
    for (const btn of buttons) {
      const key = btn.dataset.key;
      if (!key) continue;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!this.keys[key]) {
          this.justPressed[key] = true;
        }
        this.keys[key] = true;
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.keys[key] = false;
      }, { passive: false });

      btn.addEventListener('touchcancel', () => {
        this.keys[key] = false;
      });
    }
  }

  _initJoystick() {
    const steerZone = document.getElementById('touch-steer');
    const joystick = document.getElementById('touch-joystick');
    const nub = joystick?.querySelector('.joystick-nub');
    if (!steerZone || !joystick || !nub) return;

    let activeTouch = null;
    let originX = 0, originY = 0;
    const DEAD_ZONE = 15;
    const MAX_DIST = 50;

    steerZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (activeTouch !== null) return; // already steering
      const touch = e.changedTouches[0];
      activeTouch = touch.identifier;
      originX = touch.clientX;
      originY = touch.clientY;

      // Show joystick visual at touch point
      joystick.style.display = 'block';
      joystick.style.left = (originX - 60) + 'px';
      joystick.style.top = (originY - 60) + 'px';
      nub.style.transform = 'translate(-50%, -50%)';
    }, { passive: false });

    steerZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier !== activeTouch) continue;
        const dx = touch.clientX - originX;
        const dy = touch.clientY - originY;

        // Clamp nub visual to max radius
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clamped = Math.min(dist, MAX_DIST);
        const angle = Math.atan2(dy, dx);
        const nubX = Math.cos(angle) * clamped;
        const nubY = Math.sin(angle) * clamped;
        nub.style.transform = `translate(calc(-50% + ${nubX}px), calc(-50% + ${nubY}px))`;

        // Binary arrow keys (for mini-games)
        this.keys['ArrowLeft'] = dx < -DEAD_ZONE;
        this.keys['ArrowRight'] = dx > DEAD_ZONE;
        this.keys['ArrowUp'] = dy < -DEAD_ZONE;
        this.keys['ArrowDown'] = dy > DEAD_ZONE;

        // Analog steer values — max touch steer is 55% of keyboard
        const TOUCH_MAX = 0.55;
        this._touchSteerX = Math.max(-1, Math.min(1, dx / MAX_DIST)) * TOUCH_MAX;
        this._touchSteerY = Math.max(-1, Math.min(1, dy / MAX_DIST)) * TOUCH_MAX;
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier !== activeTouch) continue;
        activeTouch = null;
        joystick.style.display = 'none';
        this.keys['ArrowLeft'] = false;
        this.keys['ArrowRight'] = false;
        this.keys['ArrowUp'] = false;
        this.keys['ArrowDown'] = false;
        this._touchSteerX = 0;
        this._touchSteerY = 0;
      }
    };

    steerZone.addEventListener('touchend', endTouch, { passive: false });
    steerZone.addEventListener('touchcancel', endTouch, { passive: false });
  }

  _showTouchControls() {
    if (!this._touchContainer) return;
    this._touchContainer.classList.remove('hidden');
    document.body.classList.add('touch-device');
  }
}
