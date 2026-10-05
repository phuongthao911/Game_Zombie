/**
 * Bullet — Thực thể đạn của người chơi
 * Được quản lý qua Pool để không cấp phát bộ nhớ liên tục trong game loop
 */
export class Bullet {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.speed = 850;
    this.radius = 3.5;
    this.damage = 25;
    this.life = 0;
    this.maxLife = 1.2;
    this.alive = false;
  }

  /**
   * Khởi tạo viên đạn khi lấy ra từ Pool
   */
  init(x, y, angle, speed = 850, damage = 25, maxLife = 1.2) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.maxLife = maxLife;
    this.life = 0;
    this.alive = true;

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    if (!this.alive) return;

    this.prevX = this.x;
    this.prevY = this.y;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
    }
  }

  render(ctx, alpha) {
    if (!this.alive) return;

    const rx = this.prevX + (this.x - this.prevX) * alpha;
    const ry = this.prevY + (this.y - this.prevY) * alpha;

    ctx.save();
    // Tracer line đuôi đạn
    const tailLength = 14;
    const tailX = rx - Math.cos(this.angle) * tailLength;
    const tailY = ry - Math.sin(this.angle) * tailLength;

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#facc15';

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
    ctx.lineWidth = this.radius * 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    // Đầu đạn phát sáng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
