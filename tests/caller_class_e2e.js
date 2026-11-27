// Nối luồng Lớp học → Gọi tên trên máy chủ thật: tạo 7 lớp mẫu bằng scripts/seed-demo-classrooms.js,
// giáo viên đăng nhập, “Lấy tên từ lớp”, chơi đủ 3 trò. Chạy: node tests/caller_class_e2e.js [rộng] [cao]
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const { execFile } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'goi-lop'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goi-lop-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 500))); };
  const seed = await new Promise(res => execFile(process.execPath, [path.join(__dirname, '..', 'scripts', 'seed-demo-classrooms.js')],
    { env: { ...process.env, VUONCHU_URL: base, VUONCHU_ADMIN_PASSWORD: env.TEACHER_PASSWORD } }, (e, so, se) => res({ e, so: String(so), se: String(se) })));
  const pw = (seed.so.match(/hãy lưu lại\):\s*\n(\S+)/) || [])[1];
  ok(!seed.e && /245/.test(seed.so) && pw, 'Tệp dữ liệu mẫu tạo 7 lớp, 245 học sinh, tài khoản cô Quỳnh Huệ', seed.se || seed.so);
  const b = await launch(w, h);
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 6000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  try {
    await b.goto(base + 'giao-vien/', 1500);
    await b.eval(`document.querySelector('#loginUser').value='lethiquynhhue'; document.querySelector('#loginPass').value=${JSON.stringify(pw || '')}; document.querySelector('#loginBtn').click(); return 1`);
    ok(await until(`!document.querySelector('#app').hidden && document.querySelector('.page-head')`), 'Cô Quỳnh Huệ đăng nhập');
    ok(await b.eval(`return /7 lớp/.test(document.querySelector('.page-head').textContent)`), 'Cô thấy đủ 7 lớp mình phụ trách');
    await b.eval(`location.hash='goi-ten'; return 1`);
    ok(await until(`document.querySelector('#importClass')`), 'Trang Gọi tên có nút “Lấy tên từ lớp”');
    await b.eval(`document.querySelector('#clearLists').click(); document.querySelector('#importClass').click(); return 1`);
    ok(await until(`document.querySelector('#dlg').open && document.querySelectorAll('#ciClass option').length===7 && document.querySelectorAll('.caller-import-row').length===35`), 'Hộp chọn lớp: 7 lớp, lớp đầu 35 bạn');
    const split = await b.eval(`return document.querySelector('#ciCount').textContent`);
    const m = split.match(/(\d+) nữ · (\d+) nam/);
    ok(m && +m[1] > 5 && +m[2] > 5, 'Máy đoán sẵn Nữ/Nam cho cả lớp', split);
    // sửa tay một bạn rồi đưa vào danh sách
    await b.eval(`const row=document.querySelector('.caller-import-row'); const g=row.querySelector('[aria-pressed=true]').dataset.g; row.querySelector('[data-g='+(g==='nu'?'nam':'nu')+']').click(); return 1`);
    ok(await b.eval(`return document.querySelector('#ciCount').textContent !== ${JSON.stringify(split)}`), 'Bấm đổi Nữ/Nam cập nhật số đếm');
    await b.shot(path.join(out, 'lay-ten-' + w + '.png'));
    await b.eval(`document.querySelector('#ciForm').requestSubmit(); return 1`);
    ok(await until(`!document.querySelector('#dlg').open && document.querySelector('#allCount').textContent==='35'`), 'Đưa 35 bạn vào danh sách Gọi tên');
    const counts = await b.eval(`return [document.querySelector('#girlsCount').textContent, document.querySelector('#boysCount').textContent].map(Number)`);
    ok(counts[0] + counts[1] === 35 && counts[0] > 0 && counts[1] > 0, 'Danh sách Nữ và Nam đều có tên', counts);
    // chơi đủ 3 trò, mỗi trò gọi 1 bạn
    for (const [game, scope] of [['prince', 'girls'], ['penalty', 'boys'], ['detective', 'all']]) {
      await b.eval(`document.querySelector('#backHome')?.click(); document.querySelector('[data-open-game=${game}]').click(); return 1`);
      await until(`document.querySelectorAll('.caller-student').length > 0`);
      await b.eval(`document.querySelector('#liveCount').value='1'; document.querySelector('#liveCount').dispatchEvent(new Event('change')); document.querySelector('#startStory').click(); return 1`);
      ok(await until(`document.querySelector('#resultOverlay').classList.contains('is-shown')`, 180000), 'Trò ' + game + ' chạy đến bảng kết quả');
      const winner = await b.eval(`return document.querySelector('#resultNames b')?.textContent || ''`);
      const list = await b.eval(`return document.querySelector('#${scope === 'girls' ? 'girlsNames' : scope === 'boys' ? 'boysNames' : 'girlsNames'}').value + '\\n' + ${scope === 'all' ? "document.querySelector('#boysNames').value" : "''"}`);
      ok(winner && list.split('\n').includes(winner), 'Trò ' + game + ' gọi đúng một bạn trong lớp vừa lấy', winner);
      await b.shot(path.join(out, game + '-' + w + '.png'));
      await b.eval(`document.querySelector('#resultHome').click(); return 1`);
    }
    // nhớ lựa chọn Nữ/Nam cho lần sau
    await b.eval(`document.querySelector('#importClass').click(); return 1`);
    await until(`document.querySelectorAll('.caller-import-row').length===35`);
    ok(await b.eval(`return document.querySelector('#ciCount').textContent !== ${JSON.stringify(split)}`), 'Lần sau mở lại, máy nhớ bạn đã được sửa Nữ/Nam');
    await b.eval(`document.querySelector('#dlg').close(); return 1`);
    ok(await b.eval('return document.documentElement.scrollWidth <= innerWidth + 1'), 'Không tràn ngang');
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally {
    await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
