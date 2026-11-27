/* Đấu đội trên lớp – chế độ trình chiếu (Claude Code, đợt 6). Nạp SAU app.js.
   Thầy cô chiếu lên bảng, lớp chia 2–4 đội. Mỗi câu: hiện câu hỏi + 4 ô màu A/B/C/D, đếm giờ,
   hiện đáp án + mẹo, thầy cô chọn đội trả lời đúng, xem bảng điểm; cuối cùng là bục vinh quang.
   Không ghi vào hồ sơ học sinh (đây là hoạt động chung của lớp).
   Phím tắt: Space/Enter = bước tiếp · 1–4 = chọn đội đúng · Esc = kết thúc. */
'use strict';
const ARENA_TEAMS = [
  { name: 'Hoa Đào', icon: '🌸', c: '#d94c78' },
  { name: 'Hướng Dương', icon: '🌻', c: '#c98a00' },
  { name: 'Tre Xanh', icon: '🎋', c: '#2c8f50' },
  { name: 'Cá Heo', icon: '🐬', c: '#2b74c4' }
];
const ARENA_COLORS = ['#d94c78', '#2b74c4', '#c98a00', '#2c8f50']; // ô A, B, C, D
let ARENA = null, arenaTimer = null;

function arenaSeg(key, vals, def, unit) {
  return '<div class="seg" role="radiogroup">' + vals.map(v => '<button role="radio" aria-checked="' + (v === def) + '" class="' + (v === def ? 'on' : '') + '" data-ar="' + key + '" data-v="' + v + '">' + v + (unit || '') + '</button>').join('') + '</div>';
}
function startArena() {
  const topics = myTopics();
  const pickd = { arTeams: 2, arCount: 10, arTime: 20 };
  let playMode = 'teams';
  const body = '<div class="arena-setup">' +
    '<p>Chiếu màn hình lên bảng. Mỗi câu, các đội giơ thẻ <b>A / B / C / D</b> (hoặc viết ra bảng con); thầy cô chọn những đội trả lời đúng.</p>' +
    '<div class="field-label">Cách chơi</div><div class="arena-mode-toggle" role="group" aria-label="Cách chơi đấu trường"><button type="button" class="on" data-ar-mode="teams" aria-pressed="true"><span>🪧</span><b>Chơi chung trên bảng</b><small>Các đội giơ thẻ A/B/C/D</small></button><button type="button" data-ar-mode="online" aria-pressed="false"><span>📱</span><b>Mỗi bạn một thiết bị</b><small>Vào phòng bằng mã 6 kí tự</small></button></div><p id="arModeHint" class="arena-mode-hint">Thầy cô chiếu màn hình, lớp cùng thảo luận và cộng điểm cho đội trả lời đúng.</p>' +
    '<div class="field-label">Chủ đề</div><select id="arTopic" class="t-select" aria-label="Chủ đề"><option value="mix">🎲 Trộn tất cả bài lớp ' + esc(S.grade) + '</option>' +
    topics.map(t => '<option value="' + t.id + '">' + t.bieuTuong + ' ' + esc(t.ten) + '</option>').join('') + '</select>' +
    '<div id="arTeamField"><div class="field-label">Số đội</div>' + arenaSeg('arTeams', [2, 3, 4], 2) + '</div>' +
    '<div class="field-label">Số câu</div>' + arenaSeg('arCount', [5, 10, 15], 10) +
    '<div class="field-label">Thời gian mỗi câu</div>' + arenaSeg('arTime', [15, 20, 30], 20, ' giây') +
    '<div class="arena-team-preview" id="arPreview"></div>' +
    '<p class="small-print">Phím tắt khi chơi: <b>Space</b> hoặc <b>Enter</b> = bước tiếp · <b>1–4</b> = chọn đội đúng · <b>Esc</b> = kết thúc.</p>' +
    '<div class="modal-actions center"><button class="primary-btn big" id="arGo">🏁 Bắt đầu thi</button></div></div>';
  openModal('🏆 Đấu đội trên lớp', 'Chế độ trình chiếu · Lớp ' + esc(S.grade), body, 'wide');
  const preview = () => { $('#arPreview').innerHTML = ARENA_TEAMS.slice(0, pickd.arTeams).map(t => '<span style="--tc:' + t.c + '">' + t.icon + ' Đội ' + t.name + '</span>').join(''); };
  $$('[data-ar-mode]').forEach(button => button.onclick = () => {
    playMode = button.dataset.arMode; sfx('tap');
    $$('[data-ar-mode]').forEach(other => { const selected = other === button; other.classList.toggle('on',selected); other.setAttribute('aria-pressed',String(selected)); });
    $('#arTeamField').hidden = playMode === 'online'; $('#arPreview').hidden = playMode === 'online';
    $('#arModeHint').textContent = playMode === 'online' ? 'Thầy cô đăng nhập, tạo phòng rồi chiếu mã để học sinh vào bằng máy đã kết nối với lớp.' : 'Thầy cô chiếu màn hình, lớp cùng thảo luận và cộng điểm cho đội trả lời đúng.';
    $('#arGo').textContent = playMode === 'online' ? '🔗 Tạo phòng trực tuyến' : '🏁 Bắt đầu thi';
  });
  $$('[data-ar]').forEach(b => b.onclick = () => {
    pickd[b.dataset.ar] = Number(b.dataset.v); sfx('tap');
    $$('[data-ar="' + b.dataset.ar + '"]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    preview();
  });
  preview();
  $('#arGo').onclick = async () => {
    const tid = $('#arTopic').value, src = tid === 'mix' ? topics : [getTopic(tid)];
    const pool = [];
    src.forEach(t => t.baiTap.forEach((b, i) => { if (b.loai === 'chon') pool.push(Object.assign({}, b, { _t: t.id, _i: i, _opts: shuffle(b.luaChon) })); }));
    if (playMode === 'online') {
      const title = tid === 'mix' ? 'Trộn bài lớp ' + S.grade : getTopic(tid).ten;
      const button = $('#arGo'); button.disabled = true;
      try { await LiveArena.host(shuffle(pool).slice(0,pickd.arCount),title,pickd.arTime); }
      finally { if (button.isConnected) button.disabled = false; }
      return;
    }
    ARENA = { items: shuffle(pool).slice(0, pickd.arCount), i: 0, secs: pickd.arTime, phase: 'ask', picked: new Set(),
      teams: ARENA_TEAMS.slice(0, pickd.arTeams).map(t => Object.assign({ score: 0 }, t)),
      title: tid === 'mix' ? 'Trộn bài lớp ' + S.grade : getTopic(tid).ten };
    onModalClose = stopArena;
    arenaAsk();
  };
  $('#arGo').focus();
}
function stopArena() { clearInterval(arenaTimer); ARENA = null; render(); }
function arenaFrame(inner) {
  const root = $('#modalRoot');
  root.className = 'modal-root arena-mode'; root.hidden = false; root.onclick = null; root.scrollTop = 0;
  document.body.classList.add('modal-open'); $('.app-shell').inert = true;
  root.innerHTML = '<div class="arena" role="dialog" aria-modal="true" aria-label="Đấu đội trên lớp"><div class="ar-top"><button class="pl-x" data-close-modal aria-label="Kết thúc">✕</button>' +
    '<div class="ar-title">🏆 ' + esc(ARENA.title) + '</div><div class="ar-scores">' +
    ARENA.teams.map(t => '<span class="ar-chip" style="--tc:' + t.c + '">' + t.icon + ' ' + t.score + '</span>').join('') + '</div></div>' + inner + '</div>';
}
function arenaAsk() {
  const it = ARENA.items[ARENA.i];
  ARENA.phase = 'ask'; ARENA.picked = new Set();
  const prompt = it.de.includes('___') ? esc(it.de).replace('___', '<span class="blank" id="arBlank">?</span>') : esc(it.de);
  arenaFrame('<div class="ar-progress">Câu ' + (ARENA.i + 1) + ' / ' + ARENA.items.length + '</div>' +
    '<div class="ar-q">' + prompt + '</div>' +
    '<div class="ar-opts">' + it._opts.map((o, k) => '<div class="ar-opt" data-ar-opt="' + esc(o) + '" style="--oc:' + ARENA_COLORS[k] + '"><span>' + 'ABCD'[k] + '</span>' + esc(o) + '</div>').join('') + '</div>' +
    '<div class="ar-timer"><div class="ar-timebar"><span id="arBar"></span></div><b id="arLeft">' + ARENA.secs + '</b></div>' +
    '<div class="ar-actions"><button class="soft-btn big" id="arSay">🔊 Đọc câu</button><button class="primary-btn big" id="arReveal">Hiện đáp án</button></div>');
  $('#arSay').onclick = () => speak(it.de.replace('___', ', '));
  $('#arReveal').onclick = arenaReveal;
  const end = Date.now() + ARENA.secs * 1000;
  setTimeout(() => { const bar = $('#arBar'); if (bar) { bar.style.transitionDuration = ARENA.secs + 's'; bar.style.width = '0%'; } }, 40);
  clearInterval(arenaTimer);
  arenaTimer = setInterval(() => {
    if (!ARENA || ARENA.phase !== 'ask') { clearInterval(arenaTimer); return; }
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    const el = $('#arLeft'); if (el) el.textContent = left;
    if (left > 0 && left <= 5) sfx('tap');
    if (left <= 0) arenaReveal();
  }, 1000);
}
function arenaReveal() {
  if (!ARENA || ARENA.phase !== 'ask') return;
  clearInterval(arenaTimer); ARENA.phase = 'award';
  const it = ARENA.items[ARENA.i], t = getTopic(it._t);
  $$('.ar-opt').forEach(o => o.classList.add(o.dataset.arOpt === it.dapAn ? 'right' : 'dim'));
  const bl = $('#arBlank'); if (bl) { bl.textContent = it.dapAn; bl.classList.add('filled'); }
  stopSpeak(); sfx('good');
  $('.ar-timer').outerHTML = '<div class="ar-rule">💡 ' + (t ? md(t.quyTac[0]) : '') + '</div>';
  $('.ar-actions').outerHTML = '<div class="ar-award"><p>Đội nào trả lời đúng?<small>Bấm chọn – có thể chọn nhiều đội (phím 1–' + ARENA.teams.length + ')</small></p><div class="ar-teams">' +
    ARENA.teams.map((tm, k) => '<button class="ar-team" data-team="' + k + '" aria-pressed="false" style="--tc:' + tm.c + '">' + tm.icon + ' Đội ' + tm.name + '</button>').join('') +
    '</div><button class="primary-btn big" id="arScore">Cộng điểm →</button></div>';
  $$('[data-team]').forEach(b => b.onclick = () => arenaToggle(Number(b.dataset.team)));
  $('#arScore').onclick = arenaBoard;
}
function arenaToggle(k) {
  if (!ARENA || ARENA.phase !== 'award' || !ARENA.teams[k]) return;
  if (ARENA.picked.has(k)) ARENA.picked.delete(k); else ARENA.picked.add(k);
  sfx('tap');
  $$('[data-team]').forEach(b => { const on = ARENA.picked.has(Number(b.dataset.team)); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
}
function arenaBoard() {
  if (!ARENA || ARENA.phase !== 'award') return;
  ARENA.picked.forEach(k => { ARENA.teams[k].score++; });
  ARENA.phase = 'board';
  const max = Math.max(1, ...ARENA.teams.map(t => t.score)), last = ARENA.i + 1 >= ARENA.items.length;
  arenaFrame('<div class="ar-board"><h2>Bảng điểm sau câu ' + (ARENA.i + 1) + '</h2>' +
    ARENA.teams.map((t, k) => '<div class="ar-row" style="--tc:' + t.c + '"><span class="ar-name">' + t.icon + ' Đội ' + t.name + (ARENA.picked.has(k) ? ' <em>+1</em>' : '') + '</span>' +
      '<div class="ar-bar"><span style="width:' + Math.round(t.score / max * 100) + '%"></span></div><b>' + t.score + '</b></div>').join('') +
    '<div class="ar-actions"><button class="primary-btn big" id="arNext">' + (last ? '🏆 Xem kết quả' : 'Câu tiếp theo →') + '</button></div></div>');
  if (ARENA.picked.size) sfx('good');
  $('#arNext').onclick = () => { if (last) arenaPodium(); else { ARENA.i++; arenaAsk(); } };
}
function arenaPodium() {
  ARENA.phase = 'end';
  const ranked = ARENA.teams.slice().sort((a, b) => b.score - a.score);
  const place = t => ranked.findIndex(x => x.score === t.score) + 1; // đồng điểm thì đồng hạng
  const winners = ranked.filter(t => t.score === ranked[0].score);
  const steps = [ranked[1], ranked[0], ranked[2]].filter(Boolean); // bục: hạng 2 – hạng 1 – hạng 3
  arenaFrame('<div class="ar-end"><h2>' + (winners.length > 1 ? '🤝 Hoà rồi! Các đội đều rất giỏi!' : '🏆 Đội ' + winners[0].name + ' chiến thắng!') + '</h2>' +
    '<div class="ar-podium">' + steps.map(t => '<div class="ar-step p' + place(t) + '" style="--tc:' + t.c + '"><div class="ar-step-icon">' + t.icon + '</div><b>Đội ' + t.name + '</b><span>' + t.score + ' điểm</span><div class="ar-block">' + place(t) + '</div></div>').join('') + '</div>' +
    (ranked[3] ? '<p>Hạng ' + place(ranked[3]) + ': ' + ranked[3].icon + ' Đội ' + ranked[3].name + ' – ' + ranked[3].score + ' điểm</p>' : '') +
    '<p>Cả lớp đã cùng giải ' + ARENA.items.length + ' câu chính tả. Hoan hô tất cả các đội! 🌟</p>' +
    '<div class="ar-actions"><button class="soft-btn big" id="arAgain">↻ Chơi lại</button><button class="primary-btn big" data-close-modal>Kết thúc</button></div></div>');
  sfx('win'); confetti();
  $('#arAgain').onclick = () => { clearInterval(arenaTimer); onModalClose = null; ARENA = null; startArena(); };
}
document.addEventListener('keydown', e => {
  if (!ARENA || $('#modalRoot').hidden || !$('.arena')) return;
  if (e.target.matches('input, select, textarea') || e.target.tagName === 'BUTTON') return; // nút đang được chọn thì để trình duyệt tự bấm
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (ARENA.phase === 'ask') arenaReveal();
    else if (ARENA.phase === 'award') arenaBoard();
    else if (ARENA.phase === 'board') $('#arNext').click();
  } else if (/^[1-4]$/.test(e.key) && ARENA.phase === 'award') arenaToggle(Number(e.key) - 1);
});
