// Bộ quét bố cục tự động – Vườn Chữ Kì Diệu (Claude Code, đợt 12).
// Chạy:  node tests/layout_sweep.mjs            (đầy đủ: 24 khổ trang, 9 khổ hộp thoại, 3 khổ × 4 chế độ, thanh trên 320–2560px)
//        node tests/layout_sweep.mjs --quick    (nhanh, ~1 phút)    --full (thanh trên từng 10px)    --only views,dialogs,states,topbar
//        CHROME_PATH=... nếu Chrome không ở chỗ mặc định.   --out bao-cao.json để lưu kết quả.
// Cần Node 22+ (có WebSocket sẵn) và Chrome hoặc Edge. Không cần cài thêm gói nào.
// Thoát mã 0 khi không có lỗi; mã 1 khi có lỗi (in danh sách: loại lỗi, phần tử, khổ màn hình, trang/hộp thoại).
// Bộ “soi lỗi bố cục” chạy trong trang. Bắt các lỗi mắt thường thấy ngay:
//  squeeze      chữ bị bóp mỗi chữ một dòng (như “Lộ / trình / của / em”)
//  broken-word  một từ bị bẻ đôi xuống dòng
//  spill        chữ tràn ra ngoài khung của nó
//  clipped      chữ bị cắt mất một phần (khung overflow:hidden) mà không có dấu “…”
//  text-overlap hai dòng chữ đè lên nhau
//  covered      chữ bị một phần tử khác (không phải thanh cố định) che
//  btn-overlap  hai nút chồng lên nhau
//  offscreen    nút nằm ra ngoài màn hình
//  img-distort  ảnh bị méo (sai tỉ lệ)   img-broken  ảnh không tải được
//  overflow-x   trang bị trượt ngang      topbar      thanh trên không gọn một hàng
//  tiny         nút quá nhỏ để chạm (< 32px)
const LINT = String.raw`(() => {
  const W = document.documentElement.clientWidth, H = innerHeight, issues = [];
  const cssPath = el => { if (!el || el.nodeType !== 1) return '?'; const parts = []; for (let e = el; e && e.nodeType === 1 && parts.length < 4; e = e.parentElement) { let s = e.tagName.toLowerCase(); if (e.id) { parts.unshift(s + '#' + e.id); break; } const cls = (typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).filter(Boolean).slice(0, 2); if (cls.length) s += '.' + cls.join('.'); parts.unshift(s); } return parts.join('>'); };
  const label = el => ((el && (el.innerText || el.textContent || el.getAttribute && el.getAttribute('aria-label'))) || '').trim().replace(/\s+/g, ' ').slice(0, 36);
  const add = (type, el, msg) => issues.push({ type, path: cssPath(el), text: label(el), msg: msg || '' });
  const modal = document.getElementById('modalRoot'), welcome = document.getElementById('welcome');
  let scope = document.body;
  if (welcome) scope = welcome;
  if (modal && !modal.hidden) scope = modal;
  const qa = document.getElementById('quitAsk'); if (qa) scope = qa;
  const inScope = el => scope.contains(el);
  const cs = el => getComputedStyle(el);
  const isFixedish = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const p = cs(e).position; if (p === 'fixed' || p === 'sticky') return e; } return null; };
  const visibleEl = el => { if (!el.getClientRects().length) return false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = cs(e); if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false; } return true; };
  const inView = r => r.bottom > 0 && r.top < H && r.right > 0 && r.left < W && r.width > 0.5 && r.height > 0.5;
  const ignoreDeco = el => el.closest('.noel-lights,.noel-scene,.noel-snow,.cd-sky,.cd-scene,.cd-fx,.confetti-layer,#confetti,.gm-deco,.sr-only,[data-lint-ignore]');
  const clipCache = new Map();
  const innerBox = a => { const ar = a.getBoundingClientRect(), as = cs(a), z = a.currentCSSZoom || 1; const L = ar.left + (parseFloat(as.borderLeftWidth) || 0) * z, T = ar.top + (parseFloat(as.borderTopWidth) || 0) * z; return { L, T, R: L + a.clientWidth * z, B: T + a.clientHeight * z }; };
  const clipOf = el => {
    if (clipCache.has(el)) return clipCache.get(el);
    let c = { L: 0, T: 0, R: W, B: H };
    if (el.parentElement && el !== document.body) { const p = clipOf(el.parentElement); c = { L: p.L, T: p.T, R: p.R, B: p.B }; }
    const st = el.nodeType === 1 ? cs(el) : null;
    if (st && st.position === 'fixed') c = { L: 0, T: 0, R: W, B: H };
    if (st && (st.overflowX !== 'visible' || st.overflowY !== 'visible') && el !== document.body && el !== document.documentElement) {
      const b = innerBox(el);
      if (st.overflowX !== 'visible') { c.L = Math.max(c.L, b.L); c.R = Math.min(c.R, b.R); }
      if (st.overflowY !== 'visible') { c.T = Math.max(c.T, b.T); c.B = Math.min(c.B, b.B); }
    }
    clipCache.set(el, c); return c;
  };
  const visPart = (q, el) => { const c = clipOf(el); const L = Math.max(q.left, c.L), R = Math.min(q.right, c.R), T = Math.max(q.top, c.T), B = Math.min(q.bottom, c.B); return R - L > 1 && B - T > 1 ? { left: L, right: R, top: T, bottom: B, width: R - L, height: B - T } : null; };
  if (document.documentElement.scrollWidth > W + 1) issues.push({ type: 'overflow-x', path: 'html', text: '', msg: document.documentElement.scrollWidth + ' > ' + W });

  // ---------- chữ ----------
  const lines = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 2 });
  const owners = new Map(), blocks = new Map();
  while (walker.nextNode()) { const n = walker.currentNode, p = n.parentElement; if (!p || ignoreDeco(p) || /^(SCRIPT|STYLE|OPTION|SELECT|TEXTAREA|NOSCRIPT)$/.test(p.nodeName)) continue; if (!owners.has(p)) owners.set(p, []); owners.get(p).push(n); }
  for (const [el, nodes] of owners) {
    if (!visibleEl(el)) continue;
    const rects = [];
    for (const n of nodes) { const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.width > 0.5 && q.height > 0.5) rects.push(q); }
    if (!rects.length || !rects.some(inView)) continue;
    const st = cs(el);
    // gom dòng theo khối chứa gần nhất: <b> giữa đoạn văn xuống dòng tự nhiên thì không tính là bị bóp
    let blk = el; while (blk && blk !== scope && cs(blk).display === 'inline') blk = blk.parentElement;
    if (blk) { if (!blocks.has(blk)) blocks.set(blk, { texts: [], rects: [] }); const BB = blocks.get(blk); BB.texts.push(nodes.map(n => n.nodeValue).join(' ')); BB.rects.push(...rects); }
    // khung chứa (phần tử không inline gần nhất)
    let box = el; while (box && box !== scope && cs(box).display.startsWith('inline') && !cs(box).display.startsWith('inline-')) box = box.parentElement;
    if (!box) continue;
    const bb = box.getBoundingClientRect(), bs = cs(box);
    const spillOK = bs.overflowX !== 'visible' || bs.textOverflow === 'ellipsis';
    if (!spillOK) for (const q of rects) { if (!inView(q)) continue; if (q.right > bb.right + 2 || q.left < bb.left - 2) { add('spill', el, Math.round(q.left) + '..' + Math.round(q.right) + ' ngoài ' + Math.round(bb.left) + '..' + Math.round(bb.right)); break; } }
    // bị khung overflow:hidden cắt một phần (bỏ qua chỗ cố ý rút gọn bằng dấu “…”)
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const as = cs(a);
      if (as.textOverflow === 'ellipsis' && as.overflowX !== 'visible') break;
      const clipX = as.overflowX === 'hidden' || as.overflowX === 'clip', clipY = as.overflowY === 'hidden' || as.overflowY === 'clip';
      if (clipX || clipY) {
        const ib = innerBox(a), L = ib.L, T = ib.T, R = ib.R, B = ib.B;
        let cut = false;
        for (const q of rects) {
          if (!inView(q)) continue;
          const inter = !(q.right <= L || q.left >= R || q.bottom <= T || q.top >= B);
          if (!inter) continue; // nằm hẳn ngoài: đang thu gọn có chủ ý
          if ((clipX && (q.left < L - 1 || q.right > R + 1)) || (clipY && (q.top < T - 1.5 || q.bottom > B + 1.5))) { cut = true; break; }
        }
        if (cut) { add('clipped', el, 'bị ' + cssPath(a) + ' cắt'); break; }
      }
      if (a === scope) break;
    }
    // bị phần tử khác che (bỏ qua thanh/khung cố định: nội dung cuộn dưới chúng)
    for (const q0 of rects) {
      const q = visPart(q0, el); if (!q) continue;
      const x = Math.min(Math.max(q.left + q.width / 2, 1), W - 1), y = Math.min(Math.max(q.top + q.height / 2, 1), H - 1);
      const hit = document.elementFromPoint(x, y);
      if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue;
      { const fh = isFixedish(hit), fe = isFixedish(el); if (fh && fh !== fe && (!fe || fe.contains(fh))) continue; } // nội dung cuộn dưới thanh dính/cố định
      if (cs(el).pointerEvents === 'none') continue; // phần tử không bắt chạm (thông báo…) không dò được bằng điểm chạm
      if (!inScope(hit)) continue;
      if (hit.closest('#toast,#volPanel,.quit-ask')) continue;
      // chỉ tính là “che” khi thứ nằm trên có nền đục hoặc là ảnh (hộp trong suốt không che được chữ)
      let opaque = false;
      for (let e = hit; e && !e.contains(el); e = e.parentElement) {
        const es = cs(e); const bg = es.backgroundColor.match(/[\d.]+/g);
        if (/^(IMG|SVG|CANVAS|VIDEO|IFRAME)$/i.test(e.nodeName) || es.backgroundImage !== 'none' || (bg && (bg.length < 4 ? Number(bg[0]) + Number(bg[1]) + Number(bg[2]) >= 0 : Number(bg[3]) > 0.5))) { opaque = true; break; }
      }
      if (!opaque) continue;
      add('covered', el, 'bị ' + cssPath(hit) + ' che'); break;
    }
    const lhPx = parseFloat(st.lineHeight) || 0; // dùng chiều cao dòng thật, không dùng hộp phông chữ (cao hơn khi line-height nhỏ)
    const zEl = el.currentCSSZoom || 1;
    for (const q0 of rects) { // thu về chiều cao dòng thật TRƯỚC, rồi mới cắt theo vùng nhìn thấy (tránh lệch tâm khi chữ sát mép)
      const lhv = lhPx * zEl, h = lhv && lhv < q0.height ? lhv : q0.height, mid = q0.top + q0.height / 2;
      const q = visPart({ left: q0.left, right: q0.right, width: q0.width, top: mid - h / 2, bottom: mid + h / 2, height: h }, el); if (!q) continue;
      if (q.height < h * 0.6) continue; // dòng bị khuất quá nửa (đang cuộn qua mép) thì không xét đè
      lines.push({ el, q });
    }
  }
  for (const [blk, BB] of blocks) {
    const text = BB.texts.join(' ').trim();
    const words = text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)), tokens = text.split(/\s+/).filter(Boolean);
    const mids = BB.rects.map(q => q.top + q.height / 2).sort((x, y) => x - y); let nLines = 0, last = -1e9; const tol = Math.max(4, Math.min(...BB.rects.map(q => q.height)) * 0.5);
    for (const m of mids) { if (m - last > tol) { nLines++; last = m; } }
    const nowrap = cs(blk).whiteSpace === 'nowrap' || cs(blk).whiteSpace === 'pre';
    if (words.length >= 2 && nLines >= words.length && nLines >= 2) add('squeeze', blk, words.length + ' chữ / ' + nLines + ' dòng');
    else if (words.length >= 1 && nLines > tokens.length + (text.match(/[-–\/]/g) || []).length && !nowrap) add('broken-word', blk, tokens.length + ' cụm / ' + nLines + ' dòng');
  }
  // hai dòng chữ đè nhau
  lines.sort((a, b) => a.q.top - b.q.top);
  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const A = lines[i];
    for (let j = i + 1; j < lines.length && lines[j].q.top < A.q.bottom; j++) {
      const B = lines[j]; if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const ix = Math.min(A.q.right, B.q.right) - Math.max(A.q.left, B.q.left), iy = Math.min(A.q.bottom, B.q.bottom) - Math.max(A.q.top, B.q.top);
      if (ix <= 2 || iy <= Math.min(A.q.height, B.q.height) * 0.4) continue; // chạm mép vài px do line-height sát thì bỏ qua
      if (isFixedish(A.el) !== isFixedish(B.el)) continue; // khác lớp: nội dung cuộn dưới thanh dính/cố định
      const key = cssPath(A.el) + '|' + cssPath(B.el); if (seen.has(key)) continue; seen.add(key);
      add('text-overlap', A.el, 'đè lên ' + cssPath(B.el) + ' “' + label(B.el) + '”');
    }
  }

  // ---------- hình trang trí đè lên chữ ----------
  const icons = [...scope.querySelectorAll('img.emo,.gm-me,.gm-deco')].filter(e => visibleEl(e) && !e.closest('.noel-lights,.noel-scene'));
  for (const ic of icons) {
    const r = ic.getBoundingClientRect(); if (!inView(r) || r.width < 16) continue;
    for (const L of lines) {
      if (isFixedish(ic) !== isFixedish(L.el)) continue; // khác lớp
      if (L.el.contains(ic) || ic.contains(L.el) || L.el.closest('[aria-hidden=true]') === ic.closest('[aria-hidden=true]') && ic.closest('[aria-hidden=true]')) continue;
      // hình nằm cùng khối với dòng chữ (emoji trong câu) thì bỏ qua
      let blkI = ic.parentElement; while (blkI && cs(blkI).display === 'inline') blkI = blkI.parentElement;
      if (blkI && blkI.contains(L.el)) continue;
      const q = L.q, ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      if (ix > 4 && iy > Math.min(q.height, r.height) * 0.3) { add('icon-overlap', ic.closest('.gm-me,.gm-deco') || ic, 'đè lên chữ ' + cssPath(L.el) + ' “' + label(L.el) + '”'); break; }
    }
  }
  // ---------- nút ----------
  const sel = 'button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=radio],[tabindex]:not([tabindex="-1"])';
  const ctrls = [...scope.querySelectorAll(sel)].filter(e => visibleEl(e) && !e.closest('[hidden],[inert]') && inView(e.getBoundingClientRect()) && !ignoreDeco(e));
  const hitOK = e => { const r = e.getBoundingClientRect(); const x = Math.min(Math.max(r.left + r.width / 2, 1), W - 1), y = Math.min(Math.max(r.top + r.height / 2, 1), H - 1); const t = document.elementFromPoint(x, y); return t && (e === t || e.contains(t) || t.contains(e)); };
  const live = ctrls.filter(hitOK);
  for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
    const a = live[i], b = live[j]; if (a.contains(b) || b.contains(a)) continue;
    if (isFixedish(a) !== isFixedish(b)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ix > 3 && iy > 3) add('btn-overlap', a, 'chồng ' + cssPath(b) + ' “' + label(b) + '” ' + Math.round(ix) + 'x' + Math.round(iy));
  }
  for (const e of live) {
    const r = e.getBoundingClientRect();
    let sc = e.parentElement, inScroll = false; while (sc && sc !== document.body) { const o = cs(sc).overflowX; if (o === 'auto' || o === 'scroll') { inScroll = true; break; } sc = sc.parentElement; }
    if (!inScroll && (r.right > W + 1 || r.left < -1)) add('offscreen', e, Math.round(r.left) + '..' + Math.round(r.right) + ' / ' + W);
    if (e.matches('button,[role=button],a[href]:not(.text-link)') && (r.width < 32 || r.height < 32) && !e.closest('.text-link,.word-sentence,.pl-tokens,.th-card,.inline-link')) add('tiny', e, Math.round(r.width) + 'x' + Math.round(r.height));
  }

  // ---------- ảnh ----------
  for (const img of scope.querySelectorAll('img')) {
    if (!visibleEl(img)) continue; const r = img.getBoundingClientRect(); if (!inView(r)) continue;
    if (img.complete && img.getAttribute('src') && img.naturalWidth === 0) { add('img-broken', img, img.getAttribute('src')); continue; }
    if (!img.naturalWidth) continue;
    const fit = cs(img).objectFit;
    if (fit === 'fill' && !img.classList.contains('island-art')) {
      const a1 = img.naturalWidth / img.naturalHeight, a2 = r.width / r.height;
      if (Math.abs(a1 - a2) / a1 > 0.03) add('img-distort', img, 'gốc ' + a1.toFixed(2) + ' → hiện ' + a2.toFixed(2));
    }
  }
  // tranh quần đảo dùng object-fit:fill trong khung tỉ lệ 3:2 → kiểm tra khung
  for (const img of scope.querySelectorAll('img.island-art')) { const r = img.getBoundingClientRect(); const want = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1.5; if (r.width && Math.abs(r.width / r.height - want) / want > 0.05) add('img-distort', img, 'tỉ lệ ' + (r.width / r.height).toFixed(2)); }

  // ---------- thanh trên ----------
  const bar = document.querySelector('.topbar');
  if (bar && scope === document.body && visibleEl(bar)) {
    const br = bar.getBoundingClientRect();
    for (const k of [...bar.querySelectorAll('*')]) {
      if (!visibleEl(k) || k.closest('.noel-lights')) continue; const r = k.getBoundingClientRect(); if (r.width < 1) continue;
      if (r.right > br.right + 1 || r.left < br.left - 1 || r.bottom > br.bottom + 2 || r.top < br.top - 2) { add('topbar', k, 'ra ngoài thanh trên'); break; }
    }
    if (br.height > 80) add('topbar', bar, 'cao ' + Math.round(br.height) + 'px');
  }
  // khung hộp thoại không được trượt ngang
  if (scope !== document.body) for (const e of scope.querySelectorAll('.modal-card,.wl-inner,.pl-body,.modal-body')) { if (visibleEl(e) && e.scrollWidth > e.clientWidth + 1 && cs(e).overflowX !== 'visible') add('overflow-x', e, e.scrollWidth + ' > ' + e.clientWidth); }
  return issues;
})()`;

// Quét cả trang (hoặc hộp thoại) bằng cách cuộn từng màn hình, gộp lỗi trùng.
async function lintAll(c, sleep) {
  const found = new Map();
  const scroller = await c.ev(`(()=>{ const m=document.getElementById('modalRoot'); const w=document.getElementById('welcome');
    const pick = root => { const cands=[root, ...root.querySelectorAll('*')].filter(e=>{ const s=getComputedStyle(e); return (s.overflowY==='auto'||s.overflowY==='scroll') && e.scrollHeight>e.clientHeight+4 && e.clientHeight>200; }); cands.sort((a,b)=>b.clientHeight-a.clientHeight); return cands[0]; };
    let el = null; if (m && !m.hidden) el = pick(m); else if (w) el = pick(w);
    window.__lintScroller = el || null; return el ? (el.id || el.className || el.tagName) : 'window' })()`);
  const total = await c.ev(`(window.__lintScroller ? window.__lintScroller.scrollHeight : document.documentElement.scrollHeight)`);
  const view = await c.ev(`(window.__lintScroller ? window.__lintScroller.clientHeight : innerHeight)`);
  const step = Math.max(200, Math.floor(view * 0.8));
  for (let y = 0, k = 0; k < 40; y += step, k++) {
    await c.ev(`(()=>{ const s=window.__lintScroller; if (s) s.scrollTop=${y}; else window.scrollTo(0, ${y}); return 1 })()`);
    await sleep(60);
    // cho các hiệu ứng mở hộp (phóng to dần…) chạy xong ngay để đo đúng kích thước cuối
    await c.ev(`(()=>{ document.getAnimations().forEach(a=>{ try { const t=a.effect && a.effect.getComputedTiming(); if (a.playState==='running' && t && t.iterations!==Infinity && t.duration<1500) a.finish(); } catch(e){} }); return 1 })()`);
    const res = await c.ev(LINT) || [];
    for (const it of res) { const key = it.type + '|' + it.path + '|' + it.text; if (!found.has(key)) found.set(key, it); }
    if (y + view >= total) break;
  }
  await c.ev(`(()=>{ const s=window.__lintScroller; if (s) s.scrollTop=0; else window.scrollTo(0,0); return 1 })()`);
  return [...found.values()];
}

// ======================================================================================
// Phần điều khiển: máy chủ tĩnh + Chrome headless qua DevTools Protocol (chỉ dùng thư viện có sẵn của Node 22).
// ======================================================================================
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = name => args.includes('--' + name);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const QUICK = flag('quick');
const WORKERS = Number(opt('workers', QUICK ? 2 : 4));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CHROME = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].find(p => existsSync(p));
if (!CHROME) { console.error('Không tìm thấy Chrome/Edge. Đặt biến CHROME_PATH.'); process.exit(2); }

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(ROOT, p)); if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    await stat(file); res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' }); res.end(await readFile(file));
  } catch (e) { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/';

async function launch(port) {
  const prof = mkdtempSync(path.join(tmpdir(), 'vuon-chu-layout-'));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 100 && !page; i++) { try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) {} if (!page) await sleep(200); }
  if (!page) throw new Error('Chrome không mở được cổng ' + port);
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let nid = 0; const pend = new Map(); const errors = [];
  ws.onmessage = msg => {
    const m = JSON.parse(msg.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; errors.push('JS: ' + String(d.exception?.description || d.text).split('\n')[0]); }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++nid; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) { errors.push('Lỗi khi chạy bước kiểm thử [' + expr.slice(0, 60) + ']: ' + String(r.result.exceptionDetails.exception?.description || '').split('\n')[0]); return null; }
    return r.result?.result?.value ?? null;
  };
  await send('Runtime.enable'); await send('Page.enable');
  const c = {
    send, ev, errors,
    async nav(url) {
      await send('Page.navigate', { url }); await sleep(250);
      for (let i = 0; i < 80; i++) { const ok = await ev("document.readyState==='complete' && typeof db!=='undefined' && typeof render==='function' && !!document.querySelector('#viewRoot') && document.querySelector('#viewRoot').children.length>0"); if (ok) break; await sleep(150); }
      await sleep(200);
    },
    async close() { try { await send('Browser.close'); } catch (e) {} try { proc.kill(); } catch (e) {} }
  };
  return c;
}

// ---------------------------------- các kịch bản ----------------------------------
const SEED_RICH = `(()=>{ db.onboarded=true; S.name='Nguyễn Hoàng Bảo An'; S.avatar='🐼'; S.grade='3'; S.xp=99999; S.flowers=1234; S.streak=365; S.bestCombo=88; S.attempts=900; S.correct=820;
  const ts=myTopics(); ts.slice(0,4).forEach((t,i)=>{ const x=tstat(t.id); x.done=true; x.stars=3-(i%3); x.best=92; x.attempts=40; x.correct=35; x.theory=true; });
  for (let i=0;i<6;i++) S.review[ts[0].id+':'+i]={box:0,at:Date.now()};
  S.badges = BADGES.slice(0,5).map(b=>b.id);
  if (typeof decor==='function'){ const d=decor(); d.owned={tulip:2,santa:1,xmastree:1,rainbow:1,house:1}; d.placed={0:'tulip',3:'santa',7:'xmastree',12:'rainbow',20:'house'}; }
  S.history=[{d:dayKey(),kind:'lesson',topic:ts[0].id,acc:90},{d:dayKey(),kind:'quick',topic:'',acc:70}];
  save(); return 1 })()`;
const SEED_NEW = `(()=>{ db.onboarded=true; save(); return 1 })()`;
const VIEWS = ['home', 'roadmap', 'shelf', 'games', 'review', 'badges', 'garden', 'profile', 'settings', 'teacher'];
const H = w => (w < 600 ? 780 : w < 1000 ? 1024 : w < 1500 ? 800 : 1080);

function makeRunner(c, results) {
  const rec = (w, where, list) => { for (const it of list) results.push(Object.assign({ w, where }, it)); };
  const setSize = async (w, h) => { await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h || H(w), deviceScaleFactor: 1, mobile: w < 600 }); await c.send('Emulation.setTouchEmulationEnabled', { enabled: w < 1000 }); };
  const fresh = async seed => { await c.nav(BASE); await c.ev('localStorage.clear(); 1'); await c.nav(BASE); if (seed) { await c.ev(seed); await c.nav(BASE); } };
  const lint = () => lintAll(c, sleep);
  return {
    async views(w) {
      await setSize(w); await fresh(SEED_RICH);
      for (const v of VIEWS) { await c.ev(`(()=>{ teacherOK=true; go('${v}'); return 1 })()`); await sleep(200); rec(w, 'trang ' + v, await lint()); }
      await fresh(SEED_NEW); rec(w, 'trang home (hồ sơ mới)', await lint());
      await c.ev("go('roadmap'); 1"); await sleep(200); rec(w, 'trang roadmap (hồ sơ mới)', await lint());
    },
    async dialogs(w) {
      const step = async (where, js, wait = 250) => { await c.ev(`(()=>{ ${js}; return 1 })()`); await sleep(wait); rec(w, where, await lint()); };
      await setSize(w); await fresh(null);
      rec(w, 'màn chào', await lint());
      await step('tạo hồ sơ', "document.getElementById('wlCreate').click()");
      await step('tạo hồ sơ: chưa nhập tên', "document.getElementById('saveProfile').click()", 150);
      await c.ev("(()=>{ document.getElementById('nameInput').value='Nguyễn Hoàng Bảo An'; document.getElementById('pinInput').value='1234'; document.getElementById('saveProfile').click(); return 1 })()"); await sleep(250);
      rec(w, 'cách chơi', await lint());
      await c.ev("closeModal(); 1"); await sleep(100);
      await c.ev(SEED_RICH); await c.nav(BASE);
      await step('nhập PIN', "const b=document.querySelector('[data-pick]'); if(b) b.click()");
      await step('PIN sai', "const i=document.getElementById('pinIn'); if(i){ i.value='0000'; document.getElementById('pinOk').click(); }", 150);
      await c.ev("(()=>{ const i=document.getElementById('pinIn'); if(i){ i.value='1234'; document.getElementById('pinOk').click(); } return 1 })()"); await sleep(250);
      await c.ev("(()=>{ S.pin=undefined; save(); if (typeof hideWelcome==='function') hideWelcome(); go('home'); return 1 })()"); await sleep(150);
      await step('bảng âm lượng', "document.getElementById('soundToggle').click()", 200);
      await c.ev("(()=>{ const p=document.getElementById('volPanel'); if(p) p.remove(); return 1 })()");
      await step('sửa hồ sơ', "showProfile()"); await c.ev("closeModal(); 1");
      await step('xem trước bài', "startTopic(myTopics()[0].id)");
      await step('lý thuyết', "document.getElementById('openTheory').click()"); await c.ev("closeModal(); 1");
      await c.ev("startTopic(myTopics()[0].id); 1"); await sleep(200); await c.ev("document.getElementById('beginQuiz').click(); 1"); await sleep(250);
      const seen = new Set();
      for (let i = 0; i < 14; i++) {
        const kind = await c.ev("(Q && Q.items && Q.items[Q.i] && (Q.items[Q.i].kind || Q.items[Q.i].loai || Q.items[Q.i].type)) || 'câu'");
        if (!seen.has(kind)) { seen.add(kind); rec(w, 'làm bài: ' + kind, await lint()); }
        await c.ev(`(()=>{ const o=document.querySelector('[data-answer]:not([disabled]),[data-tf]:not([disabled]),[data-tok],[data-tile]:not(.used),[data-opt]'); if(o) o.click(); const inp=document.querySelector('.pl-input,#plInput,input[type=text]'); if(inp && !inp.value){ inp.value='abc'; inp.dispatchEvent(new Event('input',{bubbles:true})); } const ck=document.getElementById('plCheck'); if(ck && !ck.disabled) ck.click(); return 1 })()`); await sleep(220);
        if (i === 0) rec(w, 'bảng phản hồi', await lint());
        if (i === 1) { await c.ev("document.querySelector('[data-close-modal]').click(); 1"); await sleep(150); rec(w, 'hỏi “Thoát bài?”', await lint()); await c.ev("(()=>{ const b=document.getElementById('quitStay'); if(b) b.click(); return 1 })()"); }
        if (await c.ev("!!document.querySelector('.lesson-complete,.pl-result,.result-card')")) break;
        await c.ev("(()=>{ const n=document.getElementById('plCont'); if(n) n.click(); return 1 })()"); await sleep(200);
      }
      await sleep(200); rec(w, 'kết quả bài', await lint());
      await c.ev("closeModal(); go('home'); 1"); await sleep(150);
      await step('giấy khen', "if (typeof showCertificate==='function') showCertificate({ grade: S.grade })"); await c.ev("closeModal(); 1");
      await step('quà Lịch Noel', "window.NOEL_TODAY='2026-12-05T09:00:00'; S.history.unshift({d:dayKey(new Date(window.NOEL_TODAY)),kind:'lesson',topic:'x',acc:90}); render(); const a=document.querySelector('[data-adv=\"5\"]'); if(a) a.click()");
      await c.ev("closeModal(); 1"); await sleep(100); rec(w, 'trang chủ ngày 5/12', await lint());
      await c.ev("delete window.NOEL_TODAY; render(); 1");
      await step('Góc thầy cô: hỏi phép', "teacherOK=false; go('teacher')"); await c.ev("closeModal(); teacherOK=true; 1");
      if (w < 1000) { await step('menu bên', "document.getElementById('mobileMenu').click()", 300); await c.ev("closeSidebar(); 1"); }
      await step('đổi người chơi', "switchPlayer()");
      await c.ev("(()=>{ const b=document.querySelector('[data-pick]'); if(b) b.click(); return 1 })()"); await sleep(200);
      await step('học thử', "switchPlayer(); const g=document.getElementById('wlGuest'); if(g) g.click()");
    },
    async states(w) {
      const STATES = { 'ban đêm': "db.settings.theme='night'", 'chữ lớn': "db.settings.bigText=true", 'tắt Noel': "db.settings.noel='off'", 'chữ lớn + đêm + tắt Noel': "db.settings.bigText=true; db.settings.theme='night'; db.settings.noel='off'",
        'cảnh Tết': "db.settings.season='tet'", 'cảnh Trung thu': "db.settings.season='trungthu'", 'cảnh Khai giảng': "db.settings.season='khaigiang'", 'cảnh 20/11': "db.settings.season='nhagiao'", 'cảnh Thiếu nhi · chữ lớn': "db.settings.season='thieunhi'; db.settings.bigText=true", 'cảnh Tết · đêm': "db.settings.season='tet'; db.settings.theme='night'" };
      await setSize(w);
      for (const [name, js] of Object.entries(STATES)) {
        await fresh(SEED_RICH); await c.ev(`(()=>{ ${js}; save(); return 1 })()`); await c.nav(BASE);
        for (const v of VIEWS) { await c.ev(`(()=>{ teacherOK=true; go('${v}'); return 1 })()`); await sleep(200); rec(w, name + ' · ' + v, await lint()); }
      }
    },
    async topbar(ws) {
      for (const [seed, tag] of [[SEED_RICH, 'tên dài, số lớn'], [SEED_NEW, 'hồ sơ mới']]) {
        await setSize(1366); await fresh(seed);
        for (const v of ['home', 'roadmap', 'settings']) {
          await c.ev(`go('${v}'); 1`); await sleep(150);
          for (const w of ws) {
            await setSize(w); await sleep(60);
            const res = (await c.ev(LINT) || []).filter(it => /topbar|overflow-x/.test(it.type) || /topbar|mast-brand|crumb|profile-button|grade-picker|streak|back-btn/.test(it.path));
            rec(w, 'thanh trên · ' + v + ' (' + tag + ')', res);
          }
        }
      }
    }
  };
}

const range = (a, b, s) => { const out = []; for (let x = a; x <= b; x += s) out.push(x); return out; };
const W_VIEWS = QUICK ? [320, 390, 768, 1366, 1920] : [320, 360, 375, 390, 414, 430, 480, 540, 600, 700, 768, 820, 900, 1000, 1024, 1100, 1180, 1280, 1366, 1440, 1536, 1680, 1920, 2560];
const W_DIALOGS = QUICK ? [360, 1366] : [320, 360, 390, 414, 600, 768, 1024, 1366, 1920];
const W_STATES = QUICK ? [390] : [360, 768, 1366];
const W_TOPBAR = range(320, 2560, flag('full') ? 10 : QUICK ? 40 : 20);
const jobs = [];
for (const w of W_VIEWS) jobs.push(['views', w]);
for (const w of W_DIALOGS) jobs.push(['dialogs', w]);
for (const w of W_STATES) jobs.push(['states', w]);
jobs.push(['topbar', W_TOPBAR]);
const only = opt('only', ''); // ví dụ --only views,dialogs
const todo = only ? jobs.filter(j => only.split(',').includes(j[0])) : jobs;

console.log(`Quét bố cục: ${todo.length} việc, ${WORKERS} trình duyệt song song (${path.basename(CHROME)}).`);
const results = [], jsErrors = [], t0 = Date.now();
let next = 0, doneJobs = 0;
await Promise.all(Array.from({ length: Math.min(WORKERS, todo.length) }, async (_, k) => {
  const c = await launch(9420 + k + Math.floor(Math.random() * 400));
  const run = makeRunner(c, results);
  while (next < todo.length) {
    const [mode, arg] = todo[next++];
    try { await run[mode](arg); } catch (e) { jsErrors.push(`${mode} ${Array.isArray(arg) ? '' : arg}: ${e.message}`); }
    doneJobs++; process.stdout.write(`\r  ${doneJobs}/${todo.length} xong…`);
  }
  jsErrors.push(...c.errors); await c.close();
}));
server.close();
console.log(`\r  ${todo.length}/${todo.length} xong trong ${Math.round((Date.now() - t0) / 1000)} giây.`);

// --------------------------------- báo cáo ---------------------------------
const NAMES = { squeeze: 'chữ bị bóp mỗi chữ một dòng', 'broken-word': 'từ bị bẻ đôi', spill: 'chữ tràn khỏi khung', clipped: 'chữ bị cắt', 'text-overlap': 'chữ đè lên chữ', covered: 'chữ bị che', 'icon-overlap': 'hình đè lên chữ', 'btn-overlap': 'nút chồng nút', offscreen: 'nút ra ngoài màn hình', 'img-distort': 'ảnh bị méo', 'img-broken': 'ảnh không tải được', 'overflow-x': 'trang trượt ngang', topbar: 'thanh trên không gọn 1 hàng', tiny: 'nút quá nhỏ để chạm' };
const groups = new Map();
for (const r of results) {
  const key = r.type + '|' + r.path + '|' + r.text;
  if (!groups.has(key)) groups.set(key, { r, ws: new Set(), where: new Set() });
  const g = groups.get(key); g.ws.add(r.w); g.where.add(r.where);
}
const uniqErr = [...new Set(jsErrors)];
if (opt('out')) writeFileSync(opt('out'), JSON.stringify({ results, jsErrors: uniqErr }, null, 1));
if (!groups.size && !uniqErr.length) { console.log('✅ Không có lỗi bố cục nào ở mọi khổ màn hình đã quét.'); process.exit(0); }
for (const { r, ws, where } of groups.values()) {
  const w = [...ws].sort((a, b) => a - b);
  console.log(`✗ ${NAMES[r.type] || r.type}: ${r.path} “${r.text}” ${r.msg}\n    khổ ${w[0]}–${w[w.length - 1]}px (${w.length}) · ${[...where].slice(0, 4).join('; ')}`);
}
if (uniqErr.length) console.log('\nLỗi JavaScript:\n  ' + uniqErr.join('\n  '));
console.log(`\n❌ ${groups.size} lỗi bố cục, ${uniqErr.length} lỗi JavaScript.`);
process.exit(1);
