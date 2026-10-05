/**
 * Particle — Hiệu ứng hạt (tia lửa, máu văng, khói súng)
 */
export class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 2;
    this.color = '#ff0000';
    this.life = 0;
    this.maxLife = 0.5;
    this.alive = false;
    this.drag = 0.94;
  }

  init(x, y, vx, vy, radius = 2.5, color = '#dc2626', maxLife = 0.45) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.maxLife = maxLife;
    this.life = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= this.drag;
    this.vy *= this.drag;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
    }
  }

  render(ctx) {
    if (!this.alive) return;

    const progress = this.life / this.maxLife;
    const alpha = Math.max(0, 1 - progress);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (1 - progress * 0.4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
