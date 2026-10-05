import { bus, EVENTS } from '../core/EventBus.js';

/**
 * WaveManager — Quản lý vòng lặp các đợt zombie và Boss Fight
 * Hỗ trợ các biến thể Zombie và Boss The Butcher ở Wave 5
 */
export class WaveManager {
  constructor() {
    this.currentWave = 1;
    this.state = 'PREPARE'; // 'PREPARE' | 'IN_PROGRESS' | 'CLEARED'
    this.prepareTimer = 3.0;

    this.totalZombiesInWave = 12;
    this.zombiesSpawned = 0;
    this.zombiesKilledInWave = 0;

    this.spawnTimer = 0;
    this.spawnInterval = 1.2;
    this.maxConcurrent = 25;

    this.bannerText = '';
    this.bannerTimer = 0;

    this.isBossWave = false;
    this.bossSpawned = false;
    this.bossAlive = false;
  }

  reset() {
    this.currentWave = 1;
    this.state = 'PREPARE';
    this.prepareTimer = 2.5;
    this.isBossWave = false;
    this.bossSpawned = false;
    this.bossAlive = false;
    this._calcWaveConfig();
    this.bannerText = `CHUẨN BỊ - WAVE ${this.currentWave}`;
    this.bannerTimer = 2.5;
  }

  _calcWaveConfig() {
    this.isBossWave = (this.currentWave === 5);
    this.bossSpawned = false;
    this.bossAlive = false;

    if (this.isBossWave) {
      this.totalZombiesInWave = 1; // Chỉ tính trùm The Butcher
      this.maxConcurrent = 30;
      this.spawnInterval = 3.0;
    } else {
      this.totalZombiesInWave = 8 + this.currentWave * 5;
      this.spawnInterval = Math.max(0.28, 1.3 - this.currentWave * 0.08);
      this.maxConcurrent = Math.min(120, 22 + this.currentWave * 12);
    }

    this.zombiesSpawned = 0;
    this.zombiesKilledInWave = 0;
  }

  _pickZombieType() {
    const wave = this.currentWave;
    const r = Math.random();

    if (wave === 1) {
      return 'NORMAL';
    } else if (wave === 2) {
      return r < 0.35 ? 'RUNNER' : 'NORMAL';
    } else if (wave === 3) {
      if (r < 0.35) return 'RUNNER';
      if (r < 0.50) return 'TANK';
      return 'NORMAL';
    } else if (wave === 4) {
      if (r < 0.25) return 'RUNNER';
      if (r < 0.45) return 'TANK';
      if (r < 0.65) return 'BOMBER';
      if (r < 0.85) return 'SPITTER';
      return 'NORMAL';
    } else {
      // Wave 6+
      if (r < 0.25) return 'RUNNER';
      if (r < 0.45) return 'TANK';
      if (r < 0.65) return 'BOMBER';
      if (r < 0.85) return 'SPITTER';
      return 'NORMAL';
    }
  }

  /**
   * @param {number} dt
   * @param {number} activeZombieCount
   * @returns {{ shouldSpawn?: boolean, spawnBoss?: boolean, wave?: number, zombieStats?: Object }}
   */
  update(dt, activeZombieCount) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    if (this.state === 'PREPARE') {
      this.prepareTimer -= dt;
      if (this.prepareTimer <= 0) {
        this.state = 'IN_PROGRESS';

        if (this.isBossWave) {
          this.bannerText = '⚠️ CẢNH BÁO: BOSS THE BUTCHER! ⚠️';
          this.bannerTimer = 3.5;
          this.bossSpawned = true;
          this.bossAlive = true;

          bus.emit(EVENTS.WAVE_START, { wave: this.currentWave, isBoss: true });
          return { spawnBoss: true, wave: this.currentWave };
        } else {
          this.bannerText = `WAVE ${this.currentWave} BẮT ĐẦU!`;
          this.bannerTimer = 2.0;

          bus.emit(EVENTS.WAVE_START, {
            wave: this.currentWave,
            total: this.totalZombiesInWave
          });
        }
      }
      return {};
    }

    if (this.state === 'IN_PROGRESS') {
      // Nếu là Boss Wave: Kết thúc khi Boss bị tiêu diệt
      if (this.isBossWave) {
        if (this.bossSpawned && !this.bossAlive && activeZombieCount === 0) {
          this.state = 'CLEARED';
          this.prepareTimer = 4.0;
          this.bannerText = '🏆 ĐÃ TIÊU DIỆT THE BUTCHER!';
          this.bannerTimer = 3.5;

          bus.emit(EVENTS.WAVE_CLEAR, { wave: this.currentWave, bossDefeated: true });
          return {};
        }
        return {};
      }

      // Các Wave thường
      if (this.zombiesSpawned >= this.totalZombiesInWave && activeZombieCount === 0) {
        this.state = 'CLEARED';
        this.prepareTimer = 3.5;
        this.bannerText = `WAVE ${this.currentWave} HOÀN THÀNH!`;
        this.bannerTimer = 3.0;

        bus.emit(EVENTS.WAVE_CLEAR, { wave: this.currentWave });
        return {};
      }

      if (this.zombiesSpawned < this.totalZombiesInWave && activeZombieCount < this.maxConcurrent) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnTimer = this.spawnInterval;
          this.zombiesSpawned++;

          const hpMultiplier = 1 + (this.currentWave - 1) * 0.16;
          const speedMultiplier = Math.min(1.45, 1 + (this.currentWave - 1) * 0.035);
          const type = this._pickZombieType();

          return {
            shouldSpawn: true,
            wave: this.currentWave,
            zombieStats: {
              type,
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

    return {};
  }

  onZombieKilled() {
    this.zombiesKilledInWave++;
  }

  onBossKilled() {
    this.bossAlive = false;
  }
}
