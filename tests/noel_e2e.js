// Kiểm thử đợt 12 (bộ sinh câu, Hứng tuyết chữ, nền Noel thống nhất, tuyết, chế độ đêm/tắt Noel): node tests/noel_e2e.js [rộng] [cao] [thư-mục-ảnh]
const { launch } = require('./cdp_driver.js');
const fs = require('fs');
(async () => {
  const [w, h, out] = [Number(process.argv[2] || 1366), Number(process.argv[3] || 860), process.argv[4] || require('path').join(__dirname, '..', 'qa-results', 'noel')];
  fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h);
  let pass = 0, fail = 0;
  const ok = (cond, name, extra) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (extra ? ' — ' + JSON.stringify(extra) : '')); } };
  const wait = ms => b.sleep(ms);
  try {
    await b.goto('index.html', 2500);
    await b.eval(`window.setTestSeason = season => dispatchEvent(new StorageEvent('storage', { key:SeasonCatalog.cacheKey, newValue:season })); setTestSeason('noel');`);
    await b.eval(`document.querySelector('#wlCreate').click(); await new Promise(r=>setTimeout(r,300));
      document.querySelector('#nameInput').value='Bé Na'; document.querySelector('[data-char="🦊"]')?.click();
      document.querySelector('#saveProfile').click(); await new Promise(r=>setTimeout(r,400));
      document.querySelector('#howToGo')?.click(); await new Promise(r=>setTimeout(r,300)); return 1;`);

    // 1. Bộ sinh câu đã nạp
    const gen = await b.eval(`return { n: ALL_TOPICS.filter(t => t.sinh && t.sinh.length).length, total: ALL_TOPICS.reduce((s,t)=>s+(t.sinh?t.sinh.length:0),0), passages: DATA.doanNgheViet[2].length }`);
    ok(gen.n >= 19 && gen.total > 400, 'Bộ sinh câu nạp cho ≥19 chủ đề', gen);
    ok(gen.passages >= 5, 'Có thêm đoạn nghe–viết mùa đông', gen);
    // 2. Câu sinh thay đổi tên mỗi lần lấy ra
    const vary = await b.eval(`for (const t of ALL_TOPICS) for (const q of t.sinh || []) {
      if (q.loai !== 'chon') continue;
      const variants = new Set(Array.from({ length:30 }, () => q.de));
      if (variants.size >= 4) return { distinct:variants.size, sample:[...variants].slice(0,3) };
    } return { distinct:0 };`);
    ok(vary.distinct >= 4, 'Cùng một câu sinh nhưng tên bạn nhỏ đổi mỗi lần', vary);
    // 3. Bài học trộn câu sinh, giữ nguyên số câu
    const lesson = await b.eval(`const t = getTopic('l2-01'); const base = t.baiTap.filter(b=>b.loai==='chon').length; const L = buildLesson(t, 'kho'); const L2 = buildLesson(t, 'kho');
      return { len: L.length, len2: L2.length, gen: L.filter(x => String(x._i)[0]==='g').length, same: L.map(x=>x.de||x.cau).join('|') === L2.map(x=>x.de||x.cau).join('|') }`);
    ok(lesson.gen > 0 && lesson.len === lesson.len2, 'Bài học có câu sinh, độ dài ổn định', lesson);
    ok(!lesson.same, 'Hai lần học cùng mức cho bộ câu khác nhau', lesson);
    // 4. Làm bài thật: trả lời SAI một câu sinh → vào sổ ôn, trang Ôn hiển thị được
    await b.eval(`go('home'); await new Promise(r=>setTimeout(r,300)); const t = getTopic('l2-01');
      const it = genItems(t, x => x.loai === 'chon')[0];
      startQuiz({ kind: 'quick', title: 'Thử', icon: '🎲', subtitle: '', items: [it] }); await new Promise(r=>setTimeout(r,400)); return 1;`);
    await b.shot(out + '/quiz-gen-' + w + '.png');
    const ans = await b.eval(`const btns = [...document.querySelectorAll('[data-answer]')]; const it = Q.items[0];
      const wrong = btns.find(x => x.dataset.answer !== it.dapAn); wrong.click(); await new Promise(r=>setTimeout(r,150));
      document.querySelector('#plCheck').click(); await new Promise(r=>setTimeout(r,300));
      const keys = Object.keys(S.review); return { keys, sheet: !document.querySelector('#plSheet').hidden }`);
    ok(ans.sheet && ans.keys.some(k => /^l2-01:g\d+$/.test(k)), 'Câu sinh trả lời sai được ghi vào sổ ôn (khoá :g…)', ans);
    await b.eval(`closeModal(); go('review'); await new Promise(r=>setTimeout(r,400)); return 1;`);
    const rev = await b.eval(`return { items: document.querySelectorAll('.review-item').length, text: (document.querySelector('.review-item')||{}).textContent || '' }`);
    ok(rev.items >= 1 && !/undefined|\{ai\}|~/.test(rev.text), 'Trang Ôn lại hiển thị câu sinh', rev);
    await b.shot(out + '/review-gen-' + w + '.png');

    // 5. Trò Hứng tuyết chữ
    await b.eval(`go('games'); await new Promise(r=>setTimeout(r,400)); return 1;`);
    const card = await b.eval(`return !!document.querySelector('[data-action="snowcatch"]')`);
    ok(card, 'Trang Trò chơi có thẻ Hứng tuyết chữ');
    await b.eval(`document.querySelector('[data-action="snowcatch"]').click(); await new Promise(r=>setTimeout(r,400)); return 1;`);
    await b.shot(out + '/snow-intro-' + w + '.png');
    ok(await b.eval(`return !!document.querySelector('#scGo')`), 'Hộp giới thiệu có nút Bắt đầu');
    await b.eval(`document.querySelector('#scGo').click(); return 1;`);
    await wait(2200);
    await b.shot(out + '/snow-play-' + w + '.png');
    const st1 = await b.eval(`const s = snowCatchState(); const f = [...document.querySelectorAll('.sc-flake')].map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; });
      const field = document.querySelector('#scField').getBoundingClientRect(); return { s, f, field: { w: Math.round(field.width), h: Math.round(field.height) }, mode: document.querySelector('#modalRoot').className, sentence: document.querySelector('#scSentence').textContent }`);
    ok(st1.s && st1.s.flakes.includes(st1.s.word) && st1.f.length >= 3, 'Có ≥3 bông tuyết, trong đó có chữ đúng', st1);
    ok(st1.field.h >= 200, 'Sân chơi đủ cao', st1.field);
    ok(st1.f.every(x => x.x >= 0 && x.x + x.w <= w + 1), 'Bông tuyết không tràn ngang màn hình', st1.f);
    ok(st1.f.every(x => x.h >= 36 && x.w >= 36), 'Bông tuyết đủ to để chạm (≥36px)', st1.f);
    ok(/___|\?/.test(st1.sentence) || st1.sentence.includes('?'), 'Câu có chỗ trống', st1.sentence);
    const overlaps = await b.eval(`const bad = []; for (let k = 0; k < 6; k++) { await new Promise(r=>setTimeout(r,350));
        const rs = [...document.querySelectorAll('.sc-flake')].filter(e => !/pop|wrong|fade|melt/.test(e.className)).map(e => e.getBoundingClientRect());
        for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const a = rs[i], c = rs[j];
          if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) bad.push([Math.round(a.left), Math.round(a.top), Math.round(c.left), Math.round(c.top)]); } }
      return bad;`);
    ok(!overlaps.length, 'Các bông tuyết không chồng lên nhau (6 lần đo)', overlaps.slice(0, 3));
    // chạm đúng
    const hitGood = await b.eval(`const s = snowCatchState(); const el = [...document.querySelectorAll('.sc-flake')].find(e => e.textContent === s.word);
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); await new Promise(r=>setTimeout(r,120));
      return { score: snowCatchState().score, blank: document.querySelector('.sc-blank.ok') ? document.querySelector('.sc-blank.ok').textContent : '' }`);
    ok(hitGood.score === 1 && hitGood.blank.length > 0, 'Chạm chữ đúng: +1 điểm, chữ điền vào câu', hitGood);
    await wait(900);
    // chạm sai 3 lần → hết tim → màn kết quả
    for (let i = 0; i < 3; i++) {
      const r = await b.eval(`const s = snowCatchState(); if (!s) return 'no-game'; const el = [...document.querySelectorAll('.sc-flake:not(.wrong):not(.pop):not(.fade):not(.star)')].find(e => e.textContent !== s.word);
        if (!el) return 'no-wrong'; el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true })); await new Promise(r=>setTimeout(r,80)); return snowCatchState() ? snowCatchState().lives : 'ended';`);
      if (r === 'no-wrong') { await b.eval(`const s = snowCatchState(); const el = [...document.querySelectorAll('.sc-flake')].find(e => e.textContent === s.word); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); return 1;`); await wait(900); i--; continue; }
      await wait(250);
    }
    await wait(1200);
    const res = await b.eval(`return { title: (document.querySelector('.modal-card h3')||{}).textContent, again: !!document.querySelector('#scAgain'), best: S.bestSnow, xp: S.xp, review: Object.keys(S.review).length, hist: S.history[0] && S.history[0].kind }`);
    ok(res.again && res.best >= 1 && res.hist === 'snowcatch', 'Hết tim → màn kết quả, lưu kỉ lục + lịch sử', res);
    ok(res.review >= 2, 'Chữ chạm nhầm vào sổ ôn', res);
    await b.shot(out + '/snow-result-' + w + '.png');
    await b.eval(`document.querySelector('#scGames').click(); await new Promise(r=>setTimeout(r,400)); return 1;`);
    const meta = await b.eval(`const c = document.querySelector('[data-action="snowcatch"]').closest('.game-card'); return c.textContent`);
    ok(/Kỉ lục của em: [1-9]/.test(meta), 'Thẻ trò chơi hiện kỉ lục mới', meta);

    // 6. Dừng giữa chừng bằng ✕ → vòng lặp dừng, không lỗi
    await b.eval(`startSnowCatch(); await new Promise(r=>setTimeout(r,200));
      document.querySelector('#scGo').click(); await new Promise(r=>setTimeout(r,600));
      document.querySelector('.sc-game [data-close-modal]').click();
      document.querySelector('#quitGo')?.click();
      await new Promise(r=>setTimeout(r,300)); return 1;`);
    ok(await b.eval(`return document.querySelector('#modalRoot').hidden && !snowCatchState()`), 'Bấm ✕ thoát trò, không để lại vòng lặp');

    // 7. Nền thống nhất: mọi trang cùng bầu trời (app-shell trong suốt, body::before cố định)
    const bg = await b.eval(`const out = {}; for (const v of ['home','roadmap','games','shelf','review','badges','garden','profile','settings']) { go(v); await new Promise(r=>setTimeout(r,250));
      out[v] = getComputedStyle(document.querySelector('.app-shell')).backgroundImage + ' | ' + getComputedStyle(document.querySelector('.app-shell')).backgroundColor; }
      out.sky = getComputedStyle(document.body, '::before').backgroundImage.slice(0, 60); out.pos = getComputedStyle(document.body, '::before').position; return out;`);
    const vals = Object.entries(bg).filter(([k]) => !['sky', 'pos'].includes(k)).map(([, v]) => v);
    ok(new Set(vals).size === 1 && /none \| rgba\(0, 0, 0, 0\)/.test(vals[0]), 'Mọi trang dùng chung một nền (không đổi màu khi chuyển trang)', bg);
    ok(bg.pos === 'fixed' && /gradient/.test(bg.sky), 'Bầu trời cố định phía sau', bg);
    // 8. Tuyết đang rơi (canvas đổi theo thời gian)
    const snow = await b.eval(`const c = document.querySelector('.noel-snow'); if (!c) return { canvas: false };
      const a = c.toDataURL().length; await new Promise(r=>setTimeout(r,400)); const d = c.toDataURL(); return { canvas: true, moving: d.length !== a || d !== c.toDataURL() }`);
    ok(snow.canvas, 'Có lớp tuyết rơi', snow);
    const snow2 = await b.eval(`const c = document.querySelector('.noel-snow'); const d1 = c.toDataURL(); await new Promise(r=>setTimeout(r,300)); return d1 !== c.toDataURL();`);
    ok(snow2, 'Tuyết chuyển động (khung hình thay đổi)');
    // 9. Giảm chuyển động → tuyết đứng yên
    const calm = await b.eval(`go('settings'); await new Promise(r=>setTimeout(r,300)); const sw = document.querySelector('[data-set-bool="calm"]'); sw.click(); await new Promise(r=>setTimeout(r,250));
      const c = document.querySelector('.noel-snow'); const d1 = c.toDataURL(); await new Promise(r=>setTimeout(r,350)); const same = d1 === c.toDataURL();
      const cls = document.body.classList.contains('calm'); sw.click(); await new Promise(r=>setTimeout(r,300)); const d2 = c.toDataURL(); await new Promise(r=>setTimeout(r,300)); return { cls, same, movingAgain: d2 !== c.toDataURL(), calmAfter: document.body.classList.contains('calm') };`);
    ok(calm.cls && calm.same && calm.movingAgain && !calm.calmAfter, 'Công tắc Giảm chuyển động: tuyết đứng yên ngay, tắt thì rơi lại', calm);
    // 10. Tắt Noel → về giao diện thường, bật lại được
    const off = await b.eval(`setTestSeason('none'); render(); await new Promise(r=>setTimeout(r,200)); const r1 = { noel: noelOn(), snow: !!document.querySelector('.noel-snow:not(.cd-fx)'), meta: document.querySelector('meta[name=theme-color]').content, praise: PRAISE.length };
      setTestSeason('noel'); render(); await new Promise(r=>setTimeout(r,200)); return Object.assign(r1, { back: document.documentElement.classList.contains('noel'), meta2: document.querySelector('meta[name=theme-color]').content, praise2: PRAISE.length });`);
    ok(!off.noel && !off.snow && off.meta === '#235b41' && off.back && off.meta2 === '#b31c35' && off.praise2 === off.praise + 3, 'Chuyển từ Noel về Vườn xanh và trở lại đúng (tuyết, màu thanh trạng thái, lời khen)', off);
    await b.eval(`setTestSeason('none'); go('games'); await new Promise(r=>setTimeout(r,300)); return 1;`);
    await b.shot(out + '/noel-off-games-' + w + '.png');
    const night = await b.eval(`setTestSeason('noel'); db.settings.theme = 'night'; render(); await new Promise(r=>setTimeout(r,300)); return { theme: document.documentElement.dataset.theme, meta: document.querySelector('meta[name=theme-color]').content };`);
    ok(night.theme === 'night' && night.meta === '#3b0c1a', 'Chế độ đêm + Noel: nền đỏ rượu vang, thanh trạng thái cùng màu', night);
    await b.shot(out + '/night-games-' + w + '.png');
    await b.eval(`db.settings.theme = 'day'; render(); go('home'); await new Promise(r=>setTimeout(r,300)); document.querySelector('#mobileMenu').click(); await new Promise(r=>setTimeout(r,400)); return 1;`);
    await b.shot(out + '/sidebar-' + w + '.png');
    await b.eval(`closeSidebar(); document.querySelector('[data-start]').click(); await new Promise(r=>setTimeout(r,500)); return 1;`);
    await b.shot(out + '/lesson-intro-' + w + '.png');
    console.log('errors:', JSON.stringify(b.errors), 'console:', JSON.stringify(b.consoleMsgs.slice(0, 6)));
    ok(!b.errors.length, 'Không có lỗi JS', b.errors);
  } catch (e) { fail++; console.log('  ✗ LỖI KỊCH BẢN: ' + e.message); }
  finally { await b.close(); }
  console.log((fail ? '❌ ' : '✅ ') + pass + ' đạt, ' + fail + ' lỗi (' + w + 'px)');
  process.exitCode = fail ? 1 : 0;
})();
