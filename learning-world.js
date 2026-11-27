/* Nhiệm vụ cá nhân và truyện mở khóa theo câu đúng. Nạp sau app.js. */
'use strict';
const StoryQuest = (() => {
  const MASCOT = 'assets/tho-tham-hiem-vuon-chu.png';
  const chapters = [
    { id:'seed', icon:'🌱', title:'Hạt mầm biết đọc', subtitle:'Giúp Thỏ Lá tìm hạt giống Ánh Sáng.', scenes:[
      ['Bức thư dưới gốc cây','Thỏ Lá tìm thấy một bức thư. Ba từ đúng sẽ chỉ đường tới hạt giống.'],
      ['Cánh cổng rì rào','Cánh cổng lá mở ra. Thỏ nghe thấy tiếng suối đang gọi phía trước.'],
      ['Hạt giống toả sáng','Một hạt giống vàng bay lên. Cả khu vườn bừng sáng vì em đã giúp Thỏ!']
    ] },
    { id:'cloud', icon:'☁️', title:'Chuyến tàu mây', subtitle:'Đưa những con chữ về đúng ga.', scenes:[
      ['Nhà ga trên mây','Tàu Mây chờ em xếp đúng những chữ đầu tiên vào toa.'],
      ['Qua cầu cầu vồng','Cầu vồng chỉ hiện ra khi hành khách gọi đúng tên các từ.'],
      ['Bến Vườn Chữ','Con tàu cập bến. Thỏ Lá trao em chiếc vé khám phá mới!']
    ] },
    { id:'lantern', icon:'🏮', title:'Đêm hội đom đóm', subtitle:'Thắp sáng lễ hội bằng những từ chuẩn.', scenes:[
      ['Con đường tối','Đom đóm lạc mất ánh sáng. Thỏ Lá nhờ em tìm từng chữ thật chuẩn.'],
      ['Rừng đèn lồng','Những chiếc đèn lần lượt sáng lên theo câu trả lời của em.'],
      ['Đêm hội rực rỡ','Đom đóm bay thành một vầng sao. Cả khu vườn mở tiệc chúc mừng!']
    ] }
  ];
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
  function selectedQuestions(limit = 5, choiceOnly = false) {
    const weakTopics = topicNeeds().map(x => x.topic).filter(Boolean);
    const pools = weakTopics.concat(openTopics()).filter((topic,index,list) => list.findIndex(t => t.id === topic.id) === index);
    const topicPool = topic => topic.baiTap.map((q,i) => Object.assign({},q,{ _t:topic.id, _i:i })).concat(genItems(topic,undefined,2));
    const allowed = item => (!choiceOnly || item.loai === 'chon') && !(item.loai === 'ngheViet' && Number(S.grade) < 2);
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
    const completed = Object.values(S.storyProgress || {}).filter(x => x?.done).length;
    return '<section class="quest-portals" aria-label="Khám phá nhiệm vụ mới">' +
      '<button class="quest-portal quest-portal-mission" data-view="adaptive"><span class="quest-portal-copy"><small>THỬ THÁCH RIÊNG · ' + (isDone ? 'ĐÃ XONG HÔM NAY' : '5 CÂU NGẮN') + '</small><b>' + (isDone ? 'Thỏ Lá tự hào về em!' : 'Thám tử chữ tìm điểm yếu') + '</b><span>' + (weak ? 'Đang luyện: ' + esc(weak.topic.ten) : 'Chưa có từ sai — Thỏ Lá chọn bài vừa sức cho em.') + '</span><em>' + (isDone ? 'Ôn thêm một lượt →' : 'Bắt đầu nhiệm vụ →') + '</em></span><img src="' + MASCOT + '" alt="Thỏ Lá dẫn đường" /></button>' +
      '<button class="quest-portal quest-portal-story" data-view="stories"><span class="quest-portal-copy"><small>TRUYỆN TƯƠNG TÁC · ' + completed + '/3 CHƯƠNG</small><b>Mỗi từ đúng mở một trang</b><span>' + esc(chapters[Math.min(completed,chapters.length - 1)].title) + ' đang chờ em.</span><em>Mở Vườn truyện →</em></span><span class="quest-book-art" aria-hidden="true">📖<i>✦</i><i>✧</i></span></button>' +
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
  function storiesPage() {
    const progress = S.storyProgress || {};
    return '<div class="learning-world story-world"><section class="world-hero story-hero"><div class="world-hero-copy"><span class="world-kicker">VƯỜN TRUYỆN KÌ DIỆU · LỚP ' + esc(S.grade) + '</span><h1>Đọc đúng, mở truyện!</h1><p>Chọn đúng từ để lật trang tiếp theo. Càng đọc kĩ, cuộc phiêu lưu càng sáng lên.</p><span class="story-collection-count">✨ ' + Object.values(progress).filter(x => x?.done).length + ' chương đã khám phá</span></div><div class="story-hero-book" aria-hidden="true"><span>🌙</span><b>📖</b><i>✦</i><i>✧</i></div></section>' +
      '<div class="story-chapter-grid">' + chapters.map((chapter,index) => {
        const done = !!progress[chapter.id]?.done, locked = index > 0 && !progress[chapters[index - 1].id]?.done;
        return '<article class="story-chapter ' + (done ? 'is-done ' : '') + (locked ? 'is-locked' : '') + '" style="--chapter:' + index + '"><div class="story-chapter-art"><span class="chapter-sun"></span><img src="' + MASCOT + '" alt="" /><b>' + chapter.icon + '</b>' + (locked ? '<span class="chapter-lock">🔒</span>' : done ? '<span class="chapter-lock">✓</span>' : '') + '</div><div class="story-chapter-copy"><small>CHƯƠNG 0' + (index + 1) + (done ? ' · ĐÃ MỞ' : locked ? ' · CÒN KHOÁ' : ' · ĐANG CHỜ EM') + '</small><h2>' + esc(chapter.title) + '</h2><p>' + esc(chapter.subtitle) + '</p><button class="story-start" data-story-start="' + chapter.id + '" ' + (locked ? 'disabled' : '') + '>' + (done ? 'Đọc lại câu chuyện' : locked ? 'Mở chương trước' : 'Bước vào truyện →') + '</button></div></article>';
      }).join('') + '</div><div class="story-note"><span>💡</span><p>Em phải trả lời đúng mới lật được trang. Nếu sai, Thỏ Lá sẽ đưa một gợi ý rồi cho em thử lại.</p></div></div>';
  }
  function start(id) {
    const index = chapters.findIndex(chapter => chapter.id === id);
    if (index < 0) return;
    if (index > 0 && !S.storyProgress?.[chapters[index - 1].id]?.done) { toast('Mình hãy hoàn thành chương trước để mở cánh cửa tiếp theo nhé!'); return; }
    const chapter = chapters[index], items = selectedQuestions(3,true);
    if (items.length < 3) { toast('Chưa tìm được đủ câu hỏi cho chương này. Hãy thử lại sau nhé.'); return; }
    startQuiz({ kind:'storybook', title:chapter.title, icon:chapter.icon, subtitle:'Trả lời đúng để lật trang tiếp theo', storyId:id, items });
  }
  function complete(id, won) {
    if (!won || !chapters.some(chapter => chapter.id === id)) return false;
    S.storyProgress = S.storyProgress || {};
    const first = !S.storyProgress[id]?.done;
    S.storyProgress[id] = { done:true, completedAt:Date.now() };
    return first;
  }
  function playerFrame(q) {
    const chapter = chapters.find(row => row.id === q.storyId) || chapters[0], index = Math.min(q.i,chapter.scenes.length - 1), scene = chapter.scenes[index];
    return '<section class="story-player-scene scene-' + (index + 1) + '" aria-label="Trang truyện ' + (index + 1) + ': ' + esc(scene[0]) + '"><div class="story-player-glow"></div><span class="story-player-leaf leaf-one">✦</span><span class="story-player-leaf leaf-two">✧</span><img src="' + MASCOT + '" alt="" /><div class="story-player-caption"><small>TRANG ' + (index + 1) + ' / ' + chapter.scenes.length + ' · ' + esc(chapter.title) + '</small><b>' + esc(scene[0]) + '</b><p>' + esc(scene[1]) + '</p></div><div class="story-page-dots" aria-label="Trang ' + (index + 1) + ' trên ' + chapter.scenes.length + '">' + chapter.scenes.map((_,i) => '<span class="' + (i <= index ? 'lit' : '') + '"></span>').join('') + '</div></section>';
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
  return { homeCards, playerFrame, complete, start, chapters, beginAdaptive };
})();
window.StoryQuest = StoryQuest;
if (typeof render === 'function') render(); // app.js dựng trang chủ trước khi nạp các module trò chơi
