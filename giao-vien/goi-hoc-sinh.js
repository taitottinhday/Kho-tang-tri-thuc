import { createCinema } from './caller-phim.mjs';
import { createUfoCinema } from './caller-ufo.mjs';
import { createDuckVillage } from './caller-vit.mjs';
import { createKnowledgeFerry } from './caller-do.mjs';
import { makeRoster, parseNames, reserveDraw, completeDraw, restoreStudent, normalizeDailyState, buildDetectiveClues, secureShuffle } from './goi-hoc-sinh-core.mjs';
const SPEEDS = [60, 90, 120]; // giây cho một lượt gọi – học sinh tiểu học cần đọc chậm
const OLD_SPEED = { 10: 60, 15: 60, 20: 90, 25: 60, 35: 90 }; // máy đang lưu nhịp cũ → nhịp mới
const PACE = { 60: 1, 90: 1.25, 120: 1.5 }; // nhịp chậm thì mỗi câu đứng lâu hơn

/* Classroom stories share one roster and one calling round. */
const KEY = 'vuonchu.callerGames.v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const gsap = window.gsap;
const localDate = () => { const date = new Date(); return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'); };
const GAME = {
  prince: { scope: 'girls', name: 'Hoàng tử cưỡi ngựa', subtitle: 'Khu vườn trước lâu đài', icon: '♘', scene: 'garden', start: 'Mở cổng khu vườn' },
  penalty: { scope: 'boys', name: 'Sút phạt đền', subtitle: 'Trận cầu dưới ánh đèn', icon: '⚽', scene: 'stadium', start: 'Bắt đầu loạt sút' },
  detective: { scope: 'all', name: 'Thám tử tìm nghi phạm', subtitle: 'Văn phòng hồ sơ bí ẩn', icon: '⌕', scene: 'office', start: 'Mở hồ sơ vụ án' },
  ufo: { scope: 'all', name: 'UFO Trả bài', subtitle: 'Tín hiệu lạ trên bầu trời lớp mình', icon: '🛸', scene: 'ufo', start: 'Mở tín hiệu vũ trụ' },
  postal: { scope: 'all', name: 'Đại úy Vịt triệu tập', subtitle: 'Cả xóm nín thở chờ tiếng gõ cửa', icon: '🦆', scene: 'postal', start: 'Cho Đại úy Vịt xuất phát', journey: createDuckVillage },
  ferry: { scope: 'all', name: 'Lái đò tri thức', subtitle: 'Vượt sóng đưa cả lớp cập bến', icon: '⛵', scene: 'ferry', start: 'Khởi hành', journey: createKnowledgeFerry }
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
      seconds: SPEEDS.includes(Number(value.seconds)) ? Number(value.seconds) : OLD_SPEED[Number(value.seconds)] || 60,
      sound: value.sound === true,
      daily: normalizeDailyState(value.daily, localDate())
    };
  } catch { return { lists: { girls: '', boys: '' }, count: 1, seconds: 60, sound: false, daily: normalizeDailyState(null, localDate()) }; }
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
            <span class="game-card-scene prince-scene" aria-hidden="true"><img class="caller-teaser-photo" src="../assets/phim/goi/ht-1.webp" alt="" decoding="async"></span>
            <span class="game-card-copy"><b>Hoàng tử cưỡi ngựa</b><small>Danh sách Nữ</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
          <button class="caller-game-card penalty-card" data-open-game="penalty" type="button">
            <span class="game-card-scene stadium-scene" aria-hidden="true"><img class="caller-teaser-photo" src="../assets/phim/goi/sut-4.webp" alt="" decoding="async"></span>
            <span class="game-card-copy"><b>Sút phạt đền</b><small>Danh sách Nam</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
          <button class="caller-game-card detective-card" data-open-game="detective" type="button">
            <span class="game-card-scene office-scene" aria-hidden="true"><img class="caller-teaser-photo" src="../assets/phim/goi/tt-6.webp" alt="" decoding="async"></span>
            <span class="game-card-copy"><b>Thám tử tìm nghi phạm</b><small>Danh sách cả lớp</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
          <button class="caller-game-card ufo-card" data-open-game="ufo" type="button">
            <span class="game-card-scene ufo-card-scene" aria-hidden="true"><i class="ufo-card-beam"></i><i class="ufo-card-kid"></i><svg class="ufo-card-ship" viewBox="0 0 120 64"><ellipse cx="60" cy="28" rx="19" ry="17" fill="#bff3ff" opacity=".85"/><ellipse cx="60" cy="31" rx="9" ry="8.5" fill="#8fdc7c"/><ellipse cx="56.5" cy="30.5" rx="2.3" ry="3.1" fill="#1b2340"/><ellipse cx="63.5" cy="30.5" rx="2.3" ry="3.1" fill="#1b2340"/><path d="M8 40c9-11 27-16 52-16s43 5 52 16c-8 9-27 14-52 14S16 49 8 40Z" fill="#79b9dc" stroke="#effcff" stroke-width="2"/><g fill="#fff4a3"><circle cx="28" cy="44" r="2.6"/><circle cx="44" cy="48" r="2.6"/><circle cx="60" cy="49" r="2.6"/><circle cx="76" cy="48" r="2.6"/><circle cx="92" cy="44" r="2.6"/></g></svg></span>
            <span class="game-card-copy"><b>UFO Trả bài</b><small>Danh sách cả lớp</small><span class="game-card-action" aria-hidden="true">↗</span></span>
          </button>
          ${Object.entries(GAME).filter(([, game]) => game.journey).map(([key, game]) => `
            <button class="caller-game-card journey-card ${key}-card" data-open-game="${key}" type="button">
              <span class="game-card-scene" aria-hidden="true"><span class="journey-card-mark">${game.icon}</span></span>
              <span class="game-card-copy"><b>${game.name}</b><small>Danh sách cả lớp</small><span class="game-card-action" aria-hidden="true">↗</span></span>
            </button>`).join('')}
        </section>

        <section class="caller-setup-card" aria-label="Danh sách học sinh và thiết lập">
          <div class="caller-setup-heading"><div><span class="caller-eyebrow">CHUẨN BỊ SÂN KHẤU</span><h3>Danh sách lớp</h3></div><div class="caller-setup-tools"><button id="importClass" class="caller-import" type="button">📋 Lấy tên từ lớp</button><span class="caller-local-note"><i></i> Tự lưu trên thiết bị này</span></div></div>
          <div class="caller-lists-grid">
            <label class="caller-list-field girls-field"><span class="caller-list-label"><b>👧 Danh sách Nữ</b><small><strong id="girlsCount">0</strong> bạn</small></span><textarea id="girlsNames" rows="5" placeholder="Dán hoặc nhập tên, mỗi dòng một bạn&#10;Ví dụ:&#10;Nguyễn Ngọc An&#10;Trần Hà Chi"></textarea></label>
            <label class="caller-list-field boys-field"><span class="caller-list-label"><b>👦 Danh sách Nam</b><small><strong id="boysCount">0</strong> bạn</small></span><textarea id="boysNames" rows="5" placeholder="Dán hoặc nhập tên, mỗi dòng một bạn&#10;Ví dụ:&#10;Lê Minh Khang&#10;Phạm Gia Bảo"></textarea></label>
            <div class="caller-list-field all-field"><span class="caller-list-label"><b>🌟 Cả lớp</b><small><strong id="allCount">0</strong> bạn · tự gộp</small></span><pre id="allNamesPreview">Danh sách Nữ và Nam sẽ tự gộp ở đây.</pre></div>
          </div>
          <div class="caller-common-settings"><div class="caller-choice"><span class="caller-setting-label">Gọi bao nhiêu bạn?</span><div class="caller-segment" data-setting="count"><button type="button" data-value="1">1 bạn</button><button type="button" data-value="2">2 bạn</button><button type="button" data-value="3">3 bạn</button></div></div><div class="caller-choice"><span class="caller-setting-label">Nhịp của lượt chơi</span><div class="caller-segment caller-speed" data-setting="seconds"><button type="button" data-value="60"><b>Vừa</b><small>1 phút</small></button><button type="button" data-value="90"><b>Chậm</b><small>1,5 phút</small></button><button type="button" data-value="120"><b>Hồi hộp</b><small>2 phút</small></button></div></div></div>
          <div class="caller-setup-foot"><span>🔒 Tên chỉ lưu trong trình duyệt này, không gửi lên máy chủ.</span><button id="clearLists" type="button">Xóa danh sách</button></div>
        </section>

        <section class="caller-history-home"><div class="caller-history-title"><span>✨</span><div><b>Đã gọi hôm nay</b><small id="todayCount">Chưa có bạn nào</small></div><button id="refreshRound" type="button" title="Cho cả lớp một lượt mới">Làm mới lượt gọi <i>↻</i></button></div><div class="caller-history-chips" id="todayHistory"><span class="caller-history-empty">Lịch sử hôm nay sẽ xuất hiện ở đây.</span></div><button class="caller-history-more" id="historyMore" type="button" aria-controls="todayHistory" aria-expanded="false" hidden></button></section>
        <p class="caller-fairness-note">🎓 Tên được chọn ngẫu nhiên ngay khi bắt đầu. Hoạt cảnh tạo bất ngờ trước khi công bố kết quả.</p>
      </section>

      <section class="caller-play" id="callerPlay" hidden>
        <header class="caller-play-top"><button class="caller-home-button" id="backHome" type="button">← Chọn trò khác</button><div class="caller-play-title"><span id="playGameIcon">✦</span><div><b id="playGameName"></b><small id="playGameSubtitle"></small></div></div><div class="caller-play-tools"><label class="caller-count-live"><span>Số bạn</span><select id="liveCount"><option value="1">1 bạn</option><option value="2">2 bạn</option><option value="3">3 bạn</option></select></label><label class="caller-count-live"><span>Nhịp chơi</span><select id="liveSpeed"><option value="60">Vừa · 1 phút</option><option value="90">Chậm · 1,5 phút</option><option value="120">Hồi hộp · 2 phút</option></select></label><label class="caller-sound"><input type="checkbox" id="soundToggle"><span>♫</span><b>Âm thanh</b></label><button class="caller-tool-icon" id="fullscreenToggle" type="button" title="Toàn màn hình">⛶</button></div></header>
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
          <div class="caller-no-names" id="noNames" hidden><b>Sân khấu đang chờ tên học sinh</b><small>Bấm “📋 Thêm danh sách” bên dưới để lấy tên từ lớp hoặc tự nhập tên.</small></div>
        </section>
      </section>
    </main>`;

  const root = $('#teacherCallerGames', view);
  const home = $('#callerHome', root);
  const play = $('#callerPlay', root);
  const gameStage = $('#gameStage', root);
  const board = $('#nameBoard', root);
  const boardWrap = board.closest('.caller-board-wrap');
  const boardHomeMarker = document.createComment('caller-board-home');
  boardWrap.parentNode.insertBefore(boardHomeMarker, boardWrap);
  function placeBoardForGame(key) {
    if (key === 'ufo') $('#callerCinema', root).append(boardWrap);
    else if (boardWrap.parentNode !== boardHomeMarker.parentNode) boardHomeMarker.parentNode.insertBefore(boardWrap, boardHomeMarker.nextSibling);
  }
  const startButton = $('#startStory', root);
  const skipButton = $('#skipStory', root);
  const liveSpeed = $('#liveSpeed', root);
  const storySpeedLabels = Array.from(liveSpeed.options, option => option.textContent);
  const shortSpeedLabels = ['Nhanh', 'Vừa', 'Chậm'];
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
    if (activeGame) {
      renderRoster();
      updateGameStats();
      if (!busy && GAME[activeGame].journey) scene?.reset();
    }
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
    const need = meta.scope === 'girls' ? 'Trò này gọi các bạn nữ – cần danh sách Nữ. ' : meta.scope === 'boys' ? 'Trò này gọi các bạn nam – cần danh sách Nam. ' : '';
    $('#playHint', root).textContent = !list.length ? need + 'Bấm “Thêm danh sách” để lấy tên từ lớp hoặc tự nhập.' : left ? 'Mỗi bạn một lượt trong vòng hiện tại.' : 'Nhóm này đã hết lượt. Bạn có thể chọn trò khác hoặc làm mới lượt gọi.';
    startButton.disabled = busy || (!left && list.length > 0); // chưa có tên: nút mở chỗ thêm danh sách
    skipButton.hidden = !busy;
    $('#backHome', root).disabled = busy;
    $('#liveCount', root).disabled = busy;
    $('#liveSpeed', root).disabled = busy;
    const again = $('#playAgain', root);
    again.disabled = busy;
    again.hidden = !left;
    startButton.querySelector('b').textContent = busy ? 'Đang diễn ra…' : !list.length ? '📋 Thêm danh sách' : left ? meta.start : 'Đã hết lượt trong vòng';
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
    return `<svg class="student-chibi" viewBox="0 0 70 86" aria-hidden="true">
      <ellipse cx="35" cy="80" rx="19" ry="4" fill="#203a52" opacity=".12"/>
      <path class="chibi-arm arm-left" d="M23 48 13 58"/>
      <path class="chibi-arm arm-right" d="m47 48 10 10"/>
      <path d="M22 46q13-10 26 0l5 27H17z" fill="${palette[1]}" stroke="#fff" stroke-width="2.5"/>
      <g fill="#52617d">
        <path class="chibi-leg leg-left" d="M29 66h5v12h-8z"/>
        <path class="chibi-leg leg-right" d="M38 66h5l4 12h-8z"/>
      </g>
      <ellipse cx="35" cy="30" rx="18" ry="19" fill="${skin}" stroke="#fff" stroke-width="2.5"/>
      <g fill="${hair}" stroke="#fff" stroke-width="1.4">${fringe}</g>
      <ellipse cx="29" cy="32" rx="2" ry="2.8" fill="#354251"/>
      <ellipse cx="41" cy="32" rx="2" ry="2.8" fill="#354251"/>
      <path d="M31 39q4 4 8 0" fill="none" stroke="#b96c65" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="25" cy="37" rx="3" ry="1.6" fill="#e78991" opacity=".55"/>
      <ellipse cx="45" cy="37" rx="3" ry="1.6" fill="#e78991" opacity=".55"/>
      ${accessory}
    </svg>`;
  }
  function renderRoster() {
    const list = getGameRoster();
    const used = calledSet();
    const isUfo = activeGame === 'ufo';
    const shortName = name => name.trim().split(/\s+/).at(-1) || name;
    const nameCounts = new Map();
    if (isUfo) {
      for (const { name } of list) {
        const short = shortName(name);
        nameCounts.set(short, (nameCounts.get(short) || 0) + 1);
      }
    }
    const cols = isUfo
      ? Math.min(24, Math.max(1, Math.ceil(Math.max(1, list.length) / 2)))
      : Math.min(9, Math.max(3, Math.ceil(Math.sqrt(Math.max(1, list.length) * 1.8))));
    board.style.setProperty('--roster-cols', cols);
    board.classList.toggle('is-detective-board', activeGame === 'detective');
    board.classList.toggle('is-goal-board', activeGame === 'penalty');
    board.classList.toggle('is-ufo-board', isUfo);
    board.innerHTML = list.map((student, index) => {
      const palette = PALETTES[student.palette % PALETTES.length];
      let label = student.name;
      if (isUfo) {
        const short = shortName(student.name);
        const familyInitial = student.name.trim().charAt(0);
        label = nameCounts.get(short) > 1 ? short + ' ' + familyInitial + '.' : short;
      }
      return '<article class="caller-student ' + (used.has(student.id) ? 'is-done' : '') + '" role="listitem" data-id="' + esc(student.id) + '" style="--student-delay:' + (index % 45 * 18) + 'ms;--student-color:' + palette[0] + ';--student-accent:' + palette[1] + '"><span class="student-avatar-wrap">' + makeAvatar(student) + '<i class="student-spark">✦</i></span><span class="student-name" title="' + esc(student.name) + '">' + esc(label) + '</span>' + (activeGame === 'detective' ? '<span class="student-file-code">HS-' + student.caseCode + '</span>' : '') + '</article>';
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
  const MUSIC = {
    prince: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46],
    penalty: [392, 440, 523.25, 392, 349.23, 466.16],
    detective: [293.66, 349.23, 392, 311.13, 349.23, 261.63],
    ufo: [523.25, 659.25, 987.77, 783.99, 659.25, 1174.66],
    postal: [587.33, 739.99, 880, 739.99, 659.25, 587.33],
    ferry: [440, 523.25, 659.25, 587.33, 523.25, 392]
  };
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
      chime() { [740, 988, 1175].forEach((note, i) => tone(note, .29, .026, 'sine', i * .081)); },
      bikeBell() {
        tone(1244, .18, .037 * strength, 'sine');
        tone(1661, .16, .026 * strength, 'triangle', .09);
      },
      doorKnock() {
        [0, .16, .33].forEach((when, index) => tone(130 + index * 7, .105, .057 * strength, 'triangle', when));
      },
      riverWave() { noise(.75, .18, 480, .42); noise(.46, .10, 1250, .6); },
      bikeEngine() { [0, .09, .18, .27].forEach(when => tone(86 + Math.random() * 14, .07, .022, 'sawtooth', when)); },
      brake() { tone(1320, .22, .014, 'sawtooth'); noise(.3, .12, 2100, 1.4); },
      doorOpen() { tone(196, .26, .03, 'sawtooth'); tone(247, .22, .022, 'triangle', .14); noise(.2, .07, 700); },
      oops() { [523, 415, 311].forEach((note, i) => tone(note, .2, .032, 'triangle', i * .15)); },
      hmm() { tone(294, .24, .03, 'sine'); tone(370, .3, .028, 'sine', .27); },
      gulp() { tone(330, .09, .035, 'sine'); tone(180, .16, .04, 'sine', .1); },
      cry() { [0, .34, .68, 1.02].forEach(when => { tone(740, .2, .02, 'sine', when); tone(587, .18, .017, 'sine', when + .13); }); },
      countBeep() { tone(880, .17, .035, 'square'); },
      boatHorn() { tone(220, .55, .035, 'sawtooth'); tone(277, .55, .025, 'sawtooth'); },
      wind() { noise(1.5, .13, 620, 1.8); noise(1.1, .07, 1180, 2.6); },
      thunder() { noise(1.1, .3, 150, .45); noise(.5, .15, 420, .7); tone(52, .8, .07, 'sawtooth'); },
      splash() { noise(.45, .17, 1500, .6); noise(.3, .1, 700, .8); },
      bigWave() { noise(1.3, .26, 380, .35); noise(.8, .12, 1300, .5); },
      rainbow() { [523, 659, 784, 988, 1175, 1319].forEach((note, i) => tone(note, .42, .024, 'sine', i * .11)); },
      hop() { tone(520 + Math.random() * 260, .08, .018, 'triangle'); },
      snore() { tone(110, .45, .03, 'triangle'); tone(98, .55, .026, 'triangle', .6); },
      call() { [659, 880, 784].forEach((note, i) => tone(note, .22, .028, 'triangle', i * .17)); },
      giggle() { [880, 1047, 988, 1175, 1047].forEach((note, i) => tone(note, .09, .024, 'sine', i * .09)); },
      ufoScan() { [880, 784, 659].forEach((note, i) => tone(note, .24, .025, 'sine', i * .12)); },
      ufoLock() { [523, 784, 1047].forEach((note, i) => tone(note, .34, .032, 'triangle', i * .105)); },
      ufoDepart() { [988, 1175, 1397].forEach((note, i) => tone(note, .22, .02, 'sine', i * .09)); },
      ufoRadar() { [1568, 1568, 1760].forEach((note, i) => tone(note, .07, .02, 'square', i * .16)); },
      ufoAbduct() {
        // tiếng "vù… u…" kéo lên: dao động trượt từ trầm lên cao, có rung nhẹ
        const now = ctx.currentTime;
        const lift = ctx.createOscillator(); const wobble = ctx.createOscillator(); const depth = ctx.createGain(); const envelope = ctx.createGain();
        lift.type = 'sine'; lift.frequency.setValueAtTime(190, now); lift.frequency.exponentialRampToValueAtTime(1250, now + 1.9);
        wobble.frequency.value = 9; depth.gain.value = 26; wobble.connect(depth); depth.connect(lift.frequency);
        envelope.gain.setValueAtTime(.0001, now); envelope.gain.exponentialRampToValueAtTime(.05, now + .2); envelope.gain.exponentialRampToValueAtTime(.0001, now + 2.05);
        lift.connect(envelope); envelope.connect(ctx.destination);
        lift.start(now); wobble.start(now); lift.stop(now + 2.1); wobble.stop(now + 2.1);
        tone(1568, .3, .025, 'triangle', 1.95); tone(2093, .35, .02, 'sine', 2.05);
      }
    };
    effects[effect]?.();
  }
  /* Thời gian đọc cho học sinh tiểu học: tính theo số TIẾNG trong câu (lớp 1 đọc chậm). */
  function readTime(text) {
    const words = String(text).trim().split(/\s+/).filter(Boolean).length;
    return Math.round(Math.min(8000, Math.max(2600, 1600 + words * 480)) * (PACE[settings.seconds] || 1));
  }
  let lineUntil = 0, dialogueChain = Promise.resolve(), dialogueEpoch = 0;
  /* Xếp hàng lời thoại: câu sau chỉ hiện khi câu trước đã đứng đủ thời gian đọc. Rời trò / bấm “Hiện kết quả” thì bỏ hàng chờ. */
  function typeDialogue(text, duration = 520) {
    const epoch = dialogueEpoch, signal = storyRun?.controller.signal;
    const run = dialogueChain.then(async () => {
      if (epoch !== dialogueEpoch || signal?.aborted) return;
      const wait = lineUntil - performance.now();
      if (wait > 0) await new Promise(resolve => { const t = setTimeout(resolve, wait); signal?.addEventListener('abort', () => { clearTimeout(t); resolve(); }, { once: true }); });
      if (epoch !== dialogueEpoch || signal?.aborted) return;
      await typeNow(text, Math.max(duration, Math.min(2200, Array.from(String(text)).length * 40)));
      lineUntil = performance.now() + readTime(text);
    });
    dialogueChain = run.catch(() => {});
    return run;
  }
  async function typeNow(text, duration) {
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
  /* Lời thoại phải ĐỌC KỊP: gõ chữ vừa phải rồi đứng yên một lúc (câu dài đứng lâu hơn) trước khi sang nhịp sau.
     Nhịp “Hồi hộp” giữ lâu hơn; nút “Hiện kết quả” vẫn cắt ngang được ngay. */
  async function say(text, duration) {
    const signal = storyRun?.controller.signal;
    await typeDialogue(text, duration || 520);
    signal?.throwIfAborted();
    await delay(Math.max(0, lineUntil - performance.now())); // đứng yên cho cả lớp đọc xong
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
  /* tên hiện lần lượt từng chữ (tách theo kí tự tiếng Việt đủ dấu, vẫn xuống dòng theo từ như chữ thường) */
  function typeOut(node) {
    const text = node.textContent;
    const letters = window.Intl?.Segmenter ? Array.from(new Intl.Segmenter('vi').segment(text), part => part.segment) : Array.from(text.normalize('NFC'));
    node.setAttribute('aria-label', text);
    node.replaceChildren(...letters.map((letter, index) => {
      const span = Object.assign(document.createElement('span'), { className: 'journey-letter', textContent: letter });
      span.style.setProperty('--letter', index);
      return span;
    }));
  }
  function reveal(batch) {
    const meta = GAME[activeGame];
    const isUfo = activeGame === 'ufo';
    const isJourney = Boolean(meta.journey);
    const story = isJourney ? scene.resultText(batch) : null;
    const overlay = $('#resultOverlay', root);
    overlay.classList.toggle('ufo-result', isUfo);
    overlay.classList.toggle('journey-result', isJourney);
    overlay.classList.toggle('postal-result', activeGame === 'postal');
    overlay.classList.toggle('ferry-result', activeGame === 'ferry');
    $('#resultEyebrow', root).textContent = story ? story.eyebrow : activeGame === 'detective' ? 'HỒ SƠ ĐÃ MỞ' : activeGame === 'penalty' ? 'BẢNG TỈ SỐ VỪA SÁNG' : activeGame === 'ufo' ? 'UFO ĐÃ CHỌN · LÊN TRẢ BÀI' : 'LỜI MỜI TỪ LÂU ĐÀI';
    $('#resultIcon', root).textContent = meta.icon;
    $('#resultIcon', root).hidden = isUfo;
    const heading = $('#resultHeading', root);
    heading.setAttribute('aria-describedby', isUfo ? 'resultEyebrow' : 'resultNames resultCaption');
    if (isUfo) {
      heading.innerHTML = batch.map(student => '<span>' + esc(student.name.toLocaleUpperCase('vi')) + '</span>').join(' ');
      heading.dataset.count = batch.length;
    } else {
      delete heading.dataset.count;
      heading.textContent = story ? story.heading : activeGame === 'detective' ? 'Đã tìm ra nghi phạm!' : activeGame === 'penalty' ? 'VÀOOOO! Được gọi rồi!' : 'Hoàng tử đã chọn!';
    }
    $('#resultNames', root).innerHTML = batch.map((student, index) => '<span class="caller-result-person' + (isUfo ? ' ufo-result-person' : '') + '" style="--person-index:' + index + '">' + (story ? '<i class="journey-portrait" aria-hidden="true"><img src="' + esc(story.portrait(student)) + '" alt=""></i>' : isUfo ? makeAvatar(student) : '<i class="caller-medal" aria-hidden="true">' + esc(Array.from(student.name.trim().split(/\s+/).pop() || '?')[0].toUpperCase()) + '</i>') + '<b>' + esc(student.name) + '</b></span>').join('');
    if (story?.typed) $$('#resultNames .caller-result-person b', root).forEach(typeOut);
    $('#resultCaption', root).textContent = isUfo ? '' : story ? story.caption : batch.length > 1 ? 'Các bạn cùng lên trả lời câu hỏi của cô giáo nhé!' : activeGame === 'detective' ? 'Mời em lên trả lời câu hỏi của cô giáo!' : activeGame === 'penalty' ? 'Cả sân vận động đang cổ vũ cho em!' : 'Nàng có đồng ý cùng hoàng tử trả lời câu hỏi không?';
    if (story?.note) $('#resultCaption', root).append(Object.assign(document.createElement('em'), { className: 'caller-result-note', textContent: story.note }));
    $('#resultCaption', root).hidden = isUfo;
    $('#playAgain', root).textContent = story ? story.again : isUfo ? 'Gọi tiếp' : 'Chơi lại ↻';
    $('#resultHome', root).textContent = isUfo || isJourney ? 'Xong' : 'Về màn hình chính';
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
    if (!isUfo) makeConfetti();
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
    const began = performance.now();
    await say(pickLine(game, name), Math.min(540, wait));
    tone(game === 'penalty' ? 440 : game === 'detective' ? 310 : 660, .08, .025, 'sine');
    await delay(Math.max(50, wait - (performance.now() - began)));
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
    const decoys = secureShuffle(pool.filter(student => !batch.some(winner => winner.id === student.id)));
    const reactions = ['Đổi chân rồi!', 'Bóng dội cột! Vẫn đang lăn…', 'Thủ môn đổ người! Bóng tuột tay mất rồi!'];
    let aim = randomIndex(Math.max(1, decoys.length));
    for (let index = 0; index < batch.length; index++) {
      /* mỗi cú sút thật có 1–4 cú sút lừa tuỳ thời gian; mỗi cú lừa khoảng 11 giây kể cả lúc đọc */
      const kicksLeft = batch.length - index;
      const fakes = Math.max(1, Math.min(4, Math.floor((timeLeft() / kicksLeft - 9000) / 11000)));
      for (let f = 0; f < fakes; f++) {
        const falseAim = decoys.length ? decoys[aim++ % decoys.length] : batch[index];
        scene?.prepareShot();
        await say(f === 0 ? 'Cầu thủ lùi lại… thủ môn đang đoán hướng sút!' : 'Lại lùi lấy đà… cả sân im phăng phắc!', 480);
        setEmotion([falseAim], 'is-candidate');
        scene?.travel(falseAim);
        await say('Sút về phía ' + falseAim.name + ' à?!', 400);
        const trick = randomIndex(3);
        scene?.fakeShot(trick);
        await delay(trick === 0 ? 450 : 1150);
        await say(reactions[trick], 290);
      }
      if (index === batch.length - 1) {
        if (timeLeft() > 9000) {
          await say('Cả sân đang nín thở chờ cú sút cuối…', 490);
          await delay(Math.max(0, timeLeft() - 6500));
        }
        await spotlight(1540, () => scene?.scoreShot(index, true, batch[index]));
      } else {
        scene?.scoreShot(index, false, batch[index]);
        await delay(Math.max(2600, scene?.revealWait?.() || 0)); // đủ lâu để đọc tên trước cú sút sau
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
        const clueBegan = performance.now();
        await say('Manh mối ' + (index + 1) + ': ' + clue.text, Math.min(530, clueTime * .68));
        scene?.stampClue(clue);
        survivors = clue.remaining;
        const survivorIds = new Set(survivors.map(student => student.id));
        $$('.caller-student', board).forEach(tile => {
          if (candidateIds.has(tile.dataset.id) && !survivorIds.has(tile.dataset.id)) tile.classList.add('is-eliminated');
        });
        setEmotion(survivors.length > 1 ? [survivors[randomIndex(survivors.length)]] : []);
        await delay(Math.max(600, clueTime - (performance.now() - clueBegan)));
      }
      await considerDecoy();
      if (caseIndex === batch.length - 1) {
        await spotlight(1180, () => { setEmotion([target], 'is-pointed'); scene?.travel(target, true); });
        scene?.confirmSuspect?.(target);
        await say('Đã tìm ra rồi! Mở hồ sơ nào…', 510);
      } else {
        await focusOn(target, 'is-pointed', 270);
        scene?.confirmSuspect?.(target);
        await delay(Math.max(320, scene?.revealWait?.() || 0)); // đọc xong hồ sơ mới sang vụ án kế
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
    if (!getGameRoster().length) { addNames(); return; }
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
    $('#stageStatus', root).textContent = draw.game === 'ufo' ? 'UFO đang tìm tín hiệu…' : 'Câu chuyện đang bắt đầu…';
    if (savedSound.checked) { soundContext(); startMusic(); }
    try {
      scene?.reset();
      if (draw.game === 'ufo' || meta.journey) {
        const winnerIds = new Set(batch.map(student => student.id));
        const decoys = secureShuffle(pool.filter(student => !winnerIds.has(student.id)));
        await scene.play(batch, decoys, {
          pace: PACE[settings.seconds] || 1,
          wait: delay,
          focus: (student, mood) => setEmotion(student ? [student] : [], mood),
          status: text => { if (storyRun === run) $('#stageStatus', root).textContent = text; }
        });
      } else {
        const begin = performance.now();
        const totalMs = settings.seconds * 1000;
        const timeLeft = () => totalMs - (performance.now() - begin);
        if (draw.game === 'prince') await playPrince(batch, pool, totalMs, timeLeft);
        if (draw.game === 'penalty') await playPenalty(batch, pool, totalMs, timeLeft);
        if (draw.game === 'detective') await playDetective(batch, pool, totalMs);
        await delay(scene?.revealWait?.() || 0);
        const remainder = timeLeft();
        if (remainder > 0) await delay(remainder);
      }
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
    placeBoardForGame(key);
    activeGame = key;
    dialogueSequence++; dialogueEpoch++; lineUntil = 0;
    const meta = GAME[key];
    home.hidden = true; play.hidden = false;
    $('#playGameIcon', root).textContent = meta.icon;
    $('#playGameName', root).textContent = meta.name;
    $('#playGameSubtitle', root).textContent = meta.subtitle;
    const speedLabels = key === 'ufo' || meta.journey ? shortSpeedLabels : storySpeedLabels;
    Array.from(liveSpeed.options).forEach((option, index) => { option.textContent = speedLabels[index]; });
    $('#stageTheme', root).textContent = key === 'prince' ? 'KHU VƯỜN TRƯỚC LÂU ĐÀI' : key === 'penalty' ? 'SÂN VẬN ĐỘNG ĐÊM' : key === 'detective' ? 'VĂN PHÒNG THÁM TỬ' : meta.name.toLocaleUpperCase('vi');
    $('#dialogueAvatar', root).textContent = key === 'prince' ? '♘' : key === 'penalty' ? '⚽' : key === 'detective' ? '⌕' : '🛸';
    $('#dialogueText', root).textContent = key === 'prince' ? 'Gió đang lay cờ trên tháp… ai sẽ được mời lên ngựa?' : key === 'penalty' ? 'Khán đài đã sáng đèn. Cầu thủ đang đặt bóng…' : key === 'detective' ? 'Mưa rơi ngoài cửa sổ. Một vụ án mới bắt đầu…' : 'Bầu trời đêm vừa nhận được một tín hiệu lạ…';
    $('#resultOverlay', root).hidden = true; $('#resultOverlay', root).classList.remove('is-shown');
    gameStage.className = 'caller-stage scene-' + meta.scene;
    play.classList.toggle('caller-journey-play', Boolean(meta.journey));
    renderRoster();
    const cinema = $('#callerCinema', root);
    if (key === 'ufo') scene = createUfoCinema(cinema, board, { sound: soundEffect });
    else if (meta.journey) scene = meta.journey(cinema, { avatar: makeAvatar, sound: soundEffect, roster: getGameRoster });
    else scene = createCinema(cinema, meta.scene, { gsap, sound: soundEffect });
    updateGameStats();
    if (savedSound.checked) startMusic();
  }
  function goHome() {
    if (busy) return;
    stopMusic();
    dialogueSequence++; dialogueEpoch++; lineUntil = 0;
    if (scene) { scene.destroy(); scene = null; }
    placeBoardForGame('home');
    activeGame = ''; play.hidden = true; home.hidden = false; setRoster();
  }
  async function refreshRound() {
    if (busy || !activeGame) return;
    settings.daily.round = { girls: [], boys: [], all: [] };
    persist(); renderRoster(); updateGameStats();
    if (activeGame !== 'ufo' && !GAME[activeGame].journey) await typeDialogue('Một lượt mới bắt đầu! Các bạn sẵn sàng chưa?', 420);
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
  $('#importClass', root).onclick = () => importFromClass().catch(error => window.GV?.fail?.(error));
  /* chưa có tên khi đang ở màn chơi: mở thẳng hộp lấy tên, không bắt thầy cô tự tìm đường quay lại */
  function addNames() { if (window.GV?.load) importFromClass().catch(() => typeNames()); else typeNames(); }
  function typeNames() {
    const scope = GAME[activeGame]?.scope;
    if (activeGame && !busy) goHome();
    const box = $(scope === 'boys' ? '#boysNames' : '#girlsNames', root);
    requestAnimationFrame(() => { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); box.focus({ preventScroll: true }); });
  }
  /* Nối luồng Lớp học → Gọi tên: lấy tên học sinh đã kết nối với lớp, chia Nữ / Nam.
     Máy chủ không lưu giới tính nên đoán theo tên, thầy cô bấm sửa; lựa chọn được nhớ theo từng học sinh trên máy này. */
  async function importFromClass() {
    const GV = window.GV;
    if (!GV?.load) return;
    const [classes, students] = await Promise.all([GV.load('classes', true), GV.load('students', true)]);
    if (!classes.length) {
      const d0 = GV.dialog('<h2>📋 Thêm danh sách</h2><p>Thầy cô chưa phụ trách lớp nào trên máy chủ, nên chưa lấy tên từ lớp được. Thầy cô có thể <b>tự nhập tên</b> (mỗi dòng một bạn), hoặc tạo lớp ở mục <a href="#lop" data-close>Lớp học</a> / nhờ quản trị giao lớp.</p><div class="actions"><button class="btn" data-close>Đóng</button><button class="btn primary" id="ciType">✍️ Tự nhập tên</button></div>');
      $('#ciType', d0).onclick = () => { d0.close(); typeNames(); };
      return;
    }
    const saved = (() => { try { return JSON.parse(localStorage.getItem(GENDER_KEY) || '{}') || {}; } catch { return {}; } })();
    const options = classes.map(c => { const n = students.filter(s => s.classCode === c.code).length; return '<option value="' + GV.esc(c.code) + '">' + GV.esc((c.name || 'Lớp ' + c.code) + ' · ' + n + ' học sinh') + '</option>'; }).join('');
    const d = GV.dialog('<h2>📋 Lấy tên từ lớp</h2><form class="form caller-import-form" id="ciForm"><label class="field"><span>Lớp</span><select id="ciClass">' + options + '</select></label>' +
      '<p class="hint">Trò <b>Hoàng tử</b> gọi các bạn nữ, <b>Sút phạt đền</b> gọi các bạn nam, <b>Thám tử</b> gọi cả lớp. Máy đoán Nữ/Nam theo tên – thầy cô bấm để sửa những bạn đoán sai.</p>' +
      '<div class="caller-import-head"><b id="ciCount"></b><span><button type="button" class="btn sm" data-all="nu">Tất cả Nữ</button><button type="button" class="btn sm" data-all="nam">Tất cả Nam</button></span></div>' +
      '<div class="caller-import-list" id="ciList"></div>' +
      '<p class="hint">Danh sách hiện tại trên trang sẽ được thay bằng danh sách lớp này.</p><div class="actions"><button type="button" class="btn" id="ciType">✍️ Tự nhập tên</button><button type="button" class="btn" data-close>Huỷ</button><button class="btn primary" id="ciOk">Đưa vào danh sách</button></div></form>');
    $('#ciType', d).onclick = () => { d.close(); typeNames(); };
    let rows = [];
    const draw = () => {
      const code = $('#ciClass', d).value;
      rows = students.filter(s => s.classCode === code).map(s => ({ id: s.classCode + ':' + s.id, name: String(s.name || '').trim(), profileGender: s.gender })).filter(r => r.name)
        .sort((a, b) => a.name.split(' ').pop().localeCompare(b.name.split(' ').pop(), 'vi') || a.name.localeCompare(b.name, 'vi'));
      rows.forEach(r => { r.gender = saved[r.id] || r.profileGender || guessGender(r.name); });
      const girls = rows.filter(r => r.gender === 'nu').length;
      $('#ciCount', d).textContent = rows.length ? rows.length + ' bạn · ' + girls + ' nữ · ' + (rows.length - girls) + ' nam' : '';
      $('#ciList', d).innerHTML = rows.length ? rows.map((r, i) => '<div class="caller-import-row"><span>' + GV.esc(r.name) + '</span><span class="caller-import-pick" role="group" aria-label="Giới tính của ' + GV.esc(r.name) + '">' +
        '<button type="button" data-i="' + i + '" data-g="nu" aria-pressed="' + (r.gender === 'nu') + '">👧 Nữ</button><button type="button" data-i="' + i + '" data-g="nam" aria-pressed="' + (r.gender === 'nam') + '">👦 Nam</button></span></div>').join('')
        : '<p class="hint">Lớp này chưa có học sinh nào kết nối. Học sinh nhập mã lớp trên máy của em (Cài đặt → Lớp học của em) là tên hiện ở đây.</p>';
      $('#ciOk', d).disabled = !rows.length;
    };
    draw();
    $('#ciClass', d).onchange = draw;
    $('#ciList', d).onclick = event => {
      const b = event.target.closest('button[data-g]'); if (!b) return;
      const r = rows[Number(b.dataset.i)]; r.gender = b.dataset.g; saved[r.id] = r.gender;
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const girls = rows.filter(x => x.gender === 'nu').length;
      $('#ciCount', d).textContent = rows.length + ' bạn · ' + girls + ' nữ · ' + (rows.length - girls) + ' nam';
    };
    d.querySelectorAll('[data-all]').forEach(b => b.onclick = () => { rows.forEach(r => { r.gender = b.dataset.all; saved[r.id] = r.gender; }); const keep = $('#ciClass', d).value; draw(); $('#ciClass', d).value = keep; });
    $('#ciForm', d).onsubmit = event => {
      event.preventDefault();
      rows.forEach(r => { saved[r.id] = r.gender; });
      try { localStorage.setItem(GENDER_KEY, JSON.stringify(saved)); } catch { /* bộ nhớ đầy */ }
      $('#girlsNames', root).value = rows.filter(r => r.gender === 'nu').map(r => r.name).join('\n');
      $('#boysNames', root).value = rows.filter(r => r.gender === 'nam').map(r => r.name).join('\n');
      setRoster();
      d.close();
      GV.toast('Đã đưa ' + rows.length + ' bạn vào danh sách. Chọn trò để bắt đầu!');
    };
  }
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

const GENDER_KEY = 'vuonchu.callerGender.v2';
/* Đoán Nữ/Nam theo tên Việt: tên đệm “Thị” → nữ; “Văn” → nam; còn lại theo tên chính hay gặp. Chỉ là gợi ý để thầy cô sửa. */
const NU = new Set(['an','anh','chi','châu','diệp','dung','duyên','giang','hà','hạnh','hằng','hân','hiền','hoa','hồng','hương','hường','huyền','khuê','lam','lan','liên','linh','loan','ly','mai','my','mỹ','nga','ngân','nghi','ngọc','nguyệt','nhi','nhung','như','oanh','phương','quyên','quỳnh','thảo','thơ','thư','thùy','thuỳ','thủy','thuỷ','trang','trâm','trinh','tú','tuyết','uyên','vân','vi','vy','xuân','yến','hậu','ngà','thanh','thu','hoài','diệu','tâm','tiên','trà','em']);
const NAM_DEM = new Set(['văn','đức','quốc','thành','trọng','công','hữu','đình','xuân','mạnh']);
const NU_DEM = new Set(['thị','ngọc','thùy','thuỳ','diệu','khánh','phương','thảo','mai','tuệ']);
const NAM = new Set(['an','bình','dũng','huy','khang','long','minh','nam','phúc','quân','sơn','trí','tuấn','hùng','hải','khoa','kiên','lâm','lộc','nhân','phong','quang','tài','thắng','thịnh','toàn','trung','tùng','việt','vinh','vũ','bảo','đạt','đăng','duy','hiếu','hoàng','khôi','kiệt','nguyên','phát','tín','tiến','tường']);
function guessGender(name) {
  const words = String(name).toLocaleLowerCase('vi').normalize('NFC').split(/\s+/).filter(Boolean);
  const given = words[words.length - 1] || '', middle = words.slice(1, -1);
  if (middle.includes('thị')) return 'nu';
  if (middle.includes('văn')) return 'nam';
  if (NAM.has(given) && !NU.has(given)) return 'nam';
  if (NU.has(given) && !NAM.has(given)) return 'nu';
  if (middle.some(w => NU_DEM.has(w))) return 'nu';
  if (middle.some(w => NAM_DEM.has(w))) return 'nam';
  return NU.has(given) ? 'nu' : 'nam';
}

window.GV && window.GV.register('goi-ten', 'Gọi tên', page);
