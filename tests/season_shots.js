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
      await b.eval(`dispatchEvent(new StorageEvent('storage', { key: SeasonCatalog.cacheKey, newValue:'${id}' })); go(${JSON.stringify(view)});`);
      await b.sleep(1600);
      await b.shot(path.join(out, `${id}-${view}-${w}.png`));
    }
    console.log('errors:', b.errors, b.consoleMsgs);
  } finally { await b.close(); }
})();
