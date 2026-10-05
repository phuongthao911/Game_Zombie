/**
 * RNG — Seeded Pseudo-Random Number Generator (Mulberry32)
 * Deterministic: cùng seed → cùng kết quả.
 * Dùng cho spawn, loot, map, biến thể sprite, Daily Challenge.
 */
export class RNG {
  /**
   * @param {number} [seed] - Nếu không truyền, dùng time-based seed
   */
  constructor(seed) {
    this.seed = seed ?? Math.floor(Math.random() * 0xffffffff);
    this._state = this.seed;
  }

  /** Reset về seed ban đầu (để replay) */
  reset() {
    this._state = this.seed;
  }

  /**
   * Thuật toán Mulberry32 — nhanh và đủ chất lượng cho game
   * @returns {number} float trong [0, 1)
   */
  next() {
    let t = (this._state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  }

  /**
   * Số nguyên trong [min, max]
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Float trong [min, max)
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  float(min, max) {
    return this.next() * (max - min) + min;
  }

  /**
   * Boolean với xác suất p
   * @param {number} [p=0.5] - xác suất true
   * @returns {boolean}
   */
  bool(p = 0.5) {
    return this.next() < p;
  }

  /**
   * Chọn ngẫu nhiên một phần tử từ mảng
   * @param {Array} arr
   * @returns {*}
   */
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  /**
   * Trộn ngẫu nhiên mảng (Fisher-Yates in-place)
   * @param {Array} arr
   * @returns {Array}
   */
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Góc ngẫu nhiên trong [0, 2π)
   * @returns {number}
   */
  angle() {
    return this.next() * Math.PI * 2;
  }

  /**
   * Điểm ngẫu nhiên trong vòng tròn bán kính r
   * @param {number} r
   * @returns {{x: number, y: number}}
   */
  inCircle(r) {
    const a = this.angle();
    const d = Math.sqrt(this.next()) * r;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d };
  }

  /**
   * Điểm ngẫu nhiên trên vành tròn
   * @param {number} r
   * @returns {{x: number, y: number}}
   */
  onCircle(r) {
    const a = this.angle();
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
}

// RNG toàn cục — seed có thể ghi đè khi bắt đầu game
export const rng = new RNG();
