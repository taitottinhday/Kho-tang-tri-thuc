// Kiểm thử cắt cảnh điện ảnh (phim.js + phim-truyen.js): node tests/phim_e2e.js [rộng] [cao]
const { launch } = require('./cdp_driver.js');
const fs = require('fs'), path = require('path');
(async () => {
  const [w, h] = [Number(process.argv[2] || 390), Number(process.argv[3] || 844)];
  const out = path.join(__dirname, '..', 'qa-results', 'phim'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h); let pass = 0, fail = 0;
  const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || !x ? '' : ' — ' + JSON.stringify(x).slice(0, 500))); };
  const wait = ms => b.sleep(ms);
  const film = () => b.eval(`const d = document.querySelector('dialog.phim'); if (!d) return null; const imgs = [...d.querySelectorAll('.ph-shot img.base')];
    return { open: d.open, shot: imgs.length ? imgs[imgs.length-1].getAttribute('src').split('/').pop() : '', loaded: imgs.every(i => i.complete && i.naturalWidth > 0), word: (d.querySelector('.ph-word')||{}).textContent || '',
      bars: d.querySelectorAll('.ph-bars i').length, combo: (d.querySelector('.ph-combo b')||{}).textContent || '', fits: document.documentElement.scrollWidth <= ${w} + 1,
      skip: (() => { const r = d.querySelector('.ph-skip').getBoundingClientRect(); return r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 && r.height >= 44; })() }`);
  const answer = right => b.eval(`await new Promise(r=>setTimeout(r,250)); setReady(() => ({ right: ${right} })); document.querySelector('#plCheck').click(); await new Promise(r=>setTimeout(r,350)); return 1`);
  const skip = () => b.eval(`document.querySelector('dialog.phim .ph-skip')?.click(); await new Promise(r=>setTimeout(r,250)); return !document.querySelector('dialog.phim')`);
  const next = () => b.eval(`for (let i=0;i<60;i++){ const c=document.querySelector('#plCont'); if(c && !c.disabled){ c.click(); break; } await new Promise(r=>setTimeout(r,150)); } await new Promise(r=>setTimeout(r,350)); return 1`);
  try {
    await b.goto('index.html', 5000);
    await b.eval(`db.onboarded = true; if (typeof hideWelcome === 'function') hideWelcome(); closeModal(); db.settings.season = 'noel'; save(); return 1`);
    const keys = await b.eval(`return Object.values(PhimTruyen.ANH).flat()`);
    const missing = await b.eval(`const bad = []; for (const k of ${JSON.stringify(keys)}) { const ok = await new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = 'assets/phim/' + k + '.webp'; }); if (!ok) bad.push(k); } return bad`);
    ok(keys.length === 15 && !missing.length, 'Đủ 15 khung phim tải được', missing);

    /* ---- Thám tử chữ: cầu thủ & nhà vua ---- */
    for (const mode of ['football', 'royal']) {
      await b.eval(`closeModal(); go('adaptive'); return 1`); await wait(500);
      await b.eval(`document.querySelector('input[value="${mode}"]').click(); document.querySelector('#adaptiveStart').click(); return 1`); await wait(700);
      await answer(false);
      ok(!(await film()), mode + ': trả lời sai → không chiếu phim');
      await next();
      // ghi lại mọi khung phim xuất hiện, tính từ lúc bấm Kiểm tra
      await b.eval(`window.__shots = []; window.__watch = new MutationObserver(() => document.querySelectorAll('dialog.phim .ph-shot img.base').forEach(i => { const n = i.getAttribute('src').split('/').pop(); if (!__shots.includes(n)) __shots.push(n); })); __watch.observe(document.body, { childList: true, subtree: true }); return 1`);
      await answer(true);
      let f = await film();
      ok(f && f.open && f.loaded && f.bars >= 2 && f.fits && f.skip, mode + ': trả lời đúng → cắt cảnh toàn màn hình', f);
      await b.sleep(150); await b.shot(path.join(out, mode + '-1-' + w + '.png'));
      await b.eval(`for (let i=0;i<30 && __shots.length<2;i++) await new Promise(r=>setTimeout(r,100)); return 1`);
      const shots = await b.eval(`__watch.disconnect(); return __shots`);
      ok(shots.length >= 2, mode + ': phim chiếu nối tiếp nhiều cảnh', shots);
      await b.sleep(250); await b.shot(path.join(out, mode + '-2-' + w + '.png'));
      ok(await skip(), mode + ': nút Bỏ qua đóng phim');
      ok(await b.eval(`const c = document.querySelector('#plCont'); return !!c`), mode + ': đóng phim thấy lại phản hồi + nút tiếp tục');
      await next();
      await answer(true); f = await film(); ok(f && f.combo === 'x2', mode + ': đúng liền 2 câu → LIÊN HOÀN x2', f); await skip(); await next();
      await answer(true); await skip(); await next();
      await answer(true); f = await film();
      ok(f && f.bars >= 3, mode + ': câu đúng thứ 4 → đoạn kết dài (' + (f && f.bars) + ' cảnh)', f);
      const seen = new Set(); const t0 = Date.now(); let k = 0;
      while (Date.now() - t0 < 14000) { const g = await film(); if (!g) break; if (!seen.has(g.shot)) { seen.add(g.shot); await wait(750); await b.shot(path.join(out, mode + '-ket' + (k++) + '-' + w + '.png')); } await wait(120); }
      ok(!(await film()) && seen.size >= 3, mode + ': đoạn kết chiếu đủ cảnh rồi tự đóng', [...seen]);
      await b.eval(`closeModal(); return 1`);
    }
    /* ---- Thỏ chạy thoát & bị bắt ---- */
    await b.eval(`closeModal(); go('adaptive'); return 1`); await wait(500);
    await b.eval(`document.querySelector('input[value="rabbit"]').click(); document.querySelector('#adaptiveStart').click(); return 1`); await wait(700);
    await answer(true); let f = await film(); ok(f && /tho-/.test(f.shot), 'Thỏ: trả lời đúng có cắt cảnh', f); await wait(700); await b.shot(path.join(out, 'rabbit-1-' + w + '.png')); await skip(); await next();
    for (let i = 0; i < 3; i++) { await answer(false); if (i < 2) { ok(!(await film()), 'Thỏ: sai lần ' + (i + 1) + ' chưa chiếu'); await next(); } }
    await wait(200); f = await film(); ok(f && f.shot === 'tho-4.webp', 'Thỏ: sai 3 câu → cảnh Sói chặn đường', f); await wait(800); await b.shot(path.join(out, 'rabbit-bat-' + w + '.png')); await skip();
    /* ---- Vườn truyện ---- */
    await b.eval(`closeModal(); go('stories'); return 1`); await wait(500);
    const stories = await b.eval(`return STORY_ROUTES.map(r => ({ route: r.id, first: r.chapters[0].id, last: r.chapters[r.chapters.length - 1].id, scenes: r.chapters[r.chapters.length - 1].scenes.length }))`);
    for (const s of stories) {
      const planned = await b.eval(`const route = PhimTruyen.routeOf({ kind:'storybook', storyId:'${s.last}' }); const mid = PhimTruyen.plan({ kind:'storybook', storyId:'${s.first}', i:0, log:[{right:true}] }, true); const fin = PhimTruyen.plan({ kind:'storybook', storyId:'${s.last}', i:${s.scenes - 1}, log:[{right:true}] }, true); const no = PhimTruyen.plan({ kind:'storybook', storyId:'${s.last}', i:0, log:[{right:false}] }, false);
        return { route, mid: mid.shots.length, midFinale: !!mid.finale, fin: !!fin.finale, finShots: fin.shots.map(x => x.anh), no }`);
      ok(planned.route === s.route && !planned.midFinale && planned.fin && planned.finShots.length >= 2 && !planned.no, 'Vườn truyện ' + s.route + ': chốt thường có pha hành động, câu cuối tuyến có đoạn kết', planned);
    }
    /* ---- bài học thường không chiếu phim ---- */
    await b.eval(`closeModal(); const t = getTopic('l2-03'); startQuiz({ kind:'lesson', title:t.ten, topicId:t.id, level:'de', hints:0, items: t.baiTap.filter(x=>x.loai==='chon').slice(0,3).map((x,i)=>Object.assign({},x,{_t:t.id,_i:i})) }); return 1`); await wait(500);
    await answer(true); ok(!(await film()), 'Bài học thường: không chen phim vào'); await b.eval(`closeModal(); return 1`);
    /* ---- giảm chuyển động ---- */
    await b.eval(`document.body.classList.add('calm'); Phim.play(PhimTruyen.plan({kind:'storybook',storyId:'${stories.find(s => s.route === 'football').last}',i:${stories.find(s => s.route === 'football').scenes - 1},log:[{right:true}]}, true).shots); await new Promise(r=>setTimeout(r,900)); return 1`);
    f = await film(); ok(f && f.shot === 'bong-6.webp' && await b.eval(`return document.querySelector('dialog.phim').classList.contains('phim-still')`), 'Giảm chuyển động: chỉ một khung tĩnh', f);
    await b.shot(path.join(out, 'tinh-' + w + '.png')); await wait(1900); ok(!(await film()), 'Khung tĩnh tự đóng');
    ok(b.errors.length === 0, 'Không lỗi JS', b.errors);
  } finally { await b.close(); }
  console.log(`\n${pass} đạt, ${fail} lỗi (${w}x${h})`); process.exit(fail ? 1 : 0);
})();
