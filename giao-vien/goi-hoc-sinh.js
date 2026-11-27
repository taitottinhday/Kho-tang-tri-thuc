import { createCinema } from './caller-cinema.mjs';
import { princeMarkup } from './caller-prince-art.mjs';
import { strikerMarkup } from './caller-penalty-art.mjs';
import { detectiveMarkup } from './caller-detective-art.mjs';
import { makeRoster, parseNames, reserveDraw, completeDraw, restoreStudent, normalizeDailyState, buildDetectiveClues, secureShuffle } from './goi-hoc-sinh-core.mjs';

/* Three classroom stories share one roster and one calling round. */
const KEY = 'vuonchu.callerGames.v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const gsap = window.gsap;
const localDate = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); };
const GAME = {
  prince: { scope: 'girls', name: 'Hoàng tử cưỡi ngựa', subtitle: 'Khu vườn trước lâu đài', icon: '♘', scene: 'garden', start: 'Mở cổng khu vườn' },
  penalty: { scope: 'boys', name: 'Sút phạt đền', subtitle: 'Trận cầu dưới ánh đèn', icon: '⚽', scene: 'stadium', start: 'Bắt đầu loạt sút' },
  detective: { scope: 'all', name: 'Thám tử tìm nghi phạm', subtitle: 'Văn phòng hồ sơ bí ẩn', icon: '⌕', scene: 'office', start: 'Mở hồ sơ vụ án' }
};
const LINES = {
  prince: ['Nên chọn ai đây ta…', '{name} à… hay là…', 'Bạn này cười xinh quá!', 'Ơ khoan đã, để ta nghĩ lại…', 'Gió vừa mách ta một điều bí mật…', 'Kỵ mã của ta đang phân vân rồi!'],
  penalty: ['Quả phạt đền này cực kỳ quan trọng!', 'Sút về phía {name} à?!', 'Ồ không, đổi hướng rồi!', 'Thủ môn đang đoán sai hướng!', 'Bóng dội cột! Vẫn đang lăn…', 'Cả sân vận động nín thở nào!'],
  detective: ['Có người sắp phải trả lời câu hỏi của cô giáo…', 'Hồ sơ {name} có gì đáng ngờ nhỉ?', 'Một manh mối nữa sắp được bật mí!', 'Hừm… ta nghĩ mình biết rồi…', 'Có thể là em sao? Khoan đã!', 'Kính lúp chưa nói lời cuối cùng!']
};
const PALETTES = [
  ['#f6b5a5', '#e97d75', '#553e4f'], ['#c2a0e9', '#7561c5', '#44356c'], ['#f5c98b', '#e78d4f', '#604754'],
  ['#98d7ca', '#359d91', '#344e61'], ['#a7c9f1', '#5a82ca', '#3d496c'], ['#f3a9c8', '#d76b9c', '#5c3f57'],
  ['#edd987', '#b59a4e', '#46424b'], ['#a9d998', '#66a15b', '#485548']
];
const SKINS = ['#f7d4b8', '#eab894', '#d99c75', '#f2c6a6', '#bf805e'];
const HAIR = ['#493436', '#312e42', '#724838', '#a95e36', '#262a38', '#684d72'];

function readSaved() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      lists: { girls: String(value.lists?.girls || ''), boys: String(value.lists?.boys || '') },
      count: [1, 2, 3].includes(Number(value.count)) ? Number(value.count) : 1,
      seconds: [10, 15, 20].includes(Number(value.seconds)) ? Number(value.seconds) : 15,
      sound: value.sound === true,
      daily: normalizeDailyState(value.daily, localDate())
    };
  } catch { return { lists: { girls: '', boys: '' }, count: 1, seconds: 15, sound: false, daily: normalizeDailyState(null, localDate()) }; }
}

async function page(view) {
  const saved = readSaved();
  let settings = saved;
  let rosters = makeRoster(parseNames(settings.lists.girls), parseNames(settings.lists.boys));
  let activeGame = '';
  let busy = false;
  let scene = null;
  let musicTimer = 0;
  let audio = null;
  let audioStep = 0;
  let storyRun = null;
  let historyExpanded = false;
  let dialogueSequence = 0;
  let noiseBuffer = null;
  let disposed = false;
  let lineDeck = {};

  view.innerHTML = `
    <main class="caller-page" id="teacherCallerGames">
      <section class="caller-home" id="callerHome">
        <header class="caller-welcome">
          <div class="caller-welcome-copy"><h2>Chọn một cuộc phiêu lưu</h2><p>Chọn một trò để mời học sinh trả lời.</p></div>
        </header>

        <section class="caller-game-grid" aria-label="Chọn trò chơi">
          <button class="caller-game-card prince-card" data-open-game="prince" type="button">
            <span class="game-card-scene prince-scene" aria-hidden="true"><span class="caller-teaser-art caller-performer" data-motion="idle">${princeMarkup()}</span></span>
            <span class="game-card-copy"><b>Hoàng tử cưỡi ngựa</b><small>Danh sách Nữ</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
          <button class="caller-game-card penalty-card" data-open-game="penalty" type="button">
            <span class="game-card-scene stadium-scene" aria-hidden="true"><span class="caller-teaser-art caller-performer" data-motion="idle">${strikerMarkup()}</span></span>
            <span class="game-card-copy"><b>Sút phạt đền</b><small>Danh sách Nam</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
          <button class="caller-game-card detective-card" data-open-game="detective" type="button">
            <span class="game-card-scene office-scene" aria-hidden="true"><span class="caller-teaser-art caller-performer" data-motion="idle">${detectiveMarkup()}</span></span>
            <span class="game-card-copy"><b>Thám tử tìm nghi phạm</b><small>Danh sách cả lớp</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
        </section>

        <section class="caller-setup-card" aria-label="Danh sách học sinh và thiết lập">
          <div class="caller-setup-heading"><div><span class="caller-eyebrow">CHUẨN BỊ SÂN KHẤU</span><h3>Danh sách lớp</h3></div><span class="caller-local-note"><i></i> Tự lưu trên thiết bị này</span></div>
          <div class="caller-lists-grid">
            <label class="caller-list-field girls-field"><span class="caller-list-label"><b>👧 Danh sách Nữ</b><small><strong id="girlsCount">0</strong> bạn</small></span><textarea id="girlsNames" rows="5" placeholder="Dán hoặc nhập tên, mỗi dòng một bạn&#10;Ví dụ:&#10;Nguyễn Ngọc An&#10;Trần Hà Chi"></textarea></label>
            <label class="caller-list-field boys-field"><span class="caller-list-label"><b>👦 Danh sách Nam</b><small><strong id="boysCount">0</strong> bạn</small></span><textarea id="boysNames" rows="5" placeholder="Dán hoặc nhập tên, mỗi dòng một bạn&#10;Ví dụ:&#10;Lê Minh Khang&#10;Phạm Gia Bảo"></textarea></label>
            <div class="caller-list-field all-field"><span class="caller-list-label"><b>🌟 Cả lớp</b><small><strong id="allCount">0</strong> bạn · tự gộp</small></span><pre id="allNamesPreview">Danh sách Nữ và Nam sẽ tự gộp ở đây.</pre></div>
          </div>
          <div class="caller-common-settings"><div class="caller-choice"><span class="caller-setting-label">Gọi bao nhiêu bạn?</span><div class="caller-segment" data-setting="count"><button type="button" data-value="1">1 bạn</button><button type="button" data-value="2">2 bạn</button><button type="button" data-value="3">3 bạn</button></div></div><div class="caller-choice"><span class="caller-setting-label">Nhịp của lượt chơi</span><div class="caller-segment caller-speed" data-setting="seconds"><button type="button" data-value="10"><b>Nhanh</b><small>10 giây</small></button><button type="button" data-value="15"><b>Vừa</b><small>15 giây</small></button><button type="button" data-value="20"><b>Hồi hộp</b><small>20 giây</small></button></div></div></div>
          <div class="caller-setup-foot"><span>🔒 Tên chỉ lưu trong trình duyệt này, không gửi lên máy chủ.</span><button id="clearLists" type="button">Xóa danh sách</button></div>
        </section>

        <section class="caller-history-home"><div class="caller-history-title"><span>✨</span><div><b>Đã gọi hôm nay</b><small id="todayCount">Chưa có bạn nào</small></div><button id="refreshRound" type="button" title="Cho cả lớp một lượt mới">Làm mới lượt gọi <i>↻</i></button></div><div class="caller-history-chips" id="todayHistory"><span class="caller-history-empty">Lịch sử hôm nay sẽ xuất hiện ở đây.</span></div><button class="caller-history-more" id="historyMore" type="button" aria-controls="todayHistory" aria-expanded="false" hidden></button></section>
        <p class="caller-fairness-note">🎓 Tên được chọn ngẫu nhiên ngay khi bắt đầu. Các cú lừa, cú sút và manh mối chỉ làm sân khấu hồi hộp hơn.</p>
      </section>

      <section class="caller-play" id="callerPlay" hidden>
        <header class="caller-play-top"><button class="caller-home-button" id="backHome" type="button">← Chọn trò khác</button><div class="caller-play-title"><span id="playGameIcon">✦</span><div><b id="playGameName"></b><small id="playGameSubtitle"></small></div></div><div class="caller-play-tools"><label class="caller-count-live"><span>Số bạn</span><select id="liveCount"><option value="1">1 bạn</option><option value="2">2 bạn</option><option value="3">3 bạn</option></select></label><label class="caller-count-live"><span>Nhịp chơi</span><select id="liveSpeed"><option value="10">Nhanh · 10s</option><option value="15">Vừa · 15s</option><option value="20">Hồi hộp · 20s</option></select></label><label class="caller-sound"><input type="checkbox" id="soundToggle"><span>♫</span><b>Âm thanh</b></label><button class="caller-tool-icon" id="fullscreenToggle" type="button" title="Toàn màn hình">⛶</button></div></header>
        <section class="caller-stage" id="gameStage" aria-label="Sân khấu hoạt hình">
          <div class="caller-cinema" id="callerCinema">
          <div class="caller-cinema-world" aria-hidden="true">
            <div class="caller-cinema-backdrop"></div>
            <div class="caller-cinema-atmosphere"></div>
            <div class="caller-cinema-setpiece"></div>
            <div class="caller-cinema-actors"></div>
            <div class="caller-cinema-fx"></div>
          </div>
          <div class="caller-stage-shade"></div>
          <div class="caller-cinema-flash" aria-hidden="true"></div>
          <div class="caller-cinema-target" aria-hidden="true"><strong></strong></div>
          <strong class="caller-cinema-signal" aria-hidden="true"></strong>
          <aside class="caller-cinema-evidence" hidden aria-live="polite"><b></b><span></span></aside>
          <div class="caller-stage-topline"><span class="caller-stage-chip"><i></i><b id="stageTheme">VƯỜN CỔ TÍCH</b></span><span id="stageStatus">Sân khấu đã sẵn sàng</span><button id="roundProgress" type="button">Lượt <b>0</b>/<i>0</i> · <u>Làm mới</u></button></div>
          <div class="caller-dialogue" id="dialogueBox"><span class="caller-dialogue-avatar" id="dialogueAvatar">✦</span><p id="dialogueText">Chọn nút bên dưới để bắt đầu câu chuyện nhé!</p><span class="dialogue-tail"></span></div>
          <div class="caller-slow-overlay" id="slowOverlay"><span>✦</span><b>KHOẢNH KHẮC QUYẾT ĐỊNH</b><i></i></div>
          <div class="caller-result-overlay" id="resultOverlay" hidden><div class="caller-result-rays"></div><div class="caller-result-card" role="region" aria-labelledby="resultHeading"><span class="caller-result-eyebrow" id="resultEyebrow">HỒ SƠ ĐÃ MỞ</span><span class="caller-result-icon" id="resultIcon">🌟</span><b id="resultHeading" tabindex="-1" aria-describedby="resultNames resultCaption">Đã tìm ra!</b><div class="caller-result-names" id="resultNames"></div><small id="resultCaption">Mời bạn lên trả lời câu hỏi của cô giáo!</small><div class="caller-result-actions"><button id="playAgain" class="caller-play-again" type="button">Chơi lại ↻</button><button id="resultHome" class="caller-result-home" type="button">Về màn hình chính</button></div></div><div class="caller-confetti" id="confetti" aria-hidden="true"></div></div>
          <div class="caller-stage-vignette"></div>
          </div>
        </section>
        <footer class="caller-play-controls"><div><button id="startStory" class="caller-main-action" type="button"><span>✦</span><b>Bắt đầu câu chuyện</b><i>→</i></button><button id="skipStory" class="caller-skip-action" type="button" hidden>Hiện kết quả</button><small id="playHint">Kết quả đã sẵn sàng, cả lớp cùng đoán nhé!</small></div><div class="caller-live-stats"><span><b id="remainingCount">0</b><small>còn lượt</small></span><span class="caller-stat-divider"></span><span><b id="calledCount">0</b><small>đã gọi hôm nay</small></span></div></footer>
        <section class="caller-board-wrap" aria-label="Danh sách sân khấu">
          <h3>Học sinh trong lượt này</h3>
          <div class="caller-name-board" id="nameBoard" role="list" aria-label="Tên học sinh"></div>
          <div class="caller-no-names" id="noNames" hidden><b>Sân khấu đang chờ tên học sinh</b><small>Chọn trò khác để quay lại và nhập danh sách lớp.</small></div>
        </section>
      </section>
    </main>`;

  const root = $('#teacherCallerGames', view);
  const home = $('#callerHome', root);
  const play = $('#callerPlay', root);
  const gameStage = $('#gameStage', root);
  const board = $('#nameBoard', root);
  const startButton = $('#startStory', root);
  const skipButton = $('#skipStory', root);
  const savedSound = $('#soundToggle', root);
  $('#girlsNames', root).value = settings.lists.girls;
  $('#boysNames', root).value = settings.lists.boys;
  savedSound.checked = settings.sound;
  $('#liveCount', root).value = String(settings.count);
  $('#liveSpeed', root).value = String(settings.seconds);

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private mode or storage limit */ } }
  function setRoster() {
    rosters = makeRoster(parseNames($('#girlsNames', root).value), parseNames($('#boysNames', root).value));
    settings.lists = { girls: $('#girlsNames', root).value, boys: $('#boysNames', root).value };
    $('#girlsCount', root).textContent = rosters.girls.length;
    $('#boysCount', root).textContent = rosters.boys.length;
    $('#allCount', root).textContent = rosters.all.length;
    $('#allNamesPreview', root).textContent = rosters.all.length ? rosters.all.map(student => student.name).join('\n') : 'Danh sách Nữ và Nam sẽ tự gộp ở đây.';
    persist();
    updateHomeHistory();
    if (activeGame) { renderRoster(); updateGameStats(); }
  }
  function getGameRoster(game = activeGame) { return rosters[GAME[game]?.scope || 'all'] || []; }
  function calledSet() { return new Set(settings.daily.round.all || []); }
  function remaining(scope) { const pool = rosters[scope] || []; const called = calledSet(); return pool.filter(student => !called.has(student.id)); }
  function updateHomeHistory() {
    const items = settings.daily.history;
    $('#todayCount', root).textContent = items.length ? items.length + ' lượt gọi trong hôm nay' : 'Chưa có bạn nào';
    const history = $('#todayHistory', root);
    const visible = historyExpanded ? items : items.slice(-16);
    history.classList.toggle('is-expanded', historyExpanded);
    history.innerHTML = visible.length ? visible.slice().reverse().map((item, index) => '<span class="caller-history-chip" style="--chip-index:' + Math.min(index, 20) + '"><i>' + (GAME[item.game]?.icon || '✦') + '</i>' + esc(item.name) + '</span>').join('') : '<span class="caller-history-empty">Lịch sử hôm nay sẽ xuất hiện ở đây.</span>';
    const more = $('#historyMore', root);
    more.hidden = items.length <= 16;
    more.textContent = historyExpanded ? 'Thu gọn lịch sử' : 'Xem đủ ' + items.length + ' lượt';
    more.setAttribute('aria-expanded', String(historyExpanded));
    $('#calledCount', root).textContent = items.length;
  }
  function updateGameStats() {
    if (!activeGame) return;
    const meta = GAME[activeGame];
    const list = getGameRoster();
    const left = remaining(meta.scope).length;
    const used = (settings.daily.round.all || []).filter(id => list.some(student => student.id === id)).length;
    $('#remainingCount', root).textContent = left;
    $('#calledCount', root).textContent = settings.daily.history.length;
    $('#roundProgress', root).innerHTML = 'Lượt <b>' + used + '</b>/<i>' + list.length + '</i> · <u>Làm mới</u>';
    $('#roundProgress', root).disabled = busy || !used;
    $('#stageStatus', root).textContent = !list.length ? 'Thêm danh sách để mở sân khấu' : left ? 'Còn ' + left + ' bạn chưa được gọi trong lượt này' : 'Cả nhóm đã có lượt — làm mới để bắt đầu vòng mới';
    $('#playHint', root).textContent = !list.length ? 'Hãy thêm tên ở danh sách trước khi chơi.' : left ? 'Mỗi bạn một lượt trong vòng hiện tại.' : 'Nhóm này đã hết lượt. Bạn có thể chọn trò khác hoặc làm mới lượt gọi.';
    startButton.disabled = busy || !left;
    skipButton.hidden = !busy;
    $('#backHome', root).disabled = busy;
    $('#liveCount', root).disabled = busy;
    $('#liveSpeed', root).disabled = busy;
    const again = $('#playAgain', root);
    again.disabled = busy;
    again.hidden = !left;
    startButton.querySelector('b').textContent = busy ? 'Đang diễn ra…' : !list.length ? 'Chưa có danh sách' : left ? meta.start : 'Đã hết lượt trong vòng';
    const button = $('#roundProgress', root);
    button.title = left ? 'Bấm để làm mới lượt gọi' : 'Bắt đầu một vòng mới';
  }
  function updateHomeHistoryAndStats() { updateHomeHistory(); updateGameStats(); }
  function hashDay() { if (settings.daily.date !== localDate()) settings.daily = normalizeDailyState(null, localDate()); }

  const picker = $$('.caller-segment', root);
  function syncSegments() {
    picker.forEach(group => {
      const name = group.dataset.setting;
      const selected = settings[name];
      $$('button', group).forEach(button => {
        const pressed = Number(button.dataset.value) === Number(selected);
        button.classList.toggle('is-selected', pressed);
        button.setAttribute('aria-pressed', String(pressed));
      });
    });
  }
  syncSegments();
  $$('.caller-segment button', root).forEach(button => button.onclick = () => {
    const group = button.closest('.caller-segment');
    const field = group.dataset.setting;
    settings[field] = Number(button.dataset.value);
    $('#liveCount', root).value = String(settings.count);
    $('#liveSpeed', root).value = String(settings.seconds);
    syncSegments(); persist();
  });
  $('#girlsNames', root).addEventListener('input', setRoster);
  $('#boysNames', root).addEventListener('input', setRoster);

  function makeAvatar(student) {
    const palette = PALETTES[student.palette % PALETTES.length];
    const skin = SKINS[(student.signature >>> 4) % SKINS.length];
    const hair = HAIR[(student.signature >>> 9) % HAIR.length];
    const style = (student.signature >>> 15) % 4;
    const fringe = [
      '<path d="M16 29c1-13 8-20 19-20 10 0 19 7 20 20l-5 3c-2-7-6-10-13-10-7 0-12 3-16 9z"/>',
      '<path d="M15 30c0-14 8-22 20-22 12 0 20 8 20 21l-7 7-2-9-7 3-6-6-10 7-2 9z"/>',
      '<path d="M17 29c0-14 7-21 18-21 12 0 19 8 19 21-4-6-8-9-13-9-7 0-11 3-17 10z"/><path d="M17 30c-5 10-3 18 3 21l3-15zm35 0c5 10 3 18-3 21l-3-15z"/>',
      '<path d="M16 30c0-14 8-22 19-22s19 8 19 22l-7 2-2-7-9 5-7-5-5 8z"/><circle cx="16" cy="17" r="5"/><circle cx="54" cy="17" r="5"/>'
    ][style];
    const accessory = (student.signature >>> 20) % 5 === 0 ? '<path d="M32 7l4-6 4 6" fill="none" stroke="#ffe17e" stroke-width="3" stroke-linecap="round"/>' : '';
    return '<svg class="student-chibi" viewBox="0 0 70 86" aria-hidden="true"><ellipse cx="35" cy="80" rx="19" ry="4" fill="#203a52" opacity=".12"/><path class="chibi-arm arm-left" d="M23 48 13 58"/><path class="chibi-arm arm-right" d="m47 48 10 10"/><path d="M22 46q13-10 26 0l5 27H17z" fill="' + palette[1] + '" stroke="#fff" stroke-width="2.5"/><path d="M29 66h5v12h-8zm9 0h5l4 12h-8z" fill="#52617d"/><ellipse cx="35" cy="30" rx="18" ry="19" fill="' + skin + '" stroke="#fff" stroke-width="2.5"/><g fill="' + hair + '" stroke="#fff" stroke-width="1.4">' + fringe + '</g><ellipse cx="29" cy="32" rx="2" ry="2.8" fill="#354251"/><ellipse cx="41" cy="32" rx="2" ry="2.8" fill="#354251"/><path d="M31 39q4 4 8 0" fill="none" stroke="#b96c65" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="25" cy="37" rx="3" ry="1.6" fill="#e78991" opacity=".55"/><ellipse cx="45" cy="37" rx="3" ry="1.6" fill="#e78991" opacity=".55"/>' + accessory + '</svg>';
  }
  function renderRoster() {
    const meta = GAME[activeGame];
    const list = getGameRoster();
    const used = calledSet();
    const cols = Math.min(9, Math.max(3, Math.ceil(Math.sqrt(Math.max(1, list.length) * 1.8))));
    board.style.setProperty('--roster-cols', cols);
    board.classList.toggle('is-detective-board', activeGame === 'detective');
    board.classList.toggle('is-goal-board', activeGame === 'penalty');
    board.innerHTML = list.map((student, index) => {
      const palette = PALETTES[student.palette % PALETTES.length];
      return '<article class="caller-student ' + (used.has(student.id) ? 'is-done' : '') + '" role="listitem" data-id="' + esc(student.id) + '" style="--student-delay:' + (index % 45 * 18) + 'ms;--student-color:' + palette[0] + ';--student-accent:' + palette[1] + '"><span class="student-avatar-wrap">' + makeAvatar(student) + '<i class="student-spark">✦</i></span><span class="student-name" title="' + esc(student.name) + '">' + esc(student.name) + '</span>' + (activeGame === 'detective' ? '<span class="student-file-code">HS-' + student.caseCode + '</span>' : '') + '</article>';
    }).join('');
    $('#noNames', root).hidden = list.length > 0;
    updateGameStats();
  }

  function randomIndex(length) {
    if (length < 2) return 0;
    if (crypto?.getRandomValues) { const max = 0x100000000 - 0x100000000 % length; const word = new Uint32Array(1); do { crypto.getRandomValues(word); } while (word[0] >= max); return word[0] % length; }
    return Math.floor(Math.random() * length);
  }
  const pickLine = (game, name = '') => {
    if (!lineDeck[game]?.length) lineDeck[game] = secureShuffle(LINES[game]);
    return lineDeck[game].pop().replaceAll('{name}', name || '…');
  };
  function delay(ms) {
    const signal = storyRun?.controller.signal;
    return new Promise((resolve, reject) => {
      if (signal?.aborted) { reject(signal.reason); return; }
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', cancel);
        resolve();
      }, ms);
      function cancel() {
        clearTimeout(timer);
        reject(signal.reason);
      }
      signal?.addEventListener('abort', cancel, { once: true });
    });
  }

  function soundContext() {
    if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function tone(freq, duration = .12, volume = .035, wave = 'sine', delaySeconds = 0) {
    if (!savedSound.checked) return;
    const ctx = soundContext(); if (!ctx) return;
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.type = wave; oscillator.frequency.setValueAtTime(freq, ctx.currentTime + delaySeconds);
    gain.gain.setValueAtTime(.0001, ctx.currentTime + delaySeconds); gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delaySeconds + .015); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delaySeconds + duration);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(ctx.currentTime + delaySeconds); oscillator.stop(ctx.currentTime + delaySeconds + duration + .03);
  }
  const MUSIC = { prince: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46], penalty: [392, 440, 523.25, 392, 349.23, 466.16], detective: [293.66, 349.23, 392, 311.13, 349.23, 261.63] };
  function startMusic() {
    if (!savedSound.checked || musicTimer) return;
    const notes = MUSIC[activeGame];
    const tick = () => { if (!savedSound.checked || !activeGame) { clearInterval(musicTimer); musicTimer = 0; return; } tone(notes[audioStep++ % notes.length], .34, .012, activeGame === 'detective' ? 'triangle' : 'sine'); };
    tick(); musicTimer = setInterval(tick, activeGame === 'detective' ? 610 : 490);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = 0; }
  function soundEffect(effect, { strength = 1, pan = 0, surface = '' } = {}) {
    if (!savedSound.checked || disposed) return;
    const ctx = soundContext();
    if (!ctx) return;
    function noise(duration, volume, frequency, q = .9) {
      if (!noiseBuffer) {
        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const samples = noiseBuffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      const sample = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const envelope = ctx.createGain();
      sample.buffer = noiseBuffer;
      filter.type = 'bandpass';
      filter.frequency.value = frequency;
      filter.Q.value = q;
      envelope.gain.setValueAtTime(volume * strength, ctx.currentTime);
      envelope.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      sample.connect(filter).connect(envelope);
      if (pan && typeof ctx.createStereoPanner === 'function') {
        const spatial = ctx.createStereoPanner();
        spatial.pan.value = Math.max(-.75, Math.min(.75, pan));
        envelope.connect(spatial).connect(ctx.destination);
      } else {
        envelope.connect(ctx.destination);
      }
      sample.start();
      sample.stop(ctx.currentTime + duration);
    }
    const effects = {
      hoof() {
        tone(95 + Math.random() * 24, .075, .044 * strength, 'triangle');
        noise(.11, .15, 510 + Math.random() * 210);
        noise(.07, .063, 1480, 1.5);
      },
      step() {
        const wood = surface === 'office';
        tone(wood ? 102 : 74, .073, .043 * strength);
        noise(.095, .105, (wood ? 740 : 390) + Math.random() * 125);
      },
      fanfare() { [440, 554, 659].forEach((note, i) => tone(note, .22, .036, 'triangle', i * .095)); },
      whistle() { tone(1660, .24, .033); tone(1880, .12, .018, 'sine', .075); },
      paper() { noise(.27, .12, 1650); },
      swerve() { noise(.26, .11, 1320); tone(330, .13, .019, 'triangle'); },
      kick() { noise(.16, .21, 430); noise(.055, .11, 1420); tone(76, .13, .066, 'triangle'); },
      post() { tone(840, .22, .039, 'triangle'); tone(1240, .18, .016); },
      catch() { noise(.19, .16, 360); },
      goal() { noise(.7, .18, 940, .3); [587, 784, 988].forEach((note, i) => tone(note, .37, .025, 'triangle', i * .11)); },
      stamp() { tone(126, .13, .039, 'triangle'); noise(.12, .10, 390); },
      heartbeat() { tone(72, .18, .06); tone(61, .16, .048, 'sine', .19); tone(72, .18, .05, 'sine', .54); },
      chime() { [740, 988, 1175].forEach((note, i) => tone(note, .29, .026, 'sine', i * .081)); }
    };
    effects[effect]?.();
  }
  async function typeDialogue(text, duration = 520) {
    const sequence = ++dialogueSequence;
    const box = $('#dialogueBox', root); const target = $('#dialogueText', root);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { target.textContent = text; return; }
    box.classList.remove('is-speaking'); void box.offsetWidth; box.classList.add('is-speaking');
    target.textContent = '';
    const letters = Array.from(text);
    const began = performance.now();
    const signal = storyRun?.controller.signal;
    return new Promise(resolve => {
      let frameId;
      function finish() {
        cancelAnimationFrame(frameId);
        signal?.removeEventListener('abort', finish);
        resolve();
      }
      function frame(now) {
        if (sequence !== dialogueSequence || disposed || !root.isConnected) { finish(); return; }
        const progress = Math.min(1, (now - began) / duration);
        target.textContent = progress === 1 ? text : letters.slice(0, Math.ceil(letters.length * progress)).join('');
        if (progress === 1) finish();
        else frameId = requestAnimationFrame(frame);
      }
      if (signal?.aborted) { resolve(); return; }
      signal?.addEventListener('abort', finish, { once: true });
      frameId = requestAnimationFrame(frame);
    });
  }
  async function say(text, duration) {
    const signal = storyRun?.controller.signal;
    await typeDialogue(text, duration);
    signal?.throwIfAborted();
  }
  function setEmotion(students, className = 'is-candidate') {
    $$('.caller-student', board).forEach(tile => tile.classList.remove('is-candidate', 'is-winner', 'is-pointed'));
    if (activeGame !== 'detective') $$('.caller-student', board).forEach(tile => tile.classList.remove('is-eliminated'));
    students.forEach(student => {
      const tile = $('.caller-student[data-id="' + CSS.escape(student.id) + '"]', board);
      if (tile) tile.classList.add(className);
    });
  }
  async function spotlight(duration = 1100, action) {
    gameStage.classList.add('is-slow');
    if (scene) scene.setSlow(true);
    action?.();
    await delay(duration);
    gameStage.classList.remove('is-slow');
    if (scene) scene.setSlow(false);
  }
  function reveal(batch) {
    const meta = GAME[activeGame];
    const overlay = $('#resultOverlay', root);
    $('#resultEyebrow', root).textContent = activeGame === 'detective' ? 'HỒ SƠ ĐÃ MỞ' : activeGame === 'penalty' ? 'BẢNG TỈ SỐ VỪA SÁNG' : 'LỜI MỜI TỪ LÂU ĐÀI';
    $('#resultIcon', root).textContent = meta.icon;
    $('#resultHeading', root).textContent = activeGame === 'detective' ? 'Đã tìm ra nghi phạm!' : activeGame === 'penalty' ? 'VÀOOOO! Được gọi rồi!' : 'Hoàng tử đã chọn!';
    $('#resultNames', root).innerHTML = batch.map((student, index) => '<span class="caller-result-person" style="--person-index:' + index + '">' + makeAvatar(student) + '<b>' + esc(student.name) + '</b></span>').join('');
    $('#resultCaption', root).textContent = batch.length > 1 ? 'Các bạn cùng lên trả lời câu hỏi của cô giáo nhé!' : activeGame === 'detective' ? 'Mời em lên trả lời câu hỏi của cô giáo!' : activeGame === 'penalty' ? 'Cả sân vận động đang cổ vũ cho em!' : 'Nàng có đồng ý cùng hoàng tử trả lời câu hỏi không?';
    overlay.hidden = false;
    requestAnimationFrame(() => {
      if (overlay.hidden || !root.isConnected) return;
      overlay.classList.add('is-shown');
      $('#resultHeading', root).focus({ preventScroll: true });
    });
    for (const student of batch) {
      const tile = $('.caller-student[data-id="' + CSS.escape(student.id) + '"]', board);
      tile?.classList.add('is-done');
    }
    setEmotion(batch, 'is-winner');
    makeConfetti();
    if (scene) scene.celebrate();
    tone(784, .22, .055, 'triangle'); tone(988, .28, .05, 'triangle', .12); tone(1174, .5, .045, 'sine', .26);
  }
  function makeConfetti() {
    const colors = ['#ffe47b', '#ff91a7', '#8fe1d0', '#9bc8ff', '#c3a4ff', '#fff4db'];
    $('#confetti', root).innerHTML = Array.from({ length: 42 }, (_, index) => '<i style="--confetti-x:' + randomIndex(100) + '%;--confetti-delay:' + (randomIndex(600) / 1000) + 's;--confetti-color:' + colors[index % colors.length] + ';--confetti-turn:' + (randomIndex(700) - 350) + 'deg"></i>').join('');
  }
  async function focusOn(student, className = 'is-candidate', wait = 420) {
    setEmotion([student], className);
    const tile = $('.caller-student[data-id="' + CSS.escape(student.id) + '"]', board);
    if (tile && gsap) gsap.fromTo(tile, { scale: .94, y: 5 }, { scale: 1.08, y: -4, duration: .34, ease: 'back.out(2)', yoyo: true, repeat: 1 });
    scene?.travel(student, className === 'is-pointed');
    await delay(wait);
  }
  async function interlude(game, name, wait = 650) {
    await say(pickLine(game, name), Math.min(540, wait));
    tone(game === 'penalty' ? 440 : game === 'detective' ? 310 : 660, .08, .025, 'sine');
    await delay(Math.max(50, wait - 500));
  }

  async function playPrince(batch, pool, totalMs, timeLeft) {
    scene?.enter();
    await say('Nghe tiếng kèn gọi rồi! Cổng vườn đang mở…', 660); tone(880, .35, .04, 'triangle');
    await delay(totalMs * .09);
    const direct = randomIndex(3) === 0;
    const decoys = secureShuffle(pool.filter(student => !batch.some(winner => winner.id === student.id))).slice(0, Math.min(3, pool.length - batch.length));
    const route = direct ? batch.slice(0, 1) : decoys.slice(0, Math.min(2 + randomIndex(2), decoys.length));
    const beats = Math.max(1, route.length + batch.length);
    const beat = Math.max(340, totalMs * .5 / beats);
    for (const student of route) {
      await focusOn(student, 'is-candidate', beat * .42);
      await interlude('prince', student.name, beat * .56);
      if (!direct) { const tile = $('.caller-student[data-id="' + CSS.escape(student.id) + '"]', board); tile?.classList.add('is-relieved'); await delay(beat * .18); tile?.classList.remove('is-relieved'); }
    }
    if (!direct && decoys.length) { await say('À không, ta đổi ý rồi! Ngựa con, quay lại nào!', 560); tone(260, .24, .045, 'triangle'); if (scene) scene.turnBack(); await delay(beat * .42); }
    else { await say('Ta đã chọn được rồi… nhưng còn một bí mật!', 550); if (scene) scene.turnBack(); await delay(beat * .4); }
    await spotlight(1250, () => scene?.travel(batch[0], true));
    for (let index = 0; index < batch.length; index++) {
      const winner = batch[index];
      if (index > 0) { await say('Một hoàng tử khác phi vào khu vườn để đón bạn tiếp theo!', 440); if (scene) scene.newPrince(index); await delay(300); }
      if (index === 0) setEmotion([winner], 'is-pointed');
      else await focusOn(winner, 'is-pointed', Math.max(320, beat * .42));
      await say('Nàng ' + winner.name + ' có đồng ý cùng ta trả lời câu hỏi không?', 650);
      const mountMs = scene?.winner(makeAvatar(winner), winner) || 0;
      tone(700, .2, .04, 'triangle'); await delay(Math.max(590, mountMs, beat * .35));
    }
    await delay(Math.max(0, timeLeft() - 1215));
    await delay(scene?.depart() || 0);
  }

  async function playPenalty(batch, pool, totalMs, timeLeft) {
    scene?.enter();
    await say('Trận đấu đang ở phút quyết định… Đặt bóng nào!', 620); tone(190, .22, .04, 'square');
    const extraBuildUp = Math.max(0, totalMs - (batch.length * 3450 + 1800)) / batch.length;
    const decoys = secureShuffle(pool.filter(student => !batch.some(winner => winner.id === student.id)));
    for (let index = 0; index < batch.length; index++) {
      const falseAim = decoys.length ? decoys[(index * 2 + randomIndex(decoys.length)) % decoys.length] : batch[index];
      scene?.prepareShot();
      await say('Cầu thủ lùi lại… thủ môn đang đoán hướng sút!', 480);
      if (extraBuildUp > 250) await delay(extraBuildUp * .5);
      setEmotion([falseAim], 'is-candidate');
      scene?.travel(falseAim);
      const trick = randomIndex(3);
      const reaction = ['Đổi chân rồi!', 'Bóng dội cột! Vẫn đang lăn…', 'Thủ môn đổ người! Bóng tuột tay mất rồi!'][trick];
      void typeDialogue('Sút về phía ' + falseAim.name + ' à?!', 400);
      scene?.fakeShot(trick, () => { void typeDialogue(reaction, 290); });
      await delay((trick === 0 ? 830 : 1360) + extraBuildUp * .5);
      if (index === batch.length - 1) {
        if (timeLeft() > 2750) {
          await say('Cả sân đang nín thở chờ cú sút cuối…', 490);
          await delay(Math.max(0, timeLeft() - 2190));
        }
        await spotlight(1540, () => scene?.scoreShot(index, true, batch[index]));
      } else {
        scene?.scoreShot(index, false, batch[index]);
        await delay(1320);
      }
      setEmotion([batch[index]], 'is-pointed');
    }
    await say('VÀOOOO! Người được gọi chính là…', 650);
  }

  async function playDetective(batch, pool, totalMs) {
    scene?.enter();
    await say('Có một bí mật trong lớp này… thám tử bắt đầu điều tra!', 560);
    const clueCount = Math.max(3, Math.min(5, Math.floor(totalMs / Math.max(1, batch.length) / 1250)));
    const caseTime = (totalMs - 2350) / batch.length;
    const clueTime = Math.max(445, (caseTime - 900) / clueCount);
    for (let caseIndex = 0; caseIndex < batch.length; caseIndex++) {
      const target = batch[caseIndex];
      const previousWinners = new Set(batch.slice(0, caseIndex).map(student => student.id));
      const casePool = pool.filter(student => !previousWinners.has(student.id));
      const { clues } = buildDetectiveClues(casePool, target, randomIndex, clueCount);
      if (clues.length < 3) {
        const lengthOf = student => Array.from(student.name).length;
        const wordsOf = student => student.name.trim().split(/\s+/).length;
        const details = [
          ['Họ tên có ' + wordsOf(target) + ' tiếng.', student => wordsOf(student) === wordsOf(target)],
          ['Tên có ' + lengthOf(target) + ' kí tự.', student => lengthOf(student) === lengthOf(target)],
          ['Hồ sơ mang mã ' + target.caseCode + '.', student => student.caseCode === target.caseCode]
        ];
        for (const [text, matches] of details) {
          if (clues.length === 3) break;
          const previous = clues.at(-1)?.remaining || casePool;
          clues.push({ text, remaining: previous.filter(matches) });
        }
      }
      const candidateIds = new Set(casePool.map(student => student.id));
      let survivors = casePool;
      let consideredDecoy = false;
      async function considerDecoy() {
        const decoy = survivors.find(student => student.id !== target.id);
        if (!decoy || consideredDecoy) return;
        consideredDecoy = true;
        await focusOn(decoy, 'is-candidate', 330);
        scene?.falseClue();
        await say('Khoan, xem kỹ hồ sơ này nào…', 320);
      }
      for (const [index, clue] of clues.entries()) {
        if (clue.remaining.length === 1) await considerDecoy();
        await say('Manh mối ' + (index + 1) + ': ' + clue.text, Math.min(530, clueTime * .68));
        scene?.stampClue(clue);
        survivors = clue.remaining;
        const survivorIds = new Set(survivors.map(student => student.id));
        $$('.caller-student', board).forEach(tile => {
          if (candidateIds.has(tile.dataset.id) && !survivorIds.has(tile.dataset.id)) tile.classList.add('is-eliminated');
        });
        setEmotion(survivors.length > 1 ? [survivors[randomIndex(survivors.length)]] : []);
        await delay(clueTime - Math.min(530, clueTime * .68));
      }
      await considerDecoy();
      if (caseIndex === batch.length - 1) {
        await spotlight(1180, () => { setEmotion([target], 'is-pointed'); scene?.travel(target, true); });
        scene?.confirmSuspect?.(target);
        await say('Đã tìm ra rồi! Mở hồ sơ nào…', 510);
      } else {
        await focusOn(target, 'is-pointed', 270);
        scene?.confirmSuspect?.(target);
        await delay(320);
        $$('.caller-student', board).forEach(tile => tile.classList.remove('is-eliminated', 'is-candidate', 'is-pointed'));
        scene?.nextCase();
      }
    }
  }

  function presentDraw(draw, batch, revealedEarly = false) {
    if (!root.isConnected || disposed || !completeDraw(settings.daily, draw.id)) return;
    persist();
    updateHomeHistoryAndStats();
    if (revealedEarly) $('#dialogueText', root).textContent = 'Mời các bạn xem kết quả của lượt này.';
    reveal(batch);
    $('#stageStatus', root).textContent = remaining(GAME[activeGame].scope).length
      ? 'Đã công bố kết quả!'
      : 'Nhóm này đã có lượt. Chọn trò khác để gọi các bạn còn lại.';
  }

  function finishStory(run, revealedEarly = false) {
    if (storyRun !== run || disposed) return;
    storyRun = null;
    run.controller.abort();
    busy = false;
    stopMusic();
    if (revealedEarly) {
      try { scene?.reset(); }
      catch (error) { console.warn('Could not reset the animation', error); }
    }
    gameStage.classList.remove('is-running', 'is-slow');
    presentDraw(run.draw, run.batch, revealedEarly);
  }

  async function recoverDraw(draw) {
    await openGame(draw.game);
    stopMusic();
    const batch = draw.students.map(student => restoreStudent(student, rosters.all));
    presentDraw(draw, batch, true);
  }
  async function startStory() {
    if (busy || !activeGame) return;
    hashDay();
    if (settings.daily.pending) { await recoverDraw(settings.daily.pending); return; }
    const meta = GAME[activeGame];
    const pool = remaining(meta.scope);
    if (!pool.length) { updateGameStats(); return; }
    const id = globalThis.crypto?.randomUUID?.() || Date.now() + ':' + randomIndex(1000000);
    const draw = reserveDraw(settings.daily, pool, settings.count, activeGame, id, randomIndex);
    if (!draw) { updateGameStats(); return; }
    const batch = draw.students.map(student => restoreStudent(student, pool));
    const run = { draw, batch, controller: new AbortController() };
    storyRun = run;
    lineDeck = {};
    persist();
    busy = true; updateGameStats();
    gameStage.classList.add('is-running');
    $('#resultOverlay', root).hidden = true; $('#resultOverlay', root).classList.remove('is-shown');
    $('#slowOverlay', root).classList.remove('is-active'); gameStage.classList.remove('is-slow');
    renderRoster(); setEmotion([]);
    $('#stageStatus', root).textContent = 'Câu chuyện đang bắt đầu…';
    if (savedSound.checked) { soundContext(); startMusic(); }
    const begin = performance.now(); const totalMs = settings.seconds * 1000;
    try {
      scene?.reset();
      const timeLeft = () => totalMs - (performance.now() - begin);
      if (draw.game === 'prince') await playPrince(batch, pool, totalMs, timeLeft);
      if (draw.game === 'penalty') await playPenalty(batch, pool, totalMs, timeLeft);
      if (draw.game === 'detective') await playDetective(batch, pool, totalMs);
      const remainder = totalMs - (performance.now() - begin);
      if (remainder > 0) await delay(remainder);
      finishStory(run);
    } catch (error) {
      if (run.controller.signal.aborted || disposed) return;
      console.error('Caller game animation failed', error);
      finishStory(run, true);
    }
  }

  async function openGame(key) {
    if (!GAME[key]) return;
    if (scene) { scene.destroy(); scene = null; }
    activeGame = key;
    dialogueSequence++;
    const meta = GAME[key];
    home.hidden = true; play.hidden = false;
    $('#playGameIcon', root).textContent = meta.icon;
    $('#playGameName', root).textContent = meta.name;
    $('#playGameSubtitle', root).textContent = meta.subtitle;
    $('#stageTheme', root).textContent = key === 'prince' ? 'KHU VƯỜN TRƯỚC LÂU ĐÀI' : key === 'penalty' ? 'SÂN VẬN ĐỘNG ĐÊM' : 'VĂN PHÒNG THÁM TỬ';
    $('#dialogueAvatar', root).textContent = key === 'prince' ? '♘' : key === 'penalty' ? '⚽' : '⌕';
    $('#dialogueText', root).textContent = key === 'prince' ? 'Gió đang lay cờ trên tháp… ai sẽ được mời lên ngựa?' : key === 'penalty' ? 'Khán đài đã sáng đèn. Cầu thủ đang đặt bóng…' : 'Mưa rơi ngoài cửa sổ. Một vụ án mới bắt đầu…';
    $('#resultOverlay', root).hidden = true; $('#resultOverlay', root).classList.remove('is-shown');
    gameStage.className = 'caller-stage scene-' + meta.scene;
    renderRoster();
    scene = createCinema($('#callerCinema', root), meta.scene, { gsap, sound: soundEffect });
    updateGameStats();
    if (savedSound.checked) startMusic();
  }
  function goHome() {
    if (busy) return;
    stopMusic();
    dialogueSequence++;
    if (scene) { scene.destroy(); scene = null; }
    activeGame = ''; play.hidden = true; home.hidden = false; setRoster();
  }
  async function refreshRound() {
    if (busy || !activeGame) return;
    settings.daily.round = { girls: [], boys: [], all: [] };
    persist(); renderRoster(); updateGameStats();
    await typeDialogue('Một lượt mới bắt đầu! Các bạn sẵn sàng chưa?', 420);
  }
  function refreshToday() {
    if (busy) return;
    settings.daily.round = { girls: [], boys: [], all: [] };
    persist(); updateHomeHistory(); updateGameStats();
    if (activeGame) renderRoster();
  }
  $$('.caller-game-card', root).forEach(card => card.onclick = () => openGame(card.dataset.openGame));
  $('#backHome', root).onclick = goHome; $('#resultHome', root).onclick = goHome;
  $('#historyMore', root).onclick = () => { historyExpanded = !historyExpanded; updateHomeHistory(); };
  $('#playAgain', root).onclick = startStory;
  startButton.onclick = startStory;
  skipButton.onclick = () => { if (storyRun) finishStory(storyRun, true); };
  $('#roundProgress', root).onclick = refreshRound;
  $('#refreshRound', root).onclick = refreshToday;
  $('#clearLists', root).onclick = () => { $('#girlsNames', root).value = ''; $('#boysNames', root).value = ''; setRoster(); };
  $('#liveCount', root).onchange = event => { settings.count = Number(event.target.value); syncSegments(); persist(); };
  $('#liveSpeed', root).onchange = event => { settings.seconds = Number(event.target.value); syncSegments(); persist(); };
  savedSound.onchange = () => { settings.sound = savedSound.checked; persist(); if (settings.sound) { soundContext(); startMusic(); tone(659, .12, .035); } else stopMusic(); };
  $('#fullscreenToggle', root).onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.requestFullscreen(); }
    catch { $('#stageStatus', root).textContent = 'Trình duyệt này chưa bật được chế độ toàn màn hình.'; }
  };
  $('#liveSpeed', root).value = String(settings.seconds);
  $('#liveCount', root).value = String(settings.count);
  root.addEventListener('keydown', event => {
    if (event.code === 'Space' && activeGame && !busy && !event.target.closest('button, input, select, textarea, a')) { event.preventDefault(); startStory(); }
    if (event.code === 'Escape' && activeGame && !busy && document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
  });
  const teacherApp = root.closest('#app');
  const appVisibility = new MutationObserver(() => cleanWhenLeaving());
  const cleanWhenLeaving = () => {
    if (root.isConnected && !teacherApp?.hidden) return;
    disposed = true;
    storyRun?.controller.abort();
    storyRun = null;
    stopMusic();
    scene?.destroy();
    scene = null;
    appVisibility.disconnect();
    window.removeEventListener('hashchange', cleanWhenLeaving);
    document.removeEventListener('fullscreenchange', updateFullscreen);
    if (audio && audio.state !== 'closed') audio.close().catch(() => {});
  };
  if (teacherApp) appVisibility.observe(teacherApp, { attributes: true, attributeFilter: ['hidden'] });
  function updateFullscreen() {
    if (!root.isConnected) return;
    const full = document.fullscreenElement === root;
    const control = $('#fullscreenToggle', root);
    control.textContent = full ? '⤢' : '⛶';
    control.title = full ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    control.setAttribute('aria-pressed', String(full));
  }
  document.addEventListener('fullscreenchange', updateFullscreen);
  window.addEventListener('hashchange', cleanWhenLeaving);
  updateHomeHistory();
  setRoster();
  if (settings.daily.pending) await recoverDraw(settings.daily.pending);
}

window.GV && window.GV.register('goi-ten', 'Gọi tên', page);
