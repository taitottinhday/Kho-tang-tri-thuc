/* Sổ nhận xét – Claude (đợt 24).
   Gợi ý lời nhận xét môn Tiếng Việt (phần chính tả) theo tinh thần Thông tư 27/2020: mức Hoàn thành tốt / Hoàn thành /
   Chưa hoàn thành, nêu điều em làm được và điều cần cố gắng, lời lẽ tích cực. Gợi ý dựa trên kết quả luyện tập trên web;
   thầy cô đọc, sửa rồi mới chép vào học bạ. Lưu theo lớp + đợt trên máy chủ, xuất Excel, in. */
'use strict';
(function () {
  const G = window.GV;
  const { $, $$, esc, api, send, toast, fail, load, download, pageHead, scopeLabel, summary, lessonById, avatar, fmtDate } = G;
  const PERIODS = { gk1: 'Giữa học kì I', ck1: 'Cuối học kì I', gk2: 'Giữa học kì II', ck2: 'Cuối học kì II', thang: 'Nhận xét tháng' };
  const LEVELS = { T: 'Hoàn thành tốt', H: 'Hoàn thành', C: 'Chưa hoàn thành', '': 'Chưa đủ dữ liệu' };
  /* đợt mặc định theo tháng của năm học */
  const defaultPeriod = () => { const m = new Date().getMonth() + 1; return m >= 8 && m <= 11 ? 'gk1' : m === 12 || m === 1 ? 'ck1' : m >= 2 && m <= 3 ? 'gk2' : 'ck2'; };

  /* Ngân hàng câu: mỗi mức nhiều cách nói để nhận xét cả lớp không giống hệt nhau. {tot} = bài em làm tốt, {yeu} = bài cần luyện. */
  const BANK = {
    T: [
      'Em viết đúng chính tả, trình bày sạch đẹp. Em nắm chắc quy tắc {tot}.',
      'Em chăm luyện tập, viết đúng và nhanh. Em phân biệt tốt {tot}.',
      'Em có ý thức tự học tốt, ít mắc lỗi chính tả, đặc biệt vững phần {tot}.',
      'Em viết chính tả chính xác, cẩn thận. Tiếp tục phát huy em nhé.'
    ],
    H: [
      'Em viết đúng phần lớn các từ, phân biệt được {tot}. Em cần luyện thêm {yeu}.',
      'Em có tiến bộ trong viết chính tả. Em chú ý hơn khi viết {yeu}.',
      'Em hoàn thành các bài luyện chính tả. Em cần đọc kĩ và luyện thêm {yeu}.',
      'Em viết khá đúng chính tả, nắm được {tot}; cần cẩn thận hơn với {yeu}.'
    ],
    C: [
      'Em còn mắc lỗi khi viết {yeu}. Em cần đọc kĩ từ trước khi viết và luyện thêm mỗi ngày.',
      'Em cần cố gắng hơn trong viết chính tả, nhất là {yeu}. Cô sẽ cùng em luyện thêm.',
      'Em chưa nắm chắc cách viết {yeu}. Em luyện đều đặn mỗi ngày để tiến bộ hơn nhé.'
    ],
    '': ['Em chưa luyện đủ bài trên Vườn Chữ để có gợi ý. Thầy cô nhận xét theo quá trình học trên lớp.']
  };
  const IDLE_NOTE = ' Em nhớ luyện tập đều đặn hơn mỗi tuần.';

  /* chọn mức theo tỉ lệ đúng và số câu đã làm (ngưỡng thận trọng – thầy cô có thể đổi) */
  function levelOf(s) {
    const m = summary(s);
    if ((s.attempts || 0) < 10) return '';
    if (m.acc >= 85 && m.done >= 2) return 'T';
    if (m.acc >= 60) return 'H';
    return 'C';
  }
  const shortName = t => t ? t.ten : '';
  function topicsOf(s) {
    const list = Object.entries(s.topics || {}).map(([id, x]) => ({ t: lessonById(id), acc: x.attempts ? x.correct / x.attempts : 0, n: x.attempts || 0 })).filter(r => r.t && r.n >= 4);
    const best = list.filter(r => r.acc >= .8).sort((a, b) => b.acc - a.acc || b.n - a.n).slice(0, 2).map(r => shortName(r.t));
    const weak = list.filter(r => r.acc < .75).sort((a, b) => a.acc - b.acc).slice(0, 2).map(r => shortName(r.t));
    return { best, weak };
  }
  const join = arr => arr.length > 1 ? arr.slice(0, -1).join(', ') + ' và ' + arr[arr.length - 1] : arr[0] || '';
  function suggest(s, variant = 0) {
    const lv = levelOf(s), { best, weak } = topicsOf(s);
    let bank = BANK[lv];
    if (lv === 'T') bank = best.length ? bank : [bank[3]];
    if (lv === 'H') bank = weak.length ? (best.length ? bank : bank.slice(1, 3)) : ['Em hoàn thành các bài luyện chính tả, viết khá đúng và cẩn thận.', 'Em viết đúng phần lớn các từ đã học. Em cố gắng viết cẩn thận hơn nữa nhé.'];
    if (lv === 'C') bank = weak.length ? bank : ['Em cần cố gắng hơn trong viết chính tả. Em đọc kĩ từ trước khi viết và luyện thêm mỗi ngày nhé.'];
    let text = bank[(hash(s.id) + variant) % bank.length].replace('{tot}', join(best) || 'các bài đã học').replace('{yeu}', join(weak) || 'các bài còn sai');
    if (lv && summary(s).idle >= 14 && summary(s).idle !== Infinity) text += IDLE_NOTE;
    return text;
  }
  function hash(v) { let h = 0; for (const ch of String(v)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h; }

  let state = { cls: '', period: defaultPeriod() };

  async function page(v) {
    const [classes, students] = await Promise.all([load('classes', true), load('students', true)]);
    if (!classes.length) {
      v.innerHTML = pageHead(scopeLabel(), 'Sổ nhận xét', 'Gợi ý lời nhận xét chính tả cho từng học sinh.') + '<div class="empty">Chưa có lớp nào. Tạo lớp ở mục <a href="#lop">Lớp học</a> để bắt đầu.</div>';
      return;
    }
    if (!classes.some(c => c.code === state.cls)) state.cls = classes[0].code;
    v.innerHTML = pageHead(scopeLabel(), 'Sổ nhận xét', 'Gợi ý lời nhận xét môn Tiếng Việt (phần chính tả) dựa trên kết quả luyện tập. Thầy cô đọc, chỉnh sửa rồi lưu, xuất Excel để chép vào học bạ.',
      '<button class="btn" type="button" id="nxPrint">In</button><button class="btn" type="button" id="nxExcel">Xuất Excel</button><button class="btn primary" type="button" id="nxSave">Lưu sổ</button>') +
      '<div class="toolbar filter-bar nx-bar"><label class="field"><span>Lớp</span><select id="nxCls">' + classes.map(c => '<option value="' + esc(c.code) + '"' + (c.code === state.cls ? ' selected' : '') + '>' + esc(c.name || c.code) + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Đợt nhận xét</span><select id="nxPeriod">' + Object.entries(PERIODS).map(([k, n]) => '<option value="' + k + '"' + (k === state.period ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
      '<div class="nx-bar-end"><button class="btn" type="button" id="nxFill">Điền gợi ý cho ô trống</button></div></div>' +
      '<p class="nx-note">Mức đánh giá tính tự động: <b>Hoàn thành tốt</b> khi đúng từ 85% trở lên, <b>Hoàn thành</b> từ 60%, dưới 60% là <b>Chưa hoàn thành</b>, chỉ tính khi em đã làm ít nhất 10 câu. Đây là gợi ý từ phần luyện chính tả trên web, chưa phải kết quả đánh giá môn học.</p>' +
      '<div id="nxSummary" class="nx-summary"></div><div id="nxBody"></div>';
    let book = null, dirty = false, rows = [];
    const status = msg => { $('#nxSummary').querySelector('.nx-status').textContent = msg; };
    async function open() {
      state = { cls: $('#nxCls').value, period: $('#nxPeriod').value };
      $('#nxBody').innerHTML = '<p class="muted">Đang tải sổ…</p>';
      try { book = (await api('/api/comment-books/' + state.cls + '/' + state.period)).book; } catch (e) { fail(e); book = null; }
      rows = students.filter(s => s.classCode === state.cls).sort((a, b) => String(a.name).split(' ').pop().localeCompare(String(b.name).split(' ').pop(), 'vi') || String(a.name).localeCompare(b.name, 'vi'))
        .map(s => ({ s, lv: levelOf(s), text: (book && book.comments[s.id]) || '', variant: 0 }));
      dirty = false; draw();
    }
    function draw() {
      const count = k => rows.filter(r => r.lv === k).length, written = rows.filter(r => r.text.trim()).length;
      $('#nxSummary').innerHTML = ['T', 'H', 'C', ''].map(k => '<span class="nx-chip lv-' + (k || 'none') + '"><b>' + count(k) + '</b>' + LEVELS[k] + '</span>').join('') +
        '<span class="nx-status" role="status">' + (book ? 'Lưu lần cuối ' + fmtDate(book.savedAt) + ' · ' : 'Chưa lưu · ') + written + '/' + rows.length + ' em đã có nhận xét</span>';
      $('#nxBody').innerHTML = rows.length ? '<div class="table-wrap"><table class="nx-table"><thead><tr><th class="num">STT</th><th>Học sinh</th><th>Mức gợi ý</th><th>Số liệu</th><th>Nhận xét</th></tr></thead><tbody>' + rows.map((r, i) => {
        const m = summary(r.s);
        return '<tr><td class="num" data-label="STT">' + (i + 1) + '</td><td class="nx-who"><div class="who">' + avatar(r.s.name) + '<span class="who-name">' + esc(r.s.name) + '</span></div></td>' +
          '<td data-label="Mức gợi ý"><span class="lv lv-' + (r.lv || 'none') + '">' + LEVELS[r.lv] + '</span></td>' +
          '<td class="nx-num" data-label="Số liệu">' + (r.s.attempts ? m.acc + '% đúng · ' + m.done + '/' + m.total + ' bài' : 'Chưa luyện') + '</td>' +
          '<td class="nx-text"><textarea rows="2" maxlength="500" data-i="' + i + '" aria-label="Nhận xét cho ' + esc(r.s.name) + '" placeholder="Bấm “Gợi ý” hoặc tự viết nhận xét">' + esc(r.text) + '</textarea>' +
          '<div class="nx-row-act"><button type="button" class="btn sm" data-sug="' + i + '">' + (r.text ? 'Gợi ý khác' : 'Gợi ý') + '</button><small data-len="' + i + '">' + r.text.length + '/500</small></div></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty">Lớp này chưa có học sinh kết nối.</div>';
    }
    $('#nxBody').addEventListener('input', e => {
      const box = e.target.closest('textarea[data-i]'); if (!box) return;
      const r = rows[box.dataset.i]; r.text = box.value; dirty = true;
      $('[data-len="' + box.dataset.i + '"]', v).textContent = box.value.length + '/500';
      status('Có thay đổi chưa lưu');
    });
    $('#nxBody').addEventListener('click', e => {
      const b = e.target.closest('[data-sug]'); if (!b) return;
      const r = rows[b.dataset.sug];
      if (r.text) r.variant++;
      r.text = suggest(r.s, r.variant); dirty = true;
      const box = $('textarea[data-i="' + b.dataset.sug + '"]', v); box.value = r.text;
      $('[data-len="' + b.dataset.sug + '"]', v).textContent = r.text.length + '/500';
      b.textContent = 'Gợi ý khác'; status('Có thay đổi chưa lưu');
    });
    $('#nxFill').onclick = () => { let n = 0; rows.forEach(r => { if (!r.text.trim()) { r.text = suggest(r.s); n++; } }); if (n) { dirty = true; draw(); status('Đã điền ' + n + ' gợi ý – chưa lưu'); } else toast('Em nào cũng đã có nhận xét.'); };
    $('#nxSave').onclick = async () => {
      const btn = $('#nxSave'); btn.disabled = true;
      try {
        const comments = Object.fromEntries(rows.filter(r => r.text.trim()).map(r => [r.s.id, r.text.trim()]));
        book = (await send('/api/comment-books/' + state.cls + '/' + state.period, 'PUT', { comments })).book;
        dirty = false; draw(); toast('Đã lưu sổ nhận xét ' + PERIODS[state.period].toLowerCase() + '.');
      } catch (e) { fail(e); } finally { btn.disabled = false; }
    };
    const cls = () => (G.classOf(state.cls) || {}).name || state.cls;
    $('#nxExcel').onclick = () => {
      const data = [['STT', 'Họ và tên', 'Mức gợi ý', 'Tỉ lệ đúng', 'Bài đã xong', 'Nhận xét']].concat(rows.map((r, i) => { const m = summary(r.s); return [i + 1, r.s.name, LEVELS[r.lv], r.s.attempts ? m.acc + '%' : '', m.done + '/' + m.total, r.text]; }));
      download('so-nhan-xet-' + cls().replace(/\s+/g, '-') + '-' + state.period + '.xlsx', Excel.build([{ name: PERIODS[state.period].slice(0, 30), rows: data, widths: [6, 28, 18, 11, 12, 80] }]));
    };
    $('#nxPrint').onclick = () => {
      $('#printArea').innerHTML = '<div class="report"><h1>Sổ nhận xét chính tả – ' + esc(cls()) + '</h1><p>' + esc(PERIODS[state.period]) + ' · In ngày ' + fmtDate(Date.now()) + '</p><table><thead><tr><th>STT</th><th>Họ và tên</th><th>Mức</th><th>Nhận xét</th></tr></thead><tbody>' +
        rows.map((r, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(r.s.name) + '</td><td>' + LEVELS[r.lv] + '</td><td>' + esc(r.text) + '</td></tr>').join('') + '</tbody></table><p class="sign">Giáo viên chủ nhiệm</p></div>';
      setTimeout(() => print(), 60);
    };
    const ask = async () => !dirty || await G.confirmBox('Bỏ thay đổi chưa lưu?', 'Các nhận xét vừa sửa chưa được lưu.', 'Bỏ thay đổi');
    let last = { cls: state.cls, period: state.period };
    const change = async () => { if (!await ask()) { $('#nxCls').value = last.cls; $('#nxPeriod').value = last.period; return; } last = { cls: $('#nxCls').value, period: $('#nxPeriod').value }; open(); };
    $('#nxCls').onchange = change; $('#nxPeriod').onchange = change;
    const guard = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    addEventListener('beforeunload', guard);
    const stop = () => { if (!v.isConnected || location.hash.slice(1).split('/')[0] !== 'nhan-xet') { removeEventListener('beforeunload', guard); removeEventListener('hashchange', stop); } };
    addEventListener('hashchange', stop);
    await open();
  }
  G.register('nhan-xet', 'Sổ nhận xét', page);
  window.SoNhanXet = { suggest, levelOf };
})();
