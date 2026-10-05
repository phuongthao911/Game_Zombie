# Dead Zone: Survival (v0.7.0)

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
| **Chuột** | Ngắm / Hướng nhìn con trỏ |
| **Chuột trái** (Giữ/Click) | Bắn súng (Pistol, Shotgun, SMG, Sniper) |
| **1 / 2 / 3 / 4** | Đổi vũ khí: `[1]` Pistol, `[2]` Shotgun, `[3]` SMG, `[4]` Sniper |
| **Space** / Shift | Kỹ năng **Dash** lướt nhanh né đòn (Kháng sát thương trong lúc lướt) |
| **Q** / G | Kỹ năng **Ném Lựu Đạn** nổ diện rộng AOE |
| **R** | Nạp đạn (Reload) |
| **F1** | Bật / Tắt Debug Overlay (FPS, UPS, Hitbox) |
| **Escape / P** | Tạm dừng (Pause Menu) |

---

## 📁 Cấu trúc thư mục

```
Game_Zombie/
├── Plan_Dead_Zone_Ultimate.docx  ← Kế hoạch phát triển chi tiết 16 Phase
└── DEAD-ZONE/
    ├── index.html                ← Game chính (Canvas + HUD + Boss Bar)
    ├── test.html                 ← Unit test runner (100% Pass)
    ├── css/
    │   ├── tokens.css            ← Design tokens & reset
    │   ├── menu.css              ← Menu, pause, game over, upgrade modal
    │   ├── hud.css               ← HUD in-game (HP, EXP, Boss bar, Skills, Weapons)
    │   └── ui.css                ← Debug overlay, toast, tooltip
    └── js/
        ├── main.js               ← Entry point & lifecycle
        ├── core/                 ← Engine modules
        │   ├── GameLoop.js       ← Fixed timestep loop (60 UPS)
        │   ├── Scene.js          ← State Machine chuyển cảnh
        │   ├── Camera.js         ← Follow player, lerp, trauma shake
        │   ├── Input.js          ← Keyboard, mouse, gamepad, weapon/skill hotkeys
        │   ├── EventBus.js       ← Pub/sub toàn cục
        │   ├── RNG.js            ← Mulberry32 seeded random
        │   ├── Pool.js           ← Object pool (tránh GC)
        │   └── Sound.js          ← Web Audio procedural synthesizer (Súng, Nổ, Roar)
        ├── data/
        │   ├── weapons.js        ← Kho vũ khí (Pistol, Shotgun, SMG, Sniper)
        │   └── perks.js          ← Danh mục 9 Perk nâng cấp Level Up
        ├── entities/
        │   ├── Bullet.js         ← Thực thể đạn
        │   ├── Zombie.js         ← 5 Loại Zombie (Normal, Runner, Tank, Bomber, Spitter)
        │   ├── Boss.js           ← Boss The Butcher (Phase 2 enrage, Telegraph cleave & rush)
        │   ├── Grenade.js        ← Lựu đạn ném nổ chậm AOE
        │   ├── AcidSpit.js       ← Đạn dịch độc của Spitter
        │   ├── Pickup.js         ← Ngọc EXP & Tiền xu Coin (Magnet physics)
        │   ├── Particle.js       ← Hạt máu, tia lửa súng, vụ nổ
        │   └── DamageText.js     ← Số sát thương nổi
        ├── systems/
        │   ├── Collision.js      ← Va chạm Circle, Box AABB, Soft push
        │   ├── WaveManager.js    ← Điều phối Wave, độ khó tăng tiến, kích hoạt Boss
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
| **5** | ✅ | AI nâng cao — 5 biến thể Zombie: Normal, Runner, Tank, Bomber, Spitter |
| **6** | ✅ | Kho vũ khí & Kỹ năng — 4 Vũ khí (Pistol, Shotgun, SMG, Sniper), Dash [Space], Lựu đạn [Q] |
| **7** | ✅ | Boss System (MỐC B) — Trùm The Butcher ở Wave 5 với Telegraph quét rìu & Lao húc |
| **8–16** | ⏳ | Gói 2 & 3: Ánh sáng & bóng đổ, Web Audio BGM, Shop nâng cấp vĩnh viễn, Save/Load |
