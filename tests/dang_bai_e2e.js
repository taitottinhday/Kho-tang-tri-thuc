// Kiểm thử 7 dạng bài thêm (dang-bai.js): node tests/dang_bai_e2e.js [rộng] [cao]
const { launch } = require('./cdp_driver.js');
const fs = require('fs'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 390), Number(process.argv[3] || 844)];
  const out = path.join(__dirname, '..', 'qa-results', 'dang-bai'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h); let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !x ? '' : ' — ' + JSON.stringify(x).slice(0, 400))); };
  try {
    await b.goto('index.html', 4500);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); return 1;`);
    // 1. Tạo được dạng bài cho mọi bài của lớp 1–3, dữ liệu hợp lệ
    const cov = await b.eval(`const r = { lessons: 0, miss: {}, bad: [] };
      for (const g of [1,2,3]) { S.grade = String(g); for (const t of gradeTopics(g)) { r.lessons++;
        for (let k = 0; k < 5; k++) {
          const p = DangBai.makePhanLoai(t), n = DangBai.makeNoiTu(t), x = DangBai.makeSapXep(t), c = DangBai.makeChonNhieu(t);
          if (!p) r.miss.phanLoai = (r.miss.phanLoai||[]).concat(t.id); else if (p.words.some(w => !p.baskets.includes(w.b)) || p.words.length < 4) r.bad.push(['phanLoai', t.id]);
          if (!n) r.miss.noiTu = (r.miss.noiTu||[]).concat(t.id); else if (new Set(n.pairs.map(q=>q[0])).size !== n.pairs.length) r.bad.push(['noiTu', t.id]);
          if (!x) r.miss.sapXep = (r.miss.sapXep||[]).concat(t.id); else if (x.order.every((v,i)=>v===i)) r.bad.push(['sapXep-chưa-trộn', t.id]);
          if (!c) r.miss.chonNhieu = (r.miss.chonNhieu||[]).concat(t.id); else { const goods = c.chips.filter(z=>z.ok).map(z=>z.w), bads = c.chips.filter(z=>!z.ok).map(z=>z.w); if (goods.some(z=>bads.includes(z))) r.bad.push(['chonNhieu-trùng', t.id, goods, bads]); }
        }
        for (const L of ['de','vua','kho']) { const list = buildLesson(t, L); if (list.some(it => !TYPE_TAG[it.loai])) r.bad.push(['buildLesson', t.id, L]); }
      } }
      for (const k in r.miss) r.miss[k] = [...new Set(r.miss[k])];
      return r;`);
    ok(cov.lessons === 51, 'Đủ 51 bài lớp 1–3', cov.lessons);
    ok(!cov.bad.length, 'Dữ liệu các dạng hợp lệ ở mọi bài', cov.bad.slice(0, 5));
    ok(!(cov.miss.phanLoai || []).length, 'Bài nào cũng có “Xếp vào giỏ”', cov.miss.phanLoai);
    ok(!(cov.miss.noiTu || []).length, 'Bài nào cũng có “Nối tiếng thành từ”', cov.miss.noiTu);
    ok(!(cov.miss.sapXep || []).length, 'Bài nào cũng có “Xếp chữ thành câu”', cov.miss.sapXep);
    ok(!(cov.miss.chonNhieu || []).length, 'Bài nào cũng có “Chọn tất cả từ đúng”', cov.miss.chonNhieu);
    // Nhìn tranh chọn từ: bao nhiêu bài có tranh, mọi hình đều tải được, đáp án nằm trong lựa chọn
    const pics = await b.eval(`let n = 0; const miss = [], bad = []; for (const g of [1,2,3]) { S.grade=String(g); for (const t of gradeTopics(g)) { const x = DangBai.makeNhinTranh(t); if (x) { n++; if (!x.opts.includes(x.word) || new Set(x.opts).size !== x.opts.length) bad.push(t.id); } else miss.push(t.id + ' ' + t.ten); } }
      for (const r of DangBai.TRANH) { const ok = await new Promise(res => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = 'assets/emoji/' + r[0] + '.webp'; }); if (!ok) bad.push(r[1]); }
      return { n, miss, bad, total: DangBai.TRANH.length }`);
    ok(!pics.bad.length && pics.n >= 40, 'Nhìn tranh chọn từ: ' + pics.n + '/51 bài có tranh, ' + pics.total + ' hình tải được', pics);
    console.log('    (bài chưa có tranh: ' + (pics.miss.join('; ') || 'không') + ')');

    // 2. Bài học có đủ dạng mới
    const mix = await b.eval(`S.grade='2'; const seen = new Set(); for (const t of gradeTopics(2)) for (const L of ['de','vua','kho']) buildLesson(t, L).forEach(it => seen.add(it.loai)); return [...seen]`);
    for (const k of ['phanLoai', 'noiTu', 'goChu', 'chonCau', 'sapXep', 'chonNhieu', 'suaLoi']) ok(mix.includes(k), 'Bài học lớp 2 có dạng ' + k, mix);
    const g1 = await b.eval(`S.grade='1'; const seen = new Set(); for (const t of gradeTopics(1)) for (const L of ['de','vua','kho']) buildLesson(t, L).forEach(it => seen.add(it.loai)); return [...seen]`);
    ok(!g1.includes('goChu') && !g1.includes('suaLoi'), 'Lớp 1 không phải gõ phím', g1);

    // 3. Làm thật từng dạng trên giao diện: đúng → khen, sai → sửa
    async function play(make, answer, name, right) {
      await b.eval(`S.grade='2'; closeModal && closeModal(); const t = getTopic('l2-03'); const it = (${make})(t); window.__it = it; startQuiz({ kind:'practice', title:'Thử', items:[it] }); return 1`);
      await b.sleep(250);
      await b.eval(answer);
      await b.sleep(150);
      const r = await b.eval(`const c = document.querySelector('#plCheck'); const en = c && !c.disabled; if (en) c.click(); await new Promise(r=>setTimeout(r,250)); const sh = document.querySelector('#plSheet');
        const fitsX = document.documentElement.scrollWidth <= innerWidth + 1;
        return { en, good: sh && sh.classList.contains('good'), bad: sh && sh.classList.contains('bad'), fitsX }`);
      ok(r.en && (right ? r.good : r.bad) && r.fitsX, name, r);
      if (right) await b.shot(path.join(out, name.replace(/[^\w]+/g, '-').slice(0, 40) + '-' + w + '.png'));
      await b.eval(`document.querySelector('#plCont')?.click(); await new Promise(r=>setTimeout(r,250)); closeModal(); return 1`);
    }
    const tapTo = `const it = window.__it; `;
    await play('DangBai.makePhanLoai', tapTo + `for (const [k,x] of it.words.entries()) { document.querySelector('[data-w="'+k+'"]').click(); document.querySelector('[data-b="'+it.baskets.indexOf(x.b)+'"]').click(); } return 1`, 'Xếp vào giỏ – đúng', true);
    await play('DangBai.makePhanLoai', tapTo + `for (const [k,x] of it.words.entries()) { document.querySelector('[data-w="'+k+'"]').click(); document.querySelector('[data-b="'+((it.baskets.indexOf(x.b)+1)%it.baskets.length)+'"]').click(); } return 1`, 'Xếp vào giỏ – sai', false);
    await play('DangBai.makeNoiTu', tapTo + `it.pairs.forEach((p,k) => { document.querySelector('[data-l="'+k+'"]').click(); document.querySelector('[data-r="'+it.right.indexOf(p[1])+'"]').click(); }); return 1`, 'Nối tiếng thành từ – đúng', true);
    await play('DangBai.makeNoiTu', tapTo + `it.pairs.forEach((p,k) => { document.querySelector('[data-l="'+k+'"]').click(); document.querySelector('[data-r="'+((it.right.indexOf(p[1])+1)%it.right.length)+'"]').click(); }); return 1`, 'Nối tiếng thành từ – sai', false);
    await play('t => DangBai.makeGoChu(Object.assign({}, t.baiTap.find(x=>x.loai==="chon"), {_t:t.id,_i:0}))', tapTo + `const i = document.querySelector('#dbType'); i.value = it.dapAn.toUpperCase(); i.dispatchEvent(new Event('input')); return 1`, 'Gõ chữ còn thiếu – đúng (chữ hoa vẫn tính)', true);
    await play('t => DangBai.makeGoChu(Object.assign({}, t.baiTap.find(x=>x.loai==="chon"), {_t:t.id,_i:0}))', tapTo + `const i = document.querySelector('#dbType'); i.value = it.luaChon.find(o=>o!==it.dapAn); i.dispatchEvent(new Event('input')); return 1`, 'Gõ chữ còn thiếu – sai', false);
    await play('t => DangBai.makeChonCau(Object.assign({}, t.baiTap.find(x=>x.loai==="chon"), {_t:t.id,_i:0}))', tapTo + `document.querySelector('[data-answer="'+CSS.escape(it.good)+'"]').click(); return 1`, 'Chọn câu viết đúng – đúng', true);
    await play('DangBai.makeSapXep', tapTo + `it.words.forEach((_,k) => document.querySelector('[data-k="'+k+'"]').click()); return 1`, 'Xếp chữ thành câu – đúng', true);
    await play('DangBai.makeSapXep', tapTo + `it.order.forEach(k => document.querySelector('[data-k="'+k+'"]').click()); return 1`, 'Xếp chữ thành câu – sai', false);
    await play('DangBai.makeChonNhieu', tapTo + `it.chips.forEach((c,k) => { if (c.ok) document.querySelector('[data-c="'+k+'"]').click(); }); return 1`, 'Chọn tất cả từ đúng – đúng', true);
    await play('DangBai.makeChonNhieu', tapTo + `it.chips.forEach((c,k) => { if (!c.ok) document.querySelector('[data-c="'+k+'"]').click(); }); return 1`, 'Chọn tất cả từ đúng – sai', false);
    await play('t => DangBai.makeSuaLoi(Object.assign({}, t.baiTap.find(x=>x.loai==="timLoi"), {_t:t.id,_i:0}))', tapTo + `const i = document.querySelector('#dbFix'); i.value = it.tuDung; i.dispatchEvent(new Event('input')); return 1`, 'Sửa lỗi – đúng', true);
    await play('DangBai.makeNhinTranh', tapTo + `document.querySelector('[data-answer="'+CSS.escape(it.word)+'"]').click(); return 1`, 'Nhìn tranh chọn từ – đúng', true);
    await play('DangBai.makeNhinTranh', tapTo + `document.querySelector('[data-answer="'+CSS.escape(it.opts.find(o=>o!==it.word))+'"]').click(); return 1`, 'Nhìn tranh chọn từ – sai', false);

    // 4. Một bài học thật từ đầu đến cuối (mức Khó) – không lỗi JS
    const full = await b.eval(`S.grade='3'; const t = getTopic('l3-05'); startQuiz({ kind:'lesson', title:t.ten, topicId:t.id, level:'kho', hints:0, items: buildLesson(t,'kho') }); return Q.items.map(i=>i.loai)`);
    ok(full.length >= 15, 'Bài lớp 3 mức Khó trộn ' + new Set(full).size + ' dạng', full);
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); }
  console.log(`\n${pass} đạt, ${fail} lỗi (${w}px)`); process.exit(fail ? 1 : 0);
})();
