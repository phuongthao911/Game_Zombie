/**
 * Grenade — Lựu đạn nổ chậm gây sát thương diện rộng AOE
 */
export class Grenade {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 6;
    this.fuseTime = 0.85; // 0.85s phát nổ
    this.fuseTimer = 0;
    this.explosionRadius = 175;
    this.damage = 190;
    this.alive = false;
    this.friction = 0.93;
    this.blinkPhase = 0;
  }

  init(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);
    // Vận tốc ném tỉ lệ theo khoảng cách chuột (tối đa 480)
    const throwSpeed = Math.min(520, Math.max(180, dist * 1.6));

    if (dist > 1) {
      this.vx = (dx / dist) * throwSpeed;
      this.vy = (dy / dist) * throwSpeed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    this.fuseTimer = this.fuseTime;
    this.alive = true;
    this.blinkPhase = 0;
  }

  /**
   * Cập nhật chuyển động của lựu đạn
   * @param {number} dt
   * @returns {boolean} true nếu lựu đạn vừa phát nổ
   */
  update(dt) {
    if (!this.alive) return false;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;

    this.fuseTimer -= dt;
    this.blinkPhase += dt * 18; // Nhấp nháy đèn đỏ báo động

    if (this.fuseTimer <= 0) {
      this.alive = false;
      return true; // Kích hoạt vụ nổ!
    }
    return false;
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    // Bóng dưới đất
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 4, this.radius * 0.9, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thân quả lựu đạn màu xanh ô liu
    ctx.fillStyle = '#3f6212';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Đèn LED báo nổ nhấp nháy đỏ
    const isBlinkOn = Math.sin(this.blinkPhase) > 0;
    ctx.fillStyle = isBlinkOn ? '#ef4444' : '#7f1d1d';
    ctx.shadowBlur = isBlinkOn ? 8 : 0;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.x, this.y - 1, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
