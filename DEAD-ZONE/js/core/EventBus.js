/**
 * EventBus — Pub/Sub hệ thống sự kiện toàn cục
 * Giao tiếp giữa các module không cần tham chiếu trực tiếp
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * Đăng ký lắng nghe sự kiện
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} hàm hủy đăng ký
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Đăng ký lắng nghe 1 lần duy nhất
   * @param {string} event
   * @param {Function} callback
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /**
   * Hủy đăng ký lắng nghe
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    this._listeners.get(event)?.delete(callback);
  }

  /**
   * Phát sự kiện
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    this._listeners.get(event)?.forEach(cb => {
      try { cb(data); }
      catch (e) { console.error(`[EventBus] Error in listener for "${event}":`, e); }
    });
  }

  /**
   * Xóa toàn bộ listener của một event
   * @param {string} event
   */
  clear(event) {
    this._listeners.delete(event);
  }

  /** Xóa toàn bộ listeners */
  clearAll() {
    this._listeners.clear();
  }
}

// Singleton toàn cục
export const bus = new EventBus();

// ---- Event name constants ---- //
export const EVENTS = Object.freeze({
  // Game lifecycle
  GAME_START:      'game:start',
  GAME_PAUSE:      'game:pause',
  GAME_RESUME:     'game:resume',
  GAME_OVER:       'game:over',
  SCENE_CHANGE:    'scene:change',

  // Player
  PLAYER_HIT:      'player:hit',
  PLAYER_DEAD:     'player:dead',
  PLAYER_LEVEL_UP: 'player:levelUp',
  PLAYER_SHOOT:    'player:shoot',

  // Enemy
  ENEMY_KILLED:    'enemy:killed',
  ENEMY_SPAWNED:   'enemy:spawned',

  // Wave
  WAVE_START:      'wave:start',
  WAVE_CLEAR:      'wave:clear',

  // Sound / Noise (for AI)
  NOISE:           'world:noise',
  EXPLOSION:       'world:explosion',

  // UI
  SHOW_TOAST:      'ui:toast',
  SHOW_UPGRADE:    'ui:upgrade',
});
