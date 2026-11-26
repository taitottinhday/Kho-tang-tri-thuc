/* Chuỗi học và tủ đồ của bạn đồng hành. */
'use strict';
const StreakRoom = (() => {
  const outfits = [
    [3,'🎀','Nơ đào','#ed98b3'], [10,'🧣','Khăn phiêu lưu','#45b6a4'], [15,'🎧','Tai nghe học chữ','#8277dc'],
    [30,'🎓','Mũ học giả','#4b71b4'], [50,'🌸','Vòng hoa','#e978a5'], [100,'👑','Vương miện','#f0ac45'],
    [200,'✨','Áo choàng sao','#8175e2'], [365,'🏆','Cúp Quanh Mặt Trời','#e29443']
  ];
  function yesterday() { const date = new Date(); date.setDate(date.getDate() - 1); return dayKey(date); }
  function live(p = S) { return p.lastDay === dayKey() || p.lastDay === yesterday() ? Math.max(0,p.streak) : 0; }
  function best(p = S) { return Math.max(p.bestStreak || 0,p.streak || 0); }
  function reached() { return outfits.filter(([n]) => n <= best()); }
  function award() {
    const before = best();
    bumpDay();
    const now = best();
    return outfits.filter(([n]) => n > before && n <= now);
  }
  function celebrate(prizes) {
    return prizes.map(([,icon,name]) => '<div class="unlock-note streak-unlock">' + icon + ' Đã mở <b>' + esc(name) + '</b> trong Tủ đồ <button class="soft-btn sm" data-view="streak">Xem quà</button></div>').join('');
  }
  function page() {
    const owns = reached(), current = live(), max = best();
    const next = outfits.find(([n]) => n > max);
    const equipped = owns.find(([n]) => n === S.streakOutfit);
    return pageHeading('BẠN ĐỒNG HÀNH','Chuỗi lửa và tủ đồ','Hoàn thành một lượt luyện mỗi ngày để nối chuỗi và mở trang phục.') +
      '<section class="streak-stage"><div class="streak-pet" style="--costume:' + (equipped?.[3] || '#f2b670') +
      '"><span class="streak-mascot" aria-hidden="true">' + S.avatar + '</span><span class="streak-costume">' + (equipped?.[1] || '') +
      '</span></div><div><h2>🔥 ' + current + ' ngày liên tiếp</h2><p>Dài nhất: <b>' + max + ' ngày</b></p>' +
      (next ? '<p>Mốc tiếp theo: <b>' + next[0] + ' ngày · ' + next[2] + '</b></p><progress max="' +
        next[0] + '" value="' + Math.min(current,next[0]) + '" aria-label="Tiến độ đến mốc">' + current + '</progress>' : '<p>Em đã mở tất cả các trang phục!</p>') +
      '<p>' + (S.lastDay === dayKey() ? 'Em đã giữ lửa hôm nay!' : 'Luyện một lượt hôm nay để giữ lửa.') + '</p><button class="primary-btn" data-view="practice">Luyện ngay</button></div></section>' +
      '<section class="wardrobe" aria-label="Trang phục">' + outfits.map(([n,icon,name,color]) => {
        const unlocked = owns.some(([days]) => days === n);
        return '<article class="outfit-card" style="--costume:' + color + '"><span aria-hidden="true">' + icon + '</span><b>' + name +
          '</b><p>' + n + ' ngày liên tiếp</p><button class="soft-btn" data-outfit="' + n + '"' + (unlocked ? '' : ' disabled') + '>' +
          (unlocked ? equipped?.[0] === n ? 'Đang dùng · Bỏ' : 'Mặc thử' : 'Chưa mở') + '</button></article>';
      }).join('') + '</section>';
  }
  function bind() {
    $$('[data-outfit]').forEach(b => b.onclick = () => {
      const n = Number(b.dataset.outfit);
      if (!reached().some(([days]) => days === n)) return;
      S.streakOutfit = S.streakOutfit === n ? 0 : n;
      save(); render();
      $('[data-outfit="' + n + '"]')?.focus();
    });
  }
  function decorate() {
    const fire = $('#streakCount')?.parentElement;
    if (!fire) return;
    fire.dataset.fireLevel = String(Math.min(4,outfits.filter(([n]) => live() >= n).length));
    const costume = reached().find(([n]) => n === S.streakOutfit)?.[1] || '';
    const a = $('.profile-button .avatar');
    a.dataset.costume = costume;
  }
  return { live, award, celebrate, page, bind, decorate };
})();
registerView('streak','Chuỗi lửa',StreakRoom.page,StreakRoom.bind);
AFTER_RENDER.push(StreakRoom.decorate);
