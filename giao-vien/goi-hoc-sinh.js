import * as PIXI from '../assets/vendor/pixi.min.mjs';
import { makeRoster, parseNames, selectBatch, recordBatch, normalizeDailyState, buildDetectiveClues, secureShuffle } from './goi-hoc-sinh-core.mjs';

/* Three original classroom mini-games. PIXI draws each living scene; GSAP choreographs the story. */
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
  let currentTimeline = null;
  let disposed = false;
  let lineDeck = {};

  view.innerHTML = `
    <main class="caller-page" id="teacherCallerGames">
      <section class="caller-home" id="callerHome">
        <header class="caller-welcome">
          <div class="caller-brand-orb" aria-hidden="true"><span>✦</span><b>HÔM NAY AI?</b><i>✦</i></div>
          <div class="caller-welcome-copy"><span class="caller-eyebrow">SÂN KHẤU GỌI TÊN · VƯỜN CHỮ</span><h2>Chọn một cuộc phiêu lưu</h2><p>Mỗi lượt là một câu chuyện khác nhau. Ai sẽ được mời lên trả lời nhỉ?</p></div>
          <div class="caller-welcome-badge"><span>🎲</span><b>Chọn công bằng</b><small>Hoạt cảnh chỉ tạo hồi hộp</small></div>
        </header>

        <section class="caller-game-grid" aria-label="Chọn trò chơi">
          <button class="caller-game-card prince-card" data-open-game="prince" type="button">
            <span class="game-card-scene prince-scene" aria-hidden="true"><i class="castle-spire spire-a"></i><i class="castle-spire spire-b"></i><i class="castle-tower"></i><i class="castle-cloud cloud-a"></i><i class="game-horse">♞</i><i class="garden-flower flower-a">✿</i><i class="garden-flower flower-b">✦</i><i class="scene-ribbon">MỞ CỔNG</i></span>
            <span class="game-card-copy"><span class="game-card-kicker">SÂN KHẤU CỔ TÍCH</span><b>Hoàng tử cưỡi ngựa</b><small>Đoán xem hoàng tử sẽ dừng trước ai…</small><span class="game-card-action">DÀNH CHO NỮ <i>↗</i></span></span>
          </button>
          <button class="caller-game-card penalty-card" data-open-game="penalty" type="button">
            <span class="game-card-scene stadium-scene" aria-hidden="true"><i class="stadium-light"></i><i class="goal-net"></i><i class="stadium-ball">⚽</i><i class="stadium-player">●</i><i class="stadium-crowd">▴ ▴ ▴ ▴ ▴ ▴</i><i class="scene-ribbon">VÀO TRẬN</i></span>
            <span class="game-card-copy"><span class="game-card-kicker">ĐÊM CHUNG KẾT</span><b>Sút phạt đền</b><small>Bóng đổi hướng phút chót, ai sẽ được gọi?</small><span class="game-card-action">DÀNH CHO NAM <i>↗</i></span></span>
          </button>
          <button class="caller-game-card detective-card" data-open-game="detective" type="button">
            <span class="game-card-scene office-scene" aria-hidden="true"><i class="desk-lamp"></i><i class="case-board"><b>✦</b><b>✦</b><b>✦</b></i><i class="magnifier">⌕</i><i class="rain-lines"></i><i class="scene-ribbon">MỞ HỒ SƠ</i></span>
            <span class="game-card-copy"><span class="game-card-kicker">VỤ ÁN TRONG LỚP</span><b>Thám tử tìm nghi phạm</b><small>Manh mối đang dẫn tới bạn nào đây?</small><span class="game-card-action">CẢ LỚP <i>↗</i></span></span>
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

        <section class="caller-history-home"><div class="caller-history-title"><span>✨</span><div><b>Đã gọi hôm nay</b><small id="todayCount">Chưa có bạn nào</small></div><button id="refreshRound" type="button" title="Cho cả lớp một lượt mới">Làm mới lượt gọi <i>↻</i></button></div><div class="caller-history-chips" id="todayHistory"><span class="caller-history-empty">Lịch sử hôm nay sẽ xuất hiện ở đây.</span></div></section>
        <p class="caller-fairness-note">🎓 Tên được chọn ngẫu nhiên ngay khi bắt đầu. Các cú lừa, cú sút và manh mối chỉ làm sân khấu hồi hộp hơn.</p>
      </section>

      <section class="caller-play" id="callerPlay" hidden>
        <header class="caller-play-top"><button class="caller-home-button" id="backHome" type="button">← Chọn trò khác</button><div class="caller-play-title"><span id="playGameIcon">✦</span><div><b id="playGameName"></b><small id="playGameSubtitle"></small></div></div><div class="caller-play-tools"><label class="caller-count-live"><span>Số bạn</span><select id="liveCount"><option value="1">1 bạn</option><option value="2">2 bạn</option><option value="3">3 bạn</option></select></label><label class="caller-count-live"><span>Nhịp chơi</span><select id="liveSpeed"><option value="10">Nhanh · 10s</option><option value="15">Vừa · 15s</option><option value="20">Hồi hộp · 20s</option></select></label><label class="caller-sound"><input type="checkbox" id="soundToggle"><span>♫</span><b>Âm thanh</b></label><button class="caller-tool-icon" id="fullscreenToggle" type="button" title="Toàn màn hình">⛶</button></div></header>
        <section class="caller-stage" id="gameStage" aria-label="Sân khấu hoạt hình">
          <div class="caller-pixi-host" id="pixiHost" aria-hidden="true"></div>
          <div class="caller-stage-shade"></div>
          <div class="caller-stage-topline"><span class="caller-stage-chip"><i></i><b id="stageTheme">VƯỜN CỔ TÍCH</b></span><span id="stageStatus">Sân khấu đã sẵn sàng</span><button id="roundProgress" type="button">Lượt <b>0</b>/<i>0</i> · <u>Làm mới</u></button></div>
          <div class="caller-dialogue" id="dialogueBox"><span class="caller-dialogue-avatar" id="dialogueAvatar">✦</span><p id="dialogueText">Chọn nút bên dưới để bắt đầu câu chuyện nhé!</p><span class="dialogue-tail"></span></div>
          <div class="caller-board-wrap"><div class="caller-name-board" id="nameBoard" role="list" aria-label="Tên học sinh"></div><div class="caller-no-names" id="noNames" hidden><span>📜</span><b>Sân khấu đang chờ tên học sinh</b><small>Về màn hình trước và dán danh sách phù hợp với trò chơi này.</small></div></div>
          <div class="caller-slow-overlay" id="slowOverlay"><span>✦</span><b>KHOẢNH KHẮC QUYẾT ĐỊNH</b><i></i></div>
          <div class="caller-result-overlay" id="resultOverlay" hidden><div class="caller-result-rays"></div><div class="caller-result-card"><span class="caller-result-eyebrow" id="resultEyebrow">HỒ SƠ ĐÃ MỞ</span><span class="caller-result-icon" id="resultIcon">🌟</span><b id="resultHeading">Đã tìm ra!</b><div class="caller-result-names" id="resultNames"></div><small id="resultCaption">Mời bạn lên trả lời câu hỏi của cô giáo!</small><div class="caller-result-actions"><button id="playAgain" class="caller-play-again" type="button">Chơi lại ↻</button><button id="resultHome" class="caller-result-home" type="button">Về màn hình chính</button></div></div><div class="caller-confetti" id="confetti" aria-hidden="true"></div></div>
          <div class="caller-stage-vignette"></div>
        </section>
        <footer class="caller-play-controls"><div><button id="startStory" class="caller-main-action" type="button"><span>✦</span><b>Bắt đầu câu chuyện</b><i>→</i></button><small id="playHint">Kết quả đã sẵn sàng, cả lớp cùng đoán nhé!</small></div><div class="caller-live-stats"><span><b id="remainingCount">0</b><small>còn lượt</small></span><span class="caller-stat-divider"></span><span><b id="calledCount">0</b><small>đã gọi hôm nay</small></span></div></footer>
      </section>
    </main>`;

  const root = $('#teacherCallerGames', view);
  const home = $('#callerHome', root);
  const play = $('#callerPlay', root);
  const gameStage = $('#gameStage', root);
  const board = $('#nameBoard', root);
  const startButton = $('#startStory', root);
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
    $('#todayHistory', root).innerHTML = items.length ? items.slice(-16).reverse().map((item, index) => '<span class="caller-history-chip" style="--chip-index:' + index + '"><i>' + (GAME[item.game]?.icon || '✦') + '</i>' + esc(item.name) + '</span>').join('') : '<span class="caller-history-empty">Lịch sử hôm nay sẽ xuất hiện ở đây.</span>';
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
    $('#playHint', root).textContent = !list.length ? 'Hãy thêm tên ở danh sách trước khi chơi.' : left ? 'Kết quả được chọn ngay khi bắt đầu; hoạt cảnh chỉ tạo bất ngờ.' : 'Đã hết lượt của nhóm này. Bấm “Làm mới lượt gọi” để chơi tiếp.';
    startButton.disabled = busy || !left;
    startButton.querySelector('b').textContent = busy ? 'Đang diễn ra…' : left ? meta.start : 'Đã hết lượt trong vòng';
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
      $$('button', group).forEach(button => button.classList.toggle('is-selected', Number(button.dataset.value) === Number(selected)));
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
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
  async function typeDialogue(text, duration = 520) {
    const box = $('#dialogueBox', root); const target = $('#dialogueText', root);
    box.classList.remove('is-speaking'); void box.offsetWidth; box.classList.add('is-speaking');
    target.textContent = '';
    const letters = Array.from(text);
    const interval = Math.max(8, Math.min(34, duration / Math.max(letters.length, 1)));
    for (const character of letters) { if (!root.isConnected) return; target.textContent += character; await delay(interval); }
  }
  function setEmotion(students, className = 'is-candidate') {
    $$('.caller-student', board).forEach(tile => tile.classList.remove('is-candidate', 'is-winner', 'is-pointed'));
    if (activeGame !== 'detective') $$('.caller-student', board).forEach(tile => tile.classList.remove('is-eliminated'));
    students.forEach(student => {
      const tile = $('.caller-student[data-id="' + CSS.escape(student.id) + '"]', board);
      if (tile) tile.classList.add(className);
    });
  }
  async function spotlight(duration = 1100) {
    gameStage.classList.add('is-slow');
    if (scene) scene.setSlow(true);
    tone(activeGame === 'penalty' ? 145 : 94, .9, .055, 'sine');
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
    requestAnimationFrame(() => overlay.classList.add('is-shown'));
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
    if (scene) scene.travel(student.signature / 0xffffffff);
    await delay(wait);
  }
  async function interlude(game, name, wait = 650) {
    await typeDialogue(pickLine(game, name), Math.min(540, wait));
    tone(game === 'penalty' ? 440 : game === 'detective' ? 310 : 660, .08, .025, 'sine');
    await delay(Math.max(50, wait - 500));
  }

  async function playPrince(batch, pool, totalMs) {
    await typeDialogue('Nghe tiếng kèn gọi rồi! Cổng vườn đang mở…', 660); tone(880, .35, .04, 'triangle');
    if (scene) scene.enter();
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
    if (!direct && decoys.length) { await typeDialogue('À không, ta đổi ý rồi! Ngựa con, quay lại nào!', 560); tone(260, .24, .045, 'triangle'); if (scene) scene.turnBack(); await delay(beat * .42); }
    else { await typeDialogue('Ta đã chọn được rồi… nhưng còn một bí mật!', 550); if (scene) scene.turnBack(); await delay(beat * .4); }
    await spotlight(1250);
    for (let index = 0; index < batch.length; index++) {
      const winner = batch[index];
      if (index > 0) { await typeDialogue('Một hoàng tử khác phi vào khu vườn để đón bạn tiếp theo!', 440); if (scene) scene.newPrince(index); await delay(300); }
      await focusOn(winner, 'is-pointed', Math.max(320, beat * .42));
      await typeDialogue('Nàng ' + winner.name + ' có đồng ý cùng ta trả lời câu hỏi không?', 650);
      if (scene) scene.winner();
      tone(700, .2, .04, 'triangle'); await delay(Math.max(280, beat * .35));
    }
  }

  async function playPenalty(batch, pool, totalMs) {
    await typeDialogue('Trận đấu đang ở phút quyết định… Đặt bóng nào!', 620); tone(190, .22, .04, 'square');
    if (scene) scene.enter();
    await delay(totalMs * .08);
    const beat = Math.max(520, totalMs * .56 / batch.length);
    const decoys = secureShuffle(pool.filter(student => !batch.some(winner => winner.id === student.id)));
    for (let index = 0; index < batch.length; index++) {
      const falseAim = decoys.length ? decoys[(index * 2 + randomIndex(decoys.length)) % decoys.length] : batch[index];
      await typeDialogue('Cầu thủ lùi lại… thủ môn đang đoán hướng sút!', Math.min(500, beat * .3));
      if (scene) scene.prepareShot(index);
      await delay(beat * .16);
      await focusOn(falseAim, 'is-candidate', beat * .13);
      const trick = randomIndex(3);
      await typeDialogue(trick === 0 ? 'Sút về phía ' + falseAim.name + ' à?! Đổi chân rồi!' : trick === 1 ? 'Bóng dội cột! Vẫn đang lăn…' : 'Thủ môn đổ người! Bóng tuột tay mất rồi!', Math.min(520, beat * .3));
      if (scene) scene.fakeShot(trick);
      tone(140 + randomIndex(4) * 30, .19, .04, 'triangle'); await delay(beat * .12);
      await focusOn(batch[index], 'is-pointed', beat * .14);
      if (scene) scene.scoreShot(index);
      tone(560, .18, .035, 'sine'); await delay(beat * .12);
    }
    await spotlight(1250);
    await typeDialogue('VÀOOOO! Người được gọi chính là…', 650);
  }

  async function playDetective(batch, pool, totalMs) {
    await typeDialogue('Có một bí mật trong lớp này… thám tử bắt đầu điều tra!', 680); tone(330, .3, .035, 'triangle');
    if (scene) scene.enter();
    const clueCount = Math.max(3, Math.min(5, Math.floor(totalMs / Math.max(1, batch.length) / 1250)));
    const clueSlots = clueCount * batch.length;
    const beat = Math.max(390, totalMs * .57 / clueSlots);
    for (let caseIndex = 0; caseIndex < batch.length; caseIndex++) {
      const target = batch[caseIndex];
      const clueSet = buildDetectiveClues(pool, target, length => randomIndex(length), clueCount);
      let clues = clueSet.clues;
      if (clues.length < 3) {
        const fallback = ['Hồ sơ mang mã ' + target.caseCode + '.', 'Tên có ' + Array.from(target.name).length + ' kí tự.', 'Họ tên có ' + target.name.trim().split(/\s+/).length + ' tiếng.'];
        clues = fallback.slice(0, 3).map((text, i) => ({ text, remaining: i === 0 ? pool.filter(person => person.caseCode === target.caseCode) : i === 1 ? pool.filter(person => Array.from(person.name).length === Array.from(target.name).length) : pool.filter(person => person.name.trim().split(/\s+/).length === target.name.trim().split(/\s+/).length), removed: [] }));
      }
      for (const clue of clues) {
        await typeDialogue('Manh mối ' + (caseIndex + 1) + ': ' + clue.text, Math.min(500, beat * .58));
        if (scene) scene.stampClue();
        const survivors = new Set(clue.remaining.map(student => student.id));
        $$('.caller-student', board).forEach(tile => {
          if (pool.some(student => student.id === tile.dataset.id) && !survivors.has(tile.dataset.id)) tile.classList.add('is-eliminated');
        });
        const survivor = clue.remaining[randomIndex(clue.remaining.length)] || target;
        if (survivor.id === target.id) await focusOn(survivor, 'is-candidate', beat * .38);
        else { setEmotion([survivor], 'is-candidate'); await delay(beat * .34); }
        await delay(Math.max(80, beat * .2));
      }
      await typeDialogue('Hừm… hình như ta đã biết em là ai rồi…', 440);
      const decoy = pool.find(student => student.id !== target.id && !batch.some(winner => winner.id === student.id));
      if (decoy) { await focusOn(decoy, 'is-pointed', Math.max(200, beat * .35)); await typeDialogue('Ơ, không phải em! Kính lúp soi nhầm rồi!', 470); }
      await focusOn(target, 'is-pointed', 430);
      if (scene) scene.stampClue();
      await delay(180);
      // Restore the board for the next case; each selected student's own clues stay truthful.
      if (caseIndex < batch.length - 1) { $$('.caller-student', board).forEach(tile => tile.classList.remove('is-eliminated', 'is-candidate', 'is-pointed')); if (scene) scene.nextCase(); }
    }
    await spotlight(1250);
    await typeDialogue('Đã tìm ra: ' + batch.map(student => student.name).join(' và ') + '!', 650);
  }

  function updateWinnerHistory(batch, game) {
    recordBatch(settings.daily, batch, game, Date.now());
    persist(); updateHomeHistoryAndStats();
  }
  async function startStory() {
    if (busy || !activeGame) return;
    hashDay();
    const meta = GAME[activeGame];
    const pool = remaining(meta.scope);
    if (!pool.length) { updateGameStats(); return; }
    const batch = selectBatch(pool, settings.count, 'all', settings.daily, randomIndex);
    if (!batch.length) { updateGameStats(); return; }
    lineDeck = {};
    // The fair result is committed before the suspense animation begins.
    updateWinnerHistory(batch, activeGame);
    busy = true; updateGameStats();
    $('#resultOverlay', root).hidden = true; $('#resultOverlay', root).classList.remove('is-shown');
    $('#slowOverlay', root).classList.remove('is-active'); gameStage.classList.remove('is-slow');
    renderRoster(); setEmotion([]);
    $('#stageStatus', root).textContent = 'Câu chuyện đang bắt đầu…';
    $('#playAgain', root).disabled = true; $('#resultHome', root).disabled = true;
    if (savedSound.checked) { soundContext(); startMusic(); }
    if (scene) scene.reset(activeGame);
    const begin = performance.now(); const totalMs = settings.seconds * 1000;
    try {
      if (activeGame === 'prince') await playPrince(batch, pool, totalMs);
      if (activeGame === 'penalty') await playPenalty(batch, pool, totalMs);
      if (activeGame === 'detective') await playDetective(batch, pool, totalMs);
      const remainder = totalMs - (performance.now() - begin);
      if (remainder > 0) await delay(remainder);
      if (!root.isConnected || disposed) return;
      reveal(batch);
      $('#stageStatus', root).textContent = activeGame === 'detective' ? 'Vụ án đã khép lại!' : activeGame === 'penalty' ? 'Sân vận động vỡ òa!' : 'Lời mời đã được gửi đi!';
    } catch (error) {
      console.error('Caller game animation failed', error);
      if (root.isConnected) { await typeDialogue('Câu chuyện khựng lại một chút — kết quả đã được chọn rồi!', 450); reveal(batch); }
    } finally {
      busy = false; stopMusic();
      if ($('#playAgain', root)) { $('#playAgain', root).disabled = false; $('#resultHome', root).disabled = false; }
      updateGameStats();
      startButton.querySelector('b').textContent = remaining(meta.scope).length ? 'Chơi thêm một lượt' : 'Đã hết lượt trong vòng';
    }
  }

  function makeScene(mode) {
    const host = $('#pixiHost', root);
    const app = new PIXI.Application();
    const W = 1280; const H = 720;
    let rootLayer; let world; let actor; let ball; let keeper; let sparks = []; let stopped = false; let observer;
    const children = [];
    function shape(parent, draw) { const graphic = new PIXI.Graphics(); draw(graphic); parent.addChild(graphic); return graphic; }
    const fillRect = (graphic, x, y, w, h, color, alpha = 1) => graphic.rect(x, y, w, h).fill({ color, alpha });
    const circle = (graphic, x, y, r, color, alpha = 1) => graphic.circle(x, y, r).fill({ color, alpha });
    const ellipse = (graphic, x, y, rx, ry, color, alpha = 1) => graphic.ellipse(x, y, rx, ry).fill({ color, alpha });
    const line = (graphic, points, color, width = 2, alpha = 1) => { graphic.moveTo(points[0], points[1]); for (let i = 2; i < points.length; i += 2) graphic.lineTo(points[i], points[i + 1]); graphic.stroke({ color, width, alpha, cap: 'round', join: 'round' }); };
    function text(parent, content, x, y, style) { const label = new PIXI.Text({ text: content, style: new PIXI.TextStyle(style) }); label.anchor.set(.5); label.x = x; label.y = y; parent.addChild(label); return label; }
    function drawBackground() {
      world.removeChildren(); sparks = [];
      shape(world, g => fillRect(g, 0, 0, W, H, mode === 'garden' ? 0x527db7 : mode === 'stadium' ? 0x111e42 : 0x29283a));
      if (mode === 'garden') {
        shape(world, g => { fillRect(g, 0, 380, W, 340, 0x75be8b); ellipse(g, 180, 420, 330, 150, 0x90d18d); ellipse(g, 1080, 430, 360, 168, 0x7dc87f); ellipse(g, 640, 600, 730, 220, 0x4caa78); });
        shape(world, g => { circle(g, 1050, 98, 53, 0xffe9a0, .86); circle(g, 1033, 80, 47, 0x6f95c0, .38); });
        for (let i = 0; i < 7; i++) {
          const x = 95 + i * 184;
          const cloud = new PIXI.Container(); cloud.x = x; cloud.y = 100 + (i % 3) * 45;
          shape(cloud, g => { ellipse(g, 0, 10, 45, 16, 0xffffff, .54); circle(g, -19, 4, 19, 0xffffff, .54); circle(g, 8, -5, 25, 0xffffff, .54); circle(g, 30, 4, 16, 0xffffff, .54); }); world.addChild(cloud); children.push(cloud);
          if (gsap) gsap.to(cloud, { x: x + 45, duration: 11 + i * 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * -.9 });
        }
        shape(world, g => {
          fillRect(g, 480, 135, 320, 280, 0xe7c28c); fillRect(g, 540, 95, 200, 115, 0xffd983);
          fillRect(g, 462, 185, 62, 236, 0xf6d4a2); fillRect(g, 756, 185, 62, 236, 0xf6d4a2);
          for (const [x, y, w, h] of [[450, 140, 85, 76], [744, 140, 85, 76], [522, 62, 235, 115]]) {
            g.moveTo(x, y + h).lineTo(x + w / 2, y).lineTo(x + w, y + h).closePath().fill({ color: 0xab6385 });
            g.circle(x + w / 2, y + h - 25, 13).fill({ color: 0x7bc6dc });
          }
          fillRect(g, 606, 300, 67, 120, 0x966485); g.roundRect(613, 358, 7, 9, 4).fill({ color: 0xffe59a });
          // fountain and garden border
          g.ellipse(205, 505, 72, 20).fill({ color: 0xd4f1d5, alpha: .54 }); g.roundRect(169, 442, 70, 51, 16).fill({ color: 0x75bfce }); g.ellipse(204, 442, 47, 13).fill({ color: 0xb2ecdf });
          for (let i = 0; i < 16; i++) { const px = 50 + i * 82; g.roundRect(px, 510 + (i % 2) * 9, 13, 83, 7).fill({ color: i % 2 ? 0x539662 : 0x3d8156 }); g.circle(px + 5, 503 + (i % 3) * 7, 27, i % 2 ? 0x69aa65 : 0x6ab977); }
        });
      } else if (mode === 'stadium') {
        shape(world, g => { fillRect(g, 0, 165, W, 330, 0x343967); fillRect(g, 0, 495, W, 225, 0x287452); fillRect(g, 0, 480, W, 22, 0x65bb7c); });
        shape(world, g => {
          for (let row = 0; row < 6; row++) for (let col = 0; col < 32; col++) {
            const x = 22 + col * 40 + (row % 2) * 14; const y = 220 + row * 40;
            circle(g, x, y, 7 + (col % 3), [0xffd58d, 0xf4a1bc, 0xa6d8f5, 0xc8eea8][(col + row * 3) % 4], .85);
          }
          for (let i = 0; i < 15; i++) { const x = 42 + i * 86; g.roundRect(x, 92, 4, 375, 2).fill({ color: 0xaec7ff, alpha: .34 }); }
          g.roundRect(885, 210, 250, 220, 12).stroke({ color: 0xe9f6e9, width: 8, alpha: .84 });
          for (let i = 1; i < 5; i++) line(g, [885 + i * 50, 214, 885 + i * 50, 426], 0xddebe7, 2, .34);
          for (let i = 1; i < 4; i++) line(g, [890, 210 + i * 52, 1130, 210 + i * 52], 0xddebe7, 2, .34);
          line(g, [0, 595, W, 595], 0xd1eed0, 3, .45); line(g, [640, 508, 640, 720], 0xd1eed0, 3, .35);
          for (let i = 0; i < 6; i++) { const x = 78 + i * 206; g.roundRect(x, 85, 108, 13, 7).fill({ color: 0xfff4c3, alpha: .9 }); g.circle(x + 8, 94, 20, 0xe0eaff, .08); }
        });
      } else {
        shape(world, g => { fillRect(g, 0, 0, W, H, 0x302b3c); fillRect(g, 0, 486, W, 234, 0x594349); fillRect(g, 0, 476, W, 18, 0x86614f); });
        shape(world, g => {
          g.roundRect(70, 82, 290, 247, 13).fill({ color: 0x555e7a }); g.roundRect(84, 96, 262, 220, 7).fill({ color: 0x91adc4 }); g.rect(207, 96, 12, 220).fill({ color: 0x66748c }); g.rect(84, 197, 262, 12).fill({ color: 0x66748c });
          for (let i = 0; i < 34; i++) { const x = 95 + i * 32; const y = (i * 41) % 235 + 98; line(g, [x, y, x - 12, y + 38], 0xe2efff, 2, .44); }
          // corkboard and red evidence string
          g.roundRect(710, 88, 440, 308, 14).fill({ color: 0x98664f }); g.roundRect(727, 104, 406, 277, 8).fill({ color: 0xd7ad7a });
          for (let i = 0; i < 7; i++) { const x = 770 + (i % 4) * 93; const y = 145 + Math.floor(i / 4) * 112; g.roundRect(x, y, 62, 73, 5).fill({ color: i % 2 ? 0xf4e5bd : 0xf8efd5 }); circle(g, x + 31, y + 25, 13, [0xd27b74, 0x85a8b5, 0xd3a35c][i % 3]); line(g, [x + 16, y + 53, x + 47, y + 53], 0x9e8b76, 2, .55); line(g, [x + 16, y + 60, x + 40, y + 60], 0x9e8b76, 2, .45); }
          line(g, [800, 195, 921, 249, 1019, 187, 1080, 255], 0xbf4858, 3, .9); line(g, [824, 303, 927, 248, 990, 301], 0xbf4858, 3, .9);
          g.roundRect(542, 490, 352, 28, 10).fill({ color: 0xa77d5e }); g.roundRect(570, 518, 19, 172, 5).fill({ color: 0x77513f }); g.roundRect(850, 518, 19, 172, 5).fill({ color: 0x77513f });
          g.ellipse(1030, 52, 136, 90).fill({ color: 0xf7c970, alpha: .12 }); g.roundRect(1012, 48, 40, 19, 8).fill({ color: 0xffdfa0, alpha: .92 });
        });
      }
      for (let i = 0; i < 31; i++) {
        const particle = new PIXI.Container(); particle.x = randomIndex(W); particle.y = 80 + randomIndex(480); children.push(particle);
        const dot = new PIXI.Graphics().circle(0, 0, 2 + (i % 3)).fill({ color: mode === 'garden' ? 0xfff1a4 : mode === 'stadium' ? 0xffe69e : 0xeab7a4, alpha: .65 }); particle.addChild(dot); world.addChild(particle); sparks.push(particle);
        if (gsap) gsap.to(particle, { y: particle.y - 17 - randomIndex(42), alpha: .18, duration: 1.5 + randomIndex(25) / 10, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: -randomIndex(30) / 10 });
      }
    }
    function drawPrince() {
      actor = new PIXI.Container(); actor.x = 640; actor.y = 210; world.addChild(actor);
      shape(actor, g => {
        // pony: articulated legs, body, mane, head, saddle, rider
        ellipse(g, 10, 50, 107, 40, 0x7e4b3d); ellipse(g, -14, 49, 73, 35, 0x9a6148); ellipse(g, 90, 18, 30, 26, 0x93593f); ellipse(g, 109, 26, 22, 13, 0xefa98a); circle(g, 108, 15, 3.5, 0x342d36);
        g.moveTo(74, 4).lineTo(100, -42).lineTo(127, -35).lineTo(115, 7).closePath().fill({ color: 0x93593f });
        for (let i = 0; i < 8; i++) circle(g, 82 - i * 8, -7 + (i % 3) * 8, 12, i % 2 ? 0x603b45 : 0xa45851);
        line(g, [-91, 42, -123, 24, -142, 43], 0x5a3742, 9); line(g, [-44, 79, -49, 130], 0x583f43, 10); line(g, [31, 79, 38, 130], 0x583f43, 10); line(g, [82, 65, 91, 120], 0x583f43, 10); line(g, [-5, 76, -2, 129], 0x583f43, 10);
        ellipse(g, 29, 31, 40, 11, 0xb8546a); // saddle
        circle(g, -4, -47, 24, 0xf0c5a4); ellipse(g, -4, -66, 24, 10, 0x583547); // hair
        g.roundRect(-28, -45, 47, 19, 8).fill({ color: 0x3c3b55 }); circle(g, -11, -48, 2.4, 0x313242); circle(g, 4, -48, 2.4, 0x313242); line(g, [-4, -38, 0, -35, 5, -38], 0xb96f66, 2);
        g.moveTo(-22, -64).lineTo(-10, -82).lineTo(18, -64).closePath().fill({ color: 0xf0c85e }); g.roundRect(-23, -67, 48, 6, 3).fill({ color: 0xe5ae4b });
        g.moveTo(-24, -23).lineTo(-55, 22).lineTo(-9, 0).lineTo(20, 31).lineTo(14, -27).closePath().fill({ color: 0x8b5fd0 });
        g.roundRect(-21, -23, 38, 68, 12).fill({ color: 0x4c79c5 }); line(g, [-20, -8, -39, 14], 0xf0c5a4, 7); line(g, [12, -6, 30, 12], 0xf0c5a4, 7);
      });
      const legs = new PIXI.Graphics(); actor.addChild(legs);
      if (gsap) gsap.to(actor, { y: 202, duration: .78, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    function drawFootball() {
      actor = new PIXI.Container(); actor.x = 550; actor.y = 260; world.addChild(actor);
      shape(actor, g => {
        // Goalkeeper, gloved hands and the striker take the spot.
        g.roundRect(278, -79, 107, 145, 42).fill({ color: 0x4cb7a3 }); circle(g, 330, -102, 34, 0xe9bd9c); g.moveTo(300, -118).quadraticCurveTo(329, -147, 357, -117).lineTo(350, -137).lineTo(313, -139).closePath().fill({ color: 0x31374e });
        circle(g, 319, -103, 3, 0x3a3b43); circle(g, 340, -103, 3, 0x3a3b43); line(g, [280, -55, 252, -2], 0xe9bd9c, 11); line(g, [384, -55, 407, -8], 0xe9bd9c, 11); circle(g, 249, 0, 13, 0xe7e8f0); circle(g, 409, -3, 13, 0xe7e8f0);
        // kicker chibi
        circle(g, 61, -73, 23, 0xeac09e); g.roundRect(41, -54, 42, 70, 12).fill({ color: 0xf3d44d }); line(g, [52, 13, 40, 59], 0x333c63, 11); line(g, [73, 13, 94, 49], 0x333c63, 11); line(g, [45, -35, 23, -2], 0xeac09e, 8); line(g, [78, -35, 104, -6], 0xeac09e, 8); g.moveTo(43, -88).quadraticCurveTo(58, -112, 82, -89).fill({ color: 0x38394c }); circle(g, 54, -71, 2, 0x30323d); circle(g, 68, -71, 2, 0x30323d);
      });
      ball = new PIXI.Container(); ball.x = 434; ball.y = 451; world.addChild(ball);
      shape(ball, g => { circle(g, 0, 0, 22, 0xf8f4db); g.moveTo(-10, -5).lineTo(-4, -15).lineTo(8, -13).lineTo(12, -1).lineTo(2, 9).lineTo(-10, 5).closePath().fill({ color: 0x36405f }); line(g, [-18, -8, -8, -5, -4, -15], 0x414861, 2); line(g, [8, -13, 15, -8, 12, -1], 0x414861, 2); });
      keeper = actor;
      if (gsap) gsap.to(keeper, { x: 560, duration: .85, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    function drawDetective() {
      actor = new PIXI.Container(); actor.x = 640; actor.y = 270; world.addChild(actor);
      shape(actor, g => {
        // Small original detective, coat, cap and magnifying glass.
        ellipse(g, 0, 87, 125, 20, 0x201e2b, .19); g.roundRect(-64, 11, 128, 133, 32).fill({ color: 0x8c6255 }); g.moveTo(-64, 41).lineTo(-92, 138).lineTo(-24, 141).lineTo(0, 78).lineTo(28, 142).lineTo(94, 135).lineTo(61, 35).closePath().fill({ color: 0x9a6e58 });
        circle(g, 0, -29, 50, 0xefc7a2); g.moveTo(-50, -40).quadraticCurveTo(-31, -85, 13, -81).quadraticCurveTo(44, -77, 54, -38).lineTo(29, -48).lineTo(5, -60).lineTo(-12, -45).closePath().fill({ color: 0x4a3b3b });
        g.roundRect(-59, -55, 119, 15, 8).fill({ color: 0x524148 }); g.roundRect(-28, -98, 60, 42, 14).fill({ color: 0x655052 });
        circle(g, -17, -27, 4, 0x303345); circle(g, 17, -27, 4, 0x303345); line(g, [-10, -6, 0, -2, 10, -6], 0xb77d6d, 3);
        line(g, [47, 17, 104, -18], 0xe7cba0, 12); circle(g, 115, -28, 30, 0xe8c679, .72); circle(g, 115, -28, 20, 0x748394, .65); line(g, [135, -7, 164, 16], 0x98744e, 8);
        g.roundRect(-31, 39, 13, 63, 6).fill({ color: 0xd9b88d }); g.moveTo(-25, 40).lineTo(-17, 56).lineTo(-25, 72).lineTo(-33, 56).closePath().fill({ color: 0xbe6b72 });
      });
      if (gsap) gsap.to(actor, { y: 262, duration: 1.35, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
    function newPrince(index) {
      if (mode !== 'garden' || !gsap) return;
      const previous = actor;
      const colors = [0x945fc2, 0x3f91ad, 0xd65f83];
      const horses = [0x84523f, 0x6a536f, 0x9a7047];
      const entrant = new PIXI.Container(); entrant.x = -230; entrant.y = 210; world.addChild(entrant);
      children.push(entrant); gsap.killTweensOf(previous);
      shape(entrant, g => {
        ellipse(g, 0, 46, 93, 34, horses[(index - 1) % horses.length]); ellipse(g, 75, 18, 25, 24, horses[(index - 1) % horses.length]); ellipse(g, 96, 25, 18, 11, 0xf0b294);
        circle(g, 94, 15, 3, 0x322d35); g.moveTo(65, 7).lineTo(87, -31).lineTo(109, -22).lineTo(96, 9).closePath().fill({ color: horses[(index - 1) % horses.length] });
        for (let i = 0; i < 7; i++) circle(g, 70 - i * 8, 1 + i % 2 * 8, 10, 0x704051);
        line(g, [-37, 75, -42, 119], 0x593f42, 9); line(g, [22, 77, 27, 120], 0x593f42, 9); line(g, [67, 59, 76, 110], 0x593f42, 9); line(g, [-82, 38, -110, 20, -125, 40], 0x593f42, 8);
        circle(g, -1, -44, 22, 0xf0c5a4); ellipse(g, -1, -61, 23, 9, 0x573748); g.roundRect(-22, -44, 43, 17, 7).fill({ color: 0x363951 }); circle(g, -8, -46, 2, 0x30303a); circle(g, 6, -46, 2, 0x30303a);
        g.moveTo(-16, -61).lineTo(-7, -77).lineTo(15, -61).closePath().fill({ color: 0xf1cb66 }); g.roundRect(-20, -64, 40, 5, 3).fill({ color: 0xe1b44d });
        g.moveTo(-22, -21).lineTo(-53, 22).lineTo(-10, 1).lineTo(20, 31).lineTo(14, -24).closePath().fill({ color: colors[(index - 1) % colors.length] }); g.roundRect(-19, -20, 38, 59, 10).fill({ color: [0x3f75b8, 0x4e9c8a, 0xc05d73][(index - 1) % 3] });
        line(g, [-17, -7, -33, 14], 0xf0c5a4, 7); line(g, [12, -7, 30, 11], 0xf0c5a4, 7);
      });
      gsap.to(previous, { x: 1480, duration: .48, ease: 'power2.in' });
      gsap.fromTo(entrant, { x: -230 }, { x: 640, duration: 1.15, ease: 'power3.out' });
      gsap.to(entrant, { y: 202, duration: .82, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.15 });
      actor = entrant;
    }
    function scaleWorld() {
      if (!rootLayer || !app.renderer) return;
      const scale = Math.max(app.screen.width / W, app.screen.height / H);
      rootLayer.scale.set(scale); rootLayer.x = (app.screen.width - W * scale) / 2; rootLayer.y = (app.screen.height - H * scale) / 2;
    }
    const api = {
      app,
      async init() {
        await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), preference: 'webgl' });
        if (disposed || stopped || !host.isConnected) { app.destroy(true); return; }
        app.canvas.className = 'caller-pixi-canvas'; host.appendChild(app.canvas);
        rootLayer = new PIXI.Container(); app.stage.addChild(rootLayer);
        world = new PIXI.Container(); rootLayer.addChild(world);
        drawBackground();
        if (mode === 'garden') drawPrince(); else if (mode === 'stadium') drawFootball(); else drawDetective();
        scaleWorld(); observer = new ResizeObserver(scaleWorld); observer.observe(host);
        if (gsap) {
          gsap.to(rootLayer, { alpha: .96, duration: 2.3, repeat: -1, yoyo: true, ease: 'sine.inOut' });
          if (mode === 'garden') gsap.to(actor, { rotation: .012, duration: .5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
      },
      travel(value) {
        if (!actor || !gsap) return;
        const destination = mode === 'garden' ? 210 + value * 860 : mode === 'stadium' ? 415 + value * 630 : 465 + value * 360;
        gsap.to(actor, { x: destination, duration: .48 + Math.random() * .26, ease: 'power2.inOut' });
      },
      enter() { if (!actor || !gsap) return; if (mode === 'garden') gsap.fromTo(actor, { x: -220 }, { x: 640, duration: 1.6, ease: 'power3.out' }); else if (mode === 'stadium') gsap.fromTo(ball, { x: 310, y: 335, rotation: -5 }, { x: 434, y: 451, rotation: 0, duration: .75, ease: 'bounce.out' }); else gsap.fromTo(actor, { x: 130, alpha: .4 }, { x: 640, alpha: 1, duration: 1.15, ease: 'back.out(1.5)' }); },
      turnBack() { if (mode === 'garden' && gsap) gsap.to(actor, { x: 370, duration: .75, ease: 'power2.inOut', yoyo: true, repeat: 1 }); },
      newPrince(index) { newPrince(index); },
      prepareShot(index) { if (mode === 'stadium' && gsap) gsap.to(actor, { x: 530 + index * 24, y: 357, duration: .25, repeat: 1, yoyo: true, ease: 'power1.inOut' }); },
      fakeShot(trick) {
        if (mode === 'stadium' && gsap) {
          const destination = trick === 0 ? 1020 : trick === 1 ? 840 : 930;
          gsap.to(ball, { x: destination, y: trick === 1 ? 440 : 315, rotation: 10, duration: .55, ease: trick === 1 ? 'power1.in' : 'power2.in' });
          gsap.to(keeper, { x: trick === 2 ? 720 : 640, rotation: trick === 2 ? -.16 : .11, duration: .35, yoyo: true, repeat: 1, ease: 'power1.inOut' });
        }
      },
      scoreShot(index) {
        if (mode === 'stadium' && gsap) gsap.to(ball, { x: 1010 + (index % 3) * 36, y: 268 + (index % 3) * 28, rotation: 13, duration: .68, ease: 'power1.in' });
        if (mode === 'garden' && gsap) gsap.to(actor, { x: 735, y: 202, duration: .68, ease: 'power2.inOut' });
      },
      stampClue() {
        if (mode === 'office' && gsap) gsap.fromTo(actor, { rotation: -.035, x: actor.x - 6 }, { rotation: .025, x: actor.x + 6, duration: .13, repeat: 3, yoyo: true, ease: 'power1.inOut' });
      },
      nextCase() { if (mode === 'office' && gsap) gsap.to(actor, { x: 510 + randomIndex(160), duration: .55, ease: 'power2.inOut' }); },
      setSlow(flag) { if (app.ticker) app.ticker.speed = flag ? .62 : 1; if (gsap && currentTimeline) currentTimeline.timeScale(flag ? .72 : 1); },
      reset(game) { if (gsap && actor) { gsap.killTweensOf(actor); actor.rotation = 0; if (game === 'prince') { actor.x = 640; actor.y = 210; gsap.to(actor, { y: 202, duration: .8, repeat: -1, yoyo: true, ease: 'sine.inOut' }); } else if (game === 'office') { actor.x = 640; actor.y = 270; gsap.to(actor, { y: 262, duration: 1.35, repeat: -1, yoyo: true, ease: 'sine.inOut' }); } else { actor.x = 550; actor.y = 260; gsap.to(actor, { x: 560, duration: .85, repeat: -1, yoyo: true, ease: 'sine.inOut' }); } } if (ball && gsap) { gsap.killTweensOf(ball); ball.x = 434; ball.y = 451; ball.rotation = 0; } },
      celebrate() { if (!gsap || !actor) return; gsap.to(actor, { y: actor.y - 24, duration: .25, repeat: 3, yoyo: true, ease: 'power2.out' }); for (let i = 0; i < sparks.length; i++) { const p = sparks[i]; gsap.fromTo(p, { alpha: .1, scale: .5 }, { alpha: 1, scale: 1.8, duration: .55, delay: i % 10 * .035, yoyo: true, repeat: 1 }); } },
      destroy() { stopped = true; observer?.disconnect(); [...children, ...sparks, actor, ball, keeper, rootLayer].filter(Boolean).forEach(item => gsap?.killTweensOf(item)); if (app.renderer) app.destroy(true, { children: true, texture: true, textureSource: true }); }
    };
    return api;
  }

  async function openGame(key) {
    if (!GAME[key]) return;
    if (scene) { scene.destroy(); scene = null; }
    activeGame = key;
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
    scene = makeScene(meta.scene);
    scene.init().catch(error => { console.warn('PIXI scene could not start', error); gameStage.classList.add('is-css-fallback'); });
    updateGameStats();
    if (savedSound.checked) startMusic();
  }
  function goHome() {
    if (busy) return;
    stopMusic();
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
  $('#playAgain', root).onclick = () => {
    const scope = GAME[activeGame].scope;
    if (!remaining(scope).length) { settings.daily.round = { girls: [], boys: [], all: [] }; persist(); renderRoster(); }
    startStory();
  };
  startButton.onclick = startStory;
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
  $('#resultOverlay', root).addEventListener('click', event => { if (event.target === event.currentTarget && !busy) event.currentTarget.classList.remove('is-shown'); });
  root.addEventListener('keydown', event => {
    if (event.code === 'Space' && activeGame && !busy && !event.target.closest('button, input, select, textarea, a')) { event.preventDefault(); startStory(); }
    if (event.code === 'Escape' && activeGame && !busy && document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
  });
  const cleanWhenLeaving = () => {
    if (root.isConnected) return;
    disposed = true; stopMusic(); currentTimeline?.kill(); scene?.destroy(); scene = null;
    window.removeEventListener('hashchange', cleanWhenLeaving);
    document.removeEventListener('fullscreenchange', updateFullscreen);
    if (audio && audio.state !== 'closed') audio.close().catch(() => {});
  };
  function updateFullscreen() { if (!root.isConnected) return; $('#fullscreenToggle', root).textContent = document.fullscreenElement === root ? '⤢' : '⛶'; }
  document.addEventListener('fullscreenchange', updateFullscreen);
  window.addEventListener('hashchange', cleanWhenLeaving);
  updateHomeHistory();
  setRoster();
}

window.GV && window.GV.register('goi-ten', 'Gọi tên', page);
