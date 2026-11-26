// Kiểm thử cảnh nền theo mùa: node tests/season_e2e.js [rộng] [cao]
const { launch } = require('./cdp_driver.js');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 800)];
  const b = await launch(w, h); let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !x ? '' : ' — ' + JSON.stringify(x))); };
  try {
    await b.goto('index.html', 2200);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); return 1;`);
    // tự động theo ngày
    const auto = async d => b.eval(`window.NOEL_TODAY='${d}'; delete db.settings.season; db.settings.noel='auto'; save(); render(); return seasonId()`);
    for (const [d, id] of [['2026-12-05', 'noel'], ['2027-01-20', 'tet'], ['2026-09-01', 'khaigiang'], ['2026-09-25', 'trungthu'], ['2026-11-05', 'nhagiao'], ['2026-06-10', 'thieunhi'], ['2026-04-10', 'none']])
      ok(await auto(d) === id, 'Tự động ' + d + ' → ' + id);
    await b.eval(`delete window.NOEL_TODAY; return 1`);
    // bấm nút đổi nền trên Trang học
    for (const id of ['tet', 'trungthu', 'khaigiang', 'nhagiao', 'thieunhi', 'noel', 'none']) {
      await b.eval(`go('home'); return 1`); await b.sleep(250);
      await b.eval(`document.querySelector('[data-season-pick="${id}"]').click(); return 1`); await b.sleep(500);
      const r = await b.eval(`return { s: document.documentElement.dataset.season || '', noel: document.documentElement.classList.contains('noel'), sky: !!document.querySelector('.cd-sky'), fx: !!document.querySelector('.cd-fx'), snow: !!document.querySelector('canvas.noel-snow:not(.cd-fx)'), saved: db.settings.season, on: document.querySelector('.cd-chip.on')?.dataset.seasonPick }`);
      const want = id === 'none' ? '' : id;
      ok(r.s === want && r.saved === id && r.on === id, 'Bấm ' + id + ' → đổi nền + lưu + chip sáng', r);
      if (['tet', 'trungthu', 'khaigiang', 'nhagiao', 'thieunhi'].includes(id)) ok(r.sky && r.fx && !r.snow, id + ': có nền + hiệu ứng, không còn tuyết Noel', r);
      if (id === 'noel') ok(r.snow && !r.sky, 'Noel: tuyết rơi, không có nền lễ hội khác', r);
      if (id === 'none') ok(!r.sky && !r.fx && !r.noel, 'Vườn xanh: gỡ sạch', r);
    }
    // giữ qua tải lại + giảm chuyển động
    await b.eval(`db.settings.season='tet'; save(); return 1`); await b.goto('index.html', 2200);
    ok(await b.eval(`return document.documentElement.dataset.season`) === 'tet', 'Tải lại vẫn giữ cảnh Tết');
    const moving = async () => b.eval(`const c=document.querySelector('.cd-fx'); const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let s=0; for(let i=0;i<a.length;i+=97)s+=a[i+3]; await new Promise(r=>setTimeout(r,700)); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let t=0; for(let i=0;i<d.length;i+=97)t+=d[i+3]; return s!==t`);
    ok(await moving(), 'Cánh hoa Tết đang chuyển động');
    await b.eval(`document.body.classList.add('calm'); return 1`); await b.sleep(400);
    ok(!(await moving()), 'Giảm chuyển động → đứng yên');
    // Cài đặt có bộ chọn
    await b.eval(`document.body.classList.remove('calm'); go('settings'); return 1`); await b.sleep(400);
    ok(await b.eval(`return document.querySelectorAll('.set-card [data-season-pick]').length`) >= 8, 'Cài đặt có bộ chọn cảnh nền');
    ok(b.errors.length === 0, 'Không có lỗi JS', b.errors);
  } finally { await b.close(); }
  console.log(`\n${pass} đạt, ${fail} lỗi`); process.exit(fail ? 1 : 0);
})();
