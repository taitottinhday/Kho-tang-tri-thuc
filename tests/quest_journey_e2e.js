/* node tests/quest_journey_e2e.js [rộng] [cao] */
'use strict';
const { launch } = require('./cdp_driver');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const width = Number(process.argv[2] || 390), height = Number(process.argv[3] || 844);
  const out = path.join('qa-results', 'quest');
  fs.mkdirSync(out, { recursive: true });
  const browser = await launch(width, height);
  const click = selector => browser.eval('document.querySelector(' + JSON.stringify(selector) + ').click()');
  const state = () => browser.eval(`return {
    index: Q.i, count: Q.correct, steps: Q.journey.steps, won: Q.journey.won,
    finishing: !!document.querySelector('.journey-scene.is-finishing'),
    badge: document.querySelector('[data-journey-finish]').textContent,
    wait: document.querySelector('#plCont')?.disabled || false
  };`);
  // Exercise real check / continue controls without coupling this test to a particular question type.
  const answer = right => browser.eval(`setReady(() => ({ right: ${right} }));document.querySelector('#plCheck').click();`);
  try {
    await browser.goto('index.html', 2500);
    await browser.eval(`db.onboarded = true; if (typeof hideWelcome === 'function') hideWelcome(); closeModal(); render(); go('adaptive');`);
    const choice = await browser.eval(`
      const inputs = [...document.querySelectorAll('input[name="quest-character"]')];
      await Promise.all([...document.querySelectorAll('.quest-choice-portrait img')].map(img => img.decode()));
      return { ids: inputs.map(i => i.value), selected: inputs.find(i => i.checked).value,
        fits: document.querySelector('#adaptiveSelect').getBoundingClientRect().right <= innerWidth };
    `);
    assert.deepEqual(choice.ids, ['rabbit', 'football', 'royal']);
    assert.equal(choice.selected, 'rabbit');
    assert.ok(choice.fits);
    await browser.shot(path.join(out, 'select-' + width + '.png'));

    async function start(mode) {
      await click('input[value="' + mode + '"]');
      await click('#adaptiveStart');
      const ready = await browser.eval(`
        const stage = document.querySelector('.journey-scene');
        const background = getComputedStyle(stage.querySelector('.journey-background')).backgroundImage;
        const art = new Image(); art.src = background.slice(4,-1).replaceAll('"','');
        await Promise.all([art, ...stage.querySelectorAll('img')].map(img => img.decode().catch(() => { throw Error('Không mở được ảnh: ' + img.src); })));
        const actors = [...stage.querySelectorAll('.journey-sprite:not(.journey-foot-kick)>img')].filter(img => img.getAnimations().length);
        const poses = [];
        for (const img of actors) {
          const anim = img.getAnimations()[0]; anim.pause(); await anim.ready;
          const values = [];
          for (let i=0; i<6; i++) {
            const { duration, delay } = anim.effect.getTiming();
            anim.currentTime = duration * (1 + (i + .5) / 6) + delay;
            values.push(getComputedStyle(img).transform);
          }
          poses.push(new Set(values).size); anim.play();
        }
        return { mode: Q.adventure, size: Q.items.length, unique: new Set(Q.items.map(questionFingerprint)).size,
          poses, noRabbit: !document.querySelector('.chase-run'),
          princess: stage.querySelector('.journey-princess') ? getComputedStyle(stage.querySelector('.journey-princess')).visibility : null };
      `);
      assert.equal(ready.mode, mode);
      assert.equal(ready.size, 5);
      assert.equal(ready.unique, 5);
      assert.equal(ready.noRabbit, true);
      assert.deepEqual(ready.poses, mode === 'football' ? [6] : [6,6,6]);
      if (mode === 'royal') assert.equal(ready.princess, 'hidden');
      await browser.shot(path.join(out, mode + '-start-' + width + '.png'));
    }

    await start('football');
    const ballTransform = await browser.eval(`
      const anim = document.querySelector('.journey-ball-visual').getAnimations()[0];
      anim.pause(); await anim.ready;
      anim.currentTime = 90; const a = getComputedStyle(anim.effect.target).transform;
      anim.currentTime = 340; const b = getComputedStyle(anim.effect.target).transform;
      anim.play(); return a !== b;
    `);
    assert.ok(ballTransform, 'Bóng lăn và nhảy nhẹ');
    await browser.eval(`
      window.savedStage = document.querySelector('.journey-scene');
      window.savedStride = savedStage.querySelector('.journey-foot-run img').getAnimations()[0];
    `);
    for (let i=1; i<=3; i++) {
      await answer(true);
      const progress = await state();
      assert.equal(progress.steps, i);
      assert.equal(progress.won, false);
      await click('#plCont');
      assert.ok(await browser.eval(`
        const scene = document.querySelector('.journey-scene');
        return scene === savedStage && scene.querySelector('.journey-foot-run img').getAnimations()[0] === savedStride;
      `), 'Chuyển câu giữ cảnh và chu kỳ chạy hiện tại');
    }
    assert.ok(await browser.eval('await savedStride.ready; return savedStride.playbackRate > 1.2;'));
    await answer(true);
    assert.deepEqual(await state(), { index:3, count:4, steps:4, won:true, finishing:true, badge:'VÀO GÔN!', wait:true });
    await browser.sleep(await browser.eval('return Q.journey.mode.duration + 100'));
    const scored = await browser.eval(`
      const kick = document.querySelector('.journey-foot-kick img').getAnimations()[0];
      await kick.finished;
      const ball = document.querySelector('.journey-ball-visual').getBoundingClientRect(), goal = document.querySelector('.journey-goal').getBoundingClientRect();
      return { inside: ball.x + ball.width / 2 > goal.left && ball.x + ball.width / 2 < goal.right && ball.y > goal.top && ball.bottom < goal.bottom,
        kick: getComputedStyle(document.querySelector('.journey-foot-kick')).visibility,
        pose: kick.effect.getComputedTiming().progress,
        net: document.querySelector('.journey-net').getAnimations().some(a => a.animationName === 'journeyNet') };
    `);
    assert.deepEqual(scored, { inside:true, kick:'visible', pose:1, net:true });
    await browser.shot(path.join(out, 'football-win-' + width + '.png'));
    await click('#plCont');
    await answer(false);
    assert.deepEqual(await state(), { index:4, count:4, steps:4, won:true, finishing:false, badge:'VÀO GÔN!', wait:false });
    await click('#plCont');
    assert.ok(await browser.eval(`return document.querySelector('.lesson-complete h3').textContent.includes('Bóng vào lưới')`));
    await click('#changeAdventure');

    await start('royal');
    const formation = await browser.eval(`
      const x = selector => document.querySelector(selector).getBoundingClientRect().x;
      return x('.journey-guard-back') < x('.journey-rider') && x('.journey-guard-front') > x('.journey-rider');
    `);
    assert.ok(formation);
    await answer(false);
    assert.equal((await state()).steps, 0);
    assert.ok(await browser.eval(`return !!document.querySelector('.journey-scene.is-wrong')`));
    await click('#plCont');
    for (let i=0; i<3; i++) { await answer(true); await click('#plCont'); }
    await answer(true);
    assert.deepEqual(await state(), { index:4, count:4, steps:4, won:true, finishing:true, badge:'CÔNG CHÚA RA ĐÓN!', wait:true });
    await browser.sleep(await browser.eval('return Q.journey.mode.duration + 100'));
    const wave = await browser.eval(`
      const person = document.querySelector('.journey-princess');
      const horse = document.querySelector('.journey-rider-halt');
      const halt = horse.querySelector('img').getAnimations()[0];
      await halt.finished;
      return { visible: getComputedStyle(person).visibility, wave: person.querySelector('img').getAnimations().some(a => a.animationName === 'chaseStride'),
        halted: getComputedStyle(horse).visibility, pose: halt.effect.getComputedTiming().progress };
    `);
    assert.deepEqual(wave, { visible:'visible', wave:true, halted:'visible', pose:1 });
    await browser.shot(path.join(out, 'royal-win-' + width + '.png'));
    await click('#plCont');
    assert.ok(await browser.eval(`return document.querySelector('.lesson-complete h3').textContent.includes('Đã gặp Công chúa')`));
    await click('#again');
    assert.equal(await browser.eval('return Q.adventure'), 'royal');
    for (const right of [true, false, true, false]) { await answer(right); await click('#plCont'); }
    await answer(true);
    assert.equal((await state()).badge, 'CHƯA ĐẾN ĐÍCH');
    assert.equal(await browser.eval(`return getComputedStyle(document.querySelector('.journey-princess')).visibility`), 'hidden');
    await click('#plCont');
    assert.ok(await browser.eval(`return document.querySelector('.lesson-complete h3').textContent.includes('Suýt tới đích')`));
    assert.deepEqual(browser.errors, []);
    console.log(width + '×' + height + ': đổi nhân vật, từng tư thế chân, sút vào lưới, Công chúa vẫy tay và mốc 4 câu đúng đều đạt.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
