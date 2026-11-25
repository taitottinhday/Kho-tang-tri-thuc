/* Kiểm tra bộ sinh câu (data/sinh-cau.js): node tests/sinh-cau-check.js [--mau]
   Mỗi câu sinh được bốc 40 lần (tên/người thân/số đếm ngẫu nhiên) và phải đạt mọi điều kiện của ngân hàng chính:
   đáp án ∈ lựa chọn, lựa chọn không trùng, đúng 1 chỗ trống, chữ sai xuất hiện đúng 1 lần và chạm được, chuỗi NFC. */
'use strict';
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', 'data', 'ngan-hang-chinh-ta.js'));
require(path.join(__dirname, '..', 'data', 'sinh-cau.js'));
const D = window.NGAN_HANG_CHINH_TA;
const cleanWord = w => w.replace(/[.,!?;:"“”()…]/g, ''); // giống app.js
const errors = [];
let total = 0, topics = 0;
const fail = (t, k, msg, it) => errors.push(t.id + ':g' + k + ' – ' + msg + ' – ' + JSON.stringify(it));
for (const t of D.chuDe) {
  if (!t.sinh) continue;
  topics++;
  t.sinh.forEach((b, k) => {
    total++;
    for (let r = 0; r < 40; r++) {
      const it = Object.assign({}, b);
      const text = it.loai === 'chon' ? it.de : it.cau;
      if (typeof text !== 'string' || /[{}~]/.test(text)) { fail(t, k, 'còn chỗ giữ chỗ', it); break; }
      if (text.normalize('NFC') !== text) { fail(t, k, 'không phải NFC', it); break; }
      if (!/[.!?]$/.test(text)) { fail(t, k, 'thiếu dấu câu cuối', it); break; }
      if (text[0] !== text[0].toUpperCase()) { fail(t, k, 'đầu câu chưa viết hoa', it); break; }
      if (it.loai === 'chon') {
        if (text.split('___').length !== 2) { fail(t, k, 'không đúng 1 chỗ trống', it); break; }
        if (text.startsWith('___')) { fail(t, k, 'chỗ trống ở đầu câu', it); break; }
        if (!it.luaChon.includes(it.dapAn)) { fail(t, k, 'đáp án không có trong lựa chọn', it); break; }
        if (new Set(it.luaChon).size !== it.luaChon.length) { fail(t, k, 'lựa chọn trùng', it); break; }
        // Ghép chữ (app.js makeGhep): các thẻ đọc xuôi/ngược như nhau (“n·ặ·n”) thì bài ghép vô nghĩa
        const pos = text.indexOf('___'), full = text.replace('___', it.dapAn), st = text.lastIndexOf(' ', pos) + 1;
        let en = full.indexOf(' ', pos + it.dapAn.length); if (en < 0) en = full.length;
        const word = full.slice(st, en).replace(/[.,!?:;]/g, ''), tok = (text.split(' ').find(w => w.includes('___')) || '___').replace(/[.,!?:;"“”]/g, '').split('___');
        if (!/\s/.test(word) && [...word].length >= 2 && [...word].length <= 8) {
          const units = word !== it.dapAn && it.dapAn.length <= 4 && (tok[0] || '') + it.dapAn + (tok[1] || '') === word ? [...(tok[0] || ''), it.dapAn, ...(tok[1] || '')] : [...word];
          if (units.join('|') === units.slice().reverse().join('|')) { fail(t, k, 'thẻ ghép chữ đối xứng (“' + word + '”)', it); break; }
        }
      } else if (it.loai === 'timLoi') {
        const words = text.split(' ');
        const hits = words.filter(w => cleanWord(w) === it.tuSai).length;
        if (hits !== 1) { fail(t, k, 'chữ sai chạm được ' + hits + ' lần', it); break; }
        const first = text.indexOf(it.tuSai), tokStart = words.slice(0, words.findIndex(w => cleanWord(w) === it.tuSai)).join(' ').length + (words.findIndex(w => cleanWord(w) === it.tuSai) ? 1 : 0);
        if (first !== tokStart) { fail(t, k, 'chữ sai xuất hiện trước chỗ cần sửa', it); break; }
        if (it.tuSai === it.tuDung) { fail(t, k, 'chữ sai = chữ đúng', it); break; }
      } else { fail(t, k, 'loại lạ', it); break; }
    }
  });
}
const keys = D.chuDe.filter(t => t.sinh).map(t => t.id + ' ' + t.sinh.length).join(', ');
console.log('Chủ đề có câu sinh: ' + topics + ' – tổng ' + total + ' câu sinh (' + keys + ')');
console.log('Đoạn nghe–viết mỗi lớp: ' + Object.keys(D.doanNgheViet).map(g => g + ':' + D.doanNgheViet[g].length).join(' '));
if (process.argv.includes('--mau')) {
  for (const t of D.chuDe) if (t.sinh) {
    console.log('\n## ' + t.id);
    t.sinh.forEach((b, k) => { const it = Object.assign({}, b); console.log('  g' + k + ' ' + (it.loai === 'chon' ? it.de + '  [' + it.luaChon.join(' / ') + '] → ' + it.dapAn : '🔎 ' + it.cau + '  (' + it.tuSai + ' → ' + it.tuDung + ')')); });
  }
}
if (errors.length) { console.log('\nLỖI (' + errors.length + '):\n' + errors.slice(0, 40).join('\n')); process.exit(1); }
console.log('ĐẠT: mọi câu sinh hợp lệ.');
