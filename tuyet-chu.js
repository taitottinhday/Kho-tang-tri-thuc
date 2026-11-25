/* Trò chơi “Hứng tuyết chữ” – Claude Code (đợt 12). Nạp SAU app.js (dùng poolItems, itemWord, wrongWords, record…).
   Tham khảo các trò hứng chữ rơi cho thiếu nhi (SpellingCity Letterfall, ABCmouse Letter Catch, Word Catch):
   chữ rơi từ trên xuống, chạm đúng được điểm, đúng liên tiếp có chuỗi 🔥, có “bình phép” làm chữ rơi chậm lại.
   Ở đây: câu có chỗ trống hiện trên cùng; mỗi bông tuyết mang một cách viết; bé chạm bông tuyết viết ĐÚNG.
   - Chạm nhầm: mất 1 💝 (có 3), câu đó vào sổ “Ôn lại từ sai”.
   - Bông tuyết đúng rơi chạm đất thì bay lên lại – không bị phạt (bé nhỏ không bị áp lực).
   - 🌟 Sao băng giá: chạm vào thì tuyết rơi chậm 6 giây.
   - 60 giây; “Giảm chuyển động” → tuyết rơi chậm hơn, không lắc lư. */
'use strict';
(function () {
  const SC_TIME = 60, SC_LIVES = 3;
  let G = null; // trạng thái ván đang chơi

  function scPool() {
    return shuffle(poolItems(b => b.loai === 'chon')).filter(it => {
      if (!it.de || !it.de.includes('___')) return false;
      const w = itemWord(it), wrong = wrongWords(it);
      return w && [...w].length <= 16 && wrong.length && wrong.every(x => x && x !== w && [...x].length <= 16);
    });
  }
  function startSnowCatch() {
    const pool = scPool();
    if (!pool.length) { toast('Em mở thêm bài học để có chữ cho trò này nhé! 🌱'); return; }
    const best = S.bestSnow || 0;
    openModal('❄️ Hứng tuyết chữ', 'Trò chơi 60 giây',
      '<div class="speed-intro sc-intro"><div class="sc-intro-art" aria-hidden="true"><span class="sc-demo good">kiến</span><span class="sc-demo">ciến</span></div>' +
      '<h3>Chạm bông tuyết viết đúng!</h3>' +
      '<p>Trên cùng là một câu còn thiếu chữ. Bông tuyết mang chữ sẽ rơi xuống – em chạm vào bông tuyết có chữ <b>viết đúng</b> để điền vào câu.</p>' +
      '<ul class="sc-rules"><li>💝 Chạm nhầm mất 1 trái tim – em có 3 trái tim.</li><li>🌟 Chạm sao vàng thì tuyết rơi chậm lại.</li><li>⏱️ Chơi trong 60 giây. Kỉ lục của em: <b>' + best + '</b> điểm.</li></ul>' +
      '<button class="primary-btn big" id="scGo">Bắt đầu! ❄️</button></div>');
    $('#scGo').onclick = () => play(pool);
  }
  window.startSnowCatch = startSnowCatch;
  // Cho kiểm thử tự động đọc trạng thái ván chơi (không hiện gì trên giao diện)
  window.snowCatchState = () => G && { word: G.it ? itemWord(G.it) : '', score: G.score, lives: G.lives, flakes: G.flakes.filter(f => !f.dead).map(f => f.w), slow: Date.now() < G.slowUntil };

  function calm() { return document.body.classList.contains('calm') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function play(pool) {
    stop();
    const root = $('#modalRoot');
    root.className = 'modal-root snow-mode'; root.hidden = false; root.onclick = null; root.scrollTop = 0;
    document.body.classList.add('modal-open'); $('.app-shell').inert = true;
    root.innerHTML = '<div class="sc-game" role="dialog" aria-modal="true" aria-label="Hứng tuyết chữ">' +
      '<div class="sc-top"><button class="pl-x" data-close-modal aria-label="Dừng chơi">✕</button>' +
      '<div class="sc-chip sc-time" id="scTime" aria-label="Thời gian còn lại">⏱️ <b>' + SC_TIME + '</b>s</div>' +
      '<div class="sc-chip sc-score" aria-label="Điểm">⭐ <b id="scScore">0</b></div>' +
      '<div class="sc-chip sc-lives" id="scLives" aria-label="Còn ' + SC_LIVES + ' trái tim">' + '💝'.repeat(SC_LIVES) + '</div></div>' +
      '<div class="sc-ask"><div class="sc-sentence" id="scSentence" aria-live="polite"></div><button class="sc-say" id="scSay" aria-label="Nghe câu">🔊</button></div>' +
      '<div class="sc-field" id="scField"><div class="sc-combo" id="scCombo" aria-live="polite"></div><div class="sc-ground" aria-hidden="true"></div></div></div>';
    G = { pool, k: 0, score: 0, lives: SC_LIVES, combo: 0, bestCombo: 0, endAt: Date.now() + SC_TIME * 1000, slowUntil: 0, flakes: [], it: null, raf: 0, last: 0, done: false,
      q: { kind: 'snowcatch', correct: 0, startedAt: Date.now() }, missed: [] };
    $('#scSay').onclick = () => { if (G && G.it) speak(fullSentence(G.it)); };
    nextRound();
    G.raf = requestAnimationFrame(tick);
  }
  function stop() { if (G) { cancelAnimationFrame(G.raf); G.done = true; } G = null; }

  function sentenceHtml(it, fillWord, ok) {
    const parts = it.de.split('___');
    const blank = fillWord == null ? '<span class="sc-blank">?</span>' : '<span class="sc-blank ' + (ok ? 'ok' : '') + '">' + esc(fillWord) + '</span>';
    return esc(parts[0]) + blank + esc(parts.slice(1).join('___'));
  }
  function nextRound() {
    if (!G) return;
    const it = G.it = G.pool[G.k++ % G.pool.length];
    G.roundMiss = false; G.roundDone = false;
    const word = itemWord(it), b = blankToken(it);
    // Chỗ trống hiển thị theo cả chữ: “Con ___ tha mồi.” → bé chọn cả chữ “kiến”
    const show = Object.assign({}, it, { de: it.de.replace(b.pre + '___' + b.post, '___') });
    G.show = show;
    $('#scSentence').innerHTML = sentenceHtml(show);
    const wrong = wrongWords(it);
    let words = [{ w: word, good: true }].concat(wrong.map(w => ({ w, good: false })));
    if (words.length < 3) words = words.concat(words.map(x => Object.assign({}, x))); // chỉ 1 cách viết sai → rơi 2 cặp đúng/sai
    if (G.k % 5 === 0) words.push({ w: '🌟', star: true });
    spawn(shuffle(words));
  }
  function spawn(words) {
    const field = $('#scField'); if (!field) return;
    G.flakes.forEach(f => f.el.remove()); G.flakes = [];
    const els = words.map(x => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'sc-flake' + (x.star ? ' star' : '') + ([...x.w].length > 7 ? ' long' : '');
      el.setAttribute('aria-label', x.star ? 'Sao băng giá' : 'Chữ ' + x.w);
      el.innerHTML = '<span class="sc-flake-in">' + esc(x.w) + '</span>';
      field.appendChild(el);
      return el;
    });
    // Xếp thành hàng: mỗi làn rộng hơn bông tuyết to nhất (+ chỗ lắc lư), hàng sau cách hàng trước một bông
    // → các bông tuyết không bao giờ chồng lên nhau, kể cả điện thoại 320px
    const W = field.clientWidth, fw = Math.max(...els.map(e => e.offsetWidth || 96)), fh = Math.max(...els.map(e => e.offsetHeight || 92));
    const perRow = Math.max(1, Math.min(words.length, Math.floor(W / (fw + 26)))), lane = W / perRow;
    G.fh = fh;
    els.forEach((el, i) => {
      const x = words[i], row = Math.floor(i / perRow), col = i % perRow, w = el.offsetWidth || fw;
      const cx = col * lane + lane / 2 + (Math.random() - 0.5) * Math.max(0, lane - w - 24);
      const f = { el, w: x.w, good: !!x.good, star: !!x.star, x: Math.min(W - w - 12, Math.max(12, cx - w / 2)), y: -fh - 8 - row * (fh + 28) - Math.random() * 24, ph: Math.random() * 6.3, dead: false };
      el.onpointerdown = e => { e.preventDefault(); hit(f); };
      el.onclick = e => { if (e.detail === 0) hit(f); }; // bàn phím (Enter/Space)
      G.flakes.push(f);
    });
  }
  function speedPx(H) { // px mỗi giây: rơi hết sân trong ~7.5 giây, nhanh dần tới ~4 giây
    const dur = Math.max(4, 7.5 - G.score * 0.18) * (calm() ? 1.5 : 1) * (Date.now() < G.slowUntil ? 2.2 : 1);
    return H / dur;
  }
  function tick(t) {
    if (!G || G.done) return;
    const field = $('#scField');
    if (!field || $('#modalRoot').hidden) { stop(); return; }
    G.raf = requestAnimationFrame(tick);
    const dt = G.last ? Math.min(0.05, (t - G.last) / 1000) : 0; G.last = t;
    const left = Math.max(0, Math.ceil((G.endAt - Date.now()) / 1000));
    const tm = $('#scTime b'); if (tm && tm.textContent !== String(left)) { tm.textContent = left; $('#scTime').classList.toggle('low', left <= 10); }
    if (left <= 0) { finish(false); return; }
    const H = field.clientHeight, v = speedPx(H), still = calm();
    G.flakes.forEach(f => {
      if (f.dead) return;
      f.y += v * dt; f.ph += dt * 1.6;
      if (f.y > H - 40) { // chạm đất → tan rồi bay lên lại
        if (f.star) { f.dead = true; f.el.classList.add('melt'); return; }
        f.y = -(G.fh || 92) - 8 - Math.random() * 40;
      }
      const sway = still ? 0 : Math.sin(f.ph) * 10;
      f.el.style.transform = 'translate3d(' + (f.x + sway).toFixed(1) + 'px,' + f.y.toFixed(1) + 'px,0) rotate(' + (still ? 0 : Math.sin(f.ph * 0.8) * 6).toFixed(1) + 'deg)';
    });
    const sl = Date.now() < G.slowUntil; field.classList.toggle('slow', sl);
  }
  function burst(f, good) {
    const field = $('#scField'); if (!field || calm()) return;
    const r = f.el.getBoundingClientRect(), fr = field.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('i'); p.className = 'sc-spark' + (good ? '' : ' bad');
      const a = (i / 8) * 6.28, d = 34 + Math.random() * 22;
      p.style.left = (r.left - fr.left + r.width / 2) + 'px'; p.style.top = (r.top - fr.top + r.height / 2) + 'px';
      p.style.setProperty('--dx', Math.cos(a) * d + 'px'); p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      field.appendChild(p); setTimeout(() => p.remove(), 650);
    }
  }
  function withQ(fn) { const prev = Q; Q = G.q; try { fn(); } finally { Q = prev; } }
  function hit(f) {
    if (!G || f.dead || G.roundDone) return;
    if (f.star) {
      f.dead = true; f.el.classList.add('pop'); burst(f, true); sfx('tap');
      G.slowUntil = Date.now() + 6000; showCombo('❄️ Phép băng giá! Tuyết rơi chậm lại');
      return;
    }
    if (f.good) {
      f.dead = true; G.roundDone = true; G.score++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
      f.el.classList.add('pop'); burst(f, true);
      if (!G.roundMiss) withQ(() => record(G.it, true)); else sfx('good');
      $('#scScore').textContent = G.score;
      $('#scSentence').innerHTML = sentenceHtml(G.show, f.w, true);
      if (G.combo >= 3) showCombo('🔥 ' + G.combo + ' câu liền!');
      G.flakes.forEach(x => { if (!x.dead) { x.dead = true; x.el.classList.add('fade'); } });
      setTimeout(() => { if (G && !G.done) nextRound(); }, 750);
    } else {
      f.dead = true; f.el.classList.add('wrong'); burst(f, false);
      if (!G.roundMiss) { G.roundMiss = true; G.missed.push(G.it); withQ(() => record(G.it, false)); } else sfx('bad');
      G.combo = 0; G.lives--;
      const l = $('#scLives'); if (l) { l.innerHTML = '💝'.repeat(Math.max(0, G.lives)) + '<span class="sc-lost">' + '🤍'.repeat(SC_LIVES - Math.max(0, G.lives)) + '</span>'; l.setAttribute('aria-label', 'Còn ' + Math.max(0, G.lives) + ' trái tim'); l.classList.remove('hurt'); void l.offsetWidth; l.classList.add('hurt'); }
      showCombo('Chữ “' + f.w + '” viết chưa đúng 🤗');
      if (G.lives <= 0) setTimeout(() => finish(true), 650);
    }
  }
  function showCombo(text) {
    const c = $('#scCombo'); if (!c) return;
    c.textContent = text; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
  }
  function finish(outOfLives) {
    if (!G || G.done) return;
    const g = G; stop();
    const beforeStage = gardenStage(S.xp);
    const xp = g.score * 5, extra = [];
    if (g.score > (S.bestSnow || 0)) { S.bestSnow = g.score; if (g.score) extra.push('🏆 Kỉ lục mới: ' + g.score + ' điểm!'); }
    S.xp += xp; mission().games++; bumpDay();
    const acc = pct(g.q.correct, g.q.correct + g.missed.length);
    S.history.unshift({ d: dayKey(), kind: 'snowcatch', topic: '', acc }); S.history = S.history.slice(0, 60);
    const fresh = checkBadges(); save();
    const good = g.score >= 5;
    if (good) { sfx('win'); confetti(); }
    const afterStage = gardenStage(S.xp);
    const title = outOfLives ? 'Hết trái tim rồi!' : good ? 'Em hứng tuyết giỏi quá!' : 'Lần sau sẽ hứng được nhiều hơn!';
    const missed = g.missed.slice(0, 4).map(it => '<li><b>' + esc(itemWord(it)) + '</b> – ' + esc(fullSentence(it)) + '</li>').join('');
    openModal('Kết quả của em', g.score + ' điểm',
      '<div class="lesson-complete"><div class="result-mascot" aria-hidden="true">' + S.avatar + '</div><div class="complete-medal">' + (good ? '⛄' : '❄️') + '</div>' +
      '<h3>' + title + '</h3><p>' + (outOfLives ? 'Không sao cả! Em nhìn kĩ từng chữ rồi chơi lại nhé.' : 'Mỗi bông tuyết em hứng đúng là một chữ em nhớ thêm.') + '</p>' +
      '<div class="score-pills"><span>❄️ ' + g.score + ' điểm</span><span>⭐ +' + xp + ' XP</span>' + (g.bestCombo >= 3 ? '<span>🔥 ' + g.bestCombo + ' câu liền</span>' : '') + '</div>' +
      extra.map(x => '<div class="unlock-note">' + x + '</div>').join('') +
      (missed ? '<div class="sc-missed"><b>Chữ cần nhớ:</b><ul>' + missed + '</ul></div>' : '') +
      (afterStage !== beforeStage ? '<div class="unlock-note">' + afterStage.icon + ' Khu vườn của em đã lớn thành <b>' + afterStage.name + '</b>!</div>' : '') +
      fresh.map(b => '<div class="unlock-note badge-new">' + b.icon + ' Huy hiệu mới: <b>' + b.name + '</b></div>').join('') +
      '<div class="modal-actions center"><button class="primary-btn big" id="scAgain">↻ Chơi lại</button><button class="soft-btn" id="scGames">🎮 Trò chơi khác</button></div></div>', 'result');
    $('#scAgain').onclick = () => play(scPool());
    $('#scGames').onclick = () => { closeModal(); go('games'); };
    onModalClose = render;
  }
  // Ẩn tab: tạm dừng đồng hồ để bé không bị mất giờ
  document.addEventListener('visibilitychange', () => {
    if (!G) return;
    if (document.hidden) G.pausedAt = Date.now();
    else if (G.pausedAt) { const d = Date.now() - G.pausedAt; G.endAt += d; if (G.slowUntil) G.slowUntil += d; G.pausedAt = 0; G.last = 0; }
  });
})();
