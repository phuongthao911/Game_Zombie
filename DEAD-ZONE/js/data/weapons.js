/**
 * WEAPONS — Cấu hình kho vũ khí đa dạng của người chơi
 * Chuyển đổi linh hoạt bằng phím số 1, 2, 3, 4
 */

export const WEAPONS = {
  PISTOL: {
    id: 'PISTOL',
    name: 'Pistol 9mm',
    icon: '🔫',
    slot: 1,
    fireRate: 0.18,       // ~5.5 viên/s
    damage: 25,
    speed: 920,
    pellets: 1,           // 1 viên mỗi lần bắn
    spread: 0.06,         // Độ lệch góc rất nhỏ
    ammoMax: 30,
    reloadDuration: 1.1,
    pierce: 0,
    cameraShake: 0.06,
    sound: 'shootPistol',
    desc: 'Vũ khí cân bằng, độ giật nhẹ, độ chính xác cao.'
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'Shotgun 12G',
    icon: '💥',
    slot: 2,
    fireRate: 0.65,       // ~1.5 phát/s
    damage: 18,           // Mỗi pellet 18 dmg x 6 viên = 108 dmg max!
    speed: 850,
    pellets: 6,           // Bắn chùm 6 viên hình nón
    spread: 0.28,         // Góc tỏa nón rộng
    ammoMax: 8,
    reloadDuration: 1.8,
    pierce: 0,
    knockbackForce: 240,  // Đẩy lùi cực mạnh
    cameraShake: 0.18,
    sound: 'shootShotgun',
    desc: 'Bắn chùm 6 viên đạn tỏa nón, đẩy lùi mạnh, cực mạnh ở cự ly gần.'
  },
  SMG: {
    id: 'SMG',
    name: 'Vector SMG',
    icon: '⚡',
    slot: 3,
    fireRate: 0.08,       // ~12.5 viên/s xả cực nhanh!
    damage: 16,
    speed: 980,
    pellets: 1,
    spread: 0.14,
    ammoMax: 50,
    reloadDuration: 1.4,
    pierce: 0,
    cameraShake: 0.05,
    sound: 'shootSMG',
    desc: 'Tốc độ xả đạn thần tốc, băng đạn lớn, quét sạch đám đông.'
  },
  SNIPER: {
    id: 'SNIPER',
    name: 'AWP .50 Cal',
    icon: '🎯',
    slot: 4,
    fireRate: 1.1,        // ~0.9 phát/s
    damage: 160,          // 1 hit tiêu diệt hầu hết quái thường!
    speed: 1600,          // Đạn siêu thanh
    pellets: 1,
    spread: 0.01,         // Siêu chính xác
    ammoMax: 5,
    reloadDuration: 2.0,
    pierce: 999,          // Xuyên qua tất cả mục tiêu trên đường thẳng!
    cameraShake: 0.28,
    sound: 'shootSniper',
    desc: 'Đạn siêu thanh bắn xuyên thẳng qua toàn bộ zombie, sát thương khổng lồ.'
  }
};
