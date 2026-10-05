/**
 * TileMap — Bản đồ đường phố thành phố bỏ hoang (Procedural Urban Street TileMap)
 * Vẽ mặt đường nhựa, vỉa hè bê tông, vạch kẻ đường, nắp cống, rạn nứt
 */

export class TileMap {
  constructor(worldW = 3000, worldH = 3000) {
    this.worldW = worldW;
    this.worldH = worldH;
    this.tileSize = 120; // 120px mỗi ô sàn
    this.cols = Math.ceil(worldW / this.tileSize);
    this.rows = Math.ceil(worldH / this.tileSize);

    // Chuẩn bị dữ liệu rạn nứt và nắp cống ngẫu nhiên
    this._details = [];
    this._initDetails();
  }

  _initDetails() {
    this._details = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      this._details.push({
        x: 100 + Math.random() * (this.worldW - 200),
        y: 100 + Math.random() * (this.worldH - 200),
        type: i % 3 === 0 ? 'manhole' : 'crack',
        radius: 12 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Render nền bản đồ trong viewport của Camera
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} camera
   */
  render(ctx, camera) {
    const ts = this.tileSize;
    const startCol = Math.max(0, Math.floor(camera.x / ts));
    const endCol   = Math.min(this.cols, Math.ceil((camera.x + camera.viewW) / ts) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / ts));
    const endRow   = Math.min(this.rows, Math.ceil((camera.y + camera.viewH) / ts) + 1);

    ctx.save();

    // 1. Vẽ các ô đường nhựa / vỉa hè
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const x = c * ts;
        const y = r * ts;

        // Màu nền xen kẽ nhẹ tạo cảm giác đường nhựa xỉn màu
        const isAlt = (c + r) % 2 === 0;
        ctx.fillStyle = isAlt ? '#0f1015' : '#0c0d12';
        ctx.fillRect(x, y, ts, ts);

        // Đường chỉ rãnh gạch bê tông
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, ts, ts);
      }
    }

    // 2. Vạch kẻ đường phố trung tâm (Main boulevard stripes)
    const midX = this.worldW / 2;
    const midY = this.worldH / 2;

    // Trục đường ngang chính
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.22)'; // Vàng mờ
    ctx.lineWidth = 4;
    ctx.setLineDash([35, 25]);

    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(this.worldW, midY);
    ctx.stroke();

    // Trục đường dọc chính
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, this.worldH);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // 3. Vòng tròn ngã tư trung tâm (Rotary / Plaza Circle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(midX, midY, 160, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Chi tiết rạn nứt & nắp cống
    for (const d of this._details) {
      if (
        d.x < camera.x - 40 ||
        d.x > camera.x + camera.viewW + 40 ||
        d.y < camera.y - 40 ||
        d.y > camera.y + camera.viewH + 40
      ) {
        continue;
      }

      if (d.type === 'manhole') {
        // Nắp cống kim loại tròn
        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Vết nứt bê tông
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + Math.cos(d.angle) * d.radius, d.y + Math.sin(d.angle) * d.radius);
        ctx.lineTo(d.x + Math.cos(d.angle + 0.8) * (d.radius * 1.4), d.y + Math.sin(d.angle + 0.8) * (d.radius * 1.4));
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
