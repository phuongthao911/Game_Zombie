/**
 * Game — Lớp điều phối trung tâm
 * Quản lý canvas, game loop, state machine, debug overlay
 */
import { GameLoop }     from './core/GameLoop.js';
import { StateMachine, SCENES } from './core/Scene.js';
import { input }        from './core/Input.js';
import { bus, EVENTS }  from './core/EventBus.js';
import { DebugOverlay } from './dev/DebugOverlay.js';
import { MenuScene }    from './ui/MenuScene.js';
import { GameScene }    from './ui/GameScene.js';

class Game {
  constructor() {
    // ---- Canvas setup ----
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d', { alpha: false });

    this._resize();
    window.addEventListener('resize', () => this._resize());

    // ---- Systems ----
    this.debug        = new DebugOverlay();
    this.stateMachine = new StateMachine();

    // ---- Game Loop ----
    this.loop = new GameLoop({
      update: (dt, elapsed) => this._update(dt, elapsed),
      render: (alpha)       => this._render(alpha),
      onFPS:  (fps, ups)    => this._onFPS(fps, ups),
    });

    // ---- Scenes ----
    this.stateMachine.register(SCENES.MENU,    new MenuScene(this));
    this.stateMachine.register(SCENES.GAME,    new GameScene(this));

    // ---- Input shortcuts ----
    document.addEventListener('keydown', e => {
      if (e.code === 'F1') { e.preventDefault(); this.debug.toggle(); }
    });

    // ---- Event listeners ----
    bus.on(EVENTS.GAME_OVER, data => this._onGameOver(data));
  }

  /** Khởi động — gọi 1 lần khi load xong */
  async start() {
    await this._preload();
    this.stateMachine.change(SCENES.MENU);
    this.loop.start();
  }

  /** Giả lập preload (Phase 1: không có asset thật) */
  async _preload() {
    const progress = document.getElementById('loading-progress');
    const steps = 5;

    const loadingScreen = document.getElementById('screen-loading');

    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, 180));
      if (progress) progress.style.width = `${(i / steps) * 100}%`;
    }

    await new Promise(r => setTimeout(r, 200));

    // Ẩn loading screen
    loadingScreen.classList.add('screen--hidden');
    loadingScreen.classList.remove('screen--active');
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Thông báo cho scene hiện tại (camera resize)
    if (this.stateMachine?.currentName === SCENES.GAME) {
      // sẽ được xử lý ở GameScene Phase 4
    }
  }

  _update(dt, elapsed) {
    this.stateMachine.update(dt, elapsed);
    input.flush();
  }

  _render(alpha) {
    this.ctx.save();
    this.stateMachine.render(this.ctx, alpha);
    this.ctx.restore();

    // Debug overlay DOM
    this.debug.render();
  }

  _onFPS(fps, ups) {
    // Update debug overlay
    this.debug.set('FPS', fps, fps >= 55 ? '#22c55e' : fps >= 30 ? '#ff8c00' : '#ef4444');
    this.debug.set('UPS', ups);
    this.debug.set('Scene', this.stateMachine.currentName ?? '—', '#38bdf8');
    this.debug.set('Canvas', `${this.canvas.width}×${this.canvas.height}`, '#a0a0b0');
  }

  _onGameOver(data) {
    const screen = document.getElementById('screen-gameover');
    screen?.classList.remove('screen--hidden');
    screen?.classList.add('screen--active');

    document.getElementById('go-wave').textContent = data?.wave ?? 0;
    document.getElementById('go-kills').textContent = data?.kills ?? 0;
    const sec = Math.floor((data?.elapsed ?? 0));
    document.getElementById('go-time').textContent =
      `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      screen.classList.add('screen--hidden');
      this.stateMachine.change(SCENES.GAME);
    }, { once: true });

    document.getElementById('btn-menu')?.addEventListener('click', () => {
      screen.classList.add('screen--hidden');
      this.stateMachine.change(SCENES.MENU);
    }, { once: true });
  }
}

// ---- Bootstrap ----
const game = new Game();
game.start().catch(console.error);
