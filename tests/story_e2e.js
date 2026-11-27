/* node tests/story_e2e.js [rộng] [cao] */
'use strict';
const { launch } = require('./cdp_driver');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const width = Number(process.argv[2] || 390), height = Number(process.argv[3] || 844);
  const browser = await launch(width, height);
  const out = path.join('qa-results', 'vuon-truyen');
  fs.mkdirSync(out, { recursive: true });
  const click = selector => browser.eval('document.querySelector(' + JSON.stringify(selector) + ').click()');
  try {
    await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.testSpeech = { played: [], canceled: 0, speaking: false, pending: false,
        getVoices: () => [{ name: 'Vietnamese mock', lang: 'vi-VN', default: true }],
        resume() {}, speak(utterance) { this.played.push(utterance.text); this.speaking = true; },
        cancel() { this.canceled++; this.speaking = false; }
      };
      Object.defineProperty(window, 'speechSynthesis', { value: window.testSpeech });
      window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    ` });
    await browser.goto('index.html', 2400);
    await browser.eval(`db.onboarded = true; hideWelcome(); closeModal(); S.grade = '2'; db.settings.sound = true; save(); go('stories');`);
    assert.equal(await browser.eval(`return [...document.querySelectorAll('[data-story-start]')].filter(b => b.disabled).length`), 2);
    assert.equal(await browser.eval(`return document.querySelector('.forest-unlock button').disabled`), true);
    await browser.shot(path.join(out, 'map-' + width + '.png'));
    await click('[data-story-start="seed"]');
    async function scene(chapter, index) {
      const actual = await browser.eval(`
        const img = document.querySelector('.forest-stage > img');
        await img.decode();
        return { src:img.getAttribute('src'), width:img.naturalWidth,
          guide:document.querySelector('.forest-dialogue b').textContent,
          within:img.parentElement.getBoundingClientRect().right <= innerWidth,
          errors:Q.items[Q.i].cau.split(' ').filter(word => cleanWord(word) === Q.items[Q.i].tuSai).length };
      `);
      assert.equal(actual.src, 'assets/vuon-truyen/' + chapter + '-' + (index + 1) + '.webp');
      assert.ok(actual.width && actual.guide && actual.within);
      assert.equal(actual.errors, 1);
    }
    const answer = right => browser.eval(`
      const it = Q.items[Q.i];
      [...document.querySelectorAll('[data-tok]')].find(b => (cleanWord(b.textContent) === it.tuSai) === ${right}).click();
      document.querySelector('#plCheck').click();
    `);
    await scene('seed', 0);
    await browser.shot(path.join(out, 'checkpoint-' + width + '.png'));
    await answer(false);
    assert.equal(await browser.eval(`return Q.i === 0 && !document.querySelector('.forest-panel').classList.contains('is-open') && document.querySelector('#plCont').textContent.includes('Thử lại')`), true);
    await click('#plCont');
    assert.equal(await browser.eval('return Q.i'), 0);

    for (const chapter of ['seed', 'cloud', 'lantern']) {
      for (let i = 0; i < 3; i++) {
        await scene(chapter, i);
        await answer(true);
        const pass = await browser.eval(`return document.querySelector('.forest-panel.is-open') && !document.querySelector('#plSheet').hidden`);
        assert.equal(pass, true);
        await click('#plCont');
      }
      assert.equal(await browser.eval(`return S.storyProgress[${JSON.stringify(chapter)}].done && !!document.querySelector('.forest-relic')`), true);
      if (chapter === 'lantern') await browser.shot(path.join(out, 'reward-' + width + '.png'));
      await click('#storyNext');
    }
    assert.equal(await browser.eval(`return currentView === 'story-grove' && document.querySelectorAll('.forest-hotspot').length === 3`), true);
    const titles = new Set();
    for (const id of ['seed', 'cloud', 'lantern']) {
      const hotspot = '[data-story-relic="' + id + '"]';
      await click(hotspot);
      assert.equal(await browser.eval(`return document.querySelector('.forest-grove-stage').dataset.discovery`), id);
      const intro = await browser.eval(`return document.querySelector('.forest-reader h2').textContent`);
      titles.add(intro);
      assert.ok(await browser.eval(`return document.querySelector('.forest-reader-back').disabled`));
      const content = new Set();
      for (let page = 1; page <= 3; page++) {
        const storyPage = await browser.eval(`
          const img = document.querySelector('.forest-reader-art'); await img.decode();
          const text = document.querySelector('.forest-reader-text');
          const r = document.querySelector('.forest-reader').getBoundingClientRect();
          return { count:document.querySelector('.forest-reader-count').textContent, reading:text.textContent,
            fits:r.right <= innerWidth && r.left >= 0, hasArt:img.naturalWidth > 0, readFocus:document.activeElement === text.querySelector('h3') };
        `);
        assert.equal(storyPage.count, 'Trang ' + page + ' / 3');
        assert.ok(storyPage.reading.length > 120 && storyPage.fits && storyPage.hasArt && storyPage.readFocus);
        content.add(storyPage.reading);
        if (id === 'lantern' && page === 2) {
          await browser.sleep(320);
          await browser.shot(path.join(out, 'tale-' + width + '.png'));
          await click('.forest-reader-back');
          assert.equal(await browser.eval(`return document.querySelector('.forest-reader-count').textContent`), 'Trang 1 / 3');
          await click('.forest-reader-next');
        }
        await click('.forest-reader-next');
      }
      assert.equal(content.size, 3);
      assert.ok(await browser.eval(`return document.querySelector('#modalRoot').hidden && document.activeElement === document.querySelector(${JSON.stringify(hotspot)})`));
    }
    assert.equal(titles.size, 3);
    await browser.sleep(350);
    await browser.shot(path.join(out, 'discovery-' + width + '.png'));
    assert.equal(await browser.eval('return testSpeech.played.length'), 0);

    // Nút loa đọc theo yêu cầu. Chấm bài hủy luôn câu đọc đã xếp hàng.
    await browser.eval(`startQuiz({ kind:'quick', title:'Kiểm tra giọng đọc', items:[{ loai:'chon', de:'Bé đọc ___ách.', dapAn:'s', luaChon:['s','x'] },
      { loai:'chon', de:'Em rửa ___ay.', dapAn:'t', luaChon:['t','ch'] }] }); document.querySelector('#sayQ').click(); document.querySelector('#sayQ').click();
      document.querySelector('[data-answer="s"]').click(); document.querySelector('#plCheck').click(); document.querySelector('#plCont').click();`);
    await browser.sleep(260);
    assert.deepEqual(await browser.eval('return testSpeech.played'), ['Bé đọc sách.']);
    assert.ok(await browser.eval('return testSpeech.canceled > 0 && Q.i === 1'));
    await browser.goto('index.html', 2100);
    await browser.eval("go('stories');");
    assert.equal(await browser.eval("return document.querySelector('.forest-unlock button').disabled"), false);
    assert.deepEqual(browser.errors, []);
    console.log(width + '×' + height + ': 9 chốt, 3 bảo vật, 3 truyện có tranh, lật trang và trở về khu rừng đều đạt.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
