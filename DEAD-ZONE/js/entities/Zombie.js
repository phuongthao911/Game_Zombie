/**
 * Zombie — Thực thể kẻ địch cơ bản (Phase 2 Gray-box)
 * Tự động tìm đường hướng về mục tiêu (Player), có knockback và phản ứng sát thương
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

    // Animation
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  init(x, y, speed = 85, maxHp = 50, damage = 10) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = speed;
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.damage = damage;
    this.alive = true;
    this.hitFlash = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.angle = 0;
  }

  update(dt, targetX, targetY) {
    if (!this.alive) return;

    this.prevX = this.x;
    this.prevY = this.y;

    // Tính hướng về mục tiêu
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      this.angle = Math.atan2(dy, dx);
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    } else {
      this.vx = 0;
      this.vy = 0;
    }

    // Áp dụng di chuyển + knockback
    this.x += (this.vx + this.knockbackVx) * dt;
    this.y += (this.vy + this.knockbackVy) * dt;

    // Giảm dần knockback (drag)
    this.knockbackVx *= Math.max(0, 1 - 10 * dt);
    this.knockbackVy *= Math.max(0, 1 - 10 * dt);

    // Giảm thời gian chớp trắng khi dính đạn
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - dt);
    }

    // Animation lắc lư khi bước đi
    this.bobPhase += dt * (this.speed > 0 ? 5 : 0);
  }

  /**
   * Nhận sát thương và lực đẩy lùi
   * @param {number} amount
   * @param {number} hitAngle
   * @param {number} knockbackForce
   * @returns {boolean} true nếu zombie bị tiêu diệt
   */
  takeDamage(amount, hitAngle = 0, knockbackForce = 180) {
    if (!this.alive) return false;

    this.hp -= amount;
    this.hitFlash = 0.08; // 80ms flash trắng

    this.knockbackVx = Math.cos(hitAngle) * knockbackForce;
    this.knockbackVy = Math.sin(hitAngle) * knockbackForce;

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
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(rx, ry + this.radius + 3, this.radius * 0.9, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tay zombie vươn về phía trước
    ctx.save();
    ctx.translate(rx, ry + bob);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#7f1d1d';
    // Tay trái & tay phải
    ctx.beginPath();
    ctx.roundRect(this.radius * 0.4, -9, 12, 4.5, 2);
    ctx.roundRect(this.radius * 0.4, 4.5, 12, 4.5, 2);
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
      grad.addColorStop(0, '#b91c1c');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#3f0d12';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.fill();

    // Mắt đỏ phát sáng
    if (this.hitFlash <= 0) {
      ctx.fillStyle = '#fef08a';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#eab308';
      ctx.beginPath();
      ctx.arc(this.radius * 0.5, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(this.radius * 0.5, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Thanh máu mini khi bị mất máu
    if (this.hp < this.maxHp && this.hp > 0) {
      const barW = 26;
      const barH = 3.5;
      const barX = rx - barW / 2;
      const barY = ry - this.radius - 8;
      const hpPct = Math.max(0, this.hp / this.maxHp);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, barW * hpPct, barH);
    }

    ctx.restore();
  }
}
