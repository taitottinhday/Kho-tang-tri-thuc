// Chụp trò UFO Trả bài theo từng pha để xem bằng mắt. node tests/ufo_shots.mjs [width height]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { launch } = require('./cdp_driver.js');
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../qa-results/ufo');
fs.mkdirSync(out, { recursive: true });
const browser = await launch(W, H);
const until = async (expression, timeout = 8000) => browser.eval(`for(let i=0;i<${Math.ceil(timeout / 100)};i++){if(${expression})return true;await new Promise(r=>setTimeout(r,100))}return false`);
let failed = 0;
const check = (ok, msg, d) => { console.log((ok ? '  ✓ ' : '  ✗ ') + msg + (ok || !d ? '' : ' ' + JSON.stringify(d))); if (!ok) failed++; };
try {
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url; let body = null;
      if (url.includes('/api/status')) body = { storage: 'file' };
      else if (url.includes('/api/login')) body = { token: 't' };
      else if (url.includes('/api/me')) body = { user: { role: 'teacher', username: 'gv', name: 'Cô Lan' } };
      else if (url.includes('/api/classes')) body = { classes: [] };
      else if (url.includes('/api/students')) body = { students: [] };
      else if (url.includes('/api/docs')) body = { documents: [] };
      else if (url.includes('/api/questions')) body = { questions: [] };
      if (body) return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return realFetch(input, init);
    };` });
  await browser.goto('giao-vien/index.html', 1200);
  await browser.eval(`document.querySelector('#loginPass').value='x';document.querySelector('#loginForm').requestSubmit();return 1`);
  await until(`!document.querySelector('#app').hidden`);
  await browser.eval(`location.hash='goi-ten';return 1`);
  await until(`document.querySelectorAll('.caller-game-card').length>=4`);
  const N = Number(process.env.N || 32);
  const fam = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ'], mid = ['Minh', 'Ngọc', 'Gia', 'Thảo', 'Bảo', 'Khánh'], given = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Khang', 'Linh', 'My', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Trang', 'Uyên', 'Vy', 'Yến', 'Tú', 'Long'];
  const names = Array.from({ length: N }, (_, i) => fam[i % 6] + ' ' + mid[(i * 5) % 6] + ' ' + given[i % 18] + (i >= 18 ? ' ' + (i - 17) : ''));
  await browser.eval(`const g=document.querySelector('#girlsNames');g.value=${JSON.stringify(names.slice(0, N / 2).join('\n'))};g.dispatchEvent(new Event('input'));const b=document.querySelector('#boysNames');b.value=${JSON.stringify(names.slice(N / 2).join('\n'))};b.dispatchEvent(new Event('input'));return 1`);
  await browser.shot(path.join(out, W + '-home.png'));
  await browser.eval(`document.querySelector('[data-open-game="ufo"]').click();return 1`);
  check(await until(`document.querySelectorAll('.is-ufo-board .caller-student').length===${N}`), 'UFO board shows the class');
  await browser.sleep(900);
  await browser.shot(path.join(out, W + '-idle.png'));
  const count = Number(process.env.COUNT || 1);
  await browser.eval(`document.querySelector('#liveCount').value='${count}';document.querySelector('#liveCount').dispatchEvent(new Event('change'));document.querySelector('#startStory').click();return 1`);
  const seen = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    const st = await browser.eval(`return {phase:document.querySelector('#callerCinema')?.dataset.ufoPhase||'',result:!document.querySelector('#resultOverlay').hidden}`);
    const key = st.result ? 'result' : st.phase;
    if (!seen.has(key)) { seen.add(key); await browser.sleep(key === 'result' ? 1300 : key === 'abduct' ? 1000 : 450); await browser.shot(path.join(out, W + '-' + String(seen.size).padStart(2, '0') + '-' + key + '.png')); }
    if (st.result) break;
    await browser.sleep(120);
  }
  console.log('  phases: ' + [...seen].join(' → ') + ' in ' + Math.round((Date.now() - t0) / 1000) + 's');
  check(seen.has('result'), 'Result appears');
  check(!browser.errors.length, 'No page errors', browser.errors);
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);
