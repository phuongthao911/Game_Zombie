/**
 * Input — Hệ thống input trừu tượng hóa hành động
 * Hỗ trợ bàn phím, chuột, Gamepad API
 * Phân biệt pressed (vừa nhấn), held (đang giữ), released (vừa thả)
 */
export class Input {
  constructor() {
    // ---- Keyboard ----
    /** @type {Set<string>} */
    this._keys    = new Set();
    /** @type {Set<string>} */
    this._pressed = new Set();
    /** @type {Set<string>} */
    this._released = new Set();

    // ---- Mouse ----
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    this._mouseButtons = new Set();
    this._mousePressed = new Set();
    this._mouseReleased = new Set();

    // ---- Gamepad ----
    this._gamepad = null;
    this._gamepadPrev = {};

    // ---- Bindings (có thể custom) ----
    this._bindings = {
      moveUp:    ['KeyW', 'ArrowUp'],
      moveDown:  ['KeyS', 'ArrowDown'],
      moveLeft:  ['KeyA', 'ArrowLeft'],
      moveRight: ['KeyD', 'ArrowRight'],
      shoot:     ['mouse0'],
      dash:      ['Space', 'ShiftLeft'],
      reload:    ['KeyR'],
      interact:  ['KeyE'],
      pause:     ['Escape', 'KeyP'],
      skill1:    ['KeyQ'],
      grenade:   ['KeyQ', 'KeyG'],
      weapon1:   ['Digit1'],
      weapon2:   ['Digit2'],
      weapon3:   ['Digit3'],
      weapon4:   ['Digit4'],
      debug:     ['F1'],
      debugAI:   ['F2'],
      debugPhys: ['F3'],
      cheatWave: ['F5'],
      cheatGod:  ['F9'],
    };

    this._bindListeners();
  }

  _bindListeners() {
    document.addEventListener('keydown', e => {
      if (!this._keys.has(e.code)) {
        this._pressed.add(e.code);
      }
      this._keys.add(e.code);
      // Ngăn default cho phím game
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', e => {
      this._keys.delete(e.code);
      this._released.add(e.code);
    });

    document.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    document.addEventListener('mousedown', e => {
      const key = `mouse${e.button}`;
      if (!this._mouseButtons.has(key)) this._mousePressed.add(key);
      this._mouseButtons.add(key);
    });

    document.addEventListener('mouseup', e => {
      const key = `mouse${e.button}`;
      this._mouseButtons.delete(key);
      this._mouseReleased.add(key);
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  /**
   * Gọi mỗi frame SAU khi xử lý input để reset trạng thái pressed/released
   */
  flush() {
    this._pressed.clear();
    this._released.clear();
    this._mousePressed.clear();
    this._mouseReleased.clear();
    this._pollGamepad();
  }

  _pollGamepad() {
    const pads = navigator.getGamepads?.() ?? [];
    this._gamepad = pads[0] ?? null;
  }

  // ---- Helpers ----

  /** Kiểm tra action đang được giữ */
  isHeld(action) {
    const keys = this._bindings[action];
    if (!keys) return false;
    return keys.some(k => k.startsWith('mouse')
      ? this._mouseButtons.has(k)
      : this._keys.has(k));
  }

  /** Kiểm tra action vừa được nhấn (chỉ true 1 frame) */
  isPressed(action) {
    const keys = this._bindings[action];
    if (!keys) return false;
    return keys.some(k => k.startsWith('mouse')
      ? this._mousePressed.has(k)
      : this._pressed.has(k));
  }

  /** Kiểm tra action vừa được thả */
  isReleased(action) {
    const keys = this._bindings[action];
    if (!keys) return false;
    return keys.some(k => k.startsWith('mouse')
      ? this._mouseReleased.has(k)
      : this._released.has(k));
  }

  /** Vector di chuyển đã normalize */
  getMovement() {
    let x = 0, y = 0;
    if (this.isHeld('moveLeft'))  x -= 1;
    if (this.isHeld('moveRight')) x += 1;
    if (this.isHeld('moveUp'))    y -= 1;
    if (this.isHeld('moveDown'))  y += 1;

    // Gamepad analog stick
    if (this._gamepad) {
      const ax = this._gamepad.axes[0] ?? 0;
      const ay = this._gamepad.axes[1] ?? 0;
      if (Math.abs(ax) > 0.15) x += ax;
      if (Math.abs(ay) > 0.15) y += ay;
    }

    // Normalize diagonal
    const len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  /**
   * Bind phím cho action (để config controls)
   * @param {string} action
   * @param {string[]} keys
   */
  rebind(action, keys) {
    this._bindings[action] = keys;
  }
}

// Singleton
export const input = new Input();
