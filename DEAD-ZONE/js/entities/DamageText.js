/**
 * DamageText — Số sát thương nổi lên khi bắn trúng zombie
 */
export class DamageText {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vy = -35;
    this.text = '';
    this.color = '#f87171';
    this.life = 0;
    this.maxLife = 0.6;
    this.alive = false;
  }

  init(x, y, text, color = '#f87171', maxLife = 0.6) {
    this.x = x + (Math.random() * 16 - 8);
    this.y = y + (Math.random() * 10 - 5);
    this.vy = -45;
    this.text = text;
    this.color = color;
    this.maxLife = maxLife;
    this.life = 0;
    this.alive = true;
  }

  update(dt) {
    if (!this.alive) return;

    this.y += this.vy * dt;
    this.vy *= 0.94;

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
    ctx.font = 'bold 13px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';

    // Viền đen
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, this.x, this.y);

    // Chữ màu
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}
