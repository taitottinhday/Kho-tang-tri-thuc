// Chụp mọi trang của luồng GIÁO VIÊN và QUẢN TRỊ (dữ liệu mẫu giống dot24) để so trước/sau khi đổi giao diện.
// Chạy: node tests/portal_shots.js [rộng] [cao] [nhãn]   → ảnh ở qa-results/portal/<nhãn>-<rộng>/
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1440), Number(process.argv[3] || 900)];
  const label = process.argv[4] || 'moi';
  const out = path.join(__dirname, '..', 'qa-results', 'portal', label + '-' + w); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-'));
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
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 8000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const go = async hash => { await b.eval(`location.hash='${hash}'; return 1`); await b.sleep(250); await until(`!/Đang tải/.test(document.querySelector('#view').textContent)`); await b.sleep(700); };
  const login = async (u, p) => { await b.eval(`document.querySelector('#loginUser').value=${JSON.stringify(u)}; document.querySelector('#loginPass').value=${JSON.stringify(p)}; document.querySelector('#loginBtn').click(); return 1`); return until(`!document.querySelector('#app').hidden && !/Đang tải/.test(document.querySelector('#view').textContent)`); };
  const report = [];
  const snap = async (role, hash) => {
    await go(hash);
    const info = await b.eval(`return { fits: document.documentElement.scrollWidth <= innerWidth + 1, title: document.querySelector('#pageTitle')?.textContent, nav: [...document.querySelectorAll('#nav a')].filter(a=>a.offsetParent).map(a=>a.textContent.trim()) }`);
    report.push({ role, hash, ...info });
    await b.shot(path.join(out, role + '-' + (hash || 'home').replace(/[^a-z0-9-]/g, '_') + '.png'), true);
  };
  try {
    await b.goto(base + 'giao-vien/', 1500);
    await b.shot(path.join(out, '0-login.png'));
    await login('lethiquynhhue', 'matkhau-hue-123');
    const pages = async role => { const navs = await b.eval(`return [...document.querySelectorAll('#nav a')].filter(a=>a.offsetParent||getComputedStyle(a).display!=='none'&&!a.hidden).map(a=>a.getAttribute('href'))`); for (const href of navs) if (href && href.startsWith('#') && href !== '#goi-ten') await snap(role, href.slice(1)); };
    await pages('gv');
    await b.eval(`document.querySelector('#logout').click(); return 1`); await b.sleep(600);
    await login('admin', env.TEACHER_PASSWORD);
    await pages('qt');
    report.push({ errors: b.errors, console: b.consoleMsgs.slice(0, 8) });
  } finally {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
    await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(JSON.stringify(report.map(r => r.hash !== undefined ? r.role + ' ' + r.hash + (r.fits ? '' : ' OVERFLOW') : r)));
  process.exit(0);
})();
