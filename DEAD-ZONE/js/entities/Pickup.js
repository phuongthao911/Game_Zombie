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
    if (type === 'COIN') this.radius = 6.5;
    else if (type === 'AMMO') this.radius = 8.5;
    else if (type === 'MEDKIT') this.radius = 9.0;
    else this.radius = 5.5; // EXP

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
    } else if (this.type === 'COIN') {
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
    } else if (this.type === 'AMMO') {
      // Hộp đạn quân sự (Màu vàng cam Amber phát sáng)
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#fb923c';

      ctx.save();
      ctx.translate(this.x, this.y);

      // Vỏ hộp đạn kim loại màu xanh olive / cam
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-r * 0.9, -r * 0.65, r * 1.8, r * 1.3, 3);
      ctx.fill();
      ctx.stroke();

      // 3 khấc đạn vàng bên trong
      ctx.fillStyle = '#fb923c';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * (r * 0.45) - 1.5, -r * 0.35, 3, r * 0.7);
      }

      ctx.restore();
    } else if (this.type === 'MEDKIT') {
      // Hộp cứu thương y tế (Trắng phát sáng viền đỏ/xanh lá, chữ thập đỏ)
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#22c55e';

      ctx.save();
      ctx.translate(this.x, this.y);

      // Hộp cứu thương trắng
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-r * 0.95, -r * 0.8, r * 1.9, r * 1.6, 3);
      ctx.fill();
      ctx.stroke();

      // Chữ thập đỏ y tế
      ctx.fillStyle = '#ef4444';
      const crossW = r * 0.4;
      const crossL = r * 0.9;
      ctx.fillRect(-crossL * 0.5, -crossW * 0.5, crossL, crossW);
      ctx.fillRect(-crossW * 0.5, -crossL * 0.5, crossW, crossL);

      ctx.restore();
    }

    ctx.restore();
  }
}
