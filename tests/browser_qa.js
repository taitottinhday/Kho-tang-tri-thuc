// Served only by browser_qa.py, on a temporary localhost origin.
(async function runBrowserChecks() {
  const params = new URLSearchParams(location.search);
  const width = Number(params.get('w'));
  const frame = document.querySelector('iframe');
  frame.style.width = width + 'px';
  frame.style.height = params.get('h') + 'px';
  const report = { width, passed: [], failed: [], complete: false };
  function check(title, condition) {
    (condition ? report.passed : report.failed).push(title);
  }
  function loadApp() {
    return new Promise(resolve => {
      frame.onload = () => {
        if (frame.contentWindow.location.pathname === '/index.html' &&
            frame.contentDocument.readyState === 'complete') resolve();
      };
      frame.src = '/index.html';
    });
  }
  const doc = () => frame.contentDocument;
  const el = selector => doc().querySelector(selector);
  const all = selector => Array.from(doc().querySelectorAll(selector));
  const visible = node => !!(node && node.getClientRects().length);
  function click(selector) {
    if (el('dialog.qt') && !selector.startsWith('dialog.qt')) frame.contentWindow.eval('QuaTang.close()'); // quà che cả màn: bé phải đóng quà trước
    const node = el(selector);
    if (!visible(node) || node.disabled) throw new Error('Unavailable control ' + selector);
    node.click();
  }
  function nav(view) {
    const menu = el('#mobileMenu');
    if (visible(menu) && !el('#sidebar').classList.contains('mobile-open')) click('#mobileMenu');
    click('#sidebar [data-view="' + view + '"]');
  }
  function fits() {
    return doc().documentElement.scrollWidth <= frame.clientWidth;
  }
  try {
    await loadApp();
    const browser = frame.contentWindow;
    browser.addEventListener('error', e => report.failed.push(e.message || 'Page error'));
    // Lần đầu mở: màn chào → tạo hồ sơ (đợt 10)
    check('First visit shows welcome', visible(el('#welcome')) && visible(el('#wlCreate')));
    click('#wlCreate');
    el('#nameInput').value = 'Bé Kiểm Thử';
    click('[data-char="🦊"]');
    click('#saveProfile');
    check('Profile created, how-to shown', visible(el('#howToGo')) && el('#profileName').textContent === 'Bé Kiểm Thử');
    click('#howToGo');
    check('Home rendered', visible(el('.hero-card')) && visible(el('h1')));
    check('Real viewport width', browser.innerWidth === width);
    check('Home fits', fits());
    await doc().fonts.ready;
    check('Bundled Nunito loaded', doc().fonts.check('900 18px Nunito') && [...doc().fonts].some(f => f.family === 'Nunito' && f.status === 'loaded'));
    check('Treasure map artwork loaded', el('.island-art').naturalWidth > 0);
    check('Three island destinations', all('[data-island]').length === 3);
    click('[data-island="3"]');
    check('Island opens its grade roadmap', el('#gradeSelect').value === '3' && el('h1').textContent.includes('3'));
    click('.voyage-dock [data-view=home]');
    for (const asset of all('script[src],link[rel=stylesheet]')) {
      const response = await fetch(asset.src || asset.href);
      check('Asset ' + new URL(response.url).pathname, response.ok);
    }
    const bank = browser.NGAN_HANG_CHINH_TA;
    for (let grade = 1; grade <= 3; grade++) {
      const picker = el('#gradeSelect');
      picker.value = String(grade);
      picker.dispatchEvent(new Event('change', {bubbles:true}));
      const expected = bank.chuDe.filter(t => t.lop[0] <= grade && grade <= t.lop[1]);
      check('Grade ' + grade + ' roadmap', all('.topic-tile').length === expected.length);
    }
    el('#gradeSelect').value = '2';
    el('#gradeSelect').dispatchEvent(new Event('change'));
    click('#soundToggle');
    click('.hero-copy [data-start]');
    check('All three lesson levels available', all('[data-level]').length === 3);
    check('Only tier Dễ is open on a new lesson', all('.lp-tier.locked').length === 2);
    click('#openTheory');
    check('Theory page opens with formula and common mistakes', visible(el('.th-formula')) && visible(el('.th-fix')));
    click('#thIntro');
    click('[data-level="de"]');
    click('#beginQuiz');

    // Màn làm bài (đợt 4): chọn → #plCheck → tấm #plSheet → #plCont.
    // Đáp án lấy từ câu đang hỏi (Q của app.js); mọi câu trả lời đều bấm qua giao diện.
    const current = () => frame.contentWindow.eval('Q && Q.items[Q.i]');
    const bare = text => text.replace(/[.,!?;:"“”()…]/g, '');
    function answer(turn, wrong) {
      const it = current();
      if (!it) throw new Error('No question at ' + turn);
      check('Check locked before answering ' + turn, el('#plCheck').disabled && !visible(el('#plSheet')));
      if (it.loai === 'chon' || it.loai === 'ngheChon') {
        const key = it.loai === 'chon' ? it.dapAn : it.word;
        all('[data-answer]').find(c => (c.dataset.answer !== key) === wrong).click();
      } else if (it.loai === 'dungSai') {
        click('[data-tf="' + (it.dung !== wrong ? 1 : 0) + '"]');
      } else if (it.loai === 'ghepChu') {
        const units = wrong ? it.units.slice().reverse() : it.units;
        for (const u of units) all('[data-tile]').find(t => !t.classList.contains('used') && t.textContent === u).click();
      } else if (it.loai === 'timLoi') {
        all('[data-tok]').find(b => (bare(b.textContent) === it.tuSai) !== wrong).click();
      } else if (it.loai === 'ngheViet') {
        click('#peek');
        const box = el('#dictIn');
        box.value = wrong ? 'sai' : el('#reveal').textContent.normalize('NFD');
        box.dispatchEvent(new Event('input'));
      } else if (it.loai === 'phanLoai') {
        it.words.forEach((w, k) => { click('[data-w="' + k + '"]'); const t = it.baskets.indexOf(w.b); click('[data-b="' + (wrong ? (t + 1) % it.baskets.length : t) + '"]'); });
      } else if (it.loai === 'noiTu') {
        it.pairs.forEach((p, k) => { click('[data-l="' + k + '"]'); const t = it.right.indexOf(p[1]); click('[data-r="' + (wrong ? (t + 1) % it.right.length : t) + '"]'); });
      } else if (it.loai === 'goChu') {
        const box = el('#dbType'); box.value = wrong ? 'zz' : it.dapAn; box.dispatchEvent(new Event('input'));
      } else if (it.loai === 'suaLoi') {
        const box = el('#dbFix'); box.value = wrong ? 'zz' : it.tuDung.normalize('NFD'); box.dispatchEvent(new Event('input'));
      } else if (it.loai === 'nhinTranh') {
        all('[data-answer]').find(c => (c.dataset.answer !== it.word) === wrong).click();
      } else if (it.loai === 'chonCau') {
        all('[data-answer]').find(c => (c.dataset.answer !== it.good) === wrong).click();
      } else if (it.loai === 'sapXep') {
        (wrong ? it.order : it.words.map((_, k) => k)).forEach(k => click('[data-k="' + k + '"]'));
      } else if (it.loai === 'chonNhieu') {
        it.chips.forEach((c, k) => { if (c.ok !== wrong) click('[data-c="' + k + '"]'); });
      } else throw new Error('Unknown question type ' + it.loai);
      click('#plCheck');
      check('Immediate feedback ' + turn, visible(el('#plSheet')) && !!el('.pl-sheet.' + (wrong ? 'bad' : 'good')));
      if (it.loai === 'ngheViet' && !wrong) check('Vietnamese input in decomposed Unicode ' + turn, !!el('.pl-sheet.good'));
      click('#plCont');
    }
    function finish(name, missFirst = false) {
      let count = 0;
      while (el('#plCheck') && count < 30) {
        answer(name + count, missFirst && count === 0);
        count++;
      }
      check(name + ' result', count > 0 && visible(el('.lesson-complete')));
    }
    finish('Lesson', true);
    // Luật sao mới (ForumFlash): qua mức Dễ (≥70%) nhận 1★, mở mức Vừa và bài tiếp theo.
    check('Passing tier Dễ earns one star', all('.complete-medal .star.on').length === 1);
    check('Passing tier Dễ offers tier Vừa', visible(el('#upTier')));
    check('Next lesson unlocked', visible(el('#goNext')));
    click('#home');
    await loadApp();
    check('Progress persisted on reload', el('#reviewNavCount').textContent === '1' &&
          !el('#sidebarXP').textContent.startsWith('0 '));
    for (let i = 1; i <= 2; i++) {
      nav('review');
      // Each review takes place in a new round, after the previous answer was saved.
      await new Promise(resolve => setTimeout(resolve, 80));
      click('.heading-actions [data-action=review]');
      finish('Review ' + i);
      click('#home');
      check('Review queue after round ' + i, Number(el('#reviewNavCount').textContent) === (2 - i));
    }
    for (const game of ['daily', 'hunt', 'dictation']) {
      nav('games');
      click('.game-card [data-action="' + game + '"]');
      finish(game);
      click('#home');
      check('Return home from ' + game, visible(el('.hero-card')));
    }
    nav('games');
    click('.game-card [data-action=speed]');
    click('#goSpeed');
    check('Timed round starts', visible(el('.answer-option')));
    browser.eval('Q.endAt = Date.now() + 100');
    await new Promise(resolve => setTimeout(resolve, 550));
    check('Timed round finishes at timeout', visible(el('.lesson-complete')));
    click('#home');
    nav('roadmap');
    check('Roadmap fits', fits());
    check('Garden path has lesson, challenge, gift and final tree', ['lesson', 'challenge', 'gift', 'boss'].every(t => el('.gm-node.' + t)));
    check('Locked lessons show the waiting art', all('.gm-node.lesson.locked .gm-disc').every(d => { const im = d.querySelector('img.emo'); const t = (im ? im.alt : d.textContent).replace('️', ''); return t === '☃' || t === '🥚'; }));
    // Thử thách: mở khi 2 bài đầu xong; 3 giọt nước + đồng hồ; sai 3 lần thì dừng
    frame.contentWindow.eval("tstat(myTopics()[1].id).done = true; save(); render();");
    frame.contentWindow.eval("openNode(mapNodes.findIndex(n => n.type === 'challenge'))");
    click('#goNode');
    check('Challenge has 3 drops and a timer', all('.pl-lives span.on').length === 3 && visible(el('#plTime')));
    for (let k = 0; k < 3; k++) answer('Challenge miss ' + k, true);
    check('Three misses end the challenge kindly', visible(el('.lesson-complete')) && el('.lesson-complete h3').textContent.includes('khát nước'));
    click('#toMap');
    frame.contentWindow.eval("openNode(mapNodes.findIndex(n => n.type === 'challenge'))");
    click('#goNode');
    finish('Challenge');
    check('Challenge win recorded', frame.contentWindow.eval("Object.keys(S.nodes).some(k => k.startsWith('ch') && S.nodes[k].done)"));
    click('#home');
    // Hai câu mỗi khối, gợi ý lớp, không ghi sổ ôn.
    const reviewBefore = el('#reviewNavCount').textContent;
    click('[data-action=placement]');
    click('#goPlace');
    let placed = 0;
    while (el('#plCheck') && placed < 12) { answer('Placement ' + placed, placed >= 4); placed++; }
    check('Placement covers the three grades in six questions', placed === 6);
    check('Placement suggests grade 2 after two strong levels', el('.lesson-complete h3').textContent.includes('Lớp 2'));
    check('Placement misses stay out of review list', el('#reviewNavCount').textContent === reviewBefore);
    click('#home');
    // Cài đặt + Hồ sơ (module registerView)
    nav('settings');
    check('Settings page', visible(el('.settings-grid')) && fits());
    click('[data-set="theme"][data-val="night"]');
    check('Night theme applied', doc().documentElement.dataset.theme === 'night');
    el('[data-set-bool="bigText"]').click();
    check('Big text applied and still fits', doc().body.classList.contains('big-text') && fits());
    click('[data-set="theme"][data-val="day"]');
    el('[data-set-bool="bigText"]').click();
    nav('profile');
    check('Profile shows one skill row per topic', all('.skill-row').length === bank.chuDe.filter(t => t.lop[0] <= 2 && 2 <= t.lop[1]).length && fits());
    nav('badges');
    check('First lesson badge awarded', all('.badge-card.on').some(b => b.textContent.includes('Bước đầu tiên')));
    nav('teacher');
    const factors = el('.gate-q').textContent.match(/\d+/g).map(Number);
    el('#gateInput').value = String(factors[0] * factors[1]);
    click('#gateOk');
    check('Teacher profile report', visible(el('.t-table')) && visible(el('#printReport')));
    check('Teacher page fits', fits());
    nav('shelf');
    check('Seeded decks follow current grade', all('.deck-card').length === bank.chuDe.filter(t => t.lop[0] <= 2 && 2 <= t.lop[1]).length);
    click('[data-practice-set]');
    check('Built-in flashcard opens', visible(el('#memoryWord')));
    click('#coverWord');
    click('#forgotWord');
    check('Can request help without guessing', visible(el('.memory-feedback.again')) && el('.memory-feedback').textContent.includes('lượt ôn'));
    click('[data-close-modal]');
    nav('teacher');
    click('#newWordSet');
    el('#setTitle').value = 'Thẻ sân trường';
    el('#setWords').value = 'sạch sẽ\nsạch sẽ';
    click('#setForm [type=submit]');
    check('Duplicate words do not satisfy minimum', el('#setError').textContent.includes('khác nhau'));
    el('#setWords').value = 'sạch sẽ\n Hà   Nội \nsạch sẽ';
    el('#setPublished').checked = false;
    click('#setForm [type=submit]');
    check('Draft saved, duplicate removed', el('.managed-set').textContent.includes('2 thẻ · Bản nháp'));
    nav('shelf');
    click('[data-filter=assigned]');
    check('Draft hidden from pupils', !!el('.shelf-empty'));
    nav('teacher');
    click('[data-edit-set]');
    el('#setPublished').checked = true;
    click('#setForm [type=submit]');
    click('[data-sheet]');
    check('Worksheet has the 2 teacher words', all('.sheet-page tbody td:not(.writing-space)').map(c => c.textContent).join('|') === 'sạch sẽ|Hà Nội');
    const priorPrint = frame.contentWindow.print;
    let didPrint = false;
    frame.contentWindow.print = () => { didPrint = true; };
    click('#printWordSheet');
    frame.contentWindow.print = priorPrint;
    check('Worksheet print action', didPrint);
    click('[data-close-modal]');
    nav('home');
    check('Teacher assignment visible on matching grade', el('.home-assignment h2').textContent === 'Thẻ sân trường');
    el('#gradeSelect').value = '3';
    el('#gradeSelect').dispatchEvent(new Event('change'));
    check('Other grades do not receive this assignment', !el('.home-assignment'));
    el('#gradeSelect').value = '2';
    el('#gradeSelect').dispatchEvent(new Event('change'));
    nav('shelf');
    el('#shelfSearch').value = 'ha noi';
    el('#shelfSearch').dispatchEvent(new Event('input'));
    check('Unaccented word search', all('.deck-card').some(c => c.textContent.includes('Thẻ sân trường')));
    click('[data-filter=assigned]');
    check('One matching assigned deck', all('.deck-card').length === 1 && fits());
    click('[data-practice-set]');
    function writeCard(input, correct) {
      const word = el('#memoryWord').textContent;
      click('#coverWord');
      check('Hidden model and focused input ' + word, !el('#memoryWord') && !el('.modal-body').textContent.includes(word) && doc().activeElement === el('#memoryInput') && el('.app-shell').inert);
      el('#memoryInput').value = input;
      click('#memoryForm button');
      check('Flashcard grading ' + input, visible(el(correct ? '.memory-feedback.correct' : '.memory-feedback.again')));
      if (!correct) check('Capitalization feedback identifies the exact letter', el('.memory-feedback strong mark').textContent === 'H');
      click('#nextCard');
    }
    writeCard('   sạch   sẽ '.normalize('NFD'), true);
    writeCard('hà Nội', false);
    check('First round score and missed list', el('.memory-summary h3').textContent.includes('1 / 2') && all('.memory-summary li').length === 1);
    click('.memory-summary [data-close-modal]');
    check('Search and filter kept after round', el('#shelfSearch').value === 'ha noi' && el('[data-filter=assigned]').getAttribute('aria-pressed') === 'true');
    await loadApp();
    nav('review');
    check('Missed card persists after reload', el('.shelf-review').textContent.includes('Hà Nội'));
    click('.shelf-review [data-retry-set]');
    check('Retry contains only missed card', el('#memoryWord').textContent === 'Hà Nội' && el('.modal-head p').textContent.includes('1 / 1'));
    writeCard('Hà Nội', true);
    click('.memory-summary [data-close-modal]');
    // Câu sai cố ý ở Thử thách vẫn nằm trong sổ ôn bài học; thẻ từ đã sửa thì phải hết.
    check('Correct retry clears missed card', !el('.shelf-review') &&
          Number(el('#reviewNavCount').textContent) === frame.contentWindow.eval('Object.keys(S.review).length'));
    nav('teacher');
    const newFactors = el('.gate-q').textContent.match(/\d+/g).map(Number);
    el('#gateInput').value = String(newFactors[0] * newFactors[1]);
    click('#gateOk');
    check('Teacher sees full-round score and remediated misses', el('.managed-set details').textContent.includes('1/2') &&
          el('.managed-set details').textContent.includes('Đã viết đúng tất cả'));
    const restoredName = 'Sao lưu thử';
    const snapshot = JSON.parse(frame.contentWindow.localStorage.getItem('vuonchu.v2'));
    const savedXP = snapshot.profiles[snapshot.current].xp;
    snapshot.profiles[snapshot.current].name = restoredName;
    async function restore(text) {
      const transfer = new DataTransfer();
      transfer.items.add(new File([text], 'vuon-chu-test.json', {type:'application/json'}));
      const field = el('#importData');
      field.files = transfer.files;
      field.dispatchEvent(new Event('change'));
      // Wait for the browser's asynchronous File.text() completion.
      for (let i = 0; i < 100; i++) {
        const status = el('#toast').textContent;
        if (status.includes('Đã khôi phục') || status.includes('không đúng định dạng')) return;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw new Error('No restore feedback');
    }
    await restore('invalid JSON');
    check('Invalid backup preserves student', el('#profileName').textContent !== restoredName &&
          el('#sidebarXP').textContent === savedXP + ' XP');
    el('#toast').textContent = '';
    await restore(JSON.stringify(snapshot));
    check('Valid backup restores name and XP', el('#profileName').textContent === restoredName &&
          el('#sidebarXP').textContent === savedXP + ' XP');
    check('Backup retains word sets and results', el('.managed-set details').textContent.includes('1/2'));
    click('#unlockAll');
    nav('roadmap');
    const unlockedGrade = Number(el('#gradeSelect').value);
    check('Teacher unlocks all lessons for the selected grade', all('.gm-node.lesson').length ===
          bank.chuDe.filter(topic => topic.lop[0] <= unlockedGrade && unlockedGrade <= topic.lop[1]).length &&
          !el('.gm-node.lesson.locked'));
    click('#profileButton');
    click('#addProfile');
    el('#nameInput').value = 'Bạn thử';
    click('#saveProfile');
    check('Separate student progress', el('#profileName').textContent === 'Bạn thử' &&
          el('#sidebarXP').textContent === '0 XP');
    nav('shelf');
    click('[data-filter=assigned]');
    check('Assigned set shared, score private to pupil', !!el('.deck-card') && !el('.deck-card').textContent.includes('Lượt gần nhất'));
    click('#profileButton');
    click('[data-switch-p]');
    check('Returning student keeps XP', el('#sidebarXP').textContent !== '0 XP');
    nav('teacher');
    click('[data-edit-set]');
    el('#setWords').value += '\nsân trường';
    click('#setForm [type=submit]');
    check('Editing words starts a fresh version', !el('.managed-set details') && el('.managed-set').textContent.includes('3 thẻ'));
    click('#questionNew');
    el('#questionType').value = 'fill';
    el('#questionType').dispatchEvent(new Event('change'));
    el('#questionTopic').value = 'l2-03';
    el('#questionPrompt').value = 'Em thích quả ___oài.';
    el('#questionAnswer').value = 'x';
    el('#questionNote').value = 'Xoài viết với x.';
    click('#questionSave');
    check('Teacher authors fill question', el('#bankEntries').textContent.includes('Em thích quả'));
    const importStatus = el('#questionStatus');
    const questions = new DataTransfer();
    questions.items.add(new File([JSON.stringify([{type:'sort', grades:[2], topic:'l2-03',
      prompt:'Nhập kho thử', answer:'s', choices:['s','x']}])], 'test.json', {type:'application/json'}));
    el('#questionImport').files = questions.files;
    el('#questionImport').dispatchEvent(new Event('change'));
    for (let i = 0; i < 100 && !importStatus.textContent; i++) await new Promise(resolve => setTimeout(resolve,10));
    check('Validated questions imported as drafts', importStatus.textContent.includes('1 câu') && el('#bankEntries').textContent.includes('Bản nháp'));
    click('[data-class-student]');
    check('Teacher sees completed sessions', all('.class-history li').length > 5);
    el('#studentNote').value = 'Em hãy luyện thêm s/x nhé.';
    click('#studentNoteForm button');
    check('Teacher note persists', el('#classStudentDetail .teacher-notes').textContent.includes('luyện thêm'));
    nav('profile');
    check('Learner sees teacher note', el('.teacher-notes').textContent.includes('luyện thêm'));
    nav('games');
    click('[data-view=practice].primary-btn');
    el('#practiceTopic').value = 'l2-03';
    el('#practiceType').value = 'fill';
    el('#practiceType').dispatchEvent(new Event('change',{bubbles:true}));
    click('#practiceFilter button');
    let practiced = 0, customSeen = false;
    while (el('#practiceAnswer') && practiced++ < 8) {
      const custom = el('.question-prompt').textContent.includes('quả');
      customSeen ||= custom;
      el('#practiceAnswer').value = custom ? 'x' : 's';
      el('#practiceAnswer').dispatchEvent(new Event('input'));
      click('#plCheck');
      check('Immediate feedback in typed practice', el('#plSheet').classList.contains('good'));
      if (custom) check('Teacher explanation shown', el('#plSheet').textContent.includes('Xoài viết với x.'));
      click('#plCont');
    }
    check('Published question connects to learner', customSeen && fits() && visible(el('.lesson-complete')));
    click('#home');
    for (const [type, topic] of [['picture','l2-03'], ['order','l2-03'], ['sort','l2-03'], ['listen','l2-01']]) {
      nav('games');
      click('[data-view=practice].primary-btn');
      el('#practiceTopic').value = topic;
      el('#practiceType').value = type;
      el('#practiceType').dispatchEvent(new Event('change',{bubbles:true}));
      click('#practiceFilter button');
      const part = browser.eval('Q.items[Q.i]');
      if (type === 'picture') {
        await el('.practice-image').decode();
        check('Illustrated question loads a real image', el('.practice-image').naturalWidth > 0);
      }
      if (type === 'listen') {
        check('Listen and slow controls do not reveal the answer', !!el('#practiceListen') && !!el('#practiceSlow') && !el('#plCard').textContent.includes(part.answer));
        el('#practiceAnswer').value = part.answer.normalize('NFD');
        el('#practiceAnswer').dispatchEvent(new Event('input'));
      } else if (type === 'order') {
        for (const word of part.answer.split(' ')) click('[data-practice-token="' + word + '"]:not(:disabled)');
      } else {
        all('[data-answer]').find(b => b.dataset.answer === part.answer).click();
      }
      click('#plCheck');
      check('Correct feedback for ' + type, el('#plSheet').classList.contains('good'));
      browser.eval('closeModal()');
    }
    nav('home');
    click('[data-season-pick=tet]');
    check('Tết has its own scene and live canvas', doc().documentElement.dataset.season === 'tet' && el('.cd-art') && el('.cd-fx') && !el('.noel-lights'));
    click('[data-season-pick=trungthu]');
    check('Mid-Autumn has its own scene', doc().documentElement.dataset.season === 'trungthu' && el('.cd-trungthu'));
    click('[data-season-pick=noel]');
    check('Noel returns with snow', doc().documentElement.dataset.season === 'noel' && el('.noel-snow') && !el('.cd-fx'));
    frame.contentWindow.eval("const t = new Date(); t.setDate(t.getDate()-1); S.lastDay = dayKey(t); S.streak = 2; S.bestStreak = 2; StreakRoom.award(); save();");
    click('.streak-pill[data-view=streak]');
    check('Day 3 unlocks first costume', !el('[data-outfit="3"]').disabled && el('[data-outfit="10"]').disabled);
    click('[data-outfit="3"]');
    check('Costume equips on avatar', !!el('.profile-button .avatar').dataset.costume);
    frame.contentWindow.eval("StreakRoom.award(); save();");
    check('Repeated practice on same date keeps streak', el('#streakCount').textContent === '3');
    nav('home');
    check('Home fits after all flows', fits());
    // Capture a clean example of the first screen in the isolated browser profile.
    frame.contentWindow.localStorage.removeItem('vuonchu.v2');
    await loadApp();
    report.complete = true;
  } catch (error) {
    report.failed.push(error.stack || String(error));
  } finally {
    document.querySelector('#report').textContent = JSON.stringify(report);
  }
})();
