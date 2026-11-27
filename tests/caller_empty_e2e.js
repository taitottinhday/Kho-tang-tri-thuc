// Vào trò Gọi tên khi CHƯA có tên: nút dưới sân khấu phải dẫn tới chỗ thêm danh sách. Chạy: node tests/caller_empty_e2e.js [rộng] [cao]
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'goi-lop'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'goi-rong-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 6000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const label = () => b.eval(`return document.querySelector('#startStory b').textContent`);
  try {
    await b.goto(base + 'giao-vien/', 1500);
    await b.eval(`document.querySelector('#loginUser').value='admin'; document.querySelector('#loginPass').value='${env.TEACHER_PASSWORD}'; document.querySelector('#loginBtn').click(); return 1`);
    await until(`!document.querySelector('#app').hidden && document.querySelector('.scope-note')`);
    // 1) chưa có lớp nào: nút dẫn sang tự nhập tên
    await b.eval(`location.hash='goi-ten'; return 1`);
    await until(`document.querySelector('[data-open-game=prince]')`);
    await b.eval(`document.querySelector('#clearLists').click(); document.querySelector('[data-open-game=prince]').click(); return 1`);
    await until(`!document.querySelector('#callerPlay').hidden`);
    ok(/Thêm danh sách/.test(await label()) && await b.eval(`return !document.querySelector('#startStory').disabled`), 'Chưa có tên: nút dưới sân khấu là “📋 Thêm danh sách” và bấm được', await label());
    ok(await b.eval(`return /bạn nữ/.test(document.querySelector('#playHint').textContent)`), 'Lời nhắc nói rõ trò Hoàng tử cần danh sách Nữ');
    await b.shot(path.join(out, 'chua-co-ten-' + w + '.png'));
    await b.eval(`document.querySelector('#startStory').click(); return 1`);
    ok(await until(`document.querySelector('#dlg').open && document.querySelector('#ciType')`), 'Chưa có lớp: hộp thoại gợi ý tự nhập tên');
    await b.eval(`document.querySelector('#ciType').click(); return 1`);
    ok(await until(`!document.querySelector('#callerHome').hidden && document.activeElement.id==='girlsNames'`), '“Tự nhập tên” đưa về khung danh sách, con trỏ ở ô Nữ');
    // 2) có lớp: nút mở thẳng hộp lấy tên từ lớp, đưa tên vào rồi chơi được ngay
    await b.eval(`const t='Bearer '+sessionStorage.getItem('vuonchu.teacherToken'); const c=await (await fetch('/api/classes',{method:'POST',headers:{'Content-Type':'application/json',Authorization:t},body:JSON.stringify({name:'Lớp 2A',grade:2})})).json();
      for (const [i,n] of ['Nguyễn Thị Lan','Trần Ngọc Mai','Lê Văn Nam','Phạm Minh Khang'].entries()) await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({classCode:c.code,profile:{id:'p'+i+'-hs',name:n,avatar:'🦊',grade:2,history:[]}})});
      return 1`);
    await b.eval(`document.querySelector('[data-open-game=prince]').click(); return 1`);
    await until(`!document.querySelector('#callerPlay').hidden`);
    await b.eval(`document.querySelector('#startStory').click(); return 1`);
    ok(await until(`document.querySelector('#dlg').open && document.querySelectorAll('.caller-import-row').length===4`), 'Có lớp: nút mở thẳng hộp “Lấy tên từ lớp” với 4 bạn');
    ok(await b.eval(`return document.querySelector('#ciCount').textContent.includes('2 nữ · 2 nam')`), 'Đoán đúng Nữ/Nam theo tên đệm “Thị”, “Văn” và tên Mai, Khang');
    await b.eval(`document.querySelector('#ciForm').requestSubmit(); return 1`);
    ok(await until(`!document.querySelector('#dlg').open && !/Thêm danh sách/.test(document.querySelector('#startStory b').textContent)`), 'Đưa tên vào ngay trên màn chơi → nút đổi thành bắt đầu', await label());
    await b.eval(`document.querySelector('#liveCount').value='1'; document.querySelector('#liveCount').dispatchEvent(new Event('change')); document.querySelector('#startStory').click(); return 1`);
    ok(await until(`document.querySelector('#resultOverlay').classList.contains('is-shown')`, 180000), 'Bấm bắt đầu → hoàng tử gọi tên đến bảng kết quả');
    const winner = await b.eval(`return document.querySelector('#resultNames b')?.textContent`);
    ok(['Nguyễn Thị Lan', 'Trần Ngọc Mai'].includes(winner), 'Trò Hoàng tử gọi một bạn nữ', winner);
    ok(await b.eval('return document.documentElement.scrollWidth <= innerWidth + 1'), 'Không tràn ngang');
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally {
    await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
