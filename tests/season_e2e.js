// Kiểm thử cảnh nền theo mùa: node tests/season_e2e.js [rộng] [cao]
const { launch } = require('./cdp_driver.js');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 800)];
  const b = await launch(w, h); let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !x ? '' : ' — ' + JSON.stringify(x))); };
  try {
    await b.goto('index.html', 2200);
    await b.eval(`for (let i=0;i<60 && typeof seasonId !== 'function';i++) {
        await new Promise(resolve => setTimeout(resolve,150));
      }
      if (typeof seasonId !== 'function') throw Error('Không tải được Vườn Chữ: ' + location.href);
      S.name = 'Bé Na'; S.avatar = '🦊'; db.onboarded = true; save(); hideWelcome(); render();`);
    // tự động theo ngày
    const auto = async d => b.eval(`window.NOEL_TODAY='${d}'; delete db.settings.season; db.settings.noel='auto'; save(); render(); return seasonId()`);
    for (const [d, id] of [['2026-12-05', 'noel'], ['2027-01-20', 'tet'], ['2026-09-01', 'khaigiang'], ['2026-09-25', 'trungthu'], ['2026-11-05', 'nhagiao'], ['2026-06-10', 'thieunhi'], ['2026-04-10', 'none']])
      ok(await auto(d) === id, 'Tự động ' + d + ' → ' + id);
    await b.eval(`delete window.NOEL_TODAY; return 1`);
    const painted = ['none', 'khaigiang', 'nhagiao', 'thieunhi'];
    // bấm nút đổi nền trên Trang học
    for (const id of ['tet', 'trungthu', 'khaigiang', 'nhagiao', 'thieunhi', 'noel', 'none']) {
      await b.eval(`go('home'); return 1`); await b.sleep(250);
      await b.eval(`document.querySelector('[data-season-pick="${id}"]').click(); return 1`); await b.sleep(500);
      const r = await b.eval(`return { s: document.documentElement.dataset.season || '', noel: document.documentElement.classList.contains('noel'), sky: !!document.querySelector('.cd-sky'), fx: !!document.querySelector('.cd-fx'), snow: !!document.querySelector('canvas.noel-snow:not(.cd-fx)'), saved: db.settings.season, on: document.querySelector('.cd-chip.on')?.dataset.seasonPick }`);
      ok(r.s === id && r.saved === id && r.on === id, 'Bấm ' + id + ' → đổi nền + lưu + chip sáng', r);
      if (id !== 'noel') ok(r.sky && r.fx && !r.snow, id + ': có nền và hiệu ứng đúng cảnh', r);
      if (id === 'noel') ok(r.snow && !r.sky, 'Noel: tuyết rơi, không có nền lễ hội khác', r);
      if (painted.includes(id)) {
        const artwork = await b.eval(`
          const image = new Image();
          image.src = SEASONS['${id}'].art;
          await image.decode();
          const fx = document.querySelector('canvas.cd-fx');
          const before = fx.toDataURL();
          await new Promise(resolve => setTimeout(resolve,300));
          return { width:image.naturalWidth, behind:getComputedStyle(fx).zIndex === '0',
            moves:before !== fx.toDataURL(), thumb:!!document.querySelector('.cd-chip.on .cd-preview'),
            fits:document.documentElement.scrollWidth <= innerWidth };
        `);
        ok(artwork.width >= 1000 && artwork.behind && artwork.moves && artwork.thumb && artwork.fits,
          id + ': tải tranh, xem trước, hiệu ứng chuyển động phía sau thẻ và vừa màn hình', artwork);
        const vista = await b.eval(`
          const button = document.querySelector('[data-cd-look]');
          button.click();
          const dialog = document.querySelector('.cd-look-card');
          const clear = dialog && getComputedStyle(document.querySelector('.app-shell')).visibility === 'hidden';
          dialog?.querySelector('.modal-close').click();
          return clear && document.querySelector('#modalRoot').hidden && document.activeElement === button;
        `);
        ok(vista, id + ': xem tranh riêng và quay về đúng nút', vista);
      }
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
    const gardenNight = await b.eval(`
      db.settings.theme = 'night';
      const button = document.querySelector('[data-season-pick=none]');
      button.focus(); button.click();
      await new Promise(resolve => setTimeout(resolve,150));
      return { theme:document.documentElement.dataset.theme, focus:document.activeElement.dataset.seasonPick,
        meta:document.querySelector('meta[name=theme-color]').content };
    `);
    ok(gardenNight.theme === 'night' && gardenNight.focus === 'none' && gardenNight.meta === '#112a20',
      'Vườn xanh ở chế độ đêm giữ tiêu điểm và dùng màu thanh trạng thái riêng', gardenNight);
    ok(b.errors.length === 0, 'Không có lỗi JS', b.errors);
  } finally { await b.close(); }
  console.log(`\n${pass} đạt, ${fail} lỗi`); process.exit(fail ? 1 : 0);
})();
