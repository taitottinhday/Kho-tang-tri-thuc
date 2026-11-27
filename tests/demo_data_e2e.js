// Nút “Tạo 7 lớp mẫu” ở trang Quản lý giáo viên (dùng trên web thật, không cần gõ lệnh). Chạy: node tests/demo_data_e2e.js [rộng] [cao]
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'du-lieu-mau'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mau-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 6000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const login = async (user, pw) => { await b.eval(`document.querySelector('#loginUser').value=${JSON.stringify(user)}; document.querySelector('#loginPass').value=${JSON.stringify(pw)}; document.querySelector('#loginBtn').click(); return 1`); return until(`!document.querySelector('#app').hidden && document.querySelector('.page-head')`); };
  const status = () => b.eval(`return document.querySelector('[data-demo-status]').textContent`);
  try {
    await b.goto(base + 'giao-vien/', 1500);
    ok(await login('admin', env.TEACHER_PASSWORD), 'Quản trị đăng nhập');
    await b.eval(`location.hash='quan-tri-giao-vien'; return 1`);
    ok(await until(`document.querySelector('[data-demo-make]')`), 'Trang quản trị có mục Dữ liệu thử');
    await b.eval(`document.querySelector('.admin-demo').open=true; document.querySelector('[data-demo-make]').click(); return 1`);
    ok(await until(`/^Xong/.test(document.querySelector('[data-demo-status]').textContent)`, 120000), 'Bấm Tạo 7 lớp mẫu chạy xong', await status());
    ok(/thêm 245 học sinh/.test(await status()), 'Tạo đủ 245 học sinh', await status());
    const pw = await b.eval(`return (document.querySelector('[data-slip] pre').textContent.match(/Mật khẩu: (\\S+)/)||[])[1]`);
    ok(!!pw && await b.eval(`return /lethiquynhhue/.test(document.querySelector('[data-slip] pre').textContent)`), 'Hiện phiếu đăng nhập của cô Quỳnh Huệ');
    ok(await b.eval(`const r=[...document.querySelectorAll('[data-rows] tr')].find(t=>/Quỳnh Huệ/.test(t.textContent)); return r && r.querySelectorAll('.admin-chip').length===7 && /245 học sinh/.test(r.textContent)`), 'Bảng giáo viên: cô Huệ phụ trách 7 lớp, 245 học sinh');
    await b.shot(path.join(out, 'tao-mau-' + w + '.png'));
    await b.eval(`document.querySelector('[data-demo-make]').click(); return 1`);
    ok(await until(`/thêm 0 học sinh/.test(document.querySelector('[data-demo-status]').textContent)`, 60000), 'Bấm lại không tạo trùng', await status());
    await b.eval(`document.querySelector('#logout').click(); return 1`);
    await until(`!document.querySelector('#login').hidden`);
    ok(await login('lethiquynhhue', pw), 'Cô Quỳnh Huệ đăng nhập bằng mật khẩu trên phiếu');
    ok(await b.eval(`return /7 lớp/.test(document.querySelector('.page-head').textContent)`), 'Cô thấy 7 lớp');
    await b.eval(`location.hash='thong-ke'; return 1`);
    ok(await until(`!/Đang tải/.test(document.querySelector('#view').textContent) && document.querySelector('#view').textContent.length > 200`, 15000), 'Trang Thống kê mở được với dữ liệu 7 lớp');
    await b.shot(path.join(out, 'thong-ke-' + w + '.png'));
    ok(await b.eval('return document.documentElement.scrollWidth <= innerWidth + 1'), 'Thống kê không tràn ngang');
    await b.eval(`document.querySelector('#logout').click(); return 1`);
    await until(`!document.querySelector('#login').hidden`);
    await login('', env.TEACHER_PASSWORD);
    await b.eval(`location.hash='quan-tri-giao-vien'; return 1`);
    await until(`document.querySelector('[data-demo-clear]')`);
    await b.eval(`document.querySelector('.admin-demo').open=true; document.querySelector('[data-demo-clear]').click(); return 1`);
    await until(`document.querySelector('#cfOk')`);
    await b.eval(`document.querySelector('#cfOk').click(); return 1`);
    ok(await until(`/Đã xoá 7 lớp mẫu/.test(document.querySelector('[data-demo-status]').textContent)`, 30000), 'Xoá dữ liệu mẫu', await status());
    ok(await b.eval(`return (await (await fetch('/api/classes',{headers:{Authorization:'Bearer '+sessionStorage.getItem('vuonchu.teacherToken')}})).json()).classes.length===0`), 'Không còn lớp mẫu nào');
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally {
    await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
