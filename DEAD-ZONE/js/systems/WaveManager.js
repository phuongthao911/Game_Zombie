import { bus, EVENTS } from '../core/EventBus.js';

/**
 * WaveManager — Quản lý vòng lặp các đợt zombie (Wave System)
 * Tự động tăng độ khó, điều phối số lượng zombie và nhịp độ chiến đấu
 */
export class WaveManager {
  constructor() {
    this.currentWave = 1;
    this.state = 'PREPARE'; // 'PREPARE' | 'IN_PROGRESS' | 'CLEARED'
    this.prepareTimer = 3.0; // 3 giây đếm ngược giữa các wave

    this.totalZombiesInWave = 12;
    this.zombiesSpawned = 0;
    this.zombiesKilledInWave = 0;

    this.spawnTimer = 0;
    this.spawnInterval = 1.2;
    this.maxConcurrent = 25; // Tăng dần lên 100+ zombie ở wave cao

    this.bannerText = '';
    this.bannerTimer = 0;
  }

  reset() {
    this.currentWave = 1;
    this.state = 'PREPARE';
    this.prepareTimer = 2.5;
    this._calcWaveConfig();
    this.bannerText = `CHUẨN BỊ - WAVE ${this.currentWave}`;
    this.bannerTimer = 2.5;
  }

  _calcWaveConfig() {
    // Công thức tăng số zombie theo wave
    this.totalZombiesInWave = 8 + this.currentWave * 5;
    this.zombiesSpawned = 0;
    this.zombiesKilledInWave = 0;

    // Khoảng cách giữa các lần spawn (càng wave cao càng dồn dập)
    this.spawnInterval = Math.max(0.3, 1.3 - this.currentWave * 0.08);

    // Trần số zombie đồng thời trên màn hình (hỗ trợ 100+ zombie ở wave cao)
    this.maxConcurrent = Math.min(120, 20 + this.currentWave * 12);
  }

  /**
   * Cập nhật logic wave theo thời gian thực
   * @param {number} dt
   * @param {number} activeZombieCount - số zombie đang sống trong Scene
   * @returns {{ shouldSpawn: boolean, wave: number, zombieStats: Object }}
   */
  update(dt, activeZombieCount) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    if (this.state === 'PREPARE') {
      this.prepareTimer -= dt;
      if (this.prepareTimer <= 0) {
        this.state = 'IN_PROGRESS';
        this.bannerText = `WAVE ${this.currentWave} BẮT ĐẦU!`;
        this.bannerTimer = 2.0;

        bus.emit(EVENTS.WAVE_START, {
          wave: this.currentWave,
          total: this.totalZombiesInWave
        });
      }
      return { shouldSpawn: false };
    }

    if (this.state === 'IN_PROGRESS') {
      // Kiểm tra hoàn thành wave
      if (this.zombiesSpawned >= this.totalZombiesInWave && activeZombieCount === 0) {
        this.state = 'CLEARED';
        this.prepareTimer = 3.5;
        this.bannerText = `WAVE ${this.currentWave} HOÀN THÀNH!`;
        this.bannerTimer = 3.0;

        bus.emit(EVENTS.WAVE_CLEAR, { wave: this.currentWave });
        return { shouldSpawn: false };
      }

      // Xử lý đếm nhịp sinh zombie
      if (this.zombiesSpawned < this.totalZombiesInWave && activeZombieCount < this.maxConcurrent) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTimer = this.spawnInterval;
          this.zombiesSpawned++;

          // Chỉ số tăng tiến của zombie theo wave
          const hpMultiplier = 1 + (this.currentWave - 1) * 0.16;
          const speedMultiplier = Math.min(1.45, 1 + (this.currentWave - 1) * 0.035);

          return {
            shouldSpawn: true,
            wave: this.currentWave,
            zombieStats: {
              hp: Math.round(45 * hpMultiplier),
              speed: Math.round((75 + Math.random() * 25) * speedMultiplier),
              damage: Math.round(10 + this.currentWave * 1.5)
            }
          };
        }
      }
    }

    if (this.state === 'CLEARED') {
      this.prepareTimer -= dt;
      if (this.prepareTimer <= 0) {
        this.currentWave++;
        this.state = 'PREPARE';
        this.prepareTimer = 2.5;
        this._calcWaveConfig();
        this.bannerText = `CHUẨN BỊ - WAVE ${this.currentWave}`;
        this.bannerTimer = 2.5;
      }
    }

    return { shouldSpawn: false };
  }

  onZombieKilled() {
    this.zombiesKilledInWave++;
  }
}
