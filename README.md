# Dead Zone: Survival (v0.4.0)

**2D Top-Down Zombie Survival Game** — HTML5 Canvas + JavaScript ES Modules + Web Audio API.  
Chạy hoàn toàn trên trình duyệt, không cần build tool, không thư viện ngoài.

---

## 🎮 Cách chạy Game

1. Mở thư mục dự án trong VS Code.
2. Click chuột phải vào `DEAD-ZONE/index.html` → **Open with Live Server**.
3. Game chạy tại địa chỉ: `http://127.0.0.1:5500/` (hoặc `http://127.0.0.1:5500/index.html`).

## 🧪 Chạy Unit Tests

Mở `DEAD-ZONE/test.html` với Live Server: `http://127.0.0.1:5500/test.html`

---

## 🕹️ Điều khiển

| Phím / Chuột | Hành động |
|--------------|-----------|
| **W A S D** / Mũi tên | Di chuyển nhân vật 8 hướng |
| **Chuột** | Ngắm / Hướng nhìn |
| **Chuột trái** (Giữ/Click) | Bắn súng (Pistol) |
| **R** | Nạp đạn (Reload) |
| **F1** | Bật / Tắt Debug Overlay (FPS, UPS, Hitbox) |
| **Escape / P** | Tạm dừng (Pause Menu) |

---

## 📁 Cấu trúc thư mục

```
Game_Zombie/
├── Plan_Dead_Zone_Ultimate.docx  ← Kế hoạch phát triển chi tiết 16 Phase
└── DEAD-ZONE/
    ├── index.html                ← Game chính (Canvas + HUD)
    ├── test.html                 ← Unit test runner (100% Pass)
    ├── css/
    │   ├── tokens.css            ← Design tokens & reset
    │   ├── menu.css              ← Menu, pause, game over, upgrade modal
    │   ├── hud.css               ← HUD in-game (HP, EXP, Wave, Ammo, Coin)
    │   └── ui.css                ← Debug overlay, toast, tooltip
    └── js/
        ├── main.js               ← Entry point & lifecycle
        ├── core/                 ← Engine modules
        │   ├── GameLoop.js       ← Fixed timestep loop (60 UPS)
        │   ├── Scene.js          ← State Machine chuyển cảnh
        │   ├── Camera.js         ← Follow player, lerp, trauma shake
        │   ├── Input.js          ← Keyboard, mouse, gamepad
        │   ├── EventBus.js       ← Pub/sub toàn cục
        │   ├── RNG.js            ← Mulberry32 seeded random
        │   ├── Pool.js           ← Object pool (tránh GC)
        │   └── Sound.js          ← Web Audio procedural synthesizer
        ├── data/
        │   └── perks.js          ← Danh mục 9 Perk nâng cấp Level Up
        ├── entities/
        │   ├── Bullet.js         ← Thực thể đạn
        │   ├── Zombie.js         ← Zombie đuổi theo, knockback, hit-flash
        │   ├── Pickup.js         ← Ngọc EXP & Tiền xu Coin (Magnet physics)
        │   ├── Particle.js       ← Hạt máu, tia lửa súng
        │   └── DamageText.js     ← Số sát thương nổi
        ├── systems/
        │   ├── Collision.js      ← Va chạm Circle, Box AABB, Soft push
        │   ├── WaveManager.js    ← Điều phối Wave, độ khó tăng tiến
        │   └── SpatialHash.js    ← Phân vùng không gian tối ưu 100+ zombie
        ├── world/
        │   ├── TileMap.js        ← Bản đồ đường phố đô thị
        │   └── Obstacles.js      ← Khối container, thùng hàng chắn đường & đạn
        ├── ui/
        │   ├── MenuScene.js      ← Màn hình Menu chính
        │   └── GameScene.js      ← Vòng lặp gameplay chính
        └── dev/
            └── DebugOverlay.js   ← Bảng thông số kỹ thuật (F1)
```

---

## 🏆 Tiến độ các Phase

| Phase | Trạng thái | Nội dung |
|:---:|:---:|---|
| **0** | ✅ | Nền tảng, cấu trúc thư mục, quy ước code |
| **1** | ✅ | Engine core — Fixed timestep loop, Camera, Input, EventBus, Pool |
| **2** | ✅ | Combat gray-box — Bắn súng, Zombie đuổi, va chạm, sát thương, âm thanh synth |
| **3** | ✅ | Vòng lặp lõi — Wave System, EXP Orbs, Coin, Level Up chọn 1 trong 3 Perk |
| **4** | ✅ | Thế giới & Vật cản — TileMap đô thị, Chướng ngại vật Container/Crate, SpatialHash 100+ zombie |
| **5** | ⏳ | AI nâng cao — Runner, Tank, Bomber, Spitter, Flanking tactics |
| **6** | ⏳ | Kho vũ khí & Kỹ năng — Shotgun, SMG, Sniper, Dash, Lựu đạn |
| **7** | ⏳ | Boss System — Trùm The Butcher ở Wave 5 |
| **8–16** | ⏳ | Ánh sáng & bóng đổ, Web Audio BGM, Shop nâng cấp, Save/Load |
