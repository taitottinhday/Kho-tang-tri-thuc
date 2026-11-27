// Máy chủ tĩnh và API cho Vườn Chữ. Railway chạy bằng: node server.js
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createStore, createApiHandler } = require('./server/api');

const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4'
};
// Chỉ phục vụ tệp ứng dụng; không để lộ mã nguồn máy chủ, dữ liệu hay ghi chú nội bộ.
const HIDDEN = new Set(['server.js', 'server', '.data', 'package.json', 'package-lock.json', 'tests', 'qa-results', '_sao-luu-codex-v1', 'node_modules', 'PHOI_HOP_CLAUDE_CODEX.md']);

function send(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
function staticRequest(req, res, root) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return send(res, 400, 'Bad request'); }
  if (pathname === '/giao-vien') { res.writeHead(301, { Location: '/giao-vien/' }); return res.end(); }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.normalize(path.join(root, pathname));
  const rel = path.relative(root, file);
  const top = rel.split(path.sep)[0];
  if (rel.startsWith('..') || path.isAbsolute(rel) || top.startsWith('.') || HIDDEN.has(top)) return send(res, 404, 'Không tìm thấy');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Không tìm thấy');
    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': ['.html', '.js', '.mjs', '.css', '.json'].includes(ext) ? 'no-cache' : 'public, max-age=604800',
      'X-Content-Type-Options': 'nosniff'
    };
    let range;
    if (ext === '.mp4') {
      headers['Accept-Ranges'] = 'bytes';
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const suffix = match && !match[1] ? Number(match[2]) : 0;
        const start = match ? (match[1] ? Number(match[1]) : Math.max(0, st.size - suffix)) : st.size;
        const end = match?.[1] && match[2] ? Math.min(Number(match[2]), st.size - 1) : st.size - 1;
        if (start < 0 || start >= st.size || end < start || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
          res.writeHead(416, { 'Content-Range': 'bytes */' + st.size }); return res.end();
        }
        range = { start, end };
        headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + st.size;
        headers['Content-Length'] = end - start + 1;
      }
    }
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') return res.end();
    const stream = fs.createReadStream(file, range);
    res.once('close', () => stream.destroy());
    stream.on('error', error => res.destroy(error));
    stream.pipe(res);
  });
}

async function buildServer(options = {}) {
  const env = options.env || process.env;
  const root = options.root || ROOT;
  const store = await createStore(env, { dataDir: options.dataDir, pool: options.pool });
  const api = createApiHandler(store, env);
  const server = http.createServer((req, res) => {
    if (req.url === '/api' || req.url.startsWith('/api/')) return api(req, res);
    staticRequest(req, res, root);
  });
  return {
    server, store,
    listen(port = Number(env.PORT) || 3000, host = '0.0.0.0') {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => { server.removeListener('error', reject); resolve(server.address()); });
      });
    },
    async close() {
      if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await store.close?.();
    }
  };
}

if (require.main === module) {
  buildServer().then(app => app.listen().then(address => {
    console.log('Vườn Chữ đang chạy ở cổng ' + address.port + ' · lưu trữ ' + app.store.kind);
    const stop = () => app.close().then(() => process.exit(0));
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
  })).catch(error => { console.error('Không khởi động được Vườn Chữ:', error.message); process.exitCode = 1; });
}

module.exports = { buildServer, staticRequest, HIDDEN };
