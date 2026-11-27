/* Chọn cảnh nền chung trong trang giáo viên đã đăng nhập. */
'use strict';
(function () {
  const { options, cacheKey } = SeasonCatalog;
  const { api, send, register } = GV;

  async function page(view) {
    const panel = document.createElement('section');
    panel.className = 'card';
    panel.innerHTML = '<h2>Cảnh nền toàn trường</h2><p class="hint" role="status">Đang tải cảnh đã công bố…</p>';
    view.replaceChildren(panel);
    let published;
    try { published = (await api('/api/site-theme')).season; }
    catch (error) { panel.querySelector('[role="status"]').textContent = error.message; return; }
    if (!panel.isConnected) return;

    panel.innerHTML = '<h2>Cảnh nền toàn trường</h2><p class="hint">Chọn một cảnh rồi công bố để áp dụng cho mọi học sinh trên web này.</p>' +
      '<p class="theme-current" data-published></p><form class="theme-form"><fieldset><legend>Chọn cảnh nền</legend><div class="teacher-theme-grid">' +
      Object.entries(options).map(([id, scene]) => {
        const art = scene.thumb || scene.art;
        const preview = art ? '<img src="../' + art + '" alt="" loading="lazy">' : '<span aria-hidden="true" class="teacher-theme-noel">❄️ 🎄 ❄️</span>';
        return '<label class="teacher-theme-choice"><input type="radio" name="season" value="' + id + '"' + (id === published ? ' checked' : '') + '>' +
          preview + '<span><b>' + scene.name + '</b><small>' + scene.hint + '</small></span></label>';
      }).join('') + '</div></fieldset><button type="submit" class="btn primary" disabled>Công bố cảnh nền</button><p class="hint" role="status"></p></form>';
    const form = panel.querySelector('form'), submit = form.querySelector('button'), status = form.querySelector('[role="status"]');
    const selected = () => new FormData(form).get('season');
    let saving = false;
    function update() {
      panel.querySelector('[data-published]').textContent = options[published]
        ? 'Đang áp dụng · ' + options[published].name
        : 'Chưa công bố · Học sinh đang dùng cảnh hiện tại';
      submit.disabled = saving || !selected() || selected() === published;
    }
    form.onchange = () => { status.textContent = ''; update(); };
    form.onsubmit = async event => {
      event.preventDefault();
      const season = selected();
      if (saving || !Object.hasOwn(options, season) || season === published) return;
      saving = true;
      update();
      status.textContent = 'Đang công bố…';
      try {
        published = (await send('/api/site-theme', 'PUT', { season })).season;
        try { localStorage.setItem(cacheKey, published); } catch {}
        status.textContent = 'Đã công bố. Trang học đang mở sẽ tự cập nhật trong ít giây.';
      } catch (error) { status.textContent = error.message; }
      finally { saving = false; update(); }
    };
    update();
  }
  register('giao-dien', 'Giao diện học sinh', page);
})();
