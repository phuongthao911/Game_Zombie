import { Scene } from '../core/Scene.js';
import { SCENES } from '../core/Scene.js';

/**
 * MenuScene — Màn hình menu chính với background animation
 */
export class MenuScene extends Scene {
  constructor(game) {
    super(game);
    this._particles = [];
    this._time = 0;

    // DOM refs
    this._screenMenu   = document.getElementById('screen-menu');
    this._bgCanvas     = document.getElementById('menu-bg-canvas');
    this._bgCtx        = this._bgCanvas.getContext('2d');

    // Buttons
    document.getElementById('btn-play').addEventListener('click', () => {
      this.game.stateMachine.change(SCENES.GAME);
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
      console.log('[Menu] Settings — coming in Phase 12');
    });
    document.getElementById('btn-credits').addEventListener('click', () => {
      console.log('[Menu] Credits — coming in Phase 12');
    });
  }

  onEnter() {
    this._screenMenu.classList.remove('screen--hidden');
    this._screenMenu.classList.add('screen--active');
    this._resizeBg();
    this._initParticles();
  }

  onExit() {
    this._screenMenu.classList.add('screen--hidden');
    this._screenMenu.classList.remove('screen--active');
  }

  _resizeBg() {
    this._bgCanvas.width  = window.innerWidth;
    this._bgCanvas.height = window.innerHeight;
  }

  _initParticles() {
    this._particles = [];
    for (let i = 0; i < 60; i++) {
      this._particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.05,
        hue: Math.random() > 0.7 ? 0 : 220,  // red or blue particles
      });
    }
  }

  update(dt) {
    this._time += dt;

    const W = this._bgCanvas.width;
    const H = this._bgCanvas.height;

    this._particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
  }

  render(ctx, alpha) {
    const bctx = this._bgCtx;
    const W = this._bgCanvas.width;
    const H = this._bgCanvas.height;

    // Fade trail
    bctx.fillStyle = 'rgba(10,10,15,0.15)';
    bctx.fillRect(0, 0, W, H);

    // Grid lines (atmosphere)
    bctx.save();
    bctx.strokeStyle = 'rgba(230,51,51,0.04)';
    bctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = (this._time * 8) % gridSize;
    const offsetY = (this._time * 4) % gridSize;
    for (let x = -gridSize + offsetX; x < W + gridSize; x += gridSize) {
      bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, H); bctx.stroke();
    }
    for (let y = -gridSize + offsetY; y < H + gridSize; y += gridSize) {
      bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(W, y); bctx.stroke();
    }
    bctx.restore();

    // Particles
    this._particles.forEach(p => {
      bctx.save();
      bctx.globalAlpha = p.alpha;
      bctx.fillStyle = `hsl(${p.hue},70%,60%)`;
      bctx.shadowBlur = 8;
      bctx.shadowColor = `hsl(${p.hue},80%,50%)`;
      bctx.beginPath();
      bctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bctx.fill();
      bctx.restore();
    });

    // Central glow
    const cx = W / 2, cy = H / 2;
    const pulse = 0.6 + Math.sin(this._time * 0.8) * 0.4;
    const grad = bctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.5);
    grad.addColorStop(0, `rgba(180,0,0,${0.04 * pulse})`);
    grad.addColorStop(1, 'transparent');
    bctx.fillStyle = grad;
    bctx.fillRect(0, 0, W, H);
  }
}
