/* Nhạc nền nhẹ nhàng + bảng âm lượng ở góc trên (Claude Code, đợt 9). Nạp SAU app.js.
   • Nhạc tự sinh bằng WebAudio – không dùng tệp nhạc (không lo bản quyền, không tốn dung lượng):
     vòng hợp âm Đô trưởng I–vi–IV–V nền êm + giai điệu “hộp nhạc” ngũ cung + tiếng vọng nhẹ, nhịp 66.
   • Chỉ bắt đầu sau lần chạm đầu tiên (trình duyệt cấm tự phát), tự nhỏ lại khi máy đang đọc,
     tạm dừng khi chuyển tab.
   • Bảng âm lượng: nhạc nền (bật/tắt + thanh trượt), hiệu ứng & giọng đọc (bật/tắt + thanh trượt), tắt hết. */
'use strict';
const Music = (() => {
  const BPM = 66, BEAT = 60 / BPM;
  const CHORDS = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]; // C, Am, F, G (MIDI)
  const PENTA = [60, 62, 64, 67, 69, 72, 74, 76];                          // Đô ngũ cung
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  let master = null, timer = null, nextTime = 0, step = 0, duck = 1, wanted = false, lastNote = 64;
  function ctx() { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
  function level() { return db.settings.music ? (db.settings.musicVol == null ? 0.3 : db.settings.musicVol) * 0.55 * duck : 0; }
  function build() {
    const c = ctx();
    master = c.createGain(); master.gain.value = 0;
    const soft = c.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 2400;
    const echo = c.createDelay(); echo.delayTime.value = BEAT * 0.75;
    const back = c.createGain(); back.gain.value = 0.28;
    const wet = c.createGain(); wet.gain.value = 0.22;
    master.connect(soft); soft.connect(c.destination);
    soft.connect(echo); echo.connect(back); back.connect(echo); echo.connect(wet); wet.connect(c.destination);
  }
  function note(m, t, dur, type, g, attack) {
    const c = ctx(), o = c.createOscillator(), e = c.createGain();
    o.type = type; o.frequency.value = freq(m);
    e.gain.setValueAtTime(0.0001, t);
    e.gain.linearRampToValueAtTime(g, t + attack);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(e); e.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function melodyNote(chord) {
    // đi từng bước nhỏ trong thang ngũ cung, hay dừng ở nốt thuộc hợp âm → nghe êm, không lộn xộn
    const k = PENTA.indexOf(lastNote), move = [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
    let next = PENTA[Math.min(PENTA.length - 1, Math.max(0, (k < 0 ? 2 : k) + move))];
    const fit = PENTA.filter(p => chord.some(cm => (p - cm) % 12 === 0));
    if (Math.random() < 0.45) next = fit.reduce((a, b) => Math.abs(b - next) < Math.abs(a - next) ? b : a, fit[0]);
    lastNote = next; return next;
  }
  function tick() {
    const c = ctx();
    while (nextTime < c.currentTime + 0.6) {
      const bar = Math.floor(step / 4) % 4, beat = step % 4, chord = CHORDS[bar];
      if (beat === 0) {
        chord.forEach(m => note(m + 12, nextTime, BEAT * 4.2, 'triangle', 0.035, 0.6)); // nền êm
        note(chord[0] - 12, nextTime, BEAT * 2.5, 'sine', 0.07, 0.05);                    // trầm
      }
      if (beat === 2) note(chord[2] - 12, nextTime, BEAT * 1.8, 'sine', 0.045, 0.05);
      if (Math.random() < (beat === 0 ? 0.92 : 0.55)) note(melodyNote(chord), nextTime, 1.5, 'sine', 0.055, 0.01); // hộp nhạc
      if (beat === 3 && Math.random() < 0.25) note(lastNote + 12, nextTime + BEAT / 2, 1, 'sine', 0.02, 0.01);        // chuông lấp lánh
      nextTime += BEAT; step++;
    }
    const want = ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) ? 0.25 : 1; // nhỏ lại khi máy đọc
    if (want !== duck) { duck = want; apply(); }
  }
  function apply() { if (master) master.gain.setTargetAtTime(level(), ctx().currentTime, 0.35); }
  function start() {
    wanted = true;
    if (!db.settings.music || document.hidden) return;
    try {
      if (!master) build();
      const c = ctx(); if (c.state === 'suspended') c.resume();
      if (!timer) { nextTime = c.currentTime + 0.15; timer = setInterval(tick, 150); }
      apply();
    } catch (e) { /* trình duyệt không hỗ trợ WebAudio */ }
  }
  function stop() { if (master) master.gain.setTargetAtTime(0, ctx().currentTime, 0.25); clearInterval(timer); timer = null; }
  const playing = () => !!timer && db.settings.music;
  // Lần chạm/bấm phím đầu tiên mới bắt đầu nhạc
  const firstTouch = () => { start(); document.removeEventListener('pointerdown', firstTouch); document.removeEventListener('keydown', firstTouch); };
  document.addEventListener('pointerdown', firstTouch);
  document.addEventListener('keydown', firstTouch);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (wanted) start(); });
  return { start, stop, apply, playing };
})();

function volIcon() {
  const s = db.settings;
  if (!s.sound && !s.music) return '🔇';
  return s.music ? '🎵' : '🔊';
}
function toggleVolumePanel() {
  const old = $('#volPanel');
  if (old) { old.remove(); return; }
  const s = db.settings, btn = $('#soundToggle'), r = btn.getBoundingClientRect();
  const p = document.createElement('div');
  p.id = 'volPanel'; p.className = 'vol-panel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Âm lượng');
  p.style.top = Math.round(r.bottom + 8) + 'px';
  p.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
  const pctv = v => Math.round((v == null ? 0.5 : v) * 100);
  p.innerHTML = '<div class="vol-head"><b>Âm thanh</b><button class="vol-x" aria-label="Đóng">✕</button></div>' +
    '<div class="vol-row"><span class="vol-ico" aria-hidden="true">🎵</span><label class="vol-main"><b>Nhạc nền</b><input type="range" min="0" max="100" step="5" id="musicVol" value="' + pctv(s.musicVol) + '" aria-label="Âm lượng nhạc nền" /></label>' +
    '<input type="checkbox" class="switch" id="musicOn" aria-label="Bật nhạc nền" ' + (s.music ? 'checked' : '') + ' /></div>' +
    '<div class="vol-row"><span class="vol-ico" aria-hidden="true">🔔</span><label class="vol-main"><b>Hiệu ứng &amp; giọng đọc</b><input type="range" min="0" max="100" step="5" id="sfxVol" value="' + pctv(s.sfxVol) + '" aria-label="Âm lượng hiệu ứng và giọng đọc" /></label>' +
    '<input type="checkbox" class="switch" id="sfxOn" aria-label="Bật hiệu ứng và giọng đọc" ' + (s.sound ? 'checked' : '') + ' /></div>' +
    '<p class="vol-note">🎶 Nhạc tự nhỏ lại khi máy đang đọc câu hỏi.</p>' +
    '<button class="soft-btn vol-all" id="volAll">' + (s.sound || s.music ? '🔇 Tắt hết' : '🔊 Bật lại') + '</button>';
  document.body.appendChild(p);
  // Canh theo nút loa nhưng luôn nằm gọn trong màn hình (điện thoại hẹp)
  const pw = p.offsetWidth; p.style.right = 'auto';
  p.style.left = Math.max(8, Math.min(Math.round(r.right - pw), window.innerWidth - pw - 8)) + 'px';
  const sync = () => { save(); $('#musicOn').checked = !!db.settings.music; $('#sfxOn').checked = !!db.settings.sound; $('#volAll').textContent = db.settings.sound || db.settings.music ? '🔇 Tắt hết' : '🔊 Bật lại'; };
  $('#musicVol').oninput = e => { db.settings.musicVol = e.target.value / 100; db.settings.music = e.target.value > 0; if (db.settings.music) Music.start(); else Music.stop(); Music.apply(); sync(); };
  $('#sfxVol').oninput = e => { db.settings.sfxVol = e.target.value / 100; db.settings.sound = e.target.value > 0; sync(); };
  $('#sfxVol').onchange = () => sfx('good');
  $('#musicOn').onchange = e => { db.settings.music = e.target.checked; if (e.target.checked) { if (!db.settings.musicVol) { db.settings.musicVol = 0.3; $('#musicVol').value = 30; } Music.start(); } else Music.stop(); sync(); };
  $('#sfxOn').onchange = e => { db.settings.sound = e.target.checked; if (!e.target.checked) stopSpeak(); else { if (!db.settings.sfxVol) { db.settings.sfxVol = 0.8; $('#sfxVol').value = 80; } sfx('good'); } sync(); };
  $('#volAll').onclick = () => {
    const on = !(db.settings.sound || db.settings.music);
    db.settings.sound = on; db.settings.music = on;
    if (on) { Music.start(); sfx('good'); } else { Music.stop(); stopSpeak(); }
    sync(); toast(on ? '🔊 Đã bật lại âm thanh' : '🔇 Đã tắt hết âm thanh');
  };
  p.querySelector('.vol-x').onclick = () => p.remove();
  setTimeout(() => {
    const away = e => { if (!p.isConnected) { document.removeEventListener('pointerdown', away); return; } if (!p.contains(e.target) && !btn.contains(e.target)) { p.remove(); document.removeEventListener('pointerdown', away); } };
    document.addEventListener('pointerdown', away);
  }, 0);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const p = $('#volPanel'); if (p) p.remove(); } });
updateChrome();
