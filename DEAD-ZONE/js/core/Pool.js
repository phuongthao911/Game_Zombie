/**
 * Pool — Object Pool để tái sử dụng objects, tránh GC trong vòng lặp
 * 
 * Cách dùng:
 *   const bulletPool = new Pool(() => new Bullet(), 200);
 *   const b = bulletPool.get();
 *   b.init(x, y, vx, vy);
 *   // sau khi dùng xong:
 *   bulletPool.release(b);
 */
export class Pool {
  /**
   * @param {Function} factory - Hàm tạo object mới khi pool cạn
   * @param {number} [initialSize=0] - Số object khởi tạo sẵn
   */
  constructor(factory, initialSize = 0) {
    this._factory = factory;
    /** @type {Array} */
    this._pool = [];
    /** @type {Set} */
    this._active = new Set();

    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory());
    }
  }

  /**
   * Lấy object từ pool (hoặc tạo mới nếu pool cạn)
   * @returns {*}
   */
  get() {
    const obj = this._pool.length > 0
      ? this._pool.pop()
      : this._factory();
    this._active.add(obj);
    return obj;
  }

  /**
   * Trả object về pool
   * @param {*} obj
   */
  release(obj) {
    if (!this._active.has(obj)) return;
    this._active.delete(obj);
    this._pool.push(obj);
  }

  /**
   * Trả tất cả active objects về pool
   */
  releaseAll() {
    this._active.forEach(obj => this._pool.push(obj));
    this._active.clear();
  }

  /** @returns {Set} tập hợp active objects */
  get active() { return this._active; }

  /** @returns {number} */
  get size() { return this._active.size; }

  /** @returns {number} */
  get available() { return this._pool.length; }
}
