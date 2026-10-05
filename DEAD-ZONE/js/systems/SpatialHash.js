/**
 * SpatialHash — Lưới phân vùng không gian (Spatial Partitioning Grid)
 * Tối ưu hóa kiểm tra va chạm giữa hàng trăm Zombie, Đạn và Vật cản mà không tốn O(N^2)
 */

export class SpatialHash {
  /**
   * @param {number} cellSize - kích thước mỗi ô lưới (mặc định 120px)
   */
  constructor(cellSize = 120) {
    this.cellSize = cellSize;
    /** @type {Map<string, Set<Object>>} */
    this.grid = new Map();
  }

  clear() {
    this.grid.clear();
  }

  _hash(cx, cy) {
    return `${cx}:${cy}`;
  }

  /**
   * Thêm đối tượng vào các ô lưới tương ứng
   * @param {{ x: number, y: number, radius?: number, w?: number, h?: number }} obj
   */
  insert(obj) {
    const cs = this.cellSize;
    const minX = obj.w ? obj.x : obj.x - (obj.radius || 0);
    const maxX = obj.w ? obj.x + obj.w : obj.x + (obj.radius || 0);
    const minY = obj.h ? obj.y : obj.y - (obj.radius || 0);
    const maxY = obj.h ? obj.y + obj.h : obj.y + (obj.radius || 0);

    const startCol = Math.floor(minX / cs);
    const endCol   = Math.floor(maxX / cs);
    const startRow = Math.floor(minY / cs);
    const endRow   = Math.floor(maxY / cs);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = this._hash(c, r);
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key).add(obj);
      }
    }
  }

  /**
   * Lấy danh sách các đối tượng trong vùng lân cận
   * @param {number} x @param {number} y @param {number} radius
   * @returns {Set<Object>}
   */
  query(x, y, radius = 20) {
    const cs = this.cellSize;
    const startCol = Math.floor((x - radius) / cs);
    const endCol   = Math.floor((x + radius) / cs);
    const startRow = Math.floor((y - radius) / cs);
    const endRow   = Math.floor((y + radius) / cs);

    const results = new Set();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = this._hash(c, r);
        const cell = this.grid.get(key);
        if (cell) {
          for (const item of cell) {
            results.add(item);
          }
        }
      }
    }

    return results;
  }
}
