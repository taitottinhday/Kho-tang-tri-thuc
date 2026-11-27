/* node tests/story_e2e.js [rộng] [cao] */
'use strict';
const { launch } = require('./cdp_driver');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const width = Number(process.argv[2] || 390), height = Number(process.argv[3] || 844);
  const browser = await launch(width, height);
  const out = path.join('qa-results', 'vuon-truyen-canh-dong');
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
    await browser.eval(`db.onboarded = true; if (typeof hideWelcome === 'function') hideWelcome(); closeModal(); db.settings.sound = true; save(); go('stories');`);
    const routeIds = await browser.eval(`return [...document.querySelectorAll('[data-story-route]')].map(button => button.dataset.storyRoute)`);
    assert.deepEqual(routeIds, ['rabbit','football','royal']);
    const invalid = await browser.eval(`
      return STORY_ROUTES.flatMap(route => route.chapters.flatMap(chapter => chapter.scenes.filter(scene =>
        [scene.short, scene.paragraph].some(sentence => sentence.split(' ').filter(word => cleanWord(word) === scene.bad).length !== 1)
      ).map(scene => scene.place)));
    `);
    assert.deepEqual(invalid, []);
    async function scene(chapter, index, traveler) {
      const actual = await browser.eval(`
        const img = document.querySelector('.forest-stage > img');
        const sprite = document.querySelector('.forest-traveler-sprite img');
        await Promise.all([img, sprite, ...document.querySelectorAll('.forest-escort img')].map(image => image.decode()));
        return { src:img.getAttribute('src'), width:img.naturalWidth,
          sprite:sprite.getAttribute('src'),
          guide:document.querySelector('.forest-dialogue b').textContent,
          within:img.parentElement.getBoundingClientRect().right <= innerWidth,
          errors:Q.items[Q.i].cau.split(' ').filter(word => cleanWord(word) === Q.items[Q.i].tuSai).length };
      `);
      assert.equal(actual.src, 'assets/vuon-truyen/' + chapter + '-' + (index + 1) + '.webp');
      assert.equal(actual.sprite, traveler);
      assert.ok(actual.width && actual.guide && actual.within);
      assert.equal(actual.errors, 1);
    }
    const answer = right => browser.eval(`
      const it = Q.items[Q.i];
      [...document.querySelectorAll('[data-tok]')].find(b => (cleanWord(b.textContent) === it.tuSai) === ${right}).click();
      document.querySelector('#plCheck').click();
    `);
    const journeys = [
      { mode:'rabbit', grade:'2', chapters:['seed','cloud','lantern'], sprite:'assets/chase-rabbit-stride.webp', map:'Khu Rừng Bí Mật' },
      { mode:'football', grade:'1', chapters:['island-lens','island-kite','island-match'], sprite:'assets/quest/footballer-stride.webp', map:'Đảo Gió Bí Mật' },
      { mode:'royal', grade:'3', chapters:['royal-bell','royal-lantern','royal-stars'], sprite:'assets/quest/king-stride.webp', map:'Vương Quốc Sao' }
    ];
    const titles = new Set();
    for (const { mode, grade, chapters, sprite, map } of journeys) {
      await browser.eval(`S.grade = ${JSON.stringify(grade)}; go('stories');`);
      await click('[data-story-route="' + mode + '"]');
      assert.equal(await browser.eval(`return [...document.querySelectorAll('[data-story-start]')].filter(button => button.disabled).length`), 2);
      assert.equal(await browser.eval(`return document.querySelector('.forest-unlock button').disabled`), true);
      assert.equal(await browser.eval(`return document.querySelector('[data-story-route][aria-pressed="true"]').dataset.storyRoute`), mode);
      if (width === 390) {
        await browser.eval(`await Promise.all([...document.querySelectorAll('.forest-picker img,.forest-cover img')].map(img => img.decode()));`);
        await browser.shot(path.join(out, 'chon-' + mode + '-' + width + '.png'));
      }
      await click('[data-story-start="' + chapters[0] + '"]');
      await scene(chapters[0], 0, sprite);
      await answer(false);
      assert.ok(await browser.eval(`return Q.i === 0 && !document.querySelector('.forest-panel').classList.contains('is-open') && document.querySelector('#plCont').textContent.includes('Thử lại')`));
      await click('#plCont');
      assert.equal(await browser.eval('return Q.i'), 0);
      for (const chapter of chapters) {
        for (let i = 0; i < 3; i++) {
          await scene(chapter, i, sprite);
          await answer(true);
          const motion = await browser.eval(`
            const sprite = document.querySelector('.forest-panel.is-open .forest-traveler-sprite img');
            return { stride: sprite?.getAnimations().some(animation => animation.animationName === 'chaseStride'),
              escorts: [...document.querySelectorAll('.forest-escort img')].filter(img => img.getAnimations().some(animation => animation.animationName === 'chaseStride')).length,
              parallax: document.querySelector('.forest-near').getAnimations().some(animation => animation.animationName === 'forestNearSlide'),
              travel: document.querySelector('.forest-traveler-path').getAnimations().some(animation => animation.animationName === 'forestPass'),
              wait: document.querySelector('#plCont').disabled, feedback: !document.querySelector('#plSheet').hidden };
          `);
          assert.deepEqual(motion, { stride:true, escorts:mode === 'royal' ? 2 : 0, parallax:true, travel:true, wait:true, feedback:true });
          if (width === 390 && chapter === chapters[0] && i === 0) {
            await browser.sleep(650);
            await browser.shot(path.join(out, 'qua-chot-' + mode + '-' + width + '.png'));
          }
          await browser.eval(`
            const button = document.querySelector('#plCont');
            for (let i = 0; i < 80 && button.disabled; i++) await new Promise(resolve => setTimeout(resolve, 50));
            if (button.disabled) throw Error('Nút qua chốt vẫn đang khóa.');
            button.click();
          `);
        }
        assert.ok(await browser.eval(`return S.storyProgress[${JSON.stringify(chapter)}].done && !!document.querySelector('.forest-relic')`));
        await click('#storyNext');
      }
      const mapState = await browser.eval(`
        const image = document.querySelector('.forest-grove-stage img');
        await image.decode();
        const points = [...document.querySelectorAll('.forest-hotspot')];
        return { view:currentView, map:document.querySelector('.forest-grove h1').textContent,
          ids:points.map(b => b.dataset.storyRelic), fits:points.every(b => b.offsetWidth >= 44 && b.getBoundingClientRect().right <= innerWidth) };
      `);
      assert.deepEqual(mapState, { view:'story-grove', map, ids:chapters, fits:true });
      assert.ok(await browser.eval(`
        const canvas = document.querySelector('.forest-ambient');
        await new Promise(resolve => setTimeout(resolve, 170));
        const first = canvas.toDataURL();
        await new Promise(resolve => setTimeout(resolve, 140));
        return canvas.width >= 240 && first !== canvas.toDataURL();
      `), 'Mặt nước và ánh sáng đổi khung ngay trên bản đồ');
      if (width === 390) await browser.shot(path.join(out, 'ban-do-' + mode + '-' + width + '.png'));
      for (const id of chapters) {
        const hotspot = '[data-story-relic="' + id + '"]';
        const turn = await browser.eval(`
          const stage = document.querySelector('.forest-grove-stage');
          document.querySelector(${JSON.stringify(hotspot)}).click();
          const camera = stage.querySelector('.forest-map-camera').getAnimations().find(animation => animation.id === 'story-map-approach');
          const busy = stage.getAttribute('aria-busy') === 'true' && document.querySelector('#modalRoot').hidden;
          if (camera) await camera.finished;
          return { focused:stage.dataset.discovery, busy, camera:!!camera, reader:!!document.querySelector('.forest-reader') };
        `);
        assert.deepEqual(turn, { focused:id, busy:true, camera:true, reader:true });
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
          if (id === chapters[0] && page === 2) {
            await browser.sleep(320);
            if (width === 390) await browser.shot(path.join(out, 'truyen-' + mode + '-' + width + '.png'));
            await click('.forest-reader-back');
            const back = await browser.eval(`
              return { count:document.querySelector('.forest-reader-count').textContent,
                paper:getComputedStyle(document.querySelector('.turn-back .forest-paper')).animationName };
            `);
            assert.deepEqual(back, { count:'Trang 1 / 3', paper:'forestPaperTurn' });
            await click('.forest-reader-next');
          }
          await click('.forest-reader-next');
        }
        assert.equal(content.size, 3);
        assert.ok(await browser.eval(`return document.querySelector('#modalRoot').hidden && document.activeElement === document.querySelector(${JSON.stringify(hotspot)})`));
      }
      await click('[data-tale-link="' + chapters[0] + '"]');
      await click('.forest-reader .modal-close');
      assert.ok(await browser.eval(`return document.activeElement === document.querySelector('[data-tale-link="${chapters[0]}"]')`));
    }
    assert.equal(titles.size, 9);
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
    assert.equal(await browser.eval(`return document.querySelector('[data-story-route][aria-pressed="true"]').dataset.storyRoute`), 'royal');
    for (const id of routeIds) {
      await click('[data-story-route="' + id + '"]');
      assert.equal(await browser.eval("return document.querySelector('.forest-unlock button').disabled"), false);
    }
    assert.deepEqual(browser.errors, []);
    console.log(width + '×' + height + ': 3 tuyến tách tiến độ, 27 chốt, 9 bảo vật và 9 truyện có tranh đều đạt.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
