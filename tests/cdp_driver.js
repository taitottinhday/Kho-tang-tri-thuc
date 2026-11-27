// Trình điều khiển Chrome headless tối giản qua DevTools Protocol (Node 22+, không cần thư viện) – dùng cho tests/noel_e2e.js, tests/contrast_check.js.
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = process.env.SITE_ROOT || path.resolve(__dirname, '..');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      fs.readFile(f, (err, buf) => {
        if (err) { rsp.writeHead(404); rsp.end('404'); return; }
        rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); rsp.end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function launch(width, height) {
  const srv = await serve();
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'vc-cdp-'));
  const proc = spawn(CHROME, [...(process.env.HEADED ? ['--window-position=-2600,0'] : ['--headless=new']), '--no-first-run', '--disable-extensions', '--disable-background-networking', '--disable-sync', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=' + width + ',' + height, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 60; i++) {
    try {
      const port = Number(fs.readFileSync(path.join(prof, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]);
      const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = targets.find(t => t.type === 'page');
      if (page) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 150));
  }
  if (!page) { proc.kill(); srv.close(); throw new Error('Không mở được Chrome cho hồ sơ kiểm thử.'); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map(); const errors = []; const consoleMsgs = [];
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception ? m.params.exceptionDetails.exception.description : m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) consoleMsgs.push(m.params.type + ': ' + m.params.args.map(a => a.value || a.description).join(' '));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleMsgs.push('log: ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  });
  const send = (method, params) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  if (width < 700) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const api = {
    base, errors, consoleMsgs, send,
    async goto(url, waitMs) {
      await send('Page.navigate', { url: url.startsWith('http') ? url : base + url });
      await api.sleep(waitMs || 1200);
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: '(async()=>{' + expr + '})()', awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
      return r.result.value;
    },
    async shot(file, full) {
      let clip;
      if (full) {
        const m = await send('Page.getLayoutMetrics');
        clip = { x: 0, y: 0, width, height: Math.min(m.cssContentSize.height, 4000), scale: 1 };
      }
      const r = await send('Page.captureScreenshot', Object.assign({ format: 'png' }, clip ? { clip, captureBeyondViewport: true } : {}));
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    sleep: ms => new Promise(r => setTimeout(r, ms)),
    async close() { try { ws.close(); } catch (e) {} proc.kill(); srv.close(); setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {} }, 800); }
  };
  return api;
}
module.exports = { launch };
