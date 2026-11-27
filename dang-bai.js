/* Thêm 7 dạng bài tập – Claude Code (đợt 16). Nạp SAU app.js.
   Mọi dạng đều TỰ TẠO từ câu đã kiểm duyệt của bài (data/chuong-trinh.js) nên đúng chính tả và bài nào cũng có:
     phanLoai  – Xếp vào giỏ: chạm từ rồi chạm giỏ “s” / “x”, “dấu hỏi” / “dấu ngã”…
     noiTu     – Nối tiếng thành từ: “sân” ↔ “trường”
     goChu     – Gõ chữ còn thiếu (không có lựa chọn sẵn) – lớp 2–3
     chonCau   – Chọn câu viết đúng
     sapXep    – Xếp chữ thành câu
     chonNhieu – Chọn TẤT CẢ cụm từ viết đúng
     suaLoi    – Sửa lỗi: gõ lại chữ viết sai cho đúng – lớp 2–3
   Móc vào app.js: EXTRA_RENDER (vẽ), extendLesson (chèn vào bài học), varyMore (Luyện nhanh/Thử thách). */
'use strict';
(function () {
  const TONE = /[̣̀́̃̉]/g;
  const bare = s => String(s).normalize('NFD').replace(TONE, '').normalize('NFC').toLowerCase();
  const toneName = s => { const d = String(s).normalize('NFD'); return d.includes('̉') ? 'dấu hỏi' : d.includes('̃') ? 'dấu ngã' : d.includes('̀') ? 'dấu huyền' : d.includes('́') ? 'dấu sắc' : d.includes('̣') ? 'dấu nặng' : 'không dấu'; };
  const norm = s => String(s).normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  const grade = () => Number(S.grade) || 2;
  const strip = w => w.replace(/[.,!?;:"“”()…]/g, '');

  /* ---------- nguồn câu của một bài ---------- */
  function pool(t) {
    const fixed = t.baiTap.map((b, i) => Object.assign({}, b, { _t: t.id, _i: i }));
    const gen = (t.sinh || []).map((b, k) => Object.assign({}, b, { _t: t.id, _i: 'g' + k }));
    return fixed.concat(gen);
  }
  const chons = t => pool(t).filter(b => b.loai === 'chon' && b.de.includes('___') && b.luaChon.length >= 2);
  // nhãn của một lựa chọn: “s”, “ươc”, hay “dấu hỏi” khi các lựa chọn chỉ khác dấu thanh
  function labelOf(it, opt) { const others = it.luaChon; return others.every(o => bare(o) === bare(it.dapAn)) ? toneName(opt) : bare(opt); }
  /* Cụm 2 tiếng CÓ NGHĨA: lấy từ ví dụ của các bài + danh sách soạn tay. Không tự cắt chữ liền nhau trong câu
     (trước đây ra thẻ vô nghĩa như “từ chuối vào”, “bức tranh ông”). */
  const CUM_SOAN = ('mặt trăng|con trâu|cây tre|cái trống|bức tranh|quả trứng|con chim|tiếng chuông|nải chuối|ra chơi|chăm chỉ|trường học|' +
    'buổi sáng|sách vở|ngôi sao|cốc sữa|sân trường|con suối|giọt sương|màu xanh|xe đạp|xinh đẹp|xếp hàng|đĩa xôi|' +
    'con rùa|rửa tay|rau xanh|khu rừng|cơn gió|cái giường|tờ giấy|dạy học|đôi dép|cây dừa|' +
    'nắng vàng|cốc nước|nồi canh|nụ hoa|nấu cơm|chiếc lá|bếp lửa|trời lạnh|làng quê|lớp học|' +
    'con kiến|cái kẹo|kể chuyện|cái kéo|đeo kính|que kem|quả cam|cái quạt|quê hương|con cá|lá cờ|cửa sổ|' +
    'cái ghế|ghi bài|ghé thăm|đàn gà|bàn gỗ|gói quà|gấu bông|soi gương|gửi thư|nghe giảng|nghỉ ngơi|con nghé|suy nghĩ|đi ngủ|ngõ nhỏ|con ngựa|' +
    'cái bàn|đàn cò|lá vàng|cái thang|ca hát|bãi cát|bác sĩ|âm nhạc|vườn rau|con đường|cánh diều|thương yêu|vượt qua|uống nước|cái lược|bước đi|' +
    'bờ biển|tiếng hát|siêng năng|điện thoại|súc miệng|viết bài|hiểu biết|bữa tiệc|xem xiếc|máy bay|ngày hội|chùm vải|con nai|' +
    'ngọn núi|túi áo|vui vẻ|cái mũi|khuy áo|huy hiệu|chịu khó|cứu hoả|bưu điện|khăn len|đắp chăn|bằng lòng|vâng lời|nâng niu|' +
    'cái chuông|con chuột|buộc dây|ruộng lúa|cuốn sách|luôn luôn|muốn đi|quyển vở|gia đình|dịu dàng|giữ gìn|rực rỡ|dễ dàng|mạnh mẽ|sạch sẽ|' +
    'con voi|chú voi|con dê|ngôi nhà|dậy sớm|đi dạo|vỗ tay|trồng rau|đi xuống|uống sữa|cày ruộng|buồng chuối|chuồn chuồn|luống rau|chiếc xuồng|bật điện|con thuyền|tắm biển|đọc truyện|yên tĩnh|' +
    'sẵn sàng|xuất sắc|chính xác|đơn giản|rơi xuống|màu sắc|trân trọng|chân thành|dũng cảm|viết nghiêng').split('|');
  let CUM = null;
  function cumTu() {
    if (CUM) return CUM;
    CUM = new Set();
    const D = window.NGAN_HANG_CHINH_TA || { chuDe: [] };
    D.chuDe.forEach(t => (t.viDu || []).forEach(v => { const s = norm(v); if (s.split(' ').length === 2) CUM.add(s); }));
    CUM_SOAN.forEach(s => CUM.add(norm(s)));
    return CUM;
  }
  // cụm mà bản “viết sai” cũng là cụm đúng (cái tai / cái tay, lá cây / ná cây) → không dùng để hỏi đúng–sai
  const DE_NHAM = new Set(['cái tai', 'cái tay', 'lá cây', 'rửa tay', 'gia đình', 'đeo kính']);
  function wordAt(it, opt) {
    const toks = it.de.split(' '), k = toks.findIndex(w => w.includes('___'));
    const w = strip(toks[k].replace('___', opt));
    return { toks, k, w: k === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w };
  }
  // cụm 2 tiếng chứa chỗ trống, với chữ cần điền là opt; không có cụm nào có nghĩa → null
  function phrase(it, opt) {
    const { toks, k, w } = wordAt(it, opt), good = norm(wordAt(it, it.dapAn).w);
    for (const [at, before] of [[k - 1, true], [k + 1, false]]) {
      const other = at >= 0 && at < toks.length ? strip(toks[at]) : '';
      if (!other) continue;
      const key = norm(before ? other + ' ' + good : good + ' ' + other);
      if (cumTu().has(key) && !DE_NHAM.has(key)) return before ? other.toLowerCase() + ' ' + w : w + ' ' + other;
    }
    return null;
  }

  /* ---------- 1. Xếp vào giỏ ---------- */
  function makePhanLoai(t) {
    const groups = new Map();
    chons(t).forEach(it => {
      const labels = [...new Set(it.luaChon.map(o => labelOf(it, o)))].sort();
      if (labels.length < 2) return;
      const key = labels.join('|'); if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    });
    const best = [...groups.entries()].map(([k, list]) => {
      const byLabel = {}; list.forEach(it => { const l = labelOf(it, it.dapAn); (byLabel[l] = byLabel[l] || []).push(it); });
      return { labels: k.split('|'), byLabel };
    }).filter(g => g.labels.filter(l => (g.byLabel[l] || []).length >= 2).length >= 2)
      .sort((a, b) => Object.values(b.byLabel).flat().length - Object.values(a.byLabel).flat().length)[0];
    if (!best) return null;
    const baskets = best.labels.filter(l => (best.byLabel[l] || []).length >= 1).slice(0, 3);
    const per = baskets.length === 3 ? 2 : 3, words = [], seen = new Set();
    baskets.forEach(l => shuffle(best.byLabel[l] || []).forEach(it => {
      // Xếp giỏ chỉ hiện chữ ĐÚNG nên một tiếng đứng riêng vẫn rõ ràng
      const w = phrase(it, it.dapAn) || wordAt(it, it.dapAn).w;
      if (words.filter(x => x.b === l).length < per && !seen.has(w)) { seen.add(w); words.push({ w, b: l, _i: it._i }); }
    }));
    if (words.length < 4) return null;
    return { loai: 'phanLoai', _t: t.id, _i: words[0]._i, baskets, words: shuffle(words) };
  }
  function renderPhanLoai(it) {
    const place = {}; let sel = null;
    openPlayer(playerShell('<p class="pl-ask">🧺 Chạm một từ, rồi chạm vào <b>giỏ đúng</b> của từ đó:</p>' +
      '<div class="db-chips" id="dbPool">' + it.words.map((x, k) => '<button class="db-chip" data-w="' + k + '">' + esc(x.w) + '</button>').join('') + '</div>' +
      '<div class="db-baskets n' + it.baskets.length + '">' + it.baskets.map((b, k) => '<div class="db-basket" data-b="' + k + '" role="button" tabindex="0" aria-label="Giỏ ' + esc(b) + '"><b class="db-label">' + esc(b) + '</b><div class="db-in"></div></div>').join('') + '</div>', it));
    const draw = () => {
      $$('[data-w]').forEach(btn => {
        const k = Number(btn.dataset.w), home = place[k] == null ? $('#dbPool') : $('[data-b="' + place[k] + '"] .db-in');
        if (btn.parentNode !== home) home.appendChild(btn);
        btn.classList.toggle('is-sel', sel === k);
      });
      setReady(Object.keys(place).length === it.words.length ? evaluate : null);
    };
    const evaluate = () => {
      let wrong = [];
      $$('[data-w]').forEach(btn => { const k = Number(btn.dataset.w), ok = it.baskets[place[k]] === it.words[k].b; btn.classList.add(ok ? 'good' : 'bad'); btn.disabled = true; if (!ok) wrong.push(it.words[k]); });
      if (wrong.length) it._i = wrong[0]._i;
      const right = !wrong.length;
      return { right, html: right ? 'Em xếp đúng hết! 🧺' : 'Xếp lại cho đúng: ' + wrong.map(x => '<b>' + esc(x.w) + '</b> → giỏ <b>' + esc(x.b) + '</b>').join(' · ') + ruleHint(it) };
    };
    $$('[data-w]').forEach(btn => btn.onclick = e => {
      e.stopPropagation(); if (Q.answered) return; const k = Number(btn.dataset.w); sfx('tap');
      if (place[k] != null) { delete place[k]; sel = k; } else sel = sel === k ? null : k;
      draw();
    });
    $$('[data-b]').forEach(bk => { const drop = () => { if (Q.answered || sel == null) return; place[sel] = Number(bk.dataset.b); sel = null; sfx('tap'); draw(); }; bk.onclick = drop; bk.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop(); } }; });
  }

  /* ---------- 2. Nối tiếng thành từ ---------- */
  function makeNoiTu(t) {
    const two = shuffle((t.viDu || []).map(s => s.normalize('NFC').trim()).filter(s => s.split(' ').length === 2));
    const pick = [], A = new Set(), B = new Set();
    two.forEach(s => { const [a, b] = s.split(' '); if (pick.length < (grade() === 1 ? 3 : 4) && !A.has(a) && !B.has(b)) { A.add(a); B.add(b); pick.push([a, b]); } });
    if (pick.length < 3) return null;
    return { loai: 'noiTu', _t: t.id, _i: null, pairs: pick, right: shuffle(pick.map(p => p[1])) };
  }
  function renderNoiTu(it) {
    const link = {}; let sel = null; // link[trái] = phải
    openPlayer(playerShell('<p class="pl-ask">🔗 Chạm một tiếng bên trái, rồi chạm tiếng bên phải để <b>ghép thành từ</b>:</p>' +
      '<div class="db-match"><div class="db-col">' + it.pairs.map((p, k) => '<button class="db-m left" data-l="' + k + '">' + esc(p[0]) + '</button>').join('') + '</div>' +
      '<div class="db-col">' + it.right.map((w, k) => '<button class="db-m right" data-r="' + k + '">' + esc(w) + '</button>').join('') + '</div></div>', it));
    const draw = () => {
      const used = Object.values(link);
      $$('[data-l]').forEach(b => { const k = Number(b.dataset.l); b.classList.toggle('is-sel', sel === k); b.dataset.c = link[k] != null ? k % 4 : ''; });
      $$('[data-r]').forEach(b => { const k = Number(b.dataset.r), owner = Object.keys(link).find(l => link[l] === k); b.dataset.c = owner != null ? owner % 4 : ''; });
      setReady(used.length === it.pairs.length ? evaluate : null);
    };
    const evaluate = () => {
      const bad = [];
      $$('[data-l]').forEach(b => { const k = Number(b.dataset.l), ok = it.right[link[k]] === it.pairs[k][1]; b.classList.add(ok ? 'good' : 'bad'); if (!ok) bad.push(it.pairs[k].join(' ')); });
      $$('[data-l],[data-r]').forEach(b => { b.disabled = true; });
      return { right: !bad.length, html: !bad.length ? 'Em nối đúng hết: ' + it.pairs.map(p => '<b>' + esc(p.join(' ')) + '</b>').join(', ') : 'Các từ đúng là: ' + it.pairs.map(p => '<b>' + esc(p.join(' ')) + '</b>').join(', '), say: it.pairs.map(p => p.join(' ')).join(', ') };
    };
    $$('[data-l]').forEach(b => b.onclick = () => { if (Q.answered) return; const k = Number(b.dataset.l); sfx('tap'); if (link[k] != null) delete link[k]; sel = sel === k ? null : k; draw(); });
    $$('[data-r]').forEach(b => b.onclick = () => {
      if (Q.answered || sel == null) return; const k = Number(b.dataset.r);
      Object.keys(link).forEach(l => { if (link[l] === k) delete link[l]; });
      link[sel] = k; speak(it.pairs[sel][0] + ' ' + it.right[k]); sel = null; draw();
    });
  }

  /* ---------- 3. Gõ chữ còn thiếu ---------- */
  function canGo(it) { return it.loai === 'chon' && it.de.includes('___') && it.dapAn.length <= 4 && (grade() >= 3 || /^[a-z]+$/.test(it.dapAn)); }
  function makeGoChu(it) { return { loai: 'goChu', _t: it._t, _i: it._i, de: it.de, dapAn: it.dapAn, luaChon: it.luaChon, say: fullSentence(it) }; }
  function renderGoChu(it) {
    const html = esc(it.de).replace('___', '<input class="db-type" id="dbType" maxlength="6" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Chữ còn thiếu" size="3">');
    openPlayer(playerShell('<p class="pl-ask">⌨️ <b>Gõ</b> chữ còn thiếu vào ô trống:</p><div class="q-line"><div class="question-prompt">' + html + '</div><button class="speak-btn" id="sayQ" aria-label="Nghe câu">🔊</button></div>' +
      '<p class="db-small">Chưa chắc? Bấm 🔊 nghe cả câu rồi gõ nhé.</p>', it));
    const inp = $('#dbType');
    $('#sayQ').onclick = () => speak(it.say);
    inp.oninput = () => setReady(inp.value.trim() ? evaluate : null);
    inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing && inp.value.trim()) doCheck(); };
    const evaluate = () => { const right = norm(inp.value) === norm(it.dapAn); inp.readOnly = true; inp.classList.add(right ? 'good' : 'bad'); return { right, html: (right ? '' : 'Phải gõ: <b>' + esc(it.dapAn) + '</b> → ') + '<b>' + esc(it.say) + '</b>' + ruleHint(it), say: it.say }; };
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 300);
  }

  /* ---------- 4. Chọn câu viết đúng ---------- */
  function makeChonCau(it) {
    const good = fullSentence(it), bad = shuffle(it.luaChon.filter(o => o !== it.dapAn)).slice(0, 2).map(o => it.de.replace('___', o));
    if (!bad.length || bad.includes(good)) return null;
    return { loai: 'chonCau', _t: it._t, _i: it._i, good, opts: shuffle([good].concat(bad)) };
  }
  function renderChonCau(it) {
    openPlayer(playerShell('<p class="pl-ask">📝 Câu nào viết <b>đúng chính tả</b>?</p>' + optionsHtml(it.opts, 'data-answer'), it));
    bindOptions(ans => { markOptions(it.good, ans); const right = ans === it.good; return { right, html: (right ? '' : 'Câu đúng: <b>' + esc(it.good) + '</b>') + ruleHint(it), say: it.good }; });
  }

  /* ---------- 5. Xếp chữ thành câu ---------- */
  function makeSapXep(t) {
    const max = grade() === 1 ? 5 : 7;
    const cands = pool(t).map(b => b.loai === 'ngheViet' ? { s: b.cau, _i: b._i } : b.loai === 'chon' && b.de.includes('___') ? { s: fullSentence(b), _i: b._i } : null)
      .filter(x => x && x.s.split(' ').length >= 3 && x.s.split(' ').length <= max);
    if (!cands.length) return null;
    const c = pick(cands), words = c.s.split(' ');
    let order = shuffle(words.map((w, k) => k)); if (order.every((v, k) => v === k)) order.push(order.shift());
    return { loai: 'sapXep', _t: t.id, _i: c._i, words, order };
  }
  function renderSapXep(it) {
    const placed = [];
    openPlayer(playerShell('<p class="pl-ask">🧩 Chạm các chữ theo thứ tự để <b>xếp thành câu</b> đúng:</p>' +
      '<div class="db-line" id="dbLine" aria-live="polite"></div>' +
      '<div class="db-chips">' + it.order.map(k => '<button class="db-chip" data-k="' + k + '">' + esc(it.words[k]) + '</button>').join('') + '</div>' +
      '<div class="ghep-tools"><button class="text-link" id="dbRedo">↺ Xếp lại</button></div>', it));
    const draw = () => {
      $('#dbLine').innerHTML = placed.length ? placed.map(k => '<span>' + esc(it.words[k]) + '</span>').join(' ') : '<i>Chạm chữ đầu tiên…</i>';
      $$('[data-k]').forEach(b => { b.disabled = placed.includes(Number(b.dataset.k)) || Q.answered; });
      setReady(placed.length === it.words.length ? evaluate : null);
    };
    const evaluate = () => { const built = placed.map(k => it.words[k]).join(' '), want = it.words.join(' '), right = built === want; $('#dbLine').classList.add(right ? 'good' : 'bad'); return { right, html: right ? 'Em xếp đúng câu!' : 'Câu đúng: <b>' + esc(want) + '</b>', say: want }; };
    $$('[data-k]').forEach(b => b.onclick = () => { if (Q.answered) return; sfx('tap'); placed.push(Number(b.dataset.k)); draw(); });
    $('#dbRedo').onclick = () => { if (Q.answered) return; placed.length = 0; draw(); };
    draw();
  }

  /* ---------- 6. Chọn tất cả cụm từ viết đúng ---------- */
  function makeChonNhieu(t) {
    const list = shuffle(chons(t)), items = [], seen = new Set();
    for (const it of list) { const g = phrase(it, it.dapAn); if (g && !seen.has(g)) { seen.add(g); items.push(it); } if (items.length === 4) break; }
    if (items.length < 4) return null;
    const goodSet = new Set(items.map(it => phrase(it, it.dapAn)));
    const chips = [];
    items.forEach((it, k) => {
      const good = k !== 1; // 4 câu → 3 cụm đúng (0, 2, 3) + 3 cụm sai (0, 1, 2)
      if (good) chips.push({ w: phrase(it, it.dapAn), ok: true, _i: it._i });
      const wrongOpt = it.luaChon.find(o => o !== it.dapAn), w = phrase(it, wrongOpt);
      if (!goodSet.has(w) && (k !== 3)) chips.push({ w, ok: false, _i: it._i });
    });
    if (!chips.some(c => c.ok) || !chips.some(c => !c.ok)) return null;
    return { loai: 'chonNhieu', _t: t.id, _i: chips[0]._i, chips: shuffle(chips) };
  }
  function renderChonNhieu(it) {
    const on = new Set();
    openPlayer(playerShell('<p class="pl-ask">🎈 Chạm <b>tất cả</b> các cụm từ viết <b>đúng</b> chính tả (có thể nhiều hơn một):</p>' +
      '<div class="db-chips big">' + it.chips.map((c, k) => '<button class="db-chip" data-c="' + k + '" aria-pressed="false">' + esc(c.w) + '</button>').join('') + '</div>', it));
    $$('[data-c]').forEach(b => b.onclick = () => {
      if (Q.answered) return; const k = Number(b.dataset.c); sfx('tap');
      if (on.has(k)) on.delete(k); else on.add(k);
      b.classList.toggle('is-sel', on.has(k)); b.setAttribute('aria-pressed', on.has(k));
      setReady(on.size ? evaluate : null);
    });
    const evaluate = () => {
      let miss = null;
      $$('[data-c]').forEach(b => { const k = Number(b.dataset.c), c = it.chips[k], chosen = on.has(k); b.disabled = true; b.classList.remove('is-sel'); if (c.ok) b.classList.add(chosen ? 'good' : 'missed'); else if (chosen) b.classList.add('bad'); if (c.ok !== chosen && !miss) miss = c; });
      if (miss) it._i = miss._i;
      return { right: !miss, html: miss ? 'Các cụm từ viết đúng: ' + it.chips.filter(c => c.ok).map(c => '<b>' + esc(c.w) + '</b>').join(', ') + ruleHint(it) : 'Em tìm đúng hết! 🎈' };
    };
  }

  /* ---------- 7. Sửa lỗi ---------- */
  function makeSuaLoi(it) { return it.loai === 'timLoi' ? { loai: 'suaLoi', _t: it._t, _i: it._i, cau: it.cau, tuSai: it.tuSai, tuDung: it.tuDung } : null; }
  function renderSuaLoi(it) {
    const marked = it.cau.split(' ').map(w => strip(w) === it.tuSai ? '<mark class="db-wrong">' + esc(w) + '</mark>' : esc(w)).join(' ');
    openPlayer(playerShell('<p class="pl-ask">✏️ Chữ tô đỏ đang <b>viết sai</b>. Em gõ lại cho đúng:</p><div class="question-prompt">' + marked + '</div>' +
      '<div class="db-fix"><span class="db-old">' + esc(it.tuSai) + '</span><span aria-hidden="true">→</span><input class="db-type wide" id="dbFix" maxlength="20" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Viết lại cho đúng"></div>', it));
    const inp = $('#dbFix');
    inp.oninput = () => setReady(inp.value.trim() ? evaluate : null);
    inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing && inp.value.trim()) doCheck(); };
    const fixed = it.cau.split(' ').map(w => strip(w) === it.tuSai ? w.replace(it.tuSai, it.tuDung) : w).join(' ');
    const evaluate = () => { const right = norm(inp.value) === norm(it.tuDung); inp.readOnly = true; inp.classList.add(right ? 'good' : 'bad'); return { right, html: (right ? '' : 'Viết đúng là: <b>' + esc(it.tuDung) + '</b><br>') + esc(fixed) + ruleHint(it), say: fixed }; };
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) {} }, 300);
  }

  /* ---------- 8. Nhìn tranh chọn từ ---------- */
  // [mã hình trong assets/emoji, từ viết đúng, [cách viết sai hay gặp], [cặp chính tả], câu nhắc]
  const TRANH = [
    ['1f43f', 'con sóc', ['con xóc'], ['s-x']], ['1f4da', 'quyển sách', ['quyển xách'], ['s-x', 'ach-ech']], ['2b50', 'ngôi sao', ['ngôi xao'], ['s-x', 'ng-ngh']],
    ['1f414', 'con gà', ['con ghà'], ['g-gh']], ['1f43b', 'con gấu', ['con ghấu'], ['g-gh', 'an-uan']],
    ['1f434', 'con ngựa', ['con nghựa'], ['ng-ngh']], ['1f319', 'mặt trăng', ['mặt chăng'], ['ch-tr', 'at-ac']], ['1f514', 'cái chuông', ['cái truông', 'cái chuôn'], ['ch-tr', 'uon-uong']],
    ['1f36c', 'cái kẹo', ['cái cẹo'], ['c-k', 'c-k-q']], ['1f98a', 'con cáo', ['con káo'], ['c-k', 'c-k-q']], ['1f392', 'cái cặp', ['cái kặp'], ['c-k', 'c-k-q']],
    ['1f56f', 'cây nến', ['cây lến'], ['l-n', 'c-k']], ['1f343', 'chiếc lá', ['chiếc ná'], ['l-n', 'iec-iet']], ['1f344', 'cây nấm', ['cây lấm'], ['l-n']], ['1f3ee', 'đèn lồng', ['đèn nồng'], ['l-n', 'ong-ong']],
    ['1f422', 'con rùa', ['con dùa', 'con giùa'], ['d-gi-r', 'r-d', 'r-gi']], ['1fa81', 'con diều', ['con riều', 'con giều'], ['d-gi-r', 'gi-d', 'r-d', 'ieu-yeu-iu']],
    ['1f353', 'quả dâu', ['quả giâu'], ['gi-d', 'd-gi-r']], ['1f986', 'con vịt', ['con dịt', 'con vịch'], ['v-d', 'ich-it']], ['1f451', 'vương miện', ['dương miện'], ['v-d', 'uon-uong-2']],
    ['1f407', 'con thỏ', ['con thõ'], ['hoi-nga']], ['1f435', 'con khỉ', ['con khĩ'], ['hoi-nga']], ['1f42f', 'con hổ', ['con hỗ'], ['hoi-nga']],
    ['1f438', 'con ếch', ['con ách', 'con ết'], ['ach-ech']], ['1f411', 'con cừu', ['con cìu'], ['uu-iu']], ['1f41d', 'con ong', ['con ông'], ['ong-ong']],
    ['1f36a', 'bánh quy', ['bếnh quy'], ['anh-enh']], ['2601', 'đám mây', ['đám may'], ['ay-ay2', 'ai-ay']], ['2708', 'máy bay', ['máy bây'], ['ay-ay2', 'ai-ay']],
    ['26f5', 'thuyền buồm', ['thuyền bùm', 'thuyềng buồm'], ['ien-yen-uyen', 'ien-ieng']], ['1f338', 'bông hoa', ['bông huê', 'bong hoa'], ['oa-ue', 'ong-ong']],
    ['1f388', 'bóng bay', ['bống bay'], ['ong-ong', 'ai-ay']], ['1f981', 'sư tử', ['xư tử'], ['s-x', 'hoi-nga']]
  ].filter(r => typeof EMOJI_ART !== 'undefined' ? EMOJI_ART.has(r[0]) : true);
  function makeNhinTranh(t) {
    const caps = t.cap || [t.id];
    const pool = TRANH.filter(r => r[3].some(c => caps.includes(c)));
    if (!pool.length) return null;
    const r = pick(pool);
    return { loai: 'nhinTranh', _t: t.id, _i: null, art: r[0], word: r[1], opts: shuffle([r[1]].concat(r[2])) };
  }
  function renderNhinTranh(it) {
    openPlayer(playerShell('<p class="pl-ask">🖼️ Nhìn tranh rồi chọn từ <b>viết đúng</b>:</p><div class="db-pic" data-noemo><img src="assets/emoji/' + it.art + '.webp" alt="Tranh minh hoạ"></div>' + optionsHtml(it.opts, 'data-answer'), it));
    bindOptions(ans => { markOptions(it.word, ans); const right = ans === it.word; return { right, html: (right ? '' : 'Từ viết đúng: ') + '<b>' + esc(it.word) + '</b>' + ruleHint(it), say: it.word }; });
  }

  /* ---------- Gắn vào app ---------- */
  Object.assign(TYPE_TAG, { phanLoai: 'XẾP VÀO GIỎ', noiTu: 'NỐI TIẾNG THÀNH TỪ', goChu: 'GÕ CHỮ CÒN THIẾU', chonCau: 'CHỌN CÂU ĐÚNG', sapXep: 'XẾP CHỮ THÀNH CÂU', chonNhieu: 'CHỌN TẤT CẢ TỪ ĐÚNG', suaLoi: 'SỬA LỖI SAI', nhinTranh: 'NHÌN TRANH CHỌN TỪ' });
  Object.assign(EXTRA_RENDER, { phanLoai: renderPhanLoai, noiTu: renderNoiTu, goChu: renderGoChu, chonCau: renderChonCau, sapXep: renderSapXep, chonNhieu: renderChonNhieu, suaLoi: renderSuaLoi, nhinTranh: renderNhinTranh });

  // Chèn dạng mới vào bài học: rải đều, số lượng theo mức Dễ / Vừa / Khó
  window.extendLesson = function (list, t, level) {
    const g = grade(), add = [];
    const tryAdd = f => { try { const x = f(); if (x) add.push(x); } catch (e) { console.warn(e); } };
    const tranh = makeNhinTranh(t);
    tryAdd(() => makePhanLoai(t));
    tryAdd(() => makeNoiTu(t));
    if (level !== 'de') { tryAdd(() => makeChonNhieu(t)); tryAdd(() => makeSapXep(t)); }
    if (level === 'kho') { const c = chons(t); if (c.length) tryAdd(() => makeChonCau(pick(c))); }
    let out = list.slice();
    if (g >= 2) { // đổi bớt câu chọn → gõ chữ, câu tìm lỗi → sửa lỗi
      let n = level === 'de' ? 1 : 2;
      out = out.map(it => (n > 0 && canGo(it) && Math.random() < 0.6) ? (n--, makeGoChu(it)) : it);
      let m = level === 'de' ? 0 : 1;
      out = out.map(it => (m > 0 && it.loai === 'timLoi') ? (m--, makeSuaLoi(it)) : it);
    }
    const cap = level === 'de' ? 2 : level === 'vua' ? 3 : 5;
    shuffle(add).slice(0, cap).forEach((x, k, arr) => { const pos = Math.round((k + 1) * out.length / (arr.length + 1)); out.splice(pos, 0, x); });
    if (tranh) out.splice(1, 0, tranh); // có tranh thì bài nào cũng mở đầu bằng một câu nhìn tranh
    return out;
  };
  // Luyện nhanh, Thử thách: thỉnh thoảng đổi câu chọn thành “Chọn câu đúng”
  window.varyMore = function (it) { if (it.loai === 'chon' && it.de && it.de.includes('___') && Math.random() < 0.15) return makeChonCau(it); return null; };
  window.DangBai = { makeNhinTranh, TRANH, makePhanLoai, makeNoiTu, makeGoChu, makeChonCau, makeSapXep, makeChonNhieu, makeSuaLoi, phrase };
})();
