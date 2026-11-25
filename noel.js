/* Mùa Giáng sinh – Claude Code (đợt 11). Nạp SAU onboarding.js.
   Học theo Santa's Village của Google (mỗi ngày mở một điều bất ngờ tới 24/12) và các trang học tập
   cho thiếu nhi mùa lễ: tuyết rơi nhẹ, rặng thông phủ tuyết, dây đèn nhấp nháy, mũ Noel cho bạn đồng hành,
   đồ trang trí Noel trong Vườn của em và “Lịch Noel” 24 ô.
   Bật/tắt: Cài đặt → Hiển thị → Trang trí Giáng sinh (Tự động = 15/11 → 10/1). Chế độ “Giảm chuyển động”
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

  /* ---------- Tuyết rơi (canvas, nhẹ: ~30 hình/giây, dừng khi ẩn tab) ---------- */
  let cv = null, ctx = null, flakes = [], raf = 0, last = 0, W = 0, H = 0;
  function sizeCanvas() {
    if (!cv) return;
    const d = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function flake(anyY) { return { x: Math.random() * W, y: anyY ? Math.random() * H : -8, r: 1.4 + Math.random() * 2.6, s: 0.35 + Math.random() * 0.75, w: Math.random() * 6.3, a: 0.6 + Math.random() * 0.4 }; }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(60,110,170,.45)'; ctx.shadowBlur = 3;
    for (const f of flakes) { ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.3); ctx.fill(); }
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (document.hidden || t - last < 33) return;
    const k = last ? Math.min(3, (t - last) / 16.7) : 1; last = t;
    for (const f of flakes) {
      f.y += f.s * k; f.w += 0.018 * k; f.x += Math.sin(f.w) * 0.35 * k;
      if (f.y > H + 6) Object.assign(f, flake(false));
      if (f.x < -6) f.x = W + 4; else if (f.x > W + 6) f.x = -4;
    }
    draw();
  }
  function startSnow() {
    if (!cv) {
      cv = document.createElement('canvas'); cv.className = 'noel-snow'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv); sizeCanvas();
      flakes = Array.from({ length: innerWidth < 600 ? 30 : 56 }, () => flake(true));
    }
    cancelAnimationFrame(raf); raf = 0;
    if (calm()) draw(); else { last = 0; raf = requestAnimationFrame(tick); }
  }
  function stopSnow() { cancelAnimationFrame(raf); raf = 0; if (cv) { cv.remove(); cv = null; } }
  addEventListener('resize', () => { if (!cv) return; sizeCanvas(); flakes.forEach(f => { if (f.x > W) f.x = Math.random() * W; }); if (!raf) draw(); });

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
    document.documentElement.classList.toggle('noel', on);
    const logo = document.getElementById('brandLogo');
    if (logo && logo.dataset.mode !== String(on)) { logo.dataset.mode = String(on); logo.textContent = on ? '🎄' : '🌱'; }
    if (!on) { stopSnow(); const sc = document.querySelector('.noel-scene'); if (sc) sc.remove(); const li = document.querySelector('.noel-lights'); if (li) li.remove(); return; }
    ensureScene(); ensureLights(); startSnow();
    if ((view || currentView) === 'home') {
      const anchor = document.querySelector('.voyage-actions');
      if (anchor && !document.querySelector('.advent')) {
        anchor.insertAdjacentHTML('afterend', adventCard());
        document.querySelectorAll('[data-adv]').forEach(b => b.onclick = () => openAdvent(Number(b.dataset.adv)));
      }
    }
  }
  AFTER_RENDER.push(applyNoel);
  window.applyNoel = applyNoel;
  applyNoel(currentView);
})();
