// Kiểm thử luồng QUẢN TRỊ ↔ GIÁO VIÊN ↔ HỌC SINH trên máy chủ thật (lưu tệp tạm). Chạy: node tests/admin_api.js
'use strict';
const path = require('path'), os = require('os'), fs = require('fs');
const { buildServer } = require('../server.js');

let pass = 0, fail = 0;
const check = (ok, name, info) => { if (ok) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (info !== undefined ? ' → ' + JSON.stringify(info) : '')); } };

async function run(label, extraEnv) {
  console.log('\n=== ' + label + ' ===');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuonchu-admin-'));
  const app = await buildServer({ env: { TEACHER_PASSWORD: 'admin-pass-123', SESSION_SECRET: 'x'.repeat(40), ...extraEnv }, dataDir: dir });
  const { port } = await app.listen(0, '127.0.0.1');
  const B = 'http://127.0.0.1:' + port;
  let ipSeq = 0;
  const call = async (method, url, body, token, ip) => {
    const r = await fetch(B + url, { method, headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip || '10.0.0.' + (++ipSeq % 250), ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { s: r.status, b: await r.json().catch(() => ({})) };
  };
  const login = async (username, password, ip) => (await call('POST', '/api/login', { username, password }, null, ip)).b.token;
  try {
    console.log('Đăng nhập');
    const admin = await login('', 'admin-pass-123');
    check(!!admin, 'Quản trị đăng nhập khi để trống tên');
    check(!!await login('Admin', 'admin-pass-123'), 'Quản trị cũng đăng nhập được với tên “admin”');
    check((await call('GET', '/api/me', null, admin)).b.user?.role === 'admin', '/api/me trả vai trò quản trị');
    check((await call('POST', '/api/admin/teachers', { name: 'X', username: 'admin', password: 'matkhau-1234' }, admin)).s === 400, 'Không cho tạo tài khoản trùng tên “admin”');

    console.log('Tạo tài khoản');
    for (const [name, username, password] of [['Cô An', 'coan', 'matkhau-coan'], ['Thầy Bình', 'thaybinh', 'matkhau-binh'], ['Cô Chi', 'cochi', 'matkhau-cochi']])
      check((await call('POST', '/api/admin/teachers', { name, username, password }, admin)).s === 201, 'Tạo ' + username);
    check((await call('POST', '/api/admin/teachers', { name: 'Trùng', username: 'coan', password: 'matkhau-coan' }, admin)).s === 409, 'Trùng tên đăng nhập → 409');
    check((await call('POST', '/api/admin/teachers', { name: 'Ngắn', username: 'ngan', password: '123' }, admin)).s === 400, 'Mật khẩu quá ngắn → 400');
    let an = await login('coan', 'matkhau-coan');
    let binh = await login(' ThayBinh ', 'matkhau-binh');
    const chi = await login('cochi', 'matkhau-cochi');
    check(an && binh && chi, 'Ba giáo viên đăng nhập (không phân biệt hoa thường, bỏ khoảng trắng)');
    check((await call('GET', '/api/me', null, an)).b.user?.name === 'Cô An', '/api/me trả đúng tên giáo viên');
    check((await call('GET', '/api/admin/teachers', null, an)).s === 403, 'Giáo viên không mở được trang quản trị');
    check((await call('POST', '/api/admin/teachers', { name: 'Y', username: 'yyy', password: 'matkhau-1234' }, an)).s === 403, 'Giáo viên không tạo được tài khoản');

    console.log('Lớp học thuộc giáo viên');
    const cA = (await call('POST', '/api/classes', { name: '1A', grade: 1 }, an)).b;
    const cB = (await call('POST', '/api/classes', { name: '2B', grade: 2 }, binh)).b;
    const cAdmin = (await call('POST', '/api/classes', { name: '3C', grade: 3, owner: 'cochi' }, admin)).b;
    const cFree = (await call('POST', '/api/classes', { name: 'Lớp chung', grade: 2 }, admin)).b;
    check(cA.owner === 'coan' && cB.owner === 'thaybinh', 'Lớp giáo viên tạo thuộc về chính giáo viên đó', [cA, cB]);
    check(cAdmin.owner === 'cochi', 'Quản trị tạo lớp và giao luôn cho Cô Chi');
    const seenAn = (await call('GET', '/api/classes', null, an)).b.classes.map(c => c.code);
    check(seenAn.length === 1 && seenAn[0] === cA.code, 'Cô An chỉ thấy lớp của mình', seenAn);
    check((await call('GET', '/api/classes', null, admin)).b.classes.length === 4, 'Quản trị thấy mọi lớp');
    check((await call('DELETE', '/api/classes/' + cB.code, null, an)).s === 403, 'Cô An không xoá được lớp của Thầy Bình');
    check((await call('PATCH', '/api/classes/' + cB.code, { name: 'Đổi', grade: 2 }, an)).s === 403, 'Cô An không đổi tên lớp của Thầy Bình');
    check((await call('PATCH', '/api/classes/' + cA.code, { owner: 'thaybinh' }, an)).s === 403, 'Giáo viên không tự chuyển lớp');

    console.log('Học sinh, nhận xét, bài giao theo lớp');
    const profile = (id, name) => ({ id, name, avatar: '🦊', grade: 1, stars: 3, history: [] });
    check((await call('POST', '/api/sync', { classCode: cA.code, profile: profile('p-an-1', 'Bé Na') })).s === 200, 'Học sinh lớp 1A gửi kết quả');
    check((await call('POST', '/api/sync', { classCode: cB.code, profile: profile('p-binh-1', 'Bé Tí') })).s === 200, 'Học sinh lớp 2B gửi kết quả');
    const stAn = (await call('GET', '/api/students', null, an)).b.students.map(s => s.name);
    check(stAn.length === 1 && stAn[0] === 'Bé Na', 'Cô An chỉ thấy học sinh lớp mình', stAn);
    check((await call('GET', '/api/students?classCode=' + cB.code, null, an)).s === 403, 'Cô An không xem được học sinh lớp 2B');
    check((await call('GET', '/api/students', null, admin)).b.students.length === 2, 'Quản trị thấy học sinh toàn trường');
    check((await call('POST', '/api/students/' + cB.code + '/p-binh-1/notes', { text: 'Giỏi' }, an)).s === 403, 'Không nhận xét học sinh lớp khác');
    const note = await call('POST', '/api/students/' + cA.code + '/p-an-1/notes', { text: 'Em đọc to, rõ' }, an);
    check(note.s === 200 && note.b.teacherNotes[0].by === 'Cô An', 'Nhận xét ghi tên giáo viên viết');
    check((await call('DELETE', '/api/students/' + cB.code + '/p-binh-1', null, an)).s === 403, 'Không xoá học sinh lớp khác');
    const assignBody = code => ({ classCodes: [code], topic: 'l1-01' });
    const asAn = await call('POST', '/api/assignments', assignBody(cA.code), an);
    check(asAn.s === 201 && asAn.b.assignments[0].by === 'coan', 'Cô An giao bài cho lớp mình (ghi người giao)', asAn);
    check((await call('POST', '/api/assignments', assignBody(cB.code), an)).s === 403, 'Không giao bài cho lớp khác');
    const asBinh = await call('POST', '/api/assignments', assignBody(cB.code), binh);
    check((await call('GET', '/api/assignments', null, an)).b.assignments.every(a => a.classCode === cA.code), 'Danh sách bài giao chỉ gồm lớp mình');
    check((await call('DELETE', '/api/assignments/' + asBinh.b.assignments?.[0]?.id, null, an)).s === 403, 'Không thu hồi bài của lớp khác');
    const items = [1, 2, 3].map(i => ({ prompt: 'Câu ' + i, answer: 'a', choices: ['a', 'b'] }));
    check((await call('POST', '/api/live-games', { classCode: cB.code, items }, an)).s === 403, 'Không mở đấu trường cho lớp khác');
    const room = (await call('POST', '/api/live-games', { classCode: cB.code, items }, binh)).b;
    check(!!room.code, 'Thầy Bình mở đấu trường cho lớp mình');
    check((await call('POST', '/api/live-games/' + room.code + '/start', { classCode: cB.code }, an)).s === 403, 'Cô An không điều khiển được phòng đấu trường của lớp 2B');
    check((await call('GET', '/api/live-games/' + room.code + '?classCode=' + cB.code, null, an)).s === 403, 'Cô An không xem bảng điều khiển phòng của lớp 2B');
    check((await call('POST', '/api/live-games/' + room.code + '/end', { classCode: cB.code }, binh)).s === 200, 'Thầy Bình kết thúc phòng của lớp mình');
    const sync = await call('POST', '/api/sync', { classCode: cA.code, profile: profile('p-an-1', 'Bé Na') });
    check(sync.b.assignments?.length === 1 && sync.b.teacherNotes?.[0]?.text === 'Em đọc to, rõ', 'Học sinh nhận đúng bài giao và nhận xét của cô');

    console.log('Bảng quản trị');
    const list = (await call('GET', '/api/admin/teachers', null, admin)).b;
    const rowAn = list.teachers.find(t => t.username === 'coan');
    check(rowAn.classes.length === 1 && rowAn.students === 1 && rowAn.lastLoginAt, 'Bảng giáo viên có số lớp, số học sinh, lần đăng nhập cuối', rowAn);
    check(list.unassigned.some(c => c.code === cFree.code), 'Bảng quản trị liệt kê lớp chưa có giáo viên');
    check((await call('PATCH', '/api/classes/' + cFree.code, { owner: 'coan' }, admin)).s === 200, 'Quản trị giao lớp chung cho Cô An');
    check((await call('GET', '/api/classes', null, an)).b.classes.length === 2, 'Cô An thấy ngay lớp vừa được giao');

    console.log('Khoá, đổi mật khẩu, xoá');
    check((await call('PATCH', '/api/admin/teachers/cochi', { active: false }, admin)).s === 200, 'Khoá Cô Chi');
    check((await call('GET', '/api/classes', null, chi)).s === 401, 'Phiên đang mở của Cô Chi hết hiệu lực ngay khi bị khoá');
    check(!await login('cochi', 'matkhau-cochi'), 'Tài khoản bị khoá không đăng nhập được');
    await call('PATCH', '/api/admin/teachers/cochi', { active: true }, admin);
    check(!!await login('cochi', 'matkhau-cochi'), 'Mở khoá thì đăng nhập lại được');
    await call('PATCH', '/api/admin/teachers/thaybinh', { password: 'matkhau-moi-binh' }, admin);
    check((await call('GET', '/api/classes', null, binh)).s === 401, 'Quản trị đặt lại mật khẩu → phiên cũ hết hiệu lực');
    binh = await login('thaybinh', 'matkhau-moi-binh');
    check(!!binh, 'Đăng nhập bằng mật khẩu mới');
    check((await call('POST', '/api/me/password', { current: 'sai-roi-nhe', password: 'matkhau-tu-doi' }, binh)).s === 400, 'Tự đổi mật khẩu: sai mật khẩu hiện tại bị từ chối');
    const own = await call('POST', '/api/me/password', { current: 'matkhau-moi-binh', password: 'matkhau-tu-doi' }, binh);
    check(own.s === 200 && own.b.token && (await call('GET', '/api/classes', null, own.b.token)).s === 200, 'Tự đổi mật khẩu và tiếp tục làm việc với phiên mới');
    check((await call('POST', '/api/me/password', { current: 'admin-pass-123', password: 'matkhau-12345' }, admin)).s === 400, 'Quản trị được hướng dẫn đổi mật khẩu trong Railway');
    check((await call('DELETE', '/api/admin/teachers/thaybinh?chuyenCho=thaybinh', null, admin)).s === 400, 'Không chuyển lớp cho chính người bị xoá');
    const del = await call('DELETE', '/api/admin/teachers/thaybinh?chuyenCho=coan', null, admin);
    check(del.s === 200 && del.b.movedClasses === 1, 'Xoá Thầy Bình, lớp 2B chuyển cho Cô An', del.b);
    check((await call('GET', '/api/students', null, an)).b.students.some(s => s.name === 'Bé Tí'), 'Học sinh lớp 2B vẫn còn, nay hiện ở Cô An');
    check(!await login('thaybinh', 'matkhau-tu-doi'), 'Tài khoản đã xoá không đăng nhập được');
    check((await call('GET', '/api/classes', null, own.b.token)).s === 401, 'Phiên của tài khoản đã xoá hết hiệu lực');

    console.log('Khoá đăng nhập khi gõ sai');
    for (let i = 0; i < 5; i++) await call('POST', '/api/login', { username: 'coan', password: 'sai-' + i }, null, '5.5.5.5');
    check((await call('POST', '/api/login', { username: 'coan', password: 'matkhau-coan' }, null, '5.5.5.5')).s === 429, '5 lần sai → tạm khoá tài khoản đó');
    check(!!await login('cochi', 'matkhau-cochi', '5.5.5.5'), 'Giáo viên khác cùng mạng trường vẫn đăng nhập được');
    for (let i = 0; i < 30; i++) await call('POST', '/api/login', { username: 'do' + i, password: 'x' }, null, '6.6.6.6');
    check((await call('POST', '/api/login', { username: 'cochi', password: 'matkhau-cochi' }, null, '6.6.6.6')).s === 429, 'Dò nhiều tài khoản từ một mạng → khoá cả mạng');
  } finally {
    await app.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

(async () => {
  await run('Lưu tệp', {});
  const { PGlite } = require('@electric-sql/pglite');
  const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
  const pgdb = await PGlite.create();
  const socket = new PGLiteSocketServer({ db: pgdb, port: 0, host: '127.0.0.1', maxConnections: 8 });
  await socket.start();
  try { await run('PostgreSQL', { DATABASE_URL: 'postgres://postgres@127.0.0.1:' + socket.port + '/postgres' }); }
  finally { await socket.stop(); await pgdb.close(); }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
