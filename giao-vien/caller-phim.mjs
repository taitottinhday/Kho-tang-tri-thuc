/* Sân khấu ĐIỆN ẢNH cho trò “Gọi tên” – Claude Code (đợt 20).
   Cùng bộ lệnh với caller-cinema.mjs (enter, travel, winner, prepareShot, fakeShot, scoreShot, stampClue…) nên
   logic chọn tên công bằng của goi-hoc-sinh.js giữ nguyên; chỉ thay phần HÌNH bằng khung phim 3D (assets/phim/goi/)
   chiếu bằng máy chiếu Phim.dung(): máy quay, quay chậm, va chạm, vệt tốc độ, hạt hiệu ứng, thẻ tên bung ra. */

const ANH = '../assets/phim/goi/';
const KEYS = {
  garden: ['ht-1', 'ht-2', 'ht-3', 'ht-4', 'ht-5', 'ht-6', 'ht-7'],
  stadium: ['sut-1', 'sut-2', 'sut-3', 'sut-4', 'sut-5', 'sut-6', 'sut-7'],
  office: ['tt-1', 'tt-2', 'tt-3', 'tt-4', 'tt-5', 'tt-6', 'tt-7']
};
const img = k => ANH + k;
const NEO_DOC = 0.12; // phần ảnh bị cắt: 12% ở mép trên, 88% ở mép dưới
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* Âm thanh giàu hơn (qua-tang-am.js) trên trang giáo viên: mượn công tắc “Âm thanh” của trò chơi */
function amThanh(enabled) {
  if (typeof QuaAm === 'undefined') return null;
  if (!window.getAudioCtx) { let ctx = null; window.getAudioCtx = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)()); }
  if (!window.__goiDb) { window.__goiDb = true; if (typeof window.db === 'undefined') window.db = { settings: { sound: false, sfxVol: 0.85 } }; }
  return (name, delay) => {
    if (!enabled() || !window.db) return;
    window.db.settings.sound = true; QuaAm.begin();
    if (window.Phim) window.Phim.say(name, delay || 0);
  };
}

export function createCinema(host, mode, { gsap, sound }) {
  const play = window.Phim.dung(host);
  const reduced = play.still;
  const soundOn = () => { const box = document.querySelector('#soundToggle'); return !box || box.checked !== false; };
  const boom = amThanh(soundOn) || (() => {});
  const evidence = host.querySelector('.caller-cinema-evidence');
  host.classList.add('use-phim');
  window.Phim.preload(KEYS[mode].map(img));

  const hud = document.createElement('div'); hud.className = 'cp-hud'; play.root.appendChild(hud);
  const el = (cls, html) => { const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const later = (ms, fn) => play.at(reduced ? Math.min(ms, 40) : ms, fn);
  let slow = false, travelCount = 0, shotKey = '';
  host.dataset.phim = mode;

  /* chiếu một khung; flip = lật máy quay trái/phải cho mỗi lượt khác nhau */
  function canh(key, o = {}) {
    shotKey = key; host.dataset.canh = key;
    goTenTrenTranh(); // tên viết trên tranh chỉ thuộc về đúng khung đó
    const shot = Object.assign({ anh: img(key), ms: 5200, tam: [0.5, 0.44], may: [[1.16, 0, 1], [1.03, 0, 0]], ease: 'cubic-bezier(.15,.6,.3,1)' }, o);
    /* khung ngang cắt bớt ảnh 3:2: máy quay phóng nhẹ, không trôi dọc để đầu nhân vật không bị cắt */
    shot.may = shot.may.map(m => { const z = 1 + (m[0] - 1) * 0.5, lech = (z - 1) * 45; return [z, clamp(m[1], -lech, lech), 0]; });
    play.canh(shot);
  }
  const pan = (dir, a = 1.2, b = 1.08) => [[a, 3.5 * dir, 0.5], [b, -3.5 * dir, 0]];

  /* thẻ “đang nhắm” kiểu game: tâm ngắm + tên ứng viên */
  let targetEl = null;
  function ngam(student, label, side) {
    if (targetEl) targetEl.remove();
    const x = side != null ? side : 18 + (student.signature % 5) * 16;
    targetEl = el('cp-target' + (mode === 'office' ? ' is-detective' : ''), '<i class="cp-reticle"><b></b></i><span class="cp-tag"><small>' + esc(label) + '</small><strong>' + esc(student.name) + '</strong></span>');
    targetEl.style.left = clamp(x, 16, 84) + '%';
    hud.appendChild(targetEl);
    const mine = targetEl;
    later(slow ? 1500 : 900, () => { mine.classList.add('out'); later(260, () => mine.remove()); });
  }
  /* thẻ tên bung ra như quà tặng livestream */
  let cardEl = null;
  function theTen(student, small, big, variant) {
    xoaThe();
    cardEl = el('cp-card ' + (variant || ''), '<div class="cp-rays"></div><div class="cp-plate"><small>' + esc(small) + '</small><strong>' + esc(student.name) + '</strong>' + (big ? '<em>' + esc(big) + '</em>' : '') + '</div>');
    cardEl.setAttribute('data-name', student.name);
    hud.appendChild(cardEl);
    play.hieuUng({ k: 'sparks', x: 0.5, y: variant === 'scroll' ? 0.7 : 0.58, n: 80, luc: 1.7 });
    play.hieuUng({ k: 'confetti', n: 70 });
  }
  let surfaceEl = null, surfaceRO = null, nameUntil = 0;
  const giuTen = ms => { nameUntil = Math.max(nameUntil, performance.now() + ms); };
  /* vung = {x,y,w,h} theo tỉ lệ ảnh gốc 3:2 (cuộn chiếu, thẻ hồ sơ). Tính theo đúng cách ảnh phủ khung (cover). */
  function vietLen(student, tren, duoi, vung, kieu) {
    xoaThe();
    surfaceEl = el('cp-surface ' + kieu, '<small>' + esc(tren) + '</small><strong>' + esc(student.name) + '</strong><em>' + esc(duoi) + '</em>');
    surfaceEl.setAttribute('data-name', student.name);
    hud.appendChild(surfaceEl);
    const mine = surfaceEl;
    const dat = () => {
      const W = hud.clientWidth, H = hud.clientHeight; if (!W || !H) return;
      const wide = W / H > 1.5, dw = wide ? W : H * 1.5, dh = wide ? W / 1.5 : H;
      const ox = (W - dw) * 0.5, oy = (H - dh) * NEO_DOC; // khớp object-position trong caller-cinema.css
      let bw = vung.w * dw; const maxW = W * 0.9; if (bw > maxW) bw = maxW;
      /* không để chữ chui xuống dưới khung thoại hay tràn khỏi sân khấu */
      const thoai = document.querySelector('#dialogueBox'), khung = hud.getBoundingClientRect();
      const cao = thoai ? thoai.getBoundingClientRect().height : 0;
      const day = cao ? Math.min(H - 4, thoai.getBoundingClientRect().top - khung.top - 4) : H - 4;
      let tren_ = oy + (vung.y - vung.h / 2) * dh;
      const duoi_ = Math.min(day, oy + (vung.y + vung.h / 2) * dh);
      if (duoi_ - tren_ < 76) tren_ = duoi_ - 76;
      const bh = duoi_ - tren_;
      const cx = Math.min(W - bw / 2 - 4, Math.max(bw / 2 + 4, ox + vung.x * dw));
      mine.style.cssText = 'left:' + cx + 'px;top:' + (tren_ + bh / 2) + 'px;width:' + bw + 'px;height:' + bh + 'px;--h:' + bh + 'px;--w:' + bw + 'px';
      const name = mine.querySelector('strong');
      let size = Math.min(bh * 0.4, bw * 0.17); name.style.fontSize = size + 'px';
      for (let i = 0; i < 14 && (name.scrollWidth > name.clientWidth + 1 || mine.scrollHeight > bh + 2); i++) { size *= 0.9; name.style.fontSize = size + 'px'; }
    };
    dat();
    if (typeof ResizeObserver !== 'undefined') { surfaceRO = new ResizeObserver(dat); surfaceRO.observe(hud); }
    play.hieuUng({ k: 'sparks', x: 0.5, y: vung.y, n: 90, luc: 1.8 });
    play.hieuUng({ k: 'confetti', n: 80 });
  }
  function goTenTrenTranh() { if (surfaceRO) { surfaceRO.disconnect(); surfaceRO = null; } if (surfaceEl) { surfaceEl.remove(); surfaceEl = null; } }
  function xoaThe() { goTenTrenTranh(); if (cardEl) { cardEl.remove(); cardEl = null; } if (targetEl) { targetEl.remove(); targetEl = null; } }

  /* hạt khí quyển riêng cho mỗi trò để cảnh không bao giờ đứng yên */
  const KHONGKHI = {
    garden: [260, fx => { fx.magic(Math.random(), Math.random() * 0.75, 1, ['#fff', '#ffd1e3', '#ffe9a8']); }],
    stadium: [320, fx => { fx.magic(Math.random(), Math.random() * 0.35, 1, ['#fff', '#cfe6ff']); }],
    office: [200, fx => { fx.embers(Math.random(), 0.35 + Math.random() * 0.65, 0.01, 1); }]
  };
  play.khongKhi(KHONGKHI[mode][0], KHONGKHI[mode][1]);

  function chao() {
    if (mode === 'garden') canh('ht-3', { may: [[1.06, 0, 0], [1.16, 2, 0]], ms: 9000 });
    if (mode === 'stadium') canh('sut-2', { may: [[1.18, 0, 2], [1.04, 0, 0]], ms: 9000, tam: [0.5, 0.4] });
    if (mode === 'office') canh('tt-3', { may: [[1.18, -3, 0], [1.05, 2, 0]], ms: 9000 });
  }
  chao();

  return {
    enter() {
      xoaThe();
      if (mode === 'stadium') {
        canh('sut-1', { chu: 'PHẠT ĐỀN!', kieu: 'vang', may: [[1.28, 0, 5], [1.05, 0, 0]], vao: 'zoom', fx: [{ k: 'speed', t: 0, x: 0.5, y: 0.5, dai: 700 }, { k: 'dust', t: 260, x: 0.5, y: 0.86, n: 20 }] });
        sound('whistle'); return;
      }
      if (mode === 'garden') {
        canh('ht-1', { chu: 'HOÀNG TỬ TỚI!', kieu: 'cau-vong', may: pan(1, 1.28, 1.06), vao: 'zoom', fx: [{ k: 'speed', t: 0, ngang: true, dai: 1100 }, { k: 'petals', t: 200, n: 70 }, { k: 'dust', t: 500, x: 0.45, y: 0.88, n: 30 }] });
        sound('fanfare'); boom('ngua'); return;
      }
      canh('tt-1', { chu: 'MỞ VỤ ÁN!', kieu: 'vang', may: [[1.22, 0, 3], [1.04, 0, 0]], vao: 'flash', fx: [{ k: 'magic', t: 200, x: 0.5, y: 0.45, rong: 0.5, dai: 900 }] });
      sound('paper'); boom('whoosh');
    },
    travel(student, decision = false) {
      travelCount++;
      const dir = travelCount % 2 ? 1 : -1;
      if (mode === 'stadium') {
        if (!decision) ngam(student, 'ĐANG NGẮM', 26 + (student.signature % 4) * 16);
        return;
      }
      if (mode === 'garden') {
        if (decision) {
          canh('ht-2', { chu: 'TA CHỌN…', kieu: 'vang', may: [[1.06, 0, 0], [1.24, 0, -2]], vao: 'flash', fx: [{ k: 'speed', t: 0, x: 0.5, y: 0.4, dai: 800 }, { k: 'impact', t: 520, x: 0.5, y: 0.62, mau: '#fff1b0' }, { k: 'dust', t: 520, x: 0.5, y: 0.86, n: 40 }, { k: 'petals', t: 300, n: 50 }] });
          sound('fanfare'); boom('thud'); boom('hoi-hop', 0.15); later(540, () => play.dungHinh(100));
          return;
        }
        const k = travelCount % 3 === 0 ? 'ht-3' : travelCount % 2 ? 'ht-1' : 'ht-3';
        canh(k, { may: pan(dir), vao: 'whip', fx: k === 'ht-1' ? [{ k: 'speed', t: 0, ngang: true, dai: 600 }, { k: 'dust', t: 120, x: 0.46, y: 0.88, n: 18 }] : [] });
        boom('ngua'); sound('hoof');
        later(150, () => ngam(student, 'HOÀNG TỬ DỪNG LẠI Ở', dir > 0 ? 76 : 24));
        return;
      }
      if (decision) {
        xoaThe(); canh('tt-5', { chu: 'MỞ HỒ SƠ…', kieu: 'vang', may: [[1.05, 0, 0], [1.3, 0, 2]], vao: 'flash', fx: [{ k: 'magic', t: 200, x: 0.5, y: 0.55, rong: 0.4, dai: 1000 }, { k: 'impact', t: 640, x: 0.5, y: 0.55, mau: '#ffe9a8' }] });
        sound('paper'); boom('phep'); boom('hoi-hop', 0.1); later(660, () => play.dungHinh(90));
        return;
      }
      const k = ['tt-2', 'tt-4', 'tt-3'][travelCount % 3];
      canh(k, { may: pan(dir, 1.18, 1.1), vao: 'whip' });
      sound('step');
      later(150, () => ngam(student, 'NGHI VẤN', dir > 0 ? 76 : 24));
    },
    turnBack() {
      if (mode !== 'garden') return;
      canh('ht-4', { chu: 'KHOAN ĐÃ!', kieu: 'do', may: [[1.22, -3, 0], [1.05, 3, 0]], vao: 'whip', fx: [{ k: 'speed', t: 0, ngang: true, dai: 700 }, { k: 'dust', t: 60, x: 0.5, y: 0.84, n: 60 }, { k: 'petals', t: 80, n: 60 }, { k: 'impact', t: 240, x: 0.5, y: 0.72, mau: '#ffe2b0' }] });
      sound('swerve'); boom('thud');
    },
    newPrince() {
      xoaThe();
      canh('ht-1', { chu: 'LẠI PHI NGỰA!', kieu: 'cau-vong', may: pan(-1, 1.28, 1.07), vao: 'whip', fx: [{ k: 'speed', t: 0, ngang: true, dai: 900 }, { k: 'dust', t: 300, x: 0.45, y: 0.88, n: 24 }] });
      sound('fanfare'); boom('ngua');
    },
    winner(avatar, student) {
      if (mode !== 'garden' || !student) return 0;
      xoaThe();
      canh('ht-5', { may: [[1.2, 3, 0], [1.05, 0, 0]], vao: 'flash', fx: [{ k: 'petals', t: 80, n: 40 }] });
      boom('whoosh');
      later(720, () => {
        canh('ht-6', { may: [[1, 0, 0], [1, 0, 0]], vao: 'flash', tam: [0.5, 0.5], fx: [{ k: 'magic', t: 80, x: 0.5, y: 0.64, rong: 0.6, dai: 1800 }, { k: 'petals', t: 200, n: 60 }] });
        later(320, () => vietLen(student, 'Hoàng tử mời nàng', 'lên bảng cùng ta!', { x: 0.5, y: 0.585, w: 0.585, h: 0.27 }, 'scroll'));
        sound('chime'); boom('fanfare');
      });
      giuTen(reduced ? 900 : 2900);
      return reduced ? 0 : 2900;
    },
    depart() {
      if (mode !== 'garden' || reduced) return 0;
      return 0;
    },
    prepareShot() {
      xoaThe(); host.classList.remove('has-goal');
      travelCount++;
      canh(travelCount % 2 ? 'sut-3' : 'sut-1', { may: [[1.04, 0, 0], [1.2, 0, 2]], vao: 'whip', tam: [0.5, 0.55] });
      boom('chan'); boom('hoi-hop', 0.1); sound('step');
    },
    fakeShot(trick, onImpact) {
      if (trick === 0) {
        later(380, () => {
          canh('sut-3', { chu: 'ĐỔI CHÂN!', kieu: 'xanh', may: [[1.24, -4, 2], [1.12, 3, 0]], vao: 'whip', fx: [{ k: 'speed', t: 0, ngang: true, dai: 600 }, { k: 'grass', t: 40, x: 0.42, y: 0.86, dai: 360 }] });
          sound('swerve'); onImpact && onImpact();
        });
        return;
      }
      later(380, () => {
        canh('sut-4', { may: [[1.1, 0, 0], [1.26, 0, -2]], vao: 'zoom', tam: [0.5, 0.6], fx: [{ k: 'impact', t: 110, x: 0.55, y: 0.75, mau: '#ffe27a' }, { k: 'grass', t: 110, x: 0.52, y: 0.86, dai: 300 }] });
        sound('kick'); boom('sut');
      });
      later(900, () => {
        if (trick === 1) canh('sut-5', { chu: 'DỘI CỘT!', kieu: 'cam', may: [[1.24, -2, 0], [1.06, 0, 0]], vao: 'whip', fx: [{ k: 'speed', t: 0, ngang: true, dai: 500 }, { k: 'impact', t: 220, x: 0.62, y: 0.34, mau: '#fff', lon: true }] });
        else canh('sut-2', { chu: 'THỦ MÔN!', kieu: 'cam', may: [[1.3, 0, 3], [1.08, 0, 0]], vao: 'whip', fx: [{ k: 'impact', t: 260, x: 0.5, y: 0.5, mau: '#cfe6ff' }] });
        later(220, () => { sound(trick === 1 ? 'post' : 'catch'); onImpact && onImpact(); });
      });
    },
    scoreShot(index, hold = false, student) {
      xoaThe();
      const kickAt = hold ? 240 : 120;
      canh('sut-4', { chu: 'SÚT!!!', kieu: 'do', may: [[1.06, 0, 0], [1.3, 0, -3]], vao: 'zoom', tam: [0.5, 0.62], fx: [{ k: 'speed', t: 0, x: 0.55, y: 0.7, dai: 600 }, { k: 'slow', t: 60, dai: hold ? 420 : 160 }, { k: 'impact', t: kickAt, x: 0.55, y: 0.75, mau: '#ffe27a', lon: true }, { k: 'grass', t: kickAt, x: 0.5, y: 0.86, dai: 300 }] });
      later(kickAt, () => { sound('kick'); boom('sut'); play.dungHinh(110); });
      const goalAt = hold ? 720 : 520;
      later(goalAt, () => {
        host.classList.add('has-goal');
        canh('sut-6', { chu: 'VÀOOOO!', kieu: 'vang to', may: [[1.3, -2, 3], [1.04, 0, 0]], vao: 'flash', tam: [0.55, 0.34], fx: [{ k: 'impact', t: 180, x: 0.66, y: 0.3, mau: '#fff', lon: true }, { k: 'confetti', t: 220 }, { k: 'shake', t: 380, luc: 12, dai: 500 }] });
        sound('goal'); boom('boom'); boom('cheer', 0.1); later(190, () => play.dungHinh(100));
      });
      if (student) { later(goalAt + 430, () => theTen(student, '⚽ BÓNG GỌI TÊN', null, 'gift')); giuTen(reduced ? 900 : goalAt + (hold ? 2100 : 1900)); }
      if (hold) later(goalAt + 1250, () => { canh('sut-7', { may: [[1.18, 0, 2], [1.03, 0, 0]], vao: 'whip', fx: [{ k: 'confetti', t: 40, n: 90 }] }); });
    },
    stampClue(clue) {
      canh(shotKey === 'tt-3' ? 'tt-2' : 'tt-3', { may: [[1.2, 2, 0], [1.08, -2, 0]], vao: 'whip' });
      sound('stamp'); boom('thud');
      const stamp = el('cp-stamp', 'MANH MỐI'); hud.appendChild(stamp);
      play.rung(9, 300);
      later(1100, () => stamp.remove());
      if (!clue || !evidence) return;
      evidence.hidden = false; delete evidence.dataset.state;
      const count = clue.remaining.length;
      evidence.firstElementChild.textContent = 'Còn ' + count + ' hồ sơ';
      evidence.lastElementChild.textContent = count > 1 && count <= 4 ? clue.remaining.map(s => s.name).join(' · ') : '';
      if (gsap && !reduced) gsap.fromTo(evidence, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.34, ease: 'power2.out' });
      else evidence.style.opacity = 1;
    },
    confirmSuspect(student) {
      if (mode !== 'office' || !student) return;
      xoaThe();
      if (evidence) {
        evidence.hidden = false; evidence.dataset.state = 'confirmed';
        evidence.firstElementChild.textContent = 'Đã xác minh'; evidence.lastElementChild.textContent = student.name;
        if (gsap && !reduced) gsap.fromTo(evidence, { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }); else evidence.style.opacity = 1;
      }
      canh('tt-6', { chu: 'TÌM RA RỒI!', kieu: 'do to', may: [[1.34, 0, 2], [1.05, 0, 0]], vao: 'zoom', fx: [{ k: 'speed', t: 0, x: 0.5, y: 0.45, dai: 700 }, { k: 'impact', t: 300, x: 0.5, y: 0.45, mau: '#ffe27a', lon: true }] });
      sound('stamp'); boom('boom'); boom('fanfare', 0.15); later(320, () => play.dungHinh(100));
      later(760, () => {
        canh('tt-7', { may: [[1, 0, 0], [1, 0, 0]], vao: 'zoom', tam: [0.5, 0.5], fx: [{ k: 'magic', t: 100, x: 0.5, y: 0.72, rong: 0.5, dai: 1500 }] });
        later(300, () => vietLen(student, '🔎 Hồ sơ đã mở', 'mời lên bảng!', { x: 0.5, y: 0.73, w: 0.54, h: 0.34 }, 'file'));
        sound('stamp'); boom('thud');
      });
      giuTen(reduced ? 900 : 3000);
    },
    falseClue() {
      canh('tt-4', { chu: 'CÚ LỪA?!', kieu: 'cam', may: [[1.24, -3, 0], [1.06, 2, 0]], vao: 'whip', fx: [{ k: 'impact', t: 220, x: 0.5, y: 0.65, mau: '#b9c6ff' }] });
      sound('swerve'); boom('whoosh');
    },
    nextCase() {
      xoaThe(); if (evidence) { evidence.hidden = true; delete evidence.dataset.state; }
      canh('tt-1', { chu: 'VỤ ÁN TIẾP THEO', kieu: 'vang', may: pan(-1, 1.2, 1.05), vao: 'flash' });
      boom('whoosh');
    },
    /* dọn sân khấu trước lượt mới: huỷ mọi cú diễn còn hẹn giờ, gỡ thẻ tên, trở về cảnh chờ */
    reset() {
      play.huyHen(); play.cham(false); slow = false; travelCount = 0; nameUntil = 0;
      xoaThe(); hud.replaceChildren(); host.classList.remove('has-goal');
      if (evidence) { evidence.hidden = true; delete evidence.dataset.state; }
      chao();
    },
    setSlow(flag) { slow = flag; play.cham(flag); },
    /* còn bao lâu nữa để cả lớp kịp đọc tên trên sân khấu trước khi bảng kết quả che lên */
    revealWait() { return Math.max(0, Math.round(nameUntil - performance.now())); },
    celebrate() {
      play.cham(false);
      play.hieuUng({ k: 'confetti', n: 150 });
      play.hieuUng({ k: 'magic', x: 0.5, y: 0.35, rong: 0.8, dai: 1600 });
      boom('cheer');
    },
    destroy() { play.xoa(); host.classList.remove('use-phim', 'has-goal'); delete host.dataset.phim; delete host.dataset.canh; if (typeof QuaAm !== 'undefined') QuaAm.end(); if (window.__goiDb && window.db && window.db.settings) window.db.settings.sound = false; }
  };
}
