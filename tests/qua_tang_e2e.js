// Kiểm thử quà tặng chúc mừng: node tests/qua_tang_e2e.js [rộng] [cao] [mã-quà|all]
const { launch } = require('./cdp_driver.js');
const fs = require('fs'), path = require('path');
(async () => {
  const [w, h, only] = [Number(process.argv[2] || 390), Number(process.argv[3] || 844), process.argv[4] || 'all'];
  const out = path.join(__dirname, '..', 'qa-results', 'qua-tang'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h); let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !x ? '' : ' — ' + JSON.stringify(x).slice(0, 500))); };
  try {
    await b.goto('index.html', 5000);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na Ngọc Ánh'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); return 1;`);
    const ids = await b.eval(`return QuaTang.gifts.map(g=>g.id)`);
    ok(ids.length >= 11, 'Có ≥ 11 món quà', ids);
    // luật tặng quà
    const rule = await b.eval(`const p = {name:'A',avatar:'🦊'}; const t = (c,n,k) => QuaTang.earn(p,{kind:k||'lesson',correct:c,total:n,finished:true});
      return { low: t(7,10), a: t(8,10)?.gift, b: t(9,10)?.gift, c: t(10,10)?.gift, d: t(10,10)?.gift, e: t(10,10)?.gift, place: t(10,10,'placement'), few: t(2,2), unfinished: QuaTang.earn(p,{kind:'lesson',correct:10,total:10,finished:false}) }`);
    ok(!rule.low && rule.a && rule.b && rule.c, 'Dưới 80% không có quà; từ 80% có quà', rule);
    ok(new Set([rule.c, rule.d, rule.e]).size === 3, 'Đúng 100% xoay vòng 3 quà huyền thoại', rule);
    ok(!rule.place && !rule.few && !rule.unfinished, 'Không tặng cho kiểm tra trình độ, bài quá ngắn, bài dở dang', rule);
    // diễn từng món quà: ảnh tải được, chữ không tràn, nút bấm được, đóng sạch
    for (const id of ids.filter(i => only === 'all' || only.split(',').includes(i))) {
      const meta = await b.eval(`const g = QuaTang.gifts.find(x=>x.id==='${id}'); window.__g = g; QuaTang.show({gift:'${id}',correct:12,total:12,acc:100,student:S.name,avatar:S.avatar,praise:'Em đọc kĩ từng chữ nên viết đúng quá!',firstTime:true}); return {ms:g.ms}`);
      await b.sleep(900);
      const times = id === 'su-tu' ? [1800, 3700, 6100, meta.ms + 300] : [2300, 3600, 5000, meta.ms + 300];
      let prev = 900, k = 0;
      for (const t of times) { await b.sleep(Math.max(0, t - prev)); prev = t; await b.shot(path.join(out, id + '-' + (k++) + '-' + w + '.png')); }
      const r = await b.eval(`const d = document.querySelector('dialog.qt'); const broken = [...d.querySelectorAll('img')].filter(i=>!i.classList.contains('emo') && (!i.complete || !i.naturalWidth)).map(i=>i.src.split('/').pop());
        const bgm = /url\\("?([^")]+)/.exec(d.querySelector('.qt-bg').style.backgroundImage||''); let bgOk = true; if (bgm) { bgOk = await new Promise(res=>{const i=new Image(); i.onload=()=>res(true); i.onerror=()=>res(false); i.src=bgm[1];}); }
        const btn = d.querySelector('.qt-next').getBoundingClientRect(), card = d.querySelector('.qt-card').getBoundingClientRect(), ban = d.querySelector('.qt-banner').getBoundingClientRect(), x = d.querySelector('.qt-close').getBoundingClientRect();
        const topEl = document.elementFromPoint(btn.x+btn.width/2, btn.y+btn.height/2);
        return { open: d.open, broken, bgOk, inView: card.left >= -1 && card.right <= innerWidth+1 && card.bottom <= innerHeight+1 && card.top >= 0, hit: topEl && !!topEl.closest('.qt-next'), noOverlap: ban.right <= x.left + 1, btnH: btn.height }`);
      ok(r.open && !r.broken.length && r.bgOk, id + ': ảnh tải đủ', r);
      ok(r.inView && r.hit && r.noOverlap && r.btnH >= 44, id + ': thẻ kết quả trong màn, nút bấm được, thanh quà không đè nút ✕', r);
      await b.eval(`document.querySelector('dialog.qt .qt-next').click(); await new Promise(r=>setTimeout(r,250)); return 1`);
      ok(await b.eval(`return !document.querySelector('dialog.qt')`), id + ': đóng sạch');
    }
    // từ bài làm thật: đúng hết → tự diễn quà, đóng lại thấy màn kết quả có “Xem lại”
    await b.eval(`const t = getTopic('l2-03'); const items = t.baiTap.filter(x=>x.loai==='chon').slice(0,5).map((x,i)=>Object.assign({},x,{_t:t.id,_i:i})); startQuiz({kind:'lesson',title:t.ten,topicId:t.id,level:'vua',hints:0,items}); return 1`);
    for (let i = 0; i < 5; i++) { await b.eval(`await new Promise(r=>setTimeout(r,200)); const it = Q.items[Q.i]; document.querySelector('[data-answer="'+CSS.escape(it.dapAn)+'"]').click(); document.querySelector('#plCheck').click(); await new Promise(r=>setTimeout(r,250)); document.querySelector('#plCont').click(); return 1`); }
    await b.sleep(900);
    const flow = await b.eval(`return { gift: !!document.querySelector('dialog.qt'), strip: !!document.querySelector('.qt-strip'), saved: Object.keys(S.gifts||{}).length }`);
    ok(flow.gift && flow.strip && flow.saved >= 1, 'Làm đúng hết một bài → quà tự diễn, kết quả có dải quà, quà được lưu', flow);
    await b.eval(`document.querySelector('dialog.qt .qt-close').click(); await new Promise(r=>setTimeout(r,200)); document.querySelector('.qt-replay').click(); await new Promise(r=>setTimeout(r,500)); return 1`);
    ok(await b.eval(`return !!document.querySelector('dialog.qt')`), 'Bấm “Xem lại” diễn lại quà');
    await b.eval(`QuaTang.close(); document.querySelector('.qt-strip [data-view="gifts"]').click(); await new Promise(r=>setTimeout(r,600)); return 1`);
    const col = await b.eval(`return { view: currentView, items: document.querySelectorAll('.qt-item').length, fitsX: document.documentElement.scrollWidth <= innerWidth+1 }`);
    ok(col.view === 'gifts' && col.items === ids.length && col.fitsX, 'Mở được Bộ sưu tập quà', col);
    await b.shot(path.join(out, 'bo-suu-tap-' + w + '.png'), true);
    await b.eval(`go('profile'); await new Promise(r=>setTimeout(r,400)); return 1`);
    ok(await b.eval(`return !!document.querySelector('.qt-entry')`), 'Hồ sơ có lối vào Bộ sưu tập quà');
    // Giảm chuyển động: một khung tĩnh, thẻ hiện ngay
    await b.eval(`document.body.classList.add('calm'); QuaTang.show({gift:'su-tu',correct:5,total:5,acc:100,student:S.name,avatar:S.avatar,praise:'Giỏi!',firstTime:false}); await new Promise(r=>setTimeout(r,1500)); return 1`);
    ok(await b.eval(`const d = document.querySelector('dialog.qt'); return d.classList.contains('qt-still') && getComputedStyle(d.querySelector('.qt-card')).visibility === 'visible'`), 'Giảm chuyển động: hiện tĩnh, thẻ có ngay');
    await b.shot(path.join(out, 'tinh-' + w + '.png'));
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); }
  console.log(`\n${pass} đạt, ${fail} lỗi (${w}x${h})`); process.exit(fail ? 1 : 0);
})();
