/* Ngọn lửa chuỗi ngày “như trong game” – Claude Code (đợt 15). Nạp SAU streak-room.js.
   Thêm vào trang Chuỗi lửa: bé lửa đáng yêu (có mặt cười) lớn dần theo các mốc 3 · 10 · 15 · 30 · 50 · 100 · 200 · 365 ngày,
   đổi màu (cam → đỏ → vàng kim → xanh), thêm tia lửa; bên dưới là “Đường lửa” – các mốc có quà trang phục.
   Không sửa streak-room.js: chỉ chèn thêm một khối sau .streak-stage (AFTER_RENDER). Giảm chuyển động → đứng yên. */
'use strict';
(function () {
  const MS = [[3, '🎀', 'Nơ đào'], [10, '🧣', 'Khăn phiêu lưu'], [15, '🎧', 'Tai nghe học chữ'], [30, '🎓', 'Mũ học giả'], [50, '🌸', 'Vòng hoa'], [100, '👑', 'Vương miện'], [200, '✨', 'Áo choàng sao'], [365, '🏆', 'Cúp Quanh Mặt Trời']];
  const NAMES = ['Đốm lửa nhỏ', 'Ngọn lửa ấm', 'Lửa bập bùng', 'Lửa rực rỡ', 'Lửa hồng', 'Lửa vàng kim', 'Lửa phượng hoàng', 'Lửa xanh thần kì', 'Mặt trời nhỏ'];
  const PAL = [['#ff9d3c', '#ffd35a'], ['#ff8a2a', '#ffd35a'], ['#ff7a1f', '#ffe27a'], ['#ff5d2a', '#ffd35a'], ['#f2362b', '#ffb347'], ['#ffb300', '#fff2a0'], ['#ff4d4d', '#ffd35a'], ['#3b9cff', '#bfeaff'], ['#ffc400', '#ffffff']];
  function flame(level) {
    const [a, b] = PAL[level], sc = (0.62 + level * 0.1).toFixed(2);
    const embers = Array.from({ length: Math.min(9, 2 + level) }, (_, i) => '<i style="left:' + (18 + (i * 61) % 64) + '%;animation-delay:' + (i * -0.45).toFixed(2) + 's;animation-duration:' + (1.6 + (i % 3) * .5) + 's"></i>').join('');
    return '<div class="sf-flame" style="--sc:' + sc + '" aria-hidden="true"><div class="sf-embers">' + embers + '</div>' +
      '<svg viewBox="0 0 120 150"><defs><linearGradient id="sfg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>' +
      '<g class="sf-body"><path d="M60 6 C66 34 98 50 98 92 C98 122 80 144 60 144 C40 144 22 122 22 92 C22 70 36 60 42 42 C50 52 52 58 54 62 C60 44 56 26 60 6Z" fill="url(#sfg)"/>' +
      '<path class="sf-in" d="M60 62 C64 80 82 90 82 112 C82 128 72 140 60 140 C48 140 38 128 38 112 C38 94 54 84 60 62Z" fill="#fff6c9" opacity=".9"/>' +
      '<ellipse cx="48" cy="108" rx="6" ry="4" fill="#ff7a8a" opacity=".6"/><ellipse cx="72" cy="108" rx="6" ry="4" fill="#ff7a8a" opacity=".6"/>' +
      '<circle cx="49" cy="98" r="4.4" fill="#5a2a12"/><circle cx="71" cy="98" r="4.4" fill="#5a2a12"/><circle cx="50.5" cy="96.5" r="1.4" fill="#fff"/><circle cx="72.5" cy="96.5" r="1.4" fill="#fff"/>' +
      '<path d="M54 108 Q60 116 66 108" fill="none" stroke="#5a2a12" stroke-width="3.2" stroke-linecap="round"/></g></svg></div>';
  }
  /* Linh vật Rồng Lửa: tiến hoá theo KỈ LỤC chuỗi ngày (đã lớn thì không teo lại) – ảnh assets/thu-cung/rong-0…8.webp */
  const PET = ['Trứng rồng', 'Rồng mới nở', 'Rồng phiêu lưu', 'Rồng mê nhạc', 'Rồng học giả', 'Rồng vườn hoa', 'Rồng hoàng gia', 'Rồng ngân hà', 'Rồng Mặt Trời'];
  const petSrc = i => 'assets/thu-cung/rong-' + i + '.webp';
  const stageOf = days => MS.filter(m => m[0] <= days).length;
  function petHTML(stage) {
    return '<div class="sf-pet" data-noemo><div class="sf-pet-float"><img class="sf-pet-img" src="' + petSrc(stage) + '" alt="' + PET[stage] + '" onerror="this.closest(\'.sf-pet\').remove()"></div></div>';
  }
  function petShelf(stage) {
    return '<ol class="sf-pets" aria-label="Các dạng tiến hoá">' + PET.map((n, i) =>
      '<li class="' + (i <= stage ? 'got' : 'later') + (i === stage ? ' now' : '') + '"><img src="' + petSrc(i) + '" alt="" loading="lazy" onerror="this.remove()"><b>' + (i <= stage ? n : '???') + '</b><small>' + (i ? MS[i - 1][0] + ' ngày' : 'bắt đầu') + '</small></li>').join('') + '</ol>';
  }
  function evolve(stage) { // lần đầu thấy dạng mới → loé sáng, nhảy mừng
    if (typeof S.petSeen !== 'number') { S.petSeen = stage; save(); return; }
    if (stage <= S.petSeen) return;
    S.petSeen = stage; save();
    const pet = document.querySelector('.sf-pet'); if (!pet) return;
    pet.classList.add('evolve'); if (typeof sfx === 'function') sfx('win'); if (!document.body.classList.contains('calm') && typeof confetti === 'function') confetti();
    toast('✨ Rồng của em tiến hoá thành ' + PET[stage] + '!');
  }
  function section() {
    const live = (typeof StreakRoom !== 'undefined' ? StreakRoom.live() : S.streak) | 0, best = Math.max(S.bestStreak || 0, S.streak || 0);
    const level = MS.filter(m => m[0] <= live).length, nextIdx = MS.findIndex(m => m[0] > live), nxt = MS[nextIdx];
    const nodes = MS.map((m, i) => {
      const got = m[0] <= best, cls = got ? 'got' : i === nextIdx ? 'next' : 'later';
      return '<li class="sf-node ' + cls + '"><span class="sf-ico">' + (got ? m[1] : '🔒') + '</span><b>' + m[0] + '</b><small>ngày</small></li>';
    }).join('');
    const pct = nxt ? Math.round(100 * live / nxt[0]) : 100;
    const stage = stageOf(best);
    return '<section class="sf-hero" aria-label="Linh vật và ngọn lửa của em"><div class="sf-stage">' + flame(level) + petHTML(stage) + '<b class="sf-pet-name">' + PET[stage] + '</b></div>' +
      '<div class="sf-info"><h2>' + NAMES[level] + '</h2><p>' + (live ? 'Lửa đang cháy <b>' + live + ' ngày</b> liên tiếp.' : 'Lửa đang ngủ. Luyện một lượt để thắp lại nhé!') + '</p>' +
      (nxt ? '<div class="sf-bar" role="img" aria-label="Đã đi ' + pct + '% tới mốc ' + nxt[0] + ' ngày"><i style="width:' + pct + '%"></i></div><p class="sf-next">Còn <b>' + (nxt[0] - live) + ' ngày</b> nữa để nhận ' + nxt[1] + ' <b>' + nxt[2] + '</b></p>' : '<p class="sf-next">Em đã thắp sáng mọi mốc – tuyệt vời! 🏆</p>') +
      '</div><ol class="sf-track">' + nodes + '</ol>' + petShelf(stage) + '</section>';
  }
  function apply(view) {
    if ((view || currentView) !== 'streak' || document.querySelector('.sf-hero')) return;
    const stage = document.querySelector('.streak-stage'); if (stage) { stage.insertAdjacentHTML('afterend', section()); evolve(stageOf(Math.max(S.bestStreak || 0, S.streak || 0))); }
  }
  AFTER_RENDER.push(apply);
})();
