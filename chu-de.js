/* Cảnh nền học sinh lấy từ lựa chọn do giáo viên công bố. Nạp sau noel.js. */
'use strict';
(function () {
  const { options: SEASONS, cacheKey } = SeasonCatalog;
  const initialKey = 'vuonchu.initialSeason';
  const validSeason = value => typeof value === 'string' && Object.hasOwn(SEASONS, value);
  function readSeason(key) {
    try { const value = localStorage.getItem(key); return validSeason(value) ? value : null; }
    catch { return null; }
  }
  function cacheSeason(key, value) { try { localStorage.setItem(key, value); } catch {} }
  const IMG = { w: 1120, h: 747 };
  const today = () => window.NOEL_TODAY ? new Date(window.NOEL_TODAY) : new Date();
  const calm = () => document.body.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Chọn mùa ---------- */
  function autoSeason() {
    const d = today(), m = d.getMonth() + 1, day = d.getDate();
    if ((m === 11 && day >= 15) || m === 12 || (m === 1 && day <= 10)) return 'noel';
    if ((m === 1 && day > 10) || m === 2) return 'tet';
    if ((m === 8 && day >= 20) || (m === 9 && day <= 14)) return 'khaigiang';
    if ((m === 9 && day >= 15) || (m === 10 && day <= 10)) return 'trungthu';
    if (m === 11) return 'nhagiao';
    if ((m === 5 && day >= 15) || m === 6 || m === 7 || (m === 8 && day < 20)) return 'thieunhi';
    return 'none';
  }
  function previousSeason() {
    const s = db.settings.season;
    if (validSeason(s)) return s;
    if (db.settings.noel === 'off') return 'none';
    if (db.settings.noel === 'on') return 'noel';
    return autoSeason();
  }
  const initial = readSeason(initialKey) || previousSeason();
  cacheSeason(initialKey, initial);
  let published = readSeason(cacheKey);
  function seasonId() { return published || initial; }
  window.seasonId = seasonId;
  window.SEASONS = SEASONS;
  window.noelOn = () => seasonId() === 'noel';        // phần “Noel” cũ (tuyết, lịch, người tuyết…) chỉ chạy đúng mùa Noel
  window.seasonMeta = () => (SEASONS[seasonId()] || {}).meta || '';
  window.seasonNightMeta = () => SEASONS[seasonId()].nightMeta || '';
  window.seasonIcon = () => (SEASONS[seasonId()] || {}).icon || '🌱';

  // Trang trí nổi và chuyển động chậm, trên cùng một lớp với tranh nền.
  const cloud = (y, period, delay, scale) => '<span class="cd-cloud-bank" style="--cloud-y:' + y +
    '%;--cloud-period:' + period + 's;--cloud-delay:' + delay + 's;--cloud-scale:' + scale + '"></span>';
  const plane = '<span class="cd-paper-plane"><i></i></span>';
  const accents = {
    khaigiang: () => cloud(11, 95, -21, 1) + cloud(19, 128, -66, .7) + plane,
    thieunhi: () => '<div class="cd-surface-light"></div>',
    nhagiao: () => '<div class="cd-veranda-light"></div>',
    none: () => '<div class="cd-canopy-light"></div>'
  };

  /* ---------- Điểm sáng đặt đúng chỗ trên tranh (toạ độ theo tỉ lệ ảnh gốc 1120×747, ảnh phủ kín màn hình) ---------- */
  const GLOWS = {
    tet: [['fire', .5, .8, .13], ['lamp', .945, .13, .07], ['lamp', .635, .29, .06], ['lamp', .9, .275, .045], ['lamp', .5, .15, .0], ['sun', .395, .325, .05]],
    trungthu: [['moon', .63, .145, .17], ['lamp', .605, .36, .1], ['lamp', .24, .45, .07], ['lamp', .425, .66, .07], ['lamp', .235, .16, .07], ['lamp', .14, .33, .05], ['lamp', .1, .42, .04], ['water', .78, .66, .2]]
  };
  function artGeom(id) {
    const W = innerWidth, H = innerHeight, s = Math.max(W / IMG.w, H / IMG.h);
    const scene = SEASONS[id];
    const ax = (W < 640 ? scene.mobileX : null) ?? scene.ax ?? .5;
    const ox = (W - IMG.w * s) * ax, oy = (H - IMG.h * s) * .6;
    return { s, px: fx => ox + fx * IMG.w * s, py: fy => oy + fy * IMG.h * s, pos: (ax * 100) + '% 60%' };
  }
  function layoutArt(id) {
    const sky = document.querySelector('.cd-sky'); if (!sky || !SEASONS[id].art) return;
    const g = artGeom(id);
    sky.style.setProperty('--art-pos', g.pos);
    sky.querySelectorAll('.cd-glow').forEach(el => {
      const [, fx, fy, fr] = [0].concat(el.dataset.g.split(',').map(Number));
      const r = Math.max(24, fr * IMG.w * g.s);
      el.style.cssText += ';left:' + (g.px(fx) - r) + 'px;top:' + (g.py(fy) - r) + 'px;width:' + r * 2 + 'px;height:' + r * 2 + 'px';
      el.hidden = g.px(fx) < -r || g.px(fx) > innerWidth + r;
    });
    if (id === 'tet') fireAt = { x: g.px(.5), y: g.py(.77) };
  }

  /* ---------- Tầng hiệu ứng (canvas): cánh hoa, bóng bay, bong bóng, đom đóm, đèn trời, pháo hoa, tia lửa ---------- */
  let cv = null, ctx = null, W = 0, H = 0, raf = 0, last = 0, parts = [], bursts = [], nextBurst = 0, curId = '', fireAt = null;
  const R = (a, b) => a + Math.random() * (b - a);
  const PAL = { petal: ['#ff8fb3', '#ffb3c8', '#ffd23f', '#ffe27a', '#ff6f91'], rose: ['#ff7aa8', '#ffc2d6', '#ffe27a', '#ffffff', '#ff9ec0'], balloon: ['#ff5d73', '#ffd54a', '#46c77a', '#3b9cff', '#b66cff', '#ff9a3c'] };
  function sizeCanvas() {
    if (!cv) return; const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function mk(kind, anyY) {
    const c = PAL[kind] ? PAL[kind][Math.floor(Math.random() * PAL[kind].length)] : '#fff';
    const p = { kind, x: R(0, W), y: anyY ? R(0, H) : -20, c, r: R(6, 12), vy: R(.5, 1.3), w: R(0, 6.3), ws: R(.01, .03), rot: R(0, 6.3), vr: R(-.04, .04), a: R(.75, 1) };
    if (kind === 'balloon') { p.r = R(14, 24); p.y = anyY ? R(0, H) : H + 50; p.vy = -R(.35, .8); p.vr = 0; }
    if (kind === 'bubble') { p.r = R(8, 26); p.y = anyY ? R(0, H) : H + 40; p.vy = -R(.3, .9); p.a = R(.5, .9); p.hue = Math.floor(R(170, 330)); }
    if (kind === 'lantern') { p.r = R(14, 20); p.y = anyY ? R(H * .3, H) : H + 40; p.vy = -R(.25, .55); p.x = R(0, W); p.a = .9; }
    if (kind === 'firefly') { p.r = R(2, 3.6); p.y = R(H * .4, H); p.vy = 0; p.vx = R(-.3, .3); p.ph = R(0, 6.3); p.a = 1; }
    if (kind === 'kite' || kind === 'butterfly') {
      p.r = kind === 'kite' ? R(12, 21) : R(6, 11);
      p.y = kind === 'kite' ? R(H * .12, H * .34) : R(H * .42, H * .94);
      p.x = Math.random() < .5 ? R(W * .05, W * .26) : R(W * .74, W * .95);
      p.c = kind === 'kite' ? '#ffc866' : (Math.random() < .5 ? '#f4be74' : '#aee7e3');
      p.vx = R(-.18, .18); p.a = .82;
    }
    return p;
  }
  function ellipse(x, y, rx, ry, rot, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.3); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
  function drawPart(p, t) {
    ctx.globalAlpha = p.a;
    if (p.kind === 'petal') { // hoa đào / hoa mai 5 cánh
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      for (let i = 0; i < 5; i++) { ctx.rotate(1.2566); ctx.beginPath(); ctx.ellipse(0, -p.r * .55, p.r * .42, p.r * .62, 0, 0, 6.3); ctx.fill(); }
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, p.r * .22, 0, 6.3); ctx.fill(); ctx.restore();
    } else if (p.kind === 'rose') { // cánh hoa hồng
      const sq = .55 + .45 * Math.abs(Math.sin(p.w)); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, sq);
      ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.bezierCurveTo(p.r * .9, -p.r * .6, p.r * .8, p.r * .5, 0, p.r); ctx.bezierCurveTo(-p.r * .8, p.r * .5, -p.r * .9, -p.r * .6, 0, -p.r); ctx.fillStyle = p.c; ctx.fill(); ctx.restore();
    } else if (p.kind === 'balloon') {
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y + p.r * 1.25); ctx.quadraticCurveTo(p.x + Math.sin(p.w) * 8, p.y + p.r * 2.4, p.x, p.y + p.r * 3.4); ctx.stroke();
      ellipse(p.x, p.y, p.r * .82, p.r, 0, p.c);
      ctx.beginPath(); ctx.moveTo(p.x, p.y + p.r); ctx.lineTo(p.x - 4, p.y + p.r + 6); ctx.lineTo(p.x + 4, p.y + p.r + 6); ctx.closePath(); ctx.fillStyle = p.c; ctx.fill();
      ellipse(p.x - p.r * .3, p.y - p.r * .35, p.r * .16, p.r * .3, .5, 'rgba(255,255,255,.55)');
    } else if (p.kind === 'bubble') {
      const g = ctx.createRadialGradient(p.x - p.r * .3, p.y - p.r * .3, p.r * .1, p.x, p.y, p.r);
      g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(.6, 'hsla(' + p.hue + ',90%,85%,.22)'); g.addColorStop(1, 'hsla(' + p.hue + ',90%,75%,.55)');
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    } else if (p.kind === 'lantern') { // đèn ông sao bay lên
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.w) * .12);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, p.r * 2.4); g.addColorStop(0, 'rgba(255,214,102,.75)'); g.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = g; ctx.fillRect(-p.r * 2.4, -p.r * 2.4, p.r * 4.8, p.r * 4.8);
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? p.r * .45 : p.r, a = -1.5708 + i * .6283; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fillStyle = '#ff4d5e'; ctx.fill(); ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(0, 0, p.r * .2, 0, 6.3); ctx.fill(); ctx.restore();
    } else if (p.kind === 'firefly') {
      const tw = .45 + .55 * Math.abs(Math.sin(p.ph)), g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, 'rgba(230,255,140,' + tw + ')'); g.addColorStop(.3, 'rgba(200,255,100,' + tw * .45 + ')'); g.addColorStop(1, 'rgba(200,255,100,0)');
      ctx.fillStyle = g; ctx.fillRect(p.x - p.r * 5, p.y - p.r * 5, p.r * 10, p.r * 10);
    } else if (p.kind === 'kite') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(Math.sin(p.w) * .25);
      const r = p.r;
      ctx.beginPath(); ctx.moveTo(0, r); ctx.quadraticCurveTo(-r * .8, r * 1.65, r * .1, r * 2.3);
      ctx.quadraticCurveTo(r * .75, r * 2.8, -r * .2, r * 3.3);
      ctx.strokeStyle = '#fff1c4'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(r * .78,0); ctx.lineTo(0,r); ctx.lineTo(-r * .78,0);
      ctx.closePath(); ctx.fillStyle = p.c; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(r * .78,0); ctx.lineTo(0,r);
      ctx.closePath(); ctx.fillStyle = '#e56e60'; ctx.fill();
      ctx.restore();
    } else if (p.kind === 'butterfly') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(Math.sin(p.w) * .26);
      const wing = Math.max(.18, Math.abs(Math.sin(p.w * 12)));
      for (const side of [-1,1]) {
        ellipse(side * p.r * .7 * wing,-p.r * .24,p.r * .65 * wing,p.r * .72,side * .3,p.c);
        ellipse(side * p.r * .48 * wing,p.r * .48,p.r * .46 * wing,p.r * .4,side * -.25,p.c);
      }
      ellipse(0,p.r * .13,1.25,p.r * .72,0,'#56432c'); ctx.restore();
    } else if (p.kind === 'ember') {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6); g.addColorStop(0, 'rgba(255,240,170,' + p.a + ')'); g.addColorStop(.4, 'rgba(255,150,40,' + p.a * .7 + ')'); g.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = g; ctx.fillRect(p.x - p.r * 2.6, p.y - p.r * 2.6, p.r * 5.2, p.r * 5.2);
    }
  }
  function step(p, k) {
    p.w += p.ws * k; p.rot += p.vr * k;
    if (p.kind === 'petal' || p.kind === 'rose') { p.y += p.vy * k; p.x += Math.sin(p.w) * .7 * k; if (p.y > H + 20) Object.assign(p, mk(p.kind)); }
    else if (p.kind === 'balloon' || p.kind === 'bubble' || p.kind === 'lantern') { p.y += p.vy * k; p.x += Math.sin(p.w) * .5 * k; if (p.y < -60) Object.assign(p, mk(p.kind)); }
    else if (p.kind === 'firefly') { p.ph += .05 * k; p.x += (p.vx + Math.sin(p.w * 2) * .4) * k; p.y += Math.cos(p.w * 1.7) * .35 * k; if (p.x < -10) p.x = W + 8; if (p.x > W + 10) p.x = -8; }
    else if (p.kind === 'kite' || p.kind === 'butterfly') {
      p.x += (p.vx + Math.sin(p.w) * .48) * k; p.y += Math.cos(p.w) * .46 * k;
      if (p.x < -35 || p.x > W + 35) Object.assign(p,mk(p.kind,true));
      p.y = Math.max(20,Math.min(H - 35,p.y));
    }
    else if (p.kind === 'ember') { p.y += p.vy * k; p.x += p.vx * k + Math.sin(p.w) * .3 * k; p.a -= .011 * k; p.r *= .997; }
  }
  function burst() { // pháo hoa Tết
    const x = R(W * .08, W * .85), y = R(H * .06, H * .32), hue = Math.floor(R(0, 360)), n = 36;
    bursts.push({ life: 1, ps: Array.from({ length: n }, (_, i) => { const a = i / n * 6.283, sp = R(1.4, 3.1); return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, hue: hue + R(-18, 18) }; }) });
    if (bursts.length > 4) bursts.shift();
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (document.hidden || t - last < 28) return;
    const k = last ? Math.min(3, (t - last) / 16.7) : 1; last = t;
    for (const p of parts) step(p, k);
    // tia lửa bay lên từ ngọn lửa bếp (Tết)
    if (curId === 'tet' && fireAt && Math.random() < .22 * k && parts.length < 90) parts.push({ kind: 'ember', x: fireAt.x + R(-26, 26), y: fireAt.y, vx: R(-.4, .4), vy: -R(.7, 1.6), r: R(2.5, 4.5), w: R(0, 6.3), ws: .05, rot: 0, vr: 0, a: 1 });
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].kind === 'ember' && parts[i].a <= 0) parts.splice(i, 1);
    if (curId === 'tet' && t > nextBurst) { burst(); nextBurst = t + R(3500, 7000); }
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= .014 * k; for (const q of b.ps) { q.x += q.vx * k; q.y += q.vy * k; q.vy += .03 * k; q.vx *= .985; } if (b.life <= 0) bursts.splice(i, 1); }
    draw();
  }
  function draw() {
    if (!ctx) return; ctx.clearRect(0, 0, W, H);
    for (const p of parts) drawPart(p);
    for (const b of bursts) for (const q of b.ps) { ctx.globalAlpha = Math.max(0, b.life); ctx.fillStyle = 'hsl(' + q.hue + ',100%,68%)'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.1, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function startFx(kind, id) {
    stopFx(); curId = id; if (!kind) return;
    cv = document.createElement('canvas'); cv.className = 'noel-snow cd-fx'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv); sizeCanvas();
    const ambient = Boolean(accents[id]);
    if (ambient) cv.classList.add('cd-ambient-fx');
    const count = { petal: 26, rose: 22, balloon: 6, bubble: 16, firefly: 22 }[kind] || 20;
    parts = Array.from({ length: Math.round(count * Math.min(1, Math.max(.55, W * H / 700000))) }, () => mk(kind, true));
    if (id === 'trungthu') for (let i = 0; i < 4; i++) parts.push(mk('lantern', true));
    if (id === 'thieunhi') for (let i = 0; i < 2; i++) parts.push(mk('kite',true));
    if (id === 'none') for (let i = 0; i < 4; i++) parts.push(mk('butterfly',true));
    nextBurst = 2500; last = 0;
    if (calm()) draw(); else raf = requestAnimationFrame(tick);
  }
  function stopFx() { cancelAnimationFrame(raf); raf = 0; parts = []; bursts = []; if (cv) { cv.remove(); cv = null; ctx = null; } }
  addEventListener('resize', () => { if (cv) { sizeCanvas(); parts.forEach(p => { if (p.x > W) p.x = R(0, W); }); if (!raf) draw(); } if (curId && SEASONS[curId] && SEASONS[curId].art) layoutArt(curId); });

  /* ---------- Dựng / gỡ cảnh ---------- */
  function glowHTML(id) { return (GLOWS[id] || []).map(g => '<i class="cd-glow g-' + g[0] + '" data-g="' + g.slice(1).join(',') + '" style="animation-delay:' + (Math.random() * -4).toFixed(2) + 's"></i>').join(''); }
  function buildScene(id) {
    removeScene();
    const S0 = SEASONS[id]; if (!S0 || id === 'noel') return;
    const sky = document.createElement('div'); sky.className = 'cd-sky cd-' + id; sky.setAttribute('aria-hidden', 'true');
    sky.style.setProperty('--art', 'url(' + S0.art + ')');
    sky.innerHTML = '<div class="cd-art"></div>' + glowHTML(id) + (accents[id]?.() || '');
    document.body.insertBefore(sky, document.body.firstChild);
    layoutArt(id);
  }
  function removeScene() { document.querySelector('.cd-sky')?.remove(); fireAt = null; }

  function apply() {
    const id = seasonId(), root = document.documentElement;
    root.classList.add('noel'); // Dùng chung lớp đặt màu và xếp chồng của các cảnh.
    root.classList.toggle('cd-painted', Boolean(accents[id]));
    root.dataset.season = id;
    const logo = document.getElementById('brandLogo');
    if (logo) { const ic = SEASONS[id].icon; if (logo.dataset.ic !== ic) { logo.dataset.ic = ic; logo.textContent = ic; } }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      if (!meta.dataset.base) meta.dataset.base = meta.content;
      const scene = SEASONS[id];
      meta.content = root.dataset.theme === 'night' && scene.nightMeta ? scene.nightMeta : scene.meta;
    }
    if (curId !== id || (id !== 'noel' && !document.querySelector('.cd-sky'))) {
      if (id !== 'noel') { buildScene(id); startFx(SEASONS[id].fx, id); } else { removeScene(); stopFx(); curId = id; }
    }
  }
  if (typeof AFTER_RENDER !== 'undefined') AFTER_RENDER.push(apply);
  function syncMotion() {
    if (!cv) return; const c = calm();
    if (c) { cancelAnimationFrame(raf); raf = 0; draw(); } else if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }
  new MutationObserver(syncMotion).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncMotion);
  window.applySeason = apply;
  function refreshTheme() {
    apply();
    window.applyNoel?.(currentView);
  }
  function acceptPublished(season) {
    if (!validSeason(season) || season === published) return;
    published = season;
    refreshTheme();
  }
  let checking = false, endpointMissing = false;
  async function syncTheme() {
    if (checking || endpointMissing || !navigator.onLine || document.hidden || !location.protocol.startsWith('http')) return;
    checking = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch('/api/site-theme', { cache: 'no-store', signal: controller.signal });
      if (response.status === 404) endpointMissing = true;
      if (!response.ok) return;
      const { season } = await response.json();
      if (validSeason(season)) {
        cacheSeason(cacheKey, season);
        acceptPublished(season);
      }
    } catch {
      // Khi mất mạng, giữ lựa chọn gần nhất.
    } finally {
      clearTimeout(timeout);
      checking = false;
    }
  }
  addEventListener('storage', event => { if (event.key === cacheKey) acceptPublished(event.newValue); });
  addEventListener('online', syncTheme);
  addEventListener('focus', syncTheme);
  document.addEventListener('visibilitychange', syncTheme);
  setInterval(syncTheme, 10000);
  refreshTheme();
  syncTheme();
})();
