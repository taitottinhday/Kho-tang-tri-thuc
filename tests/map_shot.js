const { launch } = require('./cdp_driver.js'); const path = require('path');
(async () => {
  for (const [w, h] of [[390, 844], [1100, 800]]) {
    const b = await launch(w, h);
    try {
      await b.goto('index.html', 2000);
      await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
        document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
        document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
        document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300));
        document.querySelector('.sea-chart').scrollIntoView(); return 1;`);
      await b.sleep(600); await b.shot(path.join(__dirname, '..', 'qa-results', 'seasons', 'map-' + w + '.png'));
    } finally { await b.close(); }
  }
})();
