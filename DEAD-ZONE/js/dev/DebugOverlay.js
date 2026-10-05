/**
 * DebugOverlay — HUD debug hiển thị FPS, entity count, hệ thống
 * Toggle bằng F1
 */
export class DebugOverlay {
  constructor() {
    this._el      = document.getElementById('debug-overlay');
    this._content = document.getElementById('debug-content');
    this.visible  = false;
    this._rows    = {};    // name → value để update từng phần
    this._canvas  = null;  // canvas debug (hitbox, pathfinding, v.v.)
  }

  /**
   * Toggle hiển thị
   */
  toggle() {
    this.visible = !this.visible;
    this._el.classList.toggle('debug-overlay--hidden', !this.visible);
  }

  show()  { this.visible = true;  this._el.classList.remove('debug-overlay--hidden'); }
  hide()  { this.visible = false; this._el.classList.add('debug-overlay--hidden'); }

  /**
   * Set giá trị một hàng debug
   * @param {string} key
   * @param {string|number} value
   * @param {string} [color='#ffff00']
   */
  set(key, value, color = '#ffff00') {
    this._rows[key] = { value, color };
  }

  /**
   * Xóa một hàng
   * @param {string} key
   */
  remove(key) {
    delete this._rows[key];
  }

  /**
   * Render — gọi mỗi frame để cập nhật DOM
   */
  render() {
    if (!this.visible) return;

    const lines = Object.entries(this._rows).map(([k, v]) =>
      `<div style="color:${v.color};display:flex;justify-content:space-between;gap:12px;">
        <span style="opacity:0.7">${k}</span>
        <span style="font-weight:700">${typeof v.value === 'number'
          ? v.value.toFixed(v.value % 1 !== 0 ? 2 : 0)
          : v.value}</span>
       </div>`
    );

    this._content.innerHTML = lines.join('');
  }

  /**
   * Helper: vẽ hitbox (circle) lên canvas debug
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x @param {number} y @param {number} r
   */
  drawCircle(ctx, x, y, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,255,0,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Vẽ AABB (rectangle hitbox)
   */
  drawRect(ctx, x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,100,0,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  /**
   * Vẽ vector (direction arrow)
   */
  drawVector(ctx, x, y, dx, dy, color = '#00ffff') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    ctx.restore();
  }
}
