// Máy chủ tĩnh tối giản cho Railway – không cần cài thư viện (chỉ dùng Node có sẵn).
// Railway cấp cổng qua biến môi trường PORT; chạy thử trên máy: node server.js → http://localhost:3000
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2'
};
// Chỉ phục vụ các tệp của web; không lộ mã máy chủ, kiểm thử, ghi chú nội bộ.
const HIDDEN = new Set(['server.js', 'package.json', 'package-lock.json', 'tests', 'qa-results', '_sao-luu-codex-v1', 'node_modules', 'PHOI_HOP_CLAUDE_CODEX.md']);

function send(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(text);
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch (e) { return send(res, 400, 'Bad request'); }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  const rel = path.relative(ROOT, file);
  const top = rel.split(path.sep)[0];
  if (rel.startsWith('..') || path.isAbsolute(rel) || top.startsWith('.') || HIDDEN.has(top)) return send(res, 404, 'Không tìm thấy');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Không tìm thấy');
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      // HTML/JS/CSS luôn kiểm tra bản mới (tránh trộn bản cũ – mới sau mỗi lần deploy); ảnh, phông chữ được nhớ 7 ngày.
      'Cache-Control': ['.html', '.js', '.css', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=604800',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, '0.0.0.0', () => console.log('Vườn Chữ đang chạy ở cổng ' + PORT));
