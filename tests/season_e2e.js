
/* node tests/season_e2e.js [rộng] [cao] */
'use strict';
const { launch } = require('./cdp_driver');
const { buildServer } = require('../server');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function until(browser, expression) {
  for (let i = 0; i < 65; i++) {
    if (await browser.eval('return Boolean(' + expression + ')')) return;
    await browser.sleep(200);
  }
  throw Error('Đợi quá lâu: ' + expression);
}

async function main() {
  const width = Number(process.argv[2] || 390), height = Number(process.argv[3] || 844);
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vuonchu-theme-'));
  const password = 'kiem-thu-canh-nen';
  let server, student, teacher;
  try {
    server = await buildServer({ env: { TEACHER_PASSWORD: password, SESSION_SECRET: 'test-theme-local-only' }, dataDir: testDir });
    const addr = await server.listen(0, '127.0.0.1');
    const base = 'http://127.0.0.1:' + addr.port + '/';
    const endpoint = base + 'api/site-theme';
    assert.deepEqual(await (await fetch(endpoint)).json(), { season: null });
    const unauthenticated = await fetch(endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"season":"tet"}' });
    assert.equal(unauthenticated.status, 401);
    assert.deepEqual(await (await fetch(endpoint)).json(), { season: null });

    student = await launch(width, height);
    await student.goto(base, 2400);
    await until(student, 'window.SeasonCatalog && window.StoryQuest');
    const initial = await student.eval(`
      db.onboarded = true; if (typeof hideWelcome === 'function') hideWelcome(); closeModal(); save();
      const noChoice = () => !document.querySelector('[data-season-pick], [data-set=noel]');
      go('home'); const home = noChoice();
      go('settings'); const settings = noChoice();
      const initial = seasonId();
      window.NOEL_TODAY = '2027-09-25';
      render();
      return { home, settings, initial, after: seasonId() };
    `);
    assert.ok(initial.home && initial.settings);
    assert.equal(initial.initial, initial.after);

    teacher = await launch(width, height);
    await teacher.goto(base + 'giao-vien/#giao-dien', 2200);
    await teacher.eval('document.querySelector("#loginPass").value=' + JSON.stringify(password) + ';document.querySelector("#loginForm").requestSubmit()');
    await until(teacher, 'document.querySelectorAll(".teacher-theme-choice input").length === 7');

    const selected = initial.initial === 'tet' ? 'trungthu' : 'tet';
    await student.eval(`
      startQuiz({ kind:'quick', title:'Bài đang làm', items:[{ loai:'chon', de:'Bé đọc ___ách.', dapAn:'s', luaChon:['s','x'] }] });
      document.querySelector('[data-answer="s"]').click();
      window.openQuiz = Q;
    `);
    const choose = season => teacher.eval('document.querySelector("input[name=season][value=\\"' + season + '\\"]").click()');
    await choose(selected);
    assert.equal(await student.eval('return seasonId()'), initial.initial);
    assert.deepEqual(await (await fetch(endpoint)).json(), { season: null });
    await teacher.eval('document.querySelector(".theme-form").requestSubmit()');
    await until(teacher, 'document.querySelector(".theme-form [role=status]").textContent.includes("Đã công bố")');
    await until(student, 'document.documentElement.dataset.season === ' + JSON.stringify(selected));
    assert.equal(await student.eval(`return Q === openQuiz && Q.i === 0 && document.querySelector('[data-answer="s"]').classList.contains('is-sel')`), true);

    const storage = await teacher.eval('return sessionStorage.getItem("vuonchu.teacherToken")');
    const headers = { Authorization: 'Bearer ' + storage, 'Content-Type': 'application/json' };
    assert.equal((await fetch(endpoint, { method:'PUT', headers, body:'{"season":"invalid"}' })).status, 400);
    for (const season of ['noel','khaigiang','nhagiao','thieunhi','trungthu','none']) {
      const saved = await fetch(endpoint, { method:'PUT', headers, body:JSON.stringify({ season }) });
      assert.equal(saved.status, 200);
      await student.eval('dispatchEvent(new Event("focus"))');
      await until(student, 'document.documentElement.dataset.season === ' + JSON.stringify(season));
      const shown = await student.eval('return { snow: !!document.querySelector(".noel-snow:not(.cd-fx)"), scene: !!document.querySelector(".cd-sky.cd-' + season + '"), fx: !!document.querySelector(".cd-fx") }');
      assert.deepEqual(shown, { snow: season === 'noel', scene: season !== 'noel', fx: season !== 'noel' });
    }
    const out = path.join('qa-results','vuon-truyen'); fs.mkdirSync(out,{ recursive:true });
    await teacher.shot(path.join(out, 'teacher-theme-' + width + '.png'));

    // Mất endpoint tại lúc tải lại vẫn dùng được cảnh đã công bố gần nhất.
    await student.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      const liveFetch = window.fetch;
      window.fetch = (url, ...opts) => url === '/api/site-theme' ? Promise.reject(Error('offline')) : liveFetch(url, ...opts);
    ` });
    await student.goto(base, 2400);
    assert.equal(await student.eval('return seasonId()'), 'none');
    assert.deepEqual(student.errors, []);
    assert.deepEqual(teacher.errors, []);
    console.log(width + '×' + height + ': giáo viên công bố, học sinh tự nhận, giữ bài đang làm và nền khi mất kết nối.');
  } finally {
    if (teacher) await teacher.close();
    if (student) await student.close();
    if (server) await server.close();
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
