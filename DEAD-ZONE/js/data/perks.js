/**
 * PERKS — Danh mục các nâng cấp khi người chơi lên cấp (Level Up)
 */
export const PERKS = [
  {
    id: 'DAMAGE',
    name: 'Sát Thương Đạn',
    icon: '💥',
    desc: '+25% Sát thương cho mỗi phát bắn',
    rarity: 'common',
    color: '#ef4444',
    apply: (player) => {
      player.damageMultiplier = (player.damageMultiplier || 1) + 0.25;
    }
  },
  {
    id: 'FIRE_RATE',
    name: 'Tốc Độ Bắn',
    icon: '⚡',
    desc: '+20% Tốc độ xả đạn nhanh hơn',
    rarity: 'common',
    color: '#facc15',
    apply: (player) => {
      player.fireRate = Math.max(0.08, player.fireRate * 0.82);
    }
  },
  {
    id: 'MOVE_SPEED',
    name: 'Giày Cơ Động',
    icon: '👟',
    desc: '+18% Tốc độ di chuyển né đòn',
    rarity: 'common',
    color: '#38bdf8',
    apply: (player) => {
      player.speed = Math.round(player.speed * 1.18);
    }
  },
  {
    id: 'MAX_HP',
    name: 'Giáp Thép Siêu Bền',
    icon: '🛡️',
    desc: '+30 Máu tối đa và hồi ngay 30 HP',
    rarity: 'rare',
    color: '#22c55e',
    apply: (player) => {
      player.maxHp += 30;
      player.hp = Math.min(player.maxHp, player.hp + 30);
    }
  },
  {
    id: 'MAG_SIZE',
    name: 'Băng Đạn Mở Rộng',
    icon: '📦',
    desc: '+12 Viên đạn trong mỗi băng và +60 đạn dự phòng',
    rarity: 'common',
    color: '#fb923c',
    apply: (player) => {
      player.maxAmmo += 12;
      player.ammo += 12;
      player.reserveAmmo += 60;
    }
  },
  {
    id: 'MAGNET',
    name: 'Nam Châm Hút Ngọc',
    icon: '🧲',
    desc: '+60% Bán kính tự động hút EXP & Coin từ xa',
    rarity: 'rare',
    color: '#a855f7',
    apply: (player) => {
      player.magnetRadius = (player.magnetRadius || 120) * 1.6;
    }
  },
  {
    id: 'PIERCING',
    name: 'Đạn Xuyên Phá',
    icon: '🏹',
    desc: 'Đạn có thể bắn xuyên qua 1 zombie để trúng thêm mục tiêu',
    rarity: 'epic',
    color: '#ec4899',
    apply: (player) => {
      player.bulletPiercing = (player.bulletPiercing || 0) + 1;
    }
  },
  {
    id: 'RELOAD_SPEED',
    name: 'Nạp Đạn Nhanh',
    icon: '🔄',
    desc: '-30% Thời gian nạp đạn (Reload cực nhanh)',
    rarity: 'common',
    color: '#60a5fa',
    apply: (player) => {
      player.reloadDuration = Math.max(0.4, player.reloadDuration * 0.7);
    }
  },
  {
    id: 'HEALTH_REGEN',
    name: 'Tế Bào Tái Tạo',
    icon: '💖',
    desc: 'Tự động hồi phục 2 HP mỗi 2.5 giây',
    rarity: 'epic',
    color: '#f43f5e',
    apply: (player) => {
      player.regenRate = (player.regenRate || 0) + 2;
    }
  }
];

/**
 * Lấy ngẫu nhiên N nâng cấp không trùng nhau
 * @param {number} [count=3]
 * @returns {Array}
 */
export function getRandomPerks(count = 3) {
  const shuffled = [...PERKS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
