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
      toggle('sound', c.sound, 'Âm thanh và giọng đọc', 'Tiếng chuông khi đúng, đọc câu hỏi cho em nghe') +
      '<div class="set-row"><span><b>Tốc độ đọc</b><small>Chậm hợp với các bạn lớp 1–2</small></span>' + seg('rate', String(c.rate || 1), 'Tốc độ đọc', [['0.8', '🐢 Chậm'], ['1', 'Vừa'], ['1.15', '🐇 Nhanh']]) + '</div>' +
      '<div class="btn-row"><button class="soft-btn" id="setTest">▶ Nghe thử</button></div></section>' +
      '<section class="set-card"><h2>🎨 Hiển thị</h2>' +
      '<div class="set-row"><span><b>Giao diện</b><small>Ban đêm dịu mắt hơn khi học buổi tối</small></span>' + seg('theme', c.theme, 'Giao diện', [['auto', 'Tự động'], ['day', '☀️ Ngày'], ['night', '🌙 Đêm']]) + '</div>' +
      toggle('bigText', c.bigText, 'Chữ lớn', 'Phóng to chữ và nút cho dễ đọc, dễ bấm') +
      toggle('calm', c.calm, 'Giảm chuyển động', 'Tắt pháo giấy và hiệu ứng nhún nhảy') + '</section>' +
      '<section class="set-card"><h2>👤 Người chơi</h2><p class="set-who"><span>' + S.avatar + '</span><b>' + esc(S.name) + '</b> · Lớp ' + esc(S.grade) + ' – ' + gardenName() + '</p>' +
      '<div class="btn-row"><button class="primary-btn" id="setProfile">Đổi người chơi / sửa hồ sơ</button><button class="soft-btn" data-view="profile">Xem hồ sơ</button></div>' +
      '<p class="small-print">Xoá tiến độ nằm trong Góc thầy cô để tránh bấm nhầm.</p></section>' +
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
    });
    $('#setTest').onclick = () => db.settings.sound ? speak('Chào em! Hôm nay mình cùng luyện chính tả nhé.') : toast('Âm thanh đang tắt, em bật lại ở trên nhé.');
    $('#setProfile').onclick = showProfile;
  }
  registerView('settings', 'Cài đặt', page, bind);
  AFTER_RENDER.push(applySettings); // đổi người chơi / khôi phục dữ liệu vẫn giữ đúng giao diện
  applySettings();
})();
