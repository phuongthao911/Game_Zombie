/**
 * Zombie — Thực thể kẻ địch với các biến thể AI (Normal, Runner, Tank, Bomber, Spitter)
 */
export class Zombie {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.type = 'NORMAL'; // 'NORMAL' | 'RUNNER' | 'TANK' | 'BOMBER' | 'SPITTER'

    this.speed = 85;
    this.radius = 15;
    this.maxHp = 50;
    this.hp = 50;
    this.damage = 10;
    this.alive = false;

    // Phản xạ sát thương & knockback
    this.hitFlash = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    // Animation & Timers
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spitTimer = 1.5;
  }

  init(x, y, speed = 85, maxHp = 50, damage = 10, type = 'NORMAL') {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.type = type;

    // Cấu hình theo từng loại zombie
    switch (type) {
      case 'RUNNER':
        this.speed = Math.max(135, speed * 1.5);
        this.maxHp = Math.round(maxHp * 0.6);
        this.damage = Math.round(damage * 0.8);
        this.radius = 12.5;
        break;
      case 'TANK':
        this.speed = Math.round(speed * 0.62);
        this.maxHp = Math.round(maxHp * 3.4);
        this.damage = Math.round(damage * 1.8);
        this.radius = 24;
        break;
      case 'BOMBER':
        this.speed = Math.round(speed * 0.95);
        this.maxHp = Math.round(maxHp * 0.8);
        this.damage = Math.round(damage * 1.2);
        this.radius = 16;
        break;
      case 'SPITTER':
        this.speed = Math.round(speed * 0.75);
        this.maxHp = Math.round(maxHp * 0.9);
        this.damage = damage;
        this.radius = 14;
        this.spitTimer = 1.0 + Math.random() * 1.5;
        break;
      default: // 'NORMAL'
        this.speed = speed;
        this.maxHp = maxHp;
        this.damage = damage;
        this.radius = 15;
        break;
    }

    this.hp = this.maxHp;
    this.alive = true;
    this.hitFlash = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.angle = 0;
  }

  /**
   * Cập nhật AI của Zombie
   * @param {number} dt
   * @param {number} targetX
   * @param {number} targetY
   * @returns {{ shouldSpit?: boolean, x?: number, y?: number, targetX?: number, targetY?: number }}
   */
  update(dt, targetX, targetY) {
    if (!this.alive) return {};

    this.prevX = this.x;
    this.prevY = this.y;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      this.angle = Math.atan2(dy, dx);
    }

    let result = {};

    // Hành vi di chuyển theo loại
    if (this.type === 'SPITTER') {
      // Spitter giữ khoảng cách lý tưởng từ 280 - 400px để nhổ acid
      this.spitTimer -= dt;
      if (this.spitTimer <= 0 && dist < 500) {
        this.spitTimer = 2.4;
        result = { shouldSpit: true, x: this.x, y: this.y, targetX, targetY };
      }

      if (dist < 260) {
        // Lùi lại nếu người chơi tới quá gần
        this.vx = -(dx / dist) * this.speed;
        this.vy = -(dy / dist) * this.speed;
      } else if (dist > 380) {
        // Tiến tới nếu ở quá xa
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      } else {
        // Đi ngang vòng tròn (Strafing)
        this.vx = -(dy / dist) * (this.speed * 0.6);
        this.vy =  (dx / dist) * (this.speed * 0.6);
      }
    } else {
      // Các loại zombie khác: Lao thẳng vào người chơi
      if (dist > 1) {
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    }

    // Áp dụng di chuyển + knockback
    this.x += (this.vx + this.knockbackVx) * dt;
    this.y += (this.vy + this.knockbackVy) * dt;

    // Giảm dần knockback
    const drag = this.type === 'TANK' ? 18 : 10;
    this.knockbackVx *= Math.max(0, 1 - drag * dt);
    this.knockbackVy *= Math.max(0, 1 - drag * dt);

    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - dt);
    }

    this.bobPhase += dt * (this.type === 'RUNNER' ? 10 : 5);
    return result;
  }

  takeDamage(amount, hitAngle = 0, knockbackForce = 180) {
    if (!this.alive) return false;

    // Tank giảm 20% sát thương nhận vào
    const actualDamage = this.type === 'TANK' ? Math.round(amount * 0.8) : amount;
    this.hp -= actualDamage;
    this.hitFlash = 0.08;

    // Tank có khả năng chống đẩy lùi mạnh
    const force = this.type === 'TANK' ? knockbackForce * 0.35 : knockbackForce;
    this.knockbackVx = Math.cos(hitAngle) * force;
    this.knockbackVy = Math.sin(hitAngle) * force;

    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  render(ctx, alpha) {
    if (!this.alive) return;

    const rx = this.prevX + (this.x - this.prevX) * alpha;
    const ry = this.prevY + (this.y - this.prevY) * alpha;
    const bob = Math.sin(this.bobPhase) * 1.5;

    ctx.save();

    // Bóng dưới chân
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(rx, ry + this.radius + 3, this.radius * 0.95, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tay vươn tới
    ctx.save();
    ctx.translate(rx, ry + bob);
    ctx.rotate(this.angle);

    let armColor = '#7f1d1d';
    if (this.type === 'RUNNER') armColor = '#ea580c';
    if (this.type === 'TANK')   armColor = '#334155';
    if (this.type === 'BOMBER') armColor = '#84cc16';
    if (this.type === 'SPITTER')armColor = '#15803d';

    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : armColor;
    const armW = this.radius * 0.8;
    const armH = this.radius * 0.3;
    ctx.beginPath();
    ctx.roundRect(this.radius * 0.3, -this.radius * 0.6, armW, armH, 2);
    ctx.roundRect(this.radius * 0.3,  this.radius * 0.3, armW, armH, 2);
    ctx.fill();
    ctx.restore();

    // Thân zombie
    ctx.save();
    ctx.translate(rx, ry + bob);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
    } else {
      const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);

      if (this.type === 'RUNNER') {
        grad.addColorStop(0, '#fb923c');
        grad.addColorStop(1, '#c2410c');
      } else if (this.type === 'TANK') {
        grad.addColorStop(0, '#64748b');
        grad.addColorStop(1, '#1e293b');
      } else if (this.type === 'BOMBER') {
        grad.addColorStop(0, '#facc15');
        grad.addColorStop(1, '#4d7c0f');
      } else if (this.type === 'SPITTER') {
        grad.addColorStop(0, '#4ade80');
        grad.addColorStop(1, '#14532d');
      } else {
        grad.addColorStop(0, '#b91c1c');
        grad.addColorStop(1, '#581c87');
      }
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#270722';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fill();

    // Mắt zombie
    if (this.hitFlash <= 0) {
      ctx.fillStyle = this.type === 'BOMBER' ? '#ef4444' : '#fef08a';
      ctx.shadowBlur = 6;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(this.radius * 0.5, -this.radius * 0.28, 2.5, 0, Math.PI * 2);
      ctx.arc(this.radius * 0.5,  this.radius * 0.28, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Thanh máu mini khi bị mất máu
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = this.radius * 1.8;
      const barH = 3.5;
      const barX = rx - barW / 2;
      const barY = ry - this.radius - 8;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = this.type === 'TANK' ? '#38bdf8' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
    }

    ctx.restore();
  }
}
