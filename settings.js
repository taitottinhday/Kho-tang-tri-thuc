/* Cài đặt cho học sinh (mục A trong PHOI_HOP) – Claude Code.
   Nạp SAU app.js. Dùng registerView(), db.settings, save() của app.js. */
'use strict';
(function () {
  const DEF = { theme: 'auto', bigText: false, calm: false };
  const darkQuery = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function cfg() { return Object.assign({}, DEF, db.settings); }
  function applySettings() {
    const c = cfg();
    const night = c.theme === 'night' || (c.theme === 'auto' && darkQuery && darkQuery.matches);
    document.documentElement.dataset.theme = night ? 'night' : 'day';
    document.body.classList.toggle('big-text', !!c.bigText);
    document.body.classList.toggle('calm', !!c.calm);
  }
  if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', applySettings);

  function seg(key, value, label, opts) {
    return '<div class="seg" role="radiogroup" aria-label="' + label + '">' + opts.map(o =>
      '<button role="radio" aria-checked="' + (value === o[0]) + '" class="' + (value === o[0] ? 'on' : '') + '" data-set="' + key + '" data-val="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
  }
  function toggle(key, on, title, desc) {
    return '<label class="set-row"><span><b>' + title + '</b><small>' + desc + '</small></span><input type="checkbox" class="switch" data-set-bool="' + key + '" ' + (on ? 'checked' : '') + ' /></label>';
  }
  function page() {
    const c = cfg();
    return pageHeading('CÀI ĐẶT', 'Cài đặt của em', 'Chọn cách học em thấy dễ chịu nhất. Cài đặt lưu trên máy này.') +
      '<div class="settings-grid">' +
      '<section class="set-card"><h2>🔊 Âm thanh</h2>' +
      toggle('music', c.music, '🎵 Nhạc nền nhẹ nhàng', 'Tự nhỏ lại khi máy đọc câu hỏi') +
      '<div class="set-row"><span><b>Âm lượng nhạc nền</b><small>Kéo sang trái để nhỏ lại</small></span><input type="range" min="0" max="100" step="5" id="setMusicVol" value="' + Math.round((c.musicVol == null ? 0.3 : c.musicVol) * 100) + '" aria-label="Âm lượng nhạc nền" /></div>' +
      toggle('sound', c.sound, 'Âm thanh và giọng đọc', 'Tiếng chuông khi đúng, đọc câu hỏi cho em nghe') +
      '<div class="set-row voice-status ' + (viVoice ? 'ok' : 'missing') + '"><span><b>Giọng đọc tiếng Việt</b><small>' +
      (viVoice ? '✅ Đang dùng: ' + esc(viVoice.name) + (voiceGender(viVoice) ? ' · giọng ' + voiceGender(viVoice) : '') +
        (voiceGender(viVoice) === 'nam' && !viVoices.some(v => voiceGender(v) === 'nữ') ? '<br />💡 Muốn giọng nữ? Mở web bằng <b>Microsoft Edge</b> để có giọng nữ tự nhiên Hoài My.' : '') : '⚠️ Trình duyệt này chưa có giọng tiếng Việt nên không đọc được. Trên máy tính Windows hãy mở bằng <b>Microsoft Edge</b>; trên điện thoại/máy tính bảng thường đã có sẵn.') +
      '</small></span></div>' +
      '<div class="set-row"><span><b>Tốc độ đọc</b><small>Chậm hợp với các bạn lớp 1–2</small></span>' + seg('rate', String(c.rate || 1), 'Tốc độ đọc', [['0.8', '🐢 Chậm'], ['1', 'Vừa'], ['1.15', '🐇 Nhanh']]) + '</div>' +
      '<div class="btn-row"><button class="soft-btn" id="setTest">▶ Nghe thử</button></div></section>' +
      '<section class="set-card"><h2>🎨 Hiển thị</h2>' +
      '<div class="set-row"><span><b>Giao diện</b><small>Ban đêm dịu mắt hơn khi học buổi tối</small></span>' + seg('theme', c.theme, 'Giao diện', [['auto', 'Tự động'], ['day', '☀️ Ngày'], ['night', '🌙 Đêm']]) + '</div>' +
      '<div class="set-row"><span><b>🎄 Trang trí Giáng sinh</b><small>Tuyết rơi, cây thông, Lịch Noel. Tự động: 15/11 → 10/1</small></span>' + seg('noel', c.noel || 'auto', 'Trang trí Giáng sinh', [['auto', 'Tự động'], ['on', 'Bật'], ['off', 'Tắt']]) + '</div>' +
      toggle('bigText', c.bigText, 'Chữ lớn', 'Phóng to chữ và nút cho dễ đọc, dễ bấm') +
      toggle('calm', c.calm, 'Giảm chuyển động', 'Tắt pháo giấy và hiệu ứng nhún nhảy') + '</section>' +
      '<section class="set-card"><h2>🩺 Kiểm tra âm thanh</h2><p class="small-print">Bấm lần lượt 2 nút. Nghe được tiếng chuông mà không nghe được giọng đọc → lỗi giọng đọc của trình duyệt. Không nghe được cả hai → kiểm tra loa, âm lượng của máy.</p>' +
      '<div class="btn-row"><button class="soft-btn" id="diagBeep">🔔 Thử tiếng chuông</button><button class="soft-btn" id="diagVoice">🗣️ Thử giọng đọc</button></div>' +
      '<pre class="diag-log" id="diagLog" aria-live="polite"></pre></section>' +
      '<section class="set-card"><h2>👤 Tài khoản</h2>' +
      '<div class="set-account">' + (typeof avatarBubble === 'function' ? avatarBubble(S.avatar, 'lg') : '<span>' + S.avatar + '</span>') +
      '<div><b>' + esc(S.name) + '</b><small>' + (typeof GUEST_MODE !== 'undefined' && GUEST_MODE ? '👀 Đang học thử – không lưu tiến độ' : S.pin ? '🔐 Đã bật mã PIN' : 'Chưa đặt mã PIN') + '</small></div>' +
      '<button class="soft-btn" id="setProfile">✏️ Sửa hồ sơ</button></div>' +
      '<div class="set-row"><span><b>Lớp đang học</b><small>Đổi lớp là đổi sang hòn đảo khác</small></span><select id="setGrade" class="t-select" aria-label="Lớp đang học">' +
      [1, 2, 3, 4, 5].map(g => '<option value="' + g + '"' + (String(g) === S.grade ? ' selected' : '') + '>Lớp ' + g + ' – ' + gardenName(g) + '</option>').join('') + '</select></div>' +
      '<div class="btn-row"><button class="primary-btn" id="setSwitch">🔄 Đổi người chơi</button><button class="soft-btn" data-view="profile">Xem hồ sơ</button></div>' +
      '<p class="small-print">Xoá tiến độ, xoá hồ sơ, xoá mã PIN khi quên nằm trong Góc thầy cô để tránh bấm nhầm.</p></section>' +
      '</div>';
  }
  function bind() {
    $$('[data-set]').forEach(b => b.onclick = () => {
      const k = b.dataset.set, v = b.dataset.val;
      db.settings[k] = k === 'rate' ? Number(v) : v;
      save(); applySettings(); sfx('tap'); render();
      if (k === 'rate') speak('Con kiến tha mồi về tổ.');
    });
    $$('[data-set-bool]').forEach(i => i.onchange = () => {
      const k = i.dataset.setBool;
      db.settings[k] = i.checked; save(); applySettings();
      if (k === 'sound') { if (i.checked) sfx('good'); else stopSpeak(); }
      if (k === 'music' && typeof Music !== 'undefined') { if (i.checked) Music.start(); else Music.stop(); }
    });
    const mv = $('#setMusicVol');
    if (mv) mv.oninput = e => { db.settings.musicVol = e.target.value / 100; db.settings.music = e.target.value > 0; save(); if (typeof Music !== 'undefined') { if (db.settings.music) Music.start(); else Music.stop(); Music.apply(); } const t = $('[data-set-bool="music"]'); if (t) t.checked = db.settings.music; };
    $('#setTest').onclick = () => db.settings.sound ? speak('Chào em! Hôm nay mình cùng luyện chính tả nhé.') : toast('Âm thanh đang tắt, em bật lại ở trên nhé.');
    $('#setProfile').onclick = showProfile;
    $('#setGrade').onchange = e => { S.grade = e.target.value; save(); render(); toast('⛵ Đã chuyển sang ' + gardenName() + ' (Lớp ' + S.grade + ')'); };
    $('#setSwitch').onclick = () => { if (typeof switchPlayer === 'function') switchPlayer(); else showProfile(); };
    // Chẩn đoán âm thanh: ghi từng bước để thầy cô biết lỗi ở đâu
    const log = m => { const el = $('#diagLog'); if (el) { el.appendChild(document.createTextNode(m + '\n')); el.scrollTop = el.scrollHeight; } };
    const ua = navigator.userAgent, browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Khác';
    $('#diagBeep').onclick = () => {
      const was = db.settings.sound; db.settings.sound = true; sfx('win'); db.settings.sound = was;
      log('🔔 Đã phát tiếng chuông' + (audioCtx ? ' (bộ âm thanh: ' + audioCtx.state + ')' : '') + '. Em có nghe thấy không?');
    };
    $('#diagVoice').onclick = () => {
      if (!('speechSynthesis' in window)) { log('❌ Trình duyệt này không hỗ trợ đọc thành tiếng.'); return; }
      findVoice();
      const all = speechSynthesis.getVoices();
      log('Trình duyệt: ' + browser + ' · ' + all.length + ' giọng, trong đó ' + viVoices.length + ' giọng tiếng Việt' + (viVoice ? ' · dùng: ' + viVoice.name : ''));
      if (!db.settings.sound) log('⚠️ Âm thanh của web đang TẮT (nút 🔇 ở góc trên) – vẫn thử đọc để kiểm tra.');
      if (!viVoice) log(IS_IOS ? '⚠️ Chưa thấy giọng tiếng Việt trong danh sách – iPhone vẫn thử đọc bằng giọng tiếng Việt của máy. Nếu im lặng: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt → tải giọng Linh.' : '⚠️ Không có giọng tiếng Việt – trình duyệt sẽ đọc bằng giọng mặc định hoặc im lặng. Hãy mở bằng Microsoft Edge.');
      if (IS_IOS) log('📱 iPhone/iPad: gạt nút im lặng bên hông máy sang có tiếng và bấm nút tăng âm lượng. Đã bật chế độ phát: ' + (navigator.audioSession ? navigator.audioSession.type : 'thẻ audio im lặng'));
      let started = false;
      const u = new SpeechSynthesisUtterance('Xin chào các em, đây là giọng đọc tiếng Việt.');
      u.lang = 'vi-VN'; if (viVoice) u.voice = viVoice; u.rate = 0.85 * SPEECH_PACE; u.volume = 1;
      u.onstart = () => { started = true; log('▶️ Trình duyệt bắt đầu đọc…'); };
      u.onend = () => log('✅ Trình duyệt báo đã đọc xong. Nếu vẫn không nghe thấy: kiểm tra âm lượng máy, loa/tai nghe đang chọn, hoặc tab bị tắt tiếng (chuột phải vào tab).');
      u.onerror = e => log('❌ Lỗi giọng đọc: ' + e.error);
      speakQueue.push(u);
      if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(() => { speechSynthesis.resume(); speechSynthesis.speak(u); }, 60); }
      else { speechSynthesis.resume(); speechSynthesis.speak(u); } // đọc ngay trong cú chạm (iPhone cần)
      setTimeout(() => { if (!started) log('⏳ Sau 4 giây trình duyệt vẫn chưa đọc – bộ đọc của trình duyệt bị kẹt. Hãy tải lại trang (Ctrl + F5) hoặc mở bằng Edge.'); }, 4000);
    };
  }
  registerView('settings', 'Cài đặt', page, bind);
  AFTER_RENDER.push(applySettings); // đổi người chơi / khôi phục dữ liệu vẫn giữ đúng giao diện
  applySettings();
})();
