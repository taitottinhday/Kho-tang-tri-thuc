// Đo nhịp trò Gọi tên: mỗi câu thoại hiện bao lâu (phải đủ đọc) và cả lượt kéo dài bao lâu. Chạy: node tests/goi_nhip.js
'use strict';
const { launch } = require('./cdp_driver.js');
const { buildServer } = require('../server.js');
const fs = require('fs'), os = require('os'), path = require('path');
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nhip-'));
  const env = { TEACHER_PASSWORD: 'quan-tri-thu-2026', SESSION_SECRET: 'bi-mat-thu-nghiem-0123456789abcdef' };
  const app = await buildServer({ env, dataDir: dir });
  const addr = await app.listen(0, '127.0.0.1');
  const b = await launch(1366, 860);
  const until = (expr, ms) => b.eval(`for (let i=0;i<${Math.ceil((ms || 6000) / 100)};i++){ if (${expr}) return true; await new Promise(r=>setTimeout(r,100)); } return false;`);
  let bad = 0;
  try {
    await b.goto('http://127.0.0.1:' + addr.port + '/giao-vien/', 1500);
    await b.eval(`document.querySelector('#loginUser').value='admin'; document.querySelector('#loginPass').value='${env.TEACHER_PASSWORD}'; document.querySelector('#loginBtn').click(); return 1`);
    await until(`!document.querySelector('#app').hidden`);
    await b.eval(`location.hash='goi-ten'; return 1`);
    await until(`document.querySelector('#girlsNames')`); await b.sleep(800); await until(`document.querySelector('#girlsNames') && document.querySelector('#boysNames')`);
    const girls = Array.from({ length: 18 }, (_, i) => 'Nguyễn Thị Lan ' + (i + 1)).join('\n'), boys = Array.from({ length: 17 }, (_, i) => 'Trần Văn Nam ' + (i + 1)).join('\n');
    // trang Gọi tên có thể vẽ lại một lần sau khi đăng nhập: thử điền lại tới khi đủ tên
    for (let i = 0; i < 20; i++) {
      const done = await b.eval(`const g=document.querySelector('#girlsNames'), m=document.querySelector('#boysNames'); if (!g || !m) return false; g.value=${JSON.stringify(girls)}; m.value=${JSON.stringify(boys)}; g.dispatchEvent(new Event('input')); return document.querySelector('#allCount')?.textContent==='35'`);
      if (done) break;
      await b.sleep(500);
    }
    const only = process.argv[2] ? process.argv[2].split(',') : ['prince', 'penalty', 'detective'];
    const speeds = process.argv[3] ? process.argv[3].split(',').map(Number) : [15, 25, 35];
    for (const speed of speeds) for (const game of only) for (const count of [1, 2]) {
      await b.eval(`document.querySelector('#backHome')?.click(); document.querySelector('#refreshRound')?.click(); document.querySelector('[data-open-game=${game}]').click(); return 1`);
      await until(`!document.querySelector('#callerPlay').hidden && document.querySelectorAll('.caller-student').length`);
      const r = await b.eval(`const s=document.querySelector('#liveSpeed'); s.value='${speed}'; s.dispatchEvent(new Event('change')); const c=document.querySelector('#liveCount'); c.value='${count}'; c.dispatchEvent(new Event('change'));
        const p=document.querySelector('#dialogueText'); const log=[]; let last='', since=performance.now(), t0=performance.now();
        const tick=()=>{ const t=p.textContent; if (t!==last) { const now=performance.now(); if (last) log.push([last, Math.round(now-since)]); last=t; since=now; } };
        const id=setInterval(tick, 30); document.querySelector('#startStory').click();
        for (let i=0;i<1500;i++){ if (document.querySelector('#resultOverlay').classList.contains('is-shown')) break; await new Promise(r=>setTimeout(r,100)); }
        clearInterval(id); tick();
        // gộp các lần chữ đang gõ dần thành một câu: tính từ lúc câu bắt đầu xuất hiện tới lúc bị thay
        const lines=[]; for (const [t,ms] of log) { const prev=lines[lines.length-1]; if (prev && t.startsWith(prev.t.slice(0, Math.max(1, prev.t.length)))) { prev.t=t; prev.ms+=ms; } else lines.push({t,ms}); }
        return { total: Math.round((performance.now()-t0)/1000), lines };`);
      const shortest = r.lines.slice(0, -1).reduce((m, l) => Math.min(m, l.ms / Math.max(1, Array.from(l.t).length)), Infinity);
      const tooFast = r.lines.slice(0, -1).filter((l, i) => l.ms < 2400 && !r.lines[i + 1].t.startsWith(l.t));
      if (tooFast.length) { bad++; console.log(JSON.stringify(r.lines.map(l => [l.t.slice(0, 50), l.ms]))); }
      console.log(`${game.padEnd(9)} ${speed}s ${count} bạn → ${r.total}s, ${r.lines.length} câu, câu ngắn nhất ${Math.round(shortest)}ms/chữ` + (tooFast.length ? '  ⚠ quá nhanh: ' + tooFast.map(l => `"${l.t.slice(0, 40)}" ${l.ms}ms`).join(' | ') : ''));
      await b.eval(`document.querySelector('#resultHome').click(); return 1`);
    }
  } finally { await b.close(); await app.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  console.log(bad ? '\n⚠ ' + bad + ' lượt có câu thoại đổi quá nhanh' : '\n✓ Mọi câu thoại đều đứng đủ lâu để đọc');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
