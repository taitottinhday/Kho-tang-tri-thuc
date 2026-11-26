/* Màn chào + hồ sơ học sinh (Claude Code, đợt 10) – nạp SAU app.js.
   Đối chiếu đầy đủ với trang tham khảo (đã bấm thử từng chức năng):
   • “Ai đang học nhỉ?” – danh sách hồ sơ (bạn đồng hành, tên, lớp, số sao, 🔐 nếu có PIN)
   • Tạo hồ sơ: tên (≤ 20 kí tự), bạn đồng hành có tên riêng, lớp, mã PIN 4 số (không bắt buộc)
   • Hỏi mã PIN khi vào hồ sơ có khoá; sai thì “Mã PIN chưa đúng, em thử lại nhé.”
   • Học thử (không lưu tiến độ) · Hộp “Cách chơi” sau khi tạo hồ sơ
   Mã PIN chỉ để các bạn không vào nhầm hồ sơ của nhau trên máy dùng chung (không phải bảo mật cao);
   lưu dạng mã băm, không lưu nguyên văn. Quên mã → thầy cô xoá trong Góc thầy cô. */
'use strict';
const CHARACTERS = [
  { a: '🐰', name: 'Thỏ Bông', c: '#ffd9e6' }, { a: '🐻', name: 'Gấu Mật', c: '#f4dfc6' },
  { a: '🦊', name: 'Cáo Cam', c: '#ffe2cc' }, { a: '🐼', name: 'Gấu Trúc Tròn', c: '#dcf2e2' },
  { a: '🐸', name: 'Ếch Cốm', c: '#dff5cf' }, { a: '🦄', name: 'Kì Lân Mơ', c: '#ece0ff' },
  { a: '🐯', name: 'Hổ Con', c: '#ffe9b8' }, { a: '🐧', name: 'Cánh Cụt Tí Hon', c: '#d9edff' },
  { a: '🐨', name: 'Gấu Túi Ngoan', c: '#e4e8ef' }, { a: '🐵', name: 'Khỉ Lém', c: '#f5e2cf' }
];
let GUEST_MODE = false;
function charOf(a) { return CHARACTERS.find(c => c.a === a) || { a, name: '', c: '#eef2ee' }; }
function avatarBubble(a, cls) { return '<span class="av-bubble ' + (cls || '') + '" style="--bg:' + charOf(a).c + '" aria-hidden="true">' + a + '</span>'; }
function charPicker(selected) {
  return '<div class="char-grid" role="radiogroup" aria-label="Chọn bạn đồng hành">' + CHARACTERS.map(ch =>
    '<button type="button" class="char-opt' + (ch.a === selected ? ' selected' : '') + '" data-char="' + ch.a + '" role="radio" aria-checked="' + (ch.a === selected) + '">' +
    avatarBubble(ch.a) + '<small>' + ch.name + '</small></button>').join('') + '</div>';
}
function bindCharPicker(onPick) {
  $$('[data-char]').forEach(b => b.onclick = () => {
    sfx('tap'); onPick(b.dataset.char);
    $$('[data-char]').forEach(x => { const on = x === b; x.classList.toggle('selected', on); x.setAttribute('aria-checked', on); });
  });
}
function gradeOptions(sel) { return SCHOOL_GRADES.map(g => '<option value="' + g + '"' + (String(g) === String(sel) ? ' selected' : '') + '>Lớp ' + g + ' – ' + gardenName(g) + '</option>').join(''); }
function pinHash(pin, id) { // FNV-1a – đủ để không lưu PIN nguyên văn
  let h = 2166136261; const s = 'vuonchu:' + id + ':' + pin;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'h' + (h >>> 0).toString(36);
}
function pinValid(pin) { return pin === '' || /^\d{4}$/.test(pin); }
function totalStars(p) { return Object.values(p.topics || {}).reduce((a, t) => a + (t.stars || 0), 0); }
function isPlaceholder(p) { return !db.onboarded && Object.keys(db.profiles).length === 1 && p.name === 'Bạn nhỏ' && !p.attempts && !p.xp; }

/* ---------- Màn chào ---------- */
function shouldWelcome() { return !db.onboarded || Object.keys(db.profiles).length > 1 || !!S.pin; }
function showWelcome() {
  if (!$('#modalRoot').hidden) closeModal();
  let w = $('#welcome');
  if (!w) { w = document.createElement('div'); w.id = 'welcome'; w.className = 'welcome'; document.body.appendChild(w); }
  const list = Object.values(db.profiles).filter(p => !isPlaceholder(p));
  w.innerHTML = '<div class="wl-inner"><section class="wl-hero">' +
    '<img class="wl-art" src="assets/quan-dao.webp" alt="" width="1536" height="1024" />' +
    '<h1 class="wl-title"><span>Vườn Chữ</span><span>Kì Diệu</span></h1>' +
    '<p class="wl-tag">Khám phá 5 hòn đảo chính tả, sưu tầm sao, trồng vườn hoa và nhận giấy khen!</p>' +
    '<div class="wl-chips"><span>📘 Bám sát chương trình GDPT 2018</span><span>🏝️ Lớp 1 đến lớp 5, từ dễ đến khó</span><span>🌸 Sao, hoa, huy hiệu, giấy khen</span></div></section>' +
    '<section class="wl-card" aria-labelledby="wlTitle"><h2 id="wlTitle">' + (list.length ? 'Ai đang học nhỉ?' : 'Chào bạn nhỏ! 👋') + '</h2>' +
    (list.length ? '<div class="wl-list">' + list.map(p => '<button class="wl-profile" data-pick="' + p.id + '">' + avatarBubble(p.avatar) +
      '<span class="wl-who"><b>' + esc(p.name) + '</b><small>Lớp ' + esc(p.grade) + ' · ' + totalStars(p) + ' ⭐</small></span>' + (p.pin ? '<span class="wl-lock" title="Có mã PIN">🔐</span>' : '<span class="wl-go" aria-hidden="true">›</span>') + '</button>').join('') + '</div>'
      : '<p class="wl-sub">Tạo hồ sơ để bắt đầu hành trình. Không cần email hay mật khẩu.</p>') +
    '<button class="primary-btn big wl-create" id="wlCreate">＋ Tạo hồ sơ mới</button>' +
    '<button class="soft-btn big wl-guest" id="wlGuest">Học thử (không lưu tiến độ)</button>' +
    '<p class="wl-note">Tiến độ được lưu ngay trên thiết bị này. Có thể đặt mã PIN 4 số để giữ hồ sơ của riêng em.</p></section></div>';
  document.body.classList.add('welcome-open'); $('.app-shell').inert = true;
  $$('[data-pick]', w).forEach(b => b.onclick = () => pickProfile(b.dataset.pick));
  $('#wlCreate').onclick = () => showCreate(true);
  $('#wlGuest').onclick = startGuest;
  const first = $('[data-pick]', w) || $('#wlCreate'); if (first) first.focus();
}
function hideWelcome() {
  const w = $('#welcome'); if (w) w.remove();
  document.body.classList.remove('welcome-open'); $('.app-shell').inert = false;
}
function enterProfile(id) {
  if (GUEST_MODE) { GUEST_MODE = false; db = loadDB(); }
  db.current = id; S = db.profiles[id]; db.onboarded = true; save();
  hideWelcome(); go('home'); toast('Xin chào ' + S.name + '! ' + S.avatar);
}
function pickProfile(id) {
  const p = db.profiles[id]; if (!p) return;
  if (p.pin) askPin(p, () => enterProfile(id)); else enterProfile(id);
}
function askPin(p, ok) {
  openModal('🔐 Nhập mã PIN', 'Hồ sơ của ' + esc(p.name) + ' được bảo vệ',
    '<form class="pin-form" id="pinForm"><div class="pin-who">' + avatarBubble(p.avatar, 'lg') + '<b>' + esc(p.name) + '</b></div>' +
    '<label class="field-label" for="pinIn">Mã PIN 4 số</label><input id="pinIn" class="pin-input" type="password" inputmode="numeric" autocomplete="off" maxlength="4" />' +
    '<p class="pin-err" id="pinErr" role="alert"></p><button class="primary-btn big" type="submit" id="pinOk">Vào học</button>' +
    '<p class="small-print">Quên mã? Nhờ thầy cô mở <b>Góc thầy cô</b> để xoá mã PIN.</p></form>');
  const input = $('#pinIn'); input.focus();
  input.oninput = () => { input.value = input.value.replace(/\D/g, '').slice(0, 4); $('#pinErr').textContent = ''; };
  $('#pinForm').onsubmit = e => {
    e.preventDefault();
    if (p.pin === pinHash(input.value, p.id)) { closeModal(); sfx('good'); ok(); return; }
    sfx('bad'); $('#pinErr').textContent = 'Mã PIN chưa đúng, em thử lại nhé.';
    input.value = ''; input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); input.focus();
  };
}
/* Đổi hồ sơ từ hộp “Sửa hồ sơ”: hỏi PIN nếu hồ sơ đích có khoá */
function requestSwitch(id) { const p = db.profiles[id]; if (!p) return; if (p.pin) askPin(p, () => switchProfile(id)); else switchProfile(id); }
function switchPlayer() {
  if (GUEST_MODE) { GUEST_MODE = false; db = loadDB(); S = db.profiles[db.current]; }
  showWelcome();
}

/* ---------- Tạo hồ sơ ---------- */
function showCreate(fromWelcome) {
  let avatar = CHARACTERS[0].a;
  openModal('Tạo hồ sơ mới', 'Không cần email hay mật khẩu',
    '<form class="profile-form" id="createForm" novalidate>' +
    '<label>Tên của em<input id="nameInput" maxlength="20" placeholder="Ví dụ: Minh An" autocomplete="off" /></label>' +
    '<div><div class="field-label">Chọn bạn đồng hành</div>' + charPicker(avatar) + '</div>' +
    '<label>Em đang học lớp<select id="profileGrade">' + gradeOptions(S.grade || 2) + '</select></label>' +
    '<label>Mã PIN 4 số (không bắt buộc)<input id="pinInput" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="Để trống nếu không cần" /></label>' +
    '<p class="pin-err" id="createErr" role="alert"></p>' +
    '<div class="modal-actions"><button type="submit" class="primary-btn big" id="saveProfile">Bắt đầu hành trình 🚀</button></div></form>');
  bindCharPicker(a => { avatar = a; });
  $('#pinInput').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); };
  $('#nameInput').focus();
  $('#createForm').onsubmit = e => {
    e.preventDefault();
    const name = $('#nameInput').value.trim().replace(/\s+/g, ' '), pin = $('#pinInput').value, err = $('#createErr');
    if (!name) { err.textContent = 'Em nhập tên của mình nhé!'; $('#nameInput').focus(); return; }
    if (!pinValid(pin)) { err.textContent = 'Mã PIN gồm đúng 4 chữ số, hoặc để trống.'; $('#pinInput').focus(); return; }
    if (GUEST_MODE) { GUEST_MODE = false; db = loadDB(); }
    const old = Object.values(db.profiles).find(isPlaceholder);
    if (old) delete db.profiles[old.id]; // thay hồ sơ mặc định chưa dùng
    const p = newProfile(name, $('#profileGrade').value, avatar);
    if (pin) p.pin = pinHash(pin, p.id);
    db.profiles[p.id] = p; db.current = p.id; S = p; db.onboarded = true; save();
    closeModal(); hideWelcome(); render(); sfx('win');
    if (fromWelcome) showHowTo(); else toast('Chào bạn mới ' + p.name + '! ' + p.avatar);
  };
}
function showHowTo() {
  const steps = [
    ['🏝️', 'Chọn hòn đảo', 'Mỗi đảo là một lớp. Em có thể chọn lớp vừa sức, hoặc làm “Kiểm tra trình độ” để được gợi ý.'],
    ['📖', 'Học bài 3 mức', 'Đọc <b>Lý thuyết</b>, rồi làm bài mức Dễ ★, Vừa ★★, Khó ★★★. Qua mức Dễ là mở bài tiếp theo.'],
    ['⚡', 'Vượt thử thách', 'Thử thách có tính giờ và 3 💧 giọt nước. Sai 3 lần thì mình thử lại – không mất gì cả!'],
    ['🌸', 'Nhận quà', 'Sưu tầm 🌸 để trang trí vườn. Đánh thức 🌳 Cây Chữ Thần cuối đảo để nhận 📜 giấy khen!']
  ];
  openModal('Chào mừng ' + esc(S.name) + '! ' + S.avatar, 'Cách chơi Vườn Chữ Kì Diệu',
    '<div class="howto">' + steps.map(s => '<div class="howto-step"><span class="howto-ico" aria-hidden="true">' + s[0] + '</span><div><b>' + s[1] + '</b><p>' + s[2] + '</p></div></div>').join('') + '</div>' +
    '<div class="modal-actions center"><button class="primary-btn big" id="howToGo" data-close-modal>Bắt đầu thôi! 🚀</button></div>');
}

/* ---------- Học thử ---------- */
function startGuest() {
  GUEST_MODE = true;
  const p = newProfile('Bạn học thử', S.grade || '2', '🐰');
  db = { profiles: { [p.id]: p }, current: p.id, settings: db.settings, onboarded: true };
  S = p; hideWelcome(); go('home');
  toast('👀 Đang học thử – tiến độ sẽ không được lưu.');
}
AFTER_RENDER.push(() => {
  if (!GUEST_MODE || $('#guestBar')) return;
  const bar = document.createElement('div');
  bar.id = 'guestBar'; bar.className = 'guest-bar';
  bar.innerHTML = '👀 Em đang <b>học thử</b> – tiến độ sẽ không được lưu. <button class="soft-btn sm" id="guestSave">Tạo hồ sơ để lưu</button>';
  $('#viewRoot').prepend(bar);
  $('#guestSave').onclick = () => showCreate(true);
});

if (shouldWelcome()) showWelcome();
