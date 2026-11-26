// Chụp ảnh từng cảnh nền mùa: node tests/season_shots.js [rộng] [cao] [view]
const { launch } = require('./cdp_driver.js');
const fs = require('fs'), path = require('path');
(async () => {
  const [w, h, view] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 800), process.argv[4] || 'home'];
  const out = path.join(__dirname, '..', 'qa-results', 'seasons'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h);
  try {
    await b.goto('index.html', 2200);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); return 1;`);
    for (const id of ['noel', 'tet', 'trungthu', 'khaigiang', 'nhagiao', 'thieunhi', 'none']) {
      await b.eval(`db.settings.season='${id}'; save(); go('${view}'); return 1`);
      await b.sleep(1600);
      await b.shot(path.join(out, `${id}-${view}-${w}.png`));
    }
    console.log('errors:', b.errors, b.consoleMsgs);
  } finally { await b.close(); }
})();
