# Dead Zone: Survival

**2D top-down zombie survival game** — HTML5 Canvas + JavaScript ES Modules + Web Audio API  
Chạy hoàn toàn trên trình duyệt, không cần build tool, không thư viện ngoài.

## Yêu cầu

- Trình duyệt hiện đại (Chrome / Edge / Firefox)
- Extension **Live Server** (VS Code) để chạy ES Modules

## Cách chạy

1. Mở thư mục `DEAD-ZONE/` trong VS Code
2. Click chuột phải vào `index.html` → **Open with Live Server**
3. Game chạy tại `http://127.0.0.1:5500/`

## Chạy Tests

Mở `test.html` với Live Server: `http://127.0.0.1:5500/test.html`

## Điều khiển

| Phím / Chuột | Hành động |
|--------------|-----------|
| W A S D / Arrow keys | Di chuyển |
| Chuột | Hướng nhìn / Ngắm |
| Chuột trái (Giữ / Click) | Bắn súng (Pistol) |
| R | Nạp đạn (Reload) |
| F1 | Bật/tắt Debug Overlay |
| Escape / P | Tạm dừng |

## Cấu trúc thư mục

```
DEAD-ZONE/
├── index.html          ← Game chính
├── test.html           ← Unit test runner
├── css/
│   ├── tokens.css      ← Design tokens & reset
│   ├── menu.css        ← Menu, pause, game over
│   ├── hud.css         ← HUD in-game
│   └── ui.css          ← Debug, toast, tooltip
├── js/
│   ├── main.js         ← Entry point
│   ├── core/           ← Engine modules
│   │   ├── GameLoop.js ← Fixed timestep loop
│   │   ├── Scene.js    ← StateMachine
│   │   ├── Camera.js   ← Follow + shake
│   │   ├── Input.js    ← Keyboard/mouse/gamepad
│   │   ├── EventBus.js ← Pub/sub
│   │   ├── RNG.js      ← Seeded random (Mulberry32)
│   │   ├── Pool.js     ← Object pool
│   │   └── Sound.js    ← Web Audio synthesizer (SFX súng, quái, va chạm, level up, wave)
│   ├── data/
│   │   └── perks.js    ← Danh mục Perk nâng cấp Level Up
│   ├── entities/       ← Entities
│   │   ├── Bullet.js   ← Đạn người chơi (Pool)
│   │   ├── Zombie.js   ← Kẻ địch cơ bản (Pool)
│   │   ├── Pickup.js   ← Ngọc EXP & Tiền xu Coin (Pool)
│   │   ├── Particle.js ← Hạt máu, tia lửa súng (Pool)
│   │   └── DamageText.js ← Số sát thương nổi (Pool)
│   ├── systems/
│   │   ├── Collision.js  ← Va chạm 2D (Circle, Circle-Box, Soft separation)
│   │   ├── WaveManager.js← Quản lý các đợt Wave, độ khó tăng tiến
│   │   └── SpatialHash.js← Phân vùng không gian tối ưu 100+ zombie
│   ├── world/
│   │   ├── TileMap.js   ← Nền đường nhựa, vạch kẻ đường đô thị
│   │   └── Obstacles.js ← Khối bê tông, thùng hàng, container chắn đạn & đường
│   ├── ui/
│   │   ├── MenuScene.js
│   │   └── GameScene.js ← Combat & Vòng lặp gameplay chính
│   └── dev/
│       └── DebugOverlay.js
└── tests/              ← (tương lai: test modules riêng)
```

## Lộ trình Phase

| Phase | Trạng thái | Nội dung |
|-------|-----------|---------|
| 0 | ✅ | Nền tảng, cấu trúc thư mục |
| 1 | ✅ | Engine core — hình tròn di chuyển, FPS |
| 2 | ✅ | Combat gray-box — bắn súng, bullet pool, zombie đuổi, va chạm, sát thương |
| 3 | ✅ | Vòng lặp lõi — Wave System, EXP Orbs, Coin, Level Up chọn 1 trong 3 Perk |
| 4 | ✅ | Thế giới & Pathfinding — TileMap đô thị, Chướng ngại vật Container/Crate, SpatialHash 100+ zombie |
| 5 | ⏳ | AI nâng cao, Director, Flanking, Pack tactics |
| ... | | |
