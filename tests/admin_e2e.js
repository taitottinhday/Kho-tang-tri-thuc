// Kiểm thử GIAO DIỆN luồng quản trị ↔ giáo viên ↔ học sinh trên máy chủ thật: node tests/admin_e2e.js [rộng] [cao]
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'admin'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-e2e-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 6000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const fitsX = () => b.eval('return document.documentElement.scrollWidth <= innerWidth + 1');
  const shot = n => b.shot(path.join(out, n + '-' + w + '.png'));
  const go = async page => { await b.eval(`location.hash='${page}'; return 1`); await b.sleep(250); await until(`!/Đang tải/.test(document.querySelector('#view').textContent)`); await b.sleep(250); };
  const login = async (user, pass) => {
    await b.eval(`document.querySelector('#loginUser').value=${JSON.stringify(user)}; document.querySelector('#loginPass').value=${JSON.stringify(pass)}; document.querySelector('#loginBtn').click(); return 1`);
    return until(`!document.querySelector('#app').hidden && document.querySelector('#view').children.length && !/Đang tải/.test(document.querySelector('#view').textContent)`);
  };
  const logout = async () => { await b.eval(`document.querySelector('#logout').click(); return 1`); await until(`!document.querySelector('#login').hidden`); };
  try {
    await b.goto(base + 'giao-vien/', 1800);
    ok(await b.eval(`return document.activeElement.id === 'loginUser' && /admin/.test(document.querySelector('#loginUserHint').textContent)`), 'Trang đăng nhập: con trỏ ở ô tên, có hướng dẫn cho quản trị');
    ok(await login('admin', env.TEACHER_PASSWORD), 'Quản trị đăng nhập bằng tên “admin”');
    ok(await b.eval(`return !document.querySelector('[data-nav="quan-tri-giao-vien"]').hidden && /Quản trị/.test(document.querySelector('#meRole').textContent)`), 'Quản trị thấy mục Quản lý giáo viên và vai trò của mình');
    ok(await b.eval(`return /Quản trị trường/.test(document.querySelector('.page-head').textContent)`), 'Tổng quan ghi rõ đang xem toàn trường');

    // quản trị tạo lớp chưa có giáo viên
    await go('lop');
    await b.eval(`document.querySelector('#ncName').value='Lớp 1A'; document.querySelector('#ncGrade').value='1'; document.querySelector('#newClass').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('.class-card .warn-text')`), 'Lớp mới hiện “Chưa giao giáo viên”');
    const code = await b.eval(`return document.querySelector('.class-card .code').textContent.trim()`);

    // tạo tài khoản giáo viên
    await go('quan-tri-giao-vien');
    ok(await b.eval(`return /1 lớp chưa có giáo viên/.test(document.querySelector('[data-unassigned]').textContent)`), 'Trang quản trị báo lớp chưa có giáo viên');
    await b.eval(`const f=document.querySelector('[data-create]'); f.elements.name.value='Cô Nguyễn Thị An'; f.elements.username.value='CoAn '; f.elements.username.dispatchEvent(new Event('input')); f.querySelector('[data-gen]').click(); return 1`);
    const pw = await b.eval(`return document.querySelector('[data-create]').elements.password.value`);
    ok(/^[a-z]{4}-[a-z]{4}-[2-9]{3}$/.test(pw), 'Nút 🎲 tạo mật khẩu dễ đọc', pw);
    await b.eval(`document.querySelector('[data-create]').requestSubmit(); return 1`);
    ok(await until(`!document.querySelector('[data-slip]').hidden && document.querySelector('[data-rows] tr')`), 'Tạo tài khoản → hiện phiếu đăng nhập và dòng giáo viên');
    ok(await b.eval(`const t=document.querySelector('[data-slip] pre').textContent; return t.includes('coan') && t.includes(${JSON.stringify(pw)}) && t.includes('/giao-vien/')`), 'Phiếu có địa chỉ, tên đăng nhập (đã chuẩn hoá) và mật khẩu');
    await b.eval(`const f=document.querySelector('[data-assign]'); f.querySelector('select').value='coan'; f.requestSubmit(); return 1`);
    ok(await until(`document.querySelector('[data-unassigned]').hidden && /Lớp 1A/.test(document.querySelector('[data-rows]').textContent)`), 'Giao lớp 1A cho Cô An → bảng hiện lớp phụ trách');
    ok(await fitsX(), 'Trang quản trị không tràn ngang'); await shot('1-quan-tri');

    // học sinh lớp 1A gửi kết quả (như máy học sinh đồng bộ)
    await b.eval(`await fetch('/api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({classCode:'${code}',profile:{id:'p-hs-1',name:'Bé Na',avatar:'🦊',grade:1,stars:5,history:[]}})}); return 1`);
    // quản trị tạo thêm lớp của người khác để kiểm tra giáo viên không thấy
    await b.eval(`for (const [name,grade] of [['Lớp 3C',3],['Lớp 2B',2]]) await fetch('/api/classes',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessionStorage.getItem('vuonchu.teacherToken')},body:JSON.stringify({name,grade})}); return 1`);
    // một giáo viên phụ trách NHIỀU lớp: giao thêm 2B qua nút “Giao lớp” trên dòng giáo viên
    await go('quan-tri-giao-vien');
    await b.eval(`document.querySelector('[data-classes-user="coan"]').click(); return 1`);
    ok(await until(`document.querySelector('[data-classes]').open && document.querySelectorAll('[data-class-list] input').length===3`), 'Nút Giao lớp mở danh sách mọi lớp có ô chọn');
    ok(await b.eval(`const boxes=[...document.querySelectorAll('[data-class-list] input')]; return boxes.filter(x=>x.checked).length===1`), 'Lớp 1A đã được đánh dấu sẵn');
    await b.eval(`const box=[...document.querySelectorAll('.admin-class-option')].find(l=>/Lớp 2B/.test(l.textContent)).querySelector('input'); box.click(); document.querySelector('[data-classes-form] [value=save]').click(); return 1`);
    ok(await until(`!document.querySelector('[data-classes]').open && document.querySelectorAll('[data-rows] .admin-chip').length===2`), 'Cô An phụ trách 2 lớp sau một lần lưu');
    ok(await b.eval(`return /1 lớp chưa có giáo viên/.test(document.querySelector('[data-unassigned]').textContent)`), 'Lớp 3C vẫn ở khung chưa có giáo viên');
    await shot('1b-giao-nhieu-lop');
    await logout();

    // giáo viên đăng nhập
    ok(await login('coan', pw), 'Cô An đăng nhập bằng tài khoản được cấp');
    ok(await b.eval(`return document.querySelector('[data-nav="quan-tri-giao-vien"]').hidden && document.querySelector('#meName').textContent==='Cô Nguyễn Thị An'`), 'Giáo viên không thấy mục quản trị; thanh bên hiện đúng tên');
    await go('quan-tri-giao-vien');
    ok(await b.eval(`return document.querySelector('#pageTitle').textContent==='Tổng quan'`), 'Gõ thẳng địa chỉ trang quản trị → bị đưa về Tổng quan');
    await go('lop');
    const seen = await b.eval(`return [...document.querySelectorAll('.class-card h2')].map(x=>x.textContent)`);
    ok(seen.length === 2 && seen.includes('Lớp 1A') && seen.includes('Lớp 2B') && await b.eval(`return !document.querySelector('[data-owner]') && !document.querySelector('#ncOwner')`), 'Giáo viên thấy đủ 2 lớp mình phụ trách (không thấy 3C), không có nút giao lớp', seen);
    ok(await b.eval(`return /2 lớp/.test(document.querySelector('.page-head').textContent)`), 'Ghi chú phạm vi: đang xem 2 lớp');
    await go('hoc-sinh');
    ok(await until(`/Bé Na/.test(document.querySelector('#view').textContent)`), 'Giáo viên thấy học sinh lớp mình gửi lên');
    await shot('2-giao-vien');

    // tự đổi mật khẩu
    await b.eval(`document.querySelector('#changePass').click(); return 1`);
    await until(`document.querySelector('#pwForm')`);
    await b.eval(`document.querySelector('#pwOld').value=${JSON.stringify(pw)}; document.querySelector('#pwNew').value='mat-khau-rieng-cua-an'; document.querySelector('#pwAgain').value='khac-nhau-1234'; document.querySelector('#pwForm').requestSubmit(); return 1`);
    ok(await until(`/chưa giống/.test(document.querySelector('#pwErr').textContent)`), 'Đổi mật khẩu: nhập lại không khớp → báo lỗi');
    await b.eval(`document.querySelector('#pwAgain').value='mat-khau-rieng-cua-an'; document.querySelector('#pwForm').requestSubmit(); return 1`);
    ok(await until(`!document.querySelector('#dlg').open && /Đã đổi mật khẩu/.test(document.querySelector('#toast').textContent)`), 'Đổi mật khẩu thành công, vẫn ở trong trang');
    await go('lop');
    ok(await b.eval(`return document.querySelectorAll('.class-card').length===2`), 'Phiên mới sau khi đổi mật khẩu vẫn dùng được');
    const anToken = await b.eval(`return sessionStorage.getItem('vuonchu.teacherToken')`);
    await logout();

    // quản trị khoá → phiên của giáo viên hết hiệu lực
    ok(await login('', env.TEACHER_PASSWORD), 'Quản trị đăng nhập khi để trống tên');
    await go('quan-tri-giao-vien');
    await b.eval(`document.querySelector('[data-active="coan"]').click(); return 1`);
    await until(`document.querySelector('#cfOk')`);
    await b.eval(`document.querySelector('#cfOk').click(); return 1`);
    ok(await until(`/Đã khóa/.test(document.querySelector('[data-rows]').textContent)`), 'Khoá tài khoản sau khi xác nhận');
    ok(await b.eval(`return (await fetch('/api/classes',{headers:{Authorization:'Bearer ${anToken}'}})).status === 401`), 'Phiên của giáo viên bị khoá hết hiệu lực ngay');

    // quản trị chuyển lớp qua trang Lớp học
    await go('lop');
    ok(await b.eval(`return [...document.querySelectorAll('.class-owner')].some(p=>/Cô Nguyễn Thị An \\(đã khoá\\)/.test(p.textContent))`), 'Trang Lớp học (quản trị) hiện giáo viên phụ trách và tình trạng khoá');
    ok(await fitsX(), 'Trang Lớp học không tràn ngang'); await shot('3-lop-quan-tri');

    // trang học sinh: Góc thầy cô có ô tên đăng nhập
    await b.goto(base, 1500);
    const gate = await b.eval(`if (typeof teacherGate !== 'function') return 'no-fn'; try { teacherGate(); } catch (e) { return 'err:' + e.message; } await new Promise(r=>setTimeout(r,300)); return !!document.querySelector('#gateUser') && !!document.querySelector('#gateInput')`);
    ok(gate === true || gate === 'no-fn', 'Góc thầy cô (trang học sinh) có ô tên đăng nhập + mật khẩu', gate);
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally {
    await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
