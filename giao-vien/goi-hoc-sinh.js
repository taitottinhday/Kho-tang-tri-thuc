/* Trò gọi tên ngẫu nhiên: Đom đóm Thám hiểm Vườn Chữ. */
'use strict';
(function () {
  const TEACHER_TOKEN = 'vuonchu.teacherToken';
  const SESSION_PREFIX = 'vuonchu.callRound.';
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function randomIndex(length) {
    if (length <= 1) return 0;
    if (window.crypto && crypto.getRandomValues) {
      const limit = 0x100000000 - (0x100000000 % length);
      const sample = new Uint32Array(1);
      do { crypto.getRandomValues(sample); } while (sample[0] >= limit);
      return sample[0] % length;
    }
    return Math.floor(Math.random() * length);
  }
  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = randomIndex(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function studentId(student, classCode) {
    return String(student.id || (classCode + ':' + String(student.name || '').normalize('NFC').toLocaleLowerCase('vi')));
  }

  async function teacherGet(url) {
    const token = sessionStorage.getItem(TEACHER_TOKEN) || '';
    const response = await fetch(url, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(body.error || 'Chưa tải được danh sách lớp. Thầy cô thử lại nhé.');
    return body;
  }

  async function page(view) {
    const [classData, studentData] = await Promise.all([teacherGet('/api/classes'), teacherGet('/api/students')]);
    if (!view.isConnected) return;
    const classes = classData.classes || [];
    const allStudents = studentData.students || [];
    if (!classes.length) {
      view.innerHTML = '<section class="caller-empty-page"><div class="caller-empty-icon">✨</div><h2>Hãy tạo một khu vườn trước nhé!</h2><p>Thầy cô tạo lớp và kết nối học sinh, rồi Đom Đóm sẽ bay đi tìm bạn trả lời.</p><a class="btn primary" href="#lop">Mở mục Lớp học →</a></section>';
      return;
    }

    view.innerHTML = `
      <main class="caller-page" id="teacherCaller">
        <header class="caller-intro">
          <div class="caller-intro-mark" aria-hidden="true"><span>✦</span><b>☼</b><i>✧</i></div>
          <div class="caller-intro-copy">
            <p class="caller-kicker">MỘT CHUYẾN BAY · MỘT BẠN ĐƯỢC GỌI</p>
            <h2>Đom Đóm thăm Vườn Chữ</h2>
            <p>Đom Đóm sẽ bay qua khu vườn và tìm một bạn trả lời. Cả lớp cùng đoán xem bạn nào nhé!</p>
          </div>
          <div class="caller-intro-badge"><span>🌱</span><b>Vui mà công bằng</b><small>Mỗi bạn một lượt</small></div>
        </header>

        <section class="caller-console" aria-label="Thiết lập lượt gọi tên">
          <div class="caller-class-select">
            <label for="callClass">Lớp đang chơi</label>
            <select id="callClass">${classes.map((c, i) => '<option value="' + esc(c.code) + '"' + (i === 0 ? ' selected' : '') + '>' + esc(c.name || ('Lớp ' + c.code)) + (c.grade ? ' · Khối ' + esc(c.grade) : '') + '</option>').join('')}</select>
          </div>
          <div class="caller-roster-info"><span class="caller-roster-icon">👧</span><span><b id="callRosterCount">0 bạn</b><small id="callClassName">Danh sách đã kết nối</small></span></div>
          <div class="caller-round-info"><span class="caller-round-number"><b id="callUsed">0</b><i>/</i><span id="callTotal">0</span></span><span><b>đã được gọi</b><small id="callRemaining">Còn 0 lượt</small></span></div>
          <button class="caller-icon-btn" id="callRefresh" type="button" title="Làm mới danh sách học sinh" aria-label="Làm mới danh sách học sinh">↻</button>
          <button class="caller-icon-btn caller-fullscreen" id="callFullscreen" type="button" title="Chiếu toàn màn hình">⛶ <span>Toàn màn hình</span></button>
        </section>

        <section class="call-stage" id="callStage" aria-label="Đom Đóm bay chọn học sinh">
          <div class="call-moon" aria-hidden="true"></div>
          <div class="call-star s1" aria-hidden="true">✦</div><div class="call-star s2" aria-hidden="true">✧</div><div class="call-star s3" aria-hidden="true">·</div><div class="call-star s4" aria-hidden="true">✦</div><div class="call-star s5" aria-hidden="true">✧</div><div class="call-star s6" aria-hidden="true">·</div>
          <div class="call-hill hill-back" aria-hidden="true"></div><div class="call-hill hill-front" aria-hidden="true"></div>
          <div class="call-stage-heading"><span class="call-stage-label"><i></i> VƯỜN ĐOM ĐÓM</span><span class="call-stage-status" id="callStatus">Đom Đóm đang nghỉ trên chiếc lá</span></div>
          <div class="call-stage-caption"><span>Ai sẽ được Đom Đóm ghé thăm?</span><span class="call-leaf-flower" aria-hidden="true">✿</span></div>
          <div class="call-board" id="callBoard" role="list" aria-label="Danh sách học sinh trong lớp"></div>
          <div class="call-empty-roster" id="callEmptyRoster" hidden><span>🍃</span><b>Khu vườn đang chờ các bạn!</b><small>Học sinh cần kết nối với lớp để xuất hiện ở đây.</small><a href="#lop">Xem hướng dẫn kết nối lớp →</a></div>
          <div class="call-flier" id="callFlier" aria-hidden="true">
            <span class="call-flier-glow"></span>
            <svg viewBox="0 0 84 84" class="call-firefly" role="presentation">
              <defs>
                <radialGradient id="callGlow" cx="50%" cy="54%" r="55%"><stop offset="0" stop-color="#fff8b4"/><stop offset=".52" stop-color="#ffe66e"/><stop offset="1" stop-color="#ffb947"/></radialGradient>
                <linearGradient id="callWing" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e7fff8" stop-opacity=".98"/><stop offset="1" stop-color="#88e2d2" stop-opacity=".58"/></linearGradient>
                <filter id="callSoftGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <g class="call-wings" fill="url(#callWing)" stroke="#d9fff4" stroke-width="1.2"><path d="M38 37C19 11 4 17 18 36c6 8 13 9 20 8z"/><path d="M46 37c19-26 34-20 20-1-6 8-13 9-20 8z"/><path d="M39 45C20 29 11 37 24 49c6 5 11 5 16 2z"/><path d="M45 45c19-16 28-8 15 4-6 5-11 5-16 2z"/></g>
              <ellipse cx="42" cy="47" rx="12" ry="14" fill="url(#callGlow)" filter="url(#callSoftGlow)"/>
              <circle cx="42" cy="33" r="10" fill="#426d61"/><circle cx="38.5" cy="32.5" r="1.8" fill="#fff"/><circle cx="45.5" cy="32.5" r="1.8" fill="#fff"/><circle cx="39" cy="33" r=".8" fill="#173f3d"/><circle cx="46" cy="33" r=".8" fill="#173f3d"/>
              <path d="M39 37q3 3 6 0" fill="none" stroke="#f7b585" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M35 25q-5-7-8-2m22 2q5-7 8-2" fill="none" stroke="#426d61" stroke-width="2" stroke-linecap="round"/><circle cx="27" cy="22" r="2" fill="#ffe36e"/><circle cx="57" cy="22" r="2" fill="#ffe36e"/>
              <path d="M37 57q5 5 10 0" fill="none" stroke="#72b999" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="call-flier-trail"></span>
          </div>
          <div class="call-reveal" id="callReveal" hidden aria-live="assertive">
            <div class="call-reveal-card"><span class="call-reveal-spark">✦ ✧ ✦</span><span class="call-reveal-overline">ĐOM ĐÓM ĐÃ TÌM THẤY BẠN</span><span class="call-reveal-avatar" id="callResultAvatar">🙂</span><strong id="callResultName"></strong><span class="call-reveal-caption">Đến lượt bạn trả lời rồi! Cả lớp cổ vũ nào 🌟</span><span class="call-reveal-spark bottom">✧ ✦ ✧</span></div>
          </div>
          <div class="call-firefly-dust" id="callDust" aria-hidden="true"></div>
        </section>

        <div class="caller-actions">
          <div class="caller-action-primary"><button class="caller-pick-btn" id="callStart" type="button">✨ Thả Đom Đóm bay</button><span class="caller-shortcut">Có thể nhấn <kbd>Space</kbd> để gọi tên</span></div>
          <div class="caller-action-secondary"><label class="caller-toggle"><input type="checkbox" id="callNoRepeat" checked><span class="caller-toggle-track"></span><span>Mỗi bạn một lượt</span></label><label class="caller-toggle"><input type="checkbox" id="callSound"><span class="caller-toggle-track"></span><span>Âm thanh</span></label><button class="caller-undo" id="callUndo" type="button" disabled>↶ Hoàn tác lượt</button><button class="caller-reset" id="callReset" type="button">Vòng mới ↻</button></div>
        </div>

        <section class="caller-history" aria-label="Các bạn đã được gọi">
          <div><span class="caller-history-icon">🌟</span><b>Những bạn đã ghé thăm</b><small id="callHistoryHint">Lượt gọi sẽ hiện ở đây</small></div>
          <div class="caller-history-list" id="callHistory"></div>
        </section>
        <p class="caller-fairness"><span>🍀</span> Kết quả được chọn ngẫu nhiên từ các bạn còn lượt; Đom Đóm chỉ bay để tạo bất ngờ. Tên học sinh vẫn nằm trong lớp của thầy cô.</p>
      </main>`;

    const root = $('#teacherCaller', view);
    const classSelect = $('#callClass', root);
    const board = $('#callBoard', root);
    const startButton = $('#callStart', root);
    const noRepeat = $('#callNoRepeat', root);
    const soundToggle = $('#callSound', root);
    let roster = [];
    let calls = [];
    let visualRoster = [];
    let busy = false;
    let audioContext;

    try { noRepeat.checked = sessionStorage.getItem('vuonchu.callNoRepeat') !== 'false'; } catch {}
    try { soundToggle.checked = sessionStorage.getItem('vuonchu.callSound') === 'true'; } catch {}

    function roundKey(code) { return SESSION_PREFIX + encodeURIComponent(code); }
    function loadRound(code) {
      try {
        const data = JSON.parse(sessionStorage.getItem(roundKey(code)) || '{"calls":[]}');
        return Array.isArray(data.calls) ? data.calls.filter(item => item && item.id != null) : [];
      } catch { return []; }
    }
    function saveRound() {
      try { sessionStorage.setItem(roundKey(classSelect.value), JSON.stringify({ calls })); } catch {}
    }
    function classLabel(code) {
      const group = classes.find(item => item.code === code);
      return group ? (group.name || ('Lớp ' + group.code)) : 'Lớp học';
    }
    function currentId(student) { return studentId(student, classSelect.value); }
    function remainingStudents() {
      const called = new Set(calls.map(item => item.id));
      return noRepeat.checked ? roster.filter(student => !called.has(currentId(student))) : roster;
    }
    function updateCounts() {
      const left = remainingStudents().length;
      $('#callRosterCount', root).textContent = roster.length + ' bạn';
      $('#callTotal', root).textContent = roster.length;
      $('#callUsed', root).textContent = noRepeat.checked ? Math.min(roster.length, calls.filter(item => roster.some(s => currentId(s) === item.id)).length) : calls.length;
      $('#callClassName', root).textContent = 'Danh sách đã kết nối · ' + classLabel(classSelect.value);
      $('#callRemaining', root).textContent = left ? 'Còn ' + left + ' lượt' : (roster.length ? 'Cả lớp đã có lượt' : 'Chưa có học sinh');
      startButton.disabled = busy || !left;
      classSelect.disabled = busy;
      noRepeat.disabled = busy;
      $('#callRefresh', root).disabled = busy;
      $('#callUndo', root).disabled = busy || calls.length === 0;
      $('#callReset', root).disabled = busy || calls.length === 0;
      if (!busy && roster.length && noRepeat.checked && !left) $('#callStatus', root).textContent = 'Cả lớp đã được ghé thăm — mở vòng mới nhé!';
      else if (!busy && !roster.length) $('#callStatus', root).textContent = 'Đom Đóm đang chờ các bạn kết nối';
      else if (!busy && !$('#callResultName', root).textContent) $('#callStatus', root).textContent = 'Đom Đóm đang nghỉ trên chiếc lá';
    }
    function updateHistory() {
      const history = $('#callHistory', root);
      const list = calls.slice(-7).reverse();
      history.innerHTML = list.length ? list.map((item, index) => '<span class="caller-history-chip" style="--history-delay:' + index * 45 + 'ms"><i>' + esc(item.avatar || '🙂') + '</i>' + esc(item.name) + '</span>').join('') : '<span class="caller-history-empty">Sân khấu đang đợi tiếng vỗ tay đầu tiên…</span>';
      $('#callHistoryHint', root).textContent = calls.length ? calls.length + ' lượt trong vòng này' : 'Lượt gọi sẽ hiện ở đây';
    }
    function updateTileStates() {
      const called = new Set(calls.map(item => item.id));
      const last = calls[calls.length - 1];
      Array.from(board.children).forEach(tile => {
        const wasCalled = called.has(tile.dataset.id);
        tile.classList.toggle('is-called', wasCalled && (!last || tile.dataset.id !== last.id));
        tile.classList.toggle('is-winner', !!last && tile.dataset.id === last.id);
      });
    }
    function drawBoard() {
      visualRoster = visualRoster.length ? visualRoster : roster.slice();
      const empty = $('#callEmptyRoster', root);
      empty.hidden = roster.length > 0;
      board.innerHTML = visualRoster.map((student, index) => {
        const id = currentId(student);
        return '<article class="call-tile" role="listitem" data-id="' + esc(id) + '" style="--tile-delay:' + Math.min(index, 20) * 35 + 'ms"><span class="call-tile-avatar">' + esc(student.avatar || '🙂') + '</span><span class="call-tile-name">' + esc(student.name || 'Bạn nhỏ') + '</span><span class="call-tile-spark" aria-hidden="true">✦</span></article>';
      }).join('');
      updateTileStates();
      updateCounts();
    }
    function showReveal(student) {
      $('#callResultAvatar', root).textContent = student.avatar || '🙂';
      $('#callResultName', root).textContent = student.name || 'Bạn nhỏ';
      $('#callReveal', root).hidden = false;
      $('#callStatus', root).textContent = 'Đom Đóm đã chọn được một người bạn!';
      $('#callDust', root).innerHTML = Array.from({ length: 12 }, (_, i) => '<i style="--dust-angle:' + (i * 30) + 'deg;--dust-color:' + ['#ffe873', '#ffc27c', '#b4f2c8', '#f6a7b7'][i % 4] + ';animation-delay:' + (i * 14) + 'ms"></i>').join('');
      $('#callReveal', root).classList.remove('is-shown');
      requestAnimationFrame(() => $('#callReveal', root).classList.add('is-shown'));
    }
    function playNote(frequency, duration = .09, volume = .045) {
      if (!soundToggle.checked) return;
      try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
      } catch {}
    }
    function placeFlier(student) {
      const tile = Array.from(board.children).find(node => node.dataset.id === currentId(student));
      if (!tile) return null;
      const stageBox = $('#callStage', root).getBoundingClientRect();
      const tileBox = tile.getBoundingClientRect();
      const flier = $('#callFlier', root);
      flier.style.left = (tileBox.left - stageBox.left + tileBox.width / 2) + 'px';
      flier.style.top = (tileBox.top - stageBox.top + tileBox.height / 2) + 'px';
      return tile;
    }
    function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async function pickStudent() {
      if (busy) return;
      $('#callReveal', root).hidden = true;
      const pool = remainingStudents();
      if (!pool.length) { updateCounts(); return; }
      const chosen = pool[randomIndex(pool.length)];
      const detours = shuffle(roster.filter(student => currentId(student) !== currentId(chosen))).slice(0, Math.min(6, Math.max(2, roster.length - 1)));
      const route = detours.concat(chosen);
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delays = reduced ? route.map(() => 80) : route.map((_, i) => Math.min(720, 220 + i * 95));
      busy = true;
      visualRoster = shuffle(roster);
      drawBoard();
      const flier = $('#callFlier', root);
      $('#callDust', root).innerHTML = '';
      flier.hidden = false;
      flier.classList.add('is-flying');
      $('#callStage', root).classList.remove('is-reveal');
      $('#callStage', root).classList.add('is-active');
      $('#callStatus', root).textContent = 'Một ánh đom đóm vừa thức giấc…';
      startButton.textContent = 'Đom Đóm đang bay…';
      updateCounts();
      await wait(reduced ? 80 : 250);
      for (let i = 0; i < route.length; i++) {
        if (!root.isConnected) return;
        board.querySelectorAll('.is-hovered').forEach(tile => tile.classList.remove('is-hovered'));
        const target = placeFlier(route[i]);
        if (target) target.classList.add('is-hovered');
        $('#callStatus', root).textContent = i === route.length - 1 ? 'Đom Đóm sắp đáp xuống rồi…' : ['Đom Đóm đang lượn qua tán lá…', 'Ánh sáng đang tìm đường…', 'Bạn nào nhỉ? Cùng đoán nào…'][i % 3];
        playNote(660 + (i % 3) * 95, .08, .025);
        await wait(delays[i]);
      }
      if (!root.isConnected) return;
      const chosenId = currentId(chosen);
      calls.push({ id: chosenId, name: chosen.name || 'Bạn nhỏ', avatar: chosen.avatar || '🙂', at: Date.now() });
      saveRound();
      updateTileStates(); updateHistory(); updateCounts();
      $('#callStage', root).classList.remove('is-active');
      $('#callStage', root).classList.add('is-reveal');
      $('#callStatus', root).textContent = 'Đom Đóm đã tìm thấy bạn!';
      playNote(880, .22, .06); setTimeout(() => playNote(1175, .3, .05), 100);
      showReveal(chosen);
      busy = false;
      startButton.textContent = remainingStudents().length ? '✨ Gọi bạn tiếp theo' : '🌟 Đã hết lượt trong vòng';
      updateCounts();
    }

    function setClass() {
      $('#callReveal', root).hidden = true;
      $('#callStage', root).classList.remove('is-active', 'is-reveal');
      $('#callFlier', root).hidden = true;
      $('#callFlier', root).classList.remove('is-flying');
      visualRoster = [];
      roster = allStudents.filter(student => student.classCode === classSelect.value).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'vi'));
      calls = loadRound(classSelect.value);
      $('#callStatus', root).textContent = 'Đom Đóm đang nghỉ trên chiếc lá';
      drawBoard(); updateHistory();
    }

    classSelect.onchange = setClass;
    noRepeat.onchange = () => { try { sessionStorage.setItem('vuonchu.callNoRepeat', String(noRepeat.checked)); } catch {} updateTileStates(); updateCounts(); };
    soundToggle.onchange = () => { try { sessionStorage.setItem('vuonchu.callSound', String(soundToggle.checked)); } catch {} if (soundToggle.checked) playNote(880, .12); };
    startButton.onclick = pickStudent;
    $('#callReset', root).onclick = () => {
      if (busy || !calls.length) return;
      calls = []; saveRound();
      $('#callReveal', root).hidden = true;
      $('#callStage', root).classList.remove('is-active', 'is-reveal');
      $('#callFlier', root).hidden = true;
      $('#callFlier', root).classList.remove('is-flying');
      $('#callStatus', root).textContent = 'Một vòng mới bắt đầu — các bạn sẵn sàng chưa?';
      startButton.textContent = '✨ Thả Đom Đóm bay';
      updateTileStates(); updateHistory(); updateCounts();
    };
    $('#callUndo', root).onclick = () => {
      if (busy || !calls.length) return;
      calls.pop(); saveRound();
      $('#callReveal', root).hidden = true;
      $('#callStage', root).classList.remove('is-active', 'is-reveal');
      $('#callFlier', root).hidden = true;
      $('#callFlier', root).classList.remove('is-flying');
      $('#callStatus', root).textContent = 'Đã hoàn tác lượt gần nhất';
      startButton.textContent = '✨ Gọi bạn tiếp theo';
      updateTileStates(); updateHistory(); updateCounts();
    };
    $('#callRefresh', root).onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true; button.classList.add('is-spinning');
      try {
        const fresh = await teacherGet('/api/students');
        if (!root.isConnected) return;
        allStudents.splice(0, allStudents.length, ...(fresh.students || []));
        setClass();
      } catch (error) {
        const toast = $('#toast'); toast.textContent = error.message; toast.className = 'toast bad'; toast.hidden = false;
        setTimeout(() => { if (toast.isConnected) toast.hidden = true; }, 4000);
      } finally { button.disabled = false; button.classList.remove('is-spinning'); }
    };
    $('#callFullscreen', root).onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await root.requestFullscreen();
      } catch { $('#callStatus', root).textContent = 'Trình duyệt chưa cho bật toàn màn hình'; }
    };
    const removeFullscreenListener = () => {
      if (!root.isConnected) {
        document.removeEventListener('fullscreenchange', updateFullscreenLabel);
        window.removeEventListener('hashchange', removeFullscreenListener);
      }
    };
    function updateFullscreenLabel() {
      if (!root.isConnected) return;
      const button = $('#callFullscreen', root);
      button.innerHTML = document.fullscreenElement === root ? '⛶ <span>Thoát toàn màn hình</span>' : '⛶ <span>Toàn màn hình</span>';
    }
    document.addEventListener('fullscreenchange', updateFullscreenLabel);
    window.addEventListener('hashchange', removeFullscreenListener);
    root.addEventListener('keydown', event => {
      if (event.code === 'Space' && !event.target.closest('button, input, select, textarea, a') && !busy) {
        event.preventDefault(); pickStudent();
      }
    });
    setClass();
    $('#callStart', root).focus({ preventScroll: true });
  }

  window.GV && window.GV.register('goi-ten', 'Gọi tên', page);
})();
