/**
 * Pickup — Vật phẩm rơi ra từ zombie (EXP Orbs & Coin)
 * Hỗ trợ lực hút nam châm từ người chơi (Magnet)
 */
export class Pickup {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.type = 'EXP'; // 'EXP' hoặc 'COIN'
    this.value = 5;
    this.radius = 6;
    this.alive = false;
    this.life = 0;
    this.maxLife = 60; // 60s tồn tại trước khi biến mất
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.isHoming = false;
  }

  init(x, y, type = 'EXP', value = 5) {
    this.x = x + (Math.random() * 20 - 10);
    this.y = y + (Math.random() * 20 - 10);
    // Văng nhẹ ra xung quanh khi rơi
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 50;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.type = type;
    this.value = value;
    this.radius = type === 'COIN' ? 6.5 : 5.5;
    this.alive = true;
    this.life = 0;
    this.isHoming = false;
  }

  update(dt, playerX, playerY, magnetRadius = 130) {
    if (!this.alive) return;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.alive = false;
      return;
    }

    this.pulsePhase += dt * 5;

    // Giảm tốc độ văng ban đầu
    this.vx *= 0.90;
    this.vy *= 0.90;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    // Kích hoạt hút nam châm
    if (dist < magnetRadius || this.isHoming) {
      this.isHoming = true;
      const flySpeed = Math.min(650, 220 + (1 - dist / magnetRadius) * 450);
      if (dist > 1) {
        this.vx = (dx / dist) * flySpeed;
        this.vy = (dy / dist) * flySpeed;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.18;
    const r = this.radius * pulse;

    if (this.type === 'EXP') {
      // Hạt EXP ngọc xanh ngọc bích / Cyan phát sáng
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';

      ctx.beginPath();
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Tâm sáng trắng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Đồng tiền Coin vàng óng
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#eab308';
      ctx.fillStyle = '#facc15';

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.pulsePhase * 0.5);

      // Hình thoi vàng
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.2);
      ctx.lineTo(r * 1.1, 0);
      ctx.lineTo(0, r * 1.2);
      ctx.lineTo(-r * 1.1, 0);
      ctx.closePath();
      ctx.fill();

      // Điểm sáng kim cương
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}
