/* Trang giáo viên: “Bài học” (xem – sửa – ẩn – thêm câu, nhập từ Excel) và “Giao bài” – Claude Code (đợt 18).
   Viết theo lời của giáo viên: không có mã bài, không có thuật ngữ máy tính. Dùng các hàm chung của gv.js (window.GV). */
'use strict';
(function () {
  const G = window.GV;
  const { $, $$, esc, api, send, toast, fail, dialog, confirmBox, lessonsOf, lessonById, download, load, cache, pct, className, daysAgo } = G;
  const KIEU = {
    chon: { icon: '🔤', ten: 'Điền chỗ trống', mo: 'Học sinh chọn chữ đúng để điền vào chỗ trống' },
    timLoi: { icon: '🔎', ten: 'Tìm chữ viết sai', mo: 'Học sinh tìm và sửa chữ viết sai trong câu' },
    ngheViet: { icon: '🎧', ten: 'Nghe – viết', mo: 'Máy đọc câu, học sinh nghe rồi viết lại' }
  };
  let edits = {};
  const loadEdits = async () => { edits = (await api('/api/lessons')).edits || {}; return edits; };
  const editOf = id => { const e = edits[id] || {}; return { hidden: (e.hidden || []).slice(), edits: Object.assign({}, e.edits), added: (e.added || []).map(a => Object.assign({}, a)), noGen: !!e.noGen }; };
  const saving = new Set();
  async function saveEdit(id, e) {
    if (saving.has(id)) throw Error('Bài đang được lưu. Thầy cô đợi một chút nhé.');
    saving.add(id);
    try {
      const r = await send('/api/lessons/' + id, 'PUT', { ...e, previous: edits[id] || null });
      if (r.edit.hidden.length || Object.keys(r.edit.edits).length || r.edit.added.length || r.edit.noGen) edits[id] = r.edit;
      else delete edits[id];
      return r.edit;
    } finally { saving.delete(id); }
  }
  const newId = () => 'gv-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const numberOf = t => lessonsOf(t.lop[0]).indexOf(t) + 1;
  const nameOf = t => 'Lớp ' + t.lop[0] + ' – Bài ' + numberOf(t) + ': ' + t.ten;
  const stripWord = w => w.replace(/[.,!?;:"“”()…]/g, '');

  /* câu hiển thị đúng như học sinh thấy */
  function preview(q) {
    if (q.loai === 'chon') return '<p class="q-text">' + esc(q.de).replace('___', '<u class="blank">&nbsp;?&nbsp;</u>') + '</p><p class="q-opts">' + q.luaChon.map(o => '<span class="opt' + (o === q.dapAn ? ' good' : '') + '">' + esc(o) + (o === q.dapAn ? ' ✓' : '') + '</span>').join('') + '</p>';
    if (q.loai === 'timLoi') return '<p class="q-text">' + q.cau.split(' ').map(w => stripWord(w) === q.tuSai ? '<mark>' + esc(w) + '</mark>' : esc(w)).join(' ') + '</p><p class="q-opts"><span class="muted">Viết đúng:</span> <span class="opt good">' + esc(q.tuDung) + '</span></p>';
    return '<p class="q-text">' + esc(q.cau) + '</p>';
  }

  /* ---------------- Danh sách bài ---------------- */
  let gradeTab = 2;
  async function pgLessons(v, sub, reload = true) {
    if (reload) await loadEdits();
    if (sub && lessonById(sub)) return pgOne(v, lessonById(sub));
    const count = t => { const e = editOf(t.id); return { total: t.baiTap.length - e.hidden.filter(k => /^\d+$/.test(k)).length + e.added.filter(a => !e.hidden.includes(a.id)).length, own: e.added.length, changed: Object.keys(e.edits).length, hidden: e.hidden.length }; };
    v.innerHTML = G.storageWarn() +
      '<section class="card help-line"><div><b>Bấm vào một bài</b> để xem từng câu, sửa lại, ẩn câu không dùng hoặc thêm câu mới. Khi có mạng, bài học cập nhật cho lượt làm tiếp theo của học sinh.</div>' +
      '<div class="actions"><button class="btn primary" id="xlImport">📥 Thêm nhiều câu từ Excel</button><a class="btn" href="#cau-do">🧩 Câu đố có hình, xếp tiếng…</a></div></section>' +
      '<div class="tabs" role="tablist">' + [1, 2, 3].map(g => '<button role="tab" aria-selected="' + (g === gradeTab) + '" class="tab' + (g === gradeTab ? ' on' : '') + '" data-g="' + g + '">Lớp ' + g + '</button>').join('') + '</div>' +
      '<div class="lesson-list">' + lessonsOf(gradeTab).map((t, i) => { const c = count(t); return '<a class="lesson-card" href="#bai-hoc/' + t.id + '"><span class="no">' + (i + 1) + '</span><span class="info"><b>' + esc(t.ten) + '</b><small>' + c.total + ' câu soạn sẵn' +
        (c.own ? ' · <em>' + c.own + ' câu thầy cô thêm</em>' : '') + (c.changed ? ' · ' + c.changed + ' câu đã sửa' : '') + (c.hidden ? ' · ' + c.hidden + ' câu đang ẩn' : '') + '</small></span><span class="go" aria-hidden="true">›</span></a>'; }).join('') + '</div>';
    $$('[data-g]', v).forEach(b => b.onclick = () => { gradeTab = Number(b.dataset.g); pgLessons(v, '', false); });
    $('#xlImport').onclick = () => importDialog(() => pgLessons(v));
  }

  /* ---------------- Một bài ---------------- */
  async function pgOne(v, t) {
    const draw = () => {
      const e = editOf(t.id), hidden = new Set(e.hidden);
      const rows = t.baiTap.map((b, i) => ({ key: String(i), q: e.edits[i] || b, hidden: hidden.has(String(i)), changed: !!e.edits[i], own: false }))
        .concat(e.added.map(a => ({ key: a.id, q: a, hidden: hidden.has(a.id), changed: false, own: true })));
      const group = loai => {
        const list = rows.filter(r => r.q.loai === loai);
        return '<section class="card section"><div class="card-head"><h2>' + KIEU[loai].icon + ' ' + KIEU[loai].ten + ' (' + list.filter(r => !r.hidden).length + ')</h2><button class="btn sm primary" data-add="' + loai + '">+ Thêm câu</button></div><p class="hint">' + KIEU[loai].mo + '.</p>' +
          (list.length ? '<ul class="q-list">' + list.map(r => '<li class="q-item' + (r.hidden ? ' off' : '') + '"><div class="q-body">' + preview(r.q) +
            '<p class="q-tags">' + (r.own ? '<span class="pill ok">Thầy cô thêm</span>' : r.changed ? '<span class="pill warn">Đã sửa</span>' : '') + (r.hidden ? '<span class="pill">Đang ẩn – học sinh không thấy</span>' : '') + '</p></div>' +
            '<div class="q-act"><button class="btn sm" data-edit="' + r.key + '">✏️ Sửa</button><button class="btn sm" data-hide="' + r.key + '">' + (r.hidden ? '👁 Hiện lại' : '🙈 Ẩn') + '</button>' +
            (r.own ? '<button class="btn sm danger" data-remove="' + r.key + '">Xoá</button>' : r.changed ? '<button class="btn sm" data-undo="' + r.key + '">↩ Về câu gốc</button>' : '') + '</div></li>').join('') + '</ul>' : '<div class="empty">Chưa có câu nào thuộc kiểu này.</div>') + '</section>';
      };
      const dirty = e.hidden.length || e.added.length || Object.keys(e.edits).length || e.noGen;
      v.innerHTML = '<p class="crumb"><a href="#bai-hoc">‹ Tất cả bài học</a></p><section class="card"><div class="card-head"><h2>' + esc(nameOf(t)) + '</h2><div class="actions">' + (dirty ? '<button class="btn sm" id="lsReset">↩ Trả bài về như ban đầu</button>' : '') + '<a class="btn sm primary" href="#giao-bai/' + t.id + '">📌 Giao bài này</a></div></div>' +
        '<p class="hint"><b>Mẹo học sinh được xem:</b> ' + t.quyTac.slice(0, 3).map(r => esc(r.replace(/\*\*/g, ''))).join(' · ') + '</p>' +
        '<label class="check"><input type="checkbox" id="lsGen"' + (e.noGen ? '' : ' checked') + '> Cho máy tạo thêm câu tương tự (đổi tên bạn nhỏ) để học sinh không học vẹt</label>' +
        '<p class="hint">Từ các câu dưới đây, web tự biến thành nhiều trò: xếp vào giỏ, ghép chữ, xếp thành câu, chọn câu đúng, sửa lỗi…</p></section>' +
        group('chon') + group('timLoi') + group('ngheViet');
      const save = async (next, msg) => { try { await saveEdit(t.id, next); toast(msg); draw(); } catch (err) { fail(err); } };
      $('#lsGen').onchange = ev => { const n = editOf(t.id); n.noGen = !ev.target.checked; save(n, 'Đã lưu.'); };
      if ($('#lsReset')) $('#lsReset').onclick = async () => { if (await confirmBox('Trả bài về như ban đầu?', 'Mọi câu thầy cô đã thêm, sửa, ẩn trong bài này sẽ bị bỏ.', 'Trả về ban đầu')) save({ hidden: [], edits: {}, added: [], noGen: false }, 'Đã trả bài về như ban đầu.'); };
      $$('[data-add]', v).forEach(b => b.onclick = () => sentenceForm(t, b.dataset.add, null, q => { const n = editOf(t.id); n.added.push(Object.assign({ id: newId() }, q)); return saveEdit(t.id, n).then(() => { toast('Đã thêm câu vào bài. Học sinh sẽ gặp câu này khi học bài.'); draw(); }); }));
      $$('[data-edit]', v).forEach(b => b.onclick = () => {
        const key = b.dataset.edit, row = rows.find(r => r.key === key);
        sentenceForm(t, row.q.loai, row.q, q => { const n = editOf(t.id); if (row.own) n.added = n.added.map(a => a.id === key ? Object.assign({ id: key }, q) : a); else n.edits[key] = q; return saveEdit(t.id, n).then(() => { toast('Đã lưu câu đã sửa.'); draw(); }); });
      });
      $$('[data-hide]', v).forEach(b => b.onclick = () => { const n = editOf(t.id), k = b.dataset.hide, off = n.hidden.includes(k); n.hidden = off ? n.hidden.filter(x => x !== k) : n.hidden.concat(k); save(n, off ? 'Đã hiện lại câu.' : 'Đã ẩn câu.'); });
      $$('[data-undo]', v).forEach(b => b.onclick = () => { const n = editOf(t.id); delete n.edits[b.dataset.undo]; save(n, 'Đã trở về câu gốc.'); });
      $$('[data-remove]', v).forEach(b => b.onclick = async () => { if (!await confirmBox('Xoá câu này?', 'Câu thầy cô thêm sẽ bị xoá hẳn.', 'Xoá')) return; const n = editOf(t.id), k = b.dataset.remove; n.added = n.added.filter(a => a.id !== k); n.hidden = n.hidden.filter(x => x !== k); save(n, 'Đã xoá câu.'); });
    };
    draw();
  }

  /* ---------------- Biểu mẫu một câu (nói theo cách của giáo viên) ---------------- */
  function sentenceForm(t, loai, q, onSave) {
    let fields = '';
    if (loai === 'chon') {
      const wrong = q ? q.luaChon.filter(o => o !== q.dapAn) : [];
      fields = '<label class="field"><span>1. Gõ câu và đánh dấu chỗ học sinh cần điền</span><input id="fDe" maxlength="200" value="' + esc(q ? q.de : '') + '" placeholder="Ví dụ: Bé đội ___ón khi ra nắng."></label>' +
        '<div><button type="button" class="btn sm" id="fBlank">➕ Chèn chỗ trống vào vị trí con trỏ</button></div>' +
        '<label class="field"><span>2. Đáp án đúng</span><input id="fDung" maxlength="40" value="' + esc(q ? q.dapAn : '') + '" placeholder="Ví dụ: n"></label>' +
        '<fieldset class="fs"><legend>3. Đáp án sai (ít nhất 1)</legend><div class="row">' + [0, 1, 2].map(i => '<input class="fSai" maxlength="40" aria-label="Đáp án sai ' + (i + 1) + '" value="' + esc(wrong[i] || '') + '" placeholder="' + (i === 0 ? 'Ví dụ: l' : 'Không bắt buộc') + '">').join('') + '</div></fieldset>';
    } else if (loai === 'timLoi') {
      const right = q ? q.cau.split(' ').map(w => stripWord(w) === q.tuSai ? w.replace(q.tuSai, q.tuDung) : w).join(' ') : '';
      fields = '<label class="field"><span>1. Gõ câu viết ĐÚNG</span><input id="fCau" maxlength="200" value="' + esc(right) + '" placeholder="Ví dụ: Chú chim sẻ đậu trên mái nhà."></label>' +
        '<div class="row"><label class="field"><span>2. Chữ nào trong câu sẽ bị viết sai?</span><input id="fDung" maxlength="30" value="' + esc(q ? q.tuDung : '') + '" placeholder="Ví dụ: sẻ"></label>' +
        '<label class="field"><span>3. Viết sai thành</span><input id="fSaiTu" maxlength="30" value="' + esc(q ? q.tuSai : '') + '" placeholder="Ví dụ: xẻ"></label></div>';
    } else fields = '<label class="field"><span>Gõ câu máy sẽ đọc cho học sinh viết lại</span><input id="fCau" maxlength="160" value="' + esc(q ? q.cau : '') + '" placeholder="Ví dụ: Bà kể chuyện cho cả nhà nghe."></label>';
    const d = dialog('<h2>' + KIEU[loai].icon + ' ' + (q ? 'Sửa câu' : 'Thêm câu') + ' – ' + KIEU[loai].ten + '</h2><p class="muted">' + esc(nameOf(t)) + '</p><form class="form" id="sf">' + fields +
      '<div class="pv"><b>Học sinh sẽ thấy:</b><div id="fPv"></div></div><p class="form-err" id="fErr" role="alert"></p><div class="actions"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">💾 Lưu câu</button></div></form>');
    const val = id => ($(id, d) ? $(id, d).value.normalize('NFC').trim().replace(/\s+/g, ' ') : '');
    function build() {
      if (loai === 'chon') {
        const de = val('#fDe').replace(/_{2,}/g, '___'), dapAn = val('#fDung'), sai = $$('.fSai', d).map(i => i.value.normalize('NFC').trim()).filter(Boolean);
        if (!de) throw Error('Thầy cô gõ câu hỏi nhé.');
        if (!de.includes('___')) throw Error('Đặt con trỏ vào chỗ học sinh cần điền rồi bấm “Chèn chỗ trống”.');
        if (!dapAn) throw Error('Thầy cô gõ đáp án đúng.');
        if (!sai.length || sai.includes(dapAn)) throw Error('Cần ít nhất 1 đáp án sai, khác đáp án đúng.');
        return { loai, de, dapAn, luaChon: [dapAn].concat(sai) };
      }
      if (loai === 'timLoi') {
        const dung = val('#fDung'), sai = val('#fSaiTu'), words = val('#fCau').split(' ');
        if (!val('#fCau')) throw Error('Thầy cô gõ câu viết đúng nhé.');
        if (!dung || !sai) throw Error('Thầy cô gõ chữ đúng và cách viết sai.');
        const hits = words.filter(w => stripWord(w) === dung).length;
        if (hits === 0) throw Error('Không thấy chữ “' + dung + '” trong câu. Thầy cô gõ đúng một chữ có trong câu nhé.');
        if (dung === sai) throw Error('Cách viết sai phải khác chữ đúng.');
        let done = false;
        return { loai, cau: words.map(w => { if (!done && stripWord(w) === dung) { done = true; return w.replace(dung, sai); } return w; }).join(' '), tuSai: sai, tuDung: dung };
      }
      const cau = val('#fCau'); if (cau.split(' ').length < 2) throw Error('Thầy cô gõ một câu có ít nhất 2 chữ.');
      return { loai, cau: /[.!?]$/.test(cau) ? cau : cau + '.' };
    }
    const refresh = () => { try { $('#fPv', d).innerHTML = preview(build()); $('#fErr', d).textContent = ''; } catch (e) { $('#fPv', d).innerHTML = '<span class="muted">' + esc(e.message) + '</span>'; } };
    d.querySelector('#sf').oninput = refresh; refresh();
    if ($('#fBlank', d)) $('#fBlank', d).onclick = () => { const i = $('#fDe', d), a = i.selectionStart == null ? i.value.length : i.selectionStart; i.value = i.value.slice(0, a) + '___' + i.value.slice(i.selectionEnd == null ? a : i.selectionEnd); i.focus(); refresh(); };
    $('#sf', d).onsubmit = async ev => { ev.preventDefault(); try { const item = build(); await onSave(item); d.close(); } catch (e) { $('#fErr', d).textContent = e.message; } };
  }

  /* ---------------- Nhập nhiều câu từ Excel ---------------- */
  const HEAD = ['Lớp', 'Bài số', 'Kiểu câu', 'Câu', 'Đáp án đúng', 'Đáp án sai 1', 'Đáp án sai 2'];
  const EXAMPLES = [
    ['2', '10', 'Điền chỗ trống', 'Bé đội ___ón khi ra nắng.', 'n', 'l', ''],
    ['2', '3', 'Tìm chữ sai', 'Chú chim sẻ đậu trên mái nhà.', 'sẻ', 'xẻ', ''],
    ['1', '1', 'Nghe viết', 'Bà kể chuyện cho cả nhà nghe.', '', '', '']
  ];
  function templateFile() {
    const list = [['Lớp', 'Bài số', 'Nội dung bài']].concat([1, 2, 3].flatMap(g => lessonsOf(g).map((t, i) => [String(g), String(i + 1), t.ten])));
    const guide = [['Cách điền (mỗi câu một dòng ở trang “Câu hỏi”)'], ['Lớp: 1, 2 hoặc 3.'], ['Bài số: xem trang “Danh sách bài”.'], ['Kiểu câu: Điền chỗ trống · Tìm chữ sai · Nghe viết.'],
      ['Điền chỗ trống: Câu có ___ ở chỗ cần điền; ghi đáp án đúng và 1–2 đáp án sai.'], ['Tìm chữ sai: Câu viết ĐÚNG; “Đáp án đúng” là chữ trong câu; “Đáp án sai 1” là cách viết sai.'], ['Nghe viết: chỉ cần cột Câu.'], ['Xoá 3 dòng ví dụ trước khi tải lên (hoặc sửa thành câu của thầy cô).']];
    return Excel.build([{ name: 'Câu hỏi', rows: [HEAD].concat(EXAMPLES), widths: [7, 8, 17, 50, 16, 15, 15] }, { name: 'Danh sách bài', rows: list, widths: [7, 8, 40] }, { name: 'Hướng dẫn', rows: guide, widths: [90] }]);
  }
  const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]/g, '');
  function parseRows(rows) {
    const out = [];
    rows.forEach((r, index) => {
      const c = r.map(x => String(x == null ? '' : x).normalize('NFC').trim().replace(/\s+/g, ' '));
      if (!c.some(Boolean)) return;
      if (fold(c[0]) === 'lop' || /^cachdien/.test(fold(c[0]))) return;
      const line = index + 1;
      try {
        const g = Number((c[0].match(/[123]/) || [])[0]), no = Number((c[1].match(/\d+/) || [])[0]);
        if (!g) throw Error('Cột Lớp cần là 1, 2 hoặc 3');
        const t = no ? lessonsOf(g)[no - 1] : lessonsOf(g).find(x => fold(x.ten) === fold(c[1]));
        if (!t) throw Error('Không tìm thấy bài số “' + c[1] + '” của lớp ' + g);
        const kind = fold(c[2]), loai = /dien|chontu|chochon/.test(kind) ? 'chon' : /sai|loi/.test(kind) ? 'timLoi' : /nghe/.test(kind) ? 'ngheViet' : '';
        if (!loai) throw Error('Cột Kiểu câu cần là: Điền chỗ trống, Tìm chữ sai hoặc Nghe viết');
        const cau = c[3]; if (!cau) throw Error('Thiếu cột Câu');
        let item;
        if (loai === 'chon') {
          const de = cau.replace(/_{2,}|\.{3,}|…/, '___'), sai = [c[5], c[6]].filter(Boolean);
          if ((de.match(/___/g) || []).length !== 1) throw Error('Câu cần đúng một chỗ trống ___');
          if (de.startsWith('___')) throw Error('Đừng để chỗ trống ở đầu câu');
          if (!c[4] || !sai.length || sai.includes(c[4])) throw Error('Cần đáp án đúng và ít nhất 1 đáp án sai khác nó');
          item = { loai, de, dapAn: c[4], luaChon: [...new Set([c[4]].concat(sai))] };
        } else if (loai === 'timLoi') {
          const dung = c[4], sai = c[5], words = cau.split(' ');
          if (!dung || !sai || dung === sai) throw Error('Cần chữ đúng (cột Đáp án đúng) và cách viết sai (cột Đáp án sai 1)');
          if (!words.some(w => stripWord(w) === dung)) throw Error('Không thấy chữ “' + dung + '” trong câu');
          let done = false;
          item = { loai, cau: words.map(w => { if (!done && stripWord(w) === dung) { done = true; return w.replace(dung, sai); } return w; }).join(' '), tuSai: sai, tuDung: dung };
        } else { if (cau.split(' ').length < 2) throw Error('Câu nghe viết cần ít nhất 2 chữ'); item = { loai, cau: /[.!?]$/.test(cau) ? cau : cau + '.' }; }
        out.push({ line, t, item });
      } catch (e) { out.push({ line, error: e.message, raw: c.filter(Boolean).join(' · ') }); }
    });
    return out;
  }
  function importDialog(done) {
    const d = dialog('<h2>📥 Thêm nhiều câu từ Excel</h2><ol class="steps"><li><b>Tải tệp mẫu</b> rồi mở bằng Excel (có sẵn danh sách bài và 3 câu ví dụ).<br><button type="button" class="btn sm" id="imTpl">⬇️ Tải tệp mẫu Excel</button></li>' +
      '<li><b>Điền mỗi câu một dòng</b>, lưu lại như bình thường.</li><li><b>Chọn tệp vừa lưu</b>:<br><label class="btn sm primary">📂 Chọn tệp Excel<input type="file" id="imFile" accept=".xlsx" hidden></label></li></ol>' +
      '<details><summary>Hoặc dán trực tiếp từ Excel</summary><label class="field"><span>Bôi đen các dòng trong Excel (đủ cột như tệp mẫu) → Copy → dán vào đây</span><textarea id="imPaste" rows="4"></textarea></label><button type="button" class="btn sm" id="imPasteBtn">Xem trước</button></details>' +
      '<div id="imOut" aria-live="polite"></div><div class="actions"><button type="button" class="btn" data-close>Đóng</button><button type="button" class="btn primary" id="imSave" hidden></button></div>');
    let good = [];
    const show = rows => {
      const parsed = parseRows(rows); good = parsed.filter(x => !x.error); const bad = parsed.filter(x => x.error);
      $('#imOut', d).innerHTML = (parsed.length ? '<p><b>' + good.length + ' câu dùng được</b>' + (bad.length ? ' · <span class="bad-text">' + bad.length + ' dòng cần sửa</span>' : '') + '</p>' : '<p class="bad-text">Không đọc được câu nào. Thầy cô kiểm tra lại các cột như tệp mẫu.</p>') +
        (bad.length ? '<ul class="list">' + bad.slice(0, 30).map(x => '<li><span><b>Dòng ' + x.line + ':</b> ' + esc(x.error) + '<br><small class="muted">' + esc(x.raw) + '</small></span></li>').join('') + '</ul>' : '') +
        (good.length ? '<ul class="q-list compact">' + good.slice(0, 60).map(x => '<li class="q-item"><div class="q-body"><small class="muted">' + esc(nameOf(x.t)) + ' · ' + KIEU[x.item.loai].ten + '</small>' + preview(x.item) + '</div></li>').join('') + '</ul>' : '');
      const btn = $('#imSave', d); btn.hidden = !good.length; btn.textContent = '✅ Thêm ' + good.length + ' câu vào bài học';
    };
    $('#imTpl', d).onclick = () => download('mau-cau-hoi-vuon-chu.xlsx', templateFile());
    $('#imFile', d).onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try { if (!/\.xlsx$/i.test(f.name)) throw Error('Thầy cô chọn tệp Excel đuôi .xlsx (tệp mẫu).'); if (f.size > 3e6) throw Error('Tệp quá lớn (tối đa 3 MB).'); show(await Excel.read(await f.arrayBuffer())); }
      catch (err) { $('#imOut', d).innerHTML = '<p class="bad-text">' + esc(err.message) + '</p>'; $('#imSave', d).hidden = true; }
    };
    $('#imPasteBtn', d).onclick = () => show($('#imPaste', d).value.split(/\r?\n/).map(l => l.split('\t')));
    $('#imSave', d).onclick = async () => {
      const btn = $('#imSave', d); btn.disabled = true;
      try {
        await loadEdits();
        const byLesson = new Map(); good.forEach(x => { if (!byLesson.has(x.t.id)) byLesson.set(x.t.id, []); byLesson.get(x.t.id).push(x.item); });
        for (const [id, items] of byLesson) {
          const e = editOf(id), seen = new Set(e.added.map(a => JSON.stringify(Object.assign({}, a, { id: undefined }))));
          items.forEach(it => { const key = JSON.stringify(Object.assign({}, it, { id: undefined })); if (!seen.has(key)) { seen.add(key); e.added.push(Object.assign({ id: newId() }, it)); } });
          await saveEdit(id, e);
        }
        d.close(); toast('Đã thêm ' + good.length + ' câu vào ' + byLesson.size + ' bài.'); done();
      } catch (err) { fail(err); btn.disabled = false; }
    };
  }

  /* ---------------- Giao bài ---------------- */
  const dayText = d => { if (!d) return 'Không đặt hạn'; const [y, m, day] = d.split('-').map(Number); return 'Hạn ' + day + '/' + m + '/' + y; };
  const doneOf = (s, a) => (s.history || []).reduce((best, h) => {
    const matches = h.kind === 'lesson' && h.topic === a.topic && (h.assignmentId === a.id ||
      (!a.explicitSubmission && !h.assignmentId && (h.at || 0) >= a.createdAt));
    return matches && (!best || h.acc > best.acc) ? h : best;
  }, null);
  async function pgAssign(v, sub) {
    const [classes, students] = await Promise.all([load('classes', true), load('students', true)]);
    const list = (await api('/api/assignments')).assignments || [];
    const pre = sub && lessonById(sub) ? lessonById(sub) : null;
    const tomorrow = new Date(Date.now() + 3 * 864e5), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const lessonOpts = sel => [1, 2, 3].map(g => '<optgroup label="Lớp ' + g + '">' + lessonsOf(g).map((t, i) => '<option value="' + t.id + '"' + (sel === t.id ? ' selected' : '') + '>Bài ' + (i + 1) + ': ' + esc(t.ten) + '</option>').join('') + '</optgroup>').join('');
    v.innerHTML = G.storageWarn() + (classes.length ? '<section class="card"><h2>📌 Giao bài mới</h2><form id="asForm" class="form"><fieldset class="fs"><legend>1. Giao cho lớp nào?</legend><div class="chips">' +
      classes.map(c => '<label class="chip-check"><input type="checkbox" name="asClass" value="' + esc(c.code) + '"' + (classes.length === 1 ? ' checked' : '') + '><span>' + esc(c.name || c.code) + '</span></label>').join('') + '</div></fieldset>' +
      '<div class="row"><label class="field"><span>2. Bài nào?</span><select id="asTopic">' + lessonOpts(pre ? pre.id : lessonsOf(classes[0].grade || 2)[0].id) + '</select></label><label class="field"><span>3. Hạn nộp</span><input type="date" id="asDue" value="' + iso(tomorrow) + '" min="' + iso(new Date()) + '"></label></div>' +
      '<label class="field"><span>4. Lời dặn (không bắt buộc)</span><input id="asNote" maxlength="200" placeholder="Ví dụ: Em làm mức Vừa trước giờ học thứ Sáu nhé."></label><p class="form-err" id="asErr" role="alert"></p><div class="actions"><button class="btn primary">📌 Giao bài</button></div></form>' +
      '<p class="hint">Học sinh đã nhập mã lớp sẽ thấy bài ở đầu Trang học, mục <b>Bài thầy cô giao</b>.</p></section>'
      : '<div class="okbox">Trước tiên thầy cô <a href="#lop">tạo lớp</a> và cho học sinh nhập mã lớp, rồi quay lại giao bài.</div>') +
      '<section class="card section"><div class="card-head"><h2>Bài đã giao (' + list.length + ')</h2><button type="button" class="btn sm" id="asRefresh">↻ Làm mới điểm</button></div><p class="hint">Điểm và số học sinh đã làm tự cập nhật. Mỗi bài hiện điểm cao nhất của từng em.</p><div id="asList"></div></section>';
    const results = $('#asList', v);
    function drawScores(rows) {
      const expanded = new Set($$('details[open]', results).map(detail => detail.dataset.assignment));
      results.innerHTML = list.length ? '<ul class="q-list">' + list.map(a => {
        const t = lessonById(a.topic), kids = rows.filter(s => s.classCode === a.classCode), done = kids.map(s => ({ s, h: doneOf(s, a) })), n = done.filter(x => x.h).length;
        return '<li class="q-item"><div class="q-body"><b>' + esc(t ? nameOf(t) : a.topic) + '</b><br><span class="muted">' + esc(className(a.classCode)) + ' · ' + dayText(a.due) + (a.note ? ' · “' + esc(a.note) + '”' : '') + '</span>' +
          '<div class="bar wide" title="' + n + '/' + kids.length + '"><i style="width:' + pct(n, kids.length) + '%"></i></div><small><b>' + n + '/' + kids.length + '</b> em đã làm</small>' +
          '<details data-assignment="' + esc(a.id) + '"' + (expanded.has(a.id) ? ' open' : '') + '><summary>Xem ai đã làm, ai chưa</summary><ul class="list">' + (kids.length ? done.sort((x, y) => (x.h ? 1 : 0) - (y.h ? 1 : 0)).map(x => '<li><span>' + esc(x.s.avatar || '') + ' ' + esc(x.s.name) + '</span>' + (x.h ? '<span class="pill ' + (x.h.acc >= 80 ? 'ok' : x.h.acc >= 60 ? '' : 'bad') + '">Đúng ' + x.h.acc + '%' + (x.h.total ? ' · ' + x.h.correct + '/' + x.h.total : '') + '</span>' : '<span class="pill warn">Chưa làm</span>') + '</li>').join('') : '<li>Lớp chưa có học sinh kết nối.</li>') + '</ul></details></div>' +
          '<div class="q-act"><button class="btn sm danger" data-asdel="' + a.id + '">Thu hồi</button></div></li>';
      }).join('') + '</ul>' : '<div class="empty">Chưa giao bài nào.</div>';
      $$('[data-asdel]', results).forEach(b => b.onclick = async () => { if (!await confirmBox('Thu hồi bài này?', 'Học sinh sẽ không còn thấy bài trong mục được giao. Kết quả đã làm vẫn được giữ.', 'Thu hồi')) return; try { await api('/api/assignments/' + b.dataset.asdel, { method: 'DELETE' }); toast('Đã thu hồi.'); pgAssign(v, sub); } catch (err) { fail(err); } });
    }
    drawScores(students);
    $('#asRefresh', v).onclick = G.watchStudents(results, students, drawScores);
    if ($('#asForm')) $('#asForm').onsubmit = async e => {
      e.preventDefault();
      const classCodes = $$('[name=asClass]:checked', v).map(i => i.value);
      if (!classCodes.length) { $('#asErr').textContent = 'Thầy cô chọn ít nhất một lớp.'; return; }
      const button = $('#asForm button', v);
      button.disabled = true;
      try { await send('/api/assignments', 'POST', { classCodes, topic: $('#asTopic').value, due: $('#asDue').value, note: $('#asNote').value }); toast('Đã giao bài.'); if (sub) location.hash = 'giao-bai'; else await pgAssign(v); }
      catch (err) { $('#asErr').textContent = err.message; }
      finally { button.disabled = false; }
    };
  }

  G.register('bai-hoc', 'Bài học', pgLessons);
  G.register('giao-bai', 'Giao bài', pgAssign);
  window.GVBaiHoc = { parseRows, templateFile };
})();
