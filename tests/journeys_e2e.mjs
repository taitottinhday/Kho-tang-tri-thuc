// Kiểm thử hai trò “Đại úy Vịt triệu tập” và “Lái đò tri thức”.
// node tests/journeys_e2e.mjs [rộng cao]  [--game=postal|ferry] [--students=36] [--quick]
// Ảnh chụp theo mốc thời gian nằm ở qa-results/journeys/.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { launch } = require('./cdp_driver.js');
const numbers = process.argv.slice(2).filter(value => /^\d+$/.test(value)).map(Number);
const [width, height] = [numbers[0] || 1366, numbers[1] || 860];
const option = (name, fallback) => (process.argv.find(value => value.startsWith('--' + name + '=')) || '=' + fallback).split('=')[1];
const only = option('game', '');
const size = Number(option('students', 36));
const quick = process.argv.includes('--quick');
const calm = process.argv.includes('--reduced'); // máy bật “giảm chuyển động”
const site = option('site', ''); // kiểm tra bản đã triển khai: --site=https://…/ (API vẫn được giả lập, không đụng dữ liệu thật)
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../qa-results/journeys/' + width + (size === 36 ? '' : '-' + size + 'hs') + (calm ? '-giam-chuyen-dong' : '') + (site ? '-trang-that' : ''));
fs.mkdirSync(out, { recursive: true });

const FAMILY = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi'];
const GIRLS = ['Minh Anh', 'Ngọc Mai', 'Thu Hà', 'Khánh Linh', 'Diệu Linh', 'Bảo Ngọc', 'Mỹ Duyên', 'Gia Hân', 'Thùy Trang', 'Phương Thảo', 'Yến Nhi', 'Cẩm Tú', 'Hồng Nhung', 'Quỳnh Chi', 'Thanh Tâm', 'Kim Ngân', 'Bích Diệp', 'Tường Vy', 'Hải Yến', 'Ánh Dương', 'Ngọc Trâm', 'Lan Phương', 'Thục Uyên', 'Mai Phương', 'Hà My', 'Thảo Chi', 'Bảo Châu', 'Khả Vy', 'Nhã Phương', 'Tuệ Lâm'];
const BOYS = ['Gia Bảo', 'Minh Khang', 'Đức Anh', 'Quốc Huy', 'Hải Nam', 'Thành Long', 'Hoàng Long', 'Tiến Dũng', 'Nhật Minh', 'Trung Kiên', 'Anh Khoa', 'Gia Huy', 'Minh Quân', 'Đức Duy', 'Tuấn Kiệt', 'Bảo Lâm', 'Phúc Lâm', 'Quang Huy', 'Thành Đạt', 'Hữu Phúc', 'Văn Vinh', 'Đăng Khôi', 'Nam Phong', 'Anh Tuấn', 'Việt Hoàng', 'Sơn Tùng', 'Chí Thanh', 'Bá Hưng', 'Công Danh', 'Mạnh Quân'];
const people = (list, count, offset) => Array.from({ length: count }, (_, i) => FAMILY[(i + offset) % FAMILY.length] + ' ' + list[i % list.length] + (i >= list.length ? ' B' : ''));
const girls = people(GIRLS, Math.ceil(size / 2), 0);
const boys = people(BOYS, Math.floor(size / 2), 3);

/* những hành động bắt buộc phải thấy, theo đúng thứ tự trong video mẫu */
const STORY = {
  postal: [/Tuýt tuýt! Kiểm tra bài cũ đây!/, /^CỐC CỐC!$/, /Đừng gọi con|Không phải con|đang ôn bài/, /nhầm nhà|chưa phải nhà này/, /Hừm… nhà này à\?/, /hình như nhà bên kia/, /^CỐC CỐC CỐC!$/, /Dạ… em đây ạ…/, /Có giấy triệu tập!/],
  ferry: [/Lái Đò Tri Thức/, /^3$/, /^2$/, /^1$/, /^Khởi hành!$/, /GIÓ TO!/, /Ối, nón của (thầy|cô)!/, /ĐÙNG!/, /CÁ CHÉP VƯỢT SÓNG!/, /(Thầy|Cô) ơi cứu em!/, /SÓNG LỚN!/, /ẦM!/, /Qua cơn bão rồi/, /nón của (thầy|cô) bay về/, /CẬP BẾN!/, /Còn 3 bạn!/, /Ai còn trên đò\?/, /ơi, tới bờ rồi con!/, /Dạ… em dậy rồi ạ!/]
};

const browser = await launch(width, height);
let passed = 0;
const check = (condition, message, details) => {
  assert.ok(condition, message + (details === undefined ? '' : ': ' + JSON.stringify(details).slice(0, 600)));
  passed++;
  console.log('  ✓ ' + message);
};
const until = (expression, timeout = 8000) => browser.eval(`for(let i=0;i<${Math.ceil(timeout / 100)};i++){if(${expression})return true;await new Promise(r=>setTimeout(r,100))}return false`);
const run = code => browser.eval(code + ';return 1');
const shown = `document.querySelector('#resultOverlay').classList.contains('is-shown')`;
const shot = name => browser.shot(path.join(out, name + '.png'));
/* chụp riêng sân khấu ở đúng độ phân giải để soi được từng chi tiết */
const frameShot = async name => {
  const clip = await browser.eval('const r=document.querySelector("#callerCinema").getBoundingClientRect(); return { x:r.x, y:r.y+scrollY, width:r.width, height:r.height, scale:1 }');
  const image = await browser.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(image.data, 'base64'));
};
const setSelect = (id, value) => run(`document.querySelector('#${id}').value='${value}';document.querySelector('#${id}').dispatchEvent(new Event('change'))`);
const brokenArt = () => browser.eval(`return [...document.querySelectorAll('#callerCinema .journey-scene img, #resultNames img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)`);

try {
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      let body = null;
      if (url.includes('/api/status')) body = { storage: 'file' };
      else if (url.includes('/api/login')) body = { token: 'journeys-test' };
      else if (url.includes('/api/me')) body = { user: { role: 'admin', username: 'admin', name: 'Quản trị viên' } };
      else if (url.includes('/api/classes')) body = { classes: [] };
      else if (url.includes('/api/students')) body = { students: [] };
      else if (url.includes('/api/docs')) body = { documents: [] };
      else if (url.includes('/api/questions')) body = { questions: [] };
      if (body) return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return realFetch(input, init);
    };
  ` });
  if (calm) await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await browser.goto(site + 'giao-vien/index.html', 1200);
  // trang Gọi tên do một module đăng ký: chờ tải xong hẳn rồi mới đăng nhập (máy bận thì 1,2 giây chưa đủ)
  check(await until(`document.readyState==='complete'`, 30000), 'Trang giáo viên tải xong');
  await run(`document.querySelector('#loginPass').value='x';document.querySelector('#loginForm').requestSubmit()`);
  check(await until(`!document.querySelector('#app').hidden`), 'Vào trang giáo viên');
  await run(`location.hash='goi-ten'`);
  check(await until(`document.querySelectorAll('.caller-game-card').length===6`), 'Đủ 6 thẻ trò chơi');
  await run(`for (const [id, list] of [['girlsNames', ${JSON.stringify(girls.join('\n'))}], ['boysNames', ${JSON.stringify(boys.join('\n'))}]]) { const box=document.querySelector('#'+id); box.value=list; box.dispatchEvent(new Event('input')); }`);
  await run(`const s=document.querySelector('#soundToggle'); if(!s.checked) s.click()`);
  await browser.sleep(500);
  await run(`document.querySelector('.postal-card').scrollIntoView({block:'center'})`);
  await shot('0-the-tro-choi');

  for (const game of ['postal', 'ferry'].filter(key => !only || only === key)) {
    console.log('\n== ' + game);
    await run(`document.querySelector('#refreshRound').click()`); // vòng mới cho từng trò (lớp ít bạn không bị hết lượt)
    await run(`document.querySelector('[data-open-game="${game}"]').click()`);
    check(await until(`document.querySelector('#callerCinema .journey-scene')`), 'Mở sân khấu');
    await run(`document.querySelector('#gameStage').scrollIntoView({block:'center'})`);
    await browser.sleep(1500);
    await frameShot(game + '-00-cho');
    check((await brokenArt()).length === 0, 'Tranh nạp đủ ở màn chờ', await brokenArt());
    const idle = await browser.eval(`return { houses: document.querySelectorAll('.vit-house').length, kids: document.querySelectorAll('.do-kid').length, page: document.documentElement.scrollWidth, view: innerWidth }`);
    check(game === 'postal' ? idle.houses === size : idle.kids === Math.min(size, 60), game === 'postal' ? 'Mỗi bạn một ngôi nhà' : 'Cả lớp ngồi trên đò', idle);
    check(idle.page <= idle.view + 1, 'Không cuộn ngang', idle);

    /* một lượt gọi đầy đủ, ghi lại mọi lời thoại/chữ to xuất hiện */
    await setSelect('liveCount', 1);
    await setSelect('liveSpeed', 60);
    await run(`window.__said=[]; window.__eye?.disconnect(); window.__eye=new MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1){const t=n.textContent.trim().replace(/\\s+/g,' ');if(t)window.__said.push(t)}}); window.__eye.observe(document.querySelector('#callerCinema .journey-scene'),{childList:true,subtree:true})`);
    await run(`document.querySelector('#startStory').click()`);
    const chosen = await browser.eval(`return JSON.parse(localStorage.getItem('vuonchu.callerGames.v1')).daily.pending.students.map(s=>s.name)`);
    const started = Date.now();
    let frame = 0, early = false;
    while (Date.now() - started < 90000) {
      if (await browser.eval(`return ${shown}`)) break;
      if (!quick) await frameShot(game + '-' + String(++frame).padStart(2, '0') + '-' + Math.round((Date.now() - started) / 1000) + 's');
      early = early || await browser.eval(`return !${shown} && [...document.querySelectorAll('.caller-student.is-done .student-name')].some(n=>${JSON.stringify(chosen)}.includes(n.title))`);
      await browser.sleep(quick ? 500 : game === 'ferry' ? 330 : 1000);
    }
    const seconds = Math.round((Date.now() - started) / 1000);
    check(await until(shown, 4000), 'Diễn xong và hiện kết quả sau ' + seconds + ' giây');
    check(await browser.eval(`return document.querySelectorAll('.do-banner').length`) === 0, 'Chữ to tự ẩn, không còn treo trên màn');
    check(!early, 'Không đánh dấu bạn được gọi trước khi công bố');
    await browser.sleep(1100);
    await frameShot(game + '-90-ket-qua');
    const said = await browser.eval(`return window.__said`);
    fs.writeFileSync(path.join(out, game + '-loi-thoai.txt'), said.join('\n'));
    let cursor = 0;
    const missing = [];
    for (const step of STORY[game]) {
      const at = said.findIndex((text, index) => index >= cursor && step.test(text));
      if (at < 0) missing.push(String(step)); else cursor = at;
    }
    check(missing.length === 0, 'Đủ ' + STORY[game].length + ' hành động đúng thứ tự', { missing, said });
    const result = await browser.eval(`return { names:[...document.querySelectorAll('#resultNames .caller-result-person b')].map(n=>n.textContent), text: document.querySelector('.caller-result-card').innerText, history: JSON.parse(localStorage.getItem('vuonchu.callerGames.v1')).daily }`);
    check(JSON.stringify(result.names) === JSON.stringify(chosen) && result.history.pending === null, 'Công bố đúng bạn đã chọn lúc bắt đầu', { chosen, result: result.names });
    check(game === 'postal' ? /GIẤY TRIỆU TẬP/i.test(result.text) && /Lên bảng trả bài ngay!/.test(result.text) : /CẬP BẾN TRI THỨC/i.test(result.text) && /đã đưa em sang tận bờ/.test(result.text), 'Màn kết quả đúng chủ đề', result.text);
    const words = await browser.eval(`return { buttons: [document.querySelector('#playAgain').textContent, document.querySelector('#resultHome').textContent], lead: getComputedStyle(document.querySelector('#resultHeading'), '::after').content, seal: getComputedStyle(document.querySelector('.caller-result-card'), '::after').content }`);
    check(JSON.stringify(words.buttons) === JSON.stringify(game === 'postal' ? ['Gọi tiếp', 'Về xóm'] : ['Chuyến đò mới', 'Sửa danh sách']) && (game !== 'postal' || (/Triệu tập em/.test(words.lead) && /TRIỆU TẬP/.test(words.seal))), 'Chữ trên thẻ và hai nút đúng như video', words);
    const card = await browser.eval(`const c=document.querySelector('.caller-result-card').getBoundingClientRect(), s=document.querySelector('#resultOverlay').getBoundingClientRect(), b=document.querySelector('#resultHome').getBoundingClientRect(); return { inside: c.left>=s.left-1 && c.right<=s.right+1, button: b.bottom<=s.bottom+1, cardH: c.height, stageH: s.height }`);
    check(card.inside && card.button, 'Thẻ kết quả và nút bấm nằm gọn trong sân khấu', card);
    check((await brokenArt()).length === 0, 'Không có tranh hỏng', await brokenArt());

    /* gọi tiếp 3 bạn, bạn đã gọi không bị gọi lại */
    await setSelect('liveCount', 3);
    await run(`document.querySelector('#playAgain').click()`);
    const trio = await browser.eval(`return JSON.parse(localStorage.getItem('vuonchu.callerGames.v1')).daily.pending.students.map(s=>s.name)`);
    check(trio.length === 3 && !trio.some(name => chosen.includes(name)), 'Gọi 3 bạn, không trùng bạn đã gọi', { trio, chosen });
    if (game === 'ferry') {
      check(await until(`document.querySelectorAll('.do-kid.is-spot').length===3`, 60000), 'Ba bạn ngủ quên cùng được chiếu sáng');
      await browser.sleep(500);
      await frameShot(game + '-91-ba-ban-ngu');
    }
    check(await until(shown, 120000), 'Lượt 3 bạn diễn xong');
    await browser.sleep(2200); // chờ tên hiện đủ từng chữ và con dấu đóng xong
    await frameShot(game + '-92-ba-ban');
    const three = await browser.eval(`const card=document.querySelector('.caller-result-card').getBoundingClientRect(); const items=[...document.querySelectorAll('#resultNames .caller-result-person b')].map(n=>n.getBoundingClientRect()); const exit=document.querySelector('#resultHome').getBoundingClientRect(); const el=document.querySelector('.caller-result-card'); return { count: items.length, inside: items.every(r=>r.top>=card.top-1&&r.bottom<=card.bottom+1&&r.left>=card.left-1&&r.right<=card.right+1), exit: exit.bottom<=card.bottom+1, scroll: el.scrollHeight-el.clientHeight }`);
    check(three.count === 3 && three.inside && three.exit && three.scroll <= 2, 'Hiện đủ 3 tên, không phải cuộn', three);

    /* “Hiện kết quả” giữa chừng: cắt ngay, sân khấu trở về yên, không còn gì chạy tiếp */
    await setSelect('liveCount', 1);
    await run(`document.querySelector('#playAgain').click()`);
    const skipped = await browser.eval(`return JSON.parse(localStorage.getItem('vuonchu.callerGames.v1')).daily.pending.students[0].name`);
    await browser.sleep(game === 'ferry' ? 4300 : 5200);
    await run(`document.querySelector('#skipStory').click()`);
    check(await until(shown, 3000), 'Bấm “Hiện kết quả” giữa chừng là ra ngay');
    await browser.sleep(2600);
    const after = await browser.eval(`return { name: document.querySelector('#resultNames b').textContent, bubbles: document.querySelectorAll('.vit-bubble,.do-bubble,.vit-knock,.do-walker,.do-wave,.do-banner').length }`);
    check(after.name === skipped && after.bubbles === 0, 'Đúng tên đã chọn, không còn hiệu ứng chạy sót', after);

    /* nút phụ trên thẻ kết quả, rồi rời trò */
    await run(`document.querySelector('#resultHome').click()`);
    if (game === 'postal') {
      check(await until(`document.querySelector('#resultOverlay').hidden && document.querySelector('.vit-scene')?.dataset.phase === 'idle' && !document.querySelector('#startStory').disabled && document.querySelector('#callerHome').hidden`), '“Về xóm”: đóng giấy, ở lại xóm, sẵn sàng gọi tiếp');
      check(await browser.eval(`return document.querySelectorAll('.vit-house').length === ${size} && !document.querySelector('.vit-kid, .vit-bubble, .vit-knock')`), 'Xóm trở lại yên tĩnh, đủ nhà');
      await run(`document.querySelector('#backHome').click()`);
    } else {
      await browser.sleep(900);
      const list = await browser.eval(`const card = document.querySelector('.caller-setup-card').getBoundingClientRect(); return { top: Math.round(card.top), view: innerHeight }`);
      check(list.top > -80 && list.top < list.view * .6, '“Sửa danh sách”: đưa thẳng tới chỗ sửa tên', list);
    }
    check(await until(`!document.querySelector('#callerHome').hidden && !document.querySelector('.journey-scene, .do-tools')`), 'Về màn chọn trò, dọn sạch sân khấu');
  }

  if (!only || only === 'ferry') {
    await run(`document.querySelector('[data-open-game="ferry"]').click()`);
    await until(`document.querySelector('.do-tools button')`);
    await run(`document.querySelector('#gameStage').scrollIntoView({block:'center'})`); // như người dùng: sân khấu phải đang ở trong khung nhìn
    await browser.sleep(250);
    const before = await browser.eval(`return document.querySelector('.do-pilot').src`);
    await run(`document.querySelector('.do-tools button').click()`);
    const switched = await browser.eval(`return { src: document.querySelector('.do-pilot').src, label: document.querySelector('.do-tools button').textContent }`);
    check(switched.src !== before && /Người lái đò: (Cô|Thầy)/.test(switched.label), 'Đổi được người lái đò Thầy ↔ Cô', switched);
    const hit = await browser.eval(`const b=document.querySelector('.do-tools button').getBoundingClientRect(); const e=document.elementFromPoint(b.x+b.width/2, b.y+b.height/2); return e && !!e.closest('.do-tools')`);
    check(hit, 'Nút chọn người lái bấm được (không bị lớp khác che)');
    await browser.sleep(700);
    await frameShot('ferry-93-co-lai-do');
  }
  const missingFiles = browser.consoleMsgs.filter(message => /404|Failed to load/.test(message) && !/favicon|\/api\//.test(message));
  check(missingFiles.length === 0, 'Không thiếu tệp nào', missingFiles);
  check(browser.errors.length === 0, 'Không lỗi JavaScript', browser.errors);
  console.log('\n' + passed + ' kiểm tra đạt (' + width + '×' + height + ', ' + size + ' học sinh). Ảnh: ' + out);
} finally {
  await browser.close();
}
