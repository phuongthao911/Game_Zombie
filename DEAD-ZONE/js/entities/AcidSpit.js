/**
 * AcidSpit — Đạn dịch acid độc hại do zombie Spitter bắn ra
 */
export class AcidSpit {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 5.5;
    this.damage = 14;
    this.alive = false;
    this.life = 0;
    this.maxLife = 1.6;
  }

  init(x, y, targetX, targetY, speed = 360, damage = 14) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.life = 0;
    this.alive = true;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;
    } else {
      this.vx = speed;
      this.vy = 0;
    }
  }

  update(dt) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#22c55e';

    // Bọc ngoài màu xanh chuối phát quang
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Lõi độc axit
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
