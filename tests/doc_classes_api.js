// Tài liệu giao theo lớp: học sinh chỉ thấy tài liệu chung + của lớp mình; không lộ mã lớp khác; giáo viên chỉ giao cho lớp của mình.
// Chạy: node tests/doc_classes_api.js   (PG=1 để chạy trên PostgreSQL nhúng)
'use strict';
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  let pgdb, socket;
  if (process.env.PG) {
    const { PGlite } = require('@electric-sql/pglite'); const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
    pgdb = await PGlite.create(); socket = new PGLiteSocketServer({ db: pgdb, port: 0, host: '127.0.0.1', maxConnections: 8 }); await socket.start();
    env.DATABASE_URL = 'postgres://postgres@127.0.0.1:' + socket.port + '/postgres';
  }
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port;
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); };
  const call = async (method, url, body, token) => { const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const type = r.headers.get('content-type') || ''; return { status: r.status, body: type.includes('json') ? await r.json() : null }; };
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  try {
    const admin = (await call('POST', '/api/login', { password: env.TEACHER_PASSWORD })).body.token;
    await call('POST', '/api/admin/teachers', { name: 'Cô Huệ', username: 'hue', password: 'matkhau-hue-123' }, admin);
    await call('POST', '/api/admin/teachers', { name: 'Thầy Đức', username: 'duc', password: 'matkhau-duc-123' }, admin);
    const hue = (await call('POST', '/api/login', { username: 'hue', password: 'matkhau-hue-123' })).body.token;
    const A = (await call('POST', '/api/classes', { name: 'Lớp 2A', grade: 2, owner: 'hue' }, admin)).body.code;
    const B = (await call('POST', '/api/classes', { name: 'Lớp 3B', grade: 3, owner: 'duc' }, admin)).body.code;
    const up = (title, extra, token) => call('POST', '/api/docs', { name: title + '.png', title, grade: 'chung', topic: '', note: '', published: true, data: png, ...extra }, token);

    const forA = await up('Phiếu lớp A', { classCodes: [A] }, hue);
    ok(forA.status === 201 && forA.body.document.classCodes[0] === A, 'Giáo viên giao tài liệu cho lớp của mình');
    const forB = await up('Phiếu lớp B', { classCodes: [B] }, admin);
    const common = await up('Phiếu chung', {}, admin);
    ok(forB.status === 201 && common.status === 201, 'Quản trị giao cho lớp bất kỳ và giao cho mọi lớp');
    const stolen = await up('Giao nhầm lớp người khác', { classCodes: [B] }, hue);
    ok(stolen.status === 403, 'Giáo viên không giao được cho lớp của giáo viên khác', stolen.status);
    const bad = await up('Mã sai', { classCodes: ['abc'] }, admin);
    ok(bad.status === 400, 'Mã lớp sai định dạng bị từ chối', bad.status);

    const titles = r => r.body.documents.map(d => d.title).sort().join('|');
    const anon = await call('GET', '/api/docs');
    ok(titles(anon) === 'Phiếu chung', 'Chưa kết nối lớp: chỉ thấy tài liệu chung', titles(anon));
    const asA = await call('GET', '/api/docs?classCode=' + A);
    ok(titles(asA) === 'Phiếu chung|Phiếu lớp A', 'Học sinh lớp A thấy tài liệu chung + của lớp A', titles(asA));
    const asB = await call('GET', '/api/docs?classCode=' + B.toLowerCase());
    ok(titles(asB) === 'Phiếu chung|Phiếu lớp B', 'Học sinh lớp B thấy tài liệu chung + của lớp B (không phân biệt hoa thường)', titles(asB));
    ok(!JSON.stringify(asA.body).includes(B) && asA.body.documents.every(d => !('classCodes' in d)), 'Danh sách công khai không lộ mã của lớp khác');
    ok(asA.body.documents.find(d => d.title === 'Phiếu lớp A').forClass === true && asA.body.documents.find(d => d.title === 'Phiếu chung').forClass === false, 'Có cờ forClass để học sinh thấy “Của lớp em”');

    const fileA = forA.body.document.id;
    ok((await call('GET', '/api/docs/' + fileA)).status === 404, 'Mở thẳng tệp của lớp A khi chưa kết nối → 404');
    ok((await call('GET', '/api/docs/' + fileA + '?classCode=' + B)).status === 404, 'Lớp B không mở được tệp của lớp A → 404');
    ok((await call('GET', '/api/docs/' + fileA + '?classCode=' + A)).status === 200, 'Lớp A mở được tệp của lớp A');
    ok((await call('GET', '/api/docs/' + fileA, null, hue)).status === 200, 'Giáo viên (có phiên) mở được tệp');

    const teacherList = await call('GET', '/api/docs', null, hue);
    ok(teacherList.body.documents.every(d => Array.isArray(d.classCodes)), 'Giáo viên thấy danh sách kèm classCodes');
    const move = await call('PATCH', '/api/docs/' + fileA, { classCodes: [B] }, hue);
    ok(move.status === 403, 'Không đổi sang lớp của giáo viên khác', move.status);
    const widen = await call('PATCH', '/api/docs/' + fileA, { classCodes: [] }, hue);
    ok(widen.status === 200 && widen.body.classCodes.length === 0, 'Đổi sang mọi lớp');
    ok(titles(await call('GET', '/api/docs?classCode=' + B)).includes('Phiếu lớp A'), 'Sau khi đổi sang mọi lớp, lớp B thấy tài liệu đó');
    const pubOnly = await call('PATCH', '/api/docs/' + fileA, { published: false }, hue);
    ok(pubOnly.status === 200 && !titles(await call('GET', '/api/docs?classCode=' + A)).includes('Phiếu lớp A'), 'Chuyển về bản nháp thì học sinh không thấy nữa');
    await call('PATCH', '/api/docs/' + fileA, { classCodes: [A], published: true }, hue);
    ok(titles(await call('GET', '/api/docs?classCode=' + A)).includes('Phiếu lớp A') && !titles(await call('GET', '/api/docs?classCode=' + B)).includes('Phiếu lớp A'), 'Vừa đổi lớp vừa công bố trong một lần');
    const log = (await call('GET', '/api/admin/audit', null, admin)).body.entries.map(e => e.action);
    ok(log.includes('doc.classes') && log.includes('doc.upload'), 'Nhật ký ghi lại giao tài liệu cho lớp');
  } catch (error) { fail++; console.error(error); }
  finally { await app.close(); if (socket) { await socket.stop(); await pgdb.close(); } fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi' + (process.env.PG ? ' (PostgreSQL)' : ' (tệp)'));
  process.exit(fail ? 1 : 0);
})();
