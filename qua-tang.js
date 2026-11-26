/* Quà tặng chúc mừng kiểu livestream – Claude Code (đợt 17). Nạp SAU app.js, cần qua-tang-am.js + qua-tang-fx.js.
   Học sinh xong bài đạt ≥ 80% → được tặng một món quà có KỊCH BẢN DIỄN riêng (hình 3D, chuyển động, âm thanh, rung màn):
     100%   → quà huyền thoại: Sư Tử Vàng (gầm), Phượng Hoàng Lửa, Rương Kho Báu
     90–99% → quà quý: Siêu Sút Vào Lưới, Kì Lân Cầu Vồng, Tên Lửa, Đại Tiệc Pháo Hoa
     80–89% → quà vui: Cá Heo Tung Sóng, Cúp Vô Địch, Vương Miện, Mưa Sao Vàng
   Trong mỗi mức, quà xoay vòng nên lần sau gặp quà khác. Quà đã nhận nằm trong “Bộ sưu tập quà” (xem lại được).
   “Giảm chuyển động” → chỉ hiện một khung hình tĩnh, không rung, không chớp. */
'use strict';
const QuaTang = (() => {
  const A = 'assets/qua-tang/';
  const IMG = {
    suTuDung: 'su-tu-dung', suTuGam: 'su-tu-gam', vuongMien: 'vuong-mien', cup: 'cup-vang', tenLua: 'ten-lua', caHeo: 'ca-heo',
    kiLan: 'ki-lan', phuongHoang: 'phuong-hoang', ruongDong: 'ruong-dong', ruongMo: 'ruong-mo', dongVang: 'dong-vang',
    cauThu: 'cau-thu-nhi', sao: 'ngoi-sao-vang', bien: 'bien-hoang-hon', cauVong: 'troi-cau-vong', thanhPho: 'thanh-pho-dem',
    sanBong: '../celebrations/stadium', bong: '../celebrations/ball',
    cauThuChay: '../celebrations/player-run', cauThuSut: '../celebrations/player-kick'
  };
  const src = k => A + IMG[k] + '.webp';
  const cache = {};
  function img(k) { if (!cache[k]) { const i = new Image(); i.src = src(k); cache[k] = i; } return cache[k]; }
  const ready = keys => Promise.race([Promise.all(keys.map(k => { const i = img(k); return i.decode ? i.decode().catch(() => {}) : null; })), new Promise(r => setTimeout(r, 2600))]);
  const calm = () => document.body.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- Danh sách quà ---------------- */
  const GIFTS = [
    { id: 'su-tu', tier: 3, name: 'Sư Tử Vàng', icon: '🦁', thumb: 'suTuGam', color: '#ffcf5c', need: ['suTuDung', 'suTuGam'], ms: 9800, words: ['DŨNG MÃNH QUÁ!', 'VUA CHÍNH TẢ!'], play: playLion },
    { id: 'phuong-hoang', tier: 3, name: 'Phượng Hoàng Lửa', icon: '🔥', thumb: 'phuongHoang', color: '#ff9a3c', need: ['phuongHoang'], ms: 9000, words: ['RỰC RỠ VÔ CÙNG!', 'TOẢ SÁNG!'], play: playPhoenix },
    { id: 'ruong', tier: 3, name: 'Rương Kho Báu', icon: '💎', thumb: 'ruongMo', color: '#ffd54a', need: ['ruongDong', 'ruongMo', 'dongVang'], ms: 9000, words: ['KHO BÁU CHỮ NGHĨA!', 'GIÀU CHỮ QUÁ!'], play: playChest },
    { id: 'sut-bong', tier: 2, name: 'Siêu Sút Vào Lưới', icon: '⚽', thumb: 'cauThu', color: '#7dffb0', need: ['sanBong', 'bong', 'cauThu', 'cauThuChay', 'cauThuSut'], ms: 8600, words: ['VÀOOOO!', 'SIÊU PHẨM!'], play: playGoal },
    { id: 'ki-lan', tier: 2, name: 'Kì Lân Cầu Vồng', icon: '🦄', thumb: 'kiLan', color: '#ffb7f0', need: ['kiLan', 'cauVong'], ms: 8800, words: ['KÌ DIỆU QUÁ!', 'ĐẸP NHƯ MƠ!'], play: playUnicorn },
    { id: 'ten-lua', tier: 2, name: 'Tên Lửa Siêu Tốc', icon: '🚀', thumb: 'tenLua', color: '#9ed0ff', need: ['tenLua', 'thanhPho', 'sao'], ms: 9200, words: ['BAY CAO NÀO!', 'TĂNG TỐC!'], play: playRocket },
    { id: 'phao-hoa', tier: 2, name: 'Đại Tiệc Pháo Hoa', icon: '🎆', thumb: 'sao', color: '#ffe27a', need: ['thanhPho'], ms: 8800, words: ['TUYỆT VỜI!', 'RỰC SÁNG BẦU TRỜI!'], play: playFireworks },
    { id: 'ca-heo', tier: 1, name: 'Cá Heo Tung Sóng', icon: '🐬', thumb: 'caHeo', color: '#8be9ff', need: ['caHeo', 'bien'], ms: 8000, words: ['GIỎI LẮM!', 'NHẢY CẪNG VUI MỪNG!'], play: playDolphin },
    { id: 'cup', tier: 1, name: 'Cúp Vô Địch', icon: '🏆', thumb: 'cup', color: '#ffe08a', need: ['cup'], ms: 7600, words: ['NHÀ VÔ ĐỊCH!', 'XUẤT SẮC!'], play: playTrophy },
    { id: 'vuong-mien', tier: 1, name: 'Vương Miện Chăm Ngoan', icon: '👑', thumb: 'vuongMien', color: '#ffd87a', need: ['vuongMien'], ms: 7600, words: ['QUÁ ĐỈNH!', 'NGÔI SAO CỦA LỚP!'], play: playCrown },
    { id: 'mua-sao', tier: 1, name: 'Mưa Sao Vàng', icon: '🌟', thumb: 'sao', color: '#fff1a8', need: ['sao', 'cauThu'], ms: 7600, words: ['SAO SÁNG!', 'HOAN HÔ!'], play: playStars }
  ];
  const byId = id => GIFTS.find(g => g.id === id);
  const TIER_NAME = { 3: 'Quà huyền thoại', 2: 'Quà quý', 1: 'Quà vui' };
  const TIER_NEED = { 3: 'Đúng 100%', 2: 'Đúng từ 90%', 1: 'Đúng từ 80%' };
  const PRAISES = [
    'Em đọc kĩ từng chữ nên viết đúng quá!', 'Chữ của em đẹp như những ngôi sao!', 'Thầy cô sẽ rất tự hào về em!', 'Em giỏi hơn hôm qua rồi đấy!',
    'Cả khu vườn đang vỗ tay cho em!', 'Em thật kiên trì và cẩn thận!', 'Viết đúng chính tả là siêu năng lực của em!', 'Bố mẹ nghe tin này chắc vui lắm!',
    'Em là tấm gương chăm học!', 'Một bài làm đáng được vỗ tay thật to!', 'Em nhớ từ rất giỏi!', 'Cứ thế này, em sẽ thành nhà văn nhí!',
    'Đôi mắt em tinh như chim ưng!', 'Em đã chinh phục thử thách rồi!', 'Trí nhớ của em thật tuyệt!', 'Hôm nay em toả sáng rực rỡ!',
    'Mỗi chữ đúng là một bông hoa nở!', 'Em làm bài như một nhà vô địch!', 'Giữ vững phong độ nhé, bạn giỏi ơi!', 'Em đã cố gắng và em đã làm được!'
  ];

  /* ---------------- Tặng quà ---------------- */
  const KINDS = new Set(['lesson', 'quick', 'classPractice', 'daily', 'challenge', 'boss', 'skip', 'dictation', 'hunt', 'review']);
  function earn(profile, result) {
    const { kind, correct, total, finished } = result;
    if (!KINDS.has(kind) || !finished || total < 4) return null;
    const acc = Math.round(100 * correct / total); if (acc < 80) return null;
    const tier = acc >= 100 ? 3 : acc >= 90 ? 2 : 1, pool = GIFTS.filter(g => g.tier === tier);
    profile.giftTurn = profile.giftTurn || {}; profile.gifts = profile.gifts || {};
    const turn = profile.giftTurn[tier] || 0, gift = pool[turn % pool.length];
    profile.giftTurn[tier] = (turn + 1) % pool.length;
    const firstTime = !profile.gifts[gift.id];
    profile.gifts[gift.id] = (profile.gifts[gift.id] || 0) + 1;
    const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    return { gift: gift.id, correct, total, acc, student: profile.name, avatar: profile.avatar, praise, firstTime };
  }

  /* ---------------- Sân khấu ---------------- */
  let live = null;
  const el = (cls, html, tag) => { const e = document.createElement(tag || 'div'); e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function stageKit(dlg, still) {
    const world = dlg.querySelector('.qt-world'), actors = dlg.querySelector('.qt-actors'), bg = dlg.querySelector('.qt-bg'), over = dlg.querySelector('.qt-over');
    const fx = QuaFx.create(dlg.querySelector('canvas'));
    const timers = [], anims = [];
    const k = {
      fx, world, still,
      at(ms, fn) { timers.push(setTimeout(() => { try { fn(); } catch (e) { console.warn(e); } }, still ? 0 : ms)); },
      bg(cls, key) { bg.className = 'qt-bg ' + cls; if (key) bg.style.backgroundImage = 'url("' + src(key) + '")'; },
      layer(cls, html) { const e = el(cls, html); actors.appendChild(e); return e; },
      front(cls, html) { const e = el(cls, html); over.appendChild(e); return e; },
      sprite(key, cls, o) { // nhân vật: hộp định vị (x,y,w theo %) + ảnh bên trong để diễn riêng
        const box = el('qt-sprite ' + (cls || '')), im = new Image(); im.src = src(key); im.alt = ''; im.draggable = false; box.appendChild(im);
        Object.assign(box.style, o || {}); actors.appendChild(box); return box;
      },
      anim(node, frames, opt) { if (!node || !node.animate) return null; const a = node.animate(frames, Object.assign({ fill: 'forwards', easing: 'ease-out' }, opt)); anims.push(a); if (still) a.finish(); return a; },
      shake(power, ms) { if (still) return; const p = power || 10, frames = []; for (let i = 0; i < 14; i++) { const f = 1 - i / 14; frames.push({ transform: 'translate(' + (Math.random() * 2 - 1) * p * f + 'px,' + (Math.random() * 2 - 1) * p * f + 'px)' }); } frames.push({ transform: 'none' }); world.animate(frames, { duration: ms || 600 }); },
      zoom(from, to, ms, origin) { if (still) return; if (origin) world.style.transformOrigin = origin; k.anim(bg, [{ transform: 'scale(' + from + ')' }, { transform: 'scale(' + to + ')' }], { duration: ms, easing: 'cubic-bezier(.2,.6,.2,1)' }); },
      glow() { if (still) return; const g = k.front('qt-bloom'); k.anim(g, [{ opacity: 0 }, { opacity: .55, offset: .18 }, { opacity: 0 }], { duration: 900 }); },
      shout(text, cls, hold) { const s = k.front('qt-shout ' + (cls || ''), esc(text)); k.anim(s, [{ opacity: 0, transform: 'translate(-50%,-50%) scale(1.7) rotate(-7deg)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(.94) rotate(-3deg)', offset: .16 }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1.04) rotate(-3deg)', offset: .82 }, { opacity: still ? 1 : 0, transform: 'translate(-50%,-50%) scale(1.18) rotate(-3deg)' }], { duration: hold || 1900 }); return s; },
      destroy() { timers.forEach(clearTimeout); anims.forEach(a => { try { a.cancel(); } catch (e) {} }); fx.stop(); }
    };
    return k;
  }

  function close() {
    if (!live) return; const { dlg, kit, back, watch } = live; live = null; if (watch) watch.disconnect(); kit.destroy(); QuaAm.end(); try { dlg.close(); } catch (e) {} dlg.remove();
    if (back && back.isConnected) back.focus({ preventScroll: true });
  }
  async function show(award, back) {
    const gift = byId(award.gift); if (!gift || live || typeof HTMLDialogElement === 'undefined') return;
    const still = calm();
    const dlg = el('qt qt-' + gift.id + ' tier' + gift.tier + (still ? ' qt-still' : ''), null, 'dialog');
    dlg.setAttribute('aria-label', 'Quà chúc mừng: ' + gift.name);
    dlg.style.setProperty('--qc', gift.color);
    dlg.innerHTML = '<div class="qt-world"><div class="qt-bg" aria-hidden="true"></div><div class="qt-actors" aria-hidden="true"></div><canvas aria-hidden="true"></canvas><div class="qt-over" aria-hidden="true"></div></div>' +
      '<div class="qt-banner"><span class="qt-ava">' + esc(award.avatar || '🙂') + '</span><span class="qt-who"><b>' + esc(award.student) + '</b><small>Nhận ' + esc(gift.name) + '</small></span>' +
      '<img class="qt-ico" src="' + src(gift.thumb) + '" alt=""><span class="qt-combo" aria-hidden="true">x<i>1</i></span></div>' +
      '<button type="button" class="qt-close" aria-label="Bỏ qua, xem kết quả">✕</button>' +
      '<div class="qt-card" role="status"><small>' + esc(TIER_NAME[gift.tier]) + (award.firstTime ? ' · <em>MỚI!</em>' : '') + '</small><h2>' + esc(gift.name) + '</h2>' +
      '<p class="qt-score">' + (award.preview ? 'Điểm minh họa · ' : '') + award.correct + '/' + award.total + ' câu đúng · ' + award.acc + '%</p><p class="qt-praise">' + esc(award.praise) + '</p>' +
      '<div class="qt-btns"><button type="button" class="qt-again">↻ Xem lại</button><button type="button" class="qt-next">Nhận quà 💝</button></div></div>';
    document.body.appendChild(dlg);
    dlg.showModal();
    const kit = stageKit(dlg, still);
    const cur = live = { dlg, kit, back, watch: null };
    // Màn bên dưới bị đóng / đổi trang (nút Back, bấm nút khác…) thì quà cũng đóng theo, không nằm đè lên trang mới
    if (back) { cur.watch = new MutationObserver(() => { if (!back.isConnected) close(); }); cur.watch.observe(document.body, { childList: true, subtree: true }); }
    dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); close(); } });
    dlg.querySelector('.qt-close').onclick = dlg.querySelector('.qt-next').onclick = close;
    dlg.querySelector('.qt-again').onclick = () => { close(); show(award, back); };
    dlg.querySelector('.qt-close').focus({ preventScroll: true });
    await ready(gift.need.concat(gift.thumb));
    if (live !== cur) return;
    kit.fx.size(); dlg.classList.add('qt-on');
    // thanh thông báo tặng quà + bộ đếm combo chạy đến số câu đúng (như livestream)
    const combo = dlg.querySelector('.qt-combo i'), target = Math.max(1, award.correct);
    if (still) combo.textContent = target;
    else for (let i = 1; i <= target; i++) kit.at(700 + i * Math.min(150, 2200 / target), () => { combo.textContent = i; combo.parentNode.animate([{ transform: 'scale(1.7)' }, { transform: 'scale(1)' }], { duration: 160 }); });
    if (!still) QuaAm.begin();
    gift.play(kit, award, gift);
    if (still) { kit.at(0, () => kit.fx.freeze()); dlg.classList.add('qt-reveal'); }
    else {
      kit.at(Math.min(gift.ms - 3200, 5200), () => dlg.classList.add('qt-reveal'));
      kit.at(gift.ms, () => dlg.classList.add('qt-done'));
    }
  }

  /* =================== KỊCH BẢN TỪNG MÓN QUÀ =================== */
  /* 🦁 Sư tử: từ xa bước tới (bụi tung, đất rung) → đứng lại, thở → ngẩng đầu GẦM hai lần: đổi sang ảnh há miệng,
     chồm tới, rung màn, vòng sóng âm lan ra, bờm bốc tia vàng. */
  function playLion(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-savanna');
    k.layer('qt-sunburst'); k.layer('qt-ground');
    const lion = k.layer('qt-actor qt-lion', '<div class="qt-breathe"><img class="a stand" src="' + src('suTuDung') + '" alt=""><img class="a roar" src="' + src('suTuGam') + '" alt=""></div>');
    k.anim(lion, [{ transform: 'translate(-50%, -14%) scale(.16)', filter: 'brightness(.25) blur(3px)', opacity: 0 }, { transform: 'translate(-50%, -12%) scale(.24)', opacity: 1, offset: .1 }, { transform: 'translate(-50%, -2%) scale(1)', filter: 'brightness(1) blur(0)', opacity: 1 }], { duration: 2500, easing: 'cubic-bezier(.35,.1,.25,1)' });
    for (let i = 0; i < 5; i++) { const t = 380 + i * 430; k.at(t, () => { S.thud(0, .25 + i * .1); k.shake(2 + i * 1.6, 260); k.fx.dust(.5 + (i % 2 ? .1 : -.1), .8, 10 + i * 3); k.anim(lion.firstChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-' + (6 + i * 2) + 'px)' }, { transform: 'translateY(0)' }], { duration: 380, fill: 'none' }); }); }
    k.at(2700, () => k.fx.magic(.5, .45, 20, ['#ffe9a0', '#fff']));
    const roarAt = (t, len, big) => {
      k.at(t - 380, () => k.anim(lion.firstChild, [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(.955) translateY(10px)' }], { duration: 360, easing: 'ease-in' }));
      k.at(t, () => {
        S.roar(0, len / 1000, big); lion.classList.add('roaring');
        k.anim(lion.firstChild, [{ transform: 'scale(.955) translateY(10px)' }, { transform: 'scale(' + (big ? 1.2 : 1.1) + ') translateY(-8px)', offset: .12 }, { transform: 'scale(' + (big ? 1.15 : 1.07) + ') translateY(-5px)', offset: .8 }, { transform: 'scale(1)' }], { duration: len });
        k.shake(big ? 24 : 15, len * .75); k.glow();
        for (let i = 0; i < (big ? 7 : 4); i++) k.at(i * 190, () => k.fx.ring(.5, .45, i % 2 ? '#fff3c0' : '#ffb020', big ? 15 : 10));
        k.fx.every(55, () => { k.fx.sparks(.5, .42, 4, ['#ffd54a', '#fff6c4', '#ff8a1f'], big ? 1.7 : 1.2); k.fx.dust(.5, .82, 2); }, len * .65);
        if (big) { k.fx.confetti(.5, .62, 90, 1.25); k.shout('GRÀÀÀO!', 'huge', 1700); }
      });
      k.at(t + len * .78, () => lion.classList.remove('roaring'));
    };
    roarAt(3300, 1500, false); roarAt(5450, 2400, true);
    k.at(7700, () => { S.fanfare(0, true); k.shout(g.words[Math.random() < .5 ? 0 : 1], 'gold', 2100); k.fx.rain(110); });
    k.at(8300, () => { S.cheer(0, 2.2); });
    k.fx.every(140, () => k.fx.embers(.5, .96, .45, 1));
    if (k.still) lion.classList.add('roaring');
  }

  /* 🔥 Phượng hoàng: bay vút từ dưới lên giữa biển lửa, vỗ cánh, kêu vang, kéo vệt lửa. */
  function playPhoenix(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-ember'); k.layer('qt-sunburst fire');
    const bird = k.layer('qt-actor qt-phoenix', '<div class="qt-flap"><img src="' + src('phuongHoang') + '" alt=""></div>');
    S.whoosh(0.3, true); S.rumble(0.2, 2.2);
    const trail = k.fx.every(30, () => { const r = bird.getBoundingClientRect(), W = innerWidth, H = innerHeight; const x = (r.left + r.width / 2) / W, y = (r.top + r.height * .72) / H; k.fx.fire(x, y, 3, .6); k.fx.embers(x, y, .06, 1); }, 4200);
    k.anim(bird, [{ transform: 'translate(-50%, 95vh) scale(.35)', opacity: 0 }, { transform: 'translate(-50%, 20%) scale(.8)', opacity: 1, offset: .55 }, { transform: 'translate(-50%, -8%) scale(1.12)', offset: .85 }, { transform: 'translate(-50%, 0) scale(1)', opacity: 1 }], { duration: 2800, easing: 'cubic-bezier(.2,.7,.2,1)' });
    k.at(2500, () => { S.screech(0); k.shake(12, 700); k.glow(); k.fx.ring(.5, .45, '#ffb020', 18); k.fx.sparks(.5, .45, 90, null, 2); k.shout(g.words[0], 'gold', 1900); });
    k.at(4300, () => { S.screech(0); S.whoosh(0, true); k.anim(bird.firstChild, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)', offset: .35 }, { transform: 'scale(1)' }], { duration: 1100, fill: 'none' }); for (let i = 0; i < 4; i++) k.at(i * 170, () => k.fx.ring(.5, .45, '#ff6a1f', 12)); });
    k.at(5600, () => { S.fanfare(0, true); k.fx.rain(90, ['#ffd54a', '#ff9a3c', '#ff5d2a', '#fff1a8']); });
    k.fx.every(45, () => k.fx.embers(Math.random(), 1.02, .02, 1));
  }

  /* 💎 Rương: rơi xuống nảy, rung bần bật, bật nắp – cột sáng, vàng phun trào. */
  function playChest(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-cave'); const beam = k.layer('qt-beam'); k.layer('qt-sunburst'); k.layer('qt-ground dark');
    const chest = k.layer('qt-actor qt-chest', '<div class="qt-breathe"><img class="a stand" src="' + src('ruongDong') + '" alt=""><img class="a roar" src="' + src('ruongMo') + '" alt=""></div>');
    k.anim(chest, [{ transform: 'translate(-50%,-120vh)' }, { transform: 'translate(-50%,4%)', offset: .55, easing: 'ease-out' }, { transform: 'translate(-50%,-12%)', offset: .73 }, { transform: 'translate(-50%,0)', offset: .88 }, { transform: 'translate(-50%,-3%)', offset: .94 }, { transform: 'translate(-50%,0)' }], { duration: 1400, easing: 'ease-in' });
    k.at(760, () => { S.thud(0, .9); k.shake(16, 450); k.fx.dust(.5, .76, 40); });
    [1900, 2450, 2900, 3250].forEach((t, i) => k.at(t, () => { S.thud(0, .3 + i * .1); S.tick(.05, false); k.anim(chest.firstChild, [{ transform: 'rotate(0)' }, { transform: 'rotate(-' + (3 + i * 2) + 'deg)' }, { transform: 'rotate(' + (3 + i * 2) + 'deg)' }, { transform: 'rotate(-' + (2 + i) + 'deg)' }, { transform: 'rotate(0)' }], { duration: 340, fill: 'none' }); k.fx.magic(.5, .55, 6 + i * 4, ['#ffe27a', '#fff']); }));
    k.at(3800, () => {
      chest.classList.add('roaring'); beam.classList.add('on'); k.glow(); k.shake(20, 800); S.boom(0, .7); S.fanfare(.1, true); S.sparkle(.1, 22);
      k.anim(chest.firstChild, [{ transform: 'scale(.9)' }, { transform: 'scale(1.16)', offset: .3 }, { transform: 'scale(1)' }], { duration: 700, fill: 'none' });
      k.fx.ring(.5, .55, '#ffe27a', 20); k.fx.sparks(.5, .55, 120, ['#fff6c4', '#ffd54a'], 1.8);
      k.fx.every(70, () => { k.fx.coins(.5, .6, 4, img('dongVang')); k.fx.magic(.5, .5, 2); }, 2600);
      for (let i = 0; i < 22; i++) k.at(i * 120, () => S.coin(0));
    });
    k.at(4400, () => k.shout(g.words[0], 'gold', 2200));
    if (k.still) chest.classList.add('roaring');
  }

  /* ⚽ Sút bóng: còi → cầu thủ chạy đà → bóng xoáy bay vào góc lưới, lưới rung, khán đài hò reo, pháo giấy. */
  function playGoal(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-photo qt-bg-stadium', 'sanBong'); k.zoom(1.02, 1.12, 8000);
    const shadow = k.layer('qt-ballshadow'), ball = k.sprite('bong', 'qt-ball'), net = k.layer('qt-netwave');
    const player = k.sprite('cauThu', 'qt-player qt-player-cheer');
    if (k.still) return;
    player.hidden = true;
    const runner = k.sprite('cauThuChay', 'qt-player qt-player-run');
    const kicker = k.sprite('cauThuSut', 'qt-player qt-player-kick');
    kicker.hidden = true;
    const ballPoint = () => {
      const r = ball.getBoundingClientRect();
      const field = k.world.getBoundingClientRect();
      return [(r.left + r.width / 2 - field.left) / field.width, (r.top + r.height / 2 - field.top) / field.height];
    };
    k.anim(runner, [{ transform: 'translate(-65vw,-100%) rotate(-6deg)' }, { transform: 'translate(0,-100%)' }], { duration: 1480 });
    for (let i = 0; i < 5; i++) k.at(260 + i * 245, () => { S.thud(0, .18); k.anim(runner.firstChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 215, fill: 'none' }); });
    S.whistle(.35); S.cheer(.1, 2.2);
    k.at(1610, () => {
      runner.hidden = true;
      kicker.hidden = false;
      k.anim(kicker.firstChild, [{ transform: 'translateX(-10%) rotate(-7deg)' }, { transform: 'translateX(0) rotate(0)', offset: .38 }, { transform: 'translateX(3%) rotate(4deg)' }], { duration: 600, easing: 'ease-out' });
    });
    k.at(1820, () => {
      const [x, y] = ballPoint();
      S.thud(0, 1); S.whoosh(.04, true); k.shake(9, 300); k.fx.dust(x, y + .05, 30); k.fx.ring(x, y, '#fff', 8);
      k.anim(ball, [{ left: '50%', top: 'var(--qt-ball-y)', width: 'var(--ball0)', transform: 'translate(-50%,-50%) rotate(0)' }, { left: '42%', top: '34%', width: 'var(--ballm)', transform: 'translate(-50%,-50%) rotate(620deg)', offset: .55 }, { left: '58%', top: '44%', width: 'var(--ball1)', transform: 'translate(-50%,-50%) rotate(1180deg)' }], { duration: 1180, easing: 'cubic-bezier(.25,.5,.45,1)' });
      k.anim(shadow, [{ left: '50%', opacity: .6, transform: 'translate(-50%,0) scale(1)' }, { left: '57%', top: '55%', opacity: .35, transform: 'translate(-50%,0) scale(.3)' }], { duration: 1150 });
      k.fx.every(40, () => k.fx.magic(...ballPoint(), 2, ['#fff', '#bfffe0']), 1100);
    });
    k.at(3000, () => {
      kicker.hidden = true;
      player.hidden = false;
      net.classList.add('on'); S.boom(0, .55); S.cheer(0, 4.6); S.fanfare(.25, false); k.shake(18, 700); k.glow();
      k.fx.ring(.58, .44, '#fff', 14); k.fx.sparks(.58, .44, 60); k.fx.confetti(.12, .9, 70, 1.3); k.fx.confetti(.88, .9, 70, 1.3); k.fx.rain(90);
      k.shout(g.words[0], 'huge', 2300);
      k.anim(ball, [{ left: '58%', top: '44%', width: 'var(--ball1)', transform: 'translate(-50%,-50%) rotate(1180deg)' }, { left: '56.5%', top: '53%', width: 'var(--ball1)', transform: 'translate(-50%,-50%) rotate(1380deg)' }], { duration: 650, easing: 'ease-in' });
      k.fx.every(520, () => k.anim(player.firstChild, [{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-46px) rotate(' + (Math.random() < .5 ? -6 : 6) + 'deg)' }, { transform: 'translateY(0)' }], { duration: 480, fill: 'none' }), 3600);
    });
    k.at(5400, () => k.shout(g.words[1], 'gold', 2000));
  }

  /* 🦄 Kì lân: bay lượn qua bầu trời cầu vồng, rắc bụi tiên, dừng giữa trời, chớp sáng. */
  function playUnicorn(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-photo', 'cauVong'); k.zoom(1.15, 1.03, 8500);
    const uni = k.layer('qt-actor qt-unicorn', '<div class="qt-float"><img src="' + src('kiLan') + '" alt=""></div>');
    const trail = () => { const r = uni.getBoundingClientRect(); k.fx.magic((r.left + r.width * .22) / innerWidth, (r.top + r.height * .62) / innerHeight, 5, ['#ff7ab8', '#ffd54a', '#7dffb0', '#7ad0ff', '#c9a6ff']); };
    k.fx.every(32, trail, 6800);
    k.anim(uni, [{ transform: 'translate(-175vw, 30%) scale(.45) rotate(8deg)' }, { transform: 'translate(-105%, -34%) scale(.75) rotate(-8deg)', offset: .42 }, { transform: 'translate(-22%, 12%) scale(1.14) rotate(5deg)', offset: .76 }, { transform: 'translate(-50%, 0) scale(1) rotate(0)' }], { duration: 3600, easing: 'ease-in-out' });
    S.whoosh(.2, true); S.sparkle(.4, 20); S.sparkle(1.9, 20);
    k.at(3500, () => { S.fanfare(0, false); S.sparkle(.1, 26); k.glow(); k.fx.ring(.5, .46, '#fff', 12); k.fx.magic(.5, .45, 90); k.shout(g.words[0], 'rainbow', 2200); });
    k.at(4800, () => { k.fx.rain(100, ['#ff7ab8', '#ffd54a', '#7dffb0', '#7ad0ff', '#c9a6ff']); S.cheer(.1, 2.4); });
    k.fx.every(120, () => k.fx.magic(Math.random(), Math.random() * .8, 1));
  }

  /* 🚀 Tên lửa: đếm ngược 3-2-1, khai hoả phụt lửa khói, rung dữ dội rồi vút lên trời sao. */
  function playRocket(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-photo qt-bg-night', 'thanhPho'); k.layer('qt-stars');
    const ship = k.layer('qt-actor qt-rocket', '<div class="qt-flamewrap"><i class="qt-flame"></i></div><img src="' + src('tenLua') + '" alt="">');
    k.anim(ship, [{ transform: 'translate(-50%, 70%)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1 }], { duration: 700 });
    ['3', '2', '1'].forEach((n, i) => k.at(800 + i * 800, () => { S.tick(0, false); k.shout(n, 'count', 760); k.fx.ring(.5, .4, '#9ed0ff', 6); k.fx.smoke(.5, .83, 6 + i * 4); }));
    k.at(3200, () => {
      S.tick(0, true); S.rumble(0, 4.4); ship.classList.add('fire'); k.shout('KHAI HOẢ!', 'huge', 1100); k.shake(15, 1400); k.glow();
      const flame = () => { const r = ship.getBoundingClientRect(), x = (r.left + r.width / 2) / innerWidth, y = (r.top + r.height * .93) / innerHeight; k.fx.fire(x, y, 5, 1.25); k.fx.smoke(x, Math.min(.93, y + .05), 2); k.fx.sparks(x, y, 2, null, .8); };
      k.fx.every(28, flame, 3800);
      k.fx.every(60, () => k.anim(ship.lastElementChild, [{ transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }], { duration: 55, fill: 'none' }), 1300);
    });
    k.at(4400, () => { S.whoosh(0, true); k.anim(ship, [{ transform: 'translate(-50%, 0) scale(1)' }, { transform: 'translate(-50%, -34vh) scale(.95)', offset: .45 }, { transform: 'translate(-50%, -150vh) scale(.6)' }], { duration: 2300, easing: 'cubic-bezier(.55,0,.8,.5)' }); k.world.classList.add('warp'); });
    k.at(6700, () => { k.world.classList.remove('warp'); S.boom(0, .8); S.fanfare(.2, true); k.glow(); k.fx.burst(.5, .3, '#ffe27a', 70, 1.8); k.fx.burst(.5, .3, '#7ad0ff', 50, 1.2); k.fx.ring(.5, .3, '#fff', 16); k.shout(g.words[0], 'gold', 2200);
      const star = k.sprite('sao', 'qt-bigstar'); k.anim(star, [{ transform: 'translate(-50%,-50%) scale(0) rotate(-180deg)' }, { transform: 'translate(-50%,-50%) scale(1.2) rotate(10deg)', offset: .6 }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }], { duration: 900 }); S.sparkle(0, 16); });
  }

  /* 🎆 Pháo hoa trên thành phố đêm: bắn từng quả có tiếng rít – nổ, rồi dồn dập đại tiệc. */
  function playFireworks(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-photo qt-bg-night', 'thanhPho'); k.zoom(1.1, 1.0, 8500);
    const colors = ['#ff5d73', '#ffd54a', '#46e08a', '#5ab4ff', '#d98bff', '#ff9a3c', '#6ff0e8'];
    k.fx.onBoom = () => { S.boom(0, .32); };
    const shot = (x, y, i) => { k.fx.firework(x, colors[i % colors.length], y); S.launch(0); };
    [[.3, .22], [.7, .18], [.5, .14], [.18, .3], [.82, .28]].forEach((p, i) => k.at(250 + i * 560, () => shot(p[0], p[1], i)));
    k.at(3700, () => k.shout(g.words[0], 'gold', 2000));
    for (let i = 0; i < 20; i++) k.at(3800 + i * 190, () => shot(.1 + Math.random() * .8, .08 + Math.random() * .3, i + 2));
    k.at(5600, () => { S.fanfare(0, true); S.cheer(.2, 3); });
    k.at(6900, () => k.shout(g.words[1], 'rainbow', 2000));
    if (k.still) { k.fx.burst(.3, .25, '#ff5d73', 50); k.fx.burst(.7, .2, '#ffd54a', 50); }
  }

  /* 🐬 Cá heo: hai cú nhảy vòng cung khỏi mặt biển hoàng hôn, nước bắn toé. */
  function playDolphin(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-photo', 'bien'); k.zoom(1.02, 1.1, 8000);
    const jump = (t, dir, size, last) => k.at(t, () => {
      const d = k.sprite('caHeo', 'qt-dolphin' + (dir < 0 ? ' flip' : ''), { width: 'calc(var(--dw) * ' + size + ')' });
      const x0 = dir > 0 ? 14 : 86, x1 = dir > 0 ? 84 : 16;
      const fr = [];
      for (let i = 0; i <= 12; i++) { const p = i / 12, x = x0 + (x1 - x0) * p, y = 86 - Math.sin(p * Math.PI) * (last ? 54 : 44); fr.push({ left: x + '%', top: y + '%', transform: 'translate(-50%,-50%) rotate(' + dir * (-42 + 96 * p) + 'deg)', opacity: i === 0 || i === 12 ? 0 : 1 }); }
      k.anim(d, fr, { duration: 1900, easing: 'linear' });
      S.splash(0); S.dolphin(.35); k.fx.splash(x0 / 100, .8, 60); k.fx.ring(x0 / 100, .82, '#e6fbff', 6);
      k.fx.every(60, () => { const r = d.getBoundingClientRect(); k.fx.magic((r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight, 1, ['#fff', '#bff4ff']); }, 1700);
      k.at(1780, () => { S.splash(0); k.fx.splash(x1 / 100, .8, 80); k.fx.ring(x1 / 100, .82, '#e6fbff', 8); k.shake(5, 300); });
    });
    jump(500, 1, 1, false); jump(2300, -1, .9, false);
    jump(4300, 1, 1.35, true);
    k.at(5200, () => { S.fanfare(0, false); S.dolphin(.2); k.shout(g.words[0], 'gold', 2100); k.fx.confetti(.5, .4, 70); });
    if (k.still) k.sprite('caHeo', 'qt-dolphin', { left: '50%', top: '42%', transform: 'translate(-50%,-50%)' });
  }

  /* 🏆 Cúp: đèn sân khấu rọi, cúp xoay trồi lên từ bục, ánh quét trên mặt vàng. */
  function playTrophy(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-hall'); k.layer('qt-spot s1'); k.layer('qt-spot s2'); k.layer('qt-sunburst'); k.layer('qt-podium');
    const cup = k.layer('qt-actor qt-cup', '<div class="qt-float"><img src="' + src('cup') + '" alt=""><i class="qt-shine" style="-webkit-mask-image:url(' + src('cup') + ');mask-image:url(' + src('cup') + ')"></i></div>');
    S.rumble(.1, 1.6); for (let i = 0; i < 16; i++) S.thud(.15 + i * .1, .12 + i * .012);
    k.anim(cup, [{ transform: 'translate(-50%, 60vh) scale(.5) rotateY(720deg)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: 'translate(-50%, -4%) scale(1.1) rotateY(0deg)', offset: .85 }, { transform: 'translate(-50%, 0) scale(1) rotateY(0)', opacity: 1 }], { duration: 2400, easing: 'cubic-bezier(.2,.7,.25,1)' });
    k.at(2200, () => { S.boom(0, .6); S.fanfare(.05, true); k.glow(); k.shake(12, 500); k.fx.ring(.5, .46, '#ffe27a', 16); k.fx.sparks(.5, .46, 90); k.fx.confetti(.18, .9, 60, 1.3); k.fx.confetti(.82, .9, 60, 1.3); k.shout(g.words[0], 'gold', 2200); });
    k.at(3400, () => { S.cheer(0, 3.4); k.fx.rain(110); });
    k.fx.every(130, () => k.fx.magic(.5 + (Math.random() - .5) * .45, .25 + Math.random() * .4, 1, ['#fff', '#ffe27a']));
  }

  /* 👑 Vương miện: gương mặt bạn nhỏ hiện giữa hào quang, vương miện từ trời hạ xuống đội lên đầu. */
  function playCrown(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-royal'); k.layer('qt-sunburst'); const halo = k.layer('qt-halo');
    const face = k.layer('qt-actor qt-royal', '<span>' + esc(a.avatar || '🙂') + '</span><b>' + esc(a.student) + '</b>');
    const crown = k.sprite('vuongMien', 'qt-crown');
    k.anim(face, [{ transform: 'translate(-50%,0) scale(0)' }, { transform: 'translate(-50%,0) scale(1.15)', offset: .7 }, { transform: 'translate(-50%,0) scale(1)' }], { duration: 900 });
    S.sparkle(.2, 14); S.whoosh(1.2, false);
    k.anim(crown, [{ transform: 'translate(-50%,-110vh) rotate(-40deg) scale(1.7)' }, { transform: 'translate(-50%,-62%) rotate(10deg) scale(1.25)', offset: .75 }, { transform: 'translate(-50%,0) rotate(-6deg) scale(1)' }], { duration: 2400, delay: 700, easing: 'cubic-bezier(.3,.6,.25,1)', fill: 'both' });
    k.fx.every(50, () => { const r = crown.getBoundingClientRect(); if (r.bottom > 0) k.fx.magic((r.left + r.width / 2) / innerWidth, (r.top + r.height * .7) / innerHeight, 2, ['#fff', '#ffe27a']); }, 3100);
    k.at(3050, () => { S.thud(0, .6); S.fanfare(.05, true); k.glow(); k.shake(10, 420); halo.classList.add('on'); k.anim(face, [{ transform: 'translate(-50%,0) scale(1)' }, { transform: 'translate(-50%,3%) scale(1.08,.9)', offset: .25 }, { transform: 'translate(-50%,0) scale(1)' }], { duration: 520, fill: 'none' }); k.fx.ring(.5, .4, '#ffe27a', 16); k.fx.sparks(.5, .34, 80); k.shout(g.words[0], 'gold', 2200); });
    k.at(4300, () => { S.cheer(0, 2.8); k.fx.rain(90); k.fx.confetti(.5, .75, 60); });
  }

  /* 🌟 Mưa sao: bạn nhỏ ăn mừng, ngôi sao lớn bay tới nổ thành mưa sao. */
  function playStars(k, a, g) {
    const S = QuaAm; k.bg('qt-bg-starry'); k.layer('qt-stars'); k.layer('qt-sunburst'); k.layer('qt-ground dark');
    const kid = k.sprite('cauThu', 'qt-hero'), star = k.sprite('sao', 'qt-bigstar');
    k.anim(kid, [{ transform: 'translate(-50%,60%)', opacity: 0 }, { transform: 'translate(-50%,-6%)', opacity: 1, offset: .75 }, { transform: 'translate(-50%,0)', opacity: 1 }], { duration: 900 });
    S.whoosh(.3, true); S.sparkle(.5, 16);
    k.anim(star, [{ transform: 'translate(-320%,-300%) scale(.15) rotate(-540deg)' }, { transform: 'translate(-50%,-50%) scale(1.5) rotate(15deg)', offset: .8 }, { transform: 'translate(-50%,-50%) scale(1) rotate(0)' }], { duration: 2000, easing: 'cubic-bezier(.25,.6,.3,1)' });
    k.fx.every(40, () => { const r = star.getBoundingClientRect(); k.fx.magic((r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight, 2, ['#fff', '#ffe27a']); }, 2000);
    k.at(1950, () => { S.boom(0, .55); S.fanfare(.1, false); k.glow(); k.shake(13, 500); k.fx.ring(.5, .28, '#fff3a0', 18); k.fx.burst(.5, .28, '#ffe27a', 60, 1.7); k.shout(g.words[0], 'gold', 2000);
      k.fx.every(95, () => k.fx.image(img('sao'), Math.random(), -.04, { vy: 2.2 + Math.random() * 3.5, g: .03, vr: (Math.random() - .5) * .12, size: (10 + Math.random() * 20) * Math.min(innerWidth, innerHeight) / 400, decay: .006 }), 4200); });
    [2600, 3300, 4000, 4700].forEach(t => k.at(t, () => { S.coin(0); k.anim(kid.firstChild, [{ transform: 'translateY(0)' }, { transform: 'translateY(-40px) scale(1.04)' }, { transform: 'translateY(0)' }], { duration: 520, fill: 'none' }); }));
    k.at(3500, () => S.cheer(0, 3));
  }

  /* ---------------- Gắn vào màn kết quả + Bộ sưu tập ---------------- */
  function attach(award) {
    if (!award || typeof HTMLDialogElement === 'undefined') return;
    const anchor = document.querySelector('#modalRoot .lesson-complete .modal-actions'); if (!anchor) return;
    const gift = byId(award.gift);
    const strip = el('qt-strip', '<img src="' + src(gift.thumb) + '" alt=""><div><small>' + TIER_NAME[gift.tier] + (award.firstTime ? ' · mới!' : '') + '</small><b>' + esc(gift.name) + '</b></div>' +
      '<div class="qt-strip-btns"><button type="button" class="soft-btn qt-replay">▶ Xem lại</button><button type="button" class="soft-btn" data-view="gifts">🎁 Bộ quà</button></div>');
    anchor.before(strip);
    const replay = strip.querySelector('.qt-replay'); replay.onclick = () => show(award, replay);
    if (!document.hidden) show(award, replay);
  }
  function collectionPage() {
    const have = S.gifts || {}, n = GIFTS.filter(g => have[g.id]).length;
    return pageHeading('PHẦN THƯỞNG', 'Bộ sưu tập quà', 'Làm bài đạt từ 80% là được tặng quà. Đúng càng nhiều, quà càng hiếm. Em đã có ' + n + '/' + GIFTS.length + ' món.') +
      [3, 2, 1].map(t => '<section class="qt-shelf tier' + t + '"><h2><span>' + TIER_NAME[t] + '</span><small>' + TIER_NEED[t] + '</small></h2><div class="qt-grid">' +
        GIFTS.filter(g => g.tier === t).map(g => '<article class="qt-item' + (have[g.id] ? '' : ' locked') + '"><img src="' + src(g.thumb) + '" alt="" loading="lazy"><b>' + esc(g.name) + '</b>' +
          (have[g.id] ? '<small>Đã nhận ' + have[g.id] + ' lần</small><button type="button" class="soft-btn sm" data-gift="' + g.id + '">▶ Xem</button>' : '<small>Chưa nhận · ' + TIER_NEED[t].toLowerCase() + '</small><button type="button" class="soft-btn sm" data-peek="' + g.id + '">👀 Ngó thử</button>') + '</article>').join('') + '</div></section>').join('');
  }
  function bindCollection() {
    const run = (button, id, peek) => {
      const gift = byId(id);
      const correct = 7 + gift.tier;
      const praise = peek ? 'Cố lên! Đạt ' + TIER_NEED[gift.tier].toLowerCase() + ' để món quà này thuộc về em.' : PRAISES[Math.floor(Math.random() * PRAISES.length)];
      show({ gift: id, correct, total: 10, acc: correct * 10, student: S.name, avatar: S.avatar, praise, firstTime: false, preview: true }, button);
    };
    $$('[data-gift]').forEach(b => b.onclick = () => run(b, b.dataset.gift, false));
    $$('[data-peek]').forEach(b => b.onclick = () => run(b, b.dataset.peek, true));
  }
  if (typeof registerView === 'function') registerView('gifts', 'Bộ sưu tập quà', collectionPage, bindCollection);
  if (typeof AFTER_RENDER !== 'undefined') AFTER_RENDER.push(view => { // lối vào từ Hồ sơ và Trang trí vườn
    if (view !== 'profile' || document.querySelector('.qt-entry')) return;
    const head = document.querySelector('.pf-head') || document.querySelector('.page-heading'); if (!head) return;
    const have = S.gifts || {}, n = GIFTS.filter(g => have[g.id]).length;
    head.insertAdjacentHTML('afterend', '<button type="button" class="qt-entry" data-view="gifts"><span class="qt-entry-ico">🎁</span><span><b>Bộ sưu tập quà</b><small>' + n + '/' + GIFTS.length + ' món quà chúc mừng</small></span><span aria-hidden="true">›</span></button>');
  });
  addEventListener('popstate', close);
  addEventListener('hashchange', close);
  document.addEventListener('visibilitychange', () => { if (document.hidden) close(); });
  return { earn, attach, show, close, gifts: GIFTS };
})();
