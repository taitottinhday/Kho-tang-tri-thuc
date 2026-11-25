// Dò chữ khó đọc (tương phản chữ/nền thấp) trên mọi trang, ngày + đêm: node tests/contrast_check.js [rộng]
const { launch } = require('./cdp_driver.js');
(async () => {
  const w = Number(process.argv[2] || 1366);
  const b = await launch(w, 860);
  const PROBE = `
    const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] }; };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
    const night = document.documentElement.dataset.theme === 'night';
    const SKY = night ? { r: 79, g: 20, b: 38, a: 1 } : { r: 201, g: 42, b: 66, a: 1 }; // màu giữa bầu trời
    const noel = document.documentElement.classList.contains('noel');
    function bgOf(el) { // màu nền thật phía sau chữ (cộng dồn lớp bán trong suốt)
      const layers = [];
      for (let p = el; p && p.nodeType === 1; p = p.parentElement) {
        const cs = getComputedStyle(p); const c = parse(cs.backgroundColor);
        if (cs.backgroundImage && cs.backgroundImage !== 'none' && !cs.backgroundImage.startsWith('url(') && p !== document.body && p !== document.documentElement) {
          // nền gradient: lấy màu đầu tiên trong gradient làm đại diện
          const m = cs.backgroundImage.match(/rgba?\\([^)]+\\)|#[0-9a-f]{3,6}/i); if (m) { const cc = parse(m[0].startsWith('#') ? '' : m[0]); if (cc && cc.a > 0.5) { layers.push(cc); break; } }
        }
        if (c && c.a > 0) { layers.push(c); if (c.a >= 0.99) break; }
        if (p.id === 'modalRoot' && p.classList.contains('modal-root') && !c) {}
      }
      let base = noel ? SKY : { r: 240, g: 247, b: 252, a: 1 };
      if (layers.length && layers[layers.length - 1].a >= 0.99) base = layers.pop();
      for (let i = layers.length - 1; i >= 0; i--) base = mix(layers[i], base);
      return base;
    }
    const out = new Map();
    const root = document.querySelector('#welcome') || document.querySelector('#modalRoot:not([hidden])') || document.querySelector('#viewRoot');
    const scope = [root, document.querySelector('.topbar')].filter(Boolean);
    for (const r of scope) {
      const tw = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); let n;
      while ((n = tw.nextNode())) {
        const t = n.textContent.trim(); if (t.length < 2) continue;
        const el = n.parentElement; if (!el || !el.getClientRects().length) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.3) continue;
        let hid = false; for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || parseFloat(s.opacity) < 0.3) { hid = true; break; } } if (hid) continue;
        if (el.closest('button:disabled,[aria-disabled=true],.locked,.later')) continue;
        const fg = parse(cs.color); if (!fg) continue;
        const bg = bgOf(el); const fgm = mix(fg, bg); const cr = ratio(fgm, bg);
        const big = parseFloat(cs.fontSize) >= 18.5 || (parseFloat(cs.fontSize) >= 14 && Number(cs.fontWeight) >= 700);
        if (cr < (big ? 3 : 3.6)) {
          const key = el.tagName.toLowerCase() + '.' + String(el.className).split(' ').filter(Boolean).slice(0, 2).join('.') + ' < ' + (el.parentElement.className || el.parentElement.tagName).toString().split(' ')[0];
          if (!out.has(key)) out.set(key, '«' + t.slice(0, 28) + '» ' + cr.toFixed(2) + ' fg ' + cs.color + ' bg rgb(' + [bg.r, bg.g, bg.b].map(Math.round) + ')');
        }
      }
    }
    return [...out].map(([k, v]) => k + '  ' + v);`;
  try {
    await b.goto('index.html', 2500);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); teacherOK = true; return 1;`);
    for (const theme of ['day', 'night']) {
      await b.eval(`db.settings.theme = '${theme}'; render(); return 1;`);
      const steps = {
        home: `go('home')`, roadmap: `go('roadmap')`, games: `go('games')`, shelf: `go('shelf')`, review: `go('review')`, badges: `go('badges')`,
        garden: `go('garden')`, profile: `go('profile')`, settings: `go('settings')`, teacher: `go('teacher')`,
        intro: `go('home'); await new Promise(r=>setTimeout(r,250)); document.querySelector('[data-start]').click()`,
        theory: `document.querySelector('#openTheory').click()`,
        quiz: `closeModal(); go('home'); await new Promise(r=>setTimeout(r,250)); document.querySelector('[data-start]').click(); await new Promise(r=>setTimeout(r,300)); document.querySelector('#beginQuiz').click()`,
        snow: `closeModal(); startSnowCatch(); await new Promise(r=>setTimeout(r,250)); document.querySelector('#scGo').click()`,
        welcome: `closeModal(); showWelcome && showWelcome()`
      };
      for (const [name, js] of Object.entries(steps)) {
        try { await b.eval(js + '; await new Promise(r=>setTimeout(r,450)); return 1;'); } catch (e) { console.log('  (bỏ qua ' + name + ': ' + e.message.slice(0, 80) + ')'); continue; }
        const res = await b.eval(PROBE);
        if (res.length) { console.log('== ' + theme + ' / ' + name); res.forEach(r => console.log('   ' + r)); }
      }
      await b.eval(`closeModal(); const w = document.querySelector('#welcome'); if (w) { w.remove(); document.body.classList.remove('welcome-open'); document.querySelector('.app-shell').inert = false; } return 1;`);
    }
    console.log('xong; lỗi JS:', JSON.stringify(b.errors));
  } finally { await b.close(); }
})();
