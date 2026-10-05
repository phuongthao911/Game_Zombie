/**
 * GameLoop — Fixed timestep game loop
 * Logic chạy tại tốc độ cố định (60 UPS), render nội suy (uncapped FPS)
 * 
 * Tham khảo: "Fix Your Timestep!" - Gaffer On Games
 */
export class GameLoop {
  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.update - (dt: number, elapsed: number) => void
   * @param {Function} callbacks.render - (alpha: number) => void
   * @param {Function} [callbacks.onFPS]  - (fps: number, ups: number) => void
   */
  constructor({ update, render, onFPS }) {
    this._update = update;
    this._render = render;
    this._onFPS  = onFPS ?? null;

    this.TARGET_FPS  = 60;
    this.FIXED_DT    = 1 / this.TARGET_FPS;  // ~16.667ms
    this.MAX_UPDATES = 5;    // Tối đa update/frame để tránh spiral of death

    this._running      = false;
    this._rafId        = null;
    this._prevTime     = 0;
    this._accumulator  = 0;
    this._elapsed      = 0;   // total game time (giây)

    // FPS counter
    this._frameCount = 0;
    this._updateCount = 0;
    this._fpsTimer   = 0;
    this.fps  = 0;
    this.ups  = 0;
  }

  /** Bắt đầu game loop */
  start() {
    if (this._running) return;
    this._running    = true;
    this._prevTime   = performance.now();
    this._accumulator = 0;
    this._rafId = requestAnimationFrame(this._loop.bind(this));
  }

  /** Dừng game loop */
  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /** @type {boolean} */
  get running() { return this._running; }

  _loop(timestamp) {
    if (!this._running) return;
    this._rafId = requestAnimationFrame(this._loop.bind(this));

    // Tính delta time thực, giới hạn để tránh spike
    let frameTime = (timestamp - this._prevTime) / 1000;
    frameTime = Math.min(frameTime, 0.25); // max 250ms
    this._prevTime = timestamp;

    this._accumulator += frameTime;

    // ---- Fixed update ----
    let steps = 0;
    while (this._accumulator >= this.FIXED_DT && steps < this.MAX_UPDATES) {
      this._update(this.FIXED_DT, this._elapsed);
      this._elapsed     += this.FIXED_DT;
      this._accumulator -= this.FIXED_DT;
      steps++;
      this._updateCount++;
    }

    // ---- Render (với alpha = phần dư để nội suy) ----
    const alpha = this._accumulator / this.FIXED_DT;
    this._render(alpha);
    this._frameCount++;

    // ---- FPS counter ----
    this._fpsTimer += frameTime;
    if (this._fpsTimer >= 1.0) {
      this.fps = this._frameCount;
      this.ups = this._updateCount;
      this._frameCount = 0;
      this._updateCount = 0;
      this._fpsTimer -= 1.0;
      this._onFPS?.(this.fps, this.ups);
    }
  }
}
