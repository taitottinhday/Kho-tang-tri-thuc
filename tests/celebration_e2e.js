// Verify that completed lessons actually award, save and replay the current cinematic gifts.
'use strict';
const assert = require('node:assert/strict');
const { launch } = require('./cdp_driver.js');

async function main() {
  const width = Number(process.argv[2] || 1366), height = Number(process.argv[3] || 900);
  const b = await launch(width,height);
  const verify = (condition,label) => { assert.ok(condition,label); console.log('  ✓ ' + label); };
  const until = async expression => {
    for (let i = 0; i < 65; i++) {
      if (await b.eval('return Boolean(' + expression + ')')) return true;
      await b.sleep(110);
    }
    return false;
  };
  try {
    await b.goto('index.html');
    verify(await until("typeof QuaTang !== 'undefined' && typeof hideWelcome === 'function'"), 'Trang và sân khấu quà tặng đã tải');
    await b.eval("S.name='Minh An'; S.gifts={}; S.giftTurn={}; db.onboarded=true; db.settings.sound=false; hideWelcome(); save();");
    async function complete(correct,total) {
      await b.eval(
        "const topic=myTopics().find(t=>t.baiTap.some(q=>q.loai==='chon'));" +
        "const pool=topic.baiTap.map((q,i)=>({...q,_t:topic.id,_i:i})).filter(q=>q.loai==='chon');" +
        "const total=" + total + ", correct=" + correct + ";" +
        "const items=Array.from({length:total},(_,i)=>({...pool[i%pool.length]}));" +
        "startQuiz({kind:'lesson',topicId:topic.id,level:'de',title:topic.ten,items});" +
        "for(let i=0;i<total;i++){" +
        "const choices=[...document.querySelectorAll('[data-answer]')];" +
        "choices.find(b=>(b.dataset.answer===items[i].dapAn)===(i<correct)).click();" +
        "document.querySelector('#plCheck').click(); document.querySelector('#plCont').click();}"
      );
    }
    await complete(3,5);
    verify(await b.eval("return !!document.querySelector('.lesson-complete') && !document.querySelector('dialog.qt,.qt-strip')"),'60% vẫn hiện màn kết quả thường');
    for (const [score,total,id] of [[4,5,'ca-heo'],[9,10,'sut-bong'],[5,5,'su-tu']]) {
      await complete(score,total);
      verify(await until("document.querySelector('dialog.qt-" + id + "[open]')"),score + '/' + total + ' mở đúng món ' + id);
      verify(await b.eval("return document.querySelectorAll('dialog[open]').length===1 && !!document.querySelector('.qt-strip') && S.gifts['" + id + "']===1 && JSON.parse(localStorage.getItem(STORE_KEY)).profiles[S.id].gifts['" + id + "']===1"),'Chỉ hiện một màn, quà đã lưu cùng tiến độ');
      await b.eval("document.querySelector('dialog.qt .qt-close').click()");
      verify(await b.eval("return !document.querySelector('dialog.qt') && !!document.querySelector('.lesson-complete')"),'Bỏ qua quà vẫn thấy kết quả');
    }
    await b.eval("document.querySelector('.qt-replay').click()");
    verify(await until("document.querySelector('dialog.qt-su-tu[open]')"), 'Xem lại đúng quà vừa nhận');
    await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    verify(await b.eval("return !document.querySelector('dialog.qt') && !!document.querySelector('.lesson-complete')"),'Phím Escape chỉ đóng sân khấu');
    await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await complete(5,5);
    verify(await until("document.querySelector('dialog.qt-still[open]')"),'Giảm chuyển động mở cảnh tĩnh');
    await b.eval("QuaTang.close()");
    await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await b.eval("QuaTang.show({gift:'sut-bong',correct:9,total:10,acc:90,student:S.name,avatar:S.avatar,praise:'Em làm tốt lắm!',firstTime:false})");
    verify(await until("document.querySelector('.qt-on .qt-ball img')?.naturalWidth"), 'Sân bóng dựng được bóng có hình ảnh');
    const ball = await b.eval("const a=document.querySelector('.qt-ball'); const r=a.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width};");
    verify(await until("[...document.querySelectorAll('.qt-player:not([hidden]) img')].some(i=>i.src.endsWith('/player-run.webp')&&i.naturalWidth)"), 'Cầu thủ chạy đà');
    verify(await until("[...document.querySelectorAll('.qt-player:not([hidden]) img')].some(i=>i.src.endsWith('/player-kick.webp')&&i.naturalWidth)"), 'Cầu thủ đổi sang tư thế sút trước khi bóng bay');
    verify(await until("document.querySelector('.qt-netwave.on')"), 'Bóng chạm lưới và kích hoạt hiệu ứng ăn mừng');
    const goal = await b.eval("const a=document.querySelector('.qt-ball'); const r=a.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width};");
    verify(goal.y < ball.y && goal.w < ball.w, 'Bóng bay lên và thu nhỏ đúng phối cảnh');
    await b.eval("QuaTang.close()");
    await b.eval("QuaTang.show({gift:'su-tu',correct:5,total:5,acc:100,student:S.name,avatar:S.avatar,praise:'Em làm tốt lắm!',firstTime:false})");
    verify(await until("document.querySelector('.qt-lion.roaring img.roar')?.naturalWidth"), 'Sư tử đổi sang tư thế gầm trong lúc diễn');
    await b.eval("QuaTang.close()");
    await b.eval(`
      go('gifts');
      const audio = getAudioCtx();
      const openBus = audio.createDynamicsCompressor.bind(audio);
      window.rewardBus = { opened: 0, closed: 0 };
      audio.createDynamicsCompressor = () => {
        rewardBus.opened++;
        const bus = openBus();
        const disconnect = bus.disconnect.bind(bus);
        bus.disconnect = () => { rewardBus.closed++; disconnect(); };
        return bus;
      };
    `);
    verify(await until("document.querySelector('[data-peek=\"ten-lua\"]')"), 'Có thể xem trước quà chưa nhận');
    await b.eval("document.querySelector('[data-peek=\"ten-lua\"]').click()");
    verify(await until("document.querySelector('.qt-score')?.textContent.includes('Điểm minh họa · 9/10 câu đúng · 90%')"), 'Điểm minh họa khớp cấp quà');
    await b.eval("QuaTang.close(); db.settings.sound = true; document.querySelector('[data-gift=\"sut-bong\"]').click()");
    verify(await until("rewardBus.opened === 1"), 'Cảnh bật tiếng tạo đường âm thanh riêng');
    await b.eval("document.querySelector('dialog.qt .qt-close').click()");
    verify(await b.eval("return rewardBus.closed === 1"), 'Bỏ qua ngắt âm thanh đã lên lịch');
    await b.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await b.eval("document.querySelector('[data-gift=\"sut-bong\"]').click()");
    verify(await until("document.querySelector('.qt-still.qt-reveal')"), 'Xem lại với giảm chuyển động hiện ảnh tĩnh');
    verify(await b.eval("return rewardBus.opened === 1"), 'Giảm chuyển động giữ hoạt cảnh yên lặng');
    await b.eval("QuaTang.close()");
    verify(b.errors.length === 0,'Không lỗi JavaScript');
    console.log(width + ' × ' + height + ' — đạt luồng bài học');
  } finally { await b.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
