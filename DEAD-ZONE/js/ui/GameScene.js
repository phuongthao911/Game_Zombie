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
import { Grenade } from '../entities/Grenade.js';
import { AcidSpit } from '../entities/AcidSpit.js';
import { Boss } from '../entities/Boss.js';
import { circleIntersect, separateCircles, circleBoxIntersect, resolveCircleBox } from '../systems/Collision.js';
import { TileMap } from '../world/TileMap.js';
import { ObstacleManager } from '../world/Obstacles.js';
import { WaveManager } from '../systems/WaveManager.js';
import { SpatialHash } from '../systems/SpatialHash.js';
import { getRandomPerks } from '../data/perks.js';
import { WEAPONS } from '../data/weapons.js';

/**
 * GameScene — Phase 5, 6 & 7 (Boss, Weapons & Skills)
 * Đã tích hợp:
 * - 4 Loại vũ khí chuyển đổi [1, 2, 3, 4]: Pistol, Shotgun (chùm), SMG (xả nhanh), Sniper (xuyên táo)
 * - 2 Kỹ năng chủ động: Dash né đòn [Space], Ném lựu đạn nổ AOE [Q]
 * - 5 Loại Zombie: Normal, Runner (nhanh), Tank (giáp dày), Bomber (cảm tử nổ), Spitter (bắn acid)
 * - Boss Fight: The Butcher ở Wave 5 với thanh máu trùm riêng, Telegraph quét rìu và Lao húc
 */
export class GameScene extends Scene {
  constructor(game) {
    super(game);

    this._camera = new Camera(game.canvas.width, game.canvas.height);
    this._time   = 0;

    // World size
    this._worldW = 3000;
    this._worldH = 3000;

    // Thế giới & Chướng ngại vật
    this._tileMap = new TileMap(this._worldW, this._worldH);
    this._obstacleManager = new ObstacleManager(this._worldW, this._worldH);
    this._spatialHash = new SpatialHash(120);

    // Quản lý Wave
    this._waveManager = new WaveManager();

    // Boss Entity
    this._boss = new Boss();

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

      // Kho Vũ khí & Đạn
      currentWeapon: WEAPONS.PISTOL,
      ammo: 30,
      maxAmmo: 30,
      reserveAmmo: 180,
      fireTimer: 0,
      damageMultiplier: 1.0,
      bulletPiercing: 0,
      isReloading: false,
      reloadTimer: 0,
      reloadDuration: 1.1,

      // Kỹ năng chủ động (Skills)
      isDashing: false,
      dashTimer: 0,
      dashDuration: 0.22,
      dashSpeed: 580,
      dashDirX: 0,
      dashDirY: 0,
      dashCooldown: 0,
      dashCooldownMax: 3.0,

      grenadeCooldown: 0,
      grenadeCooldownMax: 6.0,

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
      trailMax: 10,
    };

    // Object Pools
    this._bulletPool     = new Pool(() => new Bullet(), 180);
    this._zombiePool     = new Pool(() => new Zombie(), 150);
    this._pickupPool     = new Pool(() => new Pickup(), 220);
    this._particlePool   = new Pool(() => new Particle(), 260);
    this._damageTextPool = new Pool(() => new DamageText(), 80);
    this._grenadePool    = new Pool(() => new Grenade(), 10);
    this._acidPool       = new Pool(() => new AcidSpit(), 40);

    // UI refs
    this._hud          = document.getElementById('hud');
    this._hudHp        = document.getElementById('hud-hp');
    this._hudHpText    = document.getElementById('hud-hp-text');
    this._hudExp       = document.getElementById('hud-exp');
    this._hudLevel     = document.getElementById('hud-level');
    this._hudAmmoCur   = document.getElementById('hud-ammo-cur');
    this._hudAmmoMax   = document.getElementById('hud-ammo-max');
    this._hudAmmoBox   = document.getElementById('hud-ammo-box');
    this._hudWave      = document.getElementById('hud-wave');
    this._hudCoin      = document.getElementById('hud-coin');

    this._waveBanner     = document.getElementById('wave-banner');
    this._waveBannerText = document.getElementById('wave-banner-text');

    this._screenUpgrade = document.getElementById('screen-upgrade');
    this._upgradeCards  = document.getElementById('upgrade-cards');

    // Boss Bar UI
    this._bossBarContainer = document.getElementById('boss-bar-container');
    this._bossHpFill       = document.getElementById('boss-hp-fill');
    this._bossHpText       = document.getElementById('boss-hp-text');

    // Skill Cooldown overlays
    this._skillCdDash    = document.getElementById('skill-cd-dash');
    this._skillCdGrenade = document.getElementById('skill-cd-grenade');

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
    p.currentWeapon = WEAPONS.PISTOL;
    p.maxAmmo = p.currentWeapon.ammoMax;
    p.ammo = p.maxAmmo;
    p.reserveAmmo = 180;
    p.fireTimer = 0;
    p.damageMultiplier = 1.0;
    p.bulletPiercing = 0;
    p.reloadDuration = p.currentWeapon.reloadDuration;
    p.isReloading = false;
    p.reloadTimer = 0;
    p.invincibleTimer = 0;
    p.flashTimer = 0;
    p.regenRate = 0;
    p.regenTimer = 0;

    p.isDashing = false;
    p.dashTimer = 0;
    p.dashCooldown = 0;
    p.grenadeCooldown = 0;

    p.level = 1;
    p.exp = 0;
    p.expNeeded = 25;
    p.coins = 0;
    p.magnetRadius = 135;
    p.kills = 0;
    p.trail = [];
    p.angle = 0;
    p.recoilOffset = 0;

    // Reset Pools & Entities
    this._bulletPool.releaseAll();
    this._zombiePool.releaseAll();
    this._pickupPool.releaseAll();
    this._particlePool.releaseAll();
    this._damageTextPool.releaseAll();
    this._grenadePool.releaseAll();
    this._acidPool.releaseAll();
    this._boss.alive = false;

    // Reset Wave
    this._waveManager.reset();

    // Reset Camera
    this._camera.resize(canvas.width, canvas.height);
    this._camera.setBounds(0, 0, this._worldW, this._worldH);
    this._camera.snapTo(p.x, p.y);

    this._time = 0;
    this._paused = false;
    this._isDead = false;
    this._isUpgrading = false;

    // Show HUD
    this._hud.classList.remove('hud--hidden');
    this._bossBarContainer?.classList.add('boss-bar--hidden');
    this._updateHUD();
    this._updateWeaponSlots();

    document.getElementById('screen-gameover')?.classList.add('screen--hidden');
    document.getElementById('screen-pause')?.classList.add('screen--hidden');
    this._screenUpgrade?.classList.add('screen--hidden');
  }

  onExit() {
    this._hud.classList.add('hud--hidden');
    this._screenUpgrade?.classList.add('screen--hidden');
    this._bossBarContainer?.classList.add('boss-bar--hidden');
    this._bulletPool.releaseAll();
    this._zombiePool.releaseAll();
    this._pickupPool.releaseAll();
    this._particlePool.releaseAll();
    this._damageTextPool.releaseAll();
    this._grenadePool.releaseAll();
    this._acidPool.releaseAll();
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

    // ---- Đổi Vũ Khí (Phím 1, 2, 3, 4) ----
    if (input.isPressed('weapon1')) this._switchWeapon(WEAPONS.PISTOL);
    if (input.isPressed('weapon2')) this._switchWeapon(WEAPONS.SHOTGUN);
    if (input.isPressed('weapon3')) this._switchWeapon(WEAPONS.SMG);
    if (input.isPressed('weapon4')) this._switchWeapon(WEAPONS.SNIPER);

    // ---- Kỹ năng Dash (Phím Space) ----
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.isDashing) {
      p.dashTimer -= dt;
      p.prevX = p.x;
      p.prevY = p.y;
      p.x += p.dashDirX * p.dashSpeed * dt;
      p.y += p.dashDirY * p.dashSpeed * dt;

      // Tạo bóng mờ dash
      p.trail.push({ x: p.x, y: p.y, t: this._time });
      if (p.trail.length > p.trailMax) p.trail.shift();

      if (p.dashTimer <= 0) {
        p.isDashing = false;
      }
    } else {
      // Di chuyển bình thường
      const move = input.getMovement();
      p.prevX = p.x;
      p.prevY = p.y;

      p.vx = move.x * p.speed;
      p.vy = move.y * p.speed;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Kích hoạt Dash khi nhấn Space
      if (input.isPressed('dash') && p.dashCooldown <= 0) {
        const dashLen = Math.hypot(move.x, move.y);
        if (dashLen > 0) {
          p.dashDirX = move.x / dashLen;
          p.dashDirY = move.y / dashLen;
        } else {
          p.dashDirX = Math.cos(p.angle);
          p.dashDirY = Math.sin(p.angle);
        }
        p.isDashing = true;
        p.dashTimer = p.dashDuration;
        p.dashCooldown = p.dashCooldownMax;
        p.invincibleTimer = p.dashDuration + 0.05; // Kháng sát thương khi lướt!
        sound.playDash();
        this._createDamageText(p.x, p.y - 20, 'DASH!', '#38bdf8', 0.5);
      }

      if (move.x !== 0 || move.y !== 0) {
        p.bobPhase += dt * 7;
        p.trail.push({ x: p.x, y: p.y, t: this._time });
        if (p.trail.length > p.trailMax) p.trail.shift();
      } else {
        if (p.trail.length > 0) p.trail.shift();
      }
    }

    // Giới hạn biên map cho player
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

    // ---- Kỹ năng Ném Lựu đạn (Phím Q) ----
    if (p.grenadeCooldown > 0) p.grenadeCooldown -= dt;
    if (input.isPressed('grenade') && p.grenadeCooldown <= 0) {
      p.grenadeCooldown = p.grenadeCooldownMax;
      const g = this._grenadePool.get();
      g.init(p.x, p.y, mouseWorld.x, mouseWorld.y);
      this._createDamageText(p.x, p.y - 25, 'GRENADE OUT!', '#22c55e', 0.6);
    }

    // Cập nhật các quả Lựu đạn
    for (const g of this._grenadePool.active) {
      const exploded = g.update(dt);
      if (exploded) {
        this._explodeGrenade(g.x, g.y, g.damage, g.explosionRadius);
        this._grenadePool.release(g);
      }
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
        // Đang reload
      } else if (p.ammo <= 0) {
        if (input.isPressed('shoot')) {
          sound.playEmptyMag();
          if (p.reserveAmmo > 0) {
            this._startReload();
          } else {
            this._createDamageText(p.x, p.y - 25, 'HẾT ĐẠN! TÌM HỘP TIẾP ĐẠN', '#fb923c', 0.7);
          }
        }
      } else if (p.fireTimer <= 0) {
        this._shoot();
      }
    }

    // ---- Cập nhật Wave Manager & Boss ----
    const activeZombieCount = this._zombiePool.size;
    const waveEvent = this._waveManager.update(dt, activeZombieCount);

    if (waveEvent.spawnBoss) {
      // Xuất hiện Boss The Butcher!
      this._spawnBoss();
    } else if (waveEvent.shouldSpawn) {
      this._spawnZombie(waveEvent.zombieStats);
    }

    // Cập nhật Wave Banner
    if (this._waveBanner && this._waveBannerText) {
      if (this._waveManager.bannerTimer > 0) {
        this._waveBanner.classList.remove('wave-banner--hidden');
        this._waveBannerText.textContent = this._waveManager.bannerText;
      } else {
        this._waveBanner.classList.add('wave-banner--hidden');
      }
    }

    // ---- Cập nhật Boss The Butcher ----
    if (this._boss.alive) {
      const bossAttack = this._boss.update(dt, p.x, p.y);

      // Cập nhật thanh máu Boss trên HUD
      this._updateBossBar();

      // Nếu Boss gọi đệ tử (Phase 2)
      if (bossAttack.summonZombies) {
        sound.playBossRoar();
        this._camera.shake(0.4);
        for (let i = 0; i < 4; i++) {
          this._spawnZombie({ type: 'RUNNER', hp: 35, speed: 140, damage: 10 });
        }
      }

      // Đòn quét rìu Cleave
      if (bossAttack.attackType === 'CLEAVE' && bossAttack.cone) {
        const cone = bossAttack.cone;
        const bDist = Math.hypot(p.x - cone.x, p.y - cone.y);
        const bAngle = Math.atan2(p.y - cone.y, p.x - cone.x);
        let angleDiff = Math.abs(bAngle - cone.angle);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        if (bDist <= cone.radius && angleDiff <= cone.spread / 2) {
          if (p.invincibleTimer <= 0) {
            this._damagePlayer(bossAttack.damage, 'CLEAVED!');
          }
        }
      }

      // Đòn lao húc Charge Hit
      if (bossAttack.attackType === 'CHARGE_HIT') {
        if (circleIntersect(p.x, p.y, p.radius, this._boss.x, this._boss.y, this._boss.radius)) {
          if (p.invincibleTimer <= 0) {
            this._damagePlayer(bossAttack.damage, 'BULL RUSHED!');
          }
        }
      }

      // Va chạm Boss vs Chướng ngại vật
      for (const obs of this._obstacleManager.obstacles) {
        resolveCircleBox(this._boss, obs);
      }
    }

    // ---- Cập nhật Bullets ----
    for (const b of this._bulletPool.active) {
      b.update(dt);

      let hitObstacle = false;
      for (const obs of this._obstacleManager.obstacles) {
        if (circleBoxIntersect(b.x, b.y, b.radius, obs.x, obs.y, obs.w, obs.h)) {
          hitObstacle = true;
          this._createHitParticles(b.x, b.y, b.angle, '#facc15');
          break;
        }
      }

      if (hitObstacle || !b.alive || b.x < 0 || b.x > this._worldW || b.y < 0 || b.y > this._worldH) {
        this._bulletPool.release(b);
      }
    }

    // ---- Cập nhật Spatial Hash & Zombies ----
    this._spatialHash.clear();
    const activeZombies = Array.from(this._zombiePool.active);

    for (const z of activeZombies) {
      const zAction = z.update(dt, p.x, p.y);

      // Nếu Spitter bắn acid
      if (zAction.shouldSpit) {
        const spit = this._acidPool.get();
        spit.init(zAction.x, zAction.y, p.x, p.y, 380, 14);
      }

      z.x = Math.max(z.radius, Math.min(this._worldW - z.radius, z.x));
      z.y = Math.max(z.radius, Math.min(this._worldH - z.radius, z.y));

      for (const obs of this._obstacleManager.obstacles) {
        resolveCircleBox(z, obs);
      }

      this._spatialHash.insert(z);
    }

    // Phân tách zombie
    for (const z of activeZombies) {
      const nearby = this._spatialHash.query(z.x, z.y, z.radius * 2.5);
      for (const other of nearby) {
        if (z !== other && other.alive) {
          separateCircles(z, other, 0.35);
        }
      }
    }

    // ---- Cập nhật Acid Spits ----
    for (const acid of this._acidPool.active) {
      acid.update(dt);

      // Trúng người chơi
      if (acid.alive && circleIntersect(p.x, p.y, p.radius, acid.x, acid.y, acid.radius)) {
        acid.alive = false;
        if (p.invincibleTimer <= 0) {
          this._damagePlayer(acid.damage, 'ACID!');
        }
        this._acidPool.release(acid);
      } else if (!acid.alive) {
        this._acidPool.release(acid);
      }
    }

    // ---- Xử lý Va chạm: Đạn vs Boss ----
    if (this._boss.alive) {
      for (const b of this._bulletPool.active) {
        if (!b.alive) continue;

        if (circleIntersect(b.x, b.y, b.radius, this._boss.x, this._boss.y, this._boss.radius)) {
          const dmg = Math.round(b.damage * (p.damageMultiplier || 1.0));
          this._createHitParticles(b.x, b.y, b.angle, '#ef4444');
          this._createDamageText(this._boss.x, this._boss.y - 20, `${dmg}`, '#f87171');
          sound.playZombieHit();

          const bossDead = this._boss.takeDamage(dmg, b.angle, 50);
          if (bossDead) {
            this._onBossKilled();
          }

          if (!b.pierceCount) b.pierceCount = 0;
          b.pierceCount++;
          const maxPierce = (p.currentWeapon.pierce || 0) + (p.bulletPiercing || 0);

          if (b.pierceCount > maxPierce) {
            b.alive = false;
            this._bulletPool.release(b);
          }
        }
      }
    }

    // ---- Xử lý Va chạm: Đạn vs Zombie ----
    for (const b of this._bulletPool.active) {
      if (!b.alive) continue;

      const candidates = this._spatialHash.query(b.x, b.y, b.radius + 20);
      for (const z of candidates) {
        if (!z.alive) continue;

        if (circleIntersect(b.x, b.y, b.radius, z.x, z.y, z.radius)) {
          const dmg = Math.round(b.damage * (p.damageMultiplier || 1.0));
          this._createHitParticles(b.x, b.y, b.angle);
          this._createDamageText(z.x, z.y - 10, `${dmg}`, '#f87171');
          sound.playZombieHit();

          const killed = z.takeDamage(dmg, b.angle, p.currentWeapon.knockbackForce || 160);
          if (killed) {
            this._onZombieKilled(z);
          }

          if (!b.pierceCount) b.pierceCount = 0;
          b.pierceCount++;
          const maxPierce = (p.currentWeapon.pierce || 0) + (p.bulletPiercing || 0);

          if (b.pierceCount > maxPierce) {
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
          this._damagePlayer(z.damage, `-${z.damage}`);

          // Nếu là Bomber: Nổ cảm tử luôn!
          if (z.type === 'BOMBER') {
            z.alive = false;
            this._explodeGrenade(z.x, z.y, 45, 130);
            this._zombiePool.release(z);
          }
        }
      }
    }

    // ---- Cập nhật Pickups ----
    for (const item of this._pickupPool.active) {
      item.update(dt, p.x, p.y, p.magnetRadius);

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

    // Cập nhật HUD & Skill Cooldown bars
    this._updateSkillCooldowns();

    // Debug Overlay
    this.game.debug.set('Wave', `${this._waveManager.currentWave} (${this._waveManager.state})`, '#38bdf8');
    this.game.debug.set('Weapon', `${p.currentWeapon.name}`, '#facc15');
    this.game.debug.set('Zombies', `${this._zombiePool.size}`, '#f87171');
    this.game.debug.set('Level', `Lv.${p.level} (${p.exp}/${p.expNeeded} EXP)`, '#4ade80');
    this.game.debug.set('Player HP', `${p.hp}/${p.maxHp}`, p.hp > 30 ? '#22c55e' : '#ef4444');
  }

  _switchWeapon(weaponConfig) {
    const p = this._player;
    if (p.currentWeapon === weaponConfig || p.isReloading) return;

    p.currentWeapon = weaponConfig;
    p.maxAmmo = weaponConfig.ammoMax;
    p.ammo = Math.min(p.ammo, p.maxAmmo);
    p.reloadDuration = weaponConfig.reloadDuration;
    p.fireTimer = 0.15; // Delay ngắn khi rút súng mới

    sound.playReload();
    this._createDamageText(p.x, p.y - 25, `RÚT: ${weaponConfig.name}`, '#facc15', 0.6);
    this._updateHUD();
    this._updateWeaponSlots();
  }

  _shoot() {
    const p = this._player;
    const w = p.currentWeapon;

    p.ammo--;
    p.fireTimer = w.fireRate;
    p.recoilOffset = 6;

    this._camera.shake(w.cameraShake || 0.08);

    // Phát âm thanh theo loại vũ khí
    if (w.id === 'SHOTGUN') sound.playShootShotgun();
    else if (w.id === 'SMG') sound.playShootSMG();
    else if (w.id === 'SNIPER') sound.playShootSniper();
    else sound.playShoot();

    const muzzleDist = p.radius + 14;
    const startX = p.x + Math.cos(p.angle) * muzzleDist;
    const startY = p.y + Math.sin(p.angle) * muzzleDist;

    // Bắn số lượng pellets theo vũ khí (Shotgun bắn 6 viên)
    const pellets = w.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const spreadAngle = (Math.random() - 0.5) * w.spread;
      const bulletAngle = p.angle + spreadAngle;

      const bullet = this._bulletPool.get();
      bullet.init(startX, startY, bulletAngle, w.speed, w.damage, 1.2);
      bullet.pierceCount = 0;
    }

    // Muzzle flash particle
    for (let i = 0; i < 4; i++) {
      const sp = this._particlePool.get();
      const pAngle = p.angle + (Math.random() - 0.5) * 0.4;
      const speed = 160 + Math.random() * 150;
      sp.init(startX, startY, Math.cos(pAngle) * speed, Math.sin(pAngle) * speed, 2.5, '#fef08a', 0.12);
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
    const type = stats?.type ?? 'NORMAL';
    const hp = stats?.hp ?? 50;
    const speed = stats?.speed ?? 85;
    const damage = stats?.damage ?? 10;
    zombie.init(sx, sy, speed, hp, damage, type);
  }

  _spawnBoss() {
    const cx = this._worldW / 2;
    const cy = this._worldH / 2;
    this._boss.init(cx, cy);

    sound.playBossRoar();
    this._camera.shake(0.5);

    if (this._bossBarContainer) {
      this._bossBarContainer.classList.remove('boss-bar--hidden');
    }
    this._updateBossBar();
  }

  _explodeGrenade(x, y, damage, radius) {
    this._camera.shake(0.45);
    sound.playExplosion();

    // Hiệu ứng nổ lửa & khói
    for (let i = 0; i < 24; i++) {
      const p = this._particlePool.get();
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 240;
      const color = i % 2 === 0 ? '#f97316' : '#ef4444';
      p.init(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 3 + Math.random() * 3, color, 0.55);
    }

    // Sát thương toàn bộ zombie trong bán kính nổ
    for (const z of this._zombiePool.active) {
      if (!z.alive) continue;
      const dist = Math.hypot(z.x - x, z.y - y);
      if (dist <= radius) {
        const falloff = 1 - (dist / radius) * 0.4;
        const actualDmg = Math.round(damage * falloff);
        this._createDamageText(z.x, z.y - 12, `${actualDmg}`, '#f97316');
        const killed = z.takeDamage(actualDmg, Math.atan2(z.y - y, z.x - x), 260);
        if (killed) this._onZombieKilled(z);
      }
    }

    // Sát thương Boss nếu trong bán kính nổ
    if (this._boss.alive) {
      const bDist = Math.hypot(this._boss.x - x, this._boss.y - y);
      if (bDist <= radius + this._boss.radius) {
        this._createDamageText(this._boss.x, this._boss.y - 15, `${damage}`, '#f97316');
        const bossDead = this._boss.takeDamage(damage, Math.atan2(this._boss.y - y, this._boss.x - x), 60);
        if (bossDead) this._onBossKilled();
      }
    }
  }

  _damagePlayer(amount, label) {
    const p = this._player;
    p.hp = Math.max(0, p.hp - amount);
    p.invincibleTimer = 0.45;
    p.flashTimer = 0.15;
    this._camera.shake(0.32);
    sound.playPlayerHurt();
    this._createDamageText(p.x, p.y - 20, label, '#ef4444');
    this._createBloodSplat(p.x, p.y);

    bus.emit(EVENTS.PLAYER_HIT, { hp: p.hp, maxHp: p.maxHp });
    this._updateHUD();

    if (p.hp <= 0) {
      this._onPlayerDead();
    }
  }

  _onZombieKilled(z) {
    const p = this._player;
    this._createDeathExplosion(z.x, z.y);
    sound.playZombieDie();

    p.kills++;
    this._waveManager.onZombieKilled();
    bus.emit(EVENTS.ENEMY_KILLED, { kills: p.kills });

    // Bomber nổ chết
    if (z.type === 'BOMBER') {
      this._explodeGrenade(z.x, z.y, 40, 125);
    }

    // Rơi EXP
    const expCount = z.type === 'TANK' ? 4 : (Math.random() > 0.4 ? 2 : 1);
    for (let i = 0; i < expCount; i++) {
      const expItem = this._pickupPool.get();
      expItem.init(z.x, z.y, 'EXP', 6);
    }

    // Rơi Coin
    const coinChance = z.type === 'TANK' ? 0.9 : 0.35;
    if (Math.random() < coinChance) {
      const coinItem = this._pickupPool.get();
      coinItem.init(z.x, z.y, 'COIN', z.type === 'TANK' ? 3 : 1);
    }

    // Rơi Hộp Tiếp Đạn (AMMO CRATE) - Tỉ lệ thích ứng: tăng cao nếu người chơi sắp hết đạn
    const isLowAmmo = this._player.reserveAmmo < 40;
    const ammoChance = z.type === 'TANK' ? 0.8 : (isLowAmmo ? 0.45 : 0.20);
    if (Math.random() < ammoChance) {
      const ammoItem = this._pickupPool.get();
      const ammoAmount = z.type === 'TANK' ? 60 : 35;
      ammoItem.init(z.x, z.y, 'AMMO', ammoAmount);
    }

    // Rơi Hộp Cứu Thương (MEDKIT) - Tỉ lệ thích ứng: tăng cao nếu máu người chơi < 50%
    const isLowHp = this._player.hp < (this._player.maxHp * 0.55);
    const medkitChance = z.type === 'TANK' ? 0.35 : (isLowHp ? 0.22 : 0.08);
    if (Math.random() < medkitChance) {
      const medItem = this._pickupPool.get();
      const healAmount = z.type === 'TANK' ? 35 : 25;
      medItem.init(z.x, z.y, 'MEDKIT', healAmount);
    }

    this._zombiePool.release(z);
  }

  _onBossKilled() {
    this._camera.shake(0.65);
    sound.playWaveClear();
    this._createDeathExplosion(this._boss.x, this._boss.y);

    // Cơn mưa ngọc EXP và Coin khổng lồ từ Boss
    for (let i = 0; i < 15; i++) {
      const expItem = this._pickupPool.get();
      expItem.init(this._boss.x, this._boss.y, 'EXP', 10);
    }
    for (let i = 0; i < 8; i++) {
      const coinItem = this._pickupPool.get();
      coinItem.init(this._boss.x, this._boss.y, 'COIN', 2);
    }

    // Boss rơi kho tiếp tế khổng lồ: 3 Hộp Đạn lớn + 2 Hộp Cứu Thương
    for (let i = 0; i < 3; i++) {
      const ammoItem = this._pickupPool.get();
      ammoItem.init(this._boss.x, this._boss.y, 'AMMO', 50);
    }
    for (let i = 0; i < 2; i++) {
      const medItem = this._pickupPool.get();
      medItem.init(this._boss.x, this._boss.y, 'MEDKIT', 40);
    }

    this._bossBarContainer?.classList.add('boss-bar--hidden');
    this._waveManager.onBossKilled();
    this._createDamageText(this._player.x, this._player.y - 40, 'BOSS DEFEATED!', '#facc15', 2.0);
  }

  _collectPickup(item) {
    const p = this._player;

    if (item.type === 'EXP') {
      p.exp += item.value;
      sound.playPickupExp();
      this._createDamageText(item.x, item.y, `+${item.value} EXP`, '#38bdf8', 0.55);

      if (p.exp >= p.expNeeded) {
        p.exp -= p.expNeeded;
        p.level++;
        p.expNeeded = Math.round(25 * Math.pow(p.level, 1.25));
        sound.playLevelUp();
        this._showLevelUpModal();
      }
    } else if (item.type === 'COIN') {
      p.coins += item.value;
      sound.playPickupCoin();
      this._createDamageText(item.x, item.y, `+${item.value} ◈`, '#facc15', 0.65);
    } else if (item.type === 'AMMO') {
      p.reserveAmmo += item.value;
      sound.playPickupAmmo();
      this._createDamageText(item.x, item.y, `+${item.value} ĐẠN`, '#fb923c', 0.85);

      // Nếu đang hết đạn và không đang nạp, kích hoạt nạp đạn ngay lập tức
      if (p.ammo <= 0 && !p.isReloading) {
        this._startReload();
      }
    } else if (item.type === 'MEDKIT') {
      const actualHealed = Math.min(p.maxHp - p.hp, item.value);
      p.hp = Math.min(p.maxHp, p.hp + item.value);
      sound.playPickupMedkit();
      this._createDamageText(item.x, item.y, `+${Math.round(actualHealed > 0 ? actualHealed : item.value)} HP`, '#22c55e', 0.9);
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
          perk.apply(this._player);
          this._createDamageText(this._player.x, this._player.y - 30, `ĐÃ CHỌN: ${perk.name}`, perk.color, 1.2);
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
    for (let i = 0; i < 18; i++) {
      const p = this._particlePool.get();
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      p.init(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 2.5 + Math.random() * 2.5, '#991b1b', 0.65);
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
    if (this._hudAmmoBox) {
      if (p.reserveAmmo <= 0 && p.ammo <= 0) {
        this._hudAmmoBox.classList.add('hud__ammo--empty');
      } else {
        this._hudAmmoBox.classList.remove('hud__ammo--empty');
      }
    }
    if (this._hudWave) {
      this._hudWave.textContent = `${this._waveManager.currentWave}`;
    }
    if (this._hudCoin) {
      this._hudCoin.textContent = `${p.coins}`;
    }
  }

  _updateWeaponSlots() {
    const curId = this._player.currentWeapon.id;
    for (let i = 1; i <= 4; i++) {
      const slot = document.getElementById(`wslot-${i}`);
      if (slot) {
        slot.classList.remove('hud__weapon-slot--active');
      }
    }
    if (curId === 'PISTOL') document.getElementById('wslot-1')?.classList.add('hud__weapon-slot--active');
    if (curId === 'SHOTGUN') document.getElementById('wslot-2')?.classList.add('hud__weapon-slot--active');
    if (curId === 'SMG') document.getElementById('wslot-3')?.classList.add('hud__weapon-slot--active');
    if (curId === 'SNIPER') document.getElementById('wslot-4')?.classList.add('hud__weapon-slot--active');
  }

  _updateSkillCooldowns() {
    const p = this._player;
    if (this._skillCdDash) {
      const dashScale = p.dashCooldown > 0 ? (p.dashCooldown / p.dashCooldownMax) : 0;
      this._skillCdDash.style.transform = `scaleY(${dashScale})`;
    }
    if (this._skillCdGrenade) {
      const grenScale = p.grenadeCooldown > 0 ? (p.grenadeCooldown / p.grenadeCooldownMax) : 0;
      this._skillCdGrenade.style.transform = `scaleY(${grenScale})`;
    }
  }

  _updateBossBar() {
    if (!this._boss.alive) return;
    if (this._bossHpFill) {
      const pct = Math.max(0, (this._boss.hp / this._boss.maxHp) * 100);
      this._bossHpFill.style.width = `${pct}%`;
    }
    if (this._bossHpText) {
      this._bossHpText.textContent = `${Math.ceil(this._boss.hp)} / ${this._boss.maxHp}`;
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    this._camera.applyTransform(ctx);

    // 1. TileMap đường phố
    this._tileMap.render(ctx, this._camera);

    // 2. Biên thế giới
    ctx.strokeStyle = 'rgba(230, 51, 51, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this._worldW, this._worldH);

    // 3. Chướng ngại vật
    this._obstacleManager.render(ctx, this._camera);

    // 4. Particles (lớp nền)
    for (const part of this._particlePool.active) {
      part.render(ctx);
    }

    // 5. Pickups (EXP & Coins)
    for (const item of this._pickupPool.active) {
      item.render(ctx);
    }

    // 6. Lựu đạn đang bay
    for (const g of this._grenadePool.active) {
      g.render(ctx);
    }

    // 7. Đạn acid của Spitter
    for (const acid of this._acidPool.active) {
      acid.render(ctx);
    }

    // 8. Zombies
    for (const z of this._zombiePool.active) {
      z.render(ctx, alpha);
    }

    // 9. Boss The Butcher
    if (this._boss.alive) {
      this._boss.render(ctx, alpha);
    }

    // 10. Bullets
    for (const b of this._bulletPool.active) {
      b.render(ctx, alpha);
    }

    // 11. Player
    if (!this._isDead) {
      const rx = p.prevX + (p.x - p.prevX) * alpha;
      const ry = p.prevY + (p.y - p.prevY) * alpha;

      this._renderTrail(ctx, rx, ry, p);
      this._renderPlayer(ctx, rx, ry, p);
    }

    // 12. Floating Damage Texts
    for (const dt of this._damageTextPool.active) {
      dt.render(ctx);
    }

    // Debug mode
    if (this.game.debug.visible) {
      this._renderDebug(ctx, p, alpha);
    }

    ctx.restore();

    // Crosshair (Screen Space)
    this._renderCrosshair(ctx);

    if (p.isReloading && !this._isDead) {
      this._renderReloadBar(ctx);
    }

    this._renderCoords(ctx, p);
  }

  _renderTrail(ctx, rx, ry, p) {
    if (p.trail.length < 2) return;

    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const progress = i / p.trail.length;
      ctx.save();
      ctx.globalAlpha = progress * 0.25;
      ctx.fillStyle = p.isDashing ? '#38bdf8' : p.color;
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
    ctx.shadowBlur = p.isDashing ? 25 : 18;
    ctx.shadowColor = p.isDashing ? '#38bdf8' : (p.flashTimer > 0 ? '#ef4444' : p.glowColor);
    ctx.strokeStyle = p.isDashing ? '#38bdf8' : (p.flashTimer > 0 ? '#ef4444' : p.color);
    ctx.lineWidth = p.isDashing ? 3 : 2;
    ctx.globalAlpha = 0.65;
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
    } else if (p.isDashing) {
      bodyGrad.addColorStop(0, '#7dd3fc');
      bodyGrad.addColorStop(1, '#0284c7');
    } else {
      bodyGrad.addColorStop(0, '#5be98e');
      bodyGrad.addColorStop(1, '#15803d');
    }
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(rx, ry + bob, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Nòng súng thay đổi theo loại vũ khí
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.translate(rx, ry + bob);
    ctx.rotate(p.angle);

    const barrelX = p.radius - 3 - p.recoilOffset;
    const wId = p.currentWeapon.id;

    if (wId === 'SHOTGUN') {
      // Nòng súng Shotgun to bản 2 nòng
      ctx.beginPath();
      ctx.roundRect(barrelX, -5, 15, 10, 2);
      ctx.fill();
    } else if (wId === 'SMG') {
      // Nòng SMG ngắn gọn
      ctx.beginPath();
      ctx.roundRect(barrelX, -3, 11, 6, 2);
      ctx.fill();
    } else if (wId === 'SNIPER') {
      // Nòng Sniper dài
      ctx.beginPath();
      ctx.roundRect(barrelX, -2.5, 24, 5, 2);
      ctx.fill();
    } else {
      // Pistol tiêu chuẩn
      ctx.beginPath();
      ctx.roundRect(barrelX, -3, 14, 6, 2);
      ctx.fill();
    }

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

    this.game.debug.drawCircle(ctx, rx, ry, p.radius, '#22c55e');
    this.game.debug.drawCircle(ctx, rx, ry, p.magnetRadius, 'rgba(56, 189, 248, 0.15)');

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
