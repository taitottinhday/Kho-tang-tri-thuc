// Kiểm thử luồng giáo viên ↔ học sinh trên máy chủ thật: node tests/gv_e2e.js [rộng] [cao]
// Mặc định lưu tạm bằng tệp; đặt PG=1 để chạy trên PostgreSQL (PGlite).
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'gv'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gv-'));
  const env = { TEACHER_PASSWORD: 'mat-khau-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789' };
  let pgdb, socket;
  if (process.env.PG) {
    const { PGlite } = require('@electric-sql/pglite'); const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
    pgdb = await PGlite.create(); socket = new PGLiteSocketServer({ db: pgdb, port: 0, host: '127.0.0.1', maxConnections: 8 }); await socket.start();
    env.DATABASE_URL = 'postgres://postgres@127.0.0.1:' + socket.port + '/postgres';
  }
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const teacher = await launch(w, h);
  let b = teacher, student, pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !x ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); };
  const wait = ms => b.sleep(ms);
  const fitsX = () => b.eval('return document.documentElement.scrollWidth <= ' + (w + 1) + ' && innerWidth <= ' + (w + 1));
  const shot = n => b.shot(path.join(out, n + '-' + w + '.png'));
  // đợi một điều kiện trong trang
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 6000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  const go = async page => { await b.eval(`location.hash='${page}'; return 1`); await wait(700); };
  try {
    // ===== Giáo viên đăng nhập =====
    await b.goto(base + 'giao-vien', 1800);
    ok(await b.eval('return location.pathname.endsWith("/giao-vien/") && !document.querySelector("#login").hidden'), 'Mở /giao-vien → chuyển đúng đường dẫn, hiện đăng nhập');
    await shot('0-dang-nhap');
    await b.eval(`document.querySelector('#loginPass').value='sai'; document.querySelector('#loginBtn').click(); return 1`);
    ok(await until(`/chưa đúng/.test(document.querySelector('#loginErr').textContent)`), 'Sai mật khẩu → báo lỗi tiếng Việt');
    await b.eval(`document.querySelector('#loginPass').value='${env.TEACHER_PASSWORD}'; document.querySelector('#loginBtn').click(); return 1`);
    ok(await until(`!document.querySelector('#app').hidden && document.querySelector('.kpi')`), 'Đúng mật khẩu → vào Tổng quan');
    ok(await b.eval(`return document.querySelector('#storageBadge').textContent.includes('${process.env.PG ? 'an toàn' : 'tạm'}')`), 'Hiện đúng chế độ lưu trữ');
    ok(await fitsX(), 'Tổng quan không tràn ngang'); await shot('1-tong-quan');
    // ===== Tạo lớp =====
    await go('lop');
    await b.eval(`document.querySelector('#ncName').value='Lớp 2A'; document.querySelector('#newClass').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('.class-card .code')`), 'Tạo lớp có mã');
    const code = await b.eval(`return document.querySelector('.class-card .code').textContent.trim()`);
    ok(/^[A-HJ-NP-Z2-9]{6}$/.test(code) && await b.eval(`return document.querySelector('.class-card h2').textContent === 'Lớp 2A'`), 'Mã lớp 6 kí tự, tên lớp đúng', code);
    ok(await fitsX(), 'Trang Lớp học không tràn ngang'); await shot('2-lop');
    // ===== Tải tài liệu =====
    await go('tai-lieu');
    await b.eval(`const dt = new DataTransfer(); dt.items.add(new File(['%PDF-1.4 phiếu ôn tập thử'], 'Phieu on tap s-x.pdf', {type:'application/pdf'}));
      dt.items.add(new File(['khong phai pdf'], 'gia-mao.pdf', {type:'application/pdf'}));
      document.querySelector('#dGrade').value='2'; const i = document.querySelector('#dFile'); i.files = dt.files; i.dispatchEvent(new Event('change')); return 1`);
    ok(await until(`[...document.querySelectorAll('#dQueue b')].length === 2 && [...document.querySelectorAll('#dQueue b')].every(x=>!/Đang/.test(x.textContent))`), 'Tải 2 tệp chạy xong');
    const q = await b.eval(`return [...document.querySelectorAll('#dQueue b')].map(x=>x.textContent)`);
    ok(/Xong/.test(q[0]) && /^Lỗi: /.test(q[1]), 'PDF thật được nhận, tệp giả mạo bị từ chối', q);
    ok(await b.eval(`return document.querySelector('#dList').textContent.includes('Phieu on tap s x')`), 'Tài liệu hiện trong thư viện');
    ok(await fitsX(), 'Trang Tài liệu không tràn ngang'); await shot('3-tai-lieu');
    // ===== Câu đố luyện thêm =====
    await go('cau-do');
    await b.eval(`document.querySelector('#qNew').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#qfType').value='choice'; document.querySelector('#qfType').dispatchEvent(new Event('change'));
      document.querySelector('#qfTopic').value='l2-03'; document.querySelector('#qfPrompt').value='Cô giáo soạn: chọn từ viết đúng.';
      document.querySelector('#qfAnswer').value='sân trường'; document.querySelector('#qfChoices').value='sân trường\\nxân trường'; document.querySelector('#qf').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('#qList') && document.querySelector('#qList').textContent.includes('Cô giáo soạn')`), 'Soạn câu đố và công bố');
    ok(await b.eval(`return !/CSV|chu_de|PostgreSQL/.test(document.querySelector('#view').textContent)`), 'Trang câu đố không còn chữ kỹ thuật');
    ok(await fitsX(), 'Câu đố không tràn ngang');

    // ===== Bài học: xem, thêm, sửa, ẩn =====
    await go('bai-hoc');
    ok(await until(`document.querySelectorAll('.lesson-card').length === 10`), 'Bài học: lớp 2 có 10 bài');
    await b.eval(`document.querySelector('[data-g="3"]').click(); await new Promise(r=>setTimeout(r,300)); return 1`);
    ok(await until(`document.querySelectorAll('.lesson-card').length === 24`), 'Chuyển lớp 3: 24 bài');
    ok(await fitsX(), 'Danh sách bài không tràn ngang'); await shot('4-bai-hoc');
    await go('bai-hoc/l2-03');
    ok(await until(`document.querySelectorAll('.q-item').length > 10`), 'Mở bài s/x thấy từng câu');
    const before = await b.eval(`return document.querySelectorAll('.q-item').length`);
    // thêm câu điền chỗ trống bằng biểu mẫu
    await b.eval(`document.querySelector('[data-add="chon"]').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#fDe').value='Cô tặng em ___uất ăn ngon.'; document.querySelector('#fDung').value='s'; document.querySelector('.fSai').value='x';
      document.querySelector('#sf').dispatchEvent(new Event('input')); return 1`);
    ok(await b.eval(`return document.querySelector('#fPv').textContent.includes('Cô tặng em')`), 'Xem trước “Học sinh sẽ thấy”');
    await shot('4b-them-cau');
    await b.eval(`document.querySelector('#sf').requestSubmit(); return 1`);
    ok(await until(`document.querySelectorAll('.q-item').length === ${before} + 1 && document.querySelector('#view').textContent.includes('Thầy cô thêm')`), 'Thêm câu vào bài');
    // biểu mẫu báo lỗi dễ hiểu
    await b.eval(`document.querySelector('[data-add="timLoi"]').click(); await new Promise(r=>setTimeout(r,300)); document.querySelector('#fCau').value='Mẹ nấu xôi gấc.'; document.querySelector('#fDung').value='cơm'; document.querySelector('#fSaiTu').value='kơm'; document.querySelector('#sf').requestSubmit(); await new Promise(r=>setTimeout(r,200)); return 1`);
    ok(await b.eval(`return /Không thấy chữ “cơm”/.test(document.querySelector('#fErr').textContent)`), 'Nhập sai → báo lỗi bằng lời dễ hiểu');
    await b.eval(`document.querySelector('#fDung').value='xôi'; document.querySelector('#fSaiTu').value='sôi'; document.querySelector('#sf').requestSubmit(); return 1`);
    ok(await until(`!document.querySelector('#dlg').open && document.querySelector('#view').textContent.includes('Mẹ nấu sôi gấc')`), 'Thêm câu tìm chữ sai (giáo viên gõ câu đúng, máy tự tạo câu sai)');
    // sửa câu gốc đầu tiên, ẩn câu thứ hai
    await b.eval(`document.querySelector('[data-edit="0"]').click(); await new Promise(r=>setTimeout(r,300)); document.querySelector('#fDe').value='Sáng ___ớm, chim hót vang.'; document.querySelector('#fDung').value='s'; document.querySelectorAll('.fSai')[0].value='x'; document.querySelectorAll('.fSai')[1].value=''; document.querySelector('#sf').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('#view').textContent.includes('Đã sửa') && document.querySelector('[data-undo="0"]')`), 'Sửa câu gốc, có nút “Về câu gốc”');
    const hiddenText = await b.eval(`const li = document.querySelector('[data-hide="1"]').closest('.q-item'); const t = li.querySelector('.q-text').textContent; document.querySelector('[data-hide="1"]').click(); return t`);
    ok(await until(`document.querySelector('#view').textContent.includes('Đang ẩn')`), 'Ẩn câu');
    ok(await fitsX(), 'Trang một bài không tràn ngang'); await shot('4c-mot-bai');

    // ===== Nhập Excel thật (nén, bảng chữ dùng chung) =====
    await go('bai-hoc');
    await b.eval(`document.querySelector('#xlImport').click(); await new Promise(r=>setTimeout(r,300));
      const bin = atob('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'); const u = new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
      const dt = new DataTransfer(); dt.items.add(new File([u], 'cau-hoi.xlsx')); const f = document.querySelector('#imFile'); f.files = dt.files; f.dispatchEvent(new Event('change')); return 1`);
    ok(await until(`/3 câu dùng được/.test(document.querySelector('#imOut').textContent) && /2 dòng cần sửa/.test(document.querySelector('#imOut').textContent)`), 'Đọc tệp Excel: 3 câu đúng, 2 dòng báo lỗi', await b.eval(`return document.querySelector('#imOut').textContent.slice(0,300)`));
    await shot('4d-excel');
    await b.eval(`document.querySelector('#imSave').click(); return 1`);
    ok(await until(`!document.querySelector('#dlg').open`), 'Lưu các câu từ Excel');
    // tệp mẫu do web tạo phải đọc lại được
    const round = await b.eval(`const rows = await Excel.read(await GVBaiHoc.templateFile().arrayBuffer()); const p = GVBaiHoc.parseRows(rows); return { rows: rows.length, good: p.filter(x=>!x.error).length, bad: p.filter(x=>x.error).map(x=>x.error) }`);
    ok(round.good === 3 && !round.bad.length, 'Tệp mẫu Excel do web tạo đọc lại đúng', round);
    fs.writeFileSync(path.join(out, 'mau.xlsx'), Buffer.from(await b.eval(`const u = new Uint8Array(await GVBaiHoc.templateFile().arrayBuffer()); let s=''; for (const c of u) s+=String.fromCharCode(c); return btoa(s)`), 'base64'));

    // ===== Giao bài =====
    await go('giao-bai/l2-03');
    await b.eval(`document.querySelector('#asNote').value='Làm trước thứ Sáu nhé'; document.querySelector('#asForm').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('#view').textContent.includes('Bài đã giao (1)')`), 'Giao bài s/x cho lớp 2A');
    ok(await fitsX(), 'Trang Giao bài không tràn ngang'); await shot('4e-giao-bai');
    await go('huong-dan'); ok(await b.eval(`return !/DATABASE_URL|TEACHER_PASSWORD|PostgreSQL|CSV UTF/.test(document.querySelector('#view').textContent)`), 'Trợ giúp viết bằng lời giáo viên'); ok(await fitsX(), 'Trợ giúp không tràn ngang');
    // ===== Máy học sinh: nhập mã lớp, học bài =====
    student = await launch(w, h);
    b = student;
    await b.goto(base + 'index.html', 1500); ok(await until(`document.querySelector('#wlCreate')`, 20000), 'Trang học sinh tải xong');
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); go('settings'); return 1`);
    await wait(500);
    await b.eval(`const i = document.querySelector('#classCodeIn'); i.value='ZZZZZZ'; document.querySelector('#classJoin').requestSubmit(); return 1`);
    ok(await until(`/Mã lớp chưa đúng/.test(document.querySelector('#classErr').textContent)`), 'Mã lớp sai → báo lỗi');
    await b.eval(`const i = document.querySelector('#classCodeIn'); i.value='${code.toLowerCase()}'; i.dispatchEvent(new Event('input')); document.querySelector('#classJoin').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('.class-code') && document.querySelector('.class-code').textContent === '${code}'`), 'Nhập mã đúng (chữ thường cũng được) → đã kết nối');
    await b.eval(`document.querySelector('.class-join').scrollIntoView({block:'center'}); return 1`); await shot('5-hs-cai-dat');
    await b.eval(`go('home'); return 1`); await wait(900);
    ok(await until(`document.querySelector('.nd-tasks') && /s\\/x/.test(document.querySelector('.nd-tasks').textContent) && document.querySelector('.nd-tasks').textContent.includes('Làm trước thứ Sáu')`), 'Trang học sinh hiện “Bài thầy cô giao”');
    ok(await fitsX(), 'Trang học có bài giao không tràn ngang'); await shot('5b-hs-bai-giao');
    const content = await b.eval(`const t = getTopic('l2-03'); const all = t.baiTap.map(x => x.de || x.cau); const L = []; for (let i=0;i<6;i++) buildLesson(t,'de').forEach(x => L.push(x));
      const text = JSON.stringify(L); const own = t.baiTap.findIndex(x => (x.de||'').includes('Cô tặng em'));
      const key = t.id + ':' + t.baiTap[own]._k; const back = itemOf(key);
      return { added: all.some(a => a.includes('Cô tặng em')), edited: all.some(a => a.includes('chim hót vang')), hidden: !all.includes(${JSON.stringify('__H__')}), excel: all.some(a => a.includes('Em tưới cây')), inLesson: /Cô tặng em|Em tưới cây|Mẹ nấu|xôi|Chim sẻ hót/.test(text), back: back && back.de, k: key }`);
    ok(content.added && content.edited && content.excel, 'Bài học của học sinh có câu thầy cô thêm, sửa, nhập từ Excel', content);
    ok(await b.eval(`return !getTopic('l2-03').baiTap.some(x => (x.de||x.cau) && (x.de||x.cau).replace('___','').trim() === ${'`'}${hiddenText.replace(/ \? /g,'___')}${'`'}.replace('___','').trim())`), 'Câu đã ẩn không còn trong bài', hiddenText);
    ok(content.inLesson, 'Câu thầy cô thêm xuất hiện ngay trong lượt học (cả mức Dễ)', content);
    ok(content.back && content.back.includes('Cô tặng em'), 'Sổ ôn tìm lại đúng câu thầy cô thêm', content);
    await b.eval(`go('home'); await new Promise(r=>setTimeout(r,400)); document.querySelector('[data-task="l2-03"]').click(); await new Promise(r=>setTimeout(r,500)); return 1`);
    ok(await b.eval(`return !document.querySelector('#modalRoot').hidden && document.querySelector('#modalRoot').textContent.includes('s/x')`), 'Bấm “Làm ngay” mở đúng bài được giao');
    await b.eval(`closeModal(); return 1`);


    await b.eval(`const t = getTopic('l2-03'); const items = t.baiTap.filter(x=>x.loai==='chon').slice(0,5).map((x,i)=>Object.assign({},x,{_t:t.id,_i:i})); const assignmentId = document.querySelector('[data-task="l2-03"]').dataset.assignment; startQuiz({kind:'lesson',title:t.ten,topicId:t.id,assignmentId,level:'vua',hints:0,items}); return 1`);
    for (let i = 0; i < 5; i++) await b.eval(`await new Promise(r=>setTimeout(r,150)); const it = Q.items[Q.i]; const want = ${i === 2} ? it.luaChon.find(o=>o!==it.dapAn) : it.dapAn; document.querySelector('[data-answer="'+CSS.escape(want)+'"]').click(); document.querySelector('#plCheck').click(); await new Promise(r=>setTimeout(r,200)); document.querySelector('#plCont').click(); return 1`);
    await b.eval(`if (window.QuaTang) {} try { QuaTang.close(); } catch(e){} closeModal(); return 1`);
    await wait(2800);
    // tài liệu + câu hỏi của thầy cô hiện bên học sinh
    await b.eval(`go('docs'); return 1`); await wait(1200);
    ok(await b.eval(`return document.body.innerText.includes('Phieu on tap s x')`), 'Học sinh thấy tài liệu thầy cô công bố');
    await shot('6-hs-tai-lieu');
    const seen = await b.eval(`await MayChu.loadQuestions(); return MayChu.remoteQuestions().map(q=>q.prompt)`);
    ok(seen.some(p => p.includes('Cô giáo soạn')) && !seen.some(p => p.includes('Bé đội')), 'Học sinh chỉ nhận câu đã công bố (câu nháp không lộ)', seen);
    const puzzleId = await b.eval(`return MayChu.remoteQuestions().find(q=>q.prompt.includes('Cô giáo soạn')).id`);
    await b.eval(`go('practice')`);
    b = teacher;
    await go('cau-do');
    if (!await until(`document.querySelector('[data-qedit="${puzzleId}"]')`)) throw Error('Không tìm thấy câu đố đã xuất bản');
    await b.eval(`document.querySelector('[data-qedit="${puzzleId}"]').click(); document.querySelector('#qfPub').checked = false; document.querySelector('#qf').requestSubmit()`);
    ok(await until(`!document.querySelector('#dlg').open && document.querySelector('[data-qedit="${puzzleId}"]')?.closest('tr').textContent.includes('Bản nháp')`), 'Chuyển câu đã công bố về bản nháp');
    b = student;
    ok(await until(`!db.classQuestions.some(q=>q.id==='${puzzleId}')`, 12000), 'Trang luyện đang mở tự bỏ câu đã chuyển về nháp');

    // ===== Góc thầy cô trên máy học sinh: phải đăng nhập thật (không còn cổng phép nhân) =====
    await b.eval(`teacherOK = false; go('teacher'); return 1`); await wait(500);
    ok(await b.eval(`return !!document.querySelector('#gateInput') && document.querySelector('#gateInput').type === 'password' && !document.querySelector('#classStudents, #questionNew, #classAdd') && currentView !== 'teacher' && !document.querySelector('.gate-q')`), 'Chưa đăng nhập: Góc thầy cô chỉ hiện ô mật khẩu, không lộ quản lý học sinh / câu hỏi', await b.eval(`return { v: currentView, t: !!document.querySelector('#classStudents'), p: [...document.querySelectorAll('.project-panel')].map(e=>e.textContent.slice(0,30)) }`));
    await b.eval(`document.querySelector('#gateInput').value='sai-mat-khau'; document.querySelector('#gateForm').requestSubmit(); return 1`);
    ok(await until(`/chưa đúng/i.test(document.querySelector('#gateErr').textContent) && !document.querySelector('.t-table')`), 'Sai mật khẩu → báo lỗi, vẫn bị chặn');
    ok(await b.eval(`return teacherOK === false`), 'Sai mật khẩu: không được cấp quyền');
    await b.eval(`document.querySelector('#gateInput').value='${env.TEACHER_PASSWORD}'; document.querySelector('#gateForm').requestSubmit(); return 1`);
    ok(await until(`teacherOK === true && document.querySelector('.project-panel')`), 'Đúng mật khẩu → vào Góc thầy cô, thấy quản lý học sinh');
    await b.eval(`teacherOK = false; go('home'); return 1`); await wait(300);
    await b.eval(`go('teacher'); return 1`); await wait(400);
    ok(await b.eval(`return !!document.querySelector('#gateInput') && !document.querySelector('.project-panel')`), 'Rời đi rồi quay lại: lại phải nhập mật khẩu');
    await b.eval(`closeModal(); go('home'); return 1`);

    // ===== Giáo viên thấy kết quả, gửi nhận xét =====
    b = teacher;
    await go('hoc-sinh');
    ok(await until(`document.querySelector('tr[data-open]') && document.querySelector('tr[data-open]').textContent.includes('Bé Na')`), 'Danh sách học sinh có “Bé Na” sau khi học');
    ok(await fitsX(), 'Trang Học sinh không tràn ngang'); await shot('7-hoc-sinh');
    await b.eval(`document.querySelector('tr[data-open]').click(); await new Promise(r=>setTimeout(r,500)); return 1`);
    const detail = await b.eval(`return document.querySelector('#dlg').textContent`);
    ok(/80%/.test(detail) && /sai 1 lần/.test(detail), 'Chi tiết: lịch sử 80% và từ viết sai', detail.slice(0, 300));
    await shot('8-chi-tiet');
    await b.eval(`document.querySelector('#noteText').value='Em đọc kĩ lắm, cố thêm câu khó nhé!'; document.querySelector('#noteForm').requestSubmit(); return 1`);
    ok(await until(`document.querySelector('#noteList').textContent.includes('cố thêm câu khó')`), 'Gửi nhận xét cho học sinh');
    await b.eval(`document.querySelector('#dlg').close(); return 1`);
    await b.eval(`window.__printed = 0; window.print = () => { window.__printed++; }; document.querySelector('tr[data-open]').click(); await new Promise(r=>setTimeout(r,500)); document.querySelector('[data-range="0"]').click(); document.querySelector('[data-quick]').click(); return 1`);
    ok(await b.eval(`return document.querySelector('#hsHistory').textContent.includes('80%') && document.querySelector('#noteText').value.length > 5`), 'Lọc lịch sử và nhận xét mẫu');
    await b.eval(`document.querySelector('#prStudent').click(); return 1`); await wait(400);
    ok(await b.eval(`return window.__printed === 1 && document.querySelector('#printArea').textContent.includes('Bé Na') && /Phiếu theo dõi/.test(document.querySelector('#printArea').textContent)`), 'In báo cáo cho phụ huynh');
    await go('giao-bai');
    ok(await until(`/1\\/1 em đã làm/.test(document.querySelector('#view').textContent) && document.querySelector('#view').textContent.includes('Đúng 80%')`), 'Giao bài: thấy ai đã làm và điểm', await b.eval(`return document.querySelector('#view').textContent.slice(-300)`));
    await go('tong-quan'); ok(await b.eval(`return document.body.innerText.includes('Bé Na')`), 'Tổng quan có lượt học gần đây');
    await shot('9-tong-quan-co-du-lieu');
    // đăng xuất
    await b.eval(`document.querySelector('#logout').click(); return 1`); await wait(300);
    ok(await b.eval(`return !document.querySelector('#login').hidden && !sessionStorage.getItem('vuonchu.teacherToken')`), 'Đăng xuất xoá phiên');

    // ===== Nhận xét về máy học sinh =====
    b = student;
    await b.eval(`go('profile'); return 1`); await wait(800);
    ok(await until(`document.body.innerText.includes('cố thêm câu khó')`), 'Học sinh nhận được nhận xét trong Hồ sơ');
    // chưa đăng nhập không xem được dữ liệu học sinh
    ok(await b.eval(`return (await fetch('/api/students')).status === 401 && (await fetch('/api/classes')).status === 401`), 'Chưa đăng nhập: API học sinh và lớp học đều chặn 401');
    ok(b.errors.length === 0 && teacher.errors.length === 0, 'Không lỗi JS', b.errors.concat(teacher.errors));
  } finally {
    await student?.close(); await teacher.close(); await app.close(); if (socket) { await socket.stop(); await pgdb.close(); } fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(`\n${pass} đạt, ${fail} lỗi (${w}px${process.env.PG ? ', PostgreSQL' : ', tệp'})`); process.exit(fail ? 1 : 0);
})();
