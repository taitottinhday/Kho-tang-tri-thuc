/* Hạt hiệu ứng trên canvas cho quà tặng – Claude Code (đợt 17): lửa, khói, tia sáng, pháo hoa, pháo giấy,
   đồng vàng bay, nước bắn, bụi tiên, lông vũ, sóng âm. Toạ độ theo phần trăm sân khấu (0–1). */
'use strict';
const QuaFx = (() => {
  function create(canvas) {
    const ctx = canvas.getContext('2d');
    let W = 1, H = 1, U = 1, raf = 0, last = 0, parts = [], emitters = [], alive = true;
    const sprites = {};
    const R = (a, b) => a + Math.random() * (b - a);
    const choose = a => a[Math.floor(Math.random() * a.length)];
    function glow(color) { // đốm sáng mềm dựng sẵn
      if (sprites[color]) return sprites[color];
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      rg.addColorStop(0, '#fff'); rg.addColorStop(0.22, color); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return (sprites[color] = c);
    }
    function size() { const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width || innerWidth; H = r.height || innerHeight; U = Math.min(W, H) / 400; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    const add = p => { if (parts.length < 900) parts.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 1, life: 1, decay: 0.012, rot: 0, vr: 0, size: 6, type: 'glow', color: '#ffd54a' }, p)); };
    const px = x => x * W, py = y => y * H;
    const api = {
      confetti(x, y, n, spread) { for (let i = 0; i < n; i++) { const a = R(-Math.PI, 0), s = R(3, 11) * U * (spread || 1); add({ x: px(x), y: py(y), vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.17 * U, drag: 0.985, type: 'paper', color: choose(['#ff5d73', '#ffd54a', '#46c77a', '#3b9cff', '#c77dff', '#ff9a3c']), size: R(5, 10) * U, rot: R(0, 6.3), vr: R(-.3, .3), decay: R(.005, .009) }); } },
      rain(n, colors) { for (let i = 0; i < n; i++) add({ x: R(0, W), y: R(-H * .6, -10), vx: R(-.6, .6), vy: R(1.5, 4) * U, g: .01, type: 'paper', color: choose(colors || ['#ffd54a', '#fff1a8', '#ff9a3c', '#ff5d73']), size: R(5, 9) * U, rot: R(0, 6.3), vr: R(-.2, .2), decay: .0035 }); },
      burst(x, y, color, n, power) { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + R(-.08, .08), s = R(2, 7) * U * (power || 1); add({ x: px(x), y: py(y), vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 0.055 * U, drag: 0.965, color, size: R(5, 9) * U, decay: R(.012, .02), trail: true }); } },
      sparks(x, y, n, colors, power) { for (let i = 0; i < n; i++) { const a = R(0, 6.283), s = R(1, 8) * U * (power || 1); add({ x: px(x), y: py(y), vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: .08 * U, drag: .96, color: choose(colors || ['#ffd54a', '#fff6c4', '#ff9a3c']), size: R(4, 11) * U, decay: R(.015, .035) }); } },
      embers(x, y, w, n) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-w, w) * W, y: py(y), vx: R(-.7, .7) * U, vy: R(-3, -1) * U, drag: .995, color: choose(['#ffb020', '#ff6a1f', '#ffd54a']), size: R(3, 9) * U, decay: R(.008, .018) }); },
      fire(x, y, n, dirY) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-9, 9) * U, y: py(y), vx: R(-1.1, 1.1) * U, vy: R(3, 8) * U * (dirY == null ? 1 : dirY), drag: .94, color: choose(['#fff2a8', '#ffb020', '#ff6a1f', '#ff3d1f']), size: R(14, 30) * U, decay: R(.035, .07), shrink: .97 }); },
      smoke(x, y, n) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-26, 26) * U, y: py(y), vx: R(-2.6, 2.6) * U, vy: R(.2, 2) * U, drag: .97, type: 'smoke', size: R(18, 44) * U, grow: 1.018, life: .5, decay: R(.004, .009) }); },
      dust(x, y, n) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-60, 60) * U, y: py(y) + R(-6, 6), vx: R(-3, 3) * U, vy: R(-1.2, -.1) * U, drag: .95, type: 'smoke', tint: '215,170,110', size: R(10, 26) * U, grow: 1.02, life: .55, decay: .012 }); },
      splash(x, y, n) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-30, 30) * U, y: py(y), vx: R(-3.6, 3.6) * U, vy: R(-10, -2.5) * U, g: .32 * U, type: 'drop', size: R(2.5, 6.5) * U, decay: R(.012, .02) }); },
      magic(x, y, n, colors) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-20, 20) * U, y: py(y) + R(-20, 20) * U, vx: R(-1, 1) * U, vy: R(-.8, 1.2) * U, drag: .98, type: 'star', color: choose(colors || ['#fff', '#ffe27a', '#ff9ee0', '#9ee8ff', '#c9a6ff']), size: R(4, 13) * U, rot: R(0, 6), vr: R(-.1, .1), decay: R(.012, .025) }); },
      coins(x, y, n, img) { for (let i = 0; i < n; i++) add({ x: px(x) + R(-30, 30) * U, y: py(y), vx: R(-5.5, 5.5) * U, vy: R(-13, -6) * U, g: .33 * U, drag: .995, type: 'coin', img, size: R(13, 25) * U, rot: R(0, 6.3), vr: R(.1, .34), decay: R(.0055, .009) }); },
      image(img, x, y, o) { add(Object.assign({ x: px(x), y: py(y), type: 'img', img, size: 24 * U, decay: .006 }, o)); },
      ring(x, y, color, width) { add({ x: px(x), y: py(y), type: 'ring', color: color || '#fff3c0', size: 10 * U, grow: 1, speed: 15 * U, width: (width || 9) * U, decay: .028 }); },
      firework(x, color, topY) { // đạn bay lên rồi nổ
        add({ x: px(x), y: H + 8, vx: R(-.6, .6), vy: -Math.sqrt(2 * .2 * U * (H - py(topY))), g: .2 * U, type: 'shell', color: '#ffe9a8', size: 6 * U, decay: .004, trail: true, burstColor: color });
      },
      every(ms, fn, forMs) { const e = { ms, fn, t: 0, left: forMs == null ? 1e9 : forMs }; emitters.push(e); return () => { e.left = 0; }; },
      stop() { alive = false; cancelAnimationFrame(raf); parts = []; emitters = []; removeEventListener('resize', size); },
      freeze() { cancelAnimationFrame(raf); raf = 0; },
      size: () => ({ W, H, U })
    };
    function draw(p) {
      const a = Math.max(0, Math.min(1, p.life * 1.6));
      if (p.type === 'glow' || p.type === 'shell') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        if (p.trail) { ctx.strokeStyle = p.type === 'shell' ? '#ffd98a' : p.color; ctx.lineWidth = p.size * .32; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 3.2, p.y - p.vy * 3.2); ctx.stroke(); }
        ctx.drawImage(glow(p.color), p.x - p.size, p.y - p.size, p.size * 2, p.size * 2); ctx.globalCompositeOperation = 'source-over';
      } else if (p.type === 'paper') {
        ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.abs(Math.sin(p.rot * 2.3)) * .85 + .15); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size * .72, p.size, p.size * 1.44); ctx.restore();
      } else if (p.type === 'star') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? p.size * .22 : p.size, an = i * .785398; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        ctx.fill(); ctx.restore(); ctx.globalCompositeOperation = 'source-over';
      } else if (p.type === 'smoke') {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size), t = p.tint || '226,232,245'; g.addColorStop(0, 'rgba(' + t + ',' + Math.max(0, p.life) + ')'); g.addColorStop(1, 'rgba(' + t + ',0)'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.fill();
      } else if (p.type === 'drop') {
        ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillStyle = 'rgba(215,244,255,.95)'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.7, p.size * .7, 0, 0, 6.3); ctx.fill(); ctx.restore();
      } else if (p.type === 'coin' || p.type === 'img') {
        if (!p.img || !p.img.complete || !p.img.naturalWidth) return;
        ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); if (p.type === 'coin') ctx.scale(Math.max(.14, Math.abs(Math.cos(p.rot))), 1); else ctx.rotate(p.rot);
        ctx.drawImage(p.img, -p.size, -p.size * p.img.naturalHeight / p.img.naturalWidth, p.size * 2, p.size * 2 * p.img.naturalHeight / p.img.naturalWidth); ctx.restore();
      } else if (p.type === 'ring') {
        ctx.globalAlpha = Math.max(0, p.life) * .45; ctx.strokeStyle = p.color; ctx.lineWidth = p.width * .55 * p.life + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.stroke();
      }
    }
    function tick(t) {
      if (!alive) return; raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(50, t - last) : 16.7; last = t; const k = dt / 16.7;
      for (const e of emitters) { if (e.left <= 0) continue; e.left -= dt; e.t += dt; while (e.t >= e.ms) { e.t -= e.ms; e.fn(); } }
      emitters = emitters.filter(e => e.left > 0);
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += p.g * k; if (p.drag !== 1) { const d = Math.pow(p.drag, k); p.vx *= d; p.vy *= d; }
        p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.life -= p.decay * k;
        if (p.grow && p.type !== 'ring') p.size *= Math.pow(p.grow, k); if (p.shrink) p.size *= Math.pow(p.shrink, k);
        if (p.type === 'ring') p.size += p.speed * k;
        if (p.type === 'paper' && p.vy > 2.4) { p.vy = 2.4; p.x += Math.sin(p.rot * 1.7) * 1.3; }
        if (p.type === 'shell' && p.vy > -1.2) { parts.splice(i, 1); const x = p.x / W, y = p.y / H; api.burst(x, y, p.burstColor, 54, 1.15); api.burst(x, y, '#fff3c4', 18, .55); api.ring(x, y, p.burstColor, 3); if (api.onBoom) api.onBoom(); continue; }
        if (p.life <= 0 || p.y > H + 120) { parts.splice(i, 1); continue; }
        draw(p);
      }
      ctx.globalAlpha = 1;
    }
    size(); addEventListener('resize', size); raf = requestAnimationFrame(tick);
    return api;
  }
  return { create };
})();
