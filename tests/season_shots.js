// Chụp ảnh từng cảnh nền mùa: node tests/season_shots.js [rộng] [cao] [view]
const { launch } = require('./cdp_driver.js');
const fs = require('fs'), path = require('path');
(async () => {
  const [w, h, view] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 800), process.argv[4] || 'home'];
  const out = path.join(__dirname, '..', 'qa-results', 'seasons'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h);
  try {
    await b.goto('index.html', 2200);
    await b.eval(`for (let i=0;i<60 && typeof seasonId !== 'function';i++) {
        await new Promise(resolve => setTimeout(resolve,150));
      }
      if (typeof seasonId !== 'function') throw Error('Không tải được Vườn Chữ: ' + location.href);
      S.name = 'Bé Na'; S.avatar = '🦊'; hideWelcome(); render();`);
    for (const id of ['noel', 'tet', 'trungthu', 'khaigiang', 'nhagiao', 'thieunhi', 'none']) {
      await b.eval(`db.settings.season='${id}'; save(); go('${view}'); return 1`);
      await b.sleep(1600);
      await b.shot(path.join(out, `${id}-${view}-${w}.png`));
      const preview = await b.eval(`const button = document.querySelector('[data-cd-look]');
        if (!button) return false; button.click(); return true;`);
      if (preview) {
        await b.sleep(300);
        await b.shot(path.join(out, `${id}-preview-${w}.png`));
        await b.eval(`closeModal();`);
      }
    }
    console.log('errors:', b.errors, b.consoleMsgs);
  } finally { await b.close(); }
})();
