/**
 * Boss — The Butcher (Trùm Đồ Tể)
 * Boss Wave 5 với cơ chế 2 Phase, Telegraph cảnh báo đòn đánh và kỹ năng Bull Rush
 */

export class Boss {
  constructor() {
    this.name = 'THE BUTCHER';
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 36;
    this.speed = 68;

    this.maxHp = 1200;
    this.hp = 1200;
    this.alive = false;

    // Trạng thái chiến đấu
    this.phase = 1; // 1: Bình thường, 2: Cuồng nộ (Enraged)
    this.actionState = 'CHASE'; // 'CHASE' | 'TELEGRAPH_CLEAVE' | 'TELEGRAPH_CHARGE' | 'CHARGING'
    this.actionTimer = 0;

    this.angle = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Telegraph geometry
    this.cleaveRange = 110;
    this.cleaveAngle = Math.PI * 0.55; // Nón 100 độ
    this.chargeDirX = 0;
    this.chargeDirY = 0;

    this.hitFlash = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;
    this.bobPhase = 0;

    // Cooldown giữa các đòn tấn công đặc biệt
    this.cleaveCooldown = 2.5;
    this.chargeCooldown = 5.0;
  }

  init(x, y) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.vx = 0;
    this.vy = 0;
    this.maxHp = 1200;
    this.hp = 1200;
    this.alive = true;
    this.phase = 1;
    this.actionState = 'CHASE';
    this.actionTimer = 0;
    this.cleaveCooldown = 2.0;
    this.chargeCooldown = 4.5;
    this.hitFlash = 0;
  }

  /**
   * Cập nhật AI của Boss
   * @param {number} dt
   * @param {number} playerX
   * @param {number} playerY
   * @returns {{ attackType?: string, damage?: number, cleaveCone?: Object, summonZombies?: boolean }}
   */
  update(dt, playerX, playerY) {
    if (!this.alive) return {};

    this.prevX = this.x;
    this.prevY = this.y;
    this.targetX = playerX;
    this.targetY = playerY;

    // Kiểm tra chuyển sang Phase 2 (Cuồng nộ khi HP <= 50%)
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.speed = 92; // Tăng tốc độ
      return { summonZombies: true };
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.actionState !== 'CHARGING') {
      this.angle = Math.atan2(dy, dx);
    }

    // Cooldowns
    if (this.cleaveCooldown > 0) this.cleaveCooldown -= dt;
    if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    let result = {};

    // ---- STATE MACHINE CỦA BOSS ----
    switch (this.actionState) {
      case 'CHASE': {
        // Di chuyển về phía người chơi
        if (dist > 1) {
          this.vx = (dx / dist) * this.speed;
          this.vy = (dy / dist) * this.speed;
        }

        // Quyết định kỹ năng
        if (dist < 100 && this.cleaveCooldown <= 0) {
          // Kích hoạt Telegraph Quét rìu
          this.actionState = 'TELEGRAPH_CLEAVE';
          this.actionTimer = 0.75; // Cảnh báo 0.75s trước khi chém
          this.vx = 0;
          this.vy = 0;
        } else if (this.phase === 2 && dist > 180 && this.chargeCooldown <= 0) {
          // Kích hoạt Telegraph Lao húc
          this.actionState = 'TELEGRAPH_CHARGE';
          this.actionTimer = 0.7;
          this.chargeDirX = dx / dist;
          this.chargeDirY = dy / dist;
          this.vx = 0;
          this.vy = 0;
        }
        break;
      }

      case 'TELEGRAPH_CLEAVE': {
        this.actionTimer -= dt;
        this.vx = 0;
        this.vy = 0;

        if (this.actionTimer <= 0) {
          // Chém rìu!
          this.actionState = 'CHASE';
          this.cleaveCooldown = this.phase === 2 ? 1.8 : 2.5;

          result = {
            attackType: 'CLEAVE',
            damage: 35,
            cone: {
              x: this.x,
              y: this.y,
              radius: this.cleaveRange,
              angle: this.angle,
              spread: this.cleaveAngle
            }
          };
        }
        break;
      }

      case 'TELEGRAPH_CHARGE': {
        this.actionTimer -= dt;
        this.vx = 0;
        this.vy = 0;

        if (this.actionTimer <= 0) {
          // Bắt đầu lao húc!
          this.actionState = 'CHARGING';
          this.actionTimer = 1.1; // Lao đi trong 1.1s
          this.vx = this.chargeDirX * 420;
          this.vy = this.chargeDirY * 420;
        }
        break;
      }

      case 'CHARGING': {
        this.actionTimer -= dt;
        result = { attackType: 'CHARGE_HIT', damage: 30 };

        if (this.actionTimer <= 0) {
          this.actionState = 'CHASE';
          this.chargeCooldown = 4.5;
        }
        break;
      }
    }

    // Áp dụng di chuyển
    this.x += (this.vx + this.knockbackVx) * dt;
    this.y += (this.vy + this.knockbackVy) * dt;

    this.knockbackVx *= Math.max(0, 1 - 12 * dt);
    this.knockbackVy *= Math.max(0, 1 - 12 * dt);
    this.bobPhase += dt * 5;

    return result;
  }

  takeDamage(amount, hitAngle = 0, knockbackForce = 40) {
    if (!this.alive) return false;

    this.hp -= amount;
    this.hitFlash = 0.08;

    // Boss có kháng lực đẩy lùi (chỉ chịu lực đẩy nhẹ)
    this.knockbackVx = Math.cos(hitAngle) * (knockbackForce * 0.25);
    this.knockbackVy = Math.sin(hitAngle) * (knockbackForce * 0.25);

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
    const bob = Math.sin(this.bobPhase) * 2;

    ctx.save();

    // 1. Vẽ Telegraph Cảnh báo đòn đánh trên mặt đất
    if (this.actionState === 'TELEGRAPH_CLEAVE') {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.arc(rx, ry, this.cleaveRange, this.angle - this.cleaveAngle / 2, this.angle + this.cleaveAngle / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this.actionState === 'TELEGRAPH_CHARGE') {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 14;
      ctx.setLineDash([16, 10]);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + this.chargeDirX * 450, ry + this.chargeDirY * 450);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Bóng dưới chân
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(rx, ry + this.radius + 6, this.radius * 1.1, this.radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Hào quang cuồng nộ (Enrage Aura) khi Phase 2
    if (this.phase === 2) {
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ef4444';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry + bob, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Thân hình đồ sộ của The Butcher
    ctx.save();
    ctx.translate(rx, ry + bob);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      const grad = ctx.createRadialGradient(-6, -6, 4, 0, 0, this.radius);
      if (this.phase === 2) {
        grad.addColorStop(0, '#ef4444');
        grad.addColorStop(1, '#450a0a');
      } else {
        grad.addColorStop(0, '#78350f');
        grad.addColorStop(1, '#1c1917');
      }
      ctx.fillStyle = grad;
    }
    ctx.fill();
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Tạp dề đẫm máu
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.roundRect(-this.radius * 0.5, -this.radius * 0.6, this.radius * 1.0, this.radius * 1.2, 4);
    ctx.fill();

    // Mắt đỏ quỷ dữ
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.radius * 0.55, -8, 4, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.55,  8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cây rìu khổng lồ (Giant Cleaver)
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.radius * 0.6, -16, 26, 32, 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }
}
