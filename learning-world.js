/* Nhiệm vụ cá nhân và truyện mở khóa theo câu đúng. Nạp sau app.js. */
'use strict';
const StoryQuest = (() => {
  const MASCOT = 'assets/tho-tham-hiem-vuon-chu.png';
  const routes = window.STORY_ROUTES;
  const stories = new Map(routes.flatMap(route => route.chapters.map((chapter, index) => [chapter.id, { chapter, route, index }])));
  const routeFor = id => routes.find(route => route.id === id);
  const currentRoute = () => routeFor(S.storyCharacter) || routes[0];
  const finished = id => Boolean(S.storyProgress?.[id]?.done);
  const completedChapters = route => route.chapters.filter(chapter => finished(chapter.id)).length;
  const routeOpen = route => route.chapters.every(chapter => finished(chapter.id));
  const storyArt = (chapter, index) => 'assets/vuon-truyen/' + chapter.id + '-' + (index + 1) + '.webp';
  const routeArt = (route, field) => 'assets/vuon-truyen/' + route[field] + '.webp';
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
    const route = currentRoute();
    return '<section class="quest-portals" aria-label="Khám phá nhiệm vụ mới">' +
      '<button class="quest-portal quest-portal-mission" data-view="adaptive"><span class="quest-portal-copy"><small>THỬ THÁCH RIÊNG · ' + (isDone ? 'ĐÃ XONG HÔM NAY' : '5 CÂU NGẮN') + '</small><b>Thám tử chữ</b><span>' + (weak ? 'Đang luyện: ' + esc(weak.topic.ten) : 'Chọn Thỏ Lá, Cầu thủ hoặc Nhà vua.') + '</span><em>Chọn nhân vật →</em></span><img src="' + MASCOT + '" alt="" /></button>' +
      '<button class="quest-portal quest-portal-story" data-view="stories"><span class="quest-portal-copy"><small>TRUYỆN TƯƠNG TÁC · ' + routes.length + ' HÀNH TRÌNH</small><b>Đi tìm Khu Rừng Bí Mật</b><span>' + (routeOpen(route) ? esc(route.destination) + ' đã mở!' : 'Cùng Thỏ Lá, Cầu thủ và Nhà vua khám phá.') + '</span><em>Mở Vườn truyện →</em></span><span class="quest-book-art" aria-hidden="true">📖<i>✦</i><i>✧</i></span></button>' +
      '</section>';
  }
  function adaptivePage() {
    const needs = topicNeeds(), rows = needs.slice(0,3), done = S.adaptiveDay === day();
    const count = pending().length;
    return '<div class="learning-world adaptive-world">' +
      '<form class="quest-select" id="adaptiveSelect"><h1>Thám tử chữ</h1><p>Trả lời đúng để giúp bạn đồng hành về đích.</p>' +
      '<fieldset class="quest-options"><legend>Em muốn chơi cùng ai?</legend><div class="quest-option-grid">' + QuestJourney.chooseMarkup(S.adaptiveCharacter) + '</div></fieldset>' +
      '<button class="world-cta" id="adaptiveStart" type="submit">' + (done ? 'Chơi thêm một lượt' : 'Bắt đầu · 5 câu') + ' <span aria-hidden="true">→</span></button></form>' +
      '<div class="world-metrics"><div><b>' + count + '</b><span>từ đang chờ ôn</span></div><div><b>' + rows.length + '</b><span>nhóm chữ cần chú ý</span></div><div><b>' + (done ? '✓' : '5') + '</b><span>câu mới mỗi lượt</span></div></div>' +
      '<section class="world-panel"><header><div><small>BẢN ĐỒ DẤU VẾT</small><h2>Em đang luyện gì?</h2></div><span class="world-panel-icon">🔍</span></header>' +
      (rows.length ? '<div class="weak-list">' + rows.map((row,index) => '<article class="weak-row"><span class="weak-number">0' + (index + 1) + '</span><div><b>' + esc(row.topic.ten) + '</b><small>' + row.count + ' câu đang cần luyện lại</small></div><span class="weak-stamp">' + ['🌱','🌼','🍃'][index] + '</span></article>').join('') + '</div>' : '<div class="world-empty"><span>🌷</span><b>Chưa có dấu vết sai — thật tuyệt!</b><p>Nhiệm vụ sẽ chọn vài câu mới trong các bài em đang học để giữ chữ luôn chắc nhé.</p></div>') +
      '<p class="world-footnote">Câu sai vẫn được lưu vào sổ ôn. Em có thể thử lại tới khi mở được dấu chân tiếp theo.</p></section>' +
      '<button class="world-back" data-view="games">← Quay lại trò chơi</button></div>';
  }
  function chapterLocked(route, index) {
    return route.chapters.slice(0, index).some(chapter => !finished(chapter.id));
  }
  function routeChoices(selected) {
    return '<section class="forest-picker" aria-label="Chọn bạn đồng hành"><h1>Vườn truyện</h1><p>Chọn bạn đồng hành để tìm bảo vật và mở bản đồ bí mật.</p>' +
      '<div class="forest-route-grid" role="group" aria-label="Bạn đồng hành">' + routes.map(route =>
        '<button class="forest-route forest-skin-' + route.skin + '" type="button" data-story-route="' + route.id + '" aria-pressed="' + (route === selected) + '">' +
        '<span class="forest-route-thumb"><img src="' + routeArt(route, 'map') + '" alt="" decoding="async"></span>' +
        '<span class="forest-route-label"><b>' + esc(route.name) + '</b><small>' + completedChapters(route) + ' / ' + route.chapters.length + ' chương</small></span></button>'
      ).join('') + '</div></section>';
  }
  function storiesPage() {
    const route = currentRoute(), chapters = route.chapters;
    const open = routeOpen(route), completed = completedChapters(route);
    return '<div class="learning-world forest-book">' + routeChoices(route) + '<div class="forest-route-content forest-skin-' + route.skin + '">' +
      '<section class="forest-cover"><img src="' + routeArt(route, 'cover') + '" alt="" fetchpriority="high">' +
      '<div><h2>' + esc(route.title) + '</h2><p>' + esc(route.description) + '</p>' +
      '<span>' + completed + ' / ' + chapters.length + ' bảo vật đã tìm thấy</span>' +
      (open ? '<button type="button" data-view="story-grove" class="forest-enter forest-cover-open">Mở bản đồ →</button>' : '') + '</div></section>' +
      '<div class="forest-chapters">' + chapters.map((chapter, index) => {
        const done = finished(chapter.id), locked = !done && chapterLocked(route, index);
        const status = done ? 'Đã tìm thấy ' + chapter.relic : locked ? 'Hoàn thành chương trước để mở' : 'Gặp ba bạn dẫn đường';
        return '<article class="forest-chapter' + (locked ? ' is-locked' : '') + '">' +
          '<div class="forest-chapter-image"><img src="' + storyArt(chapter, 0) + '" alt="" loading="lazy"></div>' +
          '<div class="forest-chapter-info"><h2>' + esc(chapter.title) + '</h2><p>' + esc(chapter.subtitle) + '</p><small>' + esc(status) + '</small>' +
          '<button class="forest-enter" data-story-start="' + chapter.id + '"' + (locked ? ' disabled' : '') + '>' +
          (done ? 'Đọc lại' : locked ? 'Chưa mở' : 'Bước vào truyện →') + '</button></div></article>';
      }).join('') + '</div>' +
      '<section class="forest-unlock' + (open ? ' is-open' : '') + '"><img src="' + routeArt(route, 'map') + '" alt="" loading="lazy">' +
      '<div><h2>' + esc(route.destination) + '</h2><p>' + (open ? 'Mỗi điểm sáng cất một truyện ngắn.' : 'Tìm đủ ba bảo vật để mở bản đồ này.') +
      '</p><button data-view="story-grove" class="forest-enter"' + (open ? '' : ' disabled') + '>' + (open ? 'Khám phá bản đồ →' : '🔒 Chưa mở') + '</button></div></section></div></div>';
  }
  function start(id) {
    const story = stories.get(id);
    if (!story) return;
    const { route, chapter, index } = story;
    if (!finished(id) && chapterLocked(route, index)) { toast('Em hoàn thành chương trước để mở chương này nhé!'); return; }
    const items = chapter.scenes.map(scene => ({
      loai: 'timLoi', cau: Number(S.grade) === 1 ? scene.short : scene.paragraph,
      tuSai: scene.bad, tuDung: scene.good, giaiThich: scene.hint
    }));
    startQuiz({ kind: 'storybook', title: chapter.title, icon: chapter.icon, storyId: id, items });
  }
  function complete(id, won) {
    if (!won || finished(id) || !stories.has(id)) return false;
    S.storyProgress = S.storyProgress || {};
    S.storyProgress[id] = { done: true, completedAt: Date.now() };
    return true;
  }
  function actionFor(q) {
    const { route, chapter, index } = stories.get(q.storyId);
    const turn = route.chapters.slice(0, index).reduce((sum, entry) => sum + entry.scenes.length, q.i);
    return StoryAction.plan(route, turn, index === route.chapters.length - 1, q.i >= chapter.scenes.length - 1);
  }
  function playerFrame(q) {
    const { route, chapter } = stories.get(q.storyId);
    const scene = chapter.scenes[q.i], total = chapter.scenes.length;
    const art = scene.preview ? 'assets/vuon-truyen/' + scene.preview + '.webp' : storyArt(chapter, q.i);
    const artAlt = scene.preview ? scene.place : route.name + ' cùng ' + scene.guide + ' tại ' + scene.place;
    if (q.i + 1 < total) new Image().src = storyArt(chapter, q.i + 1);
    return '<section class="forest-panel forest-skin-' + route.skin + (q.storyRetry ? ' is-retry' : '') + '" aria-label="' + esc(scene.place) + '">' +
      '<div class="forest-stage"><img src="' + art + '" alt="' + esc(artAlt) + '">' +
      '<div class="forest-plot"><b>' + esc(scene.place) + '</b><span>Chốt ' + (q.i + 1) + ' / ' + total + '</span></div>' +
      '<span class="forest-light" aria-hidden="true"></span>' + StoryAction.markup(route, actionFor(q)) + '</div>' +
      '<div class="forest-dialogue"><span aria-hidden="true">' + scene.icon + '</span><div><b>' + esc(scene.guide) + '</b><p>' +
      esc(scene.line) + '</p></div></div></section>';
  }
  function react(q, right) {
    q.storyRetry = !right;
    if (!right) return 'Mình đọc lại đoạn này nhé!';
    const scene = stories.get(q.storyId).chapter.scenes[q.i];
    document.querySelector('.forest-panel')?.classList.add('is-open');
    return scene.praise;
  }
  function discovery(id) {
    const chapter = stories.get(id)?.chapter;
    if (!chapter) return '';
    return '<div class="forest-relic"><span aria-hidden="true">' + chapter.icon + '</span><div><small>Đã tìm thấy</small><b>' + esc(chapter.relic) + '</b></div></div>';
  }
  function nextAction(id) {
    const story = stories.get(id);
    if (!story) return '';
    const next = story.route.chapters[story.index + 1];
    return '<button class="primary-btn big" id="storyNext">' + (next ? 'Đi tới ' + esc(next.title) : 'Khám phá ' + esc(story.route.destination)) + ' →</button>';
  }
  function follow(id) {
    const story = stories.get(id);
    if (!story || !finished(id)) return;
    closeModal();
    const next = story.route.chapters[story.index + 1];
    if (next) start(next.id);
    else {
      selectRoute(story.route);
      go('story-grove');
    }
  }
  function grovePage() {
    const route = currentRoute();
    if (!routeOpen(route)) return '<section class="world-panel"><h1>' + esc(route.destination) + '</h1><p>Em cần tìm đủ ba bảo vật của chuyến đi này để mở bản đồ.</p><button class="world-back" data-view="stories">Về Vườn truyện</button></section>';
    return '<div class="learning-world forest-grove forest-skin-' + route.skin + '"><div class="forest-grove-heading"><button class="world-back" data-view="stories">← Vườn truyện</button>' +
      '<h1>' + esc(route.destination) + '</h1><p>Chạm một điểm sáng hoặc chọn truyện bên dưới.</p></div>' +
      '<div class="forest-grove-stage"><div class="forest-map-camera"><img src="' + routeArt(route, 'map') + '" alt="' + esc(route.mapAlt) + '">' +
      '<canvas class="forest-ambient" aria-hidden="true"></canvas>' +
      '<span class="forest-magic" aria-hidden="true"></span>' +
      route.chapters.map(chapter => '<button type="button" class="forest-hotspot" data-story-relic="' + chapter.id + '" style="--place-x:' + chapter.point[0] + '%;--place-y:' + chapter.point[1] + '%" aria-haspopup="dialog" aria-label="Đọc truyện ' +
        esc(chapter.tale.title) + '">' + chapter.icon + '</button>').join('') + '</div></div>' +
      '<div class="forest-tale-list">' + route.chapters.map(chapter => '<button class="forest-tale-link" type="button" data-tale-link="' +
        chapter.id + '" aria-haspopup="dialog"><span aria-hidden="true">' + chapter.icon + '</span><b>' + esc(chapter.tale.title) + '</b><span aria-hidden="true">›</span></button>').join('') + '</div></div>';
  }
  function openTale(route, chapter, opener, camera) {
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

    function showPage(direction) {
      const page = tale.pages[pageIndex], last = pageIndex === tale.pages.length - 1;
      const scene = chapter.scenes[pageIndex];
      pageRoot.className = 'forest-reader-page' + (direction ? ' is-turning turn-' + direction : '');
      pageRoot.innerHTML = '<div class="forest-paper"><img class="forest-reader-art" src="' + storyArt(chapter, pageIndex) + '" alt="' +
        esc(route.name + ' cùng ' + scene.guide + ' tại ' + scene.place) + '">' +
        '<article class="forest-reader-text"><h3 tabindex="-1">' + esc(page.heading) + '</h3>' +
        page.paragraphs.map(paragraph => '<p>' + esc(paragraph) + '</p>').join('') + '</article></div>';
      count.textContent = 'Trang ' + (pageIndex + 1) + ' / ' + tale.pages.length;
      pageRoot.querySelector('h3').setAttribute('aria-description', count.textContent);
      back.disabled = pageIndex === 0;
      next.textContent = last ? route.back : 'Trang sau ›';
      reader.scrollTop = 0;
      pageRoot.querySelector('h3').focus({ preventScroll: true });
      if (!last) new Image().src = storyArt(chapter, pageIndex + 1);
    }

    back.onclick = () => { if (pageIndex > 0) { pageIndex--; showPage('back'); } };
    next.onclick = () => {
      if (pageIndex === tale.pages.length - 1) closeModal();
      else { pageIndex++; showPage('forward'); }
    };
    onModalClose = () => {
      if (camera?.playState === 'finished') {
        camera.reverse();
        camera.finished.then(() => camera.cancel(), () => {});
      }
      if (opener.isConnected) opener.focus({ preventScroll: true });
    };
    showPage();
  }
  function bindGrove() {
    const stage = $('.forest-grove-stage');
    if (!stage) return;
    const route = currentRoute(), hotspots = [...stage.querySelectorAll('[data-story-relic]')];
    window.StoryCinema?.mount(stage, route.id);
    $$('.forest-grove [data-story-relic],.forest-grove [data-tale-link]').forEach(button => button.onclick = async () => {
      if (!routeOpen(route) || !$('#modalRoot').hidden || stage.hasAttribute('aria-busy')) return;
      const { chapter } = stories.get(button.dataset.storyRelic || button.dataset.taleLink);
      hotspots.forEach(choice => choice.classList.toggle('is-selected', choice.dataset.storyRelic === chapter.id));
      const magic = stage.querySelector('.forest-magic');
      stage.style.setProperty('--place-x', chapter.point[0] + '%');
      stage.style.setProperty('--place-y', chapter.point[1] + '%');
      magic.replaceWith(magic.cloneNode());
      stage.dataset.discovery = chapter.id;
      sfx('good');
      const camera = button.dataset.storyRelic && window.StoryCinema?.approach(stage, chapter.point);
      if (camera) {
        stage.setAttribute('aria-busy', 'true');
        try { await camera.finished; }
        catch { return; }
        finally { stage.removeAttribute('aria-busy'); }
      }
      if (stage.isConnected && $('#modalRoot').hidden) openTale(route, chapter, button, camera);
      else camera?.cancel();
    });
  }
  function beginAdaptive(id = S.adaptiveCharacter) {
    const items = selectedQuestions(5,false);
    if (!items.length) { toast('Chưa có câu phù hợp trong lộ trình lớp này.'); return; }
    const entry = QuestJourney.character(id);
    S.adaptiveCharacter = entry.id;
    save();
    startQuiz({ kind: 'adaptive', title: entry.id === 'rabbit' ? 'Nhiệm vụ Thám tử chữ' : entry.mission,
      icon: entry.icon, adventure: entry.id, items });
  }
  function bindAdaptive() {
    $('#adaptiveSelect').onsubmit = event => {
      event.preventDefault();
      beginAdaptive(new FormData(event.currentTarget).get('quest-character'));
    };
  }
  function selectRoute(route) {
    if (S.storyCharacter === route.id) return;
    S.storyCharacter = route.id;
    save();
  }
  function bindStories() {
    $$('[data-story-start]').forEach(button => button.onclick = () => start(button.dataset.storyStart));
    $$('[data-story-route]').forEach(button => button.onclick = () => {
      const route = routeFor(button.dataset.storyRoute);
      if (!route || route === currentRoute()) return;
      selectRoute(route);
      render();
      $('[data-story-route="' + route.id + '"]')?.focus({ preventScroll: true });
    });
  }
  registerView('adaptive','Nhiệm vụ của riêng em',adaptivePage,bindAdaptive);
  registerView('stories','Vườn truyện',storiesPage,bindStories);
  registerView('story-grove','Khu Rừng Bí Mật',grovePage,bindGrove);
  const passDelay = q => actionFor(q).duration;
  const ending = q => actionFor(q).title;
  return { homeCards, playerFrame, react, complete, discovery, nextAction, follow, start, beginAdaptive, passDelay, ending };
})();
window.StoryQuest = StoryQuest;
if (typeof render === 'function') render(); // app.js dựng trang chủ trước khi nạp các module trò chơi
