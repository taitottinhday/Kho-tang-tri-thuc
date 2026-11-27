/* Vườn Chữ – ứng dụng luyện chính tả tiểu học
 * Khung giao diện: Codex v1 · Logic & nội dung: Claude Code v2
 * Chạy độc lập (mở index.html), lưu tiến độ bằng localStorage.
 */
'use strict';

/* ============================== DỮ LIỆU ============================== */
const DATA = window.NGAN_HANG_CHINH_TA || { chuDe: [], doanNgheViet: {} };
const ALL_TOPICS = DATA.chuDe;
const STORE_KEY = 'vuonchu.v2';
const AVATARS = ['🐰', '🐻', '🦊', '🐼', '🐸', '🦄', '🐯', '🐧', '🐨', '🐵'];
const GARDEN = [
  { xp: 0, icon: '🌱', name: 'Mầm nhỏ' },
  { xp: 60, icon: '🌿', name: 'Chồi xanh' },
  { xp: 180, icon: '🌷', name: 'Nụ hoa' },
  { xp: 400, icon: '🌻', name: 'Hoa nở rộ' },
  { xp: 800, icon: '🌳', name: 'Cây cổ thụ' },
  { xp: 1500, icon: '🏡', name: 'Khu vườn chữ' }
];
const BADGES = [
  { id: 'first', icon: '🌱', name: 'Bước đầu tiên', desc: 'Hoàn thành bài học đầu tiên' },
  { id: 'perfect', icon: '💯', name: 'Không sai câu nào', desc: 'Đạt 100% trong một bài' },
  { id: 'combo10', icon: '⚡', name: 'Tia chớp', desc: 'Đúng 10 câu liên tiếp' },
  { id: 'streak3', icon: '🔥', name: 'Chăm chỉ', desc: 'Học 3 ngày liền' },
  { id: 'streak7', icon: '🏆', name: 'Kiên trì', desc: 'Học 7 ngày liền' },
  { id: 'xp100', icon: '⭐', name: 'Trăm điểm', desc: 'Đạt 100 XP' },
  { id: 'xp500', icon: '🌟', name: 'Ngôi sao sáng', desc: 'Đạt 500 XP' },
  { id: 'listener', icon: '🎧', name: 'Đôi tai tinh', desc: 'Nghe – viết đúng 5 câu' },
  { id: 'hunter', icon: '🔎', name: 'Thám tử chữ', desc: 'Tìm đúng 10 lỗi sai' },
  { id: 'speed15', icon: '🚀', name: 'Nhanh như gió', desc: 'Đạt 15 điểm trò Nhanh tay' },
  { id: 'reviewer', icon: '🔁', name: 'Sửa sai giỏi', desc: 'Ôn xong 5 từ hay nhầm' },
  { id: 'allDone', icon: '👑', name: 'Vua chính tả', desc: 'Hoàn thành mọi bài của lớp' },
  { id: 'boss', icon: '🌳', name: 'Người giữ vườn', desc: 'Đánh thức Cây Chữ Thần' },
  { id: 'flowers20', icon: '🌸', name: 'Vườn hoa rực rỡ', desc: 'Sưu tầm 20 bông hoa' }
];
const PRAISE = ['Giỏi quá!', 'Chính xác!', 'Tuyệt vời!', 'Em làm đúng rồi!', 'Hay lắm!', 'Xuất sắc!'];
const ENCOURAGE = ['Không sao, mình học thêm nhé!', 'Sắp đúng rồi, cố lên!', 'Nhìn kĩ lại một chút nhé!'];
const LEVELS = { de: '★ Mức Dễ', vua: '★★ Mức Vừa', kho: '★★★ Mức Khó' };
/* 3 mức mỗi bài (kiểu ForumFlash): qua mức nào nhận sao mức đó; mức sau mở khi đã qua mức trước. */
const TIERS = {
  de: { stars: 1, name: 'Dễ', pass: 70, hints: 2, desc: 'Bộ câu cơ bản nhất, có <b>2 lần gợi ý</b>. Đúng từ 70% là qua màn, nhận <b>1★</b> và mở bài tiếp theo.' },
  vua: { stars: 2, name: 'Vừa', pass: 70, hints: 1, desc: 'Thêm ghép chữ, tìm lỗi và nghe. Có <b>1 lần gợi ý</b>. Đúng từ 70% nhận <b>2★</b>.' },
  kho: { stars: 3, name: 'Khó', pass: 80, hints: 0, desc: 'Toàn bộ câu của bài, <b>không có gợi ý</b>. Đúng từ 80% nhận <b>3★</b> – em đã thành thạo!' }
};
function tierOpen(ts, k) { return db.settings.unlockAll || k === 'de' || (k === 'vua' && ts.stars >= 1) || (k === 'kho' && ts.stars >= 2); }
function suggestTier(ts) { return ts.stars >= 2 ? 'kho' : ts.stars >= 1 ? 'vua' : 'de'; }

/* ============================== LƯU TRỮ ============================== */
const SCHOOL_GRADES = Object.freeze([1, 2, 3]);
function schoolGrade(value) {
  const number = Number(value);
  return String(SCHOOL_GRADES.includes(number) ? number : number > 3 ? 3 : 2);
}
function newProfile(name, grade, avatar) {
  return {
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || 'Bạn nhỏ', grade: schoolGrade(grade), avatar: avatar || '🐰',
    xp: 0, streak: 0, lastDay: '', topics: {}, review: {}, wrongLog: {}, storyProgress: {}, adaptiveDay: '',
    attempts: 0, correct: 0, combo: 0, bestCombo: 0,
    daily: { day: '', done: false }, badges: [], bestSpeed: 0, seenQuestions: [],
    dictCorrect: 0, hunted: 0, reviewed: 0, history: [],
    flowers: 0, nodes: {}, mission: null, bossWins: 0, skip: {}
  };
}
function loadDB() {
  try {
    const db = JSON.parse(localStorage.getItem(STORE_KEY));
    if (db && db.profiles && db.profiles[db.current]) {
      for (const id in db.profiles) {
        const p = db.profiles[id];
        db.profiles[id] = Object.assign(newProfile(), p, { id, grade: schoolGrade(p.grade) });
        db.profiles[id].seenQuestions = Array.isArray(p.seenQuestions) ? p.seenQuestions.filter(k => /^[0-9a-f]{16}$/i.test(k)).slice(-2400) : [];
        if (p.placement) db.profiles[id].placement = { ...p.placement, level: schoolGrade(p.placement.level) };
      }
      db.settings = Object.assign({ sound: true, unlockAll: false, rate: 1, voice: '', music: true, musicVol: 0.3, sfxVol: 0.8 }, db.settings);
      return db;
    }
  } catch (e) { /* bỏ qua dữ liệu hỏng */ }
  const p = newProfile();
  return { profiles: { [p.id]: p }, current: p.id, settings: { sound: true, unlockAll: false, rate: 1, voice: '', music: true, musicVol: 0.3, sfxVol: 0.8 } };
}
let db = loadDB();
let S = db.profiles[db.current];
function save() {
  if (typeof GUEST_MODE !== 'undefined' && GUEST_MODE) { updateChrome(); return; } // học thử: không lưu
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* hết bộ nhớ / chế độ riêng tư */ }
  updateChrome();
}

/* ============================== TIỆN ÍCH ============================== */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function plain(s) { return String(s).replace(/\*\*/g, ''); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function getTopic(id) { return ALL_TOPICS.find(t => t.id === id); }
function tstat(id) { return S.topics[id] || (S.topics[id] = { stars: 0, done: false, attempts: 0, correct: 0, best: 0 }); }
function itemOf(key) { // “mã:5” = câu trong ngân hàng; “mã:g12” = câu sinh tự động (data/sinh-cau.js, tên bạn nhỏ đổi mỗi lần)
  const [tid, i = ''] = key.split(':'); const t = getTopic(tid); if (!t) return null;
  if (i.startsWith('cq-')) return typeof ClassPractice === 'undefined' ? null : ClassPractice.byKey(tid, i);
  if (!SCHOOL_GRADES.some(g => gradeTopics(g).includes(t))) return null;
  const own = i.startsWith('gv-'), gen = !own && i[0] === 'g';
  if (own) { const n = t.baiTap.findIndex(x => x._k === i); return n < 0 ? null : Object.assign({}, t.baiTap[n], { _t: tid, _i: n }); }
  const at = t.goc ? t.baiTap.findIndex(x => String(x._k) === i) : Number(i); // bài đã được thầy cô chỉnh
  const b = gen ? (t.sinh || [])[Number(i.slice(1))] : t.baiTap[at];
  return b ? Object.assign({}, b, { _t: tid, _i: gen ? i : at }) : null;
}
function fullSentence(item) { return item.de.includes('___') ? item.de.replace('___', item.dapAn) : item.dapAn; }
function itemWord(item) { // từ đúng để hiển thị trong danh sách ôn
  if (item.loai === 'classQuestion') return item.type === 'fill' ? item.prompt.replace('___', item.answer) : item.answer;
  if (item.loai === 'timLoi') return item.tuDung;
  if (item.loai === 'ngheViet') return item.cau;
  if (!item.de.includes('___')) return item.dapAn;
  const s = fullSentence(item); const pos = item.de.indexOf('___');
  const start = item.de.lastIndexOf(' ', pos) + 1; let end = s.indexOf(' ', pos + item.dapAn.length);
  if (end < 0) end = s.length;
  return s.slice(start, end).replace(/[.,!?:;]/g, '');
}

/* ============================== CHỦ ĐỀ THEO LỚP ============================== */
function myTopics() { return gradeTopics(S.grade); }
function topicStatus(t) {
  if (tstat(t.id).done) return 'done';
  const list = myTopics(); const i = list.indexOf(t);
  if (db.settings.unlockAll || (S.skip && S.skip[S.grade]) || i <= 0 || tstat(list[i - 1].id).done) return 'open';
  return 'locked';
}
function nextTopic() { return myTopics().find(t => topicStatus(t) === 'open') || null; }
function chapters() {
  const map = new Map();
  myTopics().forEach(t => { if (!map.has(t.nhom)) map.set(t.nhom, []); map.get(t.nhom).push(t); });
  const icons = { 'Phụ âm đầu': '🪴', 'Vần': '🌷', 'Dấu thanh': '🌼', 'Tổng hợp': '🧠', 'Viết hoa': '🍃' };
  return Array.from(map, ([nhom, topics]) => ({ title: nhom, icon: icons[nhom] || '🌿', topics }));
}
function openTopics() { const l = myTopics().filter(t => topicStatus(t) !== 'locked'); return l.length ? l : myTopics().slice(0, 1); }
function gardenStage(xp) { let s = GARDEN[0]; GARDEN.forEach(g => { if (xp >= g.xp) s = g; }); return s; }

/* ============================== ÂM THANH ============================== */
let audioCtx = null;
function tone(freq, start, dur, type, vol) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime + start);
  const level = (vol || 0.18) * (db.settings.sfxVol == null ? 0.8 : db.settings.sfxVol); // thanh trượt “Hiệu ứng & giọng đọc”
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, level), audioCtx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + start + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(audioCtx.currentTime + start); o.stop(audioCtx.currentTime + start + dur + 0.05);
}
/* iPhone/iPad (Safari, và mọi trình duyệt trên iOS) chặt hơn máy tính:
   • chỉ cho phát âm thanh sau một cú chạm THẬT – touchend/click (pointerdown, touchstart không tính);
   • Web Audio bị tắt tiếng khi gạt nút im lặng bên hông máy, trừ khi phiên âm thanh là “playback”;
   • lần speechSynthesis.speak() đầu tiên phải nằm ngay trong cú chạm;
   • chuyển ứng dụng / khoá màn hình thì bộ âm thanh bị “interrupted”, phải resume ở cú chạm sau.
   → Mở khoá ở mọi cú chạm (rất nhẹ), báo cho nhạc nền biết khi đã mở khoá. */
const IS_IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
let audioUnlocked = false, silentEl = null;
const audioUnlockCbs = [];
function getAudioCtx() {
  if (!audioCtx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; audioCtx = new AC(); }
  return audioCtx;
}
function onAudioUnlock(cb) { if (audioUnlocked) cb(); else audioUnlockCbs.push(cb); }
function unlockAudio() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) { /* Safari < 16.4 */ }
  const c = getAudioCtx();
  if (c) {
    if (c.state !== 'running') { try { c.resume(); } catch (e) {} }
    try { const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); } catch (e) {}
  }
  if (IS_IOS && !navigator.audioSession) {
    // iOS cũ: phát một đoạn im lặng bằng thẻ <audio> để máy chuyển sang chế độ phát (nút im lặng không chặn nữa)
    try { if (!silentEl) { silentEl = new Audio(SILENT_WAV); silentEl.setAttribute('playsinline', ''); silentEl.loop = true; silentEl.volume = 0.01; } if (silentEl.paused) { const pr = silentEl.play(); if (pr && pr.catch) pr.catch(() => {}); } } catch (e) {}
  }
  if (audioUnlocked) return;
  audioUnlocked = true;
  // Không phát utterance “mồi” ở iOS: utterance này có thể còn pending tới
  // lúc người dùng chạm nút đọc, khiến câu thật bị dời sang timer và mất user gesture.
  audioUnlockCbs.splice(0).forEach(f => { try { f(); } catch (e) {} });
}
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (!document.hidden && audioCtx && audioCtx.state !== 'running') { try { audioCtx.resume(); } catch (e) {} } });
function sfx(kind) {
  if (!db.settings.sound) return;
  try {
    if (!getAudioCtx()) return;
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (kind === 'good') { tone(660, 0, 0.15, 'triangle'); tone(990, 0.1, 0.25, 'triangle'); }
    else if (kind === 'bad') { tone(300, 0, 0.18, 'sine', 0.12); tone(220, 0.14, 0.25, 'sine', 0.1); }
    else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle')); }
    else if (kind === 'tap') { tone(880, 0, 0.06, 'sine', 0.06); }
  } catch (e) { /* trình duyệt không hỗ trợ */ }
}

/* ============================== GIỌNG ĐỌC ============================== */
/* Chrome trên Windows chỉ thấy giọng SAPI (thường không có tiếng Việt) → im lặng.
   Edge có giọng tự nhiên Hoài My / Nam Minh; Android và iPad thường có sẵn giọng Việt.
   Không có giọng Việt thì báo rõ + gợi ý mở bằng Edge, KHÔNG im lặng. */
let viVoice = null, viVoices = [], voicesReady = false, voiceWarned = false, mutedHintAt = 0;
const SPEECH_PACE = 0.85; // nhịp chung của giọng đọc (chậm hơn 15% so với trước)
function findVoice() {
  if (!('speechSynthesis' in window)) return;
  const all = speechSynthesis.getVoices();
  if (all.length) voicesReady = true;
  viVoices = all.filter(v => /^vi/i.test(v.lang) || /vietnam/i.test(v.name));
  // Ưu tiên giọng NỮ (thầy cô thấy dễ nghe hơn với học sinh nhỏ): giọng đã chọn → nữ tự nhiên → nữ → không phải nam → bất kì
  const natural = v => /natural|online|neural/i.test(v.name);
  viVoice = viVoices.find(v => v.name === db.settings.voice)
    || viVoices.find(v => voiceGender(v) === 'nữ' && natural(v)) || viVoices.find(v => voiceGender(v) === 'nữ')
    || viVoices.find(v => voiceGender(v) !== 'nam' && natural(v)) || viVoices.find(v => voiceGender(v) !== 'nam')
    || viVoices[0] || null;
}
/* Đoán giọng nam/nữ theo tên giọng phổ biến: Edge (Hoài My – nữ, Nam Minh – nam), Windows (An – nam),
   iPhone/iPad (Linh – nữ). Không đoán được thì trả về ''. */
function voiceGender(v) {
  const n = v.name;
  if (/ho[aà]i ?my|\blinh\b|female|\bnữ\b|\bmai\b|\blan\b|thu ?(hà|ha)|ngọc|hương/i.test(n)) return 'nữ';
  if (/nam ?minh|microsoft an\b|\bmale\b|\bnam\b(?! *\))/i.test(n.replace(/vietnam/ig, ''))) return 'nam';
  return '';
}
function noVoiceHelp() {
  if (voiceWarned) { toast('🔈 Trình duyệt này chưa có giọng đọc tiếng Việt.'); return; }
  voiceWarned = true;
  const ua = navigator.userAgent, isWin = /Windows/.test(ua), isEdge = /Edg\//.test(ua);
  const url = /^https?:/.test(location.protocol) ? location.href : '';
  const box = document.createElement('div');
  box.className = 'voice-help'; box.setAttribute('role', 'alert');
  box.innerHTML = '<div><b>🔈 Trình duyệt này chưa có giọng đọc tiếng Việt</b><p>' +
    (isWin && !isEdge ? 'Trên máy tính Windows, hãy mở Vườn Chữ bằng <b>Microsoft Edge</b>: Edge có sẵn giọng đọc tiếng Việt (Hoài My, Nam Minh). Chrome trên Windows không có giọng tiếng Việt.'
      : 'Hãy thử mở bằng Microsoft Edge, hoặc cài giọng tiếng Việt trong phần “Chuyển văn bản thành giọng nói” của máy.') +
    ' Trong lúc đó, thầy cô hoặc bố mẹ có thể đọc giúp em.</p></div><div class="voice-help-actions">' +
    (isWin && !isEdge && url ? '<a class="primary-btn" href="microsoft-edge:' + esc(url) + '">Mở bằng Edge</a>' : '') +
    '<button class="soft-btn" data-vh-close>Đã hiểu</button></div>';
  document.body.appendChild(box);
  box.querySelector('[data-vh-close]').onclick = () => box.remove();
}
if ('speechSynthesis' in window) {
  findVoice();
  speechSynthesis.onvoiceschanged = () => { findVoice(); if ((currentView === 'teacher' && teacherOK) || currentView === 'settings') render(); };
}
let speechTimer = 0;
function speak(text, rate, retried) {
  clearTimeout(speechTimer);
  if (!db.settings.sound) {
    if (Date.now() - mutedHintAt > 8000) { mutedHintAt = Date.now(); toast('🔇 Âm thanh đang tắt – bấm nút 🔇 ở góc trên để bật lại.'); }
    return;
  }
  if (!('speechSynthesis' in window)) { toast('Trình duyệt này không đọc được thành tiếng 😢'); return; }
  if (!viVoice) findVoice();
  if (!viVoice && !IS_IOS) {
    // Danh sách giọng có thể chưa tải xong ở lần bấm đầu: chờ một nhịp rồi thử lại đúng 1 lần
    if (!voicesReady && !retried) { speechTimer = setTimeout(() => speak(text, rate, true), 500); return; }
    noVoiceHelp(); return;
  }
  const synth = speechSynthesis;
  const busy = synth.speaking || synth.pending;
  if (busy) synth.cancel();
  const u = new SpeechSynthesisUtterance(plain(text));
  if (viVoice) u.voice = viVoice; u.lang = (viVoice && viVoice.lang) || 'vi-VN';
  u.volume = Math.min(1, Math.max(0.15, db.settings.sfxVol == null ? 1 : db.settings.sfxVol + 0.2)); // giọng đọc luôn đủ nghe
  u.rate = Math.max(0.45, (rate || 0.85) * SPEECH_PACE * (db.settings.rate || 1)); // đọc chậm, rõ cho học sinh nhỏ
  // Nếu iOS chặn vì thiếu user gesture, hiện gợi ý để người dùng thử lại hoặc mở bằng Safari.
  u.onerror = e => {
    if (e.error === 'not-allowed') {
      toast(IS_IOS ? 'iPhone vừa chặn giọng đọc. Em chạm 🔊 lần nữa hoặc mở trang bằng Safari nhé.' : 'Trình duyệt vừa chặn giọng đọc. Em bấm 🔊 lại nhé.');
      return;
    }
    if (!['interrupted', 'canceled'].includes(e.error)) toast('Chưa phát được giọng đọc (' + e.error + '). Em bấm 🔊 lại nhé.');
  };
  speakQueue.push(u); if (speakQueue.length > 4) speakQueue.shift(); // giữ tham chiếu: Safari hay “quên” câu nói bị dọn rác
  // iOS luôn đọc ngay trong cú chạm; Chromium cần một nhịp sau cancel() khi đang đọc dở.
  if (IS_IOS) {
    // iOS yêu cầu speak() chạy ngay trong cú chạm. Sau cancel(), không trì hoãn
    // utterance thật bằng setTimeout như Chromium để tránh mất quyền phát âm thanh.
    try { synth.resume(); } catch (e) {}
    synth.speak(u);
  } else if (!busy) { synth.resume(); synth.speak(u); }
  else speechTimer = setTimeout(() => { synth.resume(); synth.speak(u); }, 60);
}
const speakQueue = [];
function stopSpeak() {
  clearTimeout(speechTimer);
  if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
}

/* ============================== HIỆU ỨNG ============================== */
let toastTimer;
function toast(text) {
  const el = $('#toast'); el.textContent = text; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function confetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = $('#confetti'); const colors = ['#f4c85a', '#ef9b55', '#64b281', '#64b5f6', '#f06292', '#ba68c8'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = pick(colors);
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    p.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
    layer.appendChild(p);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 3600);
}

/* ============================== KHUNG CHUNG ============================== */
let currentView = 'home';
let teacherOK = false;
function updateChrome() {
  $('#profileName').textContent = S.name;
  $('.avatar').textContent = S.avatar;
  $('#gradeSelect').value = S.grade;
  $('#streakCount').textContent = typeof StreakRoom === 'undefined' ? S.streak : StreakRoom.live();
  $('#sidebarXP').textContent = S.xp + ' XP';
  $('#reviewNavCount').textContent = Object.keys(S.review).filter(itemOf).length + WordShelf.dueCount();
  $('#soundIcon').textContent = typeof volIcon === 'function' ? volIcon() : (db.settings.sound ? '🔊' : '🔇');
  const fc = $('#flowerCount'); if (fc) fc.textContent = S.flowers;
  const sc = $('#starCount'); if (sc) sc.textContent = Object.values(S.topics).reduce((a, t) => a + (t.stars || 0), 0);
  const st = gardenStage(S.xp), idx = GARDEN.indexOf(st), nx = GARDEN[idx + 1];
  $('#gardenIcon').textContent = st.icon;
  $('#gardenName').textContent = st.name;
  $('#gardenHint').innerHTML = nx ? 'Còn <b>' + (nx.xp - S.xp) + ' XP</b> nữa<br />vườn sẽ thành ' + nx.icon : 'Khu vườn đã<br />rực rỡ nhất! 🎉';
  $('#gardenBar').style.width = nx ? pct(S.xp - st.xp, nx.xp - st.xp) + '%' : '100%';
  fitTopbar();
}
/* Thanh trên luôn nằm gọn 1 hàng ở MỌI độ rộng (kể cả laptop phóng to 125–150%, tên dài, số lớn):
   chữ không bao giờ xuống dòng; nếu thiếu chỗ thì ẩn dần từng mục ít quan trọng theo thứ tự
   tb-fit-1 … tb-fit-9 (xem kid.css), đo lại sau mỗi bước. */
const TOPBAR_LEVELS = 9;
function topbarFits(bar) {
  const br = bar.getBoundingClientRect(), cs = getComputedStyle(bar);
  const left = br.left + parseFloat(cs.paddingLeft) - 0.5, right = br.right - parseFloat(cs.paddingRight) + 0.5;
  const items = [...bar.children].filter(k => !k.classList.contains('noel-lights'));
  const acts = bar.querySelector('.topbar-actions'); if (acts) items.push(...acts.children);
  let prevRight = -Infinity;
  for (const k of items) {
    if (!k.getClientRects().length) continue;
    const r = k.getBoundingClientRect();
    if (r.width < 1) continue;
    if (r.left < left || r.right > right || r.top < br.top - 1 || r.bottom > br.bottom + 1) return false;
    if (k.parentElement === bar && r.left < prevRight - 0.5) return false;
    if (k.parentElement === bar) prevRight = r.right;
  }
  for (const t of bar.querySelectorAll('#crumbCurrent, .mast-brand b, .profile-name')) {
    if (t.getClientRects().length && t.scrollWidth > t.clientWidth + 1) return false; // chữ bị cắt bớt
  }
  return true;
}
function fitTopbar() {
  const bar = document.querySelector('.topbar'); if (!bar) return;
  for (let i = 1; i <= TOPBAR_LEVELS; i++) bar.classList.remove('tb-fit-' + i);
  for (let i = 1; i <= TOPBAR_LEVELS && !topbarFits(bar); i++) bar.classList.add('tb-fit-' + i);
}
const VIEW_NAMES = { home: 'Trang học', roadmap: 'Lộ trình của em', shelf: 'Tủ thẻ từ', games: 'Trò chơi', review: 'Ôn lại từ sai', badges: 'Huy hiệu', teacher: 'Góc thầy cô' };
/* Điểm nối cho module ngoài (settings.js, onboarding.js, …): nạp SAU app.js rồi gọi
   registerView('settings', 'Cài đặt', () => html, () => { gắn sự kiện });  → điều hướng bằng data-view="settings" */
const EXT_VIEWS = {};
function registerView(name, title, page, bind) { EXT_VIEWS[name] = { page, bind }; VIEW_NAMES[name] = title; }
const AFTER_RENDER = []; // module có thể đẩy hàm chạy sau mỗi lần render (vd. thanh tab dưới)
function render() {
  updateChrome();
  const views = { home: renderHome, roadmap: renderRoadmap, shelf: WordShelf.page, games: renderGames, review: renderReview, badges: renderBadges, teacher: renderTeacher };
  const ext = EXT_VIEWS[currentView];
  $('#viewRoot').innerHTML = ext ? ext.page() : (views[currentView] || renderHome)();
  $$('.nav-item, [data-tab]').forEach(n => n.classList.toggle('active', (n.dataset.view || n.dataset.tab) === currentView));
  $('#crumbCurrent').textContent = VIEW_NAMES[currentView] || 'Trang học';
  const bb = $('#backBtn'); if (bb) bb.hidden = currentView === 'home';
  fitTopbar();
  if (currentView === 'teacher') bindTeacher();
  if (currentView === 'shelf') WordShelf.bind();
  if (currentView === 'roadmap' && typeof bindRoadmap === 'function') bindRoadmap();
  if (ext && ext.bind) ext.bind();
  AFTER_RENDER.forEach(f => { try { f(currentView); } catch (e) { console.warn(e); } });
}
/* Quay lại: mỗi lần đổi trang ghi một mục vào lịch sử trình duyệt, nên nút ‹ Quay lại trên thanh trên,
   nút Back của điện thoại Android và phím Alt+← đều đưa em về trang trước (không thoát khỏi web). */
let navDepth = 0;
function go(view, fromHistory) {
  if (view === 'teacher' && !teacherOK) { teacherGate(); return; }
  if (view !== currentView && !fromHistory) {
    try { history.pushState({ v: view }, '', '#' + view); navDepth++; } catch (e) { /* file:// cũ */ }
  }
  currentView = view; closeSidebar(); render(); window.scrollTo(0, 0);
}
function goBack() {
  sfx('tap');
  if (navDepth > 0) history.back(); else go('home');
}
window.addEventListener('popstate', e => {
  const keep = () => { try { history.pushState({ v: currentView }, '', '#' + currentView); navDepth++; } catch (err) {} };
  navDepth = Math.max(0, navDepth - 1);
  if (document.getElementById('welcome')) { keep(); return; }        // màn chọn người chơi: đứng yên
  const qa = $('#quitAsk'); if (qa) { qa.remove(); keep(); return; }  // đang hỏi “Thoát bài?” → coi như Học tiếp
  if (!$('#modalRoot').hidden) { if (!askQuit()) closeModal(); keep(); return; } // Back khi đang mở hộp → đóng hộp
  const v = (e.state && e.state.v) || 'home';
  go(v === 'teacher' && !teacherOK ? 'home' : v, true);
});
try { history.replaceState({ v: 'home' }, '', location.pathname + location.search); } catch (e) {}
function pageHeading(kicker, title, desc, actions) {
  return '<div class="page-heading"><div><div class="eyebrow">' + kicker + '</div><h1>' + title + '</h1><p>' + desc + '</p></div>' + (actions ? '<div class="heading-actions">' + actions + '</div>' : '') + '</div>';
}
function starsHtml(n, max) { max = max || 3; let s = ''; for (let i = 0; i < max; i++) s += '<span class="star ' + (i < n ? 'on' : '') + '">★</span>'; return '<span class="stars">' + s + '</span>'; }
function accuracy() { return pct(S.correct, S.attempts); }

/* ============================== TRANG HỌC: QUẦN ĐẢO VƯỜN CHỮ ==============================
   Giao diện theo voyage.css + tranh assets/quan-dao.webp của Codex. Mỗi đảo là một lớp,
   chạm vào đảo → chọn lớp và mở con đường trong vườn của đảo đó. */
const ISLAND_SHORT = { 1: 'Phượng Đỏ', 2: 'Thác Bạc', 3: 'Cối Gió', 4: 'Hải Đăng', 5: 'Lâu Đài' };
function gradeTopics(g) { g = Number(g); return SCHOOL_GRADES.includes(g) ? ALL_TOPICS.filter(t => t.lop[0] <= g && g <= t.lop[1]) : []; }
function islandProgress(g) { const tl = gradeTopics(g); return { done: tl.filter(t => S.topics[t.id] && S.topics[t.id].done).length, total: tl.length }; }
function voyageChoice(action, sym, title, sub) {
  return '<button class="voyage-choice" data-action="' + action + '"><span class="choice-symbol" aria-hidden="true">' + sym + '</span><span><b>' + title + '</b><small>' + sub + '</small></span></button>';
}
function chooseIsland(g) {
  if (!SCHOOL_GRADES.includes(Number(g))) return;
  S.grade = String(g); save(); sfx('tap');
  go('roadmap'); toast('⛵ Cập bến ' + gardenName() + '!');
}
function renderHome() {
  const topics = myTopics(), done = topics.filter(t => tstat(t.id).done).length, next = nextTopic();
  const reviewN = Object.keys(S.review).filter(itemOf).length + WordShelf.dueCount();
  const hour = new Date().getHours(), greet = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const tip = next ? next.quyTac[0] : 'Em đã học hết các bài của ' + gardenName() + '. Hãy đánh thức Cây Chữ Thần hoặc sang đảo mới nhé!';
  return '<div class="voyage-home">' +
    '<section class="voyage-intro"><div class="voyage-kicker">BẢN ĐỒ VƯỜN CHỮ KÌ DIỆU</div><h1>' + greet + ', ' + esc(S.name) + '! <span aria-hidden="true">' + S.avatar + '</span></h1>' +
    '<p>Chọn hòn đảo để học. Đảo của em: <b>Lớp ' + esc(S.grade) + ' – ' + gardenName() + '</b>.</p></section>' +
    WordShelf.home() +
    '<section class="hero-card voyage-actions" aria-label="Lối tắt">' +
    voyageChoice('continue', '⛵', 'Tiếp tục hành trình', next ? esc(next.ten) : 'Cây Chữ Thần đang chờ') +
    voyageChoice('quick', '🚀', 'Luyện nhanh', '10 câu ngẫu nhiên') +
    voyageChoice('review', '🔁', 'Ôn câu sai', reviewN ? reviewN + ' mục đang chờ' : 'Chưa có câu sai') +
    voyageChoice('placement', '🎯', 'Kiểm tra trình độ', S.placement ? 'Lần trước: hợp lớp ' + S.placement.level : 'Gợi ý lớp phù hợp') +
    '</section>' +
    (typeof StoryQuest !== 'undefined' ? StoryQuest.homeCards() : '') +
    '<section class="sea-chart" aria-label="Bản đồ quần đảo"><header><h2>Quần đảo Vườn Chữ</h2><span>Đảo của em: <i>Lớp ' + esc(S.grade) + '</i></span></header>' +
    '<div class="chart-water chart-primary"><img class="island-art" src="assets/quan-dao-tieu-hoc.webp" alt="" width="1536" height="430" />' +
    SCHOOL_GRADES.map(g => { const p = islandProgress(g);
      return '<button class="island-pin island-' + g + (String(g) === S.grade ? ' selected' : '') + '" data-island="' + g + '" aria-label="Lớp ' + g + ' – ' + gardenName(g) + ', ' + p.done + ' trên ' + p.total + ' bài đã xong"><b>Lớp ' + g + '</b><span>' + ISLAND_SHORT[g] + (p.done ? '<i class="pin-prog"> · ' + p.done + '/' + p.total + '</i>' : '') + '</span></button>'; }).join('') +
    '</div></section>' +
    '<section class="hero-card next-voyage"><div class="hero-copy"><div class="eyebrow">BÀI HỌC TIẾP THEO · ' + gardenName().toUpperCase() + '</div>' +
    (next ? '<h2><span class="hero-topic-icon">' + next.bieuTuong + '</span> ' + esc(next.ten) + '</h2><p class="hero-tip">💡 ' + md(tip) + '</p><div class="hero-actions"><button class="primary-btn big" data-start="' + next.id + '">▶ Học ngay</button><button class="soft-btn big" data-view="roadmap">🗺️ Xem con đường</button></div>'
      : '<h2>🎉 Em đã học hết ' + gardenName() + '!</h2><p class="hero-tip">' + esc(tip) + '</p><div class="hero-actions"><button class="primary-btn big" data-action="continue">🌳 Tới Cây Chữ Thần</button><button class="soft-btn big" data-view="games">🎮 Trò chơi</button></div>') +
    '</div><img class="garden-illustration" src="assets/tho-doc-sach.webp" alt="" width="1000" height="667" /></section>' +
    '<section class="stats-row" aria-label="Tiến độ học tập">' +
    stat('⭐', 'gold', S.xp, 'Điểm XP') +
    stat('🌱', '', done + '<small> / ' + topics.length + '</small>', 'Bài đã xong') +
    stat('🌸', 'pink', S.flowers, 'Bông hoa') +
    stat('🔥', 'blue', typeof StreakRoom === 'undefined' ? S.streak : StreakRoom.live(), 'Ngày liên tiếp') + '</section>' +
    '<div class="two-column"><section><div class="section-title-row"><h2>Nhiệm vụ hôm nay</h2><span class="eyebrow">🎁 +2 🌸</span></div>' + missionCard() + '</section>' +
    '<section><div class="section-title-row"><h2>Khu vườn của em</h2></div>' + gardenCard() + '</section></div>' +
    '<section class="voyage-lessons"><div class="section-title-row"><h2>Các bài trên ' + gardenName() + '</h2><button class="text-link" data-view="roadmap">Xem con đường →</button></div>' +
    '<div class="topic-strip">' + topics.map(topicTile).join('') + '</div></section></div>';
}

/* ============================== KIỂM TRA TRÌNH ĐỘ ==============================
   Hai câu mỗi khối. Mức nào đúng ít nhất 1/2 thì qua; dừng ở mức đầu tiên chưa qua.
   Kết quả chỉ là GỢI Ý lớp – không ghi vào danh sách ôn, không tính sao bài học. */
// Mỗi mức = các bài của một lớp trong chương trình (data/chuong-trinh.js)
const PLACEMENT_LEVELS = SCHOOL_GRADES.map(g => gradeTopics(g).map(t => t.id));
function startPlacement() {
  const items = [];
  PLACEMENT_LEVELS.forEach((ids, k) => {
    const pool = [];
    ids.map(getTopic).filter(Boolean).forEach(t => t.baiTap.forEach((b, i) => { if (b.loai === 'chon' || b.loai === 'timLoi') pool.push(Object.assign({}, b, { _t: t.id, _i: i, _lv: k + 1 })); }));
    shuffle(pool).slice(0, 2).forEach(it => items.push(it.loai === 'chon' && Math.random() < 0.3 ? Object.assign(makeDungSai(it), { _lv: k + 1 }) : it));
  });
  openModal('◎ Kiểm tra trình độ', items.length + ' câu · không tính giờ', '<div class="speed-intro"><div class="big-emoji">🧭</div><h3>Em hợp với đảo nào?</h3><p>Làm <b>' + items.length + ' câu</b> từ dễ đến khó. Cứ bình tĩnh làm hết sức nhé!</p><button class="primary-btn big" id="goPlace">Bắt đầu ◎</button></div>');
  $('#goPlace').onclick = () => startQuiz({ kind: 'placement', title: 'Kiểm tra trình độ', icon: '🧭', subtitle: 'Từ dễ đến khó', items });
}
function finishPlacement(q) {
  const per = PLACEMENT_LEVELS.map((_, k) => q.log.filter(x => x.lv === k + 1));
  let passed = 0;
  for (const arr of per) { if (arr.length && arr.some(x => x.right)) passed++; else break; }
  const suggest = String(Math.max(1, passed));
  S.placement = { day: dayKey(), level: suggest, score: q.correct };
  S.xp += q.correct * 5; mission().games++;
  const prizes = StreakRoom.award();
  saveHistory('placement', '', 'Kiểm tra trình độ', q.correct, q.items.length);
  checkBadges(); save();
  sfx('win'); confetti();
  const body = '<div class="lesson-complete"><div class="result-mascot" aria-hidden="true">' + S.avatar + '</div><div class="complete-medal">🧭</div>' +
    '<h3>Em hợp với Lớp ' + suggest + ' – ' + gardenName(suggest) + '!</h3><p>Đây chỉ là gợi ý. Thầy cô và bố mẹ sẽ giúp em chọn lớp phù hợp nhất.</p>' +
    '<div class="place-levels">' + per.map((arr, k) => { const ok = arr.filter(x => x.right).length; return '<div class="place-row ' + (k < passed ? 'pass' : '') + '"><span>Mức ' + (k + 1) + '</span><div class="mission-bar"><span style="width:' + pct(ok, arr.length || 1) + '%"></span></div><b>' + ok + '/' + arr.length + '</b></div>'; }).join('') + '</div>' +
    '<div class="score-pills"><span>✅ ' + q.correct + ' / ' + q.items.length + ' câu đúng</span><span>⭐ +' + q.correct * 5 + ' XP</span></div>' + StreakRoom.celebrate(prizes) +
    '<div class="modal-actions center">' + (suggest !== S.grade ? '<button class="primary-btn big" id="goSuggest">⛵ Sang ' + gardenName(suggest) + '</button><button class="soft-btn" id="home">Giữ Lớp ' + esc(S.grade) + '</button>' : '<button class="primary-btn big" id="home">Tuyệt! Về trang học</button>') + '</div></div>';
  openModal('Kết quả kiểm tra', q.correct + ' / ' + q.items.length + ' câu đúng', body, 'result');
  Q = null;
  onModalClose = render;
  $('#home').onclick = () => { closeModal(); go('home'); };
  const gs = $('#goSuggest'); if (gs) gs.onclick = () => { closeModal(); chooseIsland(suggest); };
}
function stat(icon, cls, val, label) { return '<div class="stat-card"><div class="stat-icon ' + cls + '">' + icon + '</div><div><div class="stat-value">' + val + '</div><div class="stat-label">' + label + '</div></div></div>'; }
function actCard(action, icon, title, meta) { return '<button class="activity-card" data-action="' + action + '"><span class="activity-art">' + icon + '</span><span><b>' + title + '</b><small>' + meta + '</small></span></button>'; }
function gardenCard() {
  const st = gardenStage(S.xp), i = GARDEN.indexOf(st), nx = GARDEN[i + 1];
  return '<div class="daily-card garden-card"><div class="garden-row">' + GARDEN.map((g, k) => '<span class="' + (k <= i ? 'reached' : '') + '" title="' + g.name + ' – ' + g.xp + ' XP">' + g.icon + '</span>').join('') + '</div>' +
    '<h3>' + st.icon + ' ' + st.name + '</h3><p>' + (nx ? 'Thêm ' + (nx.xp - S.xp) + ' XP để vườn lớn thành <b>' + nx.name + '</b>.' : 'Vườn của em đã lớn nhất rồi!') + '</p>' +
    '<div class="daily-progress"><span style="width:' + (nx ? pct(S.xp - st.xp, nx.xp - st.xp) : 100) + '%"></span></div>' +
    (typeof gardenMini === 'function' ? gardenMini() : '') + '</div>';
}
/* Dùng nền cũ trong lúc chưa nạp lựa chọn của giáo viên từ chu-de.js. */
function noelOn() {
  const m = db.settings.noel || 'auto';
  if (m === 'on') return true; if (m === 'off') return false;
  const d = window.NOEL_TODAY ? new Date(window.NOEL_TODAY) : new Date(), mo = d.getMonth() + 1, day = d.getDate();
  return (mo === 11 && day >= 15) || mo === 12 || (mo === 1 && day <= 10);
}
/* Bài chưa mở: người tuyết (mùa Noel) hoặc quả trứng chờ nở – thay cho ổ khoá */
function lockArt() { return noelOn() ? '☃️' : '🥚'; }
const LOCK_MSG = () => 'Học xong bài trước để mở bài này nhé! ' + lockArt();
function topicTile(t) {
  const st = topicStatus(t), ts = tstat(t.id);
  return '<button class="topic-tile ' + st + '" style="--c:' + t.mau + '" ' + (st === 'locked' ? 'data-locked="1" aria-label="' + esc(t.ten) + ' – chưa mở"' : 'data-start="' + t.id + '"') + '>' +
    '<span class="topic-tile-icon' + (st === 'locked' ? ' lock-art' : '') + '">' + (st === 'locked' ? lockArt() : t.bieuTuong) + '</span><b>' + esc(t.ten) + '</b>' +
    (st === 'locked' ? '<small class="tile-wait">Học xong bài trước</small>' : starsHtml(ts.stars)) + '</button>';
}

/* ============================== LỘ TRÌNH: CON ĐƯỜNG TRONG VƯỜN ============================== */
const GARDEN_NAMES = { 1: 'Đảo Phượng Đỏ', 2: 'Đảo Thác Bạc', 3: 'Đảo Cối Gió', 4: 'Đảo Hải Đăng', 5: 'Đảo Lâu Đài' };
function gardenName(g) { return GARDEN_NAMES[g || S.grade] || 'Vườn Chữ'; }
const NODE_INFO = {
  challenge: { icon: '⚡', name: 'Thử thách' },
  gift: { icon: '🎁', name: 'Giỏ quà' },
  boss: { icon: '🌳', name: 'Cây Chữ Thần' }
};
const DECO = ['🌳', '🌷', '🍄', '🌻', '🪴', '🌼', '🦋', '🐝', '🌲', '🍓', '🐞', '🌿'];
/* Nút trên đường: bài học · ⚡ thử thách sau mỗi 2 bài · 🎁 giỏ quà sau mỗi 4 bài · 🌳 Cây Chữ Thần cuối vườn.
   Bài học mở theo thứ tự như cũ; thử thách/giỏ quà/cây thần mở khi mọi bài phía trước đã xong (không chặn bài sau). */
function pathNodes() {
  const topics = myTopics(), g = S.grade, nodes = [];
  let pending = [], ci = 0, gi = 0;
  topics.forEach((t, i) => {
    nodes.push({ type: 'lesson', id: t.id, topic: t });
    pending.push(t);
    const last = i === topics.length - 1;
    if (pending.length === 2 || last) { nodes.push({ type: 'challenge', id: 'ch' + g + '-' + (++ci), topics: pending }); pending = []; }
    if ((i + 1) % 4 === 0 && !last) nodes.push({ type: 'gift', id: 'gift' + g + '-' + (++gi) });
  });
  if (topics.length) nodes.push({ type: 'boss', id: 'boss' + g, topics });
  return nodes;
}
function nodeDone(n) { return n.type === 'lesson' ? tstat(n.id).done : !!(S.nodes[n.id] && S.nodes[n.id].done); }
function nodeStatus(n, idx, nodes) {
  if (nodeDone(n)) return 'done';
  if (n.type === 'lesson') return topicStatus(n.topic) === 'locked' ? 'locked' : 'open';
  return nodes.slice(0, idx).every(x => x.type !== 'lesson' || tstat(x.id).done) ? 'open' : 'locked';
}
let mapNodes = [];
function renderRoadmap() {
  const nodes = mapNodes = pathNodes(), topics = myTopics(), done = topics.filter(t => tstat(t.id).done).length;
  if (!nodes.length) return pageHeading('CON ĐƯỜNG TRONG VƯỜN', gardenName(), 'Chưa có bài học cho lớp này.');
  // Màn hẹp: các mốc so le gần nhau theo chiều ngang nên giãn dòng hơn để nhãn 3–4 dòng không chạm mốc sau
  const ROW = roadmapNarrow() ? 158 : 134, TOP = 176, XS = [50, 76, 50, 24];
  const pts = nodes.map((n, i) => ({ x: XS[i % 4], y: TOP + i * ROW }));
  const H = TOP + (nodes.length - 1) * ROW + 120;
  let d = 'M ' + pts[0].x + ' ' + (pts[0].y - 70) + ' L ' + pts[0].x + ' ' + pts[0].y;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], my = (a.y + b.y) / 2; d += ' C ' + a.x + ' ' + my + ' ' + b.x + ' ' + my + ' ' + b.x + ' ' + b.y; }
  const statuses = nodes.map((n, i) => nodeStatus(n, i, nodes));
  const cur = statuses.indexOf('open');
  const deco = pts.map((p, i) => { const x = p.x === 50 ? (i % 8 < 4 ? 12 : 88) : p.x > 50 ? 16 : 84; return '<span class="gm-deco" style="left:' + x + '%;top:' + (p.y + 14) + 'px">' + DECO[i % DECO.length] + '</span>'; }).join('');
  const bossDone = nodeDone(nodes[nodes.length - 1]), skipDone = !!(S.skip && S.skip[S.grade]);
  let lessonNo = 0;
  return '<div class="gm-head"><div><div class="eyebrow">CON ĐƯỜNG TRONG VƯỜN</div><h1>🌿 Lớp ' + esc(S.grade) + ' · ' + gardenName() + '</h1><p>' + done + ' / ' + topics.length + ' bài đã hoàn thành' + (bossDone ? ' · 🌳 Em đã đánh thức Cây Chữ Thần!' : '') + '</p></div>' +
    '<div class="gm-head-right"><div class="progress-track wide"><span style="width:' + pct(done, topics.length) + '%"></span></div><small>Mỗi bài có 3 mức: Dễ ★ · Vừa ★★ · Khó ★★★</small></div></div>' +
    '<div class="gm-grades" role="group" aria-label="Chọn lớp">' + SCHOOL_GRADES.map(g => { const p = islandProgress(g);
      return '<button class="gm-grade ' + (String(g) === S.grade ? 'on' : '') + '" data-island="' + g + '"><b>Lớp ' + g + '</b><small>' + p.done + '/' + p.total + ' bài</small><i style="width:' + pct(p.done, p.total) + '%"></i></button>'; }).join('') + '</div>' +
    (done < topics.length ? '<div class="gm-skip"><div><b>🚀 Kiểm tra kiến thức Lớp ' + esc(S.grade) + '</b><small>' + (skipDone ? 'Em đã vượt cấp – mọi bài đã mở để em học tự do.' : 'Đã biết nhiều rồi? Đúng từ 80% để mở khoá tất cả các bài.') + '</small></div>' +
      (skipDone ? '<span class="gm-skip-done">✓ Đã vượt cấp</span>' : '<button class="soft-btn" data-action="skip">Làm bài vượt cấp →</button>') + '</div>' : '') +
    '<div class="garden-map" style="height:' + H + 'px">' + deco +
    '<svg class="gm-path" viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path class="gm-road" d="' + d + '" vector-effect="non-scaling-stroke"/><path class="gm-dash" d="' + d + '" vector-effect="non-scaling-stroke"/></svg>' +
    '<div class="gm-gate">🌈 Cổng ' + gardenName() + '</div>' +
    nodes.map((n, i) => {
      const st = statuses[i], p = pts[i], info = NODE_INFO[n.type];
      const icon = st === 'locked' ? lockArt() : n.type === 'lesson' ? n.topic.bieuTuong : (n.type === 'gift' && st === 'done' ? '🧺' : info.icon);
      const label = n.type === 'lesson' ? esc(n.topic.ten) : info.name;
      return '<button class="gm-node ' + n.type + ' ' + st + (i === cur ? ' current' : '') + '" style="left:' + p.x + '%;top:' + p.y + 'px' + (n.topic ? ';--c:' + n.topic.mau : '') + '" data-node="' + i + '" aria-label="' + label + (st === 'locked' ? ' – đang khoá' : st === 'done' ? ' – đã xong' : '') + '">' +
        (i === cur ? '<span class="gm-me" aria-hidden="true">' + S.avatar + '</span>' : '') +
        '<span class="gm-disc">' + icon + '</span><span class="gm-label">' + (n.type === 'lesson' ? '<small class="gm-num">' + String(++lessonNo).padStart(2, '0') + ' · ' + esc(n.topic.nhom) + '</small>' : '') + '<b>' + label + '</b>' + (n.type === 'lesson' ? starsHtml(tstat(n.id).stars) : '') + '</span></button>';
    }).join('') + '</div>' +
    '<div class="gm-legend"><span>📘 Bài học</span><span>⚡ Thử thách: tính giờ, 3 💧</span><span>🎁 Giỏ quà</span><span>🌳 Cây Chữ Thần cuối vườn</span></div>';
}
function roadmapNarrow() { return window.innerWidth < 720; }
let roadmapWasNarrow = null;
function bindRoadmap() {
  roadmapWasNarrow = roadmapNarrow();
  $$('[data-node]').forEach(b => b.onclick = () => openNode(Number(b.dataset.node)));
  const cur = $('.gm-node.current');
  if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }), 60);
}
function openNode(i) {
  const n = mapNodes[i]; if (!n) return;
  const st = nodeStatus(n, i, mapNodes);
  if (st === 'locked') { sfx('bad'); toast(n.type === 'lesson' ? LOCK_MSG() : 'Học xong các bài phía trước trên ' + gardenName() + ' để mở ' + NODE_INFO[n.type].name.toLowerCase() + ' nhé! ' + lockArt()); return; }
  if (n.type === 'lesson') { startTopic(n.id); return; }
  if (n.type === 'gift') { openGift(n, st); return; }
  const boss = n.type === 'boss', names = n.topics.map(t => t.ten);
  const count = boss ? 12 : 8, secs = boss ? 150 : 90;
  const body = '<div class="node-intro ' + n.type + '"><div class="big-emoji">' + (boss ? '🌳' : '⚡') + '</div>' +
    '<h3>' + (boss ? 'Cây Chữ Thần của ' + gardenName() : 'Thử thách tốc độ') + '</h3>' +
    '<p>' + (boss ? 'Trả lời ' + count + ' câu trộn từ <b>mọi bài</b> của ' + gardenName() + ' để đánh thức Cây Chữ Thần!' : 'Ôn lại bài: <b>' + esc(names.join(', ')) + '</b>.') + '</p>' +
    '<div class="score-pills"><span>📝 ' + count + ' câu</span><span>⏱ ' + secs + ' giây</span><span>💧 3 giọt nước</span></div>' +
    '<p class="small-print">Mỗi câu sai mất 1 giọt nước. Hết nước hoặc hết giờ thì mình thử lại – không mất gì cả!</p>' +
    (st === 'done' ? '<div class="unlock-note">✅ Em đã vượt qua rồi. Chơi lại để luyện thêm nhé!</div>' : '') +
    '<div class="modal-actions center"><button class="primary-btn big" id="goNode">Bắt đầu ' + (boss ? '🌳' : '⚡') + '</button></div></div>';
  openModal(boss ? '🌳 Cây Chữ Thần' : '⚡ Thử thách', gardenName() + ' · Lớp ' + esc(S.grade), body);
  $('#goNode').onclick = () => startQuiz({ kind: n.type, nodeId: n.id, title: boss ? 'Cây Chữ Thần' : 'Thử thách: ' + names.join(' · '), icon: boss ? '🌳' : '⚡', items: mixedItems(n.topics, count), lives: 3, timeLimit: secs });
  $('#goNode').focus();
}
function openGift(n, st) {
  if (st === 'done') { toast('Em đã mở giỏ quà này rồi 🧺'); return; }
  const tips = myTopics().flatMap(t => t.quyTac.map(r => ({ t, r })));
  const tip = pick(tips);
  openModal('🎁 Giỏ quà', gardenName() + ' · phần thưởng chăm học', '<div class="gift-open"><div class="gift-box">🎁</div><p>Em đã chăm chỉ học bài. Giỏ quà này là của em!</p><div class="modal-actions center"><button class="primary-btn big" id="openGift">Mở giỏ quà ✨</button></div></div>');
  onModalClose = render;
  $('#openGift').onclick = () => {
    S.nodes[n.id] = { done: true, at: Date.now() }; S.flowers += 3; S.xp += 30; checkBadges(); save();
    sfx('win'); confetti();
    $('.gift-open').innerHTML = '<div class="gift-box opened">🧺</div><h3>Em nhận được</h3><div class="score-pills"><span>🌸 +3 bông hoa</span><span>⭐ +30 XP</span></div>' +
      '<div class="tip-card"><b>📜 Bí kíp chính tả</b><p>' + tip.t.bieuTuong + ' ' + md(tip.r) + '</p></div><div class="modal-actions center"><button class="primary-btn big" data-close-modal>Cảm ơn! 💚</button></div>';
  };
}

/* ============================== TRÒ CHƠI ============================== */
const GAMES = [
  { action: 'adaptive', icon: '🕵️', title: 'Nhiệm vụ của riêng em', desc: 'Chọn Thỏ Lá, Cầu thủ hoặc Nhà vua để cùng luyện những nhóm chữ em hay nhầm.', meta: '5 câu · 3 nhân vật' },
  { action: 'stories', icon: '📖', title: 'Truyện mở khoá bằng chữ đúng', desc: 'Mỗi câu đúng mở thêm một khung truyện mới.', meta: '3 chương · có tranh động' },
  { action: 'daily', icon: '🎯', title: 'Thử thách mỗi ngày', desc: '5 câu trộn từ các bài em đã mở, ưu tiên từ em hay nhầm.', meta: '+20 XP mỗi ngày' },
  { action: 'speed', icon: '🚀', title: 'Nhanh tay', desc: 'Trong 60 giây, chọn đúng càng nhiều chữ càng tốt!', meta: 'Kỉ lục của em: ' },
  { action: 'snowcatch', icon: '❄️', title: 'Hứng tuyết chữ', desc: 'Bông tuyết mang chữ rơi xuống – chạm vào bông tuyết viết đúng để điền vào câu!', meta: 'Kỉ lục của em: ' },
  { action: 'hunt', icon: '🔎', title: 'Thám tử săn lỗi', desc: 'Mỗi câu có một chữ viết sai. Chạm vào chữ đó để sửa!', meta: '6 câu · đọc kĩ từng chữ' },
  { action: 'dictation', icon: '🎧', title: 'Nghe – viết đoạn văn', desc: 'Nghe máy đọc từng câu trong đoạn văn rồi gõ lại.', meta: 'Có nghe chậm, nghe lại' },
  { action: 'review', icon: '🔁', title: 'Ôn từ hay nhầm', desc: 'Các câu em làm sai sẽ quay lại. Đúng 2 lần là thuộc!', meta: 'Ôn tập ngắt quãng' },
  { action: 'quick', icon: '🎲', title: 'Luyện nhanh', desc: '10 câu ngẫu nhiên đủ kiểu: đúng/sai, ghép chữ, chọn chữ, tìm lỗi.', meta: 'Trộn từ các bài em đã mở' },
  { action: 'arena', icon: '🏆', title: 'Đấu trường chữ', desc: 'Thầy cô mở phòng theo đội hoặc cho cả lớp thi trực tiếp bằng điện thoại.', meta: 'Giáo viên tạo phòng · có bảng điểm' },
  { action: 'joinArena', icon: '🔢', title: 'Vào phòng đấu chữ', desc: 'Nhập mã 6 kí tự thầy cô chiếu để vào lượt thi của lớp.', meta: 'Cần kết nối hồ sơ với lớp' }
];
function renderGames() {
  return pageHeading('HỌC MÀ CHƠI', 'Chọn một trò chơi', 'Chơi vui một chút, nhớ chữ thật lâu!') +
    '<div class="project-panel practice-link"><div><h2>Luyện theo chủ đề</h2><p>Chọn dạng chính tả, nhìn tranh, điền chữ, nghe viết hoặc xếp tiếng.</p></div><button class="primary-btn" data-view="practice">Chọn bài →</button></div>' +
    '<div class="game-grid">' + GAMES.map(g => '<article class="game-card"><div class="game-icon">' + g.icon + '</div><div><h3>' + g.title + '</h3><p>' + g.desc + '</p><div class="game-meta">' + g.meta + (g.action === 'speed' ? S.bestSpeed + ' điểm' : g.action === 'snowcatch' ? (S.bestSnow || 0) + ' điểm' : '') + '</div><button class="primary-btn" data-action="' + g.action + '">Chơi ngay →</button></div></article>').join('') + '</div>';
}

/* ============================== ÔN LẠI ============================== */
function renderReview() {
  const keys = Object.keys(S.review).filter(itemOf);
  const sets = WordShelf.dueSets(), total = keys.length + WordShelf.dueCount();
  return pageHeading('GÓC GHI NHỚ', 'Ôn lại từ em hay nhầm', 'Luyện lại các thẻ từ còn sai. Với câu trong bài học, em cần trả lời đúng ở hai lượt khác nhau.', total ? '<button class="primary-btn" data-action="review">▶ Ôn ngay</button>' : '') +
    '<div class="review-summary"><div class="review-summary-card"><b>' + total + '</b><small>Mục đang chờ ôn</small></div><div class="review-summary-card"><b>' + S.reviewed + '</b><small>Câu đã ôn trong bài học</small></div><div class="review-summary-card"><b>' + accuracy() + '%</b><small>Độ chính xác bài học</small></div></div>' +
    WordShelf.reviewList(sets) +
    (keys.length ? '<div class="review-list">' + keys.map(k => {
      const it = itemOf(k); if (!it) return ''; const t = getTopic(it._t), box = S.review[k].box;
      return '<div class="review-item"><span class="review-word">' + esc(itemWord(it)) + '</span><span class="review-note">' + esc(t.ten) + '</span><span class="lesson-tag">' + (box ? '✅ Đúng 1/2 lần' : '⏳ Cần ôn') + '</span><button class="mini-speak" data-say="' + esc(it.loai === 'chon' ? fullSentence(it) : it.loai === 'timLoi' ? it.cau.replace(it.tuSai, it.tuDung) : it.loai === 'classQuestion' ? itemWord(it) : it.cau) + '" aria-label="Nghe">🔊</button></div>';
    }).join('') + '</div>'
      : sets.length ? '' : '<div class="review-empty"><div class="empty-icon">🌷</div><b>Chưa có từ nào cần ôn</b><p>Em hãy học một bài mới. Câu nào sai, mình sẽ lưu lại đây để luyện thêm.</p><button class="primary-btn" data-view="roadmap">Chọn bài học</button></div>');
}

/* ============================== HUY HIỆU ============================== */
function renderBadges() {
  return pageHeading('BỘ SƯU TẬP', 'Huy hiệu của em', 'Em đã có ' + S.badges.length + ' / ' + BADGES.length + ' huy hiệu. Cố gắng sưu tầm đủ nhé!') +
    '<div class="badge-grid">' + BADGES.map(b => { const on = S.badges.includes(b.id); return '<div class="badge-card ' + (on ? 'on' : '') + '"><div class="badge-icon">' + b.icon + '</div><b>' + b.name + '</b><small>' + b.desc + '</small></div>'; }).join('') + '</div>' +
    '<div class="note-callout big-note">🔥 Chuỗi ngày học hiện tại: <b>' + S.streak + ' ngày</b> · ⚡ Đúng liên tiếp nhiều nhất: <b>' + S.bestCombo + ' câu</b></div>';
}
function checkBadges() {
  const topics = myTopics();
  const cond = {
    first: Object.values(S.topics).some(t => t.done),
    perfect: Object.values(S.topics).some(t => t.best >= 100),
    combo10: S.bestCombo >= 10, streak3: S.streak >= 3, streak7: S.streak >= 7,
    xp100: S.xp >= 100, xp500: S.xp >= 500, listener: S.dictCorrect >= 5, hunter: S.hunted >= 10,
    speed15: S.bestSpeed >= 15, reviewer: S.reviewed >= 5,
    allDone: topics.length > 0 && topics.every(t => tstat(t.id).done),
    boss: S.bossWins > 0, flowers20: S.flowers >= 20
  };
  const fresh = BADGES.filter(b => cond[b.id] && !S.badges.includes(b.id));
  fresh.forEach(b => S.badges.push(b.id));
  return fresh;
}

/* ============================== GÓC GIÁO VIÊN ============================== */
function teacherGate() {
  if (typeof GUEST_MODE !== 'undefined' && GUEST_MODE) { toast('Hãy thoát chế độ học thử để mở Góc thầy cô.'); return; }
  openModal('Dành cho thầy cô 👩‍🏫', 'Đăng nhập để vào góc giáo viên',
    '<form class="gate" id="gateForm" autocomplete="off"><p>Góc này có thông tin học sinh và cài đặt lớp, <b>chỉ thầy cô được vào</b>. Em hãy quay lại bằng nút ✕ nhé.</p>' +
    '<label for="gateInput">Mật khẩu giáo viên</label><input id="gateInput" type="password" class="dictation-input" autocomplete="current-password" aria-label="Mật khẩu giáo viên" />' +
    '<p class="gate-err" id="gateErr" role="alert"></p><div class="modal-actions"><button class="primary-btn" id="gateOk">Đăng nhập</button> <button type="button" class="soft-btn" data-close-modal>Huỷ</button></div></form>');
  const form = $('#gateForm');
  form.onsubmit = async e => {
    e.preventDefault();
    const btn = $('#gateOk'), err = $('#gateErr'); btn.disabled = true; err.textContent = '';
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('#gateInput').value }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(body.error || 'Chưa đăng nhập được.');
      try { sessionStorage.setItem('vuonchu.teacherToken', body.token); } catch (x) {}
      if (typeof MayChu !== 'undefined' && MayChu.setToken) MayChu.setToken(body.token);
      teacherOK = true; closeModal(); go('teacher');
    } catch (x) { sfx('bad'); err.textContent = x instanceof TypeError ? 'Chưa kết nối được máy chủ. Thầy cô kiểm tra mạng rồi thử lại.' : x.message; btn.disabled = false; $('#gateInput').select(); }
  };
  $('#gateInput').focus();
}
function renderTeacher() {
  const profiles = Object.values(db.profiles);
  const missed = Object.entries(S.wrongLog).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => { const it = itemOf(k); return it ? { it, n } : null; }).filter(Boolean);
  return pageHeading('GÓC DÀNH CHO GIÁO VIÊN', 'Theo dõi tiến độ học', 'Hồ sơ chưa kết nối máy chủ sẽ chỉ lưu trong trình duyệt của thiết bị này.', '<button class="soft-btn" id="printReport">🖨️ In báo cáo</button>') +
    '<section class="project-panel teacher-go"><h2>👩‍🏫 Trang giáo viên</h2><p>Quản lý lớp trên mọi máy, giao bài, sửa câu hỏi, tải tài liệu và gửi nhận xét. Đăng nhập bằng mật khẩu giáo viên.</p><a class="primary-btn teacher-go-btn" href="giao-vien/">Mở trang giáo viên →</a></section>' +
    ClassRoom.panel() + ClassPractice.questionPanel() + WordShelf.teacherPanel() + '<div class="teacher-layout">' +
    '<section class="teacher-panel span-2"><h2>👧👦 Học sinh trên máy này (' + profiles.length + ')</h2><div class="table-wrap"><table class="t-table"><thead><tr><th>Học sinh</th><th>Lớp</th><th>XP</th><th>Bài xong</th><th>Đúng</th><th>Chuỗi ngày</th><th>Học gần nhất</th><th></th></tr></thead><tbody>' +
    profiles.map(p => { const g = Number(p.grade), tl = ALL_TOPICS.filter(t => t.lop[0] <= g && g <= t.lop[1]); const d = tl.filter(t => p.topics[t.id] && p.topics[t.id].done).length;
      return '<tr class="' + (p.id === S.id ? 'me' : '') + '"><td>' + p.avatar + ' ' + esc(p.name) + (p.id === S.id ? ' <small>(đang dùng)</small>' : '') + '</td><td>' + esc(p.grade) + '</td><td>' + p.xp + '</td><td>' + d + '/' + tl.length + '</td><td>' + pct(p.correct, p.attempts) + '%</td><td>' + p.streak + '</td><td>' + (p.lastDay || '—') + '</td><td>' + (p.id === S.id ? '' : '<button class="soft-btn sm" data-switch="' + p.id + '">Chọn</button>') + (p.pin ? ' <button class="soft-btn sm" data-unpin="' + p.id + '" title="Học sinh quên mã PIN">🔓 Xoá PIN</button>' : '') + '</td></tr>'; }).join('') +
    '</tbody></table></div></section>' +
    '<section class="teacher-panel"><h2>📊 Chi tiết: ' + S.avatar + ' ' + esc(S.name) + ' · Lớp ' + esc(S.grade) + '</h2><div class="table-wrap"><table class="t-table"><thead><tr><th>Bài</th><th>Sao</th><th>Tốt nhất</th><th>Đúng</th></tr></thead><tbody>' +
    myTopics().map(t => { const ts = tstat(t.id); return '<tr><td>' + t.bieuTuong + ' ' + esc(t.ten) + '</td><td>' + starsHtml(ts.stars) + '</td><td>' + (ts.attempts ? ts.best + '%' : '—') + '</td><td>' + (ts.attempts ? pct(ts.correct, ts.attempts) + '%' : '—') + '</td></tr>'; }).join('') +
    '</tbody></table></div></section>' +
    '<section class="teacher-panel"><h2>❗ Từ học sinh hay sai nhất</h2>' + (missed.length ? '<ul class="missed-list">' + missed.map(m => '<li><b>' + esc(itemWord(m.it)) + '</b> <span>(' + esc(getTopic(m.it._t).ten) + ')</span> <em>sai ' + m.n + ' lần</em></li>').join('') + '</ul>' : '<p>Chưa có dữ liệu. Khi học sinh làm sai, từ đó sẽ hiện ở đây để thầy cô dạy lại.</p>') + '</section>' +
    '<section class="teacher-panel"><h2>⚙️ Cài đặt lớp học</h2>' +
    '<label class="switch-row"><input type="checkbox" id="unlockAll" ' + (db.settings.unlockAll ? 'checked' : '') + ' /> Mở khoá tất cả bài (cho phép học sinh chọn bài bất kì)</label>' +
    '<div class="btn-row"><button class="soft-btn" id="exportData">⬇️ Sao lưu dữ liệu</button><label class="soft-btn file-btn">⬆️ Khôi phục<input type="file" id="importData" accept=".json,application/json" hidden /></label></div>' +
    '<div class="btn-row"><button class="soft-btn danger" id="resetCurrent">🗑️ Xoá tiến độ của ' + esc(S.name) + '</button>' + (profiles.length > 1 ? '<button class="soft-btn danger" id="deleteCurrent">❌ Xoá học sinh này</button>' : '') + '</div>' +
    '<div id="confirmArea"></div></section>' +
    '<section class="teacher-panel"><h2>🖨️ Phiếu bài tập in cho lớp</h2><p>Chọn chủ đề để in phiếu luyện tập: điền chữ, tìm lỗi sai, nghe – viết. Đáp án nằm ở trang sau, dùng cho giờ chính tả hoặc bài về nhà.</p>' +
    '<div class="btn-row"><select id="wsTopic" class="t-select" aria-label="Chọn chủ đề phiếu">' + myTopics().map(t => '<option value="' + t.id + '">' + t.bieuTuong + ' ' + esc(t.ten) + '</option>').join('') + '</select><button class="primary-btn" id="wsOpen">👀 Xem &amp; in phiếu</button></div></section>' +
    '<section class="teacher-panel"><h2>🔊 Giọng đọc</h2>' +
    (viVoices.length ? '<div class="field-label">Giọng tiếng Việt trên máy này</div><select id="voiceSel" class="t-select" aria-label="Chọn giọng đọc">' + viVoices.map(v => '<option value="' + esc(v.name) + '" ' + (viVoice && v.name === viVoice.name ? 'selected' : '') + '>' + esc(v.name) + (voiceGender(v) ? ' (' + voiceGender(v) + ')' : '') + '</option>').join('') + '</select>' +
      (viVoices.some(v => voiceGender(v) === 'nữ') ? '' : '<p class="warn-text">Máy này chưa có giọng nữ tiếng Việt. Mở bằng <b>Microsoft Edge</b> để có giọng nữ tự nhiên <b>Hoài My</b>.</p>')
      : '<p class="warn-text">Máy này chưa có giọng đọc tiếng Việt, phần nghe – viết sẽ cần thầy cô đọc giúp. Gợi ý: trình duyệt <b>Microsoft Edge</b> thường có sẵn giọng tiếng Việt; trên Windows có thể thêm giọng ở Cài đặt → Thời gian &amp; ngôn ngữ → Giọng nói.</p>') +
    '<div class="field-label">Tốc độ đọc</div><select id="rateSel" class="t-select" aria-label="Tốc độ đọc"><option value="0.8">🐢 Chậm (lớp 1–2)</option><option value="1">Vừa</option><option value="1.15">Nhanh hơn</option></select>' +
    '<div class="btn-row"><button class="soft-btn" id="voiceTest">▶ Nghe thử</button></div></section>' +
    '<section class="teacher-panel"><h2>🧭 Gợi ý sử dụng trên lớp</h2><ul>' +
    '<li>Mỗi học sinh tạo một hồ sơ (bấm vào avatar góc trên) để máy dùng chung vẫn lưu riêng tiến độ.</li>' +
    '<li>Trình chiếu lên màn hình: cả lớp cùng chọn đáp án, thầy cô bấm 🔊 để đọc câu.</li>' +
    '<li>Sau mỗi bài, cho học sinh đặt câu mới với từ vừa học để nhớ lâu.</li>' +
    '<li>Phần nghe – viết dùng giọng đọc tiếng Việt của máy. Nếu máy không có giọng Việt, thầy cô bấm “👀 Xem câu” và tự đọc cho học sinh.</li>' +
    '<li>Mẹo hỏi/ngã chỉ đúng với phần lớn từ láy, cần kết hợp ghi nhớ từ.</li></ul></section>' +
    '</div>';
}
function bindTeacher() {
  MayChu.bindTeacher();
  ClassRoom.bind();
  ClassPractice.bindBank();
  $('#printReport').onclick = () => window.print();
  $('#wsOpen').onclick = () => showWorksheet(getTopic($('#wsTopic').value));
  const vs = $('#voiceSel');
  if (vs) vs.onchange = e => { db.settings.voice = e.target.value; findVoice(); save(); speak('Xin chào các em!'); };
  $('#rateSel').value = String(db.settings.rate || 1);
  $('#rateSel').onchange = e => { db.settings.rate = Number(e.target.value); save(); speak('Con kiến tha mồi về tổ.'); };
  $('#voiceTest').onclick = () => { if (!db.settings.sound) { toast('Âm thanh đang tắt, bấm 🔇 ở góc trên để bật.'); return; } speak('Chào các em, hôm nay chúng ta cùng luyện chính tả nhé!'); };
  $('#unlockAll').onchange = e => { db.settings.unlockAll = e.target.checked; save(); toast(e.target.checked ? 'Đã mở khoá tất cả bài' : 'Đã bật học theo thứ tự'); };
  $('#exportData').onclick = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vuon-chu-' + dayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#importData').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(txt => {
      const d = JSON.parse(txt);
      if (!d.profiles || !d.profiles[d.current]) throw new Error('bad');
      localStorage.setItem(STORE_KEY, JSON.stringify(d)); db = loadDB(); S = db.profiles[db.current]; render(); toast('Đã khôi phục dữ liệu!');
    }).catch(() => toast('File không đúng định dạng sao lưu của Vườn Chữ.'));
  };
  const confirmBox = (text, fn) => {
    $('#confirmArea').innerHTML = '<div class="confirm-box"><p>' + text + '</p><button class="soft-btn danger" id="yesDo">Đồng ý xoá</button> <button class="soft-btn" id="noDo">Huỷ</button></div>';
    $('#yesDo').onclick = fn; $('#noDo').onclick = () => { $('#confirmArea').innerHTML = ''; };
  };
  $('#resetCurrent').onclick = () => confirmBox('Xoá toàn bộ XP, sao, huy hiệu của <b>' + esc(S.name) + '</b>? Không thể hoàn tác.', () => {
    const fresh = newProfile(S.name, S.grade, S.avatar); fresh.id = S.id; db.profiles[S.id] = fresh; S = fresh; save(); render(); toast('Đã xoá tiến độ.');
  });
  const del = $('#deleteCurrent');
  if (del) del.onclick = () => confirmBox('Xoá hẳn hồ sơ <b>' + esc(S.name) + '</b> khỏi máy này?', () => {
    delete db.profiles[S.id]; db.current = Object.keys(db.profiles)[0]; S = db.profiles[db.current]; save(); render(); toast('Đã xoá học sinh.');
  });
  $$('[data-switch]').forEach(b => b.onclick = () => switchProfile(b.dataset.switch));
  $$('[data-unpin]').forEach(b => b.onclick = () => { const p = db.profiles[b.dataset.unpin]; if (!p) return; p.pin = undefined; save(); render(); toast('🔓 Đã xoá mã PIN của ' + p.name); });
}
/* ============================== PHIẾU BÀI TẬP IN ============================== */
function worksheetHtml(t) {
  const chon = t.baiTap.filter(b => b.loai === 'chon'), loi = t.baiTap.filter(b => b.loai === 'timLoi'), nghe = t.baiTap.filter(b => b.loai === 'ngheViet');
  const sorted = b => b.luaChon.slice().sort((x, y) => x.localeCompare(y, 'vi')); // không để đáp án luôn đứng đầu
  const blank = '<span class="ws-blank"></span>';
  const keyWord = b => { const w = itemWord(Object.assign({ loai: 'chon' }, b)); return esc(b.dapAn) + (b.de.includes('___') && w !== b.dapAn ? ' (' + esc(w) + ')' : ''); };
  let h = '<div class="ws-head"><div><div class="ws-brand">Vườn Chữ Kì Diệu · Phiếu luyện chính tả</div><h1>' + t.bieuTuong + ' ' + esc(t.ten) + '</h1></div><div class="ws-meta">Họ và tên: ……………………………………<br />Lớp: ………… Ngày: ……………………</div></div>';
  h += '<div class="ws-rule"><b>💡 Mẹo nhớ</b><ul>' + t.quyTac.map(r => '<li>' + md(r) + '</li>').join('') + '</ul></div>';
  h += '<h2>Bài 1. Chọn chữ đúng, điền vào chỗ trống</h2><ol class="ws-list">' + chon.map(b => b.de.includes('___')
    ? '<li>' + esc(b.de).replace('___', blank) + ' <span class="ws-opt">(' + sorted(b).map(esc).join(' / ') + ')</span></li>'
    : '<li>' + esc(b.de) + ' <span class="ws-opt">(đánh dấu ✓ vào câu đúng)</span><div class="ws-choices">' + sorted(b).map(o => '<div>☐ ' + esc(o) + '</div>').join('') + '</div></li>').join('') + '</ol>';
  if (loi.length) h += '<h2>Bài 2. Gạch chân chữ viết sai trong mỗi câu, rồi viết lại cho đúng</h2><ol class="ws-list">' + loi.map(b => '<li>' + esc(b.cau) + '<div class="ws-line">Sửa lại: …………………………………</div></li>').join('') + '</ol>';
  if (nghe.length) h += '<h2>Bài 3. Nghe thầy cô đọc rồi viết lại</h2>' + nghe.map((_, i) => '<div class="ws-write"><span>' + (i + 1) + '.</span></div>').join('');
  h += '<div class="ws-done">Em tự đánh giá: ☐ Em làm được hết &nbsp; ☐ Em còn sai vài chữ &nbsp; ☐ Em cần cô giúp thêm</div>';
  h += '<div class="ws-key"><h2>Đáp án (dành cho thầy cô)</h2><p><b>Bài 1:</b> ' + chon.map((b, i) => (i + 1) + '. ' + keyWord(b)).join('; ') + '</p>' +
    (loi.length ? '<p><b>Bài 2:</b> ' + loi.map((b, i) => (i + 1) + '. ' + esc(b.tuSai) + ' → ' + esc(b.tuDung)).join('; ') + '</p>' : '') +
    (nghe.length ? '<p><b>Bài 3 – câu đọc cho học sinh:</b></p><ol class="ws-list">' + nghe.map(b => '<li>' + esc(b.cau) + '</li>').join('') + '</ol>' : '') + '</div>';
  return h;
}
function showWorksheet(t) {
  if (!t) return;
  openModal('🖨️ Phiếu bài tập', esc(t.ten) + ' · xem trước khi in', '<div class="ws-preview"><div class="worksheet">' + worksheetHtml(t) + '</div></div><div class="modal-actions"><button class="primary-btn big" id="wsPrint">🖨️ In phiếu</button></div>', 'wide');
  $('#wsPrint').onclick = () => {
    let el = $('#printSheet');
    if (!el) { el = document.createElement('div'); el.id = 'printSheet'; document.body.appendChild(el); }
    el.innerHTML = '<div class="worksheet">' + worksheetHtml(t) + '</div>';
    document.body.classList.add('print-sheet');
    const done = () => document.body.classList.remove('print-sheet');
    window.addEventListener('afterprint', done, { once: true });
    window.print();
    setTimeout(done, 1500);
  };
}

function switchProfile(id) { db.current = id; S = db.profiles[id]; save(); render(); toast('Xin chào ' + S.name + '! ' + S.avatar); }

/* ============================== HỒ SƠ HỌC SINH ============================== */
function showProfile() {
  const others = Object.values(db.profiles).filter(p => p.id !== S.id);
  const picker = typeof charPicker === 'function' ? charPicker(S.avatar)
    : '<div class="profile-avatars">' + AVATARS.map(a => '<button type="button" class="' + (a === S.avatar ? 'selected' : '') + '" data-char="' + a + '" aria-label="Chọn ' + a + '">' + a + '</button>').join('') + '</div>';
  const body = '<form class="profile-form" id="profileForm" novalidate>' +
    (others.length ? '<div><div class="field-label">Đổi sang bạn khác</div><div class="profile-list">' + others.map(p => '<button type="button" class="profile-chip" data-switch-p="' + p.id + '">' + p.avatar + ' ' + esc(p.name) + ' <small>lớp ' + esc(p.grade) + (p.pin ? ' · 🔐' : '') + '</small></button>').join('') + '</div></div>' : '') +
    '<label>Tên của em<input id="nameInput" maxlength="20" placeholder="Ví dụ: Minh An" value="' + esc(S.name) + '" autocomplete="off" /></label>' +
    '<div><div class="field-label">Chọn bạn đồng hành</div>' + picker + '</div>' +
    '<label>Em đang học lớp<select id="profileGrade">' + SCHOOL_GRADES.map(g => '<option value="' + g + '" ' + (S.grade == g ? 'selected' : '') + '>Lớp ' + g + ' – ' + gardenName(g) + '</option>').join('') + '</select></label>' +
    '<label>Mã PIN 4 số (không bắt buộc)<input id="pinInput" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" placeholder="' + (S.pin ? 'Đã đặt mã – nhập 4 số mới để đổi' : 'Để trống nếu không cần') + '" /></label>' +
    (S.pin ? '<label class="switch-row"><input type="checkbox" id="pinOff" /> Bỏ mã PIN của hồ sơ này</label>' : '') +
    '<p class="pin-err" id="profileErr" role="alert"></p>' +
    '<div class="modal-actions"><button type="button" class="soft-btn" id="addProfile">➕ Thêm bạn mới</button><button type="submit" class="primary-btn" id="saveProfile">Lưu thay đổi</button></div>' +
    '<p class="small-print">Nhiều bạn dùng chung một máy? Mỗi bạn tạo một hồ sơ riêng, có thể đặt mã PIN để không ai vào nhầm. Dữ liệu chỉ lưu trên máy này.</p></form>';
  openModal('Sửa hồ sơ', 'Tên, bạn đồng hành, lớp và mã PIN', body);
  let avatar = S.avatar;
  if (typeof bindCharPicker === 'function') bindCharPicker(a => { avatar = a; });
  else $$('[data-char]').forEach(b => b.onclick = () => { avatar = b.dataset.char; sfx('tap'); $$('[data-char]').forEach(x => x.classList.toggle('selected', x === b)); });
  $$('[data-switch-p]').forEach(b => b.onclick = () => { closeModal(); if (typeof requestSwitch === 'function') requestSwitch(b.dataset.switchP); else switchProfile(b.dataset.switchP); });
  $('#pinInput').oninput = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); };
  $('#profileForm').onsubmit = e => {
    e.preventDefault();
    const pin = $('#pinInput').value;
    if (pin && !/^\d{4}$/.test(pin)) { $('#profileErr').textContent = 'Mã PIN gồm đúng 4 chữ số, hoặc để trống.'; return; }
    S.name = $('#nameInput').value.trim().replace(/\s+/g, ' ') || 'Bạn nhỏ'; S.grade = $('#profileGrade').value; S.avatar = avatar;
    if (pin && typeof pinHash === 'function') S.pin = pinHash(pin, S.id);
    const off = $('#pinOff'); if (off && off.checked) delete S.pin;
    save(); closeModal(); render(); toast(pin ? '🔐 Đã lưu hồ sơ và mã PIN!' : 'Đã lưu hồ sơ của em!');
  };
  $('#addProfile').onclick = () => {
    closeModal();
    if (typeof showCreate === 'function') { showCreate(false); return; }
    const p = newProfile('Bạn mới', S.grade, pick(AVATARS)); db.profiles[p.id] = p; db.current = p.id; S = p; save(); render(); showProfile();
  };
}

/* ============================== HỘP THOẠI ============================== */
let onModalClose = null;
function openModal(title, subtitle, body, cls) {
  const root = $('#modalRoot');
  root.className = 'modal-root';
  root.innerHTML = '<div class="modal-card ' + (cls || '') + '" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><h2 id="modalTitle">' + title + '</h2><p>' + (subtitle || '') + '</p></div><button class="modal-close" data-close-modal aria-label="Đóng">×</button></div><div class="modal-body">' + body + '</div></div>';
  root.hidden = false; document.body.classList.add('modal-open');
  $('.app-shell').inert = true;
  root.onclick = e => { if (e.target === root) closeModal(); };
}
function closeModal() {
  const root = $('#modalRoot'); root.hidden = true; root.innerHTML = ''; root.className = 'modal-root';
  clearInterval(qTimer);
  $('.app-shell').inert = false;
  document.body.classList.remove('modal-open'); stopSpeak();
  if (onModalClose) { const f = onModalClose; onModalClose = null; f(); }
  Q = null;
}

/* ============================== BÀI HỌC ============================== */
function startTopic(id) {
  const t = getTopic(id); if (!t) return;
  if (!myTopics().includes(t)) return;
  if (topicStatus(t) === 'locked') { toast(LOCK_MSG()); return; }
  showIntro(t);
}
/* Hộp “thông tin bài học”: số chặng · trạng thái · 3 mức sao · 2 lối vào Lý thuyết / Bài tập */
function showIntro(t, level, assignmentId) {
  const grade = assignmentId ? t.lop[0] : S.grade;
  const ts = tstat(t.id), num = String(gradeTopics(grade).indexOf(t) + 1).padStart(2, '0');
  level = level && tierOpen(ts, level) ? level : suggestTier(ts);
  const g = Number(grade), n = buildLesson(t, level, grade).length, tier = TIERS[level];
  const status = ts.attempts ? 'Đã đạt ' + ts.stars + '★ · tốt nhất ' + ts.best + '%' : 'Chưa làm bài';
  const body = '<div class="lp-head" style="--c:' + t.mau + '"><span class="lp-num">' + num + '</span><div class="lp-title"><small>LỚP ' + esc(grade) + ' · ' + esc(t.nhom.toUpperCase()) + '</small><h3>' + t.bieuTuong + ' ' + esc(t.ten) + '</h3></div>' + starsHtml(ts.stars) + '</div>' +
    '<div class="lp-status ' + (ts.attempts ? 'has' : '') + '"><b>' + status + '</b><span>' + (ts.theory ? '📖 Em đã đọc lý thuyết bài này.' : 'Đọc lý thuyết trước, rồi làm bài tập để nhận sao.') + '</span></div>' +
    '<div class="field-label">Chọn mức</div><div class="lp-tiers" role="group" aria-label="Chọn mức">' + Object.keys(TIERS).map(k => {
      const open = tierOpen(ts, k), got = ts.stars >= TIERS[k].stars;
      return '<button class="lp-tier ' + (k === level ? 'is-chosen ' : '') + (open ? '' : 'locked ') + (got ? 'got' : '') + '" data-level="' + k + '" aria-pressed="' + (k === level) + '"' + (open ? '' : ' aria-disabled="true"') + '><b>' + TIERS[k].name + '</b><span class="lp-stars">' + '★'.repeat(TIERS[k].stars) + '☆'.repeat(3 - TIERS[k].stars) + '</span><small>' + (got ? '✓ Đã qua' : open ? 'Đang mở' : '🗝️ Qua mức trước') + '</small></button>';
    }).join('') + '</div>' +
    '<p class="lp-desc"><b>Mức ' + tier.name + ':</b> ' + tier.desc + '</p>' +
    '<div class="lp-enter"><button class="lp-btn theory" id="openTheory"><span aria-hidden="true">📖</span><b>Lý thuyết</b><small>Mẹo, ví dụ, lỗi thường gặp</small></button>' +
    '<button class="lp-btn practice" id="beginQuiz"><span aria-hidden="true">✏️</span><b>Bài tập</b><small>' + n + ' câu · mức ' + tier.name + (g >= 2 ? '' : ' · có nghe rồi chọn') + '</small></button></div>';
  openModal('Bài ' + num + ' · ' + esc(t.ten), (assignmentId ? 'Bài thầy cô giao' : gardenName(grade)) + ' · Lớp ' + esc(grade), body);
  $$('[data-level]').forEach(b => b.onclick = () => {
    const k = b.dataset.level;
    if (!tierOpen(ts, k)) { sfx('bad'); toast('Qua mức ' + (k === 'kho' ? 'Vừa' : 'Dễ') + ' trước để mở mức ' + TIERS[k].name + ' nhé! 🗝️'); return; }
    sfx('tap'); showIntro(t, k, assignmentId);
  });
  $('#openTheory').onclick = () => { if (typeof openTheory === 'function') openTheory(t.id, level, assignmentId); };
  $('#beginQuiz').onclick = e => beginLesson(e.currentTarget, t, level, assignmentId);
  $('#beginQuiz').focus();
}
async function beginLesson(button, topic, level, assignmentId) {
  button.disabled = true;
  if (window.NoiDung) await NoiDung.refresh();
  if (!button.isConnected) return;
  button.disabled = false;
  if (assignmentId && !NoiDung.tasks().some(a => a.id === assignmentId)) {
    closeModal();
    toast('Thầy cô đã thu hồi bài này.');
    return;
  }
  const grade = assignmentId ? topic.lop[0] : S.grade;
  startQuiz({ kind: 'lesson', title: topic.ten, icon: topic.bieuTuong, topicId: topic.id, assignmentId, lessonGrade: grade, level, hints: TIERS[level].hints, items: buildLesson(topic, level, grade) });
}
function startSkipTest() {
  const topics = myTopics();
  openModal('🚀 Làm bài vượt cấp', gardenName() + ' · 12 câu', '<div class="speed-intro"><div class="big-emoji">🚀</div><h3>Kiểm tra kiến thức Lớp ' + esc(S.grade) + '</h3>' +
    '<p>12 câu trộn từ <b>' + topics.length + ' bài</b> của ' + gardenName() + ', không có gợi ý. Đúng từ <b>80%</b> thì <b>mở khoá tất cả các bài</b> để em chọn học tự do (sao của từng bài vẫn phải tự giành nhé!).</p>' +
    '<button class="primary-btn big" id="goSkip">Bắt đầu 🚀</button></div>');
  $('#goSkip').onclick = () => startQuiz({ kind: 'skip', title: 'Vượt cấp ' + gardenName(), icon: '🚀', items: mixedItems(topics, 12) });
  $('#goSkip').focus();
}
/* ---- Dạng câu sinh tự động từ ngân hàng (không cần soạn thêm) ---- */
function blankToken(it) { // phần chữ quanh chỗ trống: "___iến" → { pre: '', post: 'iến' }
  const tok = it.de.split(' ').find(w => w.includes('___')) || '___';
  const parts = tok.replace(/[.,!?:;"“”]/g, '').split('___');
  return { pre: parts[0] || '', post: parts[1] || '' };
}
function wrongWords(it) { const b = blankToken(it); return it.luaChon.filter(o => o !== it.dapAn).map(o => b.pre + o + b.post); }
function canGhep(it) { if (it.loai !== 'chon' || !it.de.includes('___')) return false; const w = itemWord(it); return !/\s/.test(w) && [...w].length >= 2 && [...w].length <= 8; }
function canNgheChon(it) { return it.loai === 'chon' && it.de.includes('___') && !/\s/.test(itemWord(it)); }
function makeDungSai(it) {
  const truth = Math.random() < 0.5, wrongs = it.luaChon.filter(o => o !== it.dapAn), opt = truth ? it.dapAn : pick(wrongs);
  return { loai: 'dungSai', _t: it._t, _i: it._i, cau: it.de.includes('___') ? it.de.replace('___', opt) : opt, dung: truth, dapAnCau: fullSentence(it) };
}
function makeGhep(it) {
  const word = itemWord(it), b = blankToken(it);
  let units, extra;
  if (word !== it.dapAn && it.dapAn.length <= 4 && b.pre + it.dapAn + b.post === word) { // giữ cụm “gh”, “ngh”, “uông”… thành một thẻ
    units = [...b.pre].concat([it.dapAn], [...b.post]);
    extra = it.luaChon.filter(o => o !== it.dapAn);
  } else {
    units = [...word];
    const low = [...word.toLowerCase()];
    extra = [...new Set(it.luaChon.filter(o => o !== it.dapAn).flatMap(o => [...o.toLowerCase()]).filter(ch => ch.trim() && !low.includes(ch)))].slice(0, 2);
  }
  const tiles = shuffle(units.concat(extra).map((u, k) => ({ id: k, u })));
  return { loai: 'ghepChu', _t: it._t, _i: it._i, word, units, tiles, goiY: fullSentence(it).replace(word, '…'), say: fullSentence(it) };
}
function makeNgheChon(it) {
  const word = itemWord(it);
  return { loai: 'ngheChon', _t: it._t, _i: it._i, word, opts: shuffle([word].concat(wrongWords(it))), goiY: it.de, say: fullSentence(it) };
}
function vary(it) { // trộn dạng câu cho phong phú
  if (it.loai !== 'chon') return it;
  const r = Math.random();
  if (r < 0.24) return makeDungSai(it);
  if (r < 0.48 && canGhep(it)) return makeGhep(it);
  if (r < 0.62 && Number(S.grade) < 2 && canNgheChon(it)) return makeNgheChon(it);
  return (typeof varyMore === 'function' && varyMore(it)) || it;
}
/* Câu sinh tự động (data/sinh-cau.js): mỗi lần lấy ra là một bản mới – tên bạn nhỏ, người thân, số đếm đổi ngẫu nhiên */
function genItems(t, filter, variants = 1) {
  const out = [];
  for (let v = 0; v < variants; v++) out.push(...(t.sinh || []).map((b, k) => Object.assign({}, b, { _t: t.id, _i: 'g' + k })));
  return out.filter(b => !filter || filter(b));
}
function questionFingerprint(it) {
  let text = '';
  if (it?.loai === 'classQuestion') text = it.type === 'fill' ? String(it.prompt || '').replace('___', it.answer || '') : String(it.prompt || '') + ' ' + String(it.answer || '');
  else if (it?.dapAnCau) text = it.dapAnCau;
  else if (it?.loai === 'timLoi' || it?.loai === 'suaLoi') text = String(it.cau || '').replace(it.tuSai, it.tuDung);
  else if (it?.loai === 'chonCau') text = it.good;
  else if (it?.loai === 'phanLoai') text = (it.baskets || []).join('|') + '|' + (it.words || []).map(row => row.w + '=' + row.b).sort().join('|');
  else if (it?.loai === 'noiTu') text = (it.pairs || []).map(pair => pair.join(' ')).sort().join('|');
  else if (it?.loai === 'sapXep') text = (it.words || []).join(' ');
  else if (it?.loai === 'chonNhieu') text = (it.chips || []).map(row => row.w + '=' + row.ok).sort().join('|');
  else if (it?.say) text = it.say;
  else if (it?.loai === 'ngheViet') text = it.cau;
  else if (it?.loai === 'nhinTranh') text = it.word;
  else if (typeof it?.de === 'string') text = it.de.includes('___') ? it.de.replace('___', it.dapAn || '') : it.de;
  else if (it?.loai === 'phanLoai' || it?.loai === 'noiTu' || it?.loai === 'sapXep' || it?.loai === 'chonNhieu') text = JSON.stringify(it);
  else text = it?.word || it?.cau || it?.dapAn || it?.prompt || JSON.stringify(it || {});
  text = String(text).normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
  let a = 2166136261, b = 5381;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b ^ c, 33); }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
}
function freshQuestionPick(items, count, options = {}) {
  const history = Array.isArray(S.seenQuestions) ? S.seenQuestions : [];
  const seenAt = new Map(history.map((key, index) => [key, index]));
  const excluded = options.excludeKeys || new Set(), unique = new Map();
  shuffle(items).forEach(item => {
    const key = questionFingerprint(item);
    if (excluded.has(key) || unique.has(key)) return;
    unique.set(key, { key, item });
  });
  const rows = [...unique.values()], fresh = rows.filter(row => !seenAt.has(row.key));
  const previous = options.allowSeen === false ? [] : rows.filter(row => seenAt.has(row.key)).sort((x, y) => seenAt.get(x.key) - seenAt.get(y.key));
  return fresh.concat(previous).slice(0, Math.max(0, count)).map(row => row.item);
}
function rememberSeenQuestion(item) {
  const key = questionFingerprint(item), rows = Array.isArray(S.seenQuestions) ? S.seenQuestions : [];
  S.seenQuestions = rows.filter(old => old !== key);
  S.seenQuestions.push(key);
  if (S.seenQuestions.length > 2400) S.seenQuestions = S.seenQuestions.slice(-2400);
}
function mixedItems(topics, n) {
  const pool = [];
  topics.forEach(t => { t.baiTap.forEach((b, i) => { if (b.loai !== 'ngheViet') pool.push(Object.assign({}, b, { _t: t.id, _i: i })); }); pool.push(...genItems(t, undefined, 2)); });
  return freshQuestionPick(pool, n).map(vary);
}
function buildLesson(t, level, grade = S.grade) {
  const items = t.baiTap.map((b, i) => Object.assign({}, b, { _t: t.id, _i: i }));
  const choicePool = shuffle(items.filter(b => b.loai === 'chon').concat(genItems(t, b => b.loai === 'chon', 2)));
  const errorPool = shuffle(items.filter(b => b.loai === 'timLoi').concat(genItems(t, b => b.loai === 'timLoi', 2)));
  const nghePool = shuffle(items.filter(b => b.loai === 'ngheViet'));
  const used = new Set(), take = (pool, n) => {
    const selected = freshQuestionPick(pool, n, { excludeKeys: used });
    selected.forEach(item => used.add(questionFingerprint(item)));
    return selected;
  };
  const takeChoice = (n, predicate = () => true) => take(choicePool.filter(item => predicate(item) && !used.has(questionFingerprint(item))), n);
  const g = Number(grade), baseChoiceCount = items.filter(b => b.loai === 'chon').length, baseErrorCount = items.filter(b => b.loai === 'timLoi').length;
  const ds = n => takeChoice(n).map(makeDungSai);
  const gh = n => takeChoice(n, canGhep).map(makeGhep);
  const loi = n => take(errorPool, n);
  const listen = n => g >= 2 ? take(nghePool, n) : takeChoice(n, canNgheChon).map(makeNgheChon);
  let list;
  if (level === 'de') list = [].concat(ds(1), takeChoice(3), gh(1), loi(1), g < 2 ? listen(1) : []);
  else if (level === 'kho') list = [].concat(ds(2), takeChoice(baseChoiceCount), gh(2), loi(baseErrorCount), listen(g >= 2 ? nghePool.length : 2));
  else list = [].concat(ds(1), takeChoice(4), gh(1), loi(2), listen(1));
  const extended = typeof extendLesson === 'function' ? extendLesson(list.filter(Boolean), t, level) : list.filter(Boolean);
  const seen = new Set();
  return extended.filter(item => { const key = questionFingerprint(item); if (seen.has(key)) return false; seen.add(key); return true; });
}

/* ============================== NHIỆM VỤ HÔM NAY ============================== */
const MISSIONS = [
  { k: 'lessons', n: 1, icon: '📘', text: 'Hoàn thành 1 bài học' },
  { k: 'correct', n: 10, icon: '✅', text: 'Trả lời đúng 10 câu' },
  { k: 'games', n: 1, icon: '🎮', text: 'Chơi 1 trò chơi hoặc thử thách' }
];
function mission() {
  if (!S.mission || S.mission.day !== dayKey()) S.mission = { day: dayKey(), lessons: 0, correct: 0, games: 0, claimed: false };
  return S.mission;
}
function missionCard() {
  const m = mission(), all = MISSIONS.every(x => m[x.k] >= x.n);
  return '<div class="mission-card">' + MISSIONS.map(x => { const v = Math.min(m[x.k], x.n), ok = v >= x.n;
    return '<div class="mission-row ' + (ok ? 'done' : '') + '"><span class="mission-icon">' + (ok ? '✅' : x.icon) + '</span><div class="mission-main"><b>' + x.text + '</b><div class="mission-bar"><span style="width:' + pct(v, x.n) + '%"></span></div></div><small>' + v + '/' + x.n + '</small></div>'; }).join('') +
    (m.claimed ? '<div class="unlock-note">🧺 Em đã nhận quà hôm nay. Mai mình gặp lại nhé!</div>'
      : '<button class="primary-btn gift-btn" data-action="claimMission" ' + (all ? '' : 'disabled') + '>' + (all ? '🎁 Nhận giỏ quà hôm nay' : '🎁 Xong 3 nhiệm vụ để nhận quà') + '</button>') + '</div>';
}

/* ============================== MÀN LÀM BÀI (TOÀN MÀN HÌNH) ============================== */
const KIND_LABEL = { skip: 'LÀM BÀI VƯỢT CẤP', placement: 'KIỂM TRA TRÌNH ĐỘ', lesson: 'BÀI HỌC', challenge: 'THỬ THÁCH', boss: 'CÂY CHỮ THẦN', daily: 'THỬ THÁCH NGÀY', review: 'ÔN TỪ HAY NHẦM', hunt: 'THÁM TỬ SĂN LỖI', dictation: 'NGHE – VIẾT', speed: 'NHANH TAY', quick: 'LUYỆN NHANH', adaptive: 'NHIỆM VỤ CỦA RIÊNG EM', storybook: 'TRUYỆN TƯƠNG TÁC' };
const EXTRA_RENDER = {}; // dạng bài thêm (dang-bai.js)
const TYPE_TAG = { chon: 'CHỌN CHỮ ĐÚNG', timLoi: 'TÌM CHỮ VIẾT SAI', ngheViet: 'NGHE – VIẾT', dungSai: 'ĐÚNG HAY SAI?', ghepChu: 'GHÉP CHỮ', ngheChon: 'NGHE RỒI CHỌN' };
let Q = null, qTimer = null;
function startQuiz(opts) {
  if (!opts.items.length) { toast('Chưa có câu nào ở đây, em học bài mới nhé!'); return; }
  clearInterval(qTimer);
  Q = Object.assign({ i: 0, correct: 0, answered: false, startedAt: Date.now(), lives: null, log: [],
    hints: ['speed', 'placement', 'challenge', 'boss', 'skip'].includes(opts.kind) ? 0 : 2 }, opts);
  Q.items = Q.items.map(it => Object.assign({}, it));
  if (Q.kind === 'adaptive') {
    Q.adventure = window.QuestJourney?.character(Q.adventure).id || 'rabbit';
    if (Q.adventure === 'rabbit') Q.race = window.ChaseRun?.createRace();
    else Q.journey = QuestJourney.create(Q);
  }
  if (Q.kind === 'speed') Q.usedQuestionKeys = new Set(Q.items.map(questionFingerprint));
  if (Q.lives != null) Q.maxLives = Q.lives;
  if (Q.timeLimit) { Q.endAt = Date.now() + Q.timeLimit * 1000; startTimer(); }
  renderItem();
}
function startTimer() {
  qTimer = setInterval(() => {
    if (!Q || !Q.endAt) { clearInterval(qTimer); return; }
    const left = Math.max(0, Math.ceil((Q.endAt - Date.now()) / 1000));
    const el = $('#plTime'); if (el) { el.textContent = '⏱ ' + left + 's'; el.classList.toggle('low', left <= 10); }
    if (left <= 0) {
      clearInterval(qTimer); Q.timeUp = true;
      if (Q.kind === 'speed') Q.items = Q.items.slice(0, Q.i + (Q.answered ? 1 : 0));
      finishQuiz();
    }
  }, 250);
}
function comboText() { return S.combo >= 3 ? '🔥 ' + S.combo + ' câu đúng liền!' : ''; }
function livesHtml() {
  if (Q.lives == null) return '<div class="pl-score" aria-label="Số câu đúng">⭐ ' + Q.correct + '</div>';
  let s = ''; for (let k = 0; k < Q.maxLives; k++) s += '<span class="' + (k < Q.lives ? 'on' : '') + '">💧</span>';
  return '<div class="pl-lives" id="plLives" aria-label="Còn ' + Q.lives + ' giọt nước">' + s + '</div>';
}
function playerShell(inner, it) {
  const total = Q.items.length, t = getTopic(it._t), speed = Q.kind === 'speed';
  const storyFrame = Q.kind === 'storybook' && typeof StoryQuest !== 'undefined' ? StoryQuest.playerFrame(Q) : '';
  const adventureFrame = Q.race ? ChaseRun.playerFrame(Q) : Q.journey ? QuestJourney.playerFrame(Q) : '';
  return '<div class="player" style="--c:' + (t ? t.mau : '#64b281') + '">' +
    '<div class="pl-top"><button class="pl-x" data-close-modal aria-label="Thoát bài">✕</button>' +
    '<div class="pl-bar" role="progressbar" aria-label="Tiến độ" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + Q.i + '"><span style="width:' + (speed ? 100 : pct(Q.i, total)) + '%"></span><b>' + (speed ? Q.correct + ' điểm' : (Q.i + 1) + ' / ' + total) + '</b></div>' +
    (Q.endAt ? '<div class="pl-time" id="plTime">⏱ ' + Math.max(0, Math.ceil((Q.endAt - Date.now()) / 1000)) + 's</div>' : '') + livesHtml() + '</div>' +
    '<div class="pl-banner"><span class="pl-banner-icon">' + (Q.icon || (t ? t.bieuTuong : '📘')) + '</span><div class="pl-banner-text"><small>' + (KIND_LABEL[Q.kind] || 'LUYỆN TẬP') + '</small><b>' + esc(Q.title) + '</b></div><span class="combo" id="combo">' + comboText() + '</span></div>' +
    storyFrame + adventureFrame + '<div class="pl-card" id="plCard"><div class="pl-tag-row"><span class="pl-tag">' + TYPE_TAG[it.loai] + '</span>' + (t && Q.kind !== 'lesson' ? '<span class="pl-topic">' + t.bieuTuong + ' ' + esc(t.ten) + '</span>' : '') +
    (canHint(it) ? '<button class="pl-hint-btn" id="plHint" aria-label="Dùng gợi ý, còn ' + Q.hints + ' lần">💡 Gợi ý <b>' + Q.hints + '</b></button>' : '') + '</div>' + inner + '</div>' +
    '<div class="pl-foot" id="plFoot"><button class="pl-check" id="plCheck" disabled>Kiểm tra</button></div>' +
    '<div class="pl-sheet" id="plSheet" hidden role="status" aria-live="polite"></div></div>';
}
function openPlayer(html) {
  const root = $('#modalRoot');
  if (Q?.kind === 'adaptive' && window.QuestCinema?.refresh(root, html, Q)) {
    root.scrollTop = 0;
    return;
  }
  root.className = 'modal-root player-mode'; root.innerHTML = html; root.hidden = false; root.onclick = null; root.scrollTop = 0;
  document.body.classList.add('modal-open'); $('.app-shell').inert = true;
  if (Q?.kind === 'adaptive') window.QuestCinema?.mount(root, Q);
}
function renderItem() {
  if (!Q) return;
  if (Q.i >= Q.items.length) { finishQuiz(); return; }
  stopSpeak();
  Q.answered = false; Q.evaluate = null;
  const it = Q.items[Q.i];
  if (it.loai === 'classQuestion') ClassPractice.show(it);
  else (EXTRA_RENDER[it.loai] || { chon: renderChon, timLoi: renderLoi, ngheViet: renderNghe, dungSai: renderDungSai, ghepChu: renderGhep, ngheChon: renderNgheChon }[it.loai] || renderChon)(it);
  $('#plCheck').onclick = doCheck;
  const hb = $('#plHint'); if (hb) hb.onclick = () => useHint(it);
}
function setReady(fn) { if (!Q || Q.answered) return; Q.evaluate = fn; const b = $('#plCheck'); if (b) b.disabled = !fn; }
/* Gợi ý: loại 1 đáp án sai nếu còn ≥ 2 đáp án sai; nếu không thì gợi ý bằng lời (chữ đầu, vị trí chữ sai, mẹo). */
function canHint(it) { return Q.hints > 0 && ['chon', 'ngheChon', 'dungSai', 'ghepChu', 'timLoi', 'ngheViet'].includes(it.loai); }
function useHint(it) {
  if (!Q || Q.answered || Q.hints <= 0) return;
  Q.hints--; sfx('tap');
  const key = it.loai === 'chon' ? it.dapAn : it.loai === 'ngheChon' ? it.word : null;
  const wrong = key == null ? [] : $$('[data-answer]').filter(b => b.dataset.answer !== key && !b.disabled);
  let msg = '';
  if (Q.kind === 'storybook' && it.giaiThich) {
    msg = esc(it.giaiThich);
  } else if (wrong.length >= 2) {
    const b = pick(wrong);
    if (b.classList.contains('is-sel')) { setReady(null); const bl = $('#blank'); if (bl) bl.textContent = '?'; }
    b.disabled = true; b.classList.remove('is-sel'); b.classList.add('removed');
    msg = 'Đã bỏ bớt một đáp án sai. Em chọn trong các đáp án còn lại nhé!';
  } else if (it.loai === 'ghepChu') {
    msg = 'Thẻ đầu tiên là “<b>' + esc(it.units[0]) + '</b>”.';
  } else if (it.loai === 'timLoi') {
    const words = it.cau.split(' '), k = words.findIndex(w => cleanWord(w) === it.tuSai);
    msg = 'Chữ viết sai nằm ở <b>' + (k < words.length / 2 ? 'nửa đầu' : 'nửa sau') + '</b> câu.';
  } else if (it.loai === 'ngheViet') {
    msg = 'Câu có <b>' + it.cau.split(' ').length + '</b> chữ. Nghe chậm 🐢 từng chữ rồi gõ nhé.';
  }
  const t = getTopic(it._t);
  const box = $('#plHintBox') || (() => { const d = document.createElement('div'); d.id = 'plHintBox'; d.className = 'pl-hint-box'; $('.pl-tag-row').after(d); return d; })();
  box.innerHTML = '💡 ' + (msg || (t ? md(t.quyTac[0]) : 'Đọc chậm cả câu nhé!'));
  const hb = $('#plHint');
  if (hb) { if (Q.hints > 0) hb.innerHTML = '💡 Gợi ý <b>' + Q.hints + '</b>'; else hb.remove(); }
}
function doCheck() {
  if (!Q || Q.answered || !Q.evaluate) return;
  stopSpeak();
  const it = Q.items[Q.i];
  Q.answered = true;
  const res = Q.evaluate();
  Q.log.push({ lv: it._lv, right: res.right });
  record(it, res.right);
  if (Q.race) ChaseRun.answer(Q, res.right);
  if (Q.journey) QuestJourney.answer(Q, res.right);
  if (Q.race || Q.journey) window.QuestCinema?.answer(Q, res.right);
  if (Q.kind === 'storybook') res.storyPraise = StoryQuest.react(Q, res.right);
  if (Q.lives != null && !res.right) {
    Q.lives = Math.max(0, Q.lives - 1);
    const l = $('#plLives'); if (l) l.outerHTML = livesHtml();
  }
  const sc = $('.pl-score'); if (sc) sc.textContent = '⭐ ' + Q.correct;
  if (!res.right) { const c = $('#plCard'); if (c) c.classList.add('shake'); }
  if (Q.kind === 'speed') { speedAfter(res.right); return; }
  showSheet(res);
}
function showSheet(res) {
  const sh = $('#plSheet'), caught = Q.race?.caught;
  const story = Q.kind === 'storybook';
  let revealDelay = 0;
  if (caught) revealDelay = ChaseRun.catchDelay;
  else if (Q.race?.escaped) revealDelay = ChaseRun.escapeDelay;
  else if (Q.journey?.justWon) revealDelay = Q.journey.mode.duration;
  else if (story && res.right) revealDelay = StoryQuest.passDelay(Q);
  const last = Q.i + 1 >= Q.items.length || (Q.lives != null && Q.lives <= 0);
  const praise = res.storyPraise || (res.right ? pick(PRAISE) : pick(ENCOURAGE));
  const nextLabel = story ? (res.right ? (last ? 'Nhận bảo vật' : 'Đi qua chốt →') : 'Thử lại ở chốt này')
    : caught || (Q.lives != null && Q.lives <= 0) ? 'Xem kết quả' : last ? 'Xem kết quả 🎉' : 'Tiếp tục';
  sh.className = 'pl-sheet ' + (res.right ? 'good' : 'bad');
  sh.innerHTML = '<div class="pl-sheet-in"><div class="pl-sheet-head"><span class="pl-sheet-icon">' + (res.right ? '✓' : '✕') + '</span><b>' + esc(praise) + '</b>' + (res.right && Q.kind !== 'placement' ? '<span class="pl-gain">+10 XP</span>' : '') + '<span class="fb-mascot" aria-hidden="true">' + (res.right ? '🥳' : '🤗') + '</span></div>' +
    (res.html ? '<div class="pl-sheet-body">' + res.html + '</div>' : '') +
    '<button class="pl-cont" id="plCont">' + nextLabel + '</button></div>';
  sh.hidden = false; $('#plFoot').hidden = true;
  const cont = $('#plCont');
  cont.onclick = nextItem;
  if (revealDelay) {
    $('#modalRoot').scrollTop = 0;
    if (window.QuestCinema?.reduced() || matchMedia('(prefers-reduced-motion: reduce)').matches) cont.focus({ preventScroll: true });
    else {
      cont.dataset.chaseWait = '';
      cont.disabled = true;
      setTimeout(() => {
        cont.disabled = false;
        if (cont.isConnected && !$('#quitAsk')) cont.focus({ preventScroll: true });
      }, revealDelay);
    }
  } else if (story) {
    if (res.right) $('#modalRoot').scrollTop = 0;
    cont.focus({ preventScroll: true });
  } else cont.focus();
}
function nextItem() { if (!Q) return; if (Q.race?.caught || (Q.lives != null && Q.lives <= 0)) { finishQuiz(); return; } if (Q.kind === 'storybook' && Q.log.length && !Q.log[Q.log.length - 1].right) { renderItem(); return; } Q.i++; renderItem(); }
function ruleHint(it) {
  const hint = it.giaiThich || getTopic(it._t)?.quyTac?.[0];
  return hint ? '<div class="pl-hint">💡 ' + md(hint) + '</div>' : '';
}
function subtitle() { return Q.kind === 'lesson' ? LEVELS[Q.level] : (Q.subtitle || 'Luyện tập'); }
function optionsHtml(opts, attr) {
  return '<div class="answer-options ' + (opts.every(o => o.length <= 6) ? 'short' : '') + '">' + opts.map((o, k) => '<button class="answer-option" ' + attr + '="' + esc(o) + '"><span class="option-letter">' + (k + 1) + '</span><span class="opt-text">' + esc(o) + '</span></button>').join('') + '</div>';
}
function bindOptions(onPick) {
  $$('[data-answer]').forEach(b => b.onclick = () => {
    if (!Q || Q.answered) return;
    if (Q.kind === 'speed') { setReady(() => onPick(b.dataset.answer)); doCheck(); return; }
    sfx('tap'); $$('[data-answer]').forEach(x => x.classList.toggle('is-sel', x === b));
    const bl = $('#blank'); if (bl) bl.textContent = b.dataset.answer;
    setReady(() => onPick(b.dataset.answer));
  });
}
function markOptions(correct, chosen) {
  $$('[data-answer]').forEach(b => { b.disabled = true; b.classList.remove('is-sel'); if (b.dataset.answer === correct) b.classList.add('correct'); else if (b.dataset.answer === chosen) b.classList.add('incorrect'); });
}

/* ---- Chọn chữ đúng ---- */
function renderChon(it) {
  it._opts = it._opts || shuffle(it.luaChon);
  const prompt = it.de.includes('___') ? esc(it.de).replace('___', '<span class="blank" id="blank">?</span>') : esc(it.de);
  openPlayer(playerShell('<div class="q-line"><div class="question-prompt">' + prompt + '</div><button class="speak-btn" id="sayQ" aria-label="Nghe câu">🔊</button></div>' + optionsHtml(it._opts, 'data-answer'), it));
  $('#sayQ').onclick = () => speak(fullSentence(it));
  bindOptions(ans => {
    markOptions(it.dapAn, ans);
    const bl = $('#blank'); if (bl) { bl.textContent = it.dapAn; bl.classList.add('filled'); }
    const right = ans === it.dapAn;
    return { right, html: (right ? '' : 'Đáp án đúng: <b>' + esc(it.dapAn) + '</b>') + ruleHint(it), say: fullSentence(it) };
  });
}

/* ---- Đúng hay sai? ---- */
function renderDungSai(it) {
  openPlayer(playerShell('<div class="q-line"><div class="question-prompt">“' + esc(it.cau) + '”</div></div><p class="pl-ask">Câu trên viết <b>đúng chính tả</b> không?</p>' +
    '<div class="tf-options"><button class="tf-btn yes" data-tf="1"><span>✓</span>Đúng</button><button class="tf-btn no" data-tf="0"><span>✕</span>Sai</button></div>', it));
  $$('[data-tf]').forEach(b => b.onclick = () => {
    if (Q.answered) return; sfx('tap');
    $$('[data-tf]').forEach(x => x.classList.toggle('is-sel', x === b));
    setReady(() => {
      const said = b.dataset.tf === '1', right = said === it.dung;
      $$('[data-tf]').forEach(x => { x.disabled = true; x.classList.remove('is-sel'); if ((x.dataset.tf === '1') === it.dung) x.classList.add('correct'); else if (x === b) x.classList.add('incorrect'); });
      return { right, html: (it.dung ? 'Câu này viết đúng chính tả.' : 'Câu này viết <b>sai</b>. Viết đúng là: <b>' + esc(it.dapAnCau) + '</b>') + ruleHint(it), say: it.dapAnCau };
    });
  });
}

/* ---- Ghép chữ ---- */
function renderGhep(it) {
  const placed = [];
  openPlayer(playerShell('<p class="pl-ask">Chạm vào các thẻ chữ theo đúng thứ tự để ghép thành từ:</p>' +
    '<div class="q-line"><div class="question-prompt small">' + esc(it.goiY) + '</div><button class="speak-btn" id="sayQ" aria-label="Nghe câu">🔊</button></div>' +
    '<div class="ghep-slots" id="slots">' + it.units.map((_, k) => '<button class="slot" data-slot="' + k + '" aria-label="Ô chữ ' + (k + 1) + '"></button>').join('') + '</div>' +
    '<div class="ghep-tiles">' + it.tiles.map(t => '<button class="tile" data-tile="' + t.id + '">' + esc(t.u) + '</button>').join('') + '</div>' +
    '<div class="ghep-tools"><button class="text-link" id="ghepClear">↺ Xếp lại</button></div>', it));
  const byId = {}; it.tiles.forEach(t => { byId[t.id] = t; });
  const draw = () => {
    $$('[data-slot]').forEach((s, k) => { const id = placed[k]; s.textContent = id == null ? '' : byId[id].u; s.classList.toggle('filled', id != null); });
    $$('[data-tile]').forEach(b => b.classList.toggle('used', placed.includes(Number(b.dataset.tile))));
    setReady(placed.length === it.units.length ? evaluate : null);
  };
  const evaluate = () => {
    const built = placed.map(id => byId[id].u).join(''), right = built === it.word;
    $('#slots').classList.add(right ? 'good' : 'bad');
    $$('[data-tile], [data-slot], #ghepClear').forEach(b => { b.disabled = true; });
    return { right, html: (right ? 'Em ghép đúng: <b>' + esc(it.word) + '</b>' : 'Em ghép “' + esc(built) + '”. Từ đúng là: <b>' + esc(it.word) + '</b>') + ruleHint(it), say: it.say };
  };
  $$('[data-tile]').forEach(b => b.onclick = () => { if (Q.answered) return; const id = Number(b.dataset.tile); if (placed.includes(id) || placed.length >= it.units.length) return; sfx('tap'); placed.push(id); draw(); });
  $$('[data-slot]').forEach(s => s.onclick = () => { if (Q.answered) return; const k = Number(s.dataset.slot); if (placed[k] == null) return; placed.splice(k, 1); draw(); });
  $('#ghepClear').onclick = () => { if (Q.answered) return; placed.length = 0; draw(); };
  $('#sayQ').onclick = () => speak(it.say);
}

/* ---- Nghe rồi chọn (lớp 1 chưa cần gõ phím) ---- */
function renderNgheChon(it) {
  openPlayer(playerShell('<div class="listen-row"><button class="sound-button" id="play" aria-label="Nghe">🔊</button><button class="sound-button slow" id="slow" aria-label="Nghe chậm">🐢</button></div>' +
    '<p class="pl-ask center">Nghe rồi chọn từ <b>viết đúng</b>:</p>' +
    (viVoice ? '' : '<div class="note-callout">Máy chưa có giọng đọc tiếng Việt. Gợi ý: ' + esc(it.goiY).replace('___', '…') + '</div>') +
    optionsHtml(it.opts, 'data-answer'), it));
  const say = r => speak(it.word + '. ' + it.say, r);
  $('#play').onclick = () => say(0.8); $('#slow').onclick = () => say(0.55);
  bindOptions(ans => { markOptions(it.word, ans); const right = ans === it.word; return { right, html: (right ? '' : 'Từ đúng là: <b>' + esc(it.word) + '</b>') + ruleHint(it), say: it.say }; });
  setTimeout(() => { if (Q && Q.items[Q.i] === it && !Q.answered) say(0.8); }, 400);
}

/* ---- Tìm chữ viết sai ---- */
function cleanWord(w) { return w.replace(/[.,!?;:"“”()…]/g, ''); }
function renderLoi(it) {
  const words = it.cau.split(' ');
  const story = Q.kind === 'storybook';
  const instruction = story ? 'Chạm vào <b>một chữ viết sai</b> trong đoạn.' : 'Chạm vào <b>chữ viết sai</b> trong câu, rồi bấm Kiểm tra:';
  openPlayer(playerShell('<p class="pl-ask">🔎 ' + instruction + '</p><div class="word-sentence' + (story ? ' forest-reading' : '') + '">' +
    words.map((w, k) => '<button class="word-token" data-tok="' + k + '">' + esc(w) + '</button>').join('') + '</div>', it));
  $$('[data-tok]').forEach(b => b.onclick = () => {
    if (Q.answered) return; sfx('tap');
    $$('[data-tok]').forEach(x => x.classList.toggle('is-sel', x === b));
    const k = Number(b.dataset.tok);
    setReady(() => {
      const right = cleanWord(words[k]) === it.tuSai;
      $$('[data-tok]').forEach(x => { x.disabled = true; x.classList.remove('is-sel'); });
      if (story && !right) { b.classList.add('incorrect'); return { right, html: ruleHint(it) }; }
      const target = $$('[data-tok]').find(x => cleanWord(words[Number(x.dataset.tok)]) === it.tuSai);
      if (target) { const w = words[Number(target.dataset.tok)]; target.innerHTML = '<s>' + esc(it.tuSai) + '</s> ' + esc(w.replace(it.tuSai, it.tuDung)); target.classList.add('found'); }
      if (!right) b.classList.add('incorrect');
      if (right) S.hunted++;
      return { right, html: 'Chữ <b>' + esc(it.tuSai) + '</b> phải viết là <b>' + esc(it.tuDung) + '</b>.' + ruleHint(it), say: it.cau.replace(it.tuSai, it.tuDung) };
    });
  });
}

/* ---- Nghe – viết ---- */
function normWords(s, keepCase) {
  s = s.normalize('NFC').replace(/[.,!?;:"“”()…–-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!keepCase) s = s.toLocaleLowerCase('vi');
  return s ? s.split(' ') : [];
}
function matchWords(target, typed) { // LCS: đánh dấu chữ nào trong câu mẫu đã viết đúng
  const n = target.length, m = typed.length, dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = target[i] === typed[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array(n).fill(false); let i = 0, j = 0;
  while (i < n && j < m) { if (target[i] === typed[j]) { ok[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return ok;
}
function renderNghe(it) {
  openPlayer(playerShell('<div class="dictation-card"><div class="listen-row"><button class="sound-button" id="play" aria-label="Nghe câu">🔊</button><button class="sound-button slow" id="slow" aria-label="Nghe chậm">🐢</button></div>' +
    '<div class="dictation-hint">Bấm 🔊 để nghe, 🐢 để nghe chậm. Nghe bao nhiêu lần cũng được!</div>' +
    (viVoice ? '' : '<div class="note-callout">Máy này có thể chưa có giọng đọc tiếng Việt. Nhờ thầy cô hoặc bố mẹ bấm <b>👀 Xem câu</b> và đọc giúp em nhé.</div>') +
    '<div class="reveal" id="reveal" hidden>' + esc(it.cau) + '</div>' +
    '<textarea class="dictation-input" id="dictIn" rows="2" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Em gõ lại câu vừa nghe vào đây…" aria-label="Gõ lại câu vừa nghe"></textarea>' +
    '<div class="ghep-tools"><button class="text-link" id="peek">👀 Xem câu (dành cho người lớn)</button></div></div>', it));
  $('#play').onclick = () => speak(it.cau, 0.8);
  $('#slow').onclick = () => speak(it.cau, 0.55);
  $('#peek').onclick = () => { const r = $('#reveal'); r.hidden = !r.hidden; };
  $('#dictIn').oninput = e => setReady(e.target.value.trim() ? () => checkNghe(it) : null);
  setTimeout(() => { if (Q && Q.items[Q.i] === it && !Q.answered) speak(it.cau, 0.8); }, 350);
}
function checkNghe(it) {
  const typed = $('#dictIn').value, keepCase = it._t === 'viet-hoa';
  const tokens = it.cau.split(' ').map(w => ({ w, n: normWords(w, keepCase)[0] })).filter(x => x.n);
  const ok = matchWords(tokens.map(x => x.n), normWords(typed, keepCase));
  const right = ok.every(Boolean) && normWords(typed, keepCase).length === tokens.length;
  const wrongN = ok.filter(x => !x).length;
  $('#dictIn').disabled = true; $('#peek').hidden = true;
  if (right) S.dictCorrect++;
  return { right, html: (right ? 'Em viết đúng cả câu!' : (wrongN ? 'Có <b>' + wrongN + '</b> chữ cần sửa (tô đỏ):' : 'Em viết thừa chữ, so lại nhé:')) +
    '<div class="diff-line">' + tokens.map((x, k) => '<span class="' + (ok[k] ? 'w-ok' : 'w-bad') + '">' + esc(x.w) + '</span>').join(' ') + '</div>' };
}

/* ============================== GHI NHẬN KẾT QUẢ ============================== */
function record(it, right) {
  S.attempts++;
  if (right) { Q.correct++; S.correct++; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); mission().correct++; sfx('good'); }
  else { S.combo = 0; sfx('bad'); }
  const c = $('#combo'); if (c) c.textContent = comboText();
  const t = Q.kind === 'placement' ? null : getTopic(it._t); // kiểm tra trình độ không ghi sổ ôn
  if (t) {
    const ts = tstat(it._t); ts.attempts++; if (right) ts.correct++;
    const fixed = typeof it._i === 'number' && t.baiTap[it._i] ? t.baiTap[it._i]._k : undefined;
    const key = it._t + ':' + (fixed === undefined ? it._i : fixed);
    if (!right && it._i != null) { S.wrongLog[key] = (S.wrongLog[key] || 0) + 1; S.review[key] = { box: 0, at: Date.now() }; }
    else if (S.review[key] && S.review[key].at < Q.startedAt) { // chỉ tính khi ôn ở lượt sau
      S.review[key].box++; S.review[key].at = Date.now();
      if (S.review[key].box >= 2) { delete S.review[key]; S.reviewed++; const item = itemOf(key); if (item) toast('🎉 Em đã thuộc từ “' + itemWord(item) + '”!'); }
    }
  }
  rememberSeenQuestion(it);
  save();
}
function bumpDay() {
  const today = dayKey();
  S.bestStreak = Math.max(S.bestStreak || 0, S.streak);
  if (S.lastDay === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  S.streak = S.lastDay === dayKey(y) ? S.streak + 1 : 1; S.lastDay = today;
  S.bestStreak = Math.max(S.bestStreak, S.streak);
}
function saveHistory(kind, topic, title, correct, total, assignmentId, grade = S.grade) {
  S.history.unshift({ d: dayKey(), at: Date.now(), grade, kind, topic, title, correct, total, acc: pct(correct,total), ...(assignmentId ? { assignmentId } : {}) });
}
function finishQuiz() {
  clearInterval(qTimer);
  const q = Q; if (!q) return;
  stopSpeak();
  if (q.kind === 'placement') { finishPlacement(q); return; }
  const caught = q.race?.caught;
  const total = q.kind === 'speed' || caught ? q.log.length : q.items.length, acc = pct(q.correct, total);
  const failed = caught || (q.lives != null && q.lives <= 0) || (q.timeUp && q.kind !== 'speed');
  const storyWon = q.kind === 'storybook' && !failed && q.correct === total;
  const journeyResult = q.journey && QuestJourney.result(q.journey);
  const beforeStage = gardenStage(S.xp);
  let xp = q.correct * 10, starsNow = 0, flowers = 0, passed = false, upTier = null;
  const extra = [], tier = TIERS[q.level] || TIERS.vua;
  if (q.kind === 'lesson') {
    const ts = tstat(q.topicId), before = ts.stars;
    passed = acc >= tier.pass;
    starsNow = passed ? tier.stars : 0;
    if (passed && !ts.done) { xp += 20; extra.push('🔓 Em đã mở bài tiếp theo trên con đường!'); }
    if (passed) { ts.done = true; mission().lessons++; }
    const gained = Math.max(0, starsNow - before); xp += gained * 10; flowers += gained;
    ts.stars = Math.max(before, starsNow); ts.best = Math.max(ts.best, acc);
    if (passed && tier.stars < 3) { upTier = tier.stars === 1 ? 'vua' : 'kho'; if (gained) extra.push('⭐ Đã mở <b>mức ' + TIERS[upTier].name + '</b> của bài này!'); }
  } else if (total) mission().games++;
  if (q.kind === 'skip') {
    passed = acc >= 80;
    if (passed) { S.skip = S.skip || {}; if (!S.skip[S.grade]) { xp += 30; extra.push('🚀 Vượt cấp thành công! Mọi bài của ' + gardenName() + ' đã mở.'); } S.skip[S.grade] = true; }
  }
  if ((q.kind === 'challenge' || q.kind === 'boss') && !failed) {
    const prev = S.nodes[q.nodeId] || {};
    if (!prev.done) { flowers += q.kind === 'boss' ? 5 : 2; xp += q.kind === 'boss' ? 60 : 30; extra.push(q.kind === 'boss' ? '🌳 Cây Chữ Thần đã thức dậy! Em là người giữ ' + gardenName() + '!' : '⚡ Em vượt thử thách lần đầu!'); }
    S.nodes[q.nodeId] = { done: true, best: Math.max(acc, prev.best || 0) };
    if (q.kind === 'boss') S.bossWins++;
  }
  if (q.kind === 'daily' && !(S.daily.day === dayKey() && S.daily.done)) { xp += 20; S.daily = { day: dayKey(), done: true }; extra.push('🎯 Hoàn thành thử thách hôm nay: +20 XP'); }
  if (q.kind === 'adaptive' && q.race?.escaped) extra.push('🐇 Thỏ Lá đã chạy thoát khỏi sói!');
  if (q.kind === 'adaptive' && !failed && acc >= 60 && S.adaptiveDay !== dayKey()) { S.adaptiveDay = dayKey(); xp += 15; flowers += 1; extra.push('🕵️ Thám tử chữ hoàn thành nhiệm vụ đầu ngày: +15 XP'); }
  if (storyWon && StoryQuest.complete(q.storyId, true)) { xp += 25; flowers += 2; }
  if (q.kind === 'speed') { xp = q.correct * 5; if (q.correct > S.bestSpeed) { S.bestSpeed = q.correct; extra.push('🏆 Kỉ lục mới: ' + q.correct + ' điểm!'); } }
  if (failed && !caught) xp = Math.round(xp / 2);
  S.xp += xp; S.flowers += flowers;
  const prizes = total ? StreakRoom.award() : [];
  if (flowers) extra.push('🌸 +' + flowers + ' bông hoa cho khu vườn');
  if (total) saveHistory(q.kind, q.topicId || q.nodeId || q.storyId || '', q.title, q.correct, total,
    !failed && q.log.length === total ? q.assignmentId : undefined, q.lessonGrade);
  const award = typeof QuaTang === 'undefined' ? null : QuaTang.earn(S, {
    kind: q.kind, correct: q.correct, total, finished: !failed && (q.kind === 'storybook' ? q.correct >= total : q.log.length === total)
  });
  const fresh = checkBadges(); save();
  const afterStage = gardenStage(S.xp);
  const gated = q.kind === 'lesson' || q.kind === 'skip';
  const good = !failed && (q.journey ? q.journey.won : q.kind === 'speed' ? q.correct >= 5 : gated ? passed : acc >= 60);
  if (good) { sfx('win'); if (!award && !storyWon) confetti(); }
  const next = q.kind === 'lesson' && passed && !q.assignmentId ? nextTopic() : null;
  const head = q.kind === 'speed' ? (q.correct + ' điểm') : (q.correct + ' / ' + total + ' câu đúng');
  const title = journeyResult ? journeyResult.title : storyWon ? (StoryQuest.ending(q) || '📖 Em đã qua tất cả các chốt!') : caught ? '🐺 Sói đã bắt kịp Thỏ Lá!' : q.race?.escaped ? '🐇 Thỏ Lá đã thoát khỏi sói!' : failed ? (q.timeUp ? '⏰ Hết giờ rồi!' : '💧 Cây khát nước rồi!') : q.kind === 'speed' ? (good ? 'Nhanh quá!' : 'Lần sau sẽ nhanh hơn!')
    : q.kind === 'lesson' ? (passed ? (acc === 100 ? 'Tuyệt vời! Qua mức ' + tier.name + ' không sai câu nào!' : 'Qua màn mức ' + tier.name + '! 🎉') : 'Mình luyện thêm chút nữa nhé!')
    : q.kind === 'skip' ? (passed ? '🚀 Em đã vượt cấp!' : 'Chưa đủ để vượt cấp')
    : acc === 100 ? 'Tuyệt vời! Không sai câu nào!' : acc >= 60 ? 'Bài làm tốt lắm!' : 'Mình luyện thêm chút nữa nhé!';
  const msg = journeyResult ? journeyResult.message : storyWon ? 'Em đã tìm thấy bảo vật của chương này. Mình đi tiếp nhé!'
    : caught ? 'Lượt chạy dừng sau ' + q.race.mistakes + ' câu sai. Mình thử lại với câu hỏi mới để giúp Thỏ Lá chạy thoát nhé!'
    : q.race?.escaped ? 'Em trả lời đúng tất cả câu hỏi nên Thỏ Lá đã chạy thật nhanh tới nơi an toàn!'
    : q.kind === 'adaptive' && q.correct < total ? 'Sói đã tiến gần hơn một chút. Mình luyện tiếp để giúp Thỏ Lá chạy xa hơn nhé!'
    : failed ? 'Không sao cả! Em ôn lại một chút rồi thử lại nhé, giọt nước sẽ đầy lại.'
    : q.kind === 'lesson' && !passed ? 'Mức ' + tier.name + ' cần đúng từ ' + tier.pass + '%. Em đọc lại 📖 lý thuyết rồi thử lần nữa nhé!'
    : q.kind === 'skip' && !passed ? 'Cần đúng từ 80%. Không sao – em học lần lượt từng bài trên con đường nhé!'
    : 'Mỗi lần luyện là một lần em giỏi hơn.';
  const medal = q.kind === 'lesson' ? starsHtml(starsNow) : caught ? '🐾' : failed ? '🥀' : q.kind === 'boss' ? '🏆' : q.kind === 'skip' ? (passed ? '🚀' : '🌱') : good ? '🏅' : '🌱';
  const body = '<div class="lesson-complete"><div class="result-mascot" aria-hidden="true">' + S.avatar + '</div><div class="complete-medal">' + medal + '</div>' +
    '<h3>' + title + '</h3><p>' + msg + '</p>' +
    '<div class="score-pills"><span>✅ ' + head + '</span><span>⭐ +' + xp + ' XP</span>' + (q.kind !== 'speed' ? '<span>🎯 ' + acc + '%</span>' : '') + '</div>' +
    (storyWon ? StoryQuest.discovery(q.storyId) : '') +
    extra.map(x => '<div class="unlock-note">' + x + '</div>').join('') +
    StreakRoom.celebrate(prizes) +
    (afterStage !== beforeStage ? '<div class="unlock-note">' + afterStage.icon + ' Khu vườn của em đã lớn thành <b>' + afterStage.name + '</b>!</div>' : '') +
    fresh.map(b => '<div class="unlock-note badge-new">' + b.icon + ' Huy hiệu mới: <b>' + b.name + '</b></div>').join('') +
    '<div class="modal-actions center">' + (next ? '<button class="primary-btn big" id="goNext">Bài tiếp: ' + next.bieuTuong + ' ' + esc(next.ten) + ' →</button>' : '') +
    (storyWon ? StoryQuest.nextAction(q.storyId) : '') +
    (q.kind === 'adaptive' ? '<button class="soft-btn" id="changeAdventure">Đổi nhân vật</button>' : '') +
    (upTier ? '<button class="soft-btn big" id="upTier">Lên mức ' + TIERS[upTier].name + ' ' + '★'.repeat(TIERS[upTier].stars) + '</button>' : '') +
    (q.kind === 'boss' && !failed && typeof showCertificate === 'function' ? '<button class="primary-btn big" id="getCert">📜 Nhận giấy khen</button>' : '') +
    '<button class="soft-btn" id="again">↻ ' + (failed ? 'Thử lại' : 'Làm lại') + '</button><button class="soft-btn" id="toMap">🗺️ Con đường</button><button class="' + (next ? 'soft-btn' : 'primary-btn big') + '" id="home">Về trang học</button></div></div>';
  openModal('Kết quả của em', head, body, 'result');
  Q = null;
  if (storyWon) $('#storyNext').onclick = () => StoryQuest.follow(q.storyId);
  if (q.kind === 'adaptive') $('#changeAdventure').onclick = () => { closeModal(); go('adaptive'); };
  $('#again').onclick = () => {
    if (q.kind === 'adaptive' && window.StoryQuest?.beginAdaptive) { closeModal(); StoryQuest.beginAdaptive(q.adventure); return; }
    if (q.kind === 'storybook' && typeof StoryQuest !== 'undefined') { StoryQuest.start(q.storyId); return; }
    if (q.kind === 'classPractice') { ClassPractice.play(...q.bankFilter); return; }
    if (q.kind === 'lesson') { showIntro(getTopic(q.topicId), q.level, q.assignmentId); return; }
    if (q.kind === 'challenge' || q.kind === 'boss') { closeModal(); go('roadmap'); openNode(mapNodes.findIndex(n => n.id === q.nodeId)); return; }
    doAction(q.kind);
  };
  $('#home').onclick = () => { closeModal(); go('home'); };
  $('#toMap').onclick = () => { closeModal(); go('roadmap'); };
  if (next) $('#goNext').onclick = () => showIntro(next);
  if (upTier) $('#upTier').onclick = () => showIntro(getTopic(q.topicId), upTier, q.assignmentId);
  const gc = $('#getCert'); if (gc) gc.onclick = () => showCertificate({ kind: 'island', grade: S.grade });
  onModalClose = render;
  if (award) QuaTang.attach(award);
}

/* ============================== CÁC TRÒ CHƠI ============================== */
function poolItems(filter) {
  const out = [];
  openTopics().forEach(t => { t.baiTap.forEach((b, i) => { if (!filter || filter(b)) out.push(Object.assign({}, b, { _t: t.id, _i: i })); }); out.push(...genItems(t, filter)); });
  return out;
}
function doAction(action) {
  if (action === 'daily') {
    const due = freshQuestionPick(shuffle(Object.keys(S.review)).map(itemOf).filter(Boolean).filter(it => it.loai !== 'ngheViet'), 2);
    const dueKeys = new Set(due.map(questionFingerprint));
    const rest = freshQuestionPick(poolItems(b => b.loai !== 'ngheViet'), 5 - due.length, { excludeKeys: dueKeys }).map(vary);
    startQuiz({ kind: 'daily', title: 'Thử thách mỗi ngày', icon: '🎯', subtitle: '5 câu trộn', items: shuffle(due.concat(rest)) });
  } else if (action === 'review') {
    if (WordShelf.dueCount() && (currentView !== 'review' || !Object.keys(S.review).some(itemOf))) {
      if (currentView === 'review') $('[data-retry-set]')?.click();
      else go('review');
      return;
    }
    const items = shuffle(Object.keys(S.review).map(itemOf).filter(Boolean)).slice(0, 10)
      .map(it => it.loai === 'ngheViet' && Number(S.grade) < 2 ? null : it).filter(Boolean);
    if (!items.length) { toast('Chưa có từ nào cần ôn. Em học bài mới nhé! 🌷'); return; }
    startQuiz({ kind: 'review', title: 'Ôn từ hay nhầm', icon: '🔁', subtitle: 'Đúng 2 lần là thuộc', items });
  } else if (action === 'hunt') {
    startQuiz({ kind: 'hunt', title: 'Thám tử săn lỗi', icon: '🔎', subtitle: 'Tìm chữ viết sai', items: freshQuestionPick(poolItems(b => b.loai === 'timLoi'), 6) });
  } else if (action === 'dictation') {
    const passages = DATA.doanNgheViet[S.grade] || DATA.doanNgheViet[2] || [];
    const p = pick(passages) || '';
    const sentences = p.split(/(?<=[.!?])\s+/).filter(Boolean).map(s => ({ loai: 'ngheViet', cau: s, _t: 'doan', _i: 0 }));
    startQuiz({ kind: 'dictation', title: 'Nghe – viết đoạn văn', icon: '🎧', subtitle: 'Đoạn văn lớp ' + S.grade, items: sentences });
  } else if (action === 'speed') {
    startSpeed();
  } else if (action === 'quick') {
    startQuiz({ kind: 'quick', title: 'Luyện nhanh 10 câu', icon: '🎲', subtitle: 'Câu ngẫu nhiên', items: mixedItems(openTopics(), 10) });
  } else if (action === 'continue') {
    go('roadmap');
    const i = mapNodes.findIndex((n, k) => nodeStatus(n, k, mapNodes) === 'open');
    if (i >= 0) openNode(i); else toast('Em đã đi hết con đường rồi! 🎉');
  } else if (action === 'placement') {
    startPlacement();
  } else if (action === 'skip') {
    startSkipTest();
  } else if (action === 'arena') {
    if (typeof startArena === 'function') startArena(); else toast('Chưa tải được chế độ Đấu đội.');
  } else if (action === 'adaptive') {
    go('adaptive');
  } else if (action === 'stories') {
    go('stories');
  } else if (action === 'joinArena') {
    if (typeof LiveArena !== 'undefined') LiveArena.join(); else toast('Chế độ đấu trường trực tuyến chưa tải được.');
  } else if (action === 'snowcatch') {
    if (typeof startSnowCatch === 'function') startSnowCatch(); else toast('Chưa tải được trò Hứng tuyết chữ.');
  } else if (action === 'claimMission') {
    const m = mission();
    if (m.claimed || !MISSIONS.every(x => m[x.k] >= x.n)) return;
    m.claimed = true; S.flowers += 2; S.xp += 30; checkBadges(); save();
    sfx('win'); confetti(); toast('🧺 Giỏ quà hôm nay: 🌸 +2 bông hoa, ⭐ +30 XP!'); render();
  }
}
function startSpeed() {
  const pool = poolItems(b => b.loai === 'chon');
  const items = freshQuestionPick(pool, Math.min(36, pool.length));
  const body = '<div class="speed-intro"><div class="big-emoji">🚀</div><h3>Nhanh tay chọn đúng!</h3><p>Em có <b>60 giây</b>. Mỗi câu chỉ xuất hiện một lần trong lượt chơi; hết câu mới sẽ tự mở thêm câu khác. Kỉ lục của em: <b>' + S.bestSpeed + '</b> điểm.</p><button class="primary-btn big" id="goSpeed">Bắt đầu! ⏱️</button></div>';
  openModal('🚀 Nhanh tay', 'Trò chơi 60 giây', body);
  $('#goSpeed').onclick = () => startQuiz({ kind: 'speed', title: 'Nhanh tay', icon: '🚀', subtitle: '⏱️ 60 giây', items, sourcePool: pool, timeLimit: 60 });
}
function speedAfter(right) {
  const c = $('#plCard'); if (c) c.classList.add(right ? 'flash-good' : 'flash-bad');
  const bar = $('.pl-bar b'); if (bar) bar.textContent = Q.correct + ' điểm';
  const q = Q;
  setTimeout(() => {
    if (Q !== q || Date.now() >= q.endAt) return;
    q.i++;
    if (q.i >= q.items.length && q.sourcePool?.length) {
      const more = freshQuestionPick(q.sourcePool, 36, { excludeKeys: q.usedQuestionKeys });
      more.forEach(item => { q.usedQuestionKeys.add(questionFingerprint(item)); q.items.push(item); });
    }
    if (q.i < q.items.length) renderItem(); else finishQuiz();
  }, right ? 380 : 1000);
}

/* ============================== SỰ KIỆN ============================== */
/* Đang làm dở bài (đã trả lời ít nhất 1 câu) mà bấm ✕ → hỏi lại, tránh bé bấm nhầm mất bài */
function askQuit() {
  const root = $('#modalRoot');
  if (!Q || !root.classList.contains('player-mode') || !(Q.i > 0 || Q.answered) || $('#quitAsk')) return false;
  const box = document.createElement('div');
  box.id = 'quitAsk'; box.className = 'quit-ask'; box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-labelledby', 'quitTitle');
  box.innerHTML = '<div class="quit-card"><div class="quit-ico" aria-hidden="true">' + S.avatar + '</div><b id="quitTitle">Thoát bài?</b><p>Kết quả bài đang làm sẽ không được lưu.</p>' +
    '<div class="quit-actions"><button class="primary-btn big" id="quitStay">Học tiếp</button><button class="soft-btn big" id="quitGo">Thoát</button></div></div>';
  root.appendChild(box);
  $('#quitStay').onclick = () => box.remove();
  $('#quitGo').onclick = () => { box.remove(); closeModal(); };
  $('#quitStay').focus();
  return true;
}
function closeSidebar() { $('#sidebar').classList.remove('mobile-open'); $('#sidebarScrim').hidden = true; }
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close-modal]')) { if (!askQuit()) closeModal(); return; }
  const say = t.closest('[data-say]'); if (say) { speak(say.dataset.say); return; }
  const isl = t.closest('[data-island]'); if (isl) { chooseIsland(isl.dataset.island); return; }
  const v = t.closest('[data-view]'); if (v) { e.preventDefault(); if ($('#modalRoot').hidden === false) closeModal(); go(v.dataset.view); return; }
  const s = t.closest('[data-start]'); if (s) { startTopic(s.dataset.start); return; }
  if (t.closest('[data-locked]')) { sfx('bad'); toast(LOCK_MSG()); return; }
  const a = t.closest('[data-action]'); if (a) { doAction(a.dataset.action); return; }
});
document.addEventListener('keydown', e => {
  if ($('#modalRoot').hidden) return;
  if (e.key === 'Escape') { const qa = $('#quitAsk'); if (qa) { qa.remove(); return; } if (!askQuit()) closeModal(); return; }
  if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { // Enter: Kiểm tra → Tiếp tục
    const cont = $('#plCont'), chk = $('#plCheck');
    if (cont && !$('#plSheet').hidden) { e.preventDefault(); cont.click(); return; }
    if (chk && !chk.disabled && !$('#plFoot').hidden) { e.preventDefault(); chk.click(); return; }
  }
  if (e.target.matches('input, textarea, select')) return;
  if (/^[1-4]$/.test(e.key)) { const b = $$('[data-answer], [data-tf]')[Number(e.key) - 1]; if (b && !b.disabled) b.click(); }
});
$('#gradeSelect').addEventListener('change', e => { S.grade = schoolGrade(e.target.value); save(); render(); toast('Đã chuyển sang lộ trình lớp ' + S.grade); });
$('#mobileMenu').onclick = () => { const open = $('#sidebar').classList.toggle('mobile-open'); $('#sidebarScrim').hidden = !open; };
$('#sidebarScrim').onclick = closeSidebar;
$('#profileButton').onclick = showProfile;
$('#backBtn').onclick = goBack;
{ let fitRaf = 0; addEventListener('resize', () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => {
  fitTopbar();
  if (currentView === 'roadmap' && roadmapWasNarrow !== null && roadmapWasNarrow !== roadmapNarrow() && $('#modalRoot').hidden) render(); // xoay máy / đổi cỡ cửa sổ
}); }); }
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTopbar); // phông tải xong thì chữ rộng hơn → đo lại
$('#soundToggle').onclick = () => { if (typeof toggleVolumePanel === 'function') { toggleVolumePanel(); return; } db.settings.sound = !db.settings.sound; save(); if (db.settings.sound) sfx('good'); else stopSpeak(); toast(db.settings.sound ? 'Đã bật âm thanh 🔊' : 'Đã tắt âm thanh 🔇'); };

if (!ALL_TOPICS.length) document.getElementById('viewRoot').innerHTML = '<p style="padding:30px">Không tải được ngân hàng câu hỏi (data/ngan-hang-chinh-ta.js).</p>';
else render();
