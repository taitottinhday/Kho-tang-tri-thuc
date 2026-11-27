/* Máy chiếu cắt cảnh điện ảnh – Claude Code (đợt 19). Nạp SAU qua-tang-am.js, qua-tang-fx.js.
   Mỗi “cảnh” là một khung phim vẽ trọn (assets/phim/*.webp, dựng dọc như TikTok). Máy chiếu làm cho khung tĩnh “sống”:
     • máy quay đẩy/lia + hai lớp chiều sâu (tiền cảnh tiến nhanh hơn hậu cảnh),
     • chuyển cảnh vút ngang / loé sáng, vệt tốc độ kiểu hoạt hình, quay chậm,
     • khoảnh khắc va chạm: dừng hình 90ms, loé trắng, viền lệch màu, rung màn, vòng xung kích,
     • hạt cỏ, bụi, tia lửa, cánh hoa, pháo giấy, âm thanh (QuaAm), chữ hô to và bộ đếm liên hoàn.
   Phim.play(canh, {combo, nhan, xong}) → trả về Promise khi chiếu xong hoặc bị bỏ qua.
   “Giảm chuyển động” → chỉ hiện khung cuối đứng yên, không rung, không loé, không tiếng. */
'use strict';
const Phim = (() => {
  const DIR = 'assets/phim/';
  const cache = new Map();
  const src = k => k.includes('/') ? k + '.webp' : DIR + k + '.webp';
  function load(k) {
    if (!cache.has(k)) { const i = new Image(); i.src = src(k); cache.set(k, (i.decode ? i.decode() : Promise.resolve()).then(() => i, () => null)); }
    return cache.get(k);
  }
  const preload = keys => keys.forEach(load);
  const calm = () => document.body.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const el = (cls, html) => { const e = document.createElement('div'); e.className = cls; if (html != null) e.innerHTML = html; return e; };
  /* âm thanh riêng cho trận đấu (ghép từ QuaAm) */
  function say(name, t) {
    if (typeof QuaAm === 'undefined') return;
    const S = QuaAm;
    if (name === 'sut') { S.thud(0, 1); S.whoosh(0.03, true); }
    /* hồi hộp: tim đập dồn dần + âm cao dần, tắt hẳn ngay trước lúc công bố để cả lớp “nín thở” */
    else if (name === 'hoi-hop') { [0, 0.34, 0.62, 0.84].forEach((d, i) => { S.thud(d, 0.24 + i * 0.07); S.thud(d + 0.11, 0.14 + i * 0.04); }); S.tone(180, 0, 0.9, 'triangle', 0.07, 920); }
    else if (name === 'kiem') { S.tone(2400, 0, 0.35, 'square', 0.05, 900); S.tone(3150, 0.01, 0.6, 'triangle', 0.14, 2600); S.thud(0, 0.7); }
    else if (name === 'khien') { S.tone(520, 0, 0.5, 'square', 0.08, 380); S.tone(1560, 0, 0.55, 'triangle', 0.12); S.thud(0, 0.9); }
    else if (name === 'phep') { S.sparkle(0, 20); S.whoosh(0, true); }
    else if (name === 'chan') { for (let i = 0; i < 6; i++) S.thud(i * 0.12, 0.22); }
    else if (name === 'ngua') { for (let i = 0; i < 9; i++) S.thud(i * 0.14 + (i % 3 === 2 ? 0.04 : 0), 0.26); }
    else if (S[name]) S[name](t || 0);
  }

  let live = null;
  function stop() {
    if (!live) return;
    const cur = live; live = null;
    if (cur.watch) cur.watch.disconnect();
    cur.timers.forEach(clearTimeout); cur.anims.forEach(a => { try { a.cancel(); } catch (e) {} }); cur.fx.stop();
    if (typeof QuaAm !== 'undefined' && QuaAm.end) QuaAm.end();
    try { cur.dlg.close(); } catch (e) {}
    cur.dlg.remove(); cur.done();
  }

  /* Phần chiếu dùng chung cho hộp toàn màn hình (play) và khung nhúng (dung). */
  function mayChieu({ dlg, world, stage, over, caption, still, at, anim, fx }) {
    const cur = { fx };
    function shake(power, ms) { if (still) return; const f = []; for (let i = 0; i < 12; i++) { const k = 1 - i / 12; f.push({ transform: 'translate(' + (Math.random() * 2 - 1) * power * k + 'px,' + (Math.random() * 2 - 1) * power * k + 'px) rotate(' + (Math.random() * 2 - 1) * k * power / 22 + 'deg)' }); } f.push({ transform: 'none' }); anim(world, f, { duration: ms || 500, fill: 'none' }); }
    function impact(x, y, color, big) {
      const flash = el('ph-flash'); over.appendChild(flash); anim(flash, [{ opacity: big ? 0.72 : 0.5 }, { opacity: 0 }], { duration: big ? 420 : 260 });
      stage.classList.add('chroma'); at(big ? 260 : 150, () => stage.classList.remove('chroma'));
      shake(big ? 26 : 14, big ? 700 : 420);
      cur.fx.ring(x, y, color || '#fff', big ? 20 : 12); at(90, () => cur.fx.ring(x, y, '#ffe27a', big ? 14 : 8));
      cur.fx.sparks(x, y, big ? 90 : 46, ['#fff', '#fff6c4', color || '#ffd54a'], big ? 1.9 : 1.3);
      const burst = el('ph-burst'); burst.style.left = x * 100 + '%'; burst.style.top = y * 100 + '%'; burst.style.setProperty('--c', color || '#fff2a0'); over.appendChild(burst);
      anim(burst, [{ opacity: 1, transform: 'translate(-50%,-50%) scale(.15) rotate(0)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(' + (big ? 1.7 : 1.15) + ') rotate(14deg)' }], { duration: big ? 620 : 420, easing: 'cubic-bezier(.1,.7,.3,1)' });
    }
    const EFFECT = {
      impact: e => impact(e.x, e.y, e.mau, e.lon),
      speed: e => { const s = el('ph-speed' + (e.ngang ? ' ngang' : '')); s.style.setProperty('--fx', (e.x == null ? 0.5 : e.x) * 100 + '%'); s.style.setProperty('--fy', (e.y == null ? 0.5 : e.y) * 100 + '%'); over.appendChild(s); anim(s, [{ opacity: 0 }, { opacity: 1, offset: 0.18 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: e.dai || 900 }); at((e.dai || 900) + 60, () => s.remove()); },
      cube: () => {},
      grass: e => cur.fx.every(45, () => { for (let i = 0; i < 4; i++) cur.fx.dust(e.x + (Math.random() - 0.5) * 0.2, e.y, 1); cur.fx.sparks(e.x, e.y, 3, ['#7ee06a', '#c9f76a', '#eaffd0'], 1.1); }, e.dai || 600),
      dust: e => cur.fx.dust(e.x, e.y, e.n || 26),
      sparks: e => cur.fx.sparks(e.x, e.y, e.n || 50, e.mau ? [e.mau, '#fff'] : null, e.luc || 1.4),
      magic: e => cur.fx.every(60, () => cur.fx.magic(e.x + (Math.random() - 0.5) * (e.rong || 0.4), e.y + (Math.random() - 0.5) * 0.25, 3, e.mau), e.dai || 900),
      embers: e => cur.fx.every(70, () => cur.fx.embers(Math.random(), 1.02, 0.03, 2), e.dai || 1600),
      splash: e => cur.fx.splash(e.x, e.y, e.n || 60),
      petals: e => cur.fx.rain(e.n || 60, ['#ff9ec0', '#ffc2d6', '#fff1f6', '#ffd23f']),
      leaves: e => cur.fx.rain(e.n || 46, ['#7ccf4f', '#b9e769', '#4faa3a', '#ffd23f']),
      confetti: e => { cur.fx.confetti(0.1, 0.95, 70, 1.35); cur.fx.confetti(0.9, 0.95, 70, 1.35); cur.fx.rain(e.n || 90); },
      shake: e => shake(e.luc || 12, e.dai || 500),
      slow: e => { dlg.classList.add('slow'); cur.anims.forEach(a => { try { a.updatePlaybackRate ? a.updatePlaybackRate(0.38) : (a.playbackRate = 0.38); } catch (x) {} }); at(e.dai || 700, () => { dlg.classList.remove('slow'); cur.anims.forEach(a => { try { a.updatePlaybackRate ? a.updatePlaybackRate(1) : (a.playbackRate = 1); } catch (x) {} }); }); }
    };

    function showShot(s, index) {
      const prev = stage.querySelector('.ph-shot.on');
      const node = el('ph-shot on');
      const focus = s.tam || [0.5, 0.48];
      node.style.setProperty('--tx', focus[0] * 100 + '%'); node.style.setProperty('--ty', focus[1] * 100 + '%');
      node.innerHTML = '<img class="base" src="' + src(s.anh) + '" alt=""><img class="depth" src="' + src(s.anh) + '" alt="">';
      stage.appendChild(node);
      const back = dlg.querySelector('.ph-back'); if (back) back.style.backgroundImage = 'linear-gradient(rgba(3,4,12,.45),rgba(3,4,12,.62)),url("' + src(s.anh) + '")';
      const [from, to] = s.may || [[1.18, 0, 0], [1.04, 0, 0]];
      const T = (m, k) => 'translate(' + m[1] * k + '%,' + m[2] * k + '%) scale(' + (1 + (m[0] - 1) * k) + ')';
      if (!still) {
        const ease = s.ease || 'cubic-bezier(.18,.7,.25,1)';
        anim(node.querySelector('.base'), [{ transform: T(from, 1) }, { transform: T(to, 1) }], { duration: s.ms + 300, easing: ease });
        anim(node.querySelector('.depth'), [{ transform: T(from, 1.03) }, { transform: T(to, 1.09) }], { duration: s.ms + 300, easing: ease });
        const way = s.vao || (index ? 'whip' : 'zoom');
        if (way === 'whip') anim(node, [{ transform: 'translateX(70%)', filter: 'blur(18px)' }, { transform: 'translateX(0)', filter: 'blur(0px)' }], { duration: 250, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'none' });
        else if (way === 'zoom') anim(node, [{ transform: 'scale(1.5)', filter: 'blur(12px) brightness(1.8)' }, { transform: 'scale(1)', filter: 'blur(0px) brightness(1)' }], { duration: 330, easing: 'ease-out', fill: 'none' });
        else { anim(node, [{ opacity: 0, filter: 'brightness(3)' }, { opacity: 1, filter: 'brightness(1)' }], { duration: 300, fill: 'none' }); }
        say('whoosh');
      }
      if (prev) at(280, () => prev.remove());
      dlg.querySelectorAll('.ph-bars i').forEach((bar, i) => { bar.classList.toggle('done', i < index); });
      const fill = dlg.querySelectorAll('.ph-bars b')[index]; if (fill && !still) anim(fill, [{ width: '0%' }, { width: '100%' }], { duration: s.ms, easing: 'linear' });
      caption.textContent = '';
      if (s.chu) {
        const word = el('ph-word ' + (s.kieu || ''), ''); word.textContent = s.chu; caption.appendChild(word);
        if (!still) anim(word, [{ opacity: 0, transform: 'scale(2.1) skewX(-12deg)' }, { opacity: 1, transform: 'scale(.93) skewX(-8deg)', offset: 0.22 }, { opacity: 1, transform: 'scale(1.03) skewX(-8deg)' }], { duration: 560, delay: s.chuSau || 160, easing: 'ease-out', fill: 'both' });
      }
      if (!still) {
        (s.fx || []).forEach(e => at(e.t || 0, () => EFFECT[e.k] && EFFECT[e.k](e)));
        (s.am || []).forEach(a => at(a[0], () => say(a[1])));
      }
    }

    return { showShot, shake, impact, EFFECT };
  }

  /* Chiếu NGAY TRONG một khung (vd. sân khấu “Gọi tên”): người gọi tự quyết lúc đổi cảnh.
     Trả về { canh(s), hieuUng(e), cham(ms/co), rung(), xoa() }; s.ms = thời gian máy quay trôi. */
  function dung(host, opts = {}) {
    const still = opts.still != null ? opts.still : calm();
    const root = el('phim phim-nhung' + (still ? ' phim-still' : ''));
    root.innerHTML = '<div class="ph-frame"><div class="ph-world" aria-hidden="true"><div class="ph-shots"></div><canvas></canvas><div class="ph-over"></div></div><div class="ph-caption"></div></div>';
    host.appendChild(root);
    const timers = new Set(), anims = new Set();
    let alive = true, count = 0, stopAmbient = null;
    const fx = QuaFx.create(root.querySelector('canvas'));
    const at = (ms, fn) => { const t = setTimeout(() => { timers.delete(t); if (alive) { try { fn(); } catch (e) { console.warn(e); } } }, ms); timers.add(t); return t; };
    const anim = (node, frames, o) => { if (!node.animate) return null; const a = node.animate(frames, Object.assign({ fill: 'forwards' }, o)); anims.add(a); if (anims.size > 60) { const first = anims.values().next().value; anims.delete(first); } return a; };
    const may = mayChieu({ dlg: root, world: root.querySelector('.ph-world'), stage: root.querySelector('.ph-shots'), over: root.querySelector('.ph-over'), caption: root.querySelector('.ph-caption'), still, at, anim, fx });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => fx.size());
    if (ro) ro.observe(root);
    return {
      root, still, at,
      canh(s) { if (!alive) return; fx.size(); root.classList.add('ph-on'); may.showShot(Object.assign({ ms: 6000 }, s), count++); },
      hieuUng(e) { if (alive && !still && may.EFFECT[e.k]) may.EFFECT[e.k](e); },
      rung(luc, dai) { if (alive && !still) may.shake(luc, dai); },
      khongKhi(ms, fn) { if (stopAmbient) stopAmbient(); stopAmbient = !still && fn ? fx.every(ms, () => fn(fx)) : null; },
      huyHen() { timers.forEach(clearTimeout); timers.clear(); },
      /* khựng hình vài chục mili-giây đúng lúc va chạm (hit-stop) rồi chạy tiếp */
      dungHinh(ms) {
        if (!alive || still) return;
        const dang = Array.from(anims).filter(a => a.playState === 'running');
        dang.forEach(a => a.pause());
        at(ms || 90, () => dang.forEach(a => { if (a.playState === 'paused') a.play(); }));
      },
      cham(on) { if (!alive) return; root.classList.toggle('slow', !!on); anims.forEach(a => { try { a.updatePlaybackRate ? a.updatePlaybackRate(on ? 0.42 : 1) : (a.playbackRate = on ? 0.42 : 1); } catch (e) {} }); },
      xoa() { if (!alive) return; alive = false; timers.forEach(clearTimeout); timers.clear(); anims.forEach(a => { try { a.cancel(); } catch (e) {} }); if (ro) ro.disconnect(); fx.stop(); root.remove(); }
    };
  }

  async function play(shots, opts = {}) {
    shots = (shots || []).filter(Boolean);
    if (!shots.length || typeof HTMLDialogElement === 'undefined' || typeof QuaFx === 'undefined') return;
    stop();
    const still = calm();
    if (!still && typeof QuaAm !== 'undefined' && QuaAm.begin) QuaAm.begin();
    const dlg = document.createElement('dialog');
    dlg.className = 'phim' + (still ? ' phim-still' : '');
    dlg.setAttribute('aria-label', 'Đoạn phim: ' + (opts.nhan || shots[shots.length - 1].chu || 'hành động'));
    dlg.innerHTML = '<div class="ph-back" aria-hidden="true"></div><div class="ph-frame"><div class="ph-world" aria-hidden="true"><div class="ph-shots"></div><canvas></canvas><div class="ph-over"></div></div>' +
      '<div class="ph-bars" aria-hidden="true">' + shots.map(() => '<i><b></b></i>').join('') + '</div>' +
      (opts.combo > 1 ? '<div class="ph-combo" aria-hidden="true"><small>LIÊN HOÀN</small><b>x' + (opts.combo | 0) + '</b></div>' : '') +
      '<div class="ph-caption" role="status" aria-live="polite"></div></div>' +
      '<button type="button" class="ph-skip">Bỏ qua ⏭</button>';
    document.body.appendChild(dlg);
    dlg.showModal();
    let resolve; const finished = new Promise(r => { resolve = r; });
    const cur = live = { dlg, timers: [], anims: [], fx: null, done: () => { resolve(); if (opts.xong) opts.xong(); } };
    const world = dlg.querySelector('.ph-world'), stage = dlg.querySelector('.ph-shots'), over = dlg.querySelector('.ph-over'), caption = dlg.querySelector('.ph-caption');
    cur.fx = QuaFx.create(dlg.querySelector('canvas'));
    // Màn bên dưới đổi (bấm tiếp, thoát bài, đổi trang) → đóng phim ngay, không nằm đè và không giành lại con trỏ về sau
    if (opts.theo) { cur.watch = new MutationObserver(() => { if (!opts.theo.isConnected) stop(); }); cur.watch.observe(document.body, { childList: true, subtree: true }); }
    dlg.addEventListener('cancel', e => { e.preventDefault(); stop(); });
    dlg.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); stop(); } });
    const skip = dlg.querySelector('.ph-skip'); skip.onclick = stop; skip.focus({ preventScroll: true });
    const at = (ms, fn) => cur.timers.push(setTimeout(() => { if (live === cur) { try { fn(); } catch (e) { console.warn(e); } } }, ms));
    const anim = (node, frames, o) => { if (!node.animate) return null; const a = node.animate(frames, Object.assign({ fill: 'forwards' }, o)); cur.anims.push(a); return a; };

    await Promise.race([Promise.all(shots.map(s => load(s.anh))), new Promise(r => setTimeout(r, 2500))]);
    if (live !== cur) return finished;
    cur.fx.size(); dlg.classList.add('ph-on');

    const may = mayChieu({ dlg, world, stage, over, caption, still, at, anim, fx: cur.fx });
    const showShot = may.showShot;
    if (still) {
      showShot(shots[shots.length - 1], shots.length - 1);
      cur.fx.freeze(); at(2200, stop);
    } else {
      let t = 0;
      shots.forEach((s, i) => { at(t, () => showShot(s, i)); t += s.ms; });
      at(t + 180, stop);
    }
    return finished;
  }

  addEventListener('popstate', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  return { play, dung, stop, preload, say, isPlaying: () => !!live };
})();

// module (trang giáo viên) đọc qua window
window.Phim = Phim;
