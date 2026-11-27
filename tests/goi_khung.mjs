import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { launch } = require('./cdp_driver.js');
const out = path.resolve('qa-results/goi-khung'); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) fs.unlinkSync(path.join(out, f));
const browser = await launch(1366, 900);
const check = () => {};
const until = async (e, t = 8000) => browser.eval(`for(let i=0;i<${Math.ceil(t / 100)};i++){if(${e})return true;await new Promise(r=>setTimeout(r,100))}return false`);
const errors = [];
try {
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      let body = null;
      if (url.includes('/api/status')) body = { storage: 'file' };
      else if (url.includes('/api/login')) body = { token: 'teacher-games-browser-test' };
      else if (url.includes('/api/classes')) body = { classes: [] };
      else if (url.includes('/api/students')) body = { students: [] };
      else if (url.includes('/api/docs')) body = { documents: [] };
      else if (url.includes('/api/questions')) body = { questions: [] };
      if (body) return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return realFetch(input, init);
    };
  ` });
  await browser.goto('giao-vien/index.html', 1200);
  await browser.eval(`document.querySelector('#loginPass').value='browser-test';document.querySelector('#loginForm').requestSubmit();return 1`);
  check(await until(`!document.querySelector('#app').hidden`), 'Teacher screen opens with a local test session');
  await browser.eval(`location.hash='goi-ten';return 1`);
  check(await until(`document.querySelectorAll('.caller-game-card').length===3`), 'Three game cards render');
  await browser.shot(path.join(out, 'home.png'));

  const girls = Array.from({ length: 23 }, (_, index) => `Nguyễn Ngọc An ${index + 1}`).join('\n');
  const boys = Array.from({ length: 22 }, (_, index) => `Trần Minh Khang ${index + 1}`).join('\n');
  await browser.eval(`document.querySelector('#girlsNames').value=${JSON.stringify(girls)};document.querySelector('#girlsNames').dispatchEvent(new Event('input'));document.querySelector('#boysNames').value=${JSON.stringify(boys)};document.querySelector('#boysNames').dispatchEvent(new Event('input'));return 1`);
  check(await browser.eval(`return document.querySelector('#allCount').textContent==='45'`), 'The two lists merge into 45 students');

  for (const size of ['pc', 'dt']) {
    if (size === 'dt') await browser.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    for (const key of ['prince', 'penalty', 'detective']) {
      await browser.eval(`document.querySelector('#backHome').click();document.querySelector('[data-open-game="${key}"]').click();return 1`);
      await browser.sleep(700);
      await browser.eval(`const r=document.querySelector('#refreshRound');if(r&&!r.disabled)r.click();document.querySelector('#liveCount').value='2';document.querySelector('#liveCount').dispatchEvent(new Event('change'));document.querySelector('#gameStage').scrollIntoView({block:'center'});document.querySelector('#startStory').click();return 1`);
      let n = 0, last = '', after = 0;
      const t0 = Date.now();
      while (Date.now() - t0 < 90000) {
        await browser.sleep(350);
        const st = await browser.eval(`const c=document.querySelector('#callerCinema'); const ui=[...document.querySelectorAll('.cp-target,.cp-card,.cp-surface,.cp-stamp')].map(e=>e.className).join('|'); return {k:(c?.dataset.canh||'')+';'+ui, done:document.querySelector('#resultOverlay').classList.contains('is-shown')}`);
        if (st.k !== last || st.done) {
          last = st.k;
          await browser.sleep(st.done ? 900 : 650);
          const clip = await browser.eval('const r=document.querySelector("#gameStage").getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}');
          const img = await browser.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
          const tag = st.done ? 'kq' : st.k.replace(/[^a-z0-9-]+/gi, '_').slice(0, 30);
          fs.writeFileSync(path.join(out, `${size}-${key}-${String(n++).padStart(2, '0')}-${tag}.png`), Buffer.from(img.data, 'base64'));
          if (st.done) break;
        }
      }
      console.log(size, key, n, 'khung', Math.round((Date.now() - t0) / 1000) + 's');
    }
  }
} finally { await browser.close?.(); }
process.exit(0);
