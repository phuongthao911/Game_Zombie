/**
 * Scene / StateMachine — Quản lý màn hình và trạng thái game
 * 
 * Mỗi Scene có các lifecycle methods:
 *   onEnter(data?) — khi vào scene
 *   onExit()       — khi rời scene  
 *   update(dt, elapsed) — logic cố định
 *   render(ctx, alpha)  — vẽ
 */
export class Scene {
  /** @param {Game} game */
  constructor(game) {
    this.game = game;
  }

  /** @param {*} [data] */
  onEnter(data) {}
  onExit() {}

  /** @param {number} dt @param {number} elapsed */
  update(dt, elapsed) {}

  /** @param {CanvasRenderingContext2D} ctx @param {number} alpha */
  render(ctx, alpha) {}
}

// -------------------------------------------------------

export class StateMachine {
  constructor() {
    /** @type {Map<string, Scene>} */
    this._scenes = new Map();
    /** @type {Scene|null} */
    this._current = null;
    this._currentName = null;
    /** @type {Array<{name: string, data: *}>} */
    this._history = [];
  }

  /**
   * Đăng ký scene
   * @param {string} name
   * @param {Scene} scene
   */
  register(name, scene) {
    this._scenes.set(name, scene);
  }

  /**
   * Chuyển sang scene mới
   * @param {string} name
   * @param {*} [data]
   */
  change(name, data) {
    if (!this._scenes.has(name)) {
      console.error(`[StateMachine] Scene "${name}" not found`);
      return;
    }

    if (this._current) {
      this._current.onExit();
      this._history.push({ name: this._currentName, data: null });
      if (this._history.length > 10) this._history.shift();
    }

    this._currentName = name;
    this._current = this._scenes.get(name);
    this._current.onEnter(data);
  }

  /** Quay lại scene trước (nếu có) */
  back() {
    const prev = this._history.pop();
    if (prev) this.change(prev.name, prev.data);
  }

  /** @param {number} dt @param {number} elapsed */
  update(dt, elapsed) {
    this._current?.update(dt, elapsed);
  }

  /** @param {CanvasRenderingContext2D} ctx @param {number} alpha */
  render(ctx, alpha) {
    this._current?.render(ctx, alpha);
  }

  /** @returns {string|null} */
  get currentName() { return this._currentName; }

  /** @returns {boolean} */
  is(name) { return this._currentName === name; }
}

// ---- Scene names ----
export const SCENES = Object.freeze({
  LOADING: 'loading',
  MENU:    'menu',
  GAME:    'game',
  PAUSE:   'pause',
  UPGRADE: 'upgrade',
  GAMEOVER:'gameover',
});
