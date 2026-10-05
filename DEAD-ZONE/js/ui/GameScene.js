import { Scene, SCENES } from '../core/Scene.js';
import { Camera } from '../core/Camera.js';
import { input } from '../core/Input.js';
import { bus, EVENTS } from '../core/EventBus.js';
import { Pool } from '../core/Pool.js';
import { sound } from '../core/Sound.js';
import { Bullet } from '../entities/Bullet.js';
import { Zombie } from '../entities/Zombie.js';
import { Pickup } from '../entities/Pickup.js';
import { Particle } from '../entities/Particle.js';
import { DamageText } from '../entities/DamageText.js';
import { circleIntersect, separateCircles, circleBoxIntersect, resolveCircleBox } from '../systems/Collision.js';
import { TileMap } from '../world/TileMap.js';
import { ObstacleManager } from '../world/Obstacles.js';
import { WaveManager } from '../systems/WaveManager.js';
import { SpatialHash } from '../systems/SpatialHash.js';
import { getRandomPerks } from '../data/perks.js';

/**
 * GameScene — Phase 3 & 4 (Vòng lặp lõi & Thế giới mở rộng)
 * - Phase 3: Wave System, Rớt EXP Orb & Coin, Hút Nam châm, Level Up chọn 1 trong 3 Perk
 * - Phase 4: TileMap đường phố đô thị, Chướng ngại vật Container/Crate/Barrier cản đạn/đường,
 *            Spatial Hash tối ưu 100+ Zombie mượt mà 60 FPS
 */
export class GameScene extends Scene {
  constructor(game) {
    super(game);

    this._camera = new Camera(game.canvas.width, game.canvas.height);
    this._time   = 0;

    // World size
    this._worldW = 3000;
    this._worldH = 3000;

    // Phase 4: Thế giới & Chướng ngại vật
    this._tileMap = new TileMap(this._worldW, this._worldH);
    this._obstacleManager = new ObstacleManager(this._worldW, this._worldH);
    this._spatialHash = new SpatialHash(120);

    // Phase 3: Quản lý Wave
    this._waveManager = new WaveManager();

    // ---- Player Stats ----
    this._player = {
      x: 0, y: 0,
      prevX: 0, prevY: 0,
      vx: 0, vy: 0,
      speed: 190,
      radius: 16,
      angle: 0,

      // Máu & Hồi phục
      maxHp: 100,
      hp: 100,
      invincibleTimer: 0,
      flashTimer: 0,
      regenRate: 0,
      regenTimer: 0,

      // Vũ khí & Đạn
      ammo: 30,
      maxAmmo: 30,
      reserveAmmo: 120,
      fireRate: 0.16,
      fireTimer: 0,
      damageMultiplier: 1.0,
      bulletPiercing: 0,
      isReloading: false,
      reloadTimer: 0,
      reloadDuration: 1.2,

      // Tiến trình EXP & Level
      level: 1,
      exp: 0,
      expNeeded: 25,
      coins: 0,
      magnetRadius: 135,

      // Thống kê
      kills: 0,

      // Visual
      color: '#22c55e',
      glowColor: 'rgba(34,197,94,0.4)',
      bobPhase: 0,
      recoilOffset: 0,
      trail: [],
      trailMax: 8,
    };

    // Object Pools (Mở rộng dung lượng để hỗ trợ 100+ zombie)
    this._bulletPool     = new Pool(() => new Bullet(), 160);
    this._zombiePool     = new Pool(() => new Zombie(), 140);
    this._pickupPool     = new Pool(() => new Pickup(), 200);
    this._particlePool   = new Pool(() => new Particle(), 240);
    this._damageTextPool = new Pool(() => new DamageText(), 70);

    // UI refs
    this._hud          = document.getElementById('hud');
    this._hudHp        = document.getElementById('hud-hp');
    this._hudHpText    = document.getElementById('hud-hp-text');
    this._hudExp       = document.getElementById('hud-exp');
    this._hudLevel     = document.getElementById('hud-level');
    this._hudAmmoCur   = document.getElementById('hud-ammo-cur');
    this._hudAmmoMax   = document.getElementById('hud-ammo-max');
    this._hudWave      = document.getElementById('hud-wave');
    this._hudCoin      = document.getElementById('hud-coin');

    this._waveBanner     = document.getElementById('wave-banner');
    this._waveBannerText = document.getElementById('wave-banner-text');

    this._screenUpgrade = document.getElementById('screen-upgrade');
    this._upgradeCards  = document.getElementById('upgrade-cards');

    this._paused       = false;
    this._isDead       = false;
    this._isUpgrading  = false;

    this._setupPauseButton();
    this._setupResumeButton();
  }

  _setupPauseButton() {
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.game.stateMachine.change(SCENES.MENU);
    });
  }

  _setupResumeButton() {
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      this._unpause();
    });
  }

  onEnter() {
    const { canvas } = this.game;

    // Reset Player
    const p = this._player;
    p.x = p.prevX = this._worldW / 2;
    p.y = p.prevY = this._worldH / 2;
    p.vx = p.vy = 0;
    p.maxHp = 100;
    p.hp = 100;
    p.speed = 190;
    p.maxAmmo = 30;
    p.ammo = 30;
    p.reserveAmmo = 120;
    p.fireRate = 0.16;
    p.damageMultiplier = 1.0;
    p.bulletPiercing = 0;
    p.reloadDuration = 1.2;
    p.isReloading = false;
    p.reloadTimer = 0;
    p.fireTimer = 0;
    p.invincibleTimer = 0;
    p.flashTimer = 0;
    p.regenRate = 0;
    p.regenTimer = 0;

    p.level = 1;
    p.exp = 0;
    p.expNeeded = 25;
    p.coins = 0;
    p.magnetRadius = 135;
    p.kills = 0;
    p.trail = [];
    p.angle = 0;
    p.recoilOffset = 0;

    // Reset Pools
    this._bulletPool.releaseAll();
    this._zombiePool.releaseAll();
    this._pickupPool.releaseAll();
    this._particlePool.releaseAll();
    this._damageTextPool.releaseAll();

    // Reset Wave
    this._waveManager.reset();

    // Reset Camera
    this._camera.resize(canvas.width, canvas.height);
    this._camera.setBounds(0, 0, this._worldW, this._worldH);
    this._camera.snapTo(p.x, p.y);

    // Reset States
    this._time = 0;
    this._paused = false;
    this._isDead = false;
    this._isUpgrading = false;

    // Show HUD
    this._hud.classList.remove('hud--hidden');
    this._updateHUD();

    document.getElementById('screen-gameover')?.classList.add('screen--hidden');
    document.getElementById('screen-pause')?.classList.add('screen--hidden');
    this._screenUpgrade?.classList.add('screen--hidden');
  }

  onExit() {
    this._hud.classList.add('hud--hidden');
    this._screenUpgrade?.classList.add('screen--hidden');
    this._bulletPool.releaseAll();
    this._zombiePool.releaseAll();
    this._pickupPool.releaseAll();
    this._particlePool.releaseAll();
    this._damageTextPool.releaseAll();
  }

  update(dt, elapsed) {
    if (this._paused || this._isDead || this._isUpgrading) return;

    this._time += dt;
    const p = this._player;

    // Handle pause
    if (input.isPressed('pause')) {
      this._togglePause();
      return;
    }

    // ---- Hồi máu thụ động (Regen Perk) ----
    if (p.regenRate > 0 && p.hp < p.maxHp) {
      p.regenTimer += dt;
      if (p.regenTimer >= 2.5) {
        p.regenTimer = 0;
        p.hp = Math.min(p.maxHp, p.hp + p.regenRate);
        this._updateHUD();
      }
    }

    // ---- Di chuyển Player ----
    const move = input.getMovement();
    p.prevX = p.x;
    p.prevY = p.y;

    p.vx = move.x * p.speed;
    p.vy = move.y * p.speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Giới hạn biên map
    p.x = Math.max(p.radius, Math.min(this._worldW - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(this._worldH - p.radius, p.y));

    // Va chạm Player vs Chướng ngại vật (Obstacles)
    for (const obs of this._obstacleManager.obstacles) {
      resolveCircleBox(p, obs);
    }

    // Hướng nhìn theo chuột
    const mouseWorld = this._camera.screenToWorld(input.mouse.x, input.mouse.y);
    input.mouse.worldX = mouseWorld.x;
    input.mouse.worldY = mouseWorld.y;
    p.angle = Math.atan2(mouseWorld.y - p.y, mouseWorld.x - p.x);

    // Timers
    if (p.invincibleTimer > 0) p.invincibleTimer -= dt;
    if (p.flashTimer > 0) p.flashTimer -= dt;
    if (p.fireTimer > 0) p.fireTimer -= dt;
    if (p.recoilOffset > 0) p.recoilOffset = Math.max(0, p.recoilOffset - dt * 25);

    // Bob animation & trail
    if (move.x !== 0 || move.y !== 0) {
      p.bobPhase += dt * 7;
      p.trail.push({ x: p.x, y: p.y, t: this._time });
      if (p.trail.length > p.trailMax) p.trail.shift();
    } else {
      if (p.trail.length > 0) p.trail.shift();
    }

    // ---- Xử lý Nạp đạn (Reload) ----
    if (input.isPressed('reload') && !p.isReloading && p.ammo < p.maxAmmo && p.reserveAmmo > 0) {
      this._startReload();
    }

    if (p.isReloading) {
      p.reloadTimer -= dt;
      if (p.reloadTimer <= 0) {
        this._finishReload();
      }
    }

    // ---- Xử lý Bắn súng ----
    if (input.isHeld('shoot')) {
      if (p.isReloading) {
        // Đang nạp đạn
      } else if (p.ammo <= 0) {
        if (input.isPressed('shoot')) {
          sound.playEmptyMag();
          if (p.reserveAmmo > 0) this._startReload();
        }
      } else if (p.fireTimer <= 0) {
        this._shoot();
      }
    }

    // ---- Cập nhật Wave Manager ----
    const activeZombieCount = this._zombiePool.size;
    const waveEvent = this._waveManager.update(dt, activeZombieCount);

    if (waveEvent.shouldSpawn) {
      this._spawnZombie(waveEvent.zombieStats);
    }

    // Cập nhật hiển thị Wave Banner
    if (this._waveBanner && this._waveBannerText) {
      if (this._waveManager.bannerTimer > 0) {
        this._waveBanner.classList.remove('wave-banner--hidden');
        this._waveBannerText.textContent = this._waveManager.bannerText;
      } else {
        this._waveBanner.classList.add('wave-banner--hidden');
      }
    }

    // ---- Cập nhật Bullets ----
    for (const b of this._bulletPool.active) {
      b.update(dt);

      // Va chạm đạn với vật cản
      let hitObstacle = false;
      for (const obs of this._obstacleManager.obstacles) {
        if (circleBoxIntersect(b.x, b.y, b.radius, obs.x, obs.y, obs.w, obs.h)) {
          hitObstacle = true;
          this._createHitParticles(b.x, b.y, b.angle, '#facc15');
          break;
        }
      }

      // Hết hạn hoặc ra khỏi map hoặc trúng tường
      if (hitObstacle || !b.alive || b.x < 0 || b.x > this._worldW || b.y < 0 || b.y > this._worldH) {
        this._bulletPool.release(b);
      }
    }

    // ---- Cập nhật Spatial Hash & Zombies ----
    this._spatialHash.clear();
    const activeZombies = Array.from(this._zombiePool.active);

    for (const z of activeZombies) {
      z.update(dt, p.x, p.y);

      // Giới hạn biên map
      z.x = Math.max(z.radius, Math.min(this._worldW - z.radius, z.x));
      z.y = Math.max(z.radius, Math.min(this._worldH - z.radius, z.y));

      // Va chạm Zombie vs Chướng ngại vật
      for (const obs of this._obstacleManager.obstacles) {
        resolveCircleBox(z, obs);
      }

      this._spatialHash.insert(z);
    }

    // Phân tách zombie tránh dính chùm bằng SpatialHash
    for (const z of activeZombies) {
      const nearby = this._spatialHash.query(z.x, z.y, z.radius * 2.5);
      for (const other of nearby) {
        if (z !== other && other.alive) {
          separateCircles(z, other, 0.35);
        }
      }
    }

    // ---- Xử lý Va chạm: Đạn vs Zombie ----
    for (const b of this._bulletPool.active) {
      if (!b.alive) continue;

      const candidates = this._spatialHash.query(b.x, b.y, b.radius + 18);
      for (const z of candidates) {
        if (!z.alive) continue;

        if (circleIntersect(b.x, b.y, b.radius, z.x, z.y, z.radius)) {
          // Tính sát thương có áp dụng perk
          const damage = Math.round(b.damage * (p.damageMultiplier || 1.0));
          this._createHitParticles(b.x, b.y, b.angle);
          this._createDamageText(z.x, z.y - 10, `${damage}`, '#f87171');
          sound.playZombieHit();

          const killed = z.takeDamage(damage, b.angle, 160);
          if (killed) {
            this._onZombieKilled(z);
          }

          // Xử lý đạn xuyên phá (Piercing)
          if (!b.pierceCount) b.pierceCount = 0;
          b.pierceCount++;

          if (b.pierceCount > p.bulletPiercing) {
            b.alive = false;
            this._bulletPool.release(b);
            break;
          }
        }
      }
    }

    // ---- Xử lý Va chạm: Zombie vs Player ----
    const nearbyZombiesToPlayer = this._spatialHash.query(p.x, p.y, p.radius + 20);
    for (const z of nearbyZombiesToPlayer) {
      if (!z.alive) continue;

      if (circleIntersect(p.x, p.y, p.radius, z.x, z.y, z.radius)) {
        separateCircles(p, z, 0.4);

        if (p.invincibleTimer <= 0) {
          p.hp = Math.max(0, p.hp - z.damage);
          p.invincibleTimer = 0.45;
          p.flashTimer = 0.15;
          this._camera.shake(0.3);
          sound.playPlayerHurt();
          this._createDamageText(p.x, p.y - 20, `-${z.damage}`, '#ef4444');
          this._createBloodSplat(p.x, p.y);

          bus.emit(EVENTS.PLAYER_HIT, { hp: p.hp, maxHp: p.maxHp });
          this._updateHUD();

          if (p.hp <= 0) {
            this._onPlayerDead();
            return;
          }
        }
      }
    }

    // ---- Cập nhật Pickups (EXP & Coins) ----
    for (const item of this._pickupPool.active) {
      item.update(dt, p.x, p.y, p.magnetRadius);

      // Kiểm tra người chơi nhặt được
      if (circleIntersect(p.x, p.y, p.radius, item.x, item.y, item.radius)) {
        this._collectPickup(item);
        this._pickupPool.release(item);
      }
    }

    // ---- Cập nhật Particles & Damage Texts ----
    for (const part of this._particlePool.active) {
      part.update(dt);
      if (!part.alive) this._particlePool.release(part);
    }

    for (const dtItem of this._damageTextPool.active) {
      dtItem.update(dt);
      if (!dtItem.alive) this._damageTextPool.release(dtItem);
    }

    // Camera follow player
    this._camera.follow(p.x, p.y);
    this._camera.update(dt);

    // Debug Overlay
    this.game.debug.set('Wave', `${this._waveManager.currentWave} (${this._waveManager.state})`, '#38bdf8');
    this.game.debug.set('Zombies', `${this._zombiePool.size} / ${this._waveManager.maxConcurrent}`, '#f87171');
    this.game.debug.set('Level', `Lv.${p.level} (${p.exp}/${p.expNeeded} EXP)`, '#facc15');
    this.game.debug.set('Pickups', `${this._pickupPool.size}`, '#34d399');
    this.game.debug.set('Bullets', `${this._bulletPool.size}`, '#fbbf24');
    this.game.debug.set('Player HP', `${p.hp}/${p.maxHp}`, p.hp > 30 ? '#22c55e' : '#ef4444');
  }

  _shoot() {
    const p = this._player;
    p.ammo--;
    p.fireTimer = p.fireRate;
    p.recoilOffset = 5;

    this._camera.shake(0.06);
    sound.playShoot();

    const muzzleDist = p.radius + 12;
    const spread = (Math.random() - 0.5) * 0.08;
    const bulletAngle = p.angle + spread;
    const startX = p.x + Math.cos(p.angle) * muzzleDist;
    const startY = p.y + Math.sin(p.angle) * muzzleDist;

    const bullet = this._bulletPool.get();
    bullet.init(startX, startY, bulletAngle, 920, 25, 1.1);
    bullet.pierceCount = 0;

    // Muzzle flash particle
    for (let i = 0; i < 3; i++) {
      const sp = this._particlePool.get();
      const pAngle = bulletAngle + (Math.random() - 0.5) * 0.4;
      const speed = 150 + Math.random() * 150;
      sp.init(startX, startY, Math.cos(pAngle) * speed, Math.sin(pAngle) * speed, 2, '#fef08a', 0.12);
    }

    this._updateHUD();

    if (p.ammo <= 0 && p.reserveAmmo > 0) {
      this._startReload();
    }
  }

  _startReload() {
    const p = this._player;
    if (p.isReloading || p.ammo >= p.maxAmmo || p.reserveAmmo <= 0) return;
    p.isReloading = true;
    p.reloadTimer = p.reloadDuration;
    sound.playReload();
    this._createDamageText(p.x, p.y - 25, 'RELOADING...', '#e2e8f0', 1.0);
  }

  _finishReload() {
    const p = this._player;
    p.isReloading = false;
    const needed = p.maxAmmo - p.ammo;
    const toLoad = Math.min(needed, p.reserveAmmo);
    p.ammo += toLoad;
    p.reserveAmmo -= toLoad;
    this._updateHUD();
  }

  _spawnZombie(stats) {
    const p = this._player;
    const dist = 750 + Math.random() * 250;
    const angle = Math.random() * Math.PI * 2;

    let sx = p.x + Math.cos(angle) * dist;
    let sy = p.y + Math.sin(angle) * dist;

    sx = Math.max(60, Math.min(this._worldW - 60, sx));
    sy = Math.max(60, Math.min(this._worldH - 60, sy));

    const zombie = this._zombiePool.get();
    const hp = stats?.hp ?? 50;
    const speed = stats?.speed ?? 85;
    const damage = stats?.damage ?? 10;
    zombie.init(sx, sy, speed, hp, damage);
  }

  _onZombieKilled(z) {
    const p = this._player;
    this._createDeathExplosion(z.x, z.y);
    sound.playZombieDie();

    p.kills++;
    this._waveManager.onZombieKilled();
    bus.emit(EVENTS.ENEMY_KILLED, { kills: p.kills });

    // Rơi 1-2 ngọc EXP
    const expCount = Math.random() > 0.4 ? 2 : 1;
    for (let i = 0; i < expCount; i++) {
      const expItem = this._pickupPool.get();
      expItem.init(z.x, z.y, 'EXP', 6);
    }

    // 35% tỉ lệ rơi tiền xu Coin
    if (Math.random() < 0.35) {
      const coinItem = this._pickupPool.get();
      coinItem.init(z.x, z.y, 'COIN', 1);
    }

    this._zombiePool.release(z);
  }

  _collectPickup(item) {
    const p = this._player;

    if (item.type === 'EXP') {
      p.exp += item.value;
      sound.playPickupExp();
      this._createDamageText(item.x, item.y, `+${item.value} EXP`, '#38bdf8', 0.55);

      // Kiểm tra Level Up
      if (p.exp >= p.expNeeded) {
        p.exp -= p.expNeeded;
        p.level++;
        p.expNeeded = Math.round(25 * Math.pow(p.level, 1.25));
        sound.playLevelUp();
        this._showLevelUpModal();
      }
    } else {
      p.coins += item.value;
      sound.playPickupCoin();
      this._createDamageText(item.x, item.y, `+${item.value} ◈`, '#facc15', 0.65);
    }

    this._updateHUD();
  }

  _showLevelUpModal() {
    this._isUpgrading = true;
    const perks = getRandomPerks(3);

    if (this._upgradeCards && this._screenUpgrade) {
      this._upgradeCards.innerHTML = '';

      perks.forEach(perk => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.style.setProperty('--card-accent', perk.color);

        card.innerHTML = `
          <div class="upgrade-card__icon">${perk.icon}</div>
          <div class="upgrade-card__rarity">${perk.rarity}</div>
          <div class="upgrade-card__name">${perk.name}</div>
          <div class="upgrade-card__desc">${perk.desc}</div>
          <button class="upgrade-card__btn">CHỌN</button>
        `;

        card.addEventListener('click', () => {
          // Áp dụng perk cho người chơi
          perk.apply(this._player);
          this._createDamageText(this._player.x, this._player.y - 30, `ĐÃ CHỌN: ${perk.name}`, perk.color, 1.2);

          // Đóng modal và tiếp tục chơi
          this._screenUpgrade.classList.add('screen--hidden');
          this._isUpgrading = false;
          this._updateHUD();
        }, { once: true });

        this._upgradeCards.appendChild(card);
      });

      this._screenUpgrade.classList.remove('screen--hidden');
      this._screenUpgrade.classList.add('screen--active');
    }
  }

  _createHitParticles(x, y, angle, color = '#fde047') {
    for (let i = 0; i < 4; i++) {
      const p = this._particlePool.get();
      const pAngle = angle + Math.PI + (Math.random() - 0.5) * 1.2;
      const speed = 80 + Math.random() * 120;
      p.init(x, y, Math.cos(pAngle) * speed, Math.sin(pAngle) * speed, 2, color, 0.2);
    }
  }

  _createDeathExplosion(x, y) {
    for (let i = 0; i < 16; i++) {
      const p = this._particlePool.get();
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 160;
      p.init(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 2.5 + Math.random() * 2, '#991b1b', 0.6);
    }
  }

  _createBloodSplat(x, y) {
    for (let i = 0; i < 8; i++) {
      const p = this._particlePool.get();
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 100;
      p.init(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 2, '#ef4444', 0.35);
    }
  }

  _createDamageText(x, y, text, color, maxLife = 0.65) {
    const dt = this._damageTextPool.get();
    dt.init(x, y, text, color, maxLife);
  }

  _onPlayerDead() {
    this._isDead = true;
    this._camera.shake(0.5);
    this._createDeathExplosion(this._player.x, this._player.y);

    bus.emit(EVENTS.PLAYER_DEAD, { kills: this._player.kills });
    bus.emit(EVENTS.GAME_OVER, {
      wave: this._waveManager.currentWave,
      kills: this._player.kills,
      elapsed: this._time,
    });
  }

  _updateHUD() {
    const p = this._player;
    if (this._hudHp) {
      const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
      this._hudHp.style.width = `${hpPct}%`;
    }
    if (this._hudHpText) {
      this._hudHpText.textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
    }
    if (this._hudExp) {
      const expPct = Math.max(0, Math.min(100, (p.exp / p.expNeeded) * 100));
      this._hudExp.style.width = `${expPct}%`;
    }
    if (this._hudLevel) {
      this._hudLevel.textContent = `Lv.${p.level}`;
    }
    if (this._hudAmmoCur) {
      this._hudAmmoCur.textContent = p.isReloading ? '--' : `${p.ammo}`;
    }
    if (this._hudAmmoMax) {
      this._hudAmmoMax.textContent = `${p.reserveAmmo}`;
    }
    if (this._hudWave) {
      this._hudWave.textContent = `${this._waveManager.currentWave}`;
    }
    if (this._hudCoin) {
      this._hudCoin.textContent = `${p.coins}`;
    }
  }

  _togglePause() {
    this._paused ? this._unpause() : this._pause();
  }

  _pause() {
    this._paused = true;
    document.getElementById('screen-pause')?.classList.remove('screen--hidden');
    document.getElementById('screen-pause')?.classList.add('screen--active');
  }

  _unpause() {
    this._paused = false;
    document.getElementById('screen-pause')?.classList.add('screen--hidden');
    document.getElementById('screen-pause')?.classList.remove('screen--active');
  }

  render(ctx, alpha) {
    const { canvas } = this.game;
    const p = this._player;

    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Camera Transform
    ctx.save();
    this._camera.applyTransform(ctx);

    // 1. Phase 4: Render TileMap đô thị
    this._tileMap.render(ctx, this._camera);

    // 2. Biên thế giới đỏ
    ctx.strokeStyle = 'rgba(230, 51, 51, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this._worldW, this._worldH);

    // 3. Phase 4: Render Chướng ngại vật (Obstacles)
    this._obstacleManager.render(ctx, this._camera);

    // 4. Render Particles (lớp nền)
    for (const part of this._particlePool.active) {
      part.render(ctx);
    }

    // 5. Phase 3: Render Pickups (EXP & Coins)
    for (const item of this._pickupPool.active) {
      item.render(ctx);
    }

    // 6. Render Zombies
    for (const z of this._zombiePool.active) {
      z.render(ctx, alpha);
    }

    // 7. Render Bullets
    for (const b of this._bulletPool.active) {
      b.render(ctx, alpha);
    }

    // 8. Render Player
    if (!this._isDead) {
      const rx = p.prevX + (p.x - p.prevX) * alpha;
      const ry = p.prevY + (p.y - p.prevY) * alpha;

      this._renderTrail(ctx, rx, ry, p);
      this._renderPlayer(ctx, rx, ry, p);
    }

    // 9. Render Floating Damage Texts
    for (const dt of this._damageTextPool.active) {
      dt.render(ctx);
    }

    // Debug mode (Hitbox, vectors)
    if (this.game.debug.visible) {
      this._renderDebug(ctx, p, alpha);
    }

    ctx.restore();

    // Crosshair (Screen Space)
    this._renderCrosshair(ctx);

    // Reloading indicator trên màn hình nếu đang nạp đạn
    if (p.isReloading && !this._isDead) {
      this._renderReloadBar(ctx);
    }

    // Tọa độ góc dưới
    this._renderCoords(ctx, p);
  }

  _renderTrail(ctx, rx, ry, p) {
    if (p.trail.length < 2) return;

    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const progress = i / p.trail.length;
      ctx.save();
      ctx.globalAlpha = progress * 0.25;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, p.radius * 0.3 * progress, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _renderPlayer(ctx, rx, ry, p) {
    const bob = Math.sin(p.bobPhase) * 1.5;

    if (p.invincibleTimer > 0 && Math.floor(this._time * 18) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Bóng dưới chân
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(rx, ry + p.radius + 2, p.radius * 0.85, p.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outer glow ring
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = p.flashTimer > 0 ? '#ef4444' : p.glowColor;
    ctx.strokeStyle = p.flashTimer > 0 ? '#ef4444' : p.color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(rx, ry + bob, p.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Thân Player
    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = p.glowColor;
    const bodyGrad = ctx.createRadialGradient(
      rx - p.radius * 0.3, ry + bob - p.radius * 0.3, 0,
      rx, ry + bob, p.radius
    );
    if (p.flashTimer > 0) {
      bodyGrad.addColorStop(0, '#fca5a5');
      bodyGrad.addColorStop(1, '#dc2626');
    } else {
      bodyGrad.addColorStop(0, '#5be98e');
      bodyGrad.addColorStop(1, '#15803d');
    }
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(rx, ry + bob, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Nòng súng (Pistol)
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.translate(rx, ry + bob);
    ctx.rotate(p.angle);

    const barrelX = p.radius - 3 - p.recoilOffset;
    ctx.beginPath();
    ctx.roundRect(barrelX, -3, 14, 6, 2);
    ctx.fill();
    ctx.restore();

    // Mắt định hướng
    ctx.save();
    ctx.fillStyle = '#064e3b';
    ctx.translate(rx, ry + bob);
    ctx.rotate(p.angle);
    ctx.beginPath();
    ctx.arc(p.radius * 0.4, -4, 2.8, 0, Math.PI * 2);
    ctx.arc(p.radius * 0.4, 4, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.globalAlpha = 1.0;
  }

  _renderReloadBar(ctx) {
    const p = this._player;
    const screenPos = this._camera.worldToScreen(p.x, p.y);
    const progress = 1 - (p.reloadTimer / p.reloadDuration);

    const barW = 44;
    const barH = 5;
    const barX = screenPos.x - barW / 2;
    const barY = screenPos.y - p.radius - 22;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(barX, barY, barW * Math.max(0, Math.min(1, progress)), barH);
    ctx.restore();
  }

  _renderCrosshair(ctx) {
    const mx = input.mouse.x;
    const my = input.mouse.y;
    const s = 10;
    const gap = 5;

    ctx.save();
    ctx.strokeStyle = this._player.isReloading ? '#eab308' : 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';

    ctx.beginPath();
    ctx.moveTo(mx - s - gap, my); ctx.lineTo(mx - gap, my);
    ctx.moveTo(mx + gap, my);     ctx.lineTo(mx + s + gap, my);
    ctx.moveTo(mx, my - s - gap); ctx.lineTo(mx, my - gap);
    ctx.moveTo(mx, my + gap);     ctx.lineTo(mx, my + s + gap);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(mx, my, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _renderDebug(ctx, p, alpha) {
    const rx = p.prevX + (p.x - p.prevX) * alpha;
    const ry = p.prevY + (p.y - p.prevY) * alpha;

    // Player Hitbox & Magnet Radius
    this.game.debug.drawCircle(ctx, rx, ry, p.radius, '#22c55e');
    this.game.debug.drawCircle(ctx, rx, ry, p.magnetRadius, 'rgba(56, 189, 248, 0.15)');

    // Obstacle Hitboxes
    for (const obs of this._obstacleManager.obstacles) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }
  }

  _renderCoords(ctx, p) {
    ctx.save();
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`[${Math.round(p.x)}, ${Math.round(p.y)}] | WAVE: ${this._waveManager.currentWave} | KILLS: ${p.kills}`, 12, ctx.canvas.height - 12);
    ctx.restore();
  }
}
