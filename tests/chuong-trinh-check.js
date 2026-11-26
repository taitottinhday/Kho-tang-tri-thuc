// Kiểm tra chương trình lớp 1–3 (data/chuong-trinh.js): node tests/chuong-trinh-check.js [--in]
'use strict';
global.window = {};
require('../data/ngan-hang-chinh-ta.js');
require('../data/sinh-cau.js');
require('../data/chuong-trinh.js');
const D = window.NGAN_HANG_CHINH_TA;
const show = process.argv.includes('--in');
let err = 0, warn = 0;
const bad = (m) => { err++; console.log('  ✗ ' + m); };
const note = (m) => { warn++; console.log('  ! ' + m); };
const wordsOf = s => s.split(/\s+/).map(w => w.replace(/[.,!?;:“”"]/g, ''));
const EXPECT = { 1: 17, 2: 10, 3: 24 };
function checkItem(b0, where) {
  const b = Object.assign({}, b0); // câu sinh đổi tên mỗi lần đọc → chụp một lần
  const all = JSON.stringify(b);
  if (all !== all.normalize('NFC')) bad(where + ' chưa chuẩn NFC');
  if (b.loai === 'chon') {
    if ((b.de.match(/___/g) || []).length !== 1) bad(where + ' cần đúng 1 chỗ trống: ' + b.de);
    if (b.de.startsWith('___')) bad(where + ' chỗ trống ở đầu câu (lộ chữ hoa): ' + b.de);
    if (!b.luaChon.includes(b.dapAn)) bad(where + ' đáp án không có trong lựa chọn: ' + b.de);
    if (new Set(b.luaChon).size !== b.luaChon.length) bad(where + ' lựa chọn trùng: ' + b.de);
    if (b.luaChon.length < 2) bad(where + ' ít hơn 2 lựa chọn: ' + b.de);
    const full = b.de.replace('___', b.dapAn);
    if (full[0] !== full[0].toUpperCase()) bad(where + ' câu không viết hoa đầu: ' + full);
  } else if (b.loai === 'timLoi') {
    const n = wordsOf(b.cau).filter(w => w === b.tuSai).length;
    if (n !== 1) bad(where + ' từ sai “' + b.tuSai + '” xuất hiện ' + n + ' lần: ' + b.cau);
    if (b.tuSai === b.tuDung) bad(where + ' từ sai = từ đúng: ' + b.cau);
    if (b.cau[0] !== b.cau[0].toUpperCase()) bad(where + ' câu không viết hoa đầu: ' + b.cau);
  } else if (b.loai === 'ngheViet') {
    if (!/[.!?]$/.test(b.cau)) bad(where + ' câu nghe – viết thiếu dấu kết câu: ' + b.cau);
  } else bad(where + ' loại câu lạ: ' + b.loai);
}
for (const g of [1, 2, 3]) {
  const L = D.chuDe.filter(t => t.lop[0] <= g && g <= t.lop[1]);
  console.log('Lớp ' + g + ': ' + L.length + ' bài');
  if (L.length !== EXPECT[g]) bad('Lớp ' + g + ' cần ' + EXPECT[g] + ' bài, có ' + L.length);
  for (const t of L) {
    const k = { chon: 0, timLoi: 0, ngheViet: 0 };
    t.baiTap.forEach((b, i) => { k[b.loai]++; checkItem(b, t.id + ':' + i); });
    (t.sinh || []).forEach((b, i) => checkItem(b, t.id + ':g' + i));
    if (new Set(t.baiTap.map(b => JSON.stringify(b))).size !== t.baiTap.length) bad(t.id + ' có câu trùng nhau');
    if (k.chon < 6) bad(t.id + ' (' + t.ten + ') chỉ có ' + k.chon + ' câu chọn');
    if (k.timLoi < 1) note(t.id + ' (' + t.ten + ') chưa có câu tìm lỗi');
    if (k.ngheViet < 1) bad(t.id + ' (' + t.ten + ') chưa có câu nghe – viết');
    if (!t.quyTac.length || !t.viDu.length) bad(t.id + ' thiếu mẹo/ví dụ');
    // mỗi cặp trong bài phải có ít nhất 2 câu chọn
    console.log('  ' + t.id + ' ' + t.ten.padEnd(32) + ' chọn ' + k.chon + ' · tìm lỗi ' + k.timLoi + ' · nghe ' + k.ngheViet + ' · sinh ' + (t.sinh || []).length);
    if (show) t.baiTap.forEach(b => console.log('      ' + (b.loai === 'chon' ? b.de.replace('___', '[' + b.luaChon.join('/') + ']') + ' → ' + b.dapAn : b.loai === 'timLoi' ? b.cau + '  (' + b.tuSai + '→' + b.tuDung + ')' : '🎧 ' + b.cau)));
  }
}
// mỗi cặp dùng trong chương trình phải có đủ câu
for (const [id, p] of Object.entries(D.capChinhTa)) {
  const n = p.baiTap.filter(b => b.loai === 'chon').length;
  if (n < 4) bad('Cặp ' + id + ' chỉ có ' + n + ' câu chọn');
}
console.log(err ? '\n❌ ' + err + ' lỗi, ' + warn + ' lưu ý' : '\n✅ ĐẠT (' + warn + ' lưu ý)');
process.exit(err ? 1 : 0);
