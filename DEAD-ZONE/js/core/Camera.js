/**
 * Camera — Theo dõi mục tiêu, giới hạn biên, camera shake
 */
export class Camera {
  /**
   * @param {number} viewW - chiều rộng viewport (canvas)
   * @param {number} viewH - chiều cao viewport
   */
  constructor(viewW, viewH) {
    this.x = 0;          // world position của góc trên-trái camera
    this.y = 0;
    this.viewW = viewW;
    this.viewH = viewH;

    // Camera smoothing
    this._targetX = 0;
    this._targetY = 0;
    this._lerpFactor = 0.12;

    // World bounds (set khi load map)
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = Infinity;
    this.boundsH = Infinity;

    // Shake
    this._traumaDecay = 2.5;   // units/s
    this._trauma = 0;          // 0..1
    this._shakeX = 0;
    this._shakeY = 0;
    this._maxShakeX = 16;
    this._maxShakeY = 12;
  }

  /**
   * Đặt mục tiêu theo dõi (thường là player center)
   * @param {number} wx - world x
   * @param {number} wy - world y
   */
  follow(wx, wy) {
    this._targetX = wx - this.viewW / 2;
    this._targetY = wy - this.viewH / 2;
  }

  /**
   * Thêm trauma để tạo camera shake
   * @param {number} amount - 0..1
   */
  shake(amount) {
    this._trauma = Math.min(1, this._trauma + amount);
  }

  /**
   * Cập nhật vị trí camera (gọi trong game loop)
   * @param {number} dt - delta time (giây)
   */
  update(dt) {
    // Lerp toward target
    this.x += (this._targetX - this.x) * Math.min(1, this._lerpFactor * (dt * 60));
    this.y += (this._targetY - this.y) * Math.min(1, this._lerpFactor * (dt * 60));

    // Clamp to world bounds
    this.x = Math.max(this.boundsX, Math.min(this.boundsW - this.viewW, this.x));
    this.y = Math.max(this.boundsY, Math.min(this.boundsH - this.viewH, this.y));

    // Shake
    if (this._trauma > 0) {
      this._trauma = Math.max(0, this._trauma - this._traumaDecay * dt);
      const sq = this._trauma * this._trauma;
      this._shakeX = (Math.random() * 2 - 1) * this._maxShakeX * sq;
      this._shakeY = (Math.random() * 2 - 1) * this._maxShakeY * sq;
    } else {
      this._shakeX = 0;
      this._shakeY = 0;
    }
  }

  /**
   * Áp dụng transform camera lên canvas context
   * @param {CanvasRenderingContext2D} ctx
   */
  applyTransform(ctx) {
    ctx.translate(
      -Math.round(this.x + this._shakeX),
      -Math.round(this.y + this._shakeY)
    );
  }

  /**
   * Chuyển tọa độ màn hình → world
   * @param {number} sx @param {number} sy
   * @returns {{x: number, y: number}}
   */
  screenToWorld(sx, sy) {
    return {
      x: sx + this.x + this._shakeX,
      y: sy + this.y + this._shakeY,
    };
  }

  /**
   * Chuyển tọa độ world → màn hình
   * @param {number} wx @param {number} wy
   * @returns {{x: number, y: number}}
   */
  worldToScreen(wx, wy) {
    return {
      x: wx - this.x - this._shakeX,
      y: wy - this.y - this._shakeY,
    };
  }

  /**
   * Kiểm tra AABB có nằm trong viewport (culling)
   * @param {number} wx @param {number} wy @param {number} w @param {number} h
   * @param {number} [margin=64]
   * @returns {boolean}
   */
  isVisible(wx, wy, w, h, margin = 64) {
    return (
      wx + w + margin > this.x &&
      wy + h + margin > this.y &&
      wx - margin < this.x + this.viewW &&
      wy - margin < this.y + this.viewH
    );
  }

  /**
   * Cập nhật kích thước viewport khi resize
   */
  resize(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
  }

  /**
   * Đặt giới hạn thế giới
   */
  setBounds(x, y, w, h) {
    this.boundsX = x;
    this.boundsY = y;
    this.boundsW = w;
    this.boundsH = h;
  }

  /** Di chuyển ngay (không lerp) */
  snapTo(wx, wy) {
    this.x = this._targetX = wx - this.viewW / 2;
    this.y = this._targetY = wy - this.viewH / 2;
  }
}
