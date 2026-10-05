/**
 * Obstacles — Hệ thống chướng ngại vật & kiến trúc bản đồ
 * Các khối vật cản (Barrier, Container, Crate, Pillar) chắn tầm nhìn và đường đi
 */

export class ObstacleManager {
  constructor(worldW = 3000, worldH = 3000) {
    this.worldW = worldW;
    this.worldH = worldH;
    /** @type {Array<{ x: number, y: number, w: number, h: number, type: string, color: string, label?: string }>} */
    this.obstacles = [];
    this._generateLayout();
  }

  _generateLayout() {
    this.obstacles = [];
    const cx = this.worldW / 2;
    const cy = this.worldH / 2;

    // 1. Khu trung tâm: Các chướng ngại vật góc mở (để player có chỗ né tránh)
    this.obstacles.push(
      // Khối container phía Bắc
      { x: cx - 180, y: cy - 260, w: 140, h: 60, type: 'container', color: '#1e3a8a', label: 'CARGO' },
      { x: cx + 50,  y: cy - 260, w: 140, h: 60, type: 'container', color: '#831843', label: 'HAZARD' },

      // Bức tường rào bê tông phía Nam
      { x: cx - 220, y: cy + 200, w: 180, h: 40, type: 'barrier', color: '#374151' },
      { x: cx + 40,  y: cy + 200, w: 180, h: 40, type: 'barrier', color: '#374151' },

      // Các thùng hàng bên cánh Tây & Đông
      { x: cx - 340, y: cy - 50, w: 80, h: 90, type: 'crates', color: '#78350f' },
      { x: cx + 260, y: cy - 50, w: 80, h: 90, type: 'crates', color: '#78350f' }
    );

    // 2. Các cụm chốt chặn xung quanh bản đồ (bán kính 600 - 1100px)
    const ringRadii = [650, 950];
    const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];

    for (const r of ringRadii) {
      for (const a of angles) {
        const ox = Math.round(cx + Math.cos(a) * r);
        const oy = Math.round(cy + Math.sin(a) * r);

        // Xen kẽ container và cụm thùng
        if (Math.sin(a * 2) > 0) {
          this.obstacles.push({
            x: ox - 60,
            y: oy - 35,
            w: 120,
            h: 70,
            type: 'container',
            color: (ox + oy) % 2 === 0 ? '#1e293b' : '#334155',
            label: 'MILITARY'
          });
        } else {
          this.obstacles.push({
            x: ox - 50,
            y: oy - 50,
            w: 100,
            h: 100,
            type: 'barrier',
            color: '#1f2937'
          });
        }
      }
    }
  }

  /**
   * Render các chướng ngại vật trong tầm nhìn camera
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} camera
   */
  render(ctx, camera) {
    for (const obs of this.obstacles) {
      // Frustum culling: Chỉ vẽ vật cản nằm trong màn hình
      if (
        obs.x + obs.w < camera.x ||
        obs.x > camera.x + camera.viewW ||
        obs.y + obs.h < camera.y ||
        obs.y > camera.y + camera.viewH
      ) {
        continue;
      }

      ctx.save();

      // 1. Bóng đổ (Drop shadow)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(obs.x + 8, obs.y + 8, obs.w, obs.h);

      // 2. Thân vật cản
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // 3. Viền nổi khối 2.5D (Bevel edge)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x + 1, obs.y + 1, obs.w - 2, obs.h - 2);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

      // 4. Họa tiết trên mặt vật cản
      if (obs.type === 'container') {
        // Các đường rãnh container kim loại
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 2;
        const step = 14;
        for (let gx = obs.x + step; gx < obs.x + obs.w - step; gx += step) {
          ctx.beginPath();
          ctx.moveTo(gx, obs.y + 4);
          ctx.lineTo(gx, obs.y + obs.h - 4);
          ctx.stroke();
        }

        if (obs.label) {
          ctx.font = 'bold 9px "Share Tech Mono", monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText(obs.label, obs.x + 8, obs.y + 16);
        }
      } else if (obs.type === 'crates') {
        // Dấu chéo chữ X trên thùng gỗ
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obs.x + 4, obs.y + 4);
        ctx.lineTo(obs.x + obs.w - 4, obs.y + obs.h - 4);
        ctx.moveTo(obs.x + obs.w - 4, obs.y + 4);
        ctx.lineTo(obs.x + 4, obs.y + obs.h - 4);
        ctx.stroke();
      } else {
        // Vạch sọc vàng/đen cảnh báo nguy hiểm trên rào bê tông
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.lineWidth = 3;
        for (let sx = obs.x; sx < obs.x + obs.w; sx += 24) {
          ctx.beginPath();
          ctx.moveTo(sx, obs.y);
          ctx.lineTo(sx + 12, obs.y + obs.h);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }
}
