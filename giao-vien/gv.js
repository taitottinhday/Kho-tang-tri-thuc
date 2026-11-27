/* Trang giáo viên – Claude Code (đợt 16). Luồng riêng cho thầy cô: đăng nhập → Tổng quan · Lớp học · Học sinh ·
   Tài liệu · Câu hỏi · Chương trình · Hướng dẫn. Dữ liệu lấy từ máy chủ (server/api.js, PostgreSQL trên Railway).
   Mật khẩu là biến TEACHER_PASSWORD trên Railway; phiên đăng nhập dùng chung với Góc thầy cô (sessionStorage). */
'use strict';
(function () {
  const TOKEN_KEY = 'vuonchu.teacherToken';
  const BANK = window.NGAN_HANG_CHINH_TA || { chuDe: [] };
  const LESSONS = BANK.chuDe.filter(t => t.lop[0] <= 3);
  const lessonsOf = g => LESSONS.filter(t => t.lop[0] <= g && g <= t.lop[1]);
  const lessonById = id => BANK.chuDe.find(t => t.id === id);
  const TYPES = { choice: 'Chọn cách viết đúng', fill: 'Điền chữ còn thiếu', picture: 'Nhìn tranh chọn từ', listen: 'Nghe – viết từ ngữ', order: 'Xếp tiếng thành cụm từ', sort: 'Chọn nhóm chính tả' };
  const PICTURES = { '1f414': 'gà', '1f407': 'thỏ', '1f986': 'vịt', '1f422': 'rùa', '1f43f': 'sóc', '1f33b': 'hoa hướng dương', '1f34e': 'táo', '1f4da': 'sách' };
  const PAGES = { 'tong-quan': 'Tổng quan', 'giao-bai': 'Giao bài', lop: 'Lớp học', 'goi-ten': 'Gọi tên', 'hoc-sinh': 'Học sinh', 'bai-hoc': 'Bài học', 'cau-do': 'Câu đố luyện thêm', 'tai-lieu': 'Tài liệu', 'huong-dan': 'Trợ giúp' };
  const EXTRA = {}; // trang do tệp khác đăng ký (bai-hoc.js)
  const MAX_DOC = 10 * 1024 * 1024;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const fmtDate = v => { const d = new Date(v); return isNaN(d) ? '—' : d.toLocaleDateString('vi-VN'); };
  const parseDay = k => { const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(k || ''); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; };
  const daysAgo = k => { const d = parseDay(k); if (!d) return Infinity; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((t - d) / 864e5); };
  const dayLabel = k => { const d = parseDay(k); return d ? d.getDate() + '/' + (d.getMonth() + 1) : k; };
  const lastLabel = k => { const n = daysAgo(k); return n === Infinity ? 'Chưa học' : n === 0 ? 'Hôm nay' : n === 1 ? 'Hôm qua' : n + ' ngày trước'; };

  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let status = { storage: 'file' };
  let cache = { classes: null, students: null, docs: null, questions: null };
  let studentFilter = { cls: '', q: '', sort: 'name' };
  let stopStudentWatch;

  /* ---------------- API ---------------- */
  async function api(url, opt = {}) {
    const r = await fetch(url, { ...opt, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
    const ct = r.headers.get('content-type') || '';
    const body = ct.includes('json') ? await r.json() : await r.blob();
    if (r.status === 401 && token) { logout(true); throw Error('Phiên đăng nhập đã hết hạn. Thầy cô đăng nhập lại nhé.'); }
    if (!r.ok) throw Error((body && body.error) || 'Máy chủ chưa phản hồi (mã ' + r.status + ').');
    return body;
  }
  const send = (url, method, body) => api(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function load(key, force) {
    if (cache[key] && !force) return cache[key];
    if (key === 'classes') cache.classes = (await api('/api/classes')).classes || [];
    if (key === 'students') cache.students = (await api('/api/students')).students || [];
    if (key === 'docs') cache.docs = (await api('/api/docs')).documents || [];
    if (key === 'questions') cache.questions = (await api('/api/questions')).questions || [];
    return cache[key];
  }

  /* ---------------- Thông báo, hộp thoại ---------------- */
  let toastT = 0;
  function toast(msg, bad) { const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, bad ? 5000 : 2600); }
  function dialog(html) { $('#dlgBody').innerHTML = html; const d = $('#dlg'); if (!d.open) d.showModal(); $$('[data-close]', d).forEach(b => b.onclick = () => d.close()); return d; }
  function confirmBox(title, text, okLabel) {
    return new Promise(res => {
      const d = dialog('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="actions"><button class="btn" data-close>Huỷ</button><button class="btn danger" id="cfOk">' + esc(okLabel || 'Xoá') + '</button></div>');
      $('#cfOk').onclick = () => { d.close(); res(true); };
      d.addEventListener('close', () => res(false), { once: true });
    });
  }
  const fail = e => toast(e.message || String(e), true);

  /* ---------------- Đăng nhập ---------------- */
  async function boot() {
    try { status = await api('/api/status'); } catch (e) { status = { storage: 'offline' }; }
    const note = status.storage === 'offline' ? '⚠️ Chưa kết nối được máy chủ. Thầy cô kiểm tra mạng rồi tải lại trang.' : '';
    $('#storageNote').textContent = note;
    const b = $('#storageBadge');
    b.className = 'badge ' + (status.storage === 'postgres' ? 'ok' : 'warn');
    b.textContent = status.storage === 'postgres' ? '● Dữ liệu được lưu an toàn' : status.storage === 'file' ? '● Dữ liệu đang lưu tạm' : '● Mất kết nối';
    if (token) { try { await load('classes', true); return showApp(); } catch (e) { /* hết hạn */ } }
    showLogin();
  }
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; setTimeout(() => $('#loginPass').focus(), 50); }
  function showApp() { $('#login').hidden = true; $('#app').hidden = false; route(); }
  $('#loginForm').onsubmit = async e => {
    e.preventDefault(); const btn = $('#loginBtn'); btn.disabled = true; $('#loginErr').textContent = '';
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#loginPass').value }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(body.error || 'Không đăng nhập được.');
      token = body.token; sessionStorage.setItem(TOKEN_KEY, token); $('#loginPass').value = '';
      cache = { classes: null, students: null, docs: null, questions: null };
      showApp();
    } catch (err) { $('#loginErr').textContent = err.message; }
    finally { btn.disabled = false; }
  };
  function logout(expired) { stopStudentWatch?.(); token = ''; sessionStorage.removeItem(TOKEN_KEY); cache = { classes: null, students: null, docs: null, questions: null }; showLogin(); if (expired) $('#loginErr').textContent = 'Phiên đăng nhập đã hết hạn. Thầy cô đăng nhập lại nhé.'; }
  $('#logout').onclick = () => logout(false);

  /* ---------------- Điều hướng ---------------- */
  function route() {
    stopStudentWatch?.();
    const [first, sub] = location.hash.slice(1).split('/');
    const page = PAGES[first] ? first : 'tong-quan';
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === (page === 'cau-do' ? 'bai-hoc' : page)));
    const on = $('#nav a.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    $('#pageTitle').textContent = PAGES[page];
    document.title = PAGES[page] + ' · Trang giáo viên';
    const v = $('#view'); v.innerHTML = '<p class="muted">Đang tải…</p>';
    (EXTRA[page] || { 'tong-quan': pgOverview, lop: pgClasses, 'hoc-sinh': pgStudents, 'tai-lieu': pgDocs, 'cau-do': pgQuestions, 'huong-dan': pgGuide }[page])(v, sub)
      .catch(e => { v.innerHTML = '<div class="warnbox">' + esc(e.message) + '</div>'; });
  }
  addEventListener('hashchange', () => { if (!$('#app').hidden) route(); });
  const storageWarn = () => status.storage === 'postgres' ? '' : '<div class="warnbox">⚠️ Dữ liệu đang <b>lưu tạm</b> và có thể mất. Thầy cô báo người cài đặt web bật nơi lưu trữ lâu dài.</div>';
  function watchStudents(anchor, initial, redraw) {
    stopStudentWatch?.();
    let busy = false, stopped = false;
    const fingerprint = rows => JSON.stringify(rows.map(({ updatedAt, ...row }) => row));
    let snapshot = fingerprint(initial);
    async function refresh(showError = false) {
      if (busy || stopped || !anchor.isConnected || !token) return;
      busy = true;
      try {
        const rows = await load('students', true), next = fingerprint(rows);
        if (!stopped && anchor.isConnected && next !== snapshot) { snapshot = next; redraw(rows); }
      } catch (err) { if (showError) fail(err); }
      finally { busy = false; }
    }
    function resume() { if (!document.hidden) refresh(); }
    const timer = setInterval(resume, 5000);
    document.addEventListener('visibilitychange', resume);
    stopStudentWatch = () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', resume); stopStudentWatch = null; };
    return () => refresh(true);
  }

  /* ---------------- Học sinh: số liệu ---------------- */
  function summary(s) {
    const g = Number(s.grade), list = lessonsOf(g), topics = s.topics || {};
    const done = list.filter(t => topics[t.id] && topics[t.id].done).length;
    const stars = list.reduce((n, t) => n + ((topics[t.id] && topics[t.id].stars) || 0), 0);
    return { done, total: list.length, stars, acc: pct(s.correct, s.attempts), idle: daysAgo(s.lastDay) };
  }
  function needsHelp(s) { const m = summary(s); return (s.attempts >= 10 && m.acc < 60) || m.idle >= 4; }
  function classOf(code) { return (cache.classes || []).find(c => c.code === code); }
  function className(code) { const c = classOf(code); return c ? (c.name || 'Lớp ' + code) : code; }
  function wordOf(key) { // khoá sổ ôn “mã-bài:5” / “mã-bài:g7” / câu của thầy cô
    const [tid, i = ''] = String(key).split(':'); const t = lessonById(tid);
    if (i.startsWith('cq-')) return { word: 'Câu do thầy cô soạn', lesson: t ? t.ten : '' };
    if (!t) return { word: key, lesson: '' };
    const b0 = i[0] === 'g' ? (t.sinh || [])[Number(i.slice(1))] : t.baiTap[Number(i)]; if (!b0) return { word: key, lesson: t.ten };
    const b = Object.assign({}, b0);
    let w = '';
    if (b.loai === 'timLoi') w = b.tuDung;
    else if (b.loai === 'ngheViet') w = b.cau;
    else if (b.de && b.de.includes('___')) { const s = b.de.replace('___', b.dapAn), p = b.de.indexOf('___'), a = b.de.lastIndexOf(' ', p) + 1; let e = s.indexOf(' ', p + b.dapAn.length); if (e < 0) e = s.length; w = s.slice(a, e).replace(/[.,!?:;]/g, ''); }
    else w = b.dapAn || key;
    return { word: w, lesson: t.ten };
  }

  /* ---------------- Trang: Tổng quan ---------------- */
  async function pgOverview(v) {
    const [classes, students, docs, questions] = await Promise.all([load('classes'), load('students'), load('docs'), load('questions')]);
    const help = students.filter(needsHelp), today = students.filter(s => daysAgo(s.lastDay) === 0).length;
    const recent = students.flatMap(s => (s.history || []).slice(0, 5).map(h => ({ s, h }))).sort((a, b) => (parseDay(b.h.d) || 0) - (parseDay(a.h.d) || 0)).slice(0, 10);
    v.innerHTML = storageWarn() +
      (classes.length ? '' : '<div class="okbox">👋 Bắt đầu: vào <a href="#lop">Lớp học</a> tạo lớp để có <b>mã lớp</b>, rồi cho học sinh nhập mã đó trên máy của các em (Cài đặt → Lớp học của em).</div>') +
      '<div class="quick"><a class="btn primary" href="#giao-bai">📌 Giao bài</a><a class="btn" href="#goi-ten">✨ Gọi tên bất ngờ</a><a class="btn" href="#bai-hoc">📝 Sửa – thêm câu</a><a class="btn" href="#tai-lieu">📚 Tải tài liệu</a><a class="btn" href="#hoc-sinh">👧 Xem học sinh</a></div>' +
      '<div class="grid g4">' +
      stat(classes.length, 'Lớp học') + stat(students.length, 'Học sinh đã kết nối') + stat(today, 'Học sinh học hôm nay') + stat(help.length, 'Cần quan tâm', help.length ? 'warn' : '') +
      stat(docs.length, 'Tài liệu') + stat(questions.length, 'Câu hỏi của thầy cô') + '</div>' +
      '<div class="grid g2 section"><section class="card"><div class="card-head"><h2>🔔 Học sinh cần quan tâm</h2><a class="btn sm" href="#hoc-sinh">Xem tất cả</a></div>' +
      (help.length ? '<ul class="list">' + help.slice(0, 8).map(s => { const m = summary(s); return '<li><span>' + esc(s.avatar || '🙂') + ' <b>' + esc(s.name) + '</b> · ' + esc(className(s.classCode)) + '</span><span class="pill warn">' + (m.idle >= 4 ? (m.idle === Infinity ? 'Chưa học' : 'Nghỉ ' + m.idle + ' ngày') : 'Đúng ' + m.acc + '%') + '</span></li>'; }).join('') + '</ul>'
        : '<div class="empty">Chưa có học sinh nào cần nhắc. 🎉</div>') + '</section>' +
      weakCard(students) +
      '<section class="card"><h2>🕒 Lượt học gần đây</h2>' +
      (recent.length ? '<ul class="list">' + recent.map(({ s, h }) => '<li><span><b>' + esc(s.name) + '</b> · ' + esc(h.title || (lessonById(h.topic) || {}).ten || 'Luyện tập') + '</span><span class="pill ' + (h.acc >= 80 ? 'ok' : h.acc >= 60 ? '' : 'bad') + '">' + h.acc + '% · ' + esc(dayLabel(h.d)) + '</span></li>').join('') + '</ul>'
        : '<div class="empty">Khi học sinh học, lượt học sẽ hiện ở đây.</div>') + '</section></div>';
  }
  function weakCard(students) { // các bài cả lớp còn sai nhiều → gợi ý ôn / giao lại
    const sum = new Map();
    students.forEach(s => Object.entries(s.topics || {}).forEach(([id, x]) => { if (!lessonById(id) || !x.attempts) return; const m = sum.get(id) || { a: 0, c: 0, n: 0 }; m.a += x.attempts; m.c += x.correct; m.n++; sum.set(id, m); }));
    const rows = [...sum].map(([id, m]) => ({ t: lessonById(id), acc: pct(m.c, m.a), a: m.a, n: m.n })).filter(r => r.t.lop[0] <= 3 && r.a >= 5 && r.acc < 80).sort((a, b) => a.acc - b.acc).slice(0, 5);
    return '<section class="card"><h2>📉 Bài học sinh còn sai nhiều</h2>' + (rows.length ? '<ul class="list">' + rows.map(r => '<li><span><b>Lớp ' + r.t.lop[0] + ' · ' + esc(r.t.ten) + '</b><br><small class="muted">' + r.n + ' em đã làm</small></span><span><span class="pill ' + (r.acc < 60 ? 'bad' : 'warn') + '">đúng ' + r.acc + '%</span> <a class="btn sm" href="#giao-bai/' + r.t.id + '">Giao ôn</a></span></li>').join('') + '</ul>' : '<div class="empty">Chưa có bài nào dưới 80%.</div>') + '</section>';
  }
  const stat = (n, label, cls) => '<div class="card stat ' + (cls || '') + '"><b>' + n + '</b><span>' + label + '</span></div>';

  /* ---------------- Trang: Lớp học ---------------- */
  async function pgClasses(v) {
    const [classes, students] = await Promise.all([load('classes', true), load('students')]);
    v.innerHTML = storageWarn() +
      '<section class="card"><h2>➕ Tạo lớp mới</h2><form id="newClass" class="toolbar"><label class="field"><span>Tên lớp</span><input id="ncName" maxlength="40" placeholder="Ví dụ: Lớp 2A" required></label>' +
      '<label class="field" style="flex:0 1 160px"><span>Khối</span><select id="ncGrade"><option value="1">Lớp 1</option><option value="2" selected>Lớp 2</option><option value="3">Lớp 3</option></select></label><button class="btn primary">Tạo lớp</button></form>' +
      '<p class="hint">Mỗi lớp có một <b>mã 6 kí tự</b>. Học sinh nhập mã này một lần trên máy của em (Cài đặt → Lớp học của em) – sau mỗi lượt học, kết quả tự gửi về đây.</p></section>' +
      '<div class="grid g2 section">' + (classes.length ? classes.map(c => {
        const n = students.filter(s => s.classCode === c.code).length;
        return '<section class="card class-card"><div class="card-head"><h2>' + esc(c.name || 'Lớp chưa đặt tên') + '</h2><span class="pill">Khối ' + esc(c.grade || '—') + ' · ' + n + ' học sinh</span></div>' +
          '<div class="code" aria-label="Mã lớp">' + esc(c.code) + '</div>' +
          '<div class="actions" style="justify-content:flex-start"><button class="btn sm" data-copy="' + esc(c.code) + '">📋 Chép mã</button><button class="btn sm" data-print="' + esc(c.code) + '">🖨️ In thẻ mã cho học sinh</button>' +
          '<a class="btn sm" href="#hoc-sinh" data-see="' + esc(c.code) + '">👀 Xem học sinh</a><button class="btn sm" data-rename="' + esc(c.code) + '">✏️ Sửa</button><button class="btn sm danger" data-del="' + esc(c.code) + '">Xoá</button></div></section>';
      }).join('') : '<div class="empty">Chưa có lớp nào.</div>') + '</div>';
    $('#newClass').onsubmit = async e => {
      e.preventDefault();
      try { const r = await send('/api/classes', 'POST', { name: $('#ncName').value.trim(), grade: Number($('#ncGrade').value) }); toast('Đã tạo lớp, mã ' + r.code); cache.classes = null; route(); } catch (err) { fail(err); }
    };
    $$('[data-copy]', v).forEach(b => b.onclick = () => { navigator.clipboard?.writeText(b.dataset.copy).then(() => toast('Đã chép mã ' + b.dataset.copy), () => toast('Mã lớp: ' + b.dataset.copy)); });
    $$('[data-see]', v).forEach(b => b.onclick = () => { studentFilter.cls = b.dataset.see; });
    $$('[data-print]', v).forEach(b => b.onclick = () => printCards(classOf(b.dataset.print)));
    $$('[data-rename]', v).forEach(b => b.onclick = () => {
      const c = classOf(b.dataset.rename);
      const d = dialog('<h2>Sửa lớp ' + esc(c.code) + '</h2><form class="form" id="rnForm"><label class="field"><span>Tên lớp</span><input id="rnName" maxlength="40" value="' + esc(c.name || '') + '" required></label><label class="field"><span>Khối</span><select id="rnGrade">' + [1, 2, 3].map(g => '<option value="' + g + '"' + (Number(c.grade) === g ? ' selected' : '') + '>Lớp ' + g + '</option>').join('') + '</select></label><div class="actions"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Lưu</button></div></form>');
      $('#rnForm').onsubmit = async e => { e.preventDefault(); try { await send('/api/classes/' + c.code, 'PATCH', { name: $('#rnName').value.trim(), grade: Number($('#rnGrade').value) }); d.close(); cache.classes = null; toast('Đã lưu.'); route(); } catch (err) { fail(err); } };
    });
    $$('[data-del]', v).forEach(b => b.onclick = async () => {
      const c = classOf(b.dataset.del);
      if (!await confirmBox('Xoá ' + (c.name || c.code) + '?', 'Mã lớp sẽ ngừng hoạt động và kết quả học của học sinh lớp này trên máy chủ sẽ bị xoá. Dữ liệu trên máy của các em vẫn còn.', 'Xoá lớp')) return;
      try { await api('/api/classes/' + c.code, { method: 'DELETE' }); cache.classes = cache.students = null; toast('Đã xoá lớp.'); route(); } catch (err) { fail(err); }
    });
  }
  function printCards(c) {
    const card = '<div class="print-card"><b>🌱 Vườn Chữ Kì Diệu – ' + esc(c.name || '') + '</b><p>Mã lớp của em:</p><div class="code">' + esc(c.code) + '</div>' +
      '<ol><li>Mở web Vườn Chữ trên máy của em.</li><li>Bấm <b>⚙️ Cài đặt</b> → mục <b>Lớp học của em</b>.</li><li>Nhập mã lớp ở trên rồi bấm <b>Kết nối</b>.</li></ol></div>';
    $('#printArea').innerHTML = card.repeat(4);
    setTimeout(() => print(), 50);
  }

  /* ---------------- Trang: Học sinh ---------------- */
  async function pgStudents(v) {
    const [classes, initial] = await Promise.all([load('classes', true), load('students', true)]);
    let students = initial, updateDetail;
    v.innerHTML = storageWarn() + '<div class="toolbar"><label class="field"><span>Lớp</span><select id="sfCls"><option value="">Tất cả các lớp</option>' + classes.map(c => '<option value="' + esc(c.code) + '"' + (studentFilter.cls === c.code ? ' selected' : '') + '>' + esc(c.name || c.code) + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Tìm tên</span><input id="sfQ" type="search" value="' + esc(studentFilter.q) + '" placeholder="Nhập tên học sinh"></label>' +
      '<label class="field"><span>Sắp xếp</span><select id="sfSort"><option value="name">Theo tên</option><option value="acc">Đúng ít → nhiều</option><option value="idle">Lâu chưa học</option><option value="xp">XP cao → thấp</option></select></label>' +
      '<button class="btn" id="sfCsv">⬇️ Xuất Excel (CSV)</button><button class="btn" id="sfRefresh">↻ Làm mới</button></div><p class="hint">Kết quả tự cập nhật khi học sinh gửi bài.</p><div id="sfList"></div>';
    $('#sfSort').value = studentFilter.sort;
    const draw = () => {
      studentFilter = { cls: $('#sfCls').value, q: $('#sfQ').value, sort: $('#sfSort').value };
      const q = studentFilter.q.normalize('NFC').toLocaleLowerCase('vi').trim();
      let rows = students.filter(s => (!studentFilter.cls || s.classCode === studentFilter.cls) && String(s.name).normalize('NFC').toLocaleLowerCase('vi').includes(q));
      const S = s => summary(s);
      rows.sort(studentFilter.sort === 'acc' ? (a, b) => S(a).acc - S(b).acc : studentFilter.sort === 'idle' ? (a, b) => S(b).idle - S(a).idle : studentFilter.sort === 'xp' ? (a, b) => b.xp - a.xp : (a, b) => String(a.name).localeCompare(b.name, 'vi'));
      $('#sfList').innerHTML = rows.length ? '<div class="table-wrap"><table><thead><tr><th>Học sinh</th><th class="hide-sm">Lớp</th><th>Bài xong</th><th>Đúng</th><th class="hide-sm">Chuỗi</th><th class="hide-sm">XP</th><th>Học gần nhất</th></tr></thead><tbody>' +
        rows.map(s => { const m = S(s); return '<tr class="click" data-open="' + esc(s.classCode) + '|' + esc(s.id) + '" tabindex="0"><td><div class="who"><span class="av">' + esc(s.avatar || '🙂') + '</span>' + esc(s.name) + (needsHelp(s) ? ' <span class="pill warn">cần nhắc</span>' : '') + '</div></td>' +
          '<td class="hide-sm">' + esc(className(s.classCode)) + '</td><td><div class="bar" title="' + m.done + '/' + m.total + '"><i style="width:' + pct(m.done, m.total) + '%"></i></div><small>' + m.done + '/' + m.total + ' bài</small></td>' +
          '<td class="num"><span class="pill ' + (m.acc >= 80 ? 'ok' : m.acc >= 60 ? '' : s.attempts ? 'bad' : '') + '">' + (s.attempts ? m.acc + '%' : '—') + '</span></td><td class="num hide-sm">🔥 ' + (s.streak || 0) + '</td><td class="num hide-sm">' + (s.xp || 0) + '</td><td>' + lastLabel(s.lastDay) + '</td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="empty">' + (students.length ? 'Không có học sinh phù hợp.' : 'Chưa có học sinh nào kết nối. Tạo lớp ở mục <a href="#lop">Lớp học</a> và cho học sinh nhập mã lớp.') + '</div>';
      $$('[data-open]', v).forEach(tr => { const open = () => { const [c, id] = tr.dataset.open.split('|'); updateDetail = studentDetail(students.find(s => s.classCode === c && s.id === id)); }; tr.onclick = open; tr.onkeydown = e => { if (e.key === 'Enter') open(); }; });
    };
    $('#sfCls').onchange = $('#sfSort').onchange = draw; $('#sfQ').oninput = draw; draw();
    $('#sfRefresh').onclick = watchStudents($('#sfList'), initial, rows => { students = rows; draw(); updateDetail?.(rows); });
    $('#sfCsv').onclick = () => {
      const q = v => '"' + (/^[=+\-@]/.test(String(v)) ? "'" : '') + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const rows = [['Lớp', 'Học sinh', 'Khối', 'Bài xong', 'Tổng bài', 'Đúng %', 'Số câu đã làm', 'Chuỗi ngày', 'XP', 'Học gần nhất']];
      students.filter(s => !studentFilter.cls || s.classCode === studentFilter.cls).forEach(s => { const m = summary(s); rows.push([className(s.classCode), s.name, s.grade, m.done, m.total, m.acc, s.attempts, s.streak, s.xp, s.lastDay]); });
      download('hoc-sinh-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
    };
  }
  function studentDetail(s) {
    if (!s) return;
    const list = lessonsOf(Number(s.grade)), topics = s.topics || {};
    const stats = student => {
      const m = summary(student);
      return [
        [m.done + '/' + m.total, 'Bài đã xong'],
        [student.attempts ? m.acc + '%' : '—', 'Trả lời đúng'],
        [m.stars + ' ⭐', 'Sao'],
        ['🔥 ' + (student.streak || 0), 'Chuỗi ngày (dài nhất ' + (student.bestStreak || student.streak || 0) + ')'],
        [student.xp || 0, 'XP'],
        [lastLabel(student.lastDay), 'Lần học gần nhất']
      ].map(([value, label]) => '<div><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>').join('');
    };
    const wrong = Object.entries(s.wrongLog || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => Object.assign(wordOf(k), { n }));
    const d = dialog('<div class="detail-head" data-student-detail><span class="av">' + esc(s.avatar || '🙂') + '</span><div><h2 style="margin:0">' + esc(s.name) + '</h2><span class="muted">' + esc(className(s.classCode)) + ' · Lớp ' + esc(s.grade) + ' · cập nhật ' + fmtDate(s.updatedAt) + '</span></div><button class="btn sm" data-close style="margin-left:auto">Đóng ✕</button></div>' +
      '<div class="kv" id="hsStats">' + stats(s) + '</div>' +
      '<h3 style="margin:8px 0">📘 Tiến độ từng bài</h3><div class="lessons">' + list.map((t, i) => { const ts = topics[t.id]; return '<div class="lesson' + (ts && ts.attempts ? '' : ' none') + '"><span>' + (i + 1) + '. ' + esc(t.ten) + '</span><span class="st">' + (ts && ts.attempts ? '★'.repeat(ts.stars || 0) + '☆'.repeat(3 - (ts.stars || 0)) + ' ' + pct(ts.correct, ts.attempts) + '%' : '—') + '</span></div>'; }).join('') + '</div>' +
      '<h3 style="margin:16px 0 8px">❗ Từ hay viết sai</h3>' + (wrong.length ? '<ul class="list">' + wrong.map(w => '<li><span><b>' + esc(w.word) + '</b> <small class="muted">' + esc(w.lesson) + '</small></span><span class="pill bad">sai ' + w.n + ' lần</span></li>').join('') + '</ul>' : '<div class="empty">Chưa có từ sai.</div>') +
      '<h3 style="margin:16px 0 8px">🕒 Lịch sử luyện tập</h3><div class="tabs small" id="hsRange">' + [['7', '7 ngày'], ['30', '30 ngày'], ['0', 'Tất cả']].map(([k, n]) => '<button type="button" class="tab' + (k === '7' ? ' on' : '') + '" data-range="' + k + '">' + n + '</button>').join('') + '</div><p class="hint" id="hsSum"></p><div id="hsHistory"></div>' +
      '<h3 style="margin:16px 0 8px">💬 Nhận xét gửi học sinh</h3><form id="noteForm" class="form"><label class="field"><span class="muted" style="font-weight:400">Nhận xét sẽ hiện trong mục Hồ sơ trên máy của em ở lần đồng bộ sau.</span><textarea id="noteText" maxlength="500" required placeholder="Ví dụ: Em viết đúng s/x rất tốt, cần luyện thêm dấu hỏi/ngã nhé!"></textarea></label><div class="chips" aria-label="Nhận xét mẫu">' + QUICK_NOTES.map(n => '<button type="button" class="chip-btn" data-quick="' + esc(n) + '">' + esc(n) + '</button>').join('') + '</div><div class="actions"><button class="btn primary">Gửi nhận xét</button></div></form>' +
      '<ul class="list notes" id="noteList">' + notesHtml(s.teacherNotes) + '</ul>' +
      '<div class="actions" style="margin-top:18px"><button class="btn" id="prStudent">🖨️ In báo cáo cho phụ huynh</button><button class="btn danger" id="delStudent">Xoá học sinh khỏi lớp</button></div>');
    let range = 7;
    const drawHistory = () => {
      const rows = inRange(s.history, range), done = rows.reduce((a, h) => a + (h.total || 0), 0), right = rows.reduce((a, h) => a + (h.correct || 0), 0);
      $('#hsSum').textContent = rows.length ? rows.length + ' lượt học · ' + new Set(rows.map(h => h.d)).size + ' ngày có học' + (done ? ' · trả lời đúng ' + right + '/' + done + ' câu (' + pct(right, done) + '%)' : '') : '';
      $('#hsHistory').innerHTML = rows.length ? '<ul class="list">' + rows.slice(0, 200).map(h => '<li><span>' + esc(dayLabel(h.d)) + ' · ' + esc(h.title || (lessonById(h.topic) || {}).ten || 'Luyện tập') + '</span><span class="pill ' + (h.acc >= 80 ? 'ok' : h.acc >= 60 ? '' : 'bad') + '">' + h.acc + '%' + (h.total ? ' · ' + h.correct + '/' + h.total : '') + '</span></li>').join('') + '</ul>' : '<div class="empty">Không có lượt học trong khoảng này.</div>';
    };
    $$('[data-range]', d).forEach(b => b.onclick = () => { range = Number(b.dataset.range); $$('[data-range]', d).forEach(x => x.classList.toggle('on', x === b)); drawHistory(); });
    drawHistory();
    $$('[data-quick]', d).forEach(b => b.onclick = () => { const box = $('#noteText'); box.value = (box.value ? box.value + ' ' : '') + b.dataset.quick; box.focus(); });
    $('#prStudent').onclick = () => printReport(s, range);
    $('#noteForm').onsubmit = async e => {
      e.preventDefault();
      try { const r = await send('/api/students/' + s.classCode + '/' + encodeURIComponent(s.id) + '/notes', 'POST', { text: $('#noteText').value }); s.teacherNotes = r.teacherNotes; $('#noteList').innerHTML = notesHtml(s.teacherNotes); $('#noteText').value = ''; toast('Đã gửi nhận xét.'); } catch (err) { fail(err); }
    };
    $('#delStudent').onclick = async () => {
      d.close();
      if (!await confirmBox('Xoá ' + s.name + '?', 'Kết quả học của em trên máy chủ sẽ bị xoá. Nếu máy của em còn kết nối lớp, lần học sau sẽ gửi lại.', 'Xoá')) return;
      try { await api('/api/students/' + s.classCode + '/' + encodeURIComponent(s.id), { method: 'DELETE' }); cache.students = null; toast('Đã xoá.'); route(); } catch (err) { fail(err); }
    };
    const marker = $('[data-student-detail]', d);
    return rows => {
      if (!d.open || !marker.isConnected) return;
      const fresh = rows.find(row => row.classCode === s.classCode && row.id === s.id);
      if (!fresh) return;
      const historyChanged = JSON.stringify(s.history) !== JSON.stringify(fresh.history);
      const notesChanged = JSON.stringify(s.teacherNotes) !== JSON.stringify(fresh.teacherNotes);
      s = fresh;
      $('#hsStats').innerHTML = stats(s);
      if (historyChanged) drawHistory();
      if (notesChanged) $('#noteList').innerHTML = notesHtml(s.teacherNotes);
    };
  }
  const QUICK_NOTES = ['Em tiến bộ rõ, cô khen!', 'Em viết cẩn thận, rất tốt.', 'Em cần đọc kĩ câu trước khi chọn.', 'Em luyện thêm dấu hỏi, dấu ngã nhé.', 'Em chăm học đều mỗi ngày nhé!'];
  const inRange = (history, days) => (history || []).filter(h => !days || daysAgo(h.d) < days);
  function printReport(s, range) {
    const m = summary(s), rows = inRange(s.history, range), list = lessonsOf(Number(s.grade)).map((t, i) => ({ t, i, x: (s.topics || {})[t.id] })).filter(r => r.x && r.x.attempts);
    const wrong = Object.entries(s.wrongLog || {}).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => wordOf(k).word);
    const notes = (s.teacherNotes || []).slice().sort((a, b) => b.at - a.at).slice(0, 3);
    $('#printArea').innerHTML = '<div class="report"><h1>Phiếu theo dõi luyện chính tả</h1><p><b>' + esc(s.name) + '</b> · ' + esc(className(s.classCode)) + ' · Ngày in ' + fmtDate(Date.now()) + '</p>' +
      '<p>Đã hoàn thành <b>' + m.done + '/' + m.total + '</b> bài · Tỉ lệ đúng <b>' + (s.attempts ? m.acc + '%' : '—') + '</b> · Chuỗi ngày học: <b>' + (s.streak || 0) + '</b> · ' + (range ? 'Trong ' + range + ' ngày qua' : 'Từ trước đến nay') + ': <b>' + rows.length + '</b> lượt học.</p>' +
      (list.length ? '<h2>Kết quả theo bài</h2><table><thead><tr><th>Bài</th><th>Sao</th><th>Đúng</th></tr></thead><tbody>' + list.map(r => '<tr><td>' + (r.i + 1) + '. ' + esc(r.t.ten) + '</td><td>' + '★'.repeat(r.x.stars || 0) + '☆'.repeat(3 - (r.x.stars || 0)) + '</td><td>' + pct(r.x.correct, r.x.attempts) + '%</td></tr>').join('') + '</tbody></table>' : '') +
      (wrong.length ? '<h2>Từ em còn hay viết sai</h2><p>' + wrong.map(esc).join(' · ') + '</p>' : '') +
      (notes.length ? '<h2>Nhận xét của thầy cô</h2><ul>' + notes.map(n => '<li>' + esc(n.text) + ' <i>(' + fmtDate(n.at) + ')</i></li>').join('') + '</ul>' : '') +
      '<p class="sign">Phụ huynh xem và ký tên:</p></div>';
    $('#dlg').close(); setTimeout(() => print(), 80);
  }
  const notesHtml = arr => (arr || []).slice().sort((a, b) => b.at - a.at).map(n => '<li><time>' + fmtDate(n.at) + '</time>' + esc(n.text) + '</li>').join('');
  function download(name, content, mime) { const a = document.createElement('a'); a.href = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type: mime })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); }

  /* ---------------- Trang: Tài liệu ---------------- */
  const lessonOptions = (sel, withNone) => (withNone ? '<option value="">— Không gắn bài —</option>' : '') + [1, 2, 3].map(g => '<optgroup label="Lớp ' + g + '">' + lessonsOf(g).map((t, i) => '<option value="' + t.id + '"' + (t.id === sel ? ' selected' : '') + '>Bài ' + (i + 1) + ': ' + esc(t.ten) + '</option>').join('') + '</optgroup>').join('');
  async function pgDocs(v) {
    const docs = await load('docs', true);
    v.innerHTML = storageWarn() + '<section class="card"><h2>⬆️ Tải tài liệu lên</h2>' +
      '<div class="form"><div class="row"><label class="field"><span>Dành cho</span><select id="dGrade"><option value="chung">Mọi lớp</option><option value="1">Lớp 1</option><option value="2">Lớp 2</option><option value="3">Lớp 3</option></select></label>' +
      '<label class="field"><span>Gắn với bài (không bắt buộc)</span><select id="dTopic">' + lessonOptions('', true) + '</select></label></div>' +
      '<label class="field"><span>Ghi chú cho học sinh (không bắt buộc)</span><input id="dNote" maxlength="300" placeholder="Ví dụ: Phiếu ôn tập s/x – các em in ra làm nhé"></label>' +
      '<label class="check"><input type="checkbox" id="dPub" checked> Công bố ngay cho học sinh</label>' +
      '<label class="drop" id="drop" tabindex="0"><input type="file" id="dFile" multiple hidden accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.mp3"><b>Kéo thả tệp vào đây hoặc bấm để chọn</b><span class="hint">PDF, Word (.docx), PowerPoint (.pptx), ảnh PNG/JPG/WebP, âm thanh MP3 · tối đa 10 MB mỗi tệp · chọn được nhiều tệp</span></label>' +
      '<div class="queue" id="dQueue"></div></div></section>' +
      '<section class="card section"><div class="card-head"><h2>📚 Thư viện (' + docs.length + ')</h2><input id="dSearch" type="search" placeholder="Tìm tài liệu" style="min-height:40px;padding:6px 10px;border:1px solid #b9cbc3;border-radius:10px"></div><div id="dList"></div></section>';
    const draw = () => {
      const q = $('#dSearch').value.toLocaleLowerCase('vi');
      const rows = docs.filter(d => (d.title + ' ' + d.name).toLocaleLowerCase('vi').includes(q));
      $('#dList').innerHTML = rows.length ? '<div class="table-wrap"><table><thead><tr><th>Tài liệu</th><th class="hide-sm">Dành cho</th><th class="hide-sm">Cỡ</th><th>Trạng thái</th><th></th></tr></thead><tbody>' + rows.map(d => {
        const ext = (d.name.split('.').pop() || '').slice(0, 4), t = d.topic && lessonById(d.topic);
        return '<tr><td><div class="who" style="font-weight:500"><span class="ext">' + esc(ext) + '</span><span><b>' + esc(d.title) + '</b>' + (t ? '<br><small class="muted">' + esc(t.ten) + '</small>' : '') + (d.note ? '<br><small class="muted">' + esc(d.note) + '</small>' : '') + '</span></div></td>' +
          '<td class="hide-sm">' + (d.grade === 'chung' ? 'Mọi lớp' : 'Lớp ' + esc(d.grade)) + '</td><td class="hide-sm num">' + fmtSize(Number(d.size) || 0) + '</td>' +
          '<td><button class="btn sm" data-pub="' + esc(d.id) + '">' + (d.published ? '<span class="pill ok">Đã công bố</span>' : '<span class="pill">Bản nháp</span>') + '</button></td>' +
          '<td><div class="actions"><button class="btn sm" data-dl="' + esc(d.id) + '">Tải về</button><button class="btn sm danger" data-ddel="' + esc(d.id) + '">Xoá</button></div></td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="empty">Chưa có tài liệu.</div>';
      $$('[data-dl]', v).forEach(b => b.onclick = async () => { const d = docs.find(x => x.id === b.dataset.dl); try { download(d.name, await api('/api/docs/' + encodeURIComponent(d.id))); } catch (e) { fail(e); } });
      $$('[data-pub]', v).forEach(b => b.onclick = async () => { const d = docs.find(x => x.id === b.dataset.pub); try { await send('/api/docs/' + encodeURIComponent(d.id), 'PATCH', { published: !d.published }); d.published = !d.published; draw(); toast(d.published ? 'Học sinh đã thấy tài liệu này.' : 'Đã chuyển về bản nháp.'); } catch (e) { fail(e); } });
      $$('[data-ddel]', v).forEach(b => b.onclick = async () => { const d = docs.find(x => x.id === b.dataset.ddel); if (!await confirmBox('Xoá “' + d.title + '”?', 'Tài liệu sẽ bị xoá khỏi máy chủ.', 'Xoá')) return; try { await api('/api/docs/' + encodeURIComponent(d.id), { method: 'DELETE' }); docs.splice(docs.indexOf(d), 1); draw(); toast('Đã xoá.'); } catch (e) { fail(e); } });
    };
    $('#dSearch').oninput = draw; draw();
    const drop = $('#drop'), input = $('#dFile');
    drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } };
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => upload([...e.dataTransfer.files]));
    input.onchange = () => { upload([...input.files]); input.value = ''; };
    async function upload(files) {
      const q = $('#dQueue');
      for (const f of files) {
        const row = document.createElement('div'); row.innerHTML = '<span>' + esc(f.name) + ' · ' + fmtSize(f.size) + '</span><b>Đang tải…</b>'; q.append(row);
        try {
          if (f.size > MAX_DOC) throw Error('quá 10 MB');
          const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(Error('không đọc được tệp')); r.readAsDataURL(f); });
          const title = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
          const r = await send('/api/docs', 'POST', { name: f.name, title, grade: $('#dGrade').value, topic: $('#dTopic').value, note: $('#dNote').value, data, published: $('#dPub').checked });
          docs.unshift(r.document); row.lastChild.textContent = '✅ Xong'; draw();
        } catch (e) { row.lastChild.textContent = '❌ ' + e.message; row.lastChild.style.color = 'var(--bad)'; }
      }
    }
  }

  /* ---------------- Trang: Câu hỏi ---------------- */
  async function pgQuestions(v) {
    const qs = await load('questions', true);
    v.innerHTML = storageWarn() + '<section class="card"><div class="card-head"><h2>✍️ Câu hỏi của thầy cô (' + qs.length + ')</h2><div class="actions"><button class="btn primary" id="qNew">+ Soạn câu hỏi</button><button class="btn" id="qPubAll">Công bố tất cả câu nháp</button></div></div>' +
      '<p class="hint">Đây là các <b>câu đố có hình, nghe – viết từ, xếp tiếng, chọn nhóm</b>. Câu đã công bố hiện trong mục <b>Luyện theo chủ đề</b> của học sinh. Muốn thêm câu vào ngay bài học thì dùng mục <a href="#bai-hoc">Bài học</a>.</p>' +
      '<div class="toolbar"><label class="field"><span>Lớp</span><select id="qG"><option value="">Tất cả</option><option>1</option><option>2</option><option>3</option></select></label><label class="field"><span>Dạng</span><select id="qT"><option value="">Tất cả</option>' + Object.entries(TYPES).map(([k, n]) => '<option value="' + k + '">' + n + '</option>').join('') + '</select></label><label class="field"><span>Tìm</span><input id="qS" type="search" placeholder="Đề bài hoặc đáp án"></label></div><div id="qList"></div></section>';
    const draw = () => {
      const g = $('#qG').value, t = $('#qT').value, s = $('#qS').value.toLocaleLowerCase('vi');
      const rows = qs.filter(q => (!g || q.grades.includes(Number(g))) && (!t || q.type === t) && (q.prompt + ' ' + q.answer).toLocaleLowerCase('vi').includes(s));
      $('#qList').innerHTML = rows.length ? '<div class="table-wrap"><table><thead><tr><th>Đề bài</th><th>Đáp án</th><th class="hide-sm">Dạng · Bài</th><th>Trạng thái</th><th></th></tr></thead><tbody>' + rows.map(q => {
        const l = lessonById(q.topic);
        return '<tr><td>' + esc(q.prompt) + '</td><td><b>' + esc(q.answer) + '</b></td><td class="hide-sm"><small>' + esc(TYPES[q.type] || q.type) + '<br>' + esc(l ? 'Lớp ' + l.lop[0] + ' · ' + l.ten : q.topic) + '</small></td>' +
          '<td>' + (q.active ? '<span class="pill ok">Đã công bố</span>' : '<span class="pill">Bản nháp</span>') + '</td><td><div class="actions"><button class="btn sm" data-qedit="' + esc(q.id) + '">Sửa</button><button class="btn sm danger" data-qdel="' + esc(q.id) + '">Xoá</button></div></td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="empty">Chưa có câu hỏi' + (qs.length ? ' phù hợp' : '. Bấm “Soạn câu hỏi” hoặc nhập bằng Excel.') + '</div>';
      $$('[data-qedit]', v).forEach(b => b.onclick = () => editQuestion(qs.find(q => q.id === b.dataset.qedit)));
      $$('[data-qdel]', v).forEach(b => b.onclick = async () => { const q = qs.find(x => x.id === b.dataset.qdel); if (!await confirmBox('Xoá câu hỏi?', q.prompt, 'Xoá')) return; try { await api('/api/questions/' + encodeURIComponent(q.id), { method: 'DELETE' }); qs.splice(qs.indexOf(q), 1); draw(); toast('Đã xoá.'); } catch (e) { fail(e); } });
    };
    $('#qG').onchange = $('#qT').onchange = draw; $('#qS').oninput = draw; draw();
    $('#qNew').onclick = () => editQuestion(null);
    $('#qPubAll').onclick = async () => { try { const r = await send('/api/questions/publish', 'POST', {}); toast('Đã công bố ' + r.published + ' câu.'); cache.questions = null; route(); } catch (e) { fail(e); } };
  }
  function editQuestion(q) {
    const data = q || { type: 'choice', topic: lessonsOf(2)[0].id, grades: [2], prompt: '', answer: '', choices: [], note: '', active: true };
    let uploaded = data.image && data.image.startsWith('data:') ? data.image : '';
    const d = dialog('<h2>' + (q ? 'Sửa câu hỏi' : 'Soạn câu hỏi') + '</h2><form class="form" id="qf">' +
      '<div class="row"><label class="field"><span>Dạng bài</span><select id="qfType">' + Object.entries(TYPES).map(([k, n]) => '<option value="' + k + '"' + (k === data.type ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Bài trong chương trình</span><select id="qfTopic">' + lessonOptions(data.topic, false) + '</select></label></div>' +
      '<label class="field"><span>Đề bài</span><textarea id="qfPrompt" maxlength="240" required>' + esc(data.prompt) + '</textarea></label>' +
      '<label class="field"><span>Đáp án đúng</span><input id="qfAnswer" maxlength="70" required value="' + esc(data.answer) + '"></label>' +
      '<label class="field" id="qfChoicesF"><span>Các lựa chọn – mỗi dòng một lựa chọn, có cả đáp án đúng (2–4)</span><textarea id="qfChoices">' + esc((data.choices || []).join('\n')) + '</textarea></label>' +
      '<div id="qfPicF" class="row"><label class="field"><span>Hình có sẵn</span><select id="qfPic"><option value="">— hoặc tải ảnh —</option>' + Object.entries(PICTURES).map(([k, n]) => '<option value="' + k + '"' + (data.image === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Ảnh của thầy cô</span><input type="file" id="qfUp" accept="image/png,image/jpeg,image/webp"></label><label class="field"><span>Mô tả ảnh</span><input id="qfAlt" maxlength="120" value="' + esc(data.alt || '') + '"></label></div>' +
      '<label class="field"><span>Giải thích sau khi chấm (không bắt buộc)</span><input id="qfNote" maxlength="300" value="' + esc(data.note || '') + '"></label>' +
      '<label class="check"><input type="checkbox" id="qfPub"' + (data.active ? ' checked' : '') + '> Công bố cho học sinh</label>' +
      '<p class="form-err" id="qfErr" role="alert"></p><div class="actions"><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary">Lưu câu hỏi</button></div></form>');
    const sync = () => { const t = $('#qfType').value; $('#qfChoicesF').hidden = !['choice', 'picture', 'sort'].includes(t); $('#qfPicF').hidden = t !== 'picture'; $('#qfPrompt').placeholder = t === 'fill' ? 'Ví dụ: Bé đội ___ón khi ra nắng. (đúng một chỗ trống ___)' : 'Lời dẫn cho học sinh'; };
    $('#qfType').onchange = sync; sync();
    $('#qfUp').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { const bmp = await createImageBitmap(f), c = document.createElement('canvas'), k = Math.min(1, 400 / Math.max(bmp.width, bmp.height)); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); uploaded = c.toDataURL('image/webp', .8); $('#qfPic').value = ''; toast('Đã chọn ảnh.'); } catch (err) { $('#qfErr').textContent = 'Không đọc được ảnh.'; }
    };
    $('#qf').onsubmit = async e => {
      e.preventDefault();
      const topic = $('#qfTopic').value, l = lessonById(topic);
      const body = { id: q && q.id, type: $('#qfType').value, topic, grades: [l.lop[0]], prompt: $('#qfPrompt').value, answer: $('#qfAnswer').value,
        choices: $('#qfChoices').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean), note: $('#qfNote').value, image: $('#qfPic').value || uploaded, alt: $('#qfAlt').value, active: $('#qfPub').checked };
      try { await send('/api/questions', 'POST', body); d.close(); toast('Đã lưu câu hỏi.'); cache.questions = null; route(); } catch (err) { $('#qfErr').textContent = err.message; }
    };
  }

  /* ---------------- Trang: Trợ giúp ---------------- */
  async function pgGuide(v) {
    const qa = (q, a) => '<details class="faq"><summary>' + q + '</summary><div>' + a + '</div></details>';
    v.innerHTML = storageWarn() + '<section class="card"><h2>🚀 Bắt đầu trong 3 bước</h2><ol class="steps">' +
      '<li><b>Tạo lớp</b> ở mục <a href="#lop">Lớp học</a> → bấm <b>In thẻ mã</b> phát cho học sinh (hoặc viết mã lên bảng).</li>' +
      '<li><b>Học sinh nhập mã một lần</b> trên máy của em: ⚙️ Cài đặt → <b>Lớp học của em</b> → gõ mã → <b>Kết nối</b>.</li>' +
      '<li><b>Giao bài</b> ở mục <a href="#giao-bai">Giao bài</a>, rồi theo dõi ở mục <a href="#hoc-sinh">Học sinh</a>.</li></ol></section>' +
      '<section class="card section"><h2>❓ Câu hỏi thường gặp</h2>' +
      qa('Tôi muốn gọi ngẫu nhiên một bạn trả lời', 'Vào mục <a href="#goi-ten">Gọi tên</a>, chọn lớp rồi bấm <b>Thả Đom Đóm bay</b>. Mặc định mỗi bạn chỉ được gọi một lần trong vòng; thầy cô có thể hoàn tác, bắt đầu vòng mới, bật âm thanh hoặc chiếu toàn màn hình.') +
      qa('Tôi muốn sửa một câu trong bài học bị chưa ổn', 'Vào <a href="#bai-hoc">Bài học</a> → bấm vào bài → bấm <b>✏️ Sửa</b> ở câu đó. Không muốn dùng nữa thì bấm <b>🙈 Ẩn</b>. Lỡ tay thì bấm <b>↩ Về câu gốc</b>.') +
      qa('Tôi muốn thêm câu của riêng mình', 'Trong từng bài bấm <b>+ Thêm câu</b>. Nếu có nhiều câu, bấm <b>📥 Thêm nhiều câu từ Excel</b>, tải tệp mẫu, điền rồi tải lên.') +
      qa('Tôi muốn gửi phiếu bài tập, bài đọc cho học sinh', 'Vào <a href="#tai-lieu">Tài liệu</a>, kéo tệp vào khung (PDF, Word, PowerPoint, ảnh, âm thanh, tối đa 10 MB). Học sinh xem ở mục <b>Tài liệu của thầy cô</b>.') +
      qa('Học sinh đã học mà tôi chưa thấy', 'Kiểm tra máy của em đã nhập đúng mã lớp chưa. Kết quả gửi sau mỗi bài; nếu máy mất mạng, web tự gửi khi có mạng. Bài làm dở giữa chừng và chế độ “Chơi thử” không được gửi.') +
      qa('Hai anh em dùng chung một máy', 'Mỗi em tạo hồ sơ riêng. Khi nhập mã lớp, các hồ sơ trên máy đó đều thuộc lớp ấy. Học sinh lớp khác nên dùng trình duyệt hoặc máy khác.') +
      qa('Học sinh quên mã PIN', 'Trên chính máy của em: mở trang học sinh → Góc thầy cô → bấm <b>🔓 Xoá PIN</b> bên tên em.') +
      qa('Tôi in báo cáo gửi phụ huynh thế nào?', 'Vào <a href="#hoc-sinh">Học sinh</a> → bấm vào tên em → <b>🖨️ In báo cáo cho phụ huynh</b>.') +
      qa('Dùng máy chung ở trường', 'Làm xong nhớ bấm <b>Đăng xuất</b>. Web cũng tự đăng xuất sau 12 giờ. Muốn đổi mật khẩu, thầy cô nhờ người cài đặt web.') + '</section>';
  }

  window.GV = { $, $$, esc, api, send, toast, fail, dialog, confirmBox, lessonsOf, lessonById, download, load, cache: () => cache, pct, className, daysAgo, storageWarn, watchStudents,
    register(name, title, page) { PAGES[name] = title; EXTRA[name] = page; } };
  addEventListener('DOMContentLoaded', boot);
})();
