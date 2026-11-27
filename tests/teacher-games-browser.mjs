import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { launch } = require('./cdp_driver.js');
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../qa-results/teacher-games');
fs.mkdirSync(out, { recursive: true });

const browser = await launch(1440, 1000);
const check = (condition, message, details) => {
  assert.ok(condition, message + (details ? ': ' + JSON.stringify(details) : ''));
  console.log('  ✓ ' + message);
};
const until = async (expression, timeout = 8000) => browser.eval(`for(let i=0;i<${Math.ceil(timeout / 100)};i++){if(${expression})return true;await new Promise(r=>setTimeout(r,100))}return false`);
const record = process.argv.includes('--record');
async function captureMotion(name, pose, frames = 24) {
  check(await until(pose, 8000), name + ' plays its new movement');
  await browser.sleep(230);
  await browser.shot(path.join(out, name + '-motion.png'));
  if (!record) return;
  const clip = await browser.eval('const { x, y, width, height } = document.querySelector("#callerCinema").getBoundingClientRect(); return { x, y, width, height, scale: .63 }');
  const folder = path.join(out, name + '-frames');
  fs.mkdirSync(folder, { recursive: true });
  for (let index = 0; index < frames; index++) {
    const began = performance.now();
    const image = await browser.send('Page.captureScreenshot', { format: 'jpeg', quality: 78, clip, captureBeyondViewport: true });
    fs.writeFileSync(path.join(folder, ('000' + index).slice(-3) + '.jpg'), Buffer.from(image.data, 'base64'));
    await browser.sleep(Math.max(0, 1000 / 15 - (performance.now() - began)));
  }
}
try {
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      let body = null;
      if (url.includes('/api/status')) body = { storage: 'file' };
      else if (url.includes('/api/login')) body = { token: 'teacher-games-browser-test' };
      else if (url.includes('/api/classes')) body = { classes: [] };
      else if (url.includes('/api/students')) body = { students: [] };
      else if (url.includes('/api/docs')) body = { documents: [] };
      else if (url.includes('/api/questions')) body = { questions: [] };
      if (body) return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      return realFetch(input, init);
    };
  ` });
  await browser.goto('giao-vien/index.html', 1200);
  await browser.eval(`document.querySelector('#loginPass').value='browser-test';document.querySelector('#loginForm').requestSubmit();return 1`);
  check(await until(`!document.querySelector('#app').hidden`), 'Teacher screen opens with a local test session');
  await browser.eval(`location.hash='goi-ten';return 1`);
  check(await until(`document.querySelectorAll('.caller-game-card').length===3`), 'Three game cards render');
  await browser.shot(path.join(out, 'home.png'));

  const girls = Array.from({ length: 23 }, (_, index) => `Nguyễn Ngọc An ${index + 1}`).join('\n');
  const boys = Array.from({ length: 22 }, (_, index) => `Trần Minh Khang ${index + 1}`).join('\n');
  await browser.eval(`document.querySelector('#girlsNames').value=${JSON.stringify(girls)};document.querySelector('#girlsNames').dispatchEvent(new Event('input'));document.querySelector('#boysNames').value=${JSON.stringify(boys)};document.querySelector('#boysNames').dispatchEvent(new Event('input'));return 1`);
  check(await browser.eval(`return document.querySelector('#allCount').textContent==='45'`), 'The two lists merge into 45 students');
  const selectedByGame = {};

  for (const [key, name, image] of [
    ['prince', 'Hoàng tử cưỡi ngựa', 'prince'],
    ['penalty', 'Sút phạt đền', 'penalty'],
    ['detective', 'Thám tử tìm nghi phạm', 'detective']
  ]) {
    await browser.eval(`document.querySelector('[data-open-game="${key}"]').click();return 1`);
    check(await until(`document.querySelector('#playGameName').textContent===${JSON.stringify(name)}`), name + ' opens');
    check(await until(`document.querySelectorAll('.caller-student').length>0`), name + ' lays out the class roster');
    const geometry = await browser.eval(`const tiles=[...document.querySelectorAll('.caller-student')];let overlaps=0;for(let i=0;i<tiles.length;i++){const a=tiles[i].getBoundingClientRect();for(let j=i+1;j<tiles.length;j++){const b=tiles[j].getBoundingClientRect();if(a.width&&b.width&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)overlaps++}}return {count:tiles.length,overlaps,canvas:!!document.querySelector('.caller-pixi-canvas'),fallback:document.querySelector('#gameStage').classList.contains('is-css-fallback')}`);
    check(geometry.count === (key === 'prince' ? 23 : key === 'penalty' ? 22 : 45) && geometry.overlaps === 0, name + ' has non-overlapping student cards', geometry);
    await browser.sleep(1250);
    await browser.shot(path.join(out, image + '.png'));
    if (key !== 'detective') {
      const requested = key === 'prince' ? 1 : 2;
      await browser.eval(`document.querySelector('#liveCount').value='${requested}';document.querySelector('#liveCount').dispatchEvent(new Event('change'));document.querySelector('#liveSpeed').value='10';document.querySelector('#liveSpeed').dispatchEvent(new Event('change'));document.querySelector('#startStory').click();return 1`);
      const pose = key === 'prince'
        ? 'document.querySelector("#callerCinema .caller-performer--prince[data-motion=run]")'
        : 'document.querySelector("#callerCinema .caller-performer--striker[data-motion=run]")';
      await captureMotion(image, pose, key === 'penalty' ? 40 : 26);
      check(await browser.eval('return !document.querySelector("#gameStage").classList.contains("is-running") || !document.querySelector(".caller-student.is-done")'), name + ' does not mark the selected name before the result');
      check(await until(`document.querySelector('#resultOverlay').classList.contains('is-shown')`, 26000), name + ' story reaches the reveal');
      selectedByGame[key] = await browser.eval(`return [...document.querySelectorAll('.caller-result-person b')].map(item=>item.textContent)`);
      check(selectedByGame[key].length === requested, name + ' completes a ' + requested + '-student turn', selectedByGame[key]);
      await browser.sleep(750);
      await browser.shot(path.join(out, image + '-result.png'));
      await browser.eval(`document.querySelector('#backHome').click();return 1`);
    }
  }

  await browser.eval(`document.querySelector('#liveCount').value='3';document.querySelector('#liveCount').dispatchEvent(new Event('change'));document.querySelector('#liveSpeed').value='10';document.querySelector('#liveSpeed').dispatchEvent(new Event('change'));document.querySelector('#startStory').click();return 1`);
  await captureMotion('detective', 'document.querySelector("#callerCinema .caller-performer--detective[data-motion=run]")', 32);
  check(await until('!document.querySelector(".caller-cinema-evidence").hidden'), 'Detective moves from the entrance into the magnifier and clue sequence');
  check(await until(`document.querySelector('#resultOverlay').classList.contains('is-shown')`, 26000), 'Detective story reaches the reveal');
  const result = await browser.eval(`return {winners:[...document.querySelectorAll('.caller-result-person b')].map(item=>item.textContent),history:document.querySelector('#todayCount').textContent,round:document.querySelector('#roundProgress').textContent}`);
  check(result.winners.length === 3 && new Set(result.winners).size === 3, 'Three different students are revealed', result);
  selectedByGame.detective = result.winners;
  const allSelected = Object.values(selectedByGame).flat();
  check(new Set(allSelected).size === allSelected.length, 'All three games share one no-repeat roster across the session', allSelected);
  await browser.sleep(750);
  await browser.shot(path.join(out, 'detective-result.png'));
  check(await browser.eval(`return document.querySelectorAll('.caller-student.is-eliminated').length>0`), 'Detective clues clear innocent files');
  await browser.eval(`document.querySelector('#backHome').click();document.querySelector('[data-open-game="prince"]').click();return 1`);
  check(await until(`document.querySelector('#playGameName').textContent==='Hoàng tử cưỡi ngựa'`), 'Switching games preserves the shared no-repeat round');
  const girlsCalled = allSelected.filter(name => name.startsWith('Nguyễn Ngọc An ')).length;
  const crossStats = await browser.eval(`return {remaining:Number(document.querySelector('#remainingCount').textContent),done:document.querySelectorAll('.caller-student.is-done').length}`);
  check(crossStats.remaining === 23 - girlsCalled && crossStats.done === girlsCalled, 'A student called by another game is skipped by the princess game', { expectedGirlsCalled: girlsCalled, ...crossStats });
  await browser.eval(`document.querySelector('#roundProgress').click();return 1`);
  check(await browser.eval(`return Number(document.querySelector('#remainingCount').textContent)===23 && document.querySelector('#todayCount').textContent.includes('6 lượt')`), 'Refreshing a round restores eligibility while keeping today’s history');
  await browser.eval(`document.querySelector('#backHome').click();return 1`);
  await browser.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await browser.eval(`document.querySelector('[data-open-game="detective"]').click();return 1`);
  check(await until(`document.querySelectorAll('.caller-student').length===45`), 'Mobile layout displays all 45 students');
  await browser.sleep(1250);
  const mobile = await browser.eval(`const tiles=[...document.querySelectorAll('.caller-student')];let overlaps=0;for(let i=0;i<tiles.length;i++){const a=tiles[i].getBoundingClientRect();for(let j=i+1;j<tiles.length;j++){const b=tiles[j].getBoundingClientRect();if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)overlaps++}}return {viewport:innerWidth,page:document.documentElement.scrollWidth,count:tiles.length,overlaps,scroll:document.querySelector('#nameBoard').scrollHeight,visible:document.querySelector('#nameBoard').clientHeight}`);
  check(mobile.page <= mobile.viewport && mobile.count === 45 && mobile.overlaps === 0, 'Mobile 45-name board stays within the screen without overlapping', mobile);
  const mobileStage = await browser.eval('const frame=document.querySelector("#gameStage").getBoundingClientRect(); const cinema=document.querySelector("#callerCinema").getBoundingClientRect(); const dialogue=document.querySelector("#dialogueBox").getBoundingClientRect(); return { frame:frame.right, cinema:cinema.right, dialogue:dialogue.right }');
  check(mobileStage.cinema <= mobileStage.frame + 1 && mobileStage.dialogue <= mobileStage.frame, 'Mobile camera and dialogue fit inside the frame', mobileStage);
  await browser.shot(path.join(out, 'detective-mobile-45.png'));
  check(browser.errors.length === 0, 'No uncaught browser errors', browser.errors);
  console.log('Screenshots: ' + out);
} finally {
  await browser.close();
}
