// Trang “Tài liệu của thầy cô” của học sinh: thẻ dễ thương + nút Xem ngay (PDF, hình, nhạc), Word chỉ tải về.
// Chạy: node tests/hoc_sinh_tai_lieu.js [rộng] [cao]   → ảnh ở qa-results/tai-lieu/
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 1280), Number(process.argv[3] || 860)];
  const out = path.join(__dirname, '..', 'qa-results', 'tai-lieu'); fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const base = 'http://127.0.0.1:' + addr.port + '/';
  const call = async (method, url, body, token) => (await fetch(base.slice(0, -1) + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })).json();
  const admin = (await call('POST', '/api/login', { password: env.TEACHER_PASSWORD })).token;
  // PDF tối thiểu hợp lệ có chữ, PNG 1 ô, MP3 giả (khung rỗng), DOCX giả (chỉ cần đúng phần mở rộng)
  const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 55>>stream\nBT /F1 24 Tf 40 100 Td (Phieu luyen chinh ta) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF';
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const url = (mime, b64) => 'data:' + mime + ';base64,' + b64;
  const docs = [
    ['phieu-dau-hoi-nga.pdf', 'Phiếu luyện dấu hỏi, dấu ngã', url('application/pdf', Buffer.from(pdf).toString('base64')), 'Làm xong nhớ đọc to từng câu nhé!', '2'],
    ['tranh-con-vit.png', 'Tranh: Chú vịt con', url('image/png', png), '', 'chung'],
    ['bai-nghe-chinh-ta.mp3', 'Bài nghe chính tả tuần 12', url('audio/mpeg', Buffer.from('ID3').toString('base64')), '', '2'],
    ['bai-doc-tuan-12.docx', 'Bài đọc tuần 12 (Word)', url('application/vnd.openxmlformats-officedocument.wordprocessingml.document', Buffer.concat([Buffer.from([0x50,0x4b,3,4]), Buffer.from('word/document.xml'), Buffer.from([0x50,0x4b,5,6])]).toString('base64')), 'Em tải về rồi mở bằng máy nhé.', '3']
  ];
  for (const [name, title, data, note, grade] of docs) {
    const r = await call('POST', '/api/docs', { name, title, grade, topic: '', note, published: true, data }, admin);
    if (!r.document) throw new Error('Không tải được ' + name + ': ' + JSON.stringify(r));
  }
  const A = (await call('POST', '/api/classes', { name: 'Lớp 2A', grade: 2 }, admin)).code, B = (await call('POST', '/api/classes', { name: 'Lớp 3B', grade: 3 }, admin)).code;
  const only = await call('POST', '/api/docs', { name: 'phieu-rieng-2a.png', title: 'Phiếu riêng của 2A', grade: '2', topic: '', note: '', published: true, classCodes: [A], data: url('image/png', png) }, admin);
  if (!only.document) throw new Error('Không giao được cho lớp: ' + JSON.stringify(only));
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); };
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 8000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  try {
    await b.goto(base, 2500);
    await b.eval(`document.querySelector('#wlGuest')?.click(); return 1`); await b.sleep(1500);
    await b.eval(`const m=document.querySelector('#modalRoot'); if(m && !m.hidden){ const c=m.querySelector('[data-close],.close,button'); c && c.click(); } return 1`); await b.sleep(400);
    await b.eval(`localStorage.setItem('vuonchu.classCode','${B}'); go('docs'); return 1`);
    ok(await until(`document.querySelectorAll('.kdoc').length===4`), 'Học sinh lớp 3B thấy 4 thẻ (không thấy phiếu riêng của 2A)', await b.eval(`return document.body.innerText.slice(0,300)`));
    ok(await b.eval(`return document.querySelectorAll('[data-doc-view]').length===3`), 'PDF, hình, nhạc có nút “Xem ngay”; Word thì không');
    ok(await b.eval(`return /tải về rồi mở bằng máy/.test(document.querySelector('.kdoc[data-tone="blue"]').textContent)`), 'Thẻ Word nhắc em tải về để mở');
    ok(await b.eval(`return document.documentElement.scrollWidth <= innerWidth + 1`), 'Không tràn ngang');
    await b.shot(path.join(out, 'danh-sach-' + w + '.png'), true);
    // xem PDF
    await b.eval(`document.querySelector('.kdoc[data-tone="rose"] [data-doc-view]').click(); return 1`);
    ok(await until(`document.querySelector('.kdoc-dialog[open] iframe[src^="blob:"]')`), 'Bấm Xem ngay mở PDF trong khung xem trước');
    await b.sleep(900); await b.shot(path.join(out, 'xem-pdf-' + w + '.png'));
    ok(await b.eval(`const d=document.querySelector('.kdoc-dialog'); const r=d.getBoundingClientRect(); return r.right<=innerWidth+1 && r.bottom<=innerHeight+1 && r.left>=-1`), 'Khung xem nằm gọn trong màn hình');
    await b.eval(`document.querySelector('.kdoc-x').click(); return 1`);
    ok(await until(`!document.querySelector('.kdoc-dialog')`), 'Đóng khung xem');
    // xem hình
    await b.eval(`document.querySelector('.kdoc[data-tone="sky"] [data-doc-view]').click(); return 1`);
    ok(await until(`document.querySelector('.kdoc-dialog[open] img[src^="blob:"]')`), 'Xem hình ảnh ngay trong trang');
    await b.sleep(500); await b.shot(path.join(out, 'xem-hinh-' + w + '.png'));
    await b.eval(`document.querySelector('.kdoc-x').click(); return 1`); await until(`!document.querySelector('.kdoc-dialog')`);
    // nghe nhạc
    await b.eval(`document.querySelector('.kdoc[data-tone="mint"] [data-doc-view]').click(); return 1`);
    ok(await until(`document.querySelector('.kdoc-dialog[open] audio[src^="blob:"]')`), 'Bài nghe có thanh phát nhạc');
    await b.sleep(400); await b.shot(path.join(out, 'xem-nhac-' + w + '.png'));
    await b.eval(`document.querySelector('.kdoc-x').click(); return 1`); await until(`!document.querySelector('.kdoc-dialog')`);
    // tải về vẫn hoạt động
    await b.eval(`window.__dl=[]; const o=HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click=function(){ if(this.download){ window.__dl.push(this.download); return; } return o.call(this); }; document.querySelector('.kdoc[data-tone="blue"] [data-doc-download]').click(); return 1`);
    ok(await until(`window.__dl.includes('bai-doc-tuan-12.docx')`), 'Nút Tải về vẫn tải đúng tệp');
    ok(await b.eval(`return !document.body.innerText.includes('Phiếu riêng của 2A')`), 'Tài liệu riêng của lớp 2A không lộ sang lớp 3B');
    // đổi sang lớp 2A: thấy thêm phiếu riêng, có nhãn “Của lớp em”
    await b.eval(`localStorage.setItem('vuonchu.classCode','${A}'); go('docs'); return 1`);
    await b.eval(`go('settings'); return 1`); await b.sleep(300); await b.eval(`go('docs'); return 1`);
    ok(await until(`document.querySelectorAll('.kdoc').length===5 && /Của lớp em/.test(document.body.innerText)`), 'Học sinh lớp 2A thấy 5 thẻ, phiếu riêng có nhãn “Của lớp em”', await b.eval(`return document.querySelectorAll('.kdoc').length`));
    await b.shot(path.join(out, 'lop-2a-' + w + '.png'), true);
    // chưa kết nối lớp: nhắc em kết nối
    await b.eval(`localStorage.removeItem('vuonchu.classCode'); go('settings'); return 1`); await b.sleep(300); await b.eval(`go('docs'); return 1`);
    ok(await until(`/chưa kết nối lớp/.test(document.body.innerText) && document.querySelectorAll('.kdoc').length===4`), 'Chưa kết nối lớp: nhắc em nhập mã lớp, chỉ thấy tài liệu chung');
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log('\n' + pass + ' đạt, ' + fail + ' lỗi (' + w + 'x' + h + ')');
  process.exit(fail ? 1 : 0);
})();
