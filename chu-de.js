/* Cảnh nền theo mùa / ngày lễ – Claude Code (đợt 15). Nạp SAU noel.js.
   Học sinh chạm một biểu tượng (🎄 🧧 🌕 🏫 💐 🎈) là cả web đổi sang cảnh nền ĐỘNG của ngày lễ đó:
   • Giáng sinh – tuyết rơi, cây thông (noel.js)
   • Tết – tranh cả nhà quây quần bên nồi bánh chưng, ngọn lửa bập bùng, đèn lồng phát sáng, hoa đào – hoa mai rơi, pháo hoa
   • Trung thu – trăng rằm, đèn ông sao phát sáng, đom đóm, đèn lồng bay lên
   • Khai giảng – nắng, mây trôi, máy bay giấy, bóng bay, ngôi trường cờ đỏ bay
   • 20/11 – cánh hoa rơi, bó hoa lay, ánh nắng tri ân thầy cô
   • Thiếu nhi / Hè – bong bóng xà phòng, sóng biển, quả bóng nảy
   Tự động theo ngày (Cài đặt → Cảnh nền); “Giảm chuyển động” → mọi thứ đứng yên.
   Cách nối với phần Noel cũ: mọi mùa đều dùng bộ áo “html.noel” (một bầu trời liền mạch cho mọi trang) nhưng đổi bảng màu
   bằng html[data-season=…]; riêng tuyết, cây thông, dây đèn, mũ Noel, Lịch Noel chỉ chạy khi mùa là Noel (noelOn()). */
'use strict';
(function () {
  const SEASONS = {
    noel:      { icon: '🎄', name: 'Giáng sinh', meta: '#b31c35', hint: 'Tuyết rơi, cây thông' },
    tet:       { icon: '🧧', name: 'Tết',        meta: '#8f1620', hint: 'Cả nhà quây quần bên lửa', art: 'assets/le-hoi-0.webp', fx: 'petal', ax: .55 },
    trungthu:  { icon: '🌕', name: 'Trung thu',  meta: '#3a1d6b', hint: 'Trăng rằm, đèn ông sao', art: 'assets/le-hoi-1.webp', fx: 'firefly', ax: .5 },
    khaigiang: { icon: '🏫', name: 'Khai giảng', meta: '#2679d0', hint: 'Cờ đỏ, bóng bay, mây trôi', fx: 'balloon' },
    nhagiao:   { icon: '💐', name: '20/11',      meta: '#b83b78', hint: 'Hoa tri ân thầy cô', fx: 'rose' },
    thieunhi:  { icon: '🎈', name: 'Thiếu nhi',  meta: '#0e93ad', hint: 'Biển xanh, bong bóng', fx: 'bubble' }
  };
  const ORDER = ['noel', 'tet', 'trungthu', 'khaigiang', 'nhagiao', 'thieunhi'];
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
  function seasonId() {
    const s = db.settings.season;
    if (s && s !== 'auto') return SEASONS[s] ? s : 'none';
    if (db.settings.noel === 'off') return 'none';
    if (db.settings.noel === 'on') return 'noel';
    return autoSeason();
  }
  window.seasonId = seasonId;
  window.SEASONS = SEASONS;
  window.noelOn = () => seasonId() === 'noel';        // phần “Noel” cũ (tuyết, lịch, người tuyết…) chỉ chạy đúng mùa Noel
  window.seasonMeta = () => (SEASONS[seasonId()] || {}).meta || '';
  window.seasonIcon = () => (SEASONS[seasonId()] || {}).icon || '🌱';

  /* ---------- Hình dựng sẵn (SVG) ---------- */
  const cloud = (cls, top, dur, delay, sc) => '<svg class="cd-cloud ' + cls + '" style="top:' + top + 'vh;animation-duration:' + dur + 's;animation-delay:' + delay + 's;--sc:' + sc + '" viewBox="0 0 120 60" aria-hidden="true"><path d="M20 50a16 16 0 0 1 2-32 22 22 0 0 1 42-6 18 18 0 0 1 30 10 14 14 0 0 1 6 28z" fill="#fff" opacity=".95"/></svg>';
  const sunSVG = '<svg class="cd-sun" viewBox="-100 -100 200 200" aria-hidden="true"><g class="cd-rays">' + Array.from({ length: 12 }, (_, i) => '<path transform="rotate(' + i * 30 + ')" d="M-7 -60 L0 -92 L7 -60Z" fill="#ffe07a"/>').join('') + '</g><circle r="46" fill="#ffd54a"/><circle r="46" fill="url(#cdsun)"/><circle cx="-16" cy="-6" r="4.5" fill="#7a4b12"/><circle cx="16" cy="-6" r="4.5" fill="#7a4b12"/><path d="M-14 12 Q0 26 14 12" fill="none" stroke="#7a4b12" stroke-width="4" stroke-linecap="round"/><circle cx="-28" cy="8" r="7" fill="#ff9a7a" opacity=".55"/><circle cx="28" cy="8" r="7" fill="#ff9a7a" opacity=".55"/><defs><radialGradient id="cdsun"><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#ffb300" stop-opacity=".45"/></radialGradient></defs></svg>';
  const plane = '<svg class="cd-plane" viewBox="0 0 60 40" aria-hidden="true"><path d="M2 20 L58 2 L40 38 L30 24Z" fill="#fff" stroke="#b9d7f5" stroke-width="2" stroke-linejoin="round"/><path d="M30 24 L58 2" stroke="#9cc3ea" stroke-width="2"/></svg>';
  const gull = (x, y, d) => '<svg class="cd-gull" style="left:' + x + '%;top:' + y + 'vh;animation-delay:' + d + 's" viewBox="0 0 40 20" aria-hidden="true"><path d="M2 14 Q10 0 20 12 Q30 0 38 14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  const kid = (x, y, skin, hair, shirt, bag, dly) => '<g transform="translate(' + x + ' ' + y + ')"><g class="cd-kid" style="animation-delay:' + dly + 's"><rect x="-13" y="-6" width="26" height="30" rx="9" fill="' + bag + '"/><rect x="-9" y="-2" width="18" height="26" rx="7" fill="' + shirt + '"/><circle cy="-16" r="11" fill="' + skin + '"/><path d="M-11 -17 Q-10 -29 0 -28 Q11 -29 11 -17 Q4 -23 -11 -17Z" fill="' + hair + '"/><circle cx="-4" cy="-15" r="1.7" fill="#3a2418"/><circle cx="4" cy="-15" r="1.7" fill="#3a2418"/><path d="M-3 -10 Q0 -7 3 -10" fill="none" stroke="#3a2418" stroke-width="1.5" stroke-linecap="round"/><rect x="-8" y="22" width="6" height="14" rx="3" fill="#35508a"/><rect x="2" y="22" width="6" height="14" rx="3" fill="#35508a"/></g></g>';
  const flower = (x, y, r, c, d) => '<g transform="translate(' + x + ' ' + y + ')"><g class="cd-flower" style="animation-delay:' + d + 's">' + [0, 72, 144, 216, 288].map(a => '<ellipse rx="' + r * .5 + '" ry="' + r * .72 + '" cy="' + -r * .55 + '" transform="rotate(' + a + ')" fill="' + c + '"/>').join('') + '<circle r="' + r * .34 + '" fill="#ffd54a"/></g></g>';
  const bouquet = (x, flip, sc) => '<g transform="translate(' + x + ' ' + 220 * (1 - (sc || 1)) + ') scale(' + (flip ? -1 : 1) * (sc || 1) + ' ' + (sc || 1) + ')"><path d="M-6 220 Q0 150 -34 100 M0 220 Q2 140 4 78 M6 220 Q12 150 44 104" stroke="#2f9e5b" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-26 210 L26 210 L16 160 L-16 160Z" fill="#ffd9e6"/><path d="M-12 164 Q0 150 12 164" fill="#ffbfd5"/>' +
    flower(-34, 96, 26, '#ff7aa8', 0) + flower(4, 70, 30, '#ffb3c8', .6) + flower(44, 100, 25, '#ffd54a', 1.2) + flower(-8, 120, 20, '#ffffff', 1.8) + flower(24, 128, 19, '#ff7aa8', .3) + '</g>';

  const SCENES = {
    khaigiang: '<svg viewBox="0 0 1200 230" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 150 Q200 110 420 140 T820 130 T1200 120 V230 H0Z" fill="#7fd36e"/><path d="M0 185 Q300 150 620 178 T1200 168 V230 H0Z" fill="#5cc25a"/>' +
      '<g transform="translate(470 40)"><rect x="0" y="62" width="260" height="110" rx="6" fill="#ffe9ad"/><rect x="-14" y="46" width="288" height="26" rx="8" fill="#d6453b"/><path d="M60 46 L130 4 L200 46Z" fill="#c1372e"/><rect x="108" y="108" width="44" height="64" rx="6" fill="#8a5a2b"/><rect x="26" y="88" width="40" height="34" rx="5" fill="#8fd3ff"/><rect x="194" y="88" width="40" height="34" rx="5" fill="#8fd3ff"/><circle cx="130" cy="30" r="9" fill="#fff"/></g>' +
      '<g transform="translate(396 30)"><rect x="-2" y="0" width="5" height="170" rx="2" fill="#9a6a3a"/><g class="cd-flag"><path d="M3 4 H64 V40 H3Z" fill="#e0242c"/><path d="M33 12 l3.4 10.4 h11 l-9 6.6 3.4 10.4 -8.8 -6.4 -8.8 6.4 3.4 -10.4 -9 -6.6 h11z" fill="#ffd400" transform="translate(-1 -3) scale(.9)"/></g></g>' +
      '<g transform="translate(110 150)"><rect x="-6" y="30" width="12" height="46" fill="#8a5a2b"/><circle cx="0" cy="12" r="44" fill="#3fae5a"/><circle cx="-26" cy="30" r="26" fill="#4cc069"/><circle cx="28" cy="28" r="28" fill="#47b862"/></g>' +
      '<g transform="translate(1090 150)"><rect x="-6" y="30" width="12" height="46" fill="#8a5a2b"/><circle cx="0" cy="12" r="44" fill="#3fae5a"/><circle cx="-26" cy="30" r="26" fill="#4cc069"/><circle cx="28" cy="28" r="28" fill="#47b862"/></g>' +
      kid(820, 170, '#ffd9b3', '#3a2418', '#ff7a8a', '#3b82f6', 0) + kid(862, 172, '#f6c79b', '#2a1a12', '#ffd166', '#ef4444', .35) + kid(300, 172, '#ffe0c2', '#5a3a22', '#7bd88f', '#a855f7', .6) + '</svg>',
    nhagiao: '<svg viewBox="0 0 1200 230" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 150 Q300 120 600 148 T1200 136 V230 H0Z" fill="#ffd9c7"/><path d="M0 188 Q300 160 640 184 T1200 176 V230 H0Z" fill="#ffc2b2"/>' +
      bouquet(120, false) + bouquet(1080, true) + bouquet(300, true, .7) + bouquet(900, false, .7) +
      '<g transform="translate(540 100)"><rect x="-10" y="56" width="140" height="22" rx="5" fill="#e05a6d"/><rect x="0" y="36" width="124" height="22" rx="5" fill="#5aa7e8"/><rect x="8" y="16" width="108" height="22" rx="5" fill="#ffd166"/><rect x="14" y="20" width="96" height="3" fill="#fff" opacity=".6"/><circle cx="62" cy="2" r="16" fill="#e8484f"/><path d="M62 -14 q-2 -10 8 -12" stroke="#4a8f3a" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="72" cy="-18" rx="9" ry="5" fill="#5cb85c" transform="rotate(-25 72 -18)"/></g></svg>',
    thieunhi: '<svg viewBox="0 0 1200 230" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="cd-wave w1"><path d="M-200 118 q50 -22 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 V230 H-200Z" fill="#37c4dc"/></g><g class="cd-wave w2"><path d="M-200 136 q50 22 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 V230 H-200Z" fill="#1fa8c9"/></g>' +
      '<path d="M0 180 Q300 150 620 176 T1200 166 V230 H0Z" fill="#ffe3a1"/><path d="M0 205 Q300 188 700 202 T1200 196 V230 H0Z" fill="#ffd27a"/>' +
      '<g transform="translate(130 80)"><path d="M0 130 Q10 60 -6 6" stroke="#8a5a2b" stroke-width="12" fill="none" stroke-linecap="round"/><g fill="#2fae5d"><path d="M-6 6 Q-50 -6 -76 30 Q-40 8 -6 6Z"/><path d="M-6 6 Q-40 -30 -62 -2 Q-30 -12 -6 6Z"/><path d="M-6 6 Q30 -34 62 -8 Q26 -12 -6 6Z"/><path d="M-6 6 Q40 -2 70 30 Q34 6 -6 6Z"/><path d="M-6 6 Q-8 -36 8 -50 Q6 -20 -6 6Z"/></g></g>' +
      '<g transform="translate(1040 120)"><rect x="-3" y="-4" width="6" height="90" fill="#a37a52"/><path d="M-70 -2 Q0 -62 70 -2Z" fill="#ff5d73"/><path d="M-35 -2 Q-12 -40 0 -2 Q12 -40 35 -2Z" fill="#fff" opacity=".85"/></g>' +
      '<g transform="translate(700 150)"><rect x="-44" y="22" width="88" height="40" rx="4" fill="#f2c26b"/><rect x="-60" y="2" width="30" height="60" rx="3" fill="#f2c26b"/><rect x="30" y="2" width="30" height="60" rx="3" fill="#f2c26b"/><path d="M-62 2 l15 -18 l15 18Z M28 2 l15 -18 l15 18Z" fill="#f2c26b"/><rect x="-8" y="38" width="16" height="24" rx="8" fill="#b88a45"/><rect x="42" y="-30" width="3" height="46" fill="#8a5a2b"/><path d="M45 -30 h26 l-8 8 8 8 h-26z" fill="#ff5d73"/></g>' +
      '<g transform="translate(900 168)"><g class="cd-ball"><circle r="20" fill="#fff"/><path d="M0 -20 A20 20 0 0 1 17 -10 L0 0Z" fill="#ff5d73"/><path d="M17 -10 A20 20 0 0 1 14 14 L0 0Z" fill="#ffd54a"/><path d="M14 14 A20 20 0 0 1 -14 14 L0 0Z" fill="#37a6e8"/><path d="M-14 14 A20 20 0 0 1 -20 0 L0 0Z" fill="#46c77a"/></g></g></svg>'
  };
  const SKIES = {
    khaigiang: () => sunSVG + cloud('c1', 9, 110, -20, 1.2) + cloud('c2', 22, 150, -90, .8) + cloud('c3', 35, 130, -50, 1) + plane,
    nhagiao: () => '<div class="cd-beams"></div><div class="cd-sparkles">' + Array.from({ length: 14 }, (_, i) => '<i style="left:' + (7 + (i * 53) % 88) + '%;top:' + (6 + (i * 37) % 60) + '%;animation-delay:' + (i % 7) * .4 + 's"></i>').join('') + '</div>',
    thieunhi: () => sunSVG + cloud('c1', 10, 120, -30, 1.1) + cloud('c2', 26, 160, -100, .8) + gull(18, 20, 0) + gull(32, 14, 1.2) + gull(60, 28, .6)
  };

  /* ---------- Điểm sáng đặt đúng chỗ trên tranh (toạ độ theo tỉ lệ ảnh gốc 1120×747, ảnh phủ kín màn hình) ---------- */
  const GLOWS = {
    tet: [['fire', .5, .8, .13], ['lamp', .945, .13, .07], ['lamp', .635, .29, .06], ['lamp', .9, .275, .045], ['lamp', .5, .15, .0], ['sun', .395, .325, .05]],
    trungthu: [['moon', .63, .145, .17], ['lamp', .605, .36, .1], ['lamp', .24, .45, .07], ['lamp', .425, .66, .07], ['lamp', .235, .16, .07], ['lamp', .14, .33, .05], ['lamp', .1, .42, .04], ['water', .78, .66, .2]]
  };
  function artGeom(id) {
    const W = innerWidth, H = innerHeight, s = Math.max(W / IMG.w, H / IMG.h), ax = SEASONS[id].ax == null ? .5 : SEASONS[id].ax;
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
    fireAt = { x: g.px(.5), y: g.py(.77) };
  }

  /* ---------- Tầng hiệu ứng (canvas): cánh hoa, bóng bay, bong bóng, đom đóm, đèn trời, pháo hoa, tia lửa ---------- */
  let cv = null, ctx = null, W = 0, H = 0, raf = 0, last = 0, parts = [], bursts = [], nextBurst = 0, fx = '', curId = '', fireAt = null;
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
    stopFx(); fx = kind; curId = id; if (!kind) return;
    cv = document.createElement('canvas'); cv.className = 'noel-snow cd-fx'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv); sizeCanvas();
    const N = { petal: 26, rose: 30, balloon: 9, bubble: 20, firefly: 22 }[kind] || 20;
    parts = Array.from({ length: Math.round(N * Math.min(1, Math.max(.55, W * H / 700000))) }, () => mk(kind, true));
    if (id === 'trungthu') for (let i = 0; i < 4; i++) parts.push(mk('lantern', true));
    nextBurst = 2500; last = 0;
    if (calm()) draw(); else raf = requestAnimationFrame(tick);
  }
  function stopFx() { cancelAnimationFrame(raf); raf = 0; parts = []; bursts = []; if (cv) { cv.remove(); cv = null; ctx = null; } fx = ''; }
  addEventListener('resize', () => { if (cv) { sizeCanvas(); parts.forEach(p => { if (p.x > W) p.x = R(0, W); }); if (!raf) draw(); } if (curId && SEASONS[curId] && SEASONS[curId].art) layoutArt(curId); });

  /* ---------- Dựng / gỡ cảnh ---------- */
  function glowHTML(id) { return (GLOWS[id] || []).map(g => '<i class="cd-glow g-' + g[0] + '" data-g="' + g.slice(1).join(',') + '" style="animation-delay:' + (Math.random() * -4).toFixed(2) + 's"></i>').join(''); }
  function buildScene(id) {
    removeScene();
    const S0 = SEASONS[id]; if (!S0 || id === 'noel') return;
    const sky = document.createElement('div'); sky.className = 'cd-sky cd-' + id; sky.setAttribute('aria-hidden', 'true');
    if (S0.art) { sky.style.setProperty('--art', 'url(' + S0.art + ')'); sky.innerHTML = '<div class="cd-art"></div>' + glowHTML(id); }
    else sky.innerHTML = (SKIES[id] ? SKIES[id]() : '');
    document.body.insertBefore(sky, document.body.firstChild);
    if (SCENES[id]) { const sc = document.createElement('div'); sc.className = 'cd-scene cd-' + id; sc.setAttribute('aria-hidden', 'true'); sc.innerHTML = SCENES[id]; document.body.insertBefore(sc, document.body.firstChild); }
    layoutArt(id);
  }
  function removeScene() { document.querySelectorAll('.cd-sky,.cd-scene').forEach(e => e.remove()); fireAt = null; }

  /* ---------- Thẻ đổi cảnh nền (Trang học + Cài đặt) ---------- */
  function chips(cur, withAuto) {
    const auto = db.settings.season == null || db.settings.season === 'auto';
    const items = ORDER.map(id => [id, SEASONS[id].icon, SEASONS[id].name]).concat([['none', '🌱', 'Vườn xanh']]);
    if (withAuto) items.unshift(['auto', '🗓️', 'Tự động']);
    return items.map(([id, ic, nm]) => '<button class="cd-chip' + ((id === 'auto' ? auto : (!auto && id === cur)) ? ' on' : '') + '" data-season-pick="' + id + '" aria-pressed="' + (id === 'auto' ? auto : (!auto && id === cur)) + '"><span class="cd-ic">' + ic + '</span><b>' + nm + '</b></button>').join('');
  }
  function pickCard() {
    const cur = seasonId(), nm = (SEASONS[cur] || { name: 'Vườn xanh' }).name;
    return '<section class="cd-pick" aria-label="Đổi cảnh nền"><div class="cd-pick-head"><h2>🎨 Đổi cảnh nền</h2><p>Chạm một biểu tượng để đổi nền: đang là <b>' + nm + '</b></p></div><div class="cd-chips">' + chips(cur, true) + '</div></section>';
  }
  function pickSeason(id) {
    db.settings.season = id; if (id !== 'auto') db.settings.noel = 'auto'; save();
    if (typeof sfx === 'function') sfx('tap'); render();
    const nm = id === 'auto' ? 'Tự động theo ngày' : (SEASONS[id] ? SEASONS[id].name : 'Vườn xanh'); if (typeof toast === 'function') toast((id === 'auto' ? '🗓️ ' : (SEASONS[id] ? SEASONS[id].icon : '🌱') + ' ') + 'Cảnh nền: ' + nm);
  }
  function bindPick(root) { root.querySelectorAll('[data-season-pick]').forEach(b => b.onclick = () => pickSeason(b.dataset.seasonPick)); }

  function apply(view) {
    const id = seasonId(), skin = id !== 'none', root = document.documentElement;
    root.classList.toggle('noel', skin);
    if (skin) root.dataset.season = id; else delete root.dataset.season;
    const logo = document.getElementById('brandLogo');
    if (logo) { const ic = skin ? SEASONS[id].icon : '🌱'; if (logo.dataset.ic !== ic) { logo.dataset.ic = ic; logo.textContent = ic; } }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { if (!meta.dataset.base) meta.dataset.base = meta.content; meta.content = skin ? (SEASONS[id].meta) : meta.dataset.base; }
    if (curId !== id || (!document.querySelector('.cd-sky') && !document.querySelector('.cd-scene') && SEASONS[id] && id !== 'noel' && !SEASONS[id].fxOnly)) {
      if (id !== 'noel' && skin) { buildScene(id); startFx(SEASONS[id].fx, id); } else { removeScene(); stopFx(); curId = id; }
    }
    const v = view || currentView;
    if (v === 'home' && !document.querySelector('.cd-pick')) {
      const anchor = document.querySelector('.voyage-actions');
      if (anchor) { anchor.insertAdjacentHTML('afterend', pickCard()); bindPick(document.querySelector('.cd-pick')); }
    }
    if (v === 'settings') { // thay hàng “Trang trí Giáng sinh” bằng bộ chọn cảnh nền
      const old = document.querySelector('.settings-grid [data-set="noel"]'), row = old && old.closest('.set-row');
      if (row && !row.dataset.cd) {
        row.dataset.cd = '1'; row.classList.add('cd-set-row');
        row.innerHTML = '<span><b>🎨 Cảnh nền ngày lễ</b><small>Chạm để đổi nền động: Noel, Tết, Trung thu, Khai giảng, 20/11, Thiếu nhi. “Tự động” đổi theo ngày thật.</small></span><div class="cd-chips">' + chips(seasonId(), true) + '</div>';
        bindPick(row);
      }
    }
  }
  if (typeof AFTER_RENDER !== 'undefined') AFTER_RENDER.push(apply);
  new MutationObserver(() => {
    if (!cv) return; const c = calm();
    if (c) { cancelAnimationFrame(raf); raf = 0; draw(); } else if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.applySeason = apply;
  apply(currentView);
  if (typeof applyNoel === 'function') applyNoel(currentView);
})();
