// Kiểm thử đợt 24 – giao diện doanh nghiệp + chức năng mới của luồng GIÁO VIÊN và QUẢN TRỊ:
// tìm nhanh (Ctrl+K), Giao ôn từ “Bài còn sai nhiều”, Sổ nhận xét (gợi ý, lưu, xuất Excel), bảng học sinh dạng thẻ trên điện thoại,
// Nhật ký hoạt động (chỉ quản trị), Xuất báo cáo trường, không còn biểu tượng cảm xúc, không tràn ngang.
// Chạy: node tests/dot24_e2e.js [rộng] [cao]   → ảnh ở qa-results/dot24/
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 900)];
  const out = path.join(__dirname, '..', 'qa-results', 'dot24'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dot24-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const call = async (method, url, body, token) => (await fetch(base.slice(0, -1) + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })).json();
  const admin = (await call('POST', '/api/login', { password: env.TEACHER_PASSWORD })).token;
  await call('POST', '/api/admin/teachers', { name: 'Lê Thị Quỳnh Huệ', username: 'lethiquynhhue', password: 'matkhau-hue-123' }, admin);
  await call('POST', '/api/admin/teachers', { name: 'Trần Minh Đức', username: 'tranminhduc', password: 'matkhau-duc-123' }, admin);
  const classes = [];
  for (const [name, grade, owner] of [['Lớp 2A', 2, 'lethiquynhhue'], ['Lớp 3B', 3, 'lethiquynhhue'], ['Lớp 1C', 1, 'tranminhduc']]) classes.push(await call('POST', '/api/classes', { name, grade, owner }, admin));
  const NAMES = ['Nguyễn Hoàng Bảo Ngọc Khánh Linh', 'Trần Minh Khang', 'Lê Ngọc Mai', 'Phạm Gia Bảo', 'Hoàng Thu Hà', 'Vũ Đức Anh', 'Đặng Bảo Ngọc', 'Bùi Quốc Huy', 'Đỗ Khánh Linh', 'Ngô Hải Nam'];
  const TOPICS = { 1: ['l1-01', 'l1-02'], 2: ['l2-01', 'l2-02', 'l2-03'], 3: ['l3-01', 'l3-02'] };
  let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const key = off => { const d = new Date(); d.setDate(d.getDate() - off); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  for (const [ci, c] of classes.entries()) for (let i = 0; i < 8; i++) {
    const history = [], topics = {}, skill = [0.95, 0.72, 0.45, 0.88, 0.6][i % 5];
    for (let off = 0; off < 12; off++) if (rnd() < 0.6) {
      const total = 10, correct = Math.max(0, Math.min(10, Math.round(total * (skill + (rnd() - .5) * .12)))), list = TOPICS[c.grade], topic = list[Math.floor(rnd() * list.length)];
      history.push({ d: key(off), at: Date.now() - off * 864e5, grade: c.grade, kind: 'lesson', topic, title: '', correct, total, acc: correct * 10 });
      const t = topics[topic] || (topics[topic] = { stars: 1, best: 0, attempts: 0, correct: 0, done: true }); t.attempts += total; t.correct += correct;
    }
    const attempts = history.reduce((a, x) => a + x.total, 0), correct = history.reduce((a, x) => a + x.correct, 0);
    await call('POST', '/api/sync', { classCode: c.code, profile: { id: 'hs-' + ci + '-' + i, name: NAMES[i], grade: c.grade, avatar: '🦊', xp: 40 + i * 10, streak: i % 4, lastDay: history[0]?.d || '', attempts, correct, topics, history } });
  }
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 8000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const shot = async name => { await b.sleep(350); await b.shot(path.join(out, name + '-' + w + '.png'), true); };
  const fits = () => b.eval('return document.documentElement.scrollWidth <= innerWidth + 1');
  const go = async hash => { await b.eval(`location.hash='${hash}'; return 1`); await b.sleep(250); await until(`!/Đang tải/.test(document.querySelector('#view').textContent)`); await b.sleep(400); };
  const login = async (u, p) => { await b.eval(`document.querySelector('#loginUser').value=${JSON.stringify(u)}; document.querySelector('#loginPass').value=${JSON.stringify(p)}; document.querySelector('#loginBtn').click(); return 1`); return until(`!document.querySelector('#app').hidden && document.querySelector('.page-head')`); };
  /* không còn emoji trong phần chữ của trang người lớn (trừ trò Gọi tên dành cho học sinh) */
  const emoji = () => b.eval(`return (document.querySelector('#app').innerText.match(/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}]/gu) || []).join('')`);
  try {
    await b.eval(`window.__dl = []; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__dl.push(this.download); return; } return o.call(this); }; window.print = () => { window.__printed = (window.__printed || 0) + 1; }; return 1`);
    await b.goto(base + 'giao-vien/', 1500);
    await b.eval(`window.__dl = []; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__dl.push(this.download); return; } return o.call(this); }; window.print = () => { window.__printed = (window.__printed || 0) + 1; }; return 1`);
    ok(await b.eval(`return !!document.querySelector('link[rel=icon]')`), 'Trang giáo viên có biểu tượng trang (hết lỗi 404 favicon)');
    await shot('0-dang-nhap');
    ok(await login('lethiquynhhue', 'matkhau-hue-123'), 'Giáo viên đăng nhập');
    ok(await until(`document.querySelectorAll('#vzDays .viz-mark').length===14`), 'Tổng quan có biểu đồ 14 ngày');
    ok(await b.eval(`return [...document.querySelectorAll('.panel a.btn[href^="#giao-bai/"]')].length > 0`), '“Bài còn sai nhiều” có nút Giao ôn');
    ok(await b.eval(`return !document.querySelector('#nav [data-nav="nhat-ky"]')?.offsetParent && !document.querySelector('#nav [data-nav="quan-tri-giao-vien"]')?.offsetParent`), 'Giáo viên không thấy mục quản trị');
    ok((await emoji()) === '', 'Tổng quan giáo viên không có biểu tượng cảm xúc', await emoji());
    ok(await fits(), 'Tổng quan không tràn ngang');
    await shot('1-giao-vien-tong-quan');
    // Giao ôn → mở trang Giao bài đã chọn sẵn bài
    const href = await b.eval(`return document.querySelector('.panel a.btn[href^="#giao-bai/"]').getAttribute('href')`);
    await go(href.slice(1)); ok(await until(`document.querySelector('#asTopic') && document.querySelector('#asTopic').value === ${JSON.stringify(href.split('/')[1])}`), 'Giao ôn mở Giao bài với đúng bài', href);
    // Tìm nhanh
    await b.eval(`dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })); return 1`);
    ok(await until(`document.querySelector('#dlg').open && document.querySelector('#qfInput')`), 'Ctrl+K mở ô Tìm nhanh');
    await b.eval(`const i=document.querySelector('#qfInput'); i.value='khang'; i.dispatchEvent(new Event('input')); return 1`);
    ok(await until(`[...document.querySelectorAll('#qfList li[data-i]')].some(li => /Trần Minh Khang/.test(li.textContent))`), 'Tìm “khang” (không dấu) ra học sinh');
    await shot('2-tim-nhanh');
    await b.eval(`document.querySelector('#qfInput').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); return 1`);
    ok(await until(`document.querySelector('#dlg').open && /Trần Minh Khang/.test(document.querySelector('#dlgBody h2')?.textContent || '')`, 6000), 'Enter mở hồ sơ học sinh');
    ok(await b.eval(`return /^[A-ZĐ]$/.test(document.querySelector('.detail-head .av').textContent)`), 'Ảnh đại diện là chữ cái đầu tên');
    await b.eval(`document.querySelector('#dlg').close(); return 1`);
    // Bảng học sinh
    await go('hoc-sinh');
    ok(await fits(), 'Học sinh không tràn ngang');
    if (w <= 640) ok(await b.eval(`const n=document.querySelector('.st-table .who-name'); const r=n.getBoundingClientRect(); return r.height < parseFloat(getComputedStyle(n).lineHeight) * 1.6`), 'Điện thoại: tên học sinh dài vẫn một dòng');
    await shot('3-hoc-sinh');
    // Sổ nhận xét
    await go('nhan-xet');
    ok(await until(`document.querySelectorAll('.nx-table tbody tr').length === 8`), 'Sổ nhận xét liệt kê 8 học sinh của lớp đầu');
    ok(await b.eval(`return document.querySelectorAll('.nx-table .lv-T').length > 0 && document.querySelectorAll('.nx-table .lv-C').length > 0`), 'Có mức Hoàn thành tốt và Chưa hoàn thành theo số liệu');
    await b.eval(`document.querySelector('#nxFill').click(); return 1`);
    ok(await until(`[...document.querySelectorAll('.nx-table textarea')].every(t => t.value.length > 20)`), 'Điền gợi ý cho cả lớp');
    const txt = await b.eval(`return [...document.querySelectorAll('.nx-table textarea')].map(t=>t.value)`);
    ok(!txt.some(t => /[{}]|undefined|null/.test(t)), 'Lời gợi ý không còn chỗ trống chưa thay', txt.slice(0, 3));
    ok(new Set(txt).size >= 4, 'Lời gợi ý đa dạng, không giống hệt nhau', new Set(txt).size);
    await b.eval(`const t=document.querySelector('.nx-table textarea'); t.value='Em viết rất cẩn thận, cô khen.'; t.dispatchEvent(new Event('input', {bubbles:true})); return 1`);
    ok(await b.eval(`return /chưa lưu/.test(document.querySelector('.nx-status').textContent)`), 'Báo “có thay đổi chưa lưu”');
    await b.eval(`document.querySelector('#nxSave').click(); return 1`);
    ok(await until(`/Lưu lần cuối/.test(document.querySelector('.nx-status').textContent)`), 'Lưu sổ lên máy chủ');
    await go('tong-quan'); await go('nhan-xet');
    ok(await until(`document.querySelector('.nx-table textarea') && document.querySelector('.nx-table textarea').value === 'Em viết rất cẩn thận, cô khen.'`), 'Mở lại sổ: nhận xét đã lưu vẫn còn');
    await b.eval(`document.querySelector('#nxExcel').click(); return 1`);
    ok(await b.eval(`return window.__dl.some(n => /^so-nhan-xet-.*\\.xlsx$/.test(n))`), 'Xuất Excel sổ nhận xét', await b.eval(`return window.__dl`));
    ok(await fits(), 'Sổ nhận xét không tràn ngang');
    ok((await emoji()) === '', 'Sổ nhận xét không có biểu tượng cảm xúc', await emoji());
    await shot('4-so-nhan-xet');
    // giáo viên gõ thẳng địa chỉ nhật ký → về Tổng quan
    await go('nhat-ky'); ok(await b.eval(`return document.querySelector('#pageTitle').textContent === 'Hôm nay'`), 'Giáo viên không mở được Nhật ký');
    const denied = await call('GET', '/api/admin/audit', null, (await call('POST', '/api/login', { username: 'lethiquynhhue', password: 'matkhau-hue-123' })).token);
    ok(!denied.entries && /quyền/.test(denied.error || ''), 'API nhật ký chặn giáo viên', denied);
    const otherBook = await call('GET', '/api/comment-books/' + classes[2].code + '/gk1', null, (await call('POST', '/api/login', { username: 'lethiquynhhue', password: 'matkhau-hue-123' })).token);
    ok(!otherBook.book && /giáo viên khác/.test(otherBook.error || ''), 'Giáo viên không đọc được sổ nhận xét lớp người khác', otherBook);
    for (const page of ['lop', 'giao-bai', 'bai-hoc', 'tai-lieu', 'thong-ke', 'huong-dan']) { await go(page); await b.sleep(500); ok(await fits(), page + ' không tràn ngang'); ok((await emoji()) === '', page + ' không có biểu tượng cảm xúc', await emoji()); }
    await shot('5-tro-giup');
    await b.eval(`document.querySelector('#logout').click(); return 1`); await until(`!document.querySelector('#login').hidden`);
    // Quản trị
    ok(await login('admin', env.TEACHER_PASSWORD), 'Quản trị đăng nhập');
    ok(await until(`document.querySelectorAll('#vzTeacher .viz-mark').length===2`), 'Tổng quan trường có biểu đồ theo giáo viên');
    await b.eval(`document.querySelector('#exportSchool').click(); return 1`);
    ok(await b.eval(`return window.__dl.some(n => /^bao-cao-truong-.*\\.xlsx$/.test(n))`), 'Xuất báo cáo trường (Excel)');
    ok((await emoji()) === '', 'Tổng quan trường không có biểu tượng cảm xúc', await emoji());
    await shot('6-quan-tri-tong-quan');
    await go('nhat-ky');
    ok(await until(`document.querySelectorAll('.log-table tbody tr').length >= 3`), 'Nhật ký có các hoạt động');
    const log = await b.eval(`return document.querySelector('.log-table').innerText`);
    ok(/Lưu sổ nhận xét/.test(log) && /Lớp 2A · 8 nhận xét/.test(log), 'Nhật ký ghi việc lưu sổ nhận xét của cô Huệ', log.slice(0, 400));
    ok(/Tạo tài khoản giáo viên/.test(log) && /Đăng nhập/.test(log), 'Nhật ký ghi tạo tài khoản và đăng nhập');
    ok(!/matkhau|quan-tri-thu/.test(log), 'Nhật ký không chứa mật khẩu');
    await b.eval(`const s=document.querySelector('#lgKind'); s.value='account'; s.dispatchEvent(new Event('change')); return 1`);
    ok(await b.eval(`return [...document.querySelectorAll('.log-table tbody tr')].every(tr => /Tạo tài khoản|Sửa thông tin|Mở khoá/.test(tr.textContent))`), 'Lọc nhật ký theo loại');
    ok(await fits(), 'Nhật ký không tràn ngang');
    await shot('7-nhat-ky');
    await go('quan-tri-giao-vien'); ok(await fits(), 'Quản lý giáo viên không tràn ngang'); ok((await emoji()) === '', 'Quản lý giáo viên không có biểu tượng cảm xúc', await emoji()); await shot('8-quan-tri-giao-vien');
    await go('nhan-xet'); ok(await until(`document.querySelector('#nxCls') && document.querySelectorAll('#nxCls option').length === 3`), 'Quản trị mở được sổ nhận xét mọi lớp');
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
