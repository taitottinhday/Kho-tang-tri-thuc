'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildServer } = require('../server');

const ROOT = path.resolve(__dirname, '..');
let count = 0;
function check(condition, message) { assert.ok(condition, message); count++; }
async function runStore(kind, env, dataDir, cleanup = async () => {}) {
  const app = await buildServer({ env, dataDir, root: ROOT });
  const address = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + address.port;
  const call = async (url, options = {}) => {
    const response = await fetch(base + url, options);
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
    return { response, body };
  };
  const post = (url, value, headers = {}) => call(url,{ method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(value) });
  try {
    check(app.store.kind === kind, kind + ': chế độ lưu trữ');
    let { response, body } = await call('/api/status');
    check(response.status === 200 && body.storage === kind, kind + ': trạng thái lưu trữ');
    const root = await call('/'); check(root.response.status === 200, kind + ': giữ phục vụ trang chủ');
    for (const hidden of ['/.data/store.json','/server/api.js','/tests/server_api.js','/node_modules/pg/package.json','/package.json','/package-lock.json','/PHOI_HOP_CLAUDE_CODEX.md']) {
      const r = await call(hidden); check(r.response.status === 404, kind + ': ẩn ' + hidden);
    }
    if (kind === 'file') {
      const missing = await post('/api/login',{password:'bat-ky'});
      check(missing.response.status === 503 && /TEACHER_PASSWORD/.test(missing.body.error), 'file: 503 hướng dẫn khi chưa đặt mật khẩu');
      env.TEACHER_PASSWORD = 'mat-khau-kiem-thu-2026';
    }
    let login = await post('/api/login',{password:env.TEACHER_PASSWORD});
    check(login.response.status === 200 && login.body.expiresIn === 43200, kind + ': đăng nhập đúng, phiên 12 giờ');
    const token = login.body.token;
    const bearer = { Authorization:'Bearer ' + token };
    const wrong = await post('/api/login',{password:'khong-dung'},{'x-forwarded-for':'wrong-login-check'});
    check(wrong.response.status === 401 && /chưa đúng/.test(wrong.body.error),kind + ': mật khẩu sai');

    const unauth = await post('/api/questions',{type:'choice',topic:'lop-1',grades:[1],prompt:'Đề',answer:'đúng',choices:['đúng','sai']});
    check(unauth.response.status === 401,kind + ': chỉ giáo viên sửa kho câu hỏi');
    const q = {type:'choice',topic:'ma-chu-de-moi',grades:[1,2],prompt:'Em dùng gì để cắt giấy?',answer:'cái kéo',choices:['cái kéo','cái céo'],note:'Đọc dấu hỏi.',active:true};
    let saved = await post('/api/questions',q,bearer);
    check(saved.response.status === 200 && saved.body.saved === 1,kind + ': thêm câu hỏi');
    const qid = saved.body.questions[0].id;
    saved = await post('/api/questions',{...q,id:qid,prompt:'Em dùng gì để cắt tờ giấy?'},bearer);
    check(saved.response.status === 200 && saved.body.questions[0].prompt.includes('tờ giấy'),kind + ': sửa câu hỏi');
    const invalid = await post('/api/questions',{...q,topic:'Mã không hợp lệ'},bearer);
    check(invalid.response.status === 400,kind + ': kiểm tra mã chủ đề');
    const fakeImage = await post('/api/questions',{...q,type:'picture',image:'data:image/png;base64,JVBERi0xLjQ=',alt:'Hình minh hoạ'},bearer);
    check(fakeImage.response.status === 400,kind + ': giới hạn/chữ ký ảnh câu hỏi');

    const csv = '\uFEFFdang;chu_de;lop;de_bai;dap_an;lua_chon;giai_thich;cong_bo\r\n' +
      'choice;ma-chu-de-moi;1|2;Chọn từ đúng.;sẵn sàng;sẵn sàng|sẳn sàng;Câu mẫu.;có\r\n' +
      'fill;ma-chu-de-moi;1;Câu không có chỗ trống;n;;Cần đúng một ___;có\r\n';
    const imported = await call('/api/questions',{method:'POST',headers:{...bearer,'Content-Type':'text/csv; charset=utf-8'},body:csv});
    check(imported.response.status === 200 && imported.body.imported === 1 && imported.body.errors.length === 1 && imported.body.errors[0].line === 3,kind + ': CSV BOM, dấu chấm phẩy và báo lỗi theo dòng');
    let publicQs = await call('/api/questions');
    check(publicQs.body.questions.length === 1 && publicQs.body.questions[0].active,kind + ': công khai chỉ câu đã xuất bản');
    let allQs = await call('/api/questions',{headers:bearer});
    check(allQs.body.questions.length === 2 && allQs.body.questions.some(x => !x.active),kind + ': giáo viên thấy cả bản nháp');
    const publish = await post('/api/questions/publish',{},bearer);
    check(publish.response.status === 200 && publish.body.published === 1,kind + ': công bố mọi câu nháp');
    const deleted = await call('/api/questions/' + encodeURIComponent(qid),{method:'DELETE',headers:bearer});
    check(deleted.response.status === 200,kind + ': xoá câu hỏi');

    const pdfBytes = Buffer.from('%PDF-1.4\nTài liệu chính tả\n%%EOF');
    const doc = {name:'phieu-luyen.pdf',title:'Phiếu luyện tập',grade:'1',topic:'ma-chu-de-moi',note:'Mang tới lớp.',published:true,data:'data:application/pdf;base64,' + pdfBytes.toString('base64')};
    let uploaded = await post('/api/docs',doc,bearer);
    check(uploaded.response.status === 201,kind + ': tải tài liệu hợp lệ');
    const docId = uploaded.body.document.id;
    const draftBytes = Buffer.from('PK\u0003\u0004word/document.xmlPK\u0005\u0006');
    const draft = await post('/api/docs',{name:'tai-lieu.docx',title:'Bản nháp Word',grade:'chung',published:false,data:'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + draftBytes.toString('base64')},bearer);
    check(draft.response.status === 201,kind + ': nhận diện chữ ký Word');
    const publicDocs = await call('/api/docs');
    check(publicDocs.response.status === 200 && publicDocs.body.documents.length === 1,kind + ': học sinh chỉ thấy tài liệu đã công bố');
    const file = await call('/api/docs/' + docId);
    check(file.response.status === 200 && file.response.headers.get('content-type') === 'application/pdf' && /inline/.test(file.response.headers.get('content-disposition')) && file.response.headers.get('x-content-type-options') === 'nosniff',kind + ': tải PDF inline với nosniff');
    check(file.body.equals(pdfBytes),kind + ': nội dung tệp tải về giữ nguyên');
    const draftFile = await call('/api/docs/' + draft.body.document.id);
    check(draftFile.response.status === 404,kind + ': học sinh không tải được tài liệu nháp');
    const badSignature = await post('/api/docs',{...doc,name:'sai.png',data:'data:image/png;base64,' + pdfBytes.toString('base64')},bearer);
    check(badSignature.response.status === 400,kind + ': từ chối chữ ký tệp sai');
    const bigBytes = Buffer.concat([Buffer.from('%PDF-1.4\n'),Buffer.alloc(10 * 1024 * 1024 + 1,65)]);
    const tooBig = await post('/api/docs',{...doc,name:'qua-lon.pdf',data:'data:application/pdf;base64,' + bigBytes.toString('base64')},bearer);
    check(tooBig.response.status === 400,kind + ': từ chối tài liệu quá 10 MB');

    const classResult = await post('/api/classes',{},bearer);
    check(classResult.response.status === 201 && /^[A-HJ-NP-Z2-9]{6}$/.test(classResult.body.code),kind + ': tạo mã lớp 6 kí tự dễ đọc');
    const code = classResult.body.code;
    const profile = {id:'student-test-1',name:'Mai An',grade:2,avatar:'🐰',xp:120,streak:3,bestStreak:4,lastDay:'2026-11-26',attempts:20,correct:17,
      topics:{'ma-chu-de-moi':{stars:2,best:90,attempts:10,correct:9,done:true}},history:Array.from({length:65},(_,i)=>({d:'2026-11-' + (i%26+1),title:'Lượt ' + i,correct:3,total:4,acc:75})),
      wrongLog:Object.fromEntries(Array.from({length:65},(_,i)=>['tu-'+i,i+1])),pin:'KHONG_DUOC_LUU'};
    const synced = await post('/api/sync',{classCode:code,profile});
    check(synced.response.status === 200 && synced.body.ok && Array.isArray(synced.body.teacherNotes),kind + ': đồng bộ hồ sơ');
    const overLimit = await post('/api/sync',{classCode:code,profile:{...profile,extra:'x'.repeat(205 * 1024)}});
    check(overLimit.response.status === 413,kind + ': giới hạn payload đồng bộ 200 KB');
    let students = await call('/api/students',{headers:bearer});
    check(students.response.status === 200 && students.body.students.length === 1,kind + ': giáo viên xem học sinh');
    const student = students.body.students[0];
    check(student.history.length === 60 && Object.keys(student.wrongLog).length === 50 && !Object.hasOwn(student,'pin'),kind + ': giới hạn lịch sử/sai và không lưu PIN');
    const note = await post('/api/students/' + code + '/' + profile.id + '/notes',{text:'Em nhớ đọc kĩ dấu hỏi nhé.'},bearer);
    check(note.response.status === 200 && note.body.teacherNotes[0].text.includes('dấu hỏi'),kind + ': gửi nhận xét');
    const syncedBack = await post('/api/sync',{classCode:code,profile});
    check(syncedBack.response.status === 200 && syncedBack.body.teacherNotes.length === 1,kind + ': nhận xét quay lại máy học sinh ở lần đồng bộ sau');
    const deletion = await call('/api/students/' + code + '/' + profile.id,{method:'DELETE',headers:bearer});
    check(deletion.response.status === 200,kind + ': xoá học sinh khỏi máy chủ');

    // lịch sử cộng dồn quá 60 lượt; chỉnh bài; giao bài
    {
      const cls = await post('/api/classes',{ name:'Lớp lịch sử', grade:2 },bearer), c = cls.body.code;
      const all = Array.from({ length: 150 }, (_, i) => ({ d:'2026-11-1', at: 1000 + i, kind:'lesson', topic:'l2-03', title:'s/x', correct: i % 5, total: 5, acc: (i % 5) * 20 }));
      const prof = { id:'phistory1', name:'Bé Sử', grade:2 };
      for (let n = 20; n <= 150; n += 10) await post('/api/sync',{ classCode:c, profile:{ ...prof, history: all.slice(0, n).reverse().slice(0, 60) } });
      await post('/api/sync',{ classCode:c, profile:{ ...prof, history: all.slice().reverse().slice(0, 60) } });
      const got = (await call('/api/students?classCode=' + c,{ headers:bearer })).body.students[0].history;
      check(got.length === 150 && new Set(got.map(h => h.at)).size === 150 && got[0].at === 1149 && got[149].at === 1000, kind + ': giữ trọn 150 lượt, đúng thứ tự, không trùng (' + got.length + ')');
      const put = async (body, headers) => call('/api/lessons/l2-03',{ method:'PUT', headers:{ ...(headers || bearer),'content-type':'application/json' }, body: JSON.stringify(body) });
      check((await put({ added:[{ id:'gv-abcd1', loai:'chon', de:'Bé ___ách.', dapAn:'s', luaChon:['s','x'] }] }, {})).response.status === 401, kind + ': sửa bài cần đăng nhập');
      check((await put({ added:[{ id:'gv-abcd1', loai:'chon', de:'Không có chỗ trống', dapAn:'s', luaChon:['s','x'] }] })).response.status === 400, kind + ': câu sai mẫu bị từ chối');
      check((await put({ hidden:['1'], edits:{ 0:{ loai:'ngheViet', cau:'Chim sẻ hót vang' } }, added:[{ id:'gv-abcd1', loai:'chon', de:'Bé đọc ___ách.', dapAn:'s', luaChon:['s','x'] }] })).response.status === 200, kind + ': lưu phần chỉnh bài');
      const pub = (await call('/api/lessons')).body.edits['l2-03'];
      check(pub && pub.added.length === 1 && pub.hidden[0] === '1' && pub.edits['0'].cau === 'Chim sẻ hót vang.', kind + ': học sinh tải được phần chỉnh');
      check((await put({ hidden:['2'], previous:null })).response.status === 409, kind + ': từ chối lưu đè từ bản bài đã cũ');
      await put({});
      check(!(await call('/api/lessons')).body.edits['l2-03'], kind + ': trả bài về ban đầu thì xoá phần chỉnh');
      const writes = await Promise.all(['l2-01','l2-02'].map((id, i) => call('/api/lessons/' + id, {
        method:'PUT', headers:{ ...bearer, 'content-type':'application/json' }, body:JSON.stringify({ hidden:[String(i)] })
      })));
      const concurrent = (await call('/api/lessons')).body.edits;
      check(writes.every(r => r.response.status === 200) && concurrent['l2-01'].hidden[0] === '0' && concurrent['l2-02'].hidden[0] === '1', kind + ': lưu đồng thời hai bài giữ đủ hai thay đổi');
      const made = await post('/api/assignments',{ classCodes:[c], topic:'l2-03', due:'2026-12-01', note:'Làm nhé' },bearer);
      check(made.response.status === 201 && made.body.assignments.length === 1, kind + ': giao bài');
      check((await call('/api/assignments')).response.status === 401, kind + ': xem mọi bài giao cần đăng nhập');
      check((await call('/api/assignments?classCode=' + c)).body.assignments.length === 1, kind + ': máy học sinh xem bài của lớp mình');
      check((await post('/api/sync',{ classCode:c, profile:prof })).body.assignments.length === 1, kind + ': đồng bộ trả về bài được giao');
      const assignmentId = made.body.assignments[0].id;
      const [newer, older] = [{ ...all[149], at:3000, assignmentId }, { ...all[149], at:2000, assignmentId }];
      await Promise.all([newer, older].map(h => post('/api/sync',{ classCode:c, profile:{ ...prof, attempts:h.at, history:[h] } })));
      const updated = (await call('/api/students?classCode=' + c,{ headers:bearer })).body.students[0];
      const submitted = updated.history;
      check(made.body.assignments[0].explicitSubmission && submitted[0].assignmentId === assignmentId && submitted[0].at === newer.at && submitted[1].at === older.at && updated.attempts === newer.at, kind + ': mã bài và điểm tổng vẫn đúng khi lượt cũ gửi muộn');
      check((await post('/api/assignments',{ classCodes:['ZZZZZZ'], topic:'l2-03' },bearer)).response.status === 404, kind + ': giao cho lớp không có → 404');
      check((await call('/api/assignments/' + made.body.assignments[0].id,{ method:'DELETE',headers:bearer })).response.status === 200, kind + ': thu hồi bài');
    }

    // lớp học có tên/khối, sửa, xoá; bật/tắt tài liệu; xoá thứ không tồn tại phải 404
    const named = await post('/api/classes',{ name:'Lớp 2A', grade:2 },bearer);
    check(named.response.status === 201 && named.body.name === 'Lớp 2A', kind + ': tạo lớp có tên');
    const listed = await call('/api/classes',{ headers:bearer });
    check(listed.body.classes.some(c => c.code === named.body.code && c.name === 'Lớp 2A' && c.grade === 2), kind + ': liệt kê lớp');
    check((await call('/api/classes')).response.status === 401, kind + ': liệt kê lớp cần đăng nhập');
    check((await call('/api/classes/' + named.body.code,{ method:'PATCH',headers:{ ...bearer,'content-type':'application/json' },body:JSON.stringify({ name:'Lớp 2B', grade:3 }) })).response.status === 200, kind + ': sửa lớp');
    check((await call('/api/classes/' + named.body.code,{ method:'DELETE',headers:bearer })).response.status === 200, kind + ': xoá lớp');
    check((await call('/api/classes/' + named.body.code,{ method:'DELETE',headers:bearer })).response.status === 404, kind + ': xoá lớp không tồn tại phải 404');
    for (const u of ['/api/questions/khong-co','/api/docs/khong-co']) check((await call(u,{ method:'DELETE',headers:bearer })).response.status === 404, kind + ': xoá thứ không tồn tại phải 404 ' + u);
    check((await call('/api/docs/khong-co',{ method:'PATCH',headers:{ ...bearer,'content-type':'application/json' },body:'{"published":true}' })).response.status === 404, kind + ': công bố tài liệu không tồn tại phải 404');

    if (kind === 'file') {
      for (let i=0;i<5;i++) { const failed = await post('/api/login',{password:'sai'},{'x-forwarded-for':'lock-login-check'}); check(failed.response.status === 401, 'file: ghi nhận lần nhập sai ' + (i+1)); }
      const locked = await post('/api/login',{password:env.TEACHER_PASSWORD},{'x-forwarded-for':'lock-login-check'});
      check(locked.response.status === 429 && /10 phút/.test(locked.body.error), 'file: khoá sau 5 lần sai');
    }
    console.log('  ' + kind + ': đạt các mục API.');
  } finally { await app.close(); await cleanup(); }
}

async function main() {
  const fileDir = fs.mkdtempSync(path.join(os.tmpdir(),'vuon-chu-api-file-'));
  const fileEnv = { ...process.env }; delete fileEnv.DATABASE_URL; delete fileEnv.TEACHER_PASSWORD; delete fileEnv.SESSION_SECRET;
  try { await runStore('file',fileEnv,fileDir,async () => fs.rmSync(fileDir,{recursive:true,force:true})); }
  catch (error) { fs.rmSync(fileDir,{recursive:true,force:true}); throw error; }

  const { PGlite } = require('@electric-sql/pglite');
  const { PGLiteSocketServer } = require('@electric-sql/pglite-socket');
  const pgdb = await PGlite.create();
  const socket = new PGLiteSocketServer({ db:pgdb,port:0,host:'127.0.0.1',maxConnections:8 });
  await socket.start();
  const port = socket.port;
  const pgDir = fs.mkdtempSync(path.join(os.tmpdir(),'vuon-chu-api-pg-'));
  try {
    const env = { ...process.env,DATABASE_URL:'postgres://postgres@127.0.0.1:' + port + '/postgres',TEACHER_PASSWORD:'mat-khau-kiem-thu-2026',SESSION_SECRET:'kiem-thu-bi-mat-ngau-nhien-32-ky-tu' };
    await runStore('postgres',env,pgDir,async () => fs.rmSync(pgDir,{recursive:true,force:true}));
  } finally {
    fs.rmSync(pgDir,{recursive:true,force:true});
    await socket.stop(); await pgdb.close();
  }
  console.log('server_api.js: ' + count + ' kiểm tra đạt.');
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
