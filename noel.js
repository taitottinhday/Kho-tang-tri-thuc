/* Mùa Giáng sinh – Claude Code (đợt 11). Nạp SAU onboarding.js.
   Học theo Santa's Village của Google (mỗi ngày mở một điều bất ngờ tới 24/12) và các trang học tập
   cho thiếu nhi mùa lễ: tuyết rơi nhẹ, rặng thông phủ tuyết, dây đèn nhấp nháy, mũ Noel cho bạn đồng hành,
   đồ trang trí Noel trong Vườn của em và “Lịch Noel” 24 ô.
   Cảnh Giáng sinh được giáo viên công bố. Chế độ “Giảm chuyển động”
   hoặc máy đặt prefers-reduced-motion → tuyết đứng yên, đèn không nhấp nháy. */
'use strict';
(function () {
  /* ---------- Đồ trang trí Noel cho Vườn của em (rewards.js) ---------- */
  const NOEL_DECOR = [
    { id: 'xmastree', icon: '🎄', name: 'Cây thông Noel', price: 6, noel: true },
    { id: 'snowman', icon: '☃️', name: 'Người tuyết', price: 5, noel: true },
    { id: 'santa', icon: '🎅', name: 'Ông già Noel', price: 10, noel: true },
    { id: 'reindeer', icon: '🦌', name: 'Tuần lộc', price: 8, noel: true },
    { id: 'bell', icon: '🔔', name: 'Chuông vàng', price: 3, noel: true },
    { id: 'cookie', icon: '🍪', name: 'Bánh quy gừng', price: 2, noel: true },
    { id: 'scarf', icon: '🧣', name: 'Khăn len', price: 3, noel: true },
    { id: 'present', icon: '🎁', name: 'Hộp quà', price: 4, noel: true },
    { id: 'candle', icon: '🕯️', name: 'Nến lung linh', price: 3, noel: true },
    { id: 'sled', icon: '🛷', name: 'Xe trượt tuyết', price: 9, noel: true }
  ];
  if (typeof DECOR !== 'undefined') NOEL_DECOR.forEach(x => { if (!DECOR.some(d => d.id === x.id)) DECOR.push(x); });

  const today = () => window.NOEL_TODAY ? new Date(window.NOEL_TODAY) : new Date();
  const calm = () => document.body.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Tuyết rơi (canvas, đợt 12): 3 lớp xa – vừa – gần, bông tuyết tinh thể xoay, gió lượn,
     chạm màn hình thì tung bông tuyết lấp lánh. Vẽ bằng ảnh dựng sẵn (không dùng shadowBlur) nên nhẹ;
     ~40 hình/giây, dừng khi ẩn tab; Giảm chuyển động → tuyết đứng yên. ---------- */
  let cv = null, ctx = null, flakes = [], puffs = [], raf = 0, last = 0, W = 0, H = 0, wind = 0, gust = 0, gustT = 0;
  const SPRITES = {};
  function sprite(kind) { // vẽ sẵn một lần: chấm tuyết mềm hoặc bông tuyết 6 cánh
    if (SPRITES[kind]) return SPRITES[kind];
    const c = document.createElement('canvas'), S0 = kind === 'dot' ? 32 : 64; c.width = c.height = S0;
    const g = c.getContext('2d'), m = S0 / 2;
    if (kind === 'dot') {
      const rg = g.createRadialGradient(m, m, 0, m, m, m);
      rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.45, 'rgba(255,255,255,.95)'); rg.addColorStop(0.7, 'rgba(255,255,255,.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = rg; g.fillRect(0, 0, S0, S0);
    } else {
      g.translate(m, m); g.strokeStyle = '#fff'; g.lineCap = 'round';
      g.shadowColor = 'rgba(140,190,255,.8)'; g.shadowBlur = 4;
      for (let i = 0; i < 6; i++) {
        g.rotate(Math.PI / 3); g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -m + 6); g.stroke();
        g.lineWidth = 3; g.beginPath(); g.moveTo(0, -m * 0.48); g.lineTo(-9, -m * 0.66); g.moveTo(0, -m * 0.48); g.lineTo(9, -m * 0.66); g.stroke();
      }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 5, 0, 6.3); g.fill();
    }
    return (SPRITES[kind] = c);
  }
  function sizeCanvas() {
    if (!cv) return;
    const d = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  // lớp 0 = xa (nhỏ, mờ, chậm) · 1 = vừa · 2 = gần (bông tuyết 6 cánh, xoay)
  function flake(anyY, layer) {
    const L = layer == null ? (Math.random() < 0.5 ? 0 : Math.random() < 0.75 ? 1 : 2) : layer;
    const r = L === 0 ? 1.2 + Math.random() * 1.4 : L === 1 ? 2.4 + Math.random() * 2 : 6 + Math.random() * 5;
    return { L, x: Math.random() * W, y: anyY ? Math.random() * H : -14, r, s: (L === 0 ? 0.28 : L === 1 ? 0.55 : 0.8) + Math.random() * 0.45,
      w: Math.random() * 6.3, ws: 0.012 + Math.random() * 0.02, a: L === 0 ? 0.45 + Math.random() * 0.25 : L === 1 ? 0.75 + Math.random() * 0.25 : 0.85 + Math.random() * 0.15,
      rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.03 };
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dot = sprite('dot'), star = sprite('star');
    for (const f of flakes) {
      ctx.globalAlpha = f.a;
      if (f.L === 2) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.drawImage(star, -f.r, -f.r, f.r * 2, f.r * 2); ctx.restore(); }
      else ctx.drawImage(dot, f.x - f.r * 1.6, f.y - f.r * 1.6, f.r * 3.2, f.r * 3.2);
    }
    for (const p of puffs) {
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.star) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(star, -p.r, -p.r, p.r * 2, p.r * 2); ctx.restore(); }
      else ctx.drawImage(dot, p.x - p.r * 1.6, p.y - p.r * 1.6, p.r * 3.2, p.r * 3.2);
    }
    ctx.globalAlpha = 1;
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (document.hidden || t - last < 25) return;
    const k = last ? Math.min(3, (t - last) / 16.7) : 1; last = t;
    // gió: lượn nhẹ theo thời gian + thỉnh thoảng một cơn gió nhỏ
    if (t > gustT) { gust = (Math.random() - 0.5) * 1.6; gustT = t + 4000 + Math.random() * 6000; }
    wind += ((Math.sin(t / 5200) * 0.35 + gust) - wind) * 0.01 * k;
    for (const f of flakes) {
      const depth = f.L === 0 ? 0.5 : f.L === 1 ? 0.8 : 1.1;
      f.y += f.s * k; f.w += f.ws * k; f.rot += f.vr * k;
      f.x += (Math.sin(f.w) * 0.4 + wind * depth) * k;
      if (f.y > H + 14) Object.assign(f, flake(false, f.L));
      if (f.x < -14) f.x = W + 10; else if (f.x > W + 14) f.x = -10;
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.vy += 0.05 * k; p.vx *= 0.97; p.x += p.vx * k; p.y += p.vy * k; p.rot += 0.05 * k; p.life -= 0.016 * k;
      if (p.life <= 0) puffs.splice(i, 1);
    }
    draw();
  }
  function startSnow() {
    if (!cv) {
      cv = document.createElement('canvas'); cv.className = 'noel-snow'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv); sizeCanvas();
      const n = Math.round(Math.min(120, Math.max(46, W * H / 11000)));
      flakes = Array.from({ length: n }, () => flake(true));
    }
    cancelAnimationFrame(raf); raf = 0;
    if (calm()) draw(); else { last = 0; raf = requestAnimationFrame(tick); }
  }
  function stopSnow() { cancelAnimationFrame(raf); raf = 0; puffs = []; if (cv) { cv.remove(); cv = null; } }
  addEventListener('resize', () => { if (!cv) return; sizeCanvas(); flakes.forEach(f => { if (f.x > W) f.x = Math.random() * W; if (f.y > H) f.y = Math.random() * H; }); if (!raf) draw(); });
  // Chạm màn hình: tung vài bông tuyết lấp lánh tại chỗ chạm (không áp dụng trong ô nhập chữ)
  addEventListener('pointerdown', e => {
    if (!cv || !raf || calm() || (e.target && e.target.closest && e.target.closest('input,textarea,select,.sc-field'))) return;
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * 6.3, sp = 1.2 + Math.random() * 2.2;
      puffs.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2, r: i < 2 ? 6 + Math.random() * 3 : 2 + Math.random() * 2, star: i < 2, rot: Math.random() * 6.3, life: 1 });
    }
    if (puffs.length > 80) puffs.splice(0, puffs.length - 80);
  }, { passive: true });

  /* ---------- Ông già Noel cưỡi xe tuần lộc bay ngang trời (sau nội dung, 40–80 giây một lần) ---------- */
  let sleighTimer = 0, sleighAnim = null;
  function flySleigh() {
    if (!noelOn()) { sleighTimer = 0; return; }
    if (calm() || document.hidden || document.querySelector('.xm-sleigh')) return scheduleSleigh();
    const el = document.createElement('div'); el.className = 'xm-sleigh'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img class="rein" src="assets/emoji/1f98c.webp" alt=""><img class="rein" src="assets/emoji/1f98c.webp" alt="">' +
      '<span style="position:relative;display:inline-block"><img class="santa" src="assets/emoji/1f385.webp" alt="" style="position:absolute;left:18%;bottom:46%;width:62%"><img src="assets/emoji/1f6f7.webp" alt="" style="position:relative"></span><span class="trail"></span>';
    el.style.top = (6 + Math.random() * 14) + 'vh';
    document.body.appendChild(el);
    const w = el.offsetWidth || 200;
    const anim = sleighAnim = el.animate([
      { transform: 'translate(' + (innerWidth + 20) + 'px, 0)' },
      { transform: 'translate(' + (innerWidth * 0.5 - w / 2) + 'px, -3vh)' },
      { transform: 'translate(' + (-w - 160) + 'px, 2vh)' }
    ], { duration: 12000, easing: 'linear' });
    anim.onfinish = () => { el.remove(); sleighAnim = null; scheduleSleigh(); };
  }
  function scheduleSleigh(first) { clearTimeout(sleighTimer); sleighTimer = setTimeout(flySleigh, first ? 9000 : 40000 + Math.random() * 40000); }
  function stopSleigh() {
    clearTimeout(sleighTimer); sleighTimer = 0;
    if (sleighAnim) { sleighAnim.cancel(); sleighAnim = null; } // cancel() không gọi onfinish → không tự hẹn giờ lại
    const s = document.querySelector('.xm-sleigh'); if (s) s.remove();
  }

  /* ---------- Lời khen mùa Noel (trộn vào lời khen sẵn có) ---------- */
  const NOEL_PRAISE = ['Giỏi quá! Ông già Noel thưởng em một ngôi sao! ⭐', 'Đúng rồi! Chuông Noel reo vang mừng em! 🔔', 'Tuyệt vời! Em sáng như cây thông Noel! 🎄'];
  const NOEL_CHEER = ['Không sao, người tuyết vẫn tin em làm được! ⛄', 'Thử lại nhé, tuần lộc đang cổ vũ em đấy! 🦌'];
  function noelWords(on) {
    if (typeof PRAISE === 'undefined' || typeof ENCOURAGE === 'undefined') return;
    const has = PRAISE.includes(NOEL_PRAISE[0]);
    if (on && !has) { PRAISE.push(...NOEL_PRAISE); ENCOURAGE.push(...NOEL_CHEER); }
    else if (!on && has) { NOEL_PRAISE.forEach(x => PRAISE.splice(PRAISE.indexOf(x), 1)); NOEL_CHEER.forEach(x => ENCOURAGE.splice(ENCOURAGE.indexOf(x), 1)); }
  }

  /* ---------- Rặng thông phủ tuyết ở chân trang ---------- */
  function tree(x, y, s, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-4" y="-6" width="8" height="12" rx="2" fill="#7a5134"/>' +
      '<path d="M0-74 L22-40 H12 L30-16 H16 L36 6 H-36 L-16-16 H-30 L-12-40 H-22Z" fill="' + c + '"/>' +
      '<path d="M0-74 L10-59 Q4-55 0-60 Q-5-55-10-59Z M-14-40 Q-6-35 0-40 Q7-34 14-40 L10-44 H-10Z M-22-16 Q-10-10 0-16 Q11-9 22-16 L18-20 H-18Z" fill="#fff"/></g>';
  }
  const SCENE = '<svg viewBox="0 0 1200 170" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
    '<path d="M0 120 Q150 70 320 105 T650 96 T980 100 T1200 92 V170 H0Z" fill="#e3f1ff"/>' +
    tree(70, 128, .9, '#3f9f6a') + tree(150, 136, 1.15, '#2e8a57') + tree(240, 132, .75, '#4aae74') +
    tree(960, 128, .95, '#2e8a57') + tree(1045, 136, 1.2, '#3f9f6a') + tree(1135, 130, .8, '#4aae74') +
    tree(560, 120, .55, '#5cb985') + tree(640, 122, .5, '#4aae74') +
    '<path d="M0 142 Q200 118 420 138 T820 134 T1200 128 V170 H0Z" fill="#fff"/>' +
    '<g fill="#fff" opacity=".9"><circle cx="300" cy="40" r="2"/><circle cx="420" cy="22" r="1.6"/><circle cx="780" cy="34" r="2"/><circle cx="880" cy="16" r="1.5"/></g></svg>';
  function ensureScene() {
    const shell = document.querySelector('.app-shell'); if (!shell || shell.querySelector('.noel-scene')) return;
    const el = document.createElement('div'); el.className = 'noel-scene'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = SCENE;
    shell.insertBefore(el, shell.firstChild);
  }
  /* ---------- Dây đèn dưới thanh trên ---------- */
  function ensureLights() {
    const bar = document.querySelector('.topbar'); if (!bar || bar.querySelector('.noel-lights')) return;
    const el = document.createElement('div'); el.className = 'noel-lights'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = Array.from({ length: 26 }, (_, i) => '<i style="--d:' + ((i * 37) % 13) / 10 + 's"></i>').join('');
    bar.appendChild(el);
  }

  /* ---------- Lịch Noel: 24 ô, mỗi ngày 1–24/12 học 1 bài là mở được ô của ngày đó ---------- */
  const ADVENT_GIFTS = ['🌸', '🌸', 'cookie', '🌸', 'bell', '🌸', 'scarf', '🌸', 'candle', '🌸', 'present', '🌸', 'snowman', '🌸', 'reindeer', '🌸', 'xmastree', '🌸', 'sled', '🌸', '🌸', 'bell', '🌸', 'santa'];
  function advent() { if (!S.advent || !S.advent.opened) S.advent = { opened: {} }; return S.advent; }
  function giftOf(day) { const g = ADVENT_GIFTS[day - 1]; return g === '🌸' ? { icon: '🌸', name: day === 24 ? '5 bông hoa' : '2 bông hoa', flowers: day === 24 ? 5 : 2 } : Object.assign({ flowers: 0 }, NOEL_DECOR.find(x => x.id === g)); }
  function learnedToday() { const k = dayKey(today()); return (S.history || []).some(h => h.d === k); }
  function adventState() {
    const d = today(), y = d.getFullYear(), mo = d.getMonth() + 1, day = d.getDate();
    if (mo === 11) return { phase: 'wait', left: Math.ceil((new Date(y, 11, 1) - new Date(y, mo - 1, day)) / 864e5) };
    if (mo === 12 && day <= 24) return { phase: 'open', day };
    return { phase: 'after' };
  }
  function adventCard() {
    const st = adventState(), a = advent(), opened = Object.keys(a.opened).length;
    let head, sub;
    if (st.phase === 'wait') { head = '🎄 Lịch Noel sắp mở!'; sub = 'Còn <b>' + st.left + ' ngày</b> nữa là tới 1/12. Từ 1/12 đến 24/12, mỗi ngày học 1 bài là em mở được một ô quà.'; }
    else if (st.phase === 'open') {
      const done = !!a.opened[st.day], ok = learnedToday();
      head = '🎄 Lịch Noel · ngày ' + st.day + '/12';
      sub = done ? 'Em đã mở ô hôm nay rồi. Mai quay lại mở ô tiếp nhé! ⭐' : ok ? 'Em đã học hôm nay – chạm vào ô số <b>' + st.day + '</b> để mở quà!' : 'Học xong 1 bài hôm nay để mở ô số <b>' + st.day + '</b> nhé!';
    } else { head = '🎅 Giáng sinh vui vẻ!'; sub = 'Em đã mở <b>' + opened + ' / 24</b> ô quà của Lịch Noel. Cảm ơn em đã chăm học!'; }
    const cells = Array.from({ length: 24 }, (_, i) => {
      const n = i + 1, g = giftOf(n), isOpen = !!a.opened[n];
      const isToday = st.phase === 'open' && n === st.day, missed = st.phase === 'after' ? !isOpen : st.phase === 'open' && n < st.day && !isOpen;
      const cls = isOpen ? 'open' : isToday ? 'today' + (learnedToday() ? ' ready' : '') : missed ? 'missed' : 'later';
      return '<button class="adv-cell ' + cls + '" data-adv="' + n + '" aria-label="Ô ngày ' + n + (isOpen ? ': ' + g.name : isToday ? ', hôm nay' : '') + '">' +
        (isOpen ? '<span class="adv-gift">' + g.icon + '</span>' : missed ? '<span class="adv-gift">❄️</span>' : '') + '<b>' + n + '</b></button>';
    }).join('');
    // Chưa tới tháng 12: chỉ hiện thẻ đếm ngày gọn gàng (không chiếm chỗ trên điện thoại)
    const body = st.phase === 'wait'
      ? '<div class="adv-teaser" aria-hidden="true"><span>🎁</span><span>⛄</span><b>' + st.left + '<small>ngày</small></b><span>🎄</span><span>🦌</span></div>'
      : '<div class="adv-grid">' + cells + '</div>';
    return '<section class="advent' + (st.phase === 'wait' ? ' wait' : '') + '" aria-label="Lịch Noel"><div class="adv-head"><div><h2>' + head + '</h2><p>' + sub + '</p></div>' +
      '<button class="soft-btn adv-shop" data-view="garden">☃️ Đồ trang trí Noel</button></div>' + body + '</section>';
  }
  function openAdvent(n) {
    const st = adventState(), a = advent();
    if (a.opened[n]) { toast('Ô này em mở rồi: ' + giftOf(n).icon + ' ' + giftOf(n).name); return; }
    if (st.phase === 'wait') { toast('🎄 Còn ' + st.left + ' ngày nữa Lịch Noel mới mở nhé!'); return; }
    if (st.phase !== 'open' || n !== st.day) { toast(n < (st.day || 25) ? 'Ô ngày ' + n + ' đã qua rồi ❄️ Em mở ô của hôm nay nhé!' : 'Chưa tới ngày ' + n + '/12 đâu em ơi! ⛄'); return; }
    if (!learnedToday()) { sfx('bad'); toast('Học xong 1 bài hôm nay để mở ô quà nhé! 📘'); return; }
    const g = giftOf(n);
    a.opened[n] = Date.now();
    if (g.flowers) S.flowers += g.flowers;
    else if (typeof decor === 'function') { const d = decor(); d.owned[g.id] = (d.owned[g.id] || 0) + 1; }
    save(); sfx('win'); if (!document.body.classList.contains('calm')) confetti();
    openModal('🎁 Quà Noel ngày ' + n, 'Lịch Noel · ' + gardenName(),
      '<div class="gift-open"><div class="gift-box opened">' + g.icon + '</div><h3>Em nhận được ' + esc(g.name) + '!</h3>' +
      '<p>' + (g.flowers ? 'Bông hoa đã vào giỏ của em. Dùng hoa để mua đồ trang trí trong Vườn nhé.' : 'Món đồ đã vào túi đồ trong Vườn của em – vào Vườn để đặt nó xuống nhé!') + '</p>' +
      '<div class="modal-actions center">' + (g.flowers ? '' : '<button class="soft-btn big" data-view="garden">🏡 Ra vườn đặt quà</button>') + '<button class="primary-btn big" data-close-modal>Cảm ơn! 💚</button></div></div>');
    onModalClose = render;
  }

  /* ---------- Bật / tắt ---------- */
  function applyNoel(view) {
    const on = noelOn();
    document.documentElement.classList.toggle('noel', Boolean(window.seasonId) || on); // Bộ áo chung của các cảnh. Tuyết chỉ chạy vào Noel.
    noelWords(on); syncMeta();
    if (!on) {
      stopSnow(); stopSleigh();
      document.querySelectorAll('.noel-scene, .noel-lights, .advent').forEach(node => node.remove());
      return;
    }
    ensureScene(); ensureLights(); startSnow();
    if (!sleighTimer && !calm()) scheduleSleigh(true);
    if ((view || currentView) === 'home') {
      const anchor = document.querySelector('.voyage-actions');
      if (anchor && !document.querySelector('.advent')) {
        anchor.insertAdjacentHTML('afterend', adventCard());
        document.querySelectorAll('[data-adv]').forEach(b => b.onclick = () => openAdvent(Number(b.dataset.adv)));
      }
    }
  }
  // Thanh trạng thái của điện thoại cùng màu bầu trời → mở web không thấy “viền” khác màu
  function syncMeta() {
    const meta = document.querySelector('meta[name="theme-color"]'); if (!meta) return;
    if (!meta.dataset.base) meta.dataset.base = meta.content;
    const sm = window.seasonMeta && seasonMeta();
    const nightMeta = window.seasonNightMeta?.() || '#3b0c1a';
    meta.content = document.documentElement.classList.contains('noel') ? (document.documentElement.dataset.theme === 'night' ? nightMeta : (sm || '#b31c35')) : meta.dataset.base;
  }
  // Công tắc “Giảm chuyển động” / “Ngày – Đêm” trong Cài đặt đổi class ngay mà không vẽ lại trang → tuyết, xe tuần lộc
  // và màu thanh trạng thái phải theo kịp ngay lập tức
  let wasCalm = null;
  new MutationObserver(() => {
    syncMeta();
    const c = calm(); if (c === wasCalm) return; wasCalm = c;
    if (!noelOn()) return;
    if (cv) startSnow();
    if (c) stopSleigh(); else if (!sleighTimer) scheduleSleigh();
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(syncMeta).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  AFTER_RENDER.push(applyNoel);
  window.applyNoel = applyNoel;
  applyNoel(currentView);
})();
