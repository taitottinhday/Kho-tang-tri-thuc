/* Kiểm tra câu mới và trạng thái rượt đuổi: node tests/chase_e2e.js [rộng] [cao] */
'use strict';
const { launch } = require('./cdp_driver.js');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const width = Number(process.argv[2] || 390), height = Number(process.argv[3] || 844);
  const browser = await launch(width,height);
  try {
    await browser.goto('index.html');
    await browser.eval("db.onboarded = true; if (typeof hideWelcome === 'function') hideWelcome(); closeModal(); render(); go('adaptive');");
    await browser.sleep(250);
    const lessonCheck = await browser.eval(`
      const before=S.grade, duplicates=[]; let checked=0;
      for(const grade of [1,2,3]) { S.grade=String(grade); for(const topic of gradeTopics(grade)) for(const level of ['de','vua','kho']) {
        const items=buildLesson(topic,level,grade), keys=items.map(questionFingerprint); checked++;
        if(new Set(keys).size!==keys.length) duplicates.push({grade,topic:topic.id,level,count:items.length});
      }}
      S.grade=before; return {checked,duplicates};
    `);
    assert(lessonCheck.duplicates.length === 0, 'không lặp câu trong các mức bài học');
    await browser.eval("document.querySelector('#adaptiveStart').click();");
    await browser.sleep(250);
    const first = await browser.eval(`return {
      kind:Q.kind, count:Q.items.length, unique:new Set(Q.items.map(questionFingerprint)).size,
      generated:new Set(ALL_TOPICS.flatMap(t=>(t.sinh||[]).map((_,k)=>t.id+':'+k))).size,
      scene:!!document.querySelector('.chase-run'),
      images:[...document.querySelectorAll('.chase-run img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),
      box:document.querySelector('.chase-run')?.getBoundingClientRect().toJSON()
    };`);
    assert(first.kind === 'adaptive' && first.count === 5, 'nhiệm vụ có đủ năm câu');
    assert(first.unique === first.count, 'không có câu trùng trong lượt');
    assert(first.generated >= 1000, 'có ít nhất 1.000 câu sinh');
    assert(first.scene && first.images.every(image=>image.loaded), 'cảnh rượt đuổi và ảnh tải đầy đủ');
    assert(first.box.width <= width + 1 && first.box.left >= -1, 'cảnh không tràn ngang');
    const out = path.join('qa-results','chase'); fs.mkdirSync(out,{recursive:true}); await browser.shot(path.join(out,'start-'+width+'.png'));
    const firstKeys = await browser.eval('return Q.items.map(questionFingerprint)');
    let firstWrongSeen = false;
    for (let i = 0; i < 5; i++) {
      const state = await answer(browser, !(i === 0), i !== 0);
      if (i === 0) {
        assert(state.gap < 26 && state.wrongClass, 'sai làm sói áp sát và giảm tốc Thỏ');
        firstWrongSeen = true;
        await browser.shot(path.join(out,'wrong-'+width+'.png'));
        await browser.eval("document.querySelector('#plCont').click();"); await browser.sleep(200);
      }
      await browser.sleep(100);
    }
    assert(firstWrongSeen, 'đã đi qua nhánh trả lời sai');
    await browser.eval("document.querySelector('#home')?.click(); go('adaptive'); document.querySelector('#adaptiveStart').click();");
    await browser.sleep(200);
    const second = await browser.eval(`return {
      count:Q.items.length, unique:new Set(Q.items.map(questionFingerprint)).size,
      overlap:Q.items.map(questionFingerprint).filter(key=>${JSON.stringify(firstKeys)}.includes(key)).length
    };`);
    assert(second.unique === second.count && second.overlap === 0, 'lượt mới chọn câu khác lượt trước');
    for (let i = 0; i < 5; i++) {
      const state = await answer(browser, true, i !== 4);
      if (i === 4) {
        assert(state.escaped && state.gap === 80 && state.escapeClass, 'đúng hết làm Thỏ thoát sói');
        assert(state.continueDisabled, 'chờ Thỏ chạy thoát trước khi xem kết quả');
        await browser.sleep(await browser.eval('return ChaseRun.escapeDelay'));
        await browser.shot(path.join(out,'escape-'+width+'.png'));
        await browser.eval("document.querySelector('#plCont').click();"); await browser.sleep(200);
      }
      await browser.sleep(100);
    }
    const result = await browser.eval(`return {
      title:document.querySelector('.lesson-complete h3')?.textContent||'',
      race:document.querySelector('.lesson-complete')?.textContent.includes('Thỏ Lá đã chạy thoát khỏi sói')||false
    };`);
    assert(result.race, 'kết quả ghi nhận Thỏ đã thoát');
    await browser.shot(path.join(out,'race-'+width+'.png'));

    await browser.eval("document.querySelector('#again').click();");
    await answer(browser, false);
    await answer(browser, true);
    const warned = await answer(browser, false, false);
    assert(!warned.caught && warned.mistakes === 2 && warned.feedback.includes('Sai thêm một câu'), 'câu sai thứ hai cảnh báo nhưng vẫn cho chơi');
    await browser.eval("document.querySelector('#plCont').click();");
    const caught = await answer(browser, false, false);
    assert(caught.caught && caught.caughtClass && !caught.escaped && caught.gap === 0, 'câu sai thứ ba làm sói bắt kịp');
    assert(caught.continueLabel === 'Xem kết quả' && caught.continueDisabled, 'chờ cảnh bắt kịp trước khi xem kết quả');
    await browser.sleep(780);
    const stopped = await browser.eval(`return {
      banner:document.querySelector('[data-chase-outcome]').textContent,
      opacity:getComputedStyle(document.querySelector('[data-chase-outcome]')).opacity,
      wolfLeft:document.querySelector('.chase-wolf').getBoundingClientRect().left,
      ready:!document.querySelector('#plCont').disabled,
      errors:document.querySelector('[data-chase-mistakes]').textContent,
      safety:document.querySelector('.chase-meter').getAttribute('aria-valuenow')
    };`);
    assert(stopped.wolfLeft > caught.wolfLeft + 10, 'sói thật sự lao về phía Thỏ');
    assert(stopped.banner.includes('SÓI BẮT KỊP') && stopped.opacity === '1' && stopped.ready && stopped.errors === 'Sai 3/3' && stopped.safety === '0', 'hiện kết cục, hết khoảng cách và mở nút xem kết quả');
    await browser.shot(path.join(out,'caught-'+width+'.png'));
    await browser.eval("document.querySelector('#plCont').click();");
    const failed = await browser.eval(`return {
      summary:document.querySelector('.lesson-complete')?.textContent || '',
      retry:document.querySelector('#again')?.textContent || '',
      ended:Q === null
    };`);
    assert(failed.ended && failed.summary.includes('Sói đã bắt kịp') && failed.summary.includes('1 / 4 câu đúng') && failed.retry.includes('Thử lại'), 'dừng lượt và chấm theo bốn câu đã làm');
    await browser.eval("document.querySelector('#again').click();");
    assert(await browser.eval('return Q.kind === "adaptive" && Q.i === 0 && Q.race.mistakes === 0 && !Q.race.caught;'), 'thử lại mở lượt chạy mới');
    if (browser.errors.length) throw Error('Lỗi trình duyệt: '+browser.errors.join('\n'));
    console.log(width+'×'+height+': '+first.generated+' câu sinh · 5 câu mới · chạy thoát, bị bắt kịp và thử lại đều đạt.');
  } finally { await browser.close(); }
}

async function answer(browser, correct, advance = true) {
  const state = await browser.eval(`
    const wantCorrect=${correct}, it=Q.items[Q.i], all=s=>[...document.querySelectorAll(s)], click=(s)=>{const e=document.querySelector(s);if(!e)throw Error('Thiếu '+s);e.click();};
    if(it.loai==='chon'||it.loai==='ngheChon'||it.loai==='chonCau') { const key=it.loai==='chon'?it.dapAn:it.loai==='ngheChon'?it.word:it.good, target=wantCorrect?key:all('[data-answer]').find(x=>x.dataset.answer!==key).dataset.answer; all('[data-answer]').find(b=>b.dataset.answer===target).click(); }
    else if(it.loai==='dungSai') click('[data-tf="'+(wantCorrect===it.dung?'1':'0')+'"]');
    else if(it.loai==='ghepChu') { let units=it.units.slice(); if(!wantCorrect) [units[0],units[1]]=[units[1],units[0]]; for(const u of units) all('[data-tile]').find(b=>!b.classList.contains('used')&&b.textContent===u).click(); }
    else if(it.loai==='timLoi') all('[data-tok]').find(b=>{const w=b.textContent.replace(/[.,!?;:\"“”()…]/g,'');return wantCorrect?w===it.tuSai:w!==it.tuSai;}).click();
    else if(it.loai==='ngheViet'){click('#peek');const input=document.querySelector('#dictIn');input.value=wantCorrect?it.cau.normalize('NFD'):'sai';input.dispatchEvent(new Event('input'));}
    else throw Error('Dạng câu chưa hỗ trợ trong kiểm tra: '+it.loai);
    click('#plCheck');
    const race=document.querySelector('.chase-run');
    const cont=document.querySelector('#plCont');
    const value={
      gap:Q.race.gap,wrongClass:race.classList.contains('is-wrong'),escaped:Q.race.escaped,escapeClass:race.classList.contains('is-escaped'),
      mistakes:Q.race.mistakes, caught:Q.race.caught, caughtClass:race.classList.contains('is-caught'),
      feedback:race.querySelector('[data-chase-feedback]').textContent, continueLabel:cont.textContent, continueDisabled:cont.disabled,
      wolfLeft:race.querySelector('.chase-wolf').getBoundingClientRect().left
    };
    if(${advance}) cont.click();
    return value;
  `);
  await browser.sleep(200);
  return state;
}
function assert(value,message){if(!value)throw Error('Không đạt: '+message);}
main().catch(error=>{console.error(error);process.exitCode=1;});
