// Trang Tài liệu của giáo viên: chọn lớp nhận, đổi lớp nhận bằng hộp thoại, cột “Giao cho lớp”.
// Chạy: node tests/gv_tai_lieu_lop.js [rộng] [cao]   → ảnh ở qa-results/tai-lieu/
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'tai-lieu'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gvtl-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const call = async (method, url, body, token) => { const r = await fetch(base.slice(0, -1) + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); return r.json(); };
  const admin = (await call('POST', '/api/login', { password: env.TEACHER_PASSWORD })).token;
  await call('POST', '/api/admin/teachers', { name: 'Lê Thị Quỳnh Huệ', username: 'hue', password: 'matkhau-hue-123' }, admin);
  const A = (await call('POST', '/api/classes', { name: 'Lớp 2A', grade: 2, owner: 'hue' }, admin)).code;
  const B = (await call('POST', '/api/classes', { name: 'Lớp 3B', grade: 3, owner: 'hue' }, admin)).code;
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const mk = async (title, classCodes) => (await call('POST', '/api/docs', { name: title + '.png', title, grade: 'chung', topic: '', note: '', published: true, classCodes, data: png }, admin)).document;
  const docA = await mk('Phiếu cho 2A', [A]); await mk('Phiếu cho mọi lớp', []);
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 8000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  try {
    await b.goto(base + 'giao-vien/', 1500);
    await b.eval(`document.querySelector('#loginUser').value='hue'; document.querySelector('#loginPass').value='matkhau-hue-123'; document.querySelector('#loginBtn').click(); return 1`);
    await until(`!document.querySelector('#app').hidden`);
    await b.eval(`location.hash='tai-lieu'; return 1`);
    ok(await until(`document.querySelectorAll('#dClasses input[value]').length===2`), 'Có ô chọn lớp nhận (2 lớp của cô)');
    ok(await b.eval(`return document.querySelector('#dClasses input[value="${A}"]').checked && !document.querySelector('#dClasses [data-all]').checked`), 'Giáo viên mặc định giao cho lớp đầu tiên của mình, không phải mọi lớp');
    await b.eval(`document.querySelector('#dClasses input[value="${B}"]').click(); return 1`);
    ok(await b.eval(`return document.querySelectorAll('#dClasses input[value]:checked').length===2`), 'Chọn thêm lớp 3B');
    await b.eval(`document.querySelector('#dClasses [data-all]').click(); return 1`);
    ok(await b.eval(`return document.querySelectorAll('#dClasses input[value]:checked').length===0 && document.querySelector('#dClasses [data-all]').checked`), 'Chọn “Mọi lớp” thì bỏ chọn từng lớp');
    ok(await b.eval(`const t=document.querySelector('#dList').textContent; return /Lớp 2A/.test(t) && /Mọi lớp/.test(t)`), 'Cột “Giao cho lớp” hiện tên lớp và “Mọi lớp”');
    ok(await b.eval(`return document.documentElement.scrollWidth <= innerWidth + 1`), 'Không tràn ngang');
    await b.shot(path.join(out, 'gv-' + w + '.png'), true);
    // đổi lớp nhận
    await b.eval(`document.querySelector('[data-dcls="${docA.id}"]').click(); return 1`);
    ok(await until(`document.querySelector('#dcPick')`), 'Bấm vào lớp hiện hộp thoại đổi lớp');
    await b.eval(`document.querySelector('#dcPick input[value="${B}"]').click(); return 1`);
    await b.shot(path.join(out, 'gv-doi-lop-' + w + '.png'));
    await b.eval(`document.querySelector('#dcForm').requestSubmit(); return 1`);
    ok(await until(`/Lớp 2A, Lớp 3B/.test(document.querySelector('#dList').textContent)`), 'Lưu: bảng hiện “Lớp 2A, Lớp 3B”');
    const saved = (await call('GET', '/api/docs', null, admin)).documents.find(d => d.id === docA.id);
    ok(saved.classCodes.length === 2 && saved.classCodes.includes(B), 'Máy chủ đã lưu 2 lớp nhận', saved.classCodes);
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})();
