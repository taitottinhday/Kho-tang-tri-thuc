// node tests/streak_shots.js [rộng] [cao] [streak]
const { launch } = require('./cdp_driver.js'); const path = require('path'), fs = require('fs');
(async () => {
  const [w, h, st] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 800), Number(process.argv[4] || 16)];
  const out = path.join(__dirname, '..', 'qa-results', 'seasons'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h);
  try {
    await b.goto('index.html', 5000);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); return 1;`);
    await b.eval(`S.streak=${st}; S.bestStreak=${st}; S.lastDay=dayKey(); S.streakOutfit=10; save(); go('streak'); return 1`); await b.sleep(900);
    await b.shot(path.join(out, `streak-${w}.png`), true);
    await b.eval(`go('teacher'); return 1`); await b.sleep(500);
    console.log(await b.eval(`return document.body.innerText.slice(0,200)`), b.errors);
  } finally { await b.close(); }
})();
