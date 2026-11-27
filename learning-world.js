/* Nhiệm vụ cá nhân và truyện mở khóa theo câu đúng. Nạp sau app.js. */
'use strict';
const StoryQuest = (() => {
  const MASCOT = 'assets/tho-tham-hiem-vuon-chu.png';
  const chapters = window.VUON_TRUYEN;
  const finished = id => Boolean(S.storyProgress?.[id]?.done);
  const completedChapters = () => chapters.filter(chapter => finished(chapter.id)).length;
  const forestOpen = () => chapters.every(chapter => finished(chapter.id));
  const storyArt = (chapter, index) => 'assets/vuon-truyen/' + chapter.id + '-' + (index + 1) + '.webp';
  const groveArt = 'assets/vuon-truyen/secret.webp';
  const day = () => typeof dayKey === 'function' ? dayKey() : new Date().toISOString().slice(0,10);
  const pending = () => Object.keys(S.review || {}).filter(key => itemOf(key));
  const wrongCount = key => Number(S.wrongLog?.[key] || 0);
  function reviewItems() {
    return pending().map(key => {
      const item = itemOf(key), note = S.review[key] || {};
      return item ? { key, item, score:wrongCount(key) * 10 + (2 - Number(note.box || 0)) * 3 + (Date.now() - Number(note.at || 0) < 86400000 ? 2 : 0) } : null;
    }).filter(Boolean).sort((a,b) => b.score - a.score);
  }
  function topicNeeds() {
    const counts = {};
    reviewItems().forEach(row => { const topic = getTopic(row.item._t); if (topic) counts[topic.id] = (counts[topic.id] || 0) + 1; });
    return Object.entries(counts).map(([id,count]) => ({ topic:getTopic(id), count })).sort((a,b) => b.count - a.count);
  }
  function selectedQuestions(limit = 5) {
    const weakTopics = topicNeeds().map(x => x.topic).filter(Boolean);
    const pools = weakTopics.concat(openTopics()).filter((topic,index,list) => list.findIndex(t => t.id === topic.id) === index);
    const topicPool = topic => topic.baiTap.map((q,i) => Object.assign({},q,{ _t:topic.id, _i:i })).concat(genItems(topic,undefined,2));
    const allowed = item => !(item.loai === 'ngheViet' && Number(S.grade) < 2);
    const focused = weakTopics.flatMap(topic => topicPool(topic).filter(allowed));
    const all = pools.flatMap(topic => topicPool(topic).filter(allowed));
    const selected = freshQuestionPick(focused, limit, { allowSeen: false });
    const used = new Set(selected.map(questionFingerprint));
    if (selected.length < limit) selected.push(...freshQuestionPick(all, limit - selected.length, { allowSeen: false, excludeKeys: used }));
    selected.forEach(item => used.add(questionFingerprint(item)));
    if (selected.length < limit) selected.push(...freshQuestionPick(all, limit - selected.length, { excludeKeys: used }));
    return selected.slice(0,limit).map(vary);
  }
  function homeCards() {
    const weak = topicNeeds()[0], isDone = S.adaptiveDay === day();
    const completed = completedChapters();
    return '<section class="quest-portals" aria-label="Khám phá nhiệm vụ mới">' +
      '<button class="quest-portal quest-portal-mission" data-view="adaptive"><span class="quest-portal-copy"><small>THỬ THÁCH RIÊNG · ' + (isDone ? 'ĐÃ XONG HÔM NAY' : '5 CÂU NGẮN') + '</small><b>' + (isDone ? 'Thỏ Lá tự hào về em!' : 'Thám tử chữ tìm điểm yếu') + '</b><span>' + (weak ? 'Đang luyện: ' + esc(weak.topic.ten) : 'Chưa có từ sai — Thỏ Lá chọn bài vừa sức cho em.') + '</span><em>' + (isDone ? 'Ôn thêm một lượt →' : 'Bắt đầu nhiệm vụ →') + '</em></span><img src="' + MASCOT + '" alt="Thỏ Lá dẫn đường" /></button>' +
      '<button class="quest-portal quest-portal-story" data-view="stories"><span class="quest-portal-copy"><small>TRUYỆN TƯƠNG TÁC · ' + completed + '/' + chapters.length + ' CHƯƠNG</small><b>Đi tìm Khu Rừng Bí Mật</b><span>' + (forestOpen() ? 'Cánh cổng bí mật đã mở!' : esc(chapters[Math.min(completed,chapters.length - 1)].title) + ' đang chờ em.') + '</span><em>Mở Vườn truyện →</em></span><span class="quest-book-art" aria-hidden="true">📖<i>✦</i><i>✧</i></span></button>' +
      '</section>';
  }
  function adaptivePage() {
    const needs = topicNeeds(), rows = needs.slice(0,3), done = S.adaptiveDay === day();
    const count = pending().length;
    const catchRule = window.ChaseRun ? ' Sai ' + ChaseRun.missLimit + ' câu thì Sói bắt kịp.' : '';
    return '<div class="learning-world adaptive-world">' +
      '<section class="world-hero adaptive-hero"><div class="world-hero-copy"><span class="world-kicker">NHIỆM VỤ CỦA RIÊNG EM · LỚP ' + esc(S.grade) + '</span><h1>Thám tử chữ</h1><p>Thỏ Lá chọn câu mới ở nhóm chữ em cần luyện. Câu đúng giúp Thỏ chạy nhanh hơn.' + catchRule + '</p><button class="world-cta" id="adaptiveStart">' + (done ? 'Ôn thêm cùng Thỏ Lá' : 'Bắt đầu nhiệm vụ · 5 câu') + ' <span>→</span></button><small class="world-reward">' + (done ? 'Nhiệm vụ hôm nay đã hoàn thành' : 'Trả lời đúng cả 5 câu để Thỏ thoát sói!') + '</small></div><div class="world-mascot-wrap"><span class="world-spark spark-a">✦</span><span class="world-spark spark-b">✧</span><img src="' + MASCOT + '" alt="Thỏ Lá đang vẫy tay" /></div><div class="world-cloud cloud-one"></div><div class="world-cloud cloud-two"></div></section>' +
      '<div class="world-metrics"><div><b>' + count + '</b><span>từ đang chờ ôn</span></div><div><b>' + rows.length + '</b><span>nhóm chữ cần chú ý</span></div><div><b>' + (done ? '✓' : '5') + '</b><span>câu mới mỗi lượt</span></div></div>' +
      '<section class="world-panel"><header><div><small>BẢN ĐỒ DẤU VẾT</small><h2>Thỏ Lá đang giúp em luyện gì?</h2></div><span class="world-panel-icon">🔍</span></header>' +
      (rows.length ? '<div class="weak-list">' + rows.map((row,index) => '<article class="weak-row"><span class="weak-number">0' + (index + 1) + '</span><div><b>' + esc(row.topic.ten) + '</b><small>' + row.count + ' câu đang cần luyện lại</small></div><span class="weak-stamp">' + ['🌱','🌼','🍃'][index] + '</span></article>').join('') + '</div>' : '<div class="world-empty"><span>🌷</span><b>Chưa có dấu vết sai — thật tuyệt!</b><p>Nhiệm vụ sẽ chọn vài câu mới trong các bài em đang học để giữ chữ luôn chắc nhé.</p></div>') +
      '<p class="world-footnote">Câu sai vẫn được lưu vào sổ ôn. Em có thể thử lại tới khi mở được dấu chân tiếp theo.</p></section>' +
      '<button class="world-back" data-view="games">← Quay lại trò chơi</button></div>';
  }
  function chapterLocked(index) {
    return chapters.slice(0, index).some(chapter => !finished(chapter.id));
  }
  function storiesPage() {
    const open = forestOpen(), completed = completedChapters();
    return '<div class="learning-world forest-book"><section class="forest-cover">' +
      '<img src="' + storyArt(chapters[0], 0) + '" alt="" fetchpriority="high">' +
      '<div><h1>Vườn truyện</h1><p>Cùng Thỏ Lá sửa chữ ở từng chốt. Tìm đủ ba bảo vật để mở Khu Rừng Bí Mật.</p>' +
      '<span aria-label="Đã hoàn thành ' + completed + ' trên ' + chapters.length + ' chương">' + completed + ' / ' + chapters.length + ' chương đã khám phá</span></div></section>' +
      '<div class="forest-chapters">' + chapters.map((chapter, index) => {
        const done = finished(chapter.id), locked = !done && chapterLocked(index);
        const status = done ? 'Đã tìm thấy ' + chapter.relic : locked ? 'Hoàn thành chương trước để mở' : 'Gặp ba bạn dẫn đường';
        return '<article class="forest-chapter' + (locked ? ' is-locked' : '') + '">' +
          '<div class="forest-chapter-image"><img src="' + storyArt(chapter, 0) + '" alt="" loading="lazy"></div>' +
          '<div class="forest-chapter-info"><h2>' + esc(chapter.title) + '</h2><p>' + esc(chapter.subtitle) + '</p><small>' + esc(status) + '</small>' +
          '<button class="forest-enter" data-story-start="' + chapter.id + '"' + (locked ? ' disabled' : '') + '>' +
          (done ? 'Đọc lại' : locked ? 'Chưa mở' : 'Bước vào truyện →') + '</button></div></article>';
      }).join('') + '</div>' +
      '<section class="forest-unlock' + (open ? ' is-open' : '') + '"><img src="' + groveArt + '" alt="" loading="lazy">' +
      '<div><h2>Khu Rừng Bí Mật</h2><p>' + (open ? 'Ba bảo vật đã mở lối. Mỗi điểm sáng cất một truyện ngắn.' : 'Hoàn thành cả ba chương để khám phá khu rừng sau cánh cổng.') +
      '</p><button data-view="story-grove" class="forest-enter"' + (open ? '' : ' disabled') + '>' + (open ? 'Khám phá khu rừng →' : '🔒 Chưa mở') + '</button></div></section></div>';
  }
  function start(id) {
    const index = chapters.findIndex(chapter => chapter.id === id);
    if (index < 0) return;
    if (!finished(id) && chapterLocked(index)) { toast('Em hoàn thành chương trước để mở chương này nhé!'); return; }
    const chapter = chapters[index];
    const items = chapter.scenes.map(scene => ({
      loai: 'timLoi', cau: Number(S.grade) === 1 ? scene.short : scene.paragraph,
      tuSai: scene.bad, tuDung: scene.good, giaiThich: scene.hint
    }));
    startQuiz({ kind: 'storybook', title: chapter.title, icon: chapter.icon, storyId: id, items });
  }
  function complete(id, won) {
    if (!won || finished(id) || !chapters.some(chapter => chapter.id === id)) return false;
    S.storyProgress = S.storyProgress || {};
    S.storyProgress[id] = { done: true, completedAt: Date.now() };
    return true;
  }
  function playerFrame(q) {
    const chapter = chapters.find(row => row.id === q.storyId);
    const scene = chapter.scenes[q.i], total = chapter.scenes.length;
    if (q.i + 1 < total) new Image().src = storyArt(chapter, q.i + 1);
    return '<section class="forest-panel' + (q.storyRetry ? ' is-retry' : '') + '" aria-label="' + esc(scene.place) + '">' +
      '<div class="forest-stage"><img src="' + storyArt(chapter, q.i) + '" alt="Thỏ Lá gặp ' + esc(scene.guide) + ' tại ' + esc(scene.place) + '">' +
      '<div class="forest-plot"><b>' + esc(scene.place) + '</b><span>Chốt ' + (q.i + 1) + ' / ' + total + '</span></div>' +
      '<span class="forest-light" aria-hidden="true"></span><span class="forest-traveler" aria-hidden="true"><img src="assets/chase-rabbit-stride.webp" alt=""></span></div>' +
      '<div class="forest-dialogue"><span aria-hidden="true">' + scene.icon + '</span><div><b>' + esc(scene.guide) + '</b><p>' +
      esc(scene.line) + '</p></div></div></section>';
  }
  function react(q, right) {
    q.storyRetry = !right;
    if (!right) return 'Mình đọc lại đoạn này nhé!';
    const scene = chapters.find(row => row.id === q.storyId).scenes[q.i];
    document.querySelector('.forest-panel')?.classList.add('is-open');
    return scene.praise;
  }
  function discovery(id) {
    const chapter = chapters.find(row => row.id === id);
    if (!chapter) return '';
    return '<div class="forest-relic"><span aria-hidden="true">' + chapter.icon + '</span><div><small>Đã tìm thấy</small><b>' + esc(chapter.relic) + '</b></div></div>';
  }
  function nextAction(id) {
    const index = chapters.findIndex(chapter => chapter.id === id);
    if (index < 0) return '';
    const next = chapters[index + 1];
    return '<button class="primary-btn big" id="storyNext">' + (next ? 'Đi tới ' + esc(next.title) + ' →' : 'Khám phá Khu Rừng Bí Mật →') + '</button>';
  }
  function follow(id) {
    const index = chapters.findIndex(chapter => chapter.id === id);
    if (index < 0 || !finished(id)) return;
    closeModal();
    const next = chapters[index + 1];
    if (next) start(next.id);
    else go('story-grove');
  }
  function grovePage() {
    if (!forestOpen()) return '<section class="world-panel"><h1>Khu Rừng Bí Mật</h1><p>Em cần tìm đủ ba bảo vật trong Vườn truyện để vào rừng.</p><button class="world-back" data-view="stories">Về Vườn truyện</button></section>';
    const positions = [[11, 44], [64, 38], [88, 32]];
    return '<div class="learning-world forest-grove"><div class="forest-grove-heading"><button class="world-back" data-view="stories">← Vườn truyện</button>' +
      '<h1>Khu Rừng Bí Mật</h1><p>Chạm vào một điểm sáng để mở truyện của bảo vật đó.</p></div>' +
      '<div class="forest-grove-stage"><img src="' + groveArt + '" alt="Khu rừng với mầm vàng, tàu mây và hồ đom đóm">' +
      '<span class="forest-magic" aria-hidden="true"></span>' +
      chapters.map((chapter, index) => '<button type="button" class="forest-hotspot" data-story-relic="' + chapter.id + '" style="--place-x:' + positions[index][0] + '%;--place-y:' + positions[index][1] + '%" aria-haspopup="dialog" aria-label="Đọc truyện ' +
        esc(chapter.tale.title) + '">' + chapter.icon + '</button>').join('') + '</div></div>';
  }
  function openTale(chapter, opener) {
    const tale = chapter.tale;
    openModal(esc(tale.title), esc(chapter.relic), '<div class="forest-reader-page"></div>' +
      '<nav class="forest-reader-controls" aria-label="Lật trang truyện"><button type="button" class="forest-reader-back">‹ Trang trước</button>' +
      '<span class="forest-reader-count"></span><button type="button" class="forest-enter forest-reader-next"></button></nav>', 'forest-reader');
    const reader = $('#modalRoot .forest-reader');
    const pageRoot = reader.querySelector('.forest-reader-page');
    const count = reader.querySelector('.forest-reader-count');
    const back = reader.querySelector('.forest-reader-back');
    const next = reader.querySelector('.forest-reader-next');
    let pageIndex = 0;

    function showPage() {
      const page = tale.pages[pageIndex], last = pageIndex === tale.pages.length - 1;
      const scene = chapter.scenes[pageIndex];
      pageRoot.innerHTML = '<img class="forest-reader-art" src="' + storyArt(chapter, pageIndex) + '" alt="' +
        esc('Thỏ Lá và ' + scene.guide + ' tại ' + scene.place) + '">' +
        '<article class="forest-reader-text"><h3 tabindex="-1">' + esc(page.heading) + '</h3>' +
        page.paragraphs.map(paragraph => '<p>' + esc(paragraph) + '</p>').join('') + '</article>';
      count.textContent = 'Trang ' + (pageIndex + 1) + ' / ' + tale.pages.length;
      pageRoot.querySelector('h3').setAttribute('aria-description', count.textContent);
      back.disabled = pageIndex === 0;
      next.textContent = last ? 'Về khu rừng' : 'Trang sau ›';
      reader.scrollTop = 0;
      pageRoot.querySelector('h3').focus({ preventScroll: true });
      if (!last) new Image().src = storyArt(chapter, pageIndex + 1);
    }

    back.onclick = () => { if (pageIndex > 0) { pageIndex--; showPage(); } };
    next.onclick = () => {
      if (pageIndex === tale.pages.length - 1) closeModal();
      else { pageIndex++; showPage(); }
    };
    onModalClose = () => { if (opener.isConnected) opener.focus({ preventScroll: true }); };
    showPage();
  }
  function bindGrove() {
    const stage = $('.forest-grove-stage');
    if (!stage) return;
    stage.querySelectorAll('[data-story-relic]').forEach(button => button.onclick = () => {
      if (!forestOpen() || !$('#modalRoot').hidden) return;
      const chapter = chapters.find(row => row.id === button.dataset.storyRelic);
      stage.querySelectorAll('[data-story-relic]').forEach(choice => choice.classList.toggle('is-selected', choice === button));
      const magic = stage.querySelector('.forest-magic');
      magic.replaceWith(magic.cloneNode());
      stage.dataset.discovery = chapter.id;
      openTale(chapter, button);
      sfx('good');
    });
  }
  function beginAdaptive() {
    const items = selectedQuestions(5,false);
    if (!items.length) { toast('Chưa có câu phù hợp trong lộ trình lớp này.'); return; }
    startQuiz({ kind:'adaptive', title:'Nhiệm vụ Thám tử chữ', icon:'🕵️', subtitle:'5 câu do Thỏ Lá chọn cho em', items });
  }
  function bindAdaptive() { $('#adaptiveStart')?.addEventListener('click',beginAdaptive); }
  function bindStories() { document.querySelectorAll('[data-story-start]').forEach(button => button.onclick = () => start(button.dataset.storyStart)); }
  registerView('adaptive','Nhiệm vụ của riêng em',adaptivePage,bindAdaptive);
  registerView('stories','Vườn truyện',storiesPage,bindStories);
  registerView('story-grove','Khu Rừng Bí Mật',grovePage,bindGrove);
  return { homeCards, playerFrame, react, complete, discovery, nextAction, follow, start, beginAdaptive };
})();
window.StoryQuest = StoryQuest;
if (typeof render === 'function') render(); // app.js dựng trang chủ trước khi nạp các module trò chơi
