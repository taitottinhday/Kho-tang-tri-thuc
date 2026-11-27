/* Đạo diễn cắt cảnh cho Thám tử chữ và Vườn truyện – Claude Code (đợt 19). Nạp SAU phim.js.
   Trả lời ĐÚNG → chiếu một đoạn phim ngắn toàn màn hình (đúng liền nhiều câu → “LIÊN HOÀN”).
   Câu cuối thắng → đoạn kết dài: cầu thủ sút vào gôn · nhà vua cứu công chúa · Thỏ Lá thoát Sói.
   Trả lời sai không chiếu phim (giữ nguyên phản hồi để bé đọc lại), trừ khi Sói bắt kịp. */
'use strict';
window.PhimTruyen = (() => {
  const S = (anh, ms, chu, more) => Object.assign({ anh, ms, chu }, more);
  /* ---------- Cầu thủ ---------- */
  const B = {
    dan: () => S('bong-1', 1250, 'RÊ BÓNG!', { may: [[1.28, 0, 5], [1.05, 0, 0]], tam: [0.5, 0.52], fx: [{ k: 'speed', t: 60, x: 0.5, y: 0.45, dai: 1100 }, { k: 'grass', t: 200, x: 0.45, y: 0.82, dai: 800 }], am: [[80, 'chan']] }),
    dao: () => S('bong-2', 1250, 'ĐẢO CHÂN!', { may: [[1.06, 4, 0], [1.22, -4, 0]], tam: [0.5, 0.62], vao: 'whip', fx: [{ k: 'speed', t: 0, ngang: true, dai: 700 }, { k: 'impact', t: 520, x: 0.55, y: 0.75, mau: '#7dffd0' }], am: [[80, 'chan'], [520, 'sut']] }),
    qua: () => S('bong-3', 1400, 'QUA NGƯỜI!', { may: [[1.22, -3, 2], [1.03, 2, 0]], tam: [0.52, 0.5], vao: 'whip', kieu: 'xanh', fx: [{ k: 'speed', t: 0, ngang: true, dai: 1200 }, { k: 'slow', t: 300, dai: 520 }, { k: 'grass', t: 100, x: 0.62, y: 0.78, dai: 900 }, { k: 'impact', t: 330, x: 0.6, y: 0.66, mau: '#fff' }], am: [[0, 'whoosh'], [330, 'thud'], [700, 'cheer']] }),
    sut: () => S('bong-4', 1500, 'SÚT!!!', { may: [[1.04, 0, 0], [1.3, 0, -4]], tam: [0.5, 0.66], vao: 'zoom', kieu: 'do', ease: 'cubic-bezier(.6,0,.9,.6)', fx: [{ k: 'speed', t: 0, x: 0.5, y: 0.68, dai: 900 }, { k: 'slow', t: 250, dai: 650 }, { k: 'impact', t: 900, x: 0.52, y: 0.72, mau: '#ffe27a', lon: true }, { k: 'grass', t: 900, x: 0.5, y: 0.84, dai: 500 }], am: [[900, 'sut']] }),
    ghi: () => S('bong-5', 1900, 'VÀOOOOO!', { may: [[1.35, 0, 6], [1.04, 0, 0]], tam: [0.55, 0.34], vao: 'flash', kieu: 'vang to', fx: [{ k: 'impact', t: 420, x: 0.68, y: 0.3, mau: '#fff', lon: true }, { k: 'confetti', t: 520 }, { k: 'shake', t: 800, luc: 14, dai: 800 }], am: [[420, 'boom'], [480, 'cheer'], [900, 'whistle']] }),
    mung: () => S('bong-6', 2300, 'CHIẾN THẮNG!', { may: [[1.2, -3, 0], [1.03, 1, 0]], tam: [0.5, 0.52], vao: 'whip', kieu: 'cau-vong to', fx: [{ k: 'confetti', t: 100, n: 130 }, { k: 'magic', t: 300, x: 0.5, y: 0.4, rong: 0.8, dai: 1500 }], am: [[0, 'fanfare'], [200, 'cheer']] })
  };
  /* ---------- Nhà vua ---------- */
  const V = {
    phi: () => S('vua-1', 1350, 'XUNG PHONG!', { may: [[1.25, 3, 2], [1.04, -2, 0]], tam: [0.52, 0.46], kieu: 'vang', fx: [{ k: 'speed', t: 40, ngang: true, dai: 1200 }, { k: 'dust', t: 250, x: 0.45, y: 0.82, n: 40 }, { k: 'dust', t: 700, x: 0.55, y: 0.83, n: 40 }, { k: 'embers', t: 0, dai: 1200 }], am: [[0, 'ngua']] }),
    do: () => S('vua-2', 1500, 'KHIÊN VÀNG!', { may: [[1.05, 0, 0], [1.24, 0, 0]], tam: [0.5, 0.46], vao: 'zoom', kieu: 'vang', fx: [{ k: 'speed', t: 0, x: 0.5, y: 0.46, dai: 600 }, { k: 'impact', t: 430, x: 0.5, y: 0.47, mau: '#ffd54a', lon: true }, { k: 'slow', t: 480, dai: 600 }, { k: 'magic', t: 500, x: 0.5, y: 0.47, mau: ['#ffe27a', '#fff'], dai: 700 }], am: [[430, 'khien']] }),
    phan: () => S('vua-3', 1650, 'PHẢN CÔNG!', { may: [[1.22, -3, 0], [1.04, 3, 0]], tam: [0.5, 0.48], vao: 'whip', kieu: 'do', fx: [{ k: 'speed', t: 0, ngang: true, dai: 800 }, { k: 'impact', t: 380, x: 0.55, y: 0.45, mau: '#fff0a0', lon: true }, { k: 'magic', t: 420, x: 0.65, y: 0.45, mau: ['#c9a6ff', '#ffe27a'], dai: 1100 }], am: [[360, 'kiem'], [700, 'phep']] }),
    cong: () => S('vua-4', 1750, 'CỔNG SAO MỞ RA!', { may: [[1.0, 0, 0], [1.26, 0, 3]], tam: [0.5, 0.42], vao: 'flash', kieu: 'cau-vong', ease: 'ease-in', fx: [{ k: 'magic', t: 100, x: 0.5, y: 0.4, rong: 0.6, dai: 1500 }, { k: 'embers', t: 0, dai: 1600 }, { k: 'shake', t: 200, luc: 7, dai: 900 }, { k: 'impact', t: 1250, x: 0.5, y: 0.42, mau: '#fff' }], am: [[150, 'phep'], [1250, 'boom']] }),
    cuu: () => S('vua-5', 2500, 'CỨU ĐƯỢC CÔNG CHÚA!', { may: [[1.22, 0, 3], [1.03, 0, 0]], tam: [0.5, 0.46], vao: 'flash', kieu: 'hong to', fx: [{ k: 'petals', t: 100, n: 90 }, { k: 'magic', t: 300, x: 0.5, y: 0.4, rong: 0.7, dai: 1700 }, { k: 'confetti', t: 900, n: 60 }], am: [[0, 'fanfare'], [500, 'cheer']] })
  };
  /* ---------- Thỏ Lá ---------- */
  const T = {
    nhay: () => S('tho-1', 1500, 'BẬT NHẢY!', { may: [[1.24, -3, 3], [1.04, 2, -1]], tam: [0.48, 0.42], kieu: 'xanh', fx: [{ k: 'speed', t: 0, ngang: true, dai: 1200 }, { k: 'leaves', t: 150, n: 40 }, { k: 'slow', t: 380, dai: 550 }, { k: 'dust', t: 80, x: 0.4, y: 0.8, n: 22 }], am: [[0, 'whoosh'], [900, 'thud']] }),
    lach: () => S('tho-2', 1550, 'LÁCH QUA!', { may: [[1.05, 3, 0], [1.2, -3, 0]], tam: [0.5, 0.56], vao: 'whip', kieu: 'xanh', fx: [{ k: 'speed', t: 0, ngang: true, dai: 900 }, { k: 'splash', t: 620, x: 0.62, y: 0.74, n: 80 }, { k: 'impact', t: 640, x: 0.62, y: 0.68, mau: '#d9b38c' }], am: [[0, 'whoosh'], [620, 'splash']] }),
    thoat: () => S('tho-3', 2500, 'THOÁT RỒI!', { may: [[1.22, 0, 2], [1.03, 0, 0]], tam: [0.5, 0.46], vao: 'flash', kieu: 'vang to', fx: [{ k: 'confetti', t: 120 }, { k: 'magic', t: 300, x: 0.5, y: 0.4, rong: 0.8, dai: 1600 }, { k: 'leaves', t: 200, n: 30 }], am: [[0, 'fanfare'], [300, 'cheer']] }),
    bat: () => S('tho-4', 2100, 'ÔI, SÓI CHẶN ĐƯỜNG!', { may: [[1.0, 0, 0], [1.18, 0, 0]], tam: [0.5, 0.48], vao: 'zoom', kieu: 'cam', fx: [{ k: 'impact', t: 380, x: 0.5, y: 0.45, mau: '#ffb27a' }], am: [[380, 'thud']] })
  };

  const KICH = {
    football: { thuong: [() => [B.dan(), B.dao()], () => [B.dao(), B.qua()], () => [B.dan(), B.qua()]], ket: () => [B.qua(), B.sut(), B.ghi(), B.mung()] },
    royal: { thuong: [() => [V.phi(), V.do()], () => [V.do(), V.phan()], () => [V.phi(), V.phan()]], ket: () => [V.phan(), V.cong(), V.cuu()] },
    rabbit: { thuong: [() => [T.nhay()], () => [T.lach()], () => [T.nhay(), T.lach()]], ket: () => [T.lach(), T.thoat()], thua: () => [T.bat()] }
  };
  const ANH = { football: ['bong-1', 'bong-2', 'bong-3', 'bong-4', 'bong-5', 'bong-6'], royal: ['vua-1', 'vua-2', 'vua-3', 'vua-4', 'vua-5'], rabbit: ['tho-1', 'tho-2', 'tho-3', 'tho-4'] };

  /* Chốt truyện thuộc tuyến nào */
  const routeOfStory = id => /^island/.test(id) ? 'football' : /^royal/.test(id) ? 'royal' : 'rabbit';
  function routeOf(q) {
    if (!q) return '';
    if (q.race) return 'rabbit';
    if (q.journey) return q.journey.mode.id;
    if (q.kind === 'storybook') return routeOfStory(String(q.storyId || ''));
    return '';
  }
  function isStoryFinale(q) { // câu cuối của chương CUỐI trong tuyến (cầu thủ, nhà vua, thỏ)
    if (typeof STORY_ROUTES === 'undefined') return false;
    for (const route of STORY_ROUTES) {
      const i = route.chapters.findIndex(c => c.id === q.storyId);
      if (i >= 0) return i === route.chapters.length - 1 && q.i >= route.chapters[i].scenes.length - 1;
    }
    return false;
  }
  function streak(q) { let n = 0; for (let i = q.log.length - 1; i >= 0 && q.log[i].right; i--) n++; return n; }

  function plan(q, right) {
    const route = routeOf(q), k = KICH[route];
    if (!k) return null;
    if (q.race && q.race.caught) return { route, shots: k.thua() };
    if (!right) return null;
    const win = (q.journey && q.journey.justWon) || (q.race && q.race.escaped) || (q.kind === 'storybook' && isStoryFinale(q));
    if (win) return { route, shots: k.ket(), finale: true };
    q.phimLuot = q.phimLuot == null ? 0 : q.phimLuot + 1;
    return { route, shots: k.thuong[q.phimLuot % k.thuong.length]() };
  }
  function sauTraLoi(q, right) {
    if (typeof Phim === 'undefined') return null;
    const p = plan(q, right); if (!p) return null;
    const cont = document.getElementById('plCont');
    return Phim.play(p.shots, { theo: cont, combo: right ? streak(q) : 0, nhan: p.shots[p.shots.length - 1].chu, xong: () => { const b = document.getElementById('plCont'); if (b && b === cont && !b.disabled) b.focus({ preventScroll: true }); } });
  }
  /* tải trước ảnh khi bắt đầu lượt chơi để phim chiếu ngay */
  function chuanBi(q) { const r = routeOf(q); if (r && ANH[r] && typeof Phim !== 'undefined') Phim.preload(ANH[r]); }
  return { sauTraLoi, chuanBi, plan, routeOf, ANH };
})();
