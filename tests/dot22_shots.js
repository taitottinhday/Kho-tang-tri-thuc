// Chụp + kiểm tra giao diện mới (đợt 22) của luồng GIÁO VIÊN và QUẢN TRỊ với dữ liệu có lịch sử học.
// Chạy: node tests/dot22_shots.js [rộng] [cao]   → ảnh ở qa-results/dot22/
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 900)];
  const out = path.join(__dirname, '..', 'qa-results', 'dot22'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dot22-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const call = async (method, url, body, token) => (await fetch(base.slice(0, -1) + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })).json();
  // dữ liệu: 2 giáo viên, 4 lớp, học sinh có lịch sử 14 ngày
  const admin = (await call('POST', '/api/login', { password: env.TEACHER_PASSWORD })).token;
  await call('POST', '/api/admin/teachers', { name: 'Lê Thị Quỳnh Huệ', username: 'lethiquynhhue', password: 'matkhau-hue-123' }, admin);
  await call('POST', '/api/admin/teachers', { name: 'Trần Minh Đức', username: 'tranminhduc', password: 'matkhau-duc-123' }, admin);
  const classes = [];
  for (const [name, grade, owner] of [['Lớp 1A', 1, 'lethiquynhhue'], ['Lớp 2A', 2, 'lethiquynhhue'], ['Lớp 2B', 2, 'tranminhduc'], ['Lớp 3C', 3, '']]) classes.push(await call('POST', '/api/classes', { name, grade, owner }, admin));
  const NAMES = ['Nguyễn Thị Lan', 'Trần Minh Khang', 'Lê Ngọc Mai', 'Phạm Gia Bảo', 'Hoàng Thu Hà', 'Vũ Đức Anh', 'Đặng Bảo Ngọc', 'Bùi Quốc Huy', 'Đỗ Khánh Linh', 'Ngô Hải Nam', 'Dương Mỹ Duyên', 'Phan Thành Long'];
  const TOPICS = ['l1-01', 'l1-02', 'l2-01', 'l2-03', 'l3-01'];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const key = off => { const d = new Date(); d.setDate(d.getDate() - off); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  for (const [ci, c] of classes.entries()) for (let i = 0; i < 9 + ci * 2; i++) {
    const history = [], topics = {};
    const skill = 0.45 + rnd() * 0.5, lazy = rnd() < 0.15;
    for (let off = 0; off < 14; off++) if (!lazy && rnd() < 0.55 - off * 0.012) for (let k = 0; k < 1 + Math.floor(rnd() * 2); k++) {
      const total = 10, correct = Math.max(0, Math.min(10, Math.round(total * (skill + (rnd() - .5) * .3)))), topic = TOPICS[Math.floor(rnd() * TOPICS.length)];
      history.push({ d: key(off), at: Date.now() - off * 864e5, grade: c.grade, kind: 'lesson', topic, title: '', correct, total, acc: correct * 10 });
      const t = topics[topic] || (topics[topic] = { stars: 1, best: 0, attempts: 0, correct: 0, done: true }); t.attempts += total; t.correct += correct;
    }
    const attempts = history.reduce((a, x) => a + x.total, 0), correct = history.reduce((a, x) => a + x.correct, 0);
    await call('POST', '/api/sync', { classCode: c.code, profile: { id: 'hs-' + ci + '-' + i, name: NAMES[(i + ci * 3) % NAMES.length] + (i >= NAMES.length ? ' ' + i : ''), grade: c.grade, avatar: '🦊', xp: 50, streak: 2, lastDay: history[0]?.d || '', attempts, correct, topics, history } });
  }
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 8000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const shot = async name => { await b.sleep(400); await b.shot(path.join(out, name + '-' + w + '.png'), true); };
  const fits = () => b.eval('return document.documentElement.scrollWidth <= innerWidth + 1');
  const go = async hash => { await b.eval(`location.hash='${hash}'; return 1`); await b.sleep(300); await until(`!/Đang tải/.test(document.querySelector('#view').textContent)`); await b.sleep(500); };
  const login = async (u, p) => { await b.eval(`document.querySelector('#loginUser').value=${JSON.stringify(u)}; document.querySelector('#loginPass').value=${JSON.stringify(p)}; document.querySelector('#loginBtn').click(); return 1`); return until(`!document.querySelector('#app').hidden && document.querySelector('.page-head')`); };
  try {
    await b.goto(base + 'giao-vien/', 1500);
    await shot('0-dang-nhap');
    ok(await login('lethiquynhhue', 'matkhau-hue-123'), 'Giáo viên vào Tổng quan mới');
    ok(await b.eval(`return document.body.classList.contains('role-teacher') && /Giáo viên/.test(document.querySelector('#roleChip').textContent)`), 'Giao diện giáo viên (thanh bên sáng, nhãn Giáo viên)');
    ok(await until(`document.querySelectorAll('#vzDays .viz-mark').length===14 && document.querySelectorAll('#vzClass .viz-mark').length===2`), 'Biểu đồ 14 ngày + tỷ lệ đúng 2 lớp của cô');
    ok(await b.eval(`return document.querySelectorAll('.kpi').length===4 && document.querySelectorAll('.action').length===4`), '4 thẻ số liệu + 4 việc chính');
    ok(await fits(), 'Tổng quan giáo viên không tràn ngang');
    await shot('1-giao-vien-tong-quan');
    // di chuột lên một cột → chú thích nổi
    ok(await b.eval(`const hit=document.querySelector('#vzDays .viz-hit[data-i="13"]'); hit.dispatchEvent(new PointerEvent('pointerenter')); return !document.querySelector('#vzDays .viz-tip').hidden && /lượt/.test(document.querySelector('#vzDays .viz-tip').textContent)`), 'Di chuột lên cột hiện số liệu');
    await go('lop'); ok(await fits(), 'Lớp học (giáo viên) không tràn ngang'); await shot('2-giao-vien-lop');
    await go('hoc-sinh'); await shot('3-giao-vien-hoc-sinh');
    await b.eval(`document.querySelector('#logout').click(); return 1`); await until(`!document.querySelector('#login').hidden`);
    ok(await login('admin', env.TEACHER_PASSWORD), 'Quản trị vào Tổng quan trường');
    ok(await b.eval(`return document.body.classList.contains('role-admin') && document.querySelector('#pageTitle').textContent==='Tổng quan trường'`), 'Giao diện quản trị (thanh bên đậm, tiêu đề Tổng quan trường)');
    ok(await until(`document.querySelectorAll('#vzTeacher .viz-mark').length===2 && document.querySelectorAll('#vzGrade .viz-mark').length===3`), 'Biểu đồ theo giáo viên + theo khối');
    ok(await b.eval(`return /1 lớp chưa có giáo viên/.test(document.querySelector('.dash').textContent)`), 'Việc cần làm: báo lớp chưa có giáo viên');
    ok(await fits(), 'Tổng quan trường không tràn ngang');
    await shot('4-quan-tri-tong-quan');
    await go('quan-tri-giao-vien'); ok(await fits(), 'Quản lý giáo viên không tràn ngang'); await shot('5-quan-tri-giao-vien');
    await go('lop'); await shot('6-quan-tri-lop');
    for (const [hash, name] of [['thong-ke', '7-thong-ke'], ['giao-bai', '8-giao-bai'], ['bai-hoc', '9-bai-hoc'], ['tai-lieu', 'a-tai-lieu'], ['goi-ten', 'b-goi-ten']]) {
      await go(hash); await b.sleep(900); ok(await fits(), name + ' không tràn ngang'); await shot(name);
    }
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
