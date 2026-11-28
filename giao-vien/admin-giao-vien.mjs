/* Trang QUẢN LÝ GIÁO VIÊN (chỉ quản trị). Bộ khung: Codex. Hoàn thiện + nối luồng: Claude (đợt 21).
   Quản trị ↔ giáo viên ↔ lớp ↔ học sinh: mỗi lớp có một giáo viên phụ trách; giáo viên chỉ thấy lớp của mình.
   Tham khảo bảng quản trị trường của Seesaw / Kognity / Matific: số liệu toàn trường, lớp từng giáo viên,
   giao lớp, đặt lại mật khẩu, khoá, xoá tài khoản (chuyển lớp trước khi xoá để học sinh không mất lớp). */
const { esc, register, api, send, toast, confirmBox } = window.GV;

const date = value => value
  ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—';
const lastSeen = value => {
  if (!value) return 'Chưa đăng nhập';
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 864e5);
  return days <= 0 ? 'Hôm nay' : days === 1 ? 'Hôm qua' : days + ' ngày trước';
};
const className = c => (c.name || 'Lớp ' + c.code) + (c.grade ? ' · K' + c.grade : '');
/* mật khẩu dễ đọc cho thầy cô: không có chữ dễ nhầm (l, 1, O, 0) */
function newPassword() {
  const pick = s => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const word = n => Array.from({ length: n }, () => pick('abcdefghijkmnpqrstuvwxyz')).join('');
  return word(4) + '-' + word(4) + '-' + Array.from({ length: 3 }, () => pick('23456789')).join('');
}
const loginInfo = (username, password) => 'Trang giáo viên: ' + location.origin + location.pathname + '\nTên đăng nhập: ' + username + '\nMật khẩu: ' + password + '\n(Sau khi vào, thầy cô bấm “Đổi mật khẩu” ở cuối thanh bên trái.)';

const DEMO = { username: 'lethiquynhhue', name: 'Lê Thị Quỳnh Huệ' };
const DEMO_CLASSES = ['1a', '1b', '2a', '2b', '3a', '3b', '3c'].map(section => ({ name: 'Mẫu ' + section.toUpperCase() + ' · Huệ', grade: Number(section[0]), section }));
const DEMO_SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const DEMO_MIDDLE = ['Minh', 'Hoàng', 'Gia', 'Ngọc', 'Khánh', 'Bảo', 'Thành', 'Quốc', 'Thảo', 'Phương', 'Thuỳ', 'Thanh', 'Anh', 'Hải', 'Đức', 'Tuệ', 'Mai', 'Diệu'];
const DEMO_GIVEN = ['An', 'Bình', 'Châu', 'Dũng', 'Em', 'Giang', 'Hà', 'Huy', 'Hân', 'Khang', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'My', 'Nam', 'Ngân', 'Nhi', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Thảo', 'Trang', 'Trí', 'Tú', 'Uyên', 'Vy', 'Yến'];
const DEMO_AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐱', '🐸', '🐯', '🐨', '🦁', '🐵'];
const demoName = (ci, seat) => DEMO_SURNAMES[(seat * 7 + ci * 3) % DEMO_SURNAMES.length] + ' ' + DEMO_MIDDLE[(seat * 11 + ci * 5) % DEMO_MIDDLE.length] + ' ' + DEMO_GIVEN[(seat * 13 + ci * 7) % DEMO_GIVEN.length];

async function page(view) {
  view.innerHTML = '<p class="muted">Đang tải danh sách tài khoản…</p>';
  let data = await api('/api/admin/teachers');
  let teachers = data.teachers || [], unassigned = data.unassigned || [];
  view.innerHTML = `
    <div class="page-head"><div><span class="eyebrow">Quản trị trường</span><h2>Giáo viên</h2>
      <p>Tạo tài khoản, giao lớp cho từng giáo viên. Giáo viên chỉ thấy lớp và học sinh của mình.</p></div></div>
    <div class="kpis" data-stats></div>
    <section class="panel admin-load"><div class="panel-head"><div><h3>Số học sinh mỗi giáo viên phụ trách</h3><p>Giúp phân công lớp cho cân</p></div></div><div class="viz" id="vzLoad"></div></section>
    <section class="admin-panel admin-unassigned" data-unassigned hidden></section>
    <details class="admin-panel admin-demo"><summary><b>Dữ liệu thử</b><small>Tạo 7 lớp mẫu (245 học sinh hư cấu) để thử Gọi tên, Giao bài, Thống kê</small></summary>
      <p>Tạo tài khoản <b>${esc(DEMO.name)}</b> (@${esc(DEMO.username)}) phụ trách 7 lớp “Mẫu 1A … 3C”, mỗi lớp 35 học sinh hư cấu (chỉ có tên, chưa có kết quả). Bấm lại không tạo trùng. Thử xong bấm <b>Xoá dữ liệu mẫu</b>.</p>
      <div class="admin-demo-actions"><button type="button" class="btn primary" data-demo-make>Tạo 7 lớp mẫu</button><button type="button" class="btn danger" data-demo-clear>Xoá dữ liệu mẫu</button></div>
      <p class="admin-feedback" data-demo-status role="status" aria-live="polite"></p>
    </details>
    <div class="admin-grid">
      <section class="admin-panel"><h3>Thêm giáo viên</h3>
        <p>Tạo xong, gửi phiếu thông tin đăng nhập cho giáo viên.</p>
        <form data-create class="admin-form">
          <label>Họ và tên<input name="name" maxlength="80" autocomplete="off" placeholder="Ví dụ: Nguyễn Thị An" required></label>
          <label>Tên đăng nhập<input name="username" minlength="3" maxlength="40" pattern="[a-z0-9][a-z0-9._\\-]{2,39}" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Ví dụ: nguyenthian" required><small>3–40 ký tự: chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch nối.</small></label>
          <label>Mật khẩu ban đầu<span class="admin-pass"><input name="password" type="text" minlength="10" maxlength="200" autocomplete="off" spellcheck="false" placeholder="Ít nhất 10 ký tự" required><button type="button" class="btn sm" data-gen>Tạo ngẫu nhiên</button></span></label>
          <button class="btn primary" type="submit">Tạo tài khoản</button>
          <p class="admin-feedback" role="status" aria-live="polite"></p>
        </form>
        <div class="admin-slip" data-slip hidden></div>
      </section>
      <section class="admin-panel"><div class="admin-list-heading"><div><h3>Tài khoản</h3><p>Giáo viên đăng nhập ở cùng trang này bằng tên và mật khẩu được cấp.</p></div>
        <button class="btn sm" data-refresh>Làm mới</button></div>
        <label class="admin-search">Tìm giáo viên<input type="search" placeholder="Tên hoặc tên đăng nhập" data-search></label>
        <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Giáo viên</th><th>Lớp phụ trách</th><th>Đăng nhập</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody data-rows></tbody></table></div><p class="admin-feedback" data-empty role="status" aria-live="polite"></p>
      </section>
    </div>
    <dialog class="admin-dialog" data-edit><form method="dialog" data-edit-form>
      <h3 data-edit-title>Chỉnh sửa tài khoản</h3><input type="hidden" name="username">
      <label>Họ và tên<input name="name" maxlength="80" required></label>
      <label>Đặt lại mật khẩu<span class="admin-pass"><input name="password" type="text" minlength="10" maxlength="200" autocomplete="off" spellcheck="false"><button type="button" class="btn sm" data-gen>Tạo ngẫu nhiên</button></span><small>Để trống nếu không đổi. Đổi mật khẩu sẽ đăng xuất giáo viên khỏi mọi máy.</small></label>
      <div class="admin-actions"><button class="btn" value="cancel" formnovalidate>Hủy</button><button class="btn primary" type="submit" value="save">Lưu thay đổi</button></div>
    </form></dialog>
    <dialog class="admin-dialog" data-delete><form method="dialog" data-delete-form>
      <h3 data-delete-title>Xoá tài khoản</h3><input type="hidden" name="username">
      <p class="admin-note" data-delete-note></p>
      <label data-move-wrap>Chuyển các lớp cho<select name="to" data-move></select></label>
      <div class="admin-actions"><button class="btn" value="cancel" formnovalidate>Hủy</button><button class="btn danger" type="submit" value="delete">Xoá tài khoản</button></div>
    </form></dialog>
    <dialog class="admin-dialog" data-classes><form method="dialog" data-classes-form>
      <h3 data-classes-title>Giao lớp</h3><input type="hidden" name="username">
      <p class="admin-note">Một giáo viên có thể phụ trách nhiều lớp. Đánh dấu các lớp giao cho giáo viên này; bỏ dấu để trả lớp về quản trị.</p>
      <div class="admin-class-list" data-class-list></div>
      <div class="admin-actions"><button class="btn" value="cancel" formnovalidate>Hủy</button><button class="btn primary" type="submit" value="save">Lưu phân công</button></div>
    </form></dialog>`;

  const $ = s => view.querySelector(s);
  const tbody = $('[data-rows]'), empty = $('[data-empty]'), search = $('[data-search]');
  const active = () => teachers.filter(t => t.active);
  const teacherOptions = (selected, except) => '<option value="">— Quản trị giữ lớp —</option>' + active().filter(t => t.username !== except)
    .map(t => '<option value="' + esc(t.username) + '"' + (t.username === selected ? ' selected' : '') + '>' + esc(t.name) + ' (@' + esc(t.username) + ')</option>').join('');

  async function reload() {
    data = await api('/api/admin/teachers');
    teachers = data.teachers || []; unassigned = data.unassigned || [];
    window.GV.cache().classes = null; // trang Lớp học / Học sinh nạp lại theo phân công mới
    draw();
  }
  function drawStats() {
    const classCount = teachers.reduce((n, t) => n + t.classes.length, 0) + unassigned.length;
    const students = teachers.reduce((n, t) => n + (t.students || 0), 0);
    $('[data-stats]').innerHTML = [[teachers.length, 'Tài khoản giáo viên'], [active().length, 'Đang hoạt động'], [classCount, 'Lớp học'], [students, 'Học sinh có giáo viên']]
      .map(([n, label]) => '<div class="kpi"><span class="kpi-label">' + label + '</span><span class="kpi-value">' + n + '</span></div>').join('');
    const load = teachers.map(t => ({ nhan: t.name, gt: t.students || 0, phu: t.classes.length + ' lớp' })).sort((a, b) => b.gt - a.gt).slice(0, 10);
    $('.admin-load').hidden = !load.length;
    if (load.length) window.BieuDo.ngang($('#vzLoad'), load, { donVi: 'em', moTa: 'Số học sinh mỗi giáo viên', cotNhan: 'Giáo viên', cotGiaTri: 'Học sinh' });
  }
  function drawUnassigned() {
    const box = $('[data-unassigned]');
    box.hidden = !unassigned.length;
    if (!unassigned.length) return;
    box.innerHTML = '<h3>' + unassigned.length + ' lớp chưa có giáo viên phụ trách</h3><p>Chỉ quản trị thấy các lớp này. Giao cho giáo viên để họ theo dõi học sinh và giao bài.</p>' +
      '<div class="admin-assign-list">' + unassigned.map(c => '<form class="admin-assign" data-assign="' + esc(c.code) + '"><span><b>' + esc(className(c)) + '</b><small>Mã ' + esc(c.code) + '</small></span>' +
        '<select aria-label="Giáo viên nhận ' + esc(className(c)) + '">' + teacherOptions('') + '</select><button class="btn sm primary">Giao lớp</button></form>').join('') + '</div>';
  }
  function draw() {
    drawStats(); drawUnassigned();
    const query = search.value.trim().toLocaleLowerCase('vi');
    const rows = teachers.filter(item => (item.name + ' ' + item.username + ' ' + item.classes.map(className).join(' ')).toLocaleLowerCase('vi').includes(query));
    tbody.innerHTML = rows.map(item => `<tr>
      <td data-label="Giáo viên"><strong>${esc(item.name)}</strong><small>@${esc(item.username)} · tạo ${esc(date(item.createdAt))}</small></td>
      <td data-label="Lớp phụ trách">${item.classes.length ? '<span class="admin-chips">' + item.classes.map(c => '<span class="admin-chip" title="Mã ' + esc(c.code) + '">' + esc(className(c)) + '</span>').join('') + '</span><small class="admin-sub">' + item.students + ' học sinh</small>' : '<small class="admin-sub">Chưa có lớp</small>'}</td>
      <td data-label="Đăng nhập">${esc(lastSeen(item.lastLoginAt))}</td>
      <td data-label="Trạng thái"><span class="admin-status ${item.active ? 'active' : 'inactive'}">${item.active ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
      <td data-label="Thao tác"><div class="admin-row-actions">${item.active ? `<button class="btn sm primary" data-classes-user="${esc(item.username)}">Giao lớp</button>` : ''}<button class="btn sm" data-edit-user="${esc(item.username)}">Sửa</button>
        <button class="btn sm" data-active="${esc(item.username)}" data-enabled="${!item.active}">${item.active ? 'Khóa' : 'Mở khóa'}</button>
        <button class="btn sm danger" data-delete-user="${esc(item.username)}">Xoá</button></div></td>
    </tr>`).join('');
    empty.textContent = rows.length ? '' : query ? 'Không tìm thấy tài khoản phù hợp.' : 'Chưa có tài khoản giáo viên. Tạo tài khoản đầu tiên ở khung bên trái.';
  }
  draw();
  search.addEventListener('input', draw);
  /* tên đăng nhập: tự viết thường, bỏ dấu tiếng Việt và khoảng trắng ngay khi gõ (trình duyệt chặn mẫu trước khi gửi) */
  const userInput = $('[data-create]').elements.username;
  userInput.title = 'Chỉ dùng chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch nối (3–40 ký tự).';
  userInput.addEventListener('input', () => {
    const clean = userInput.value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '');
    if (clean !== userInput.value) userInput.value = clean;
  });
  /* gợi ý tên đăng nhập từ họ tên: “Nguyễn Thị An” → nguyenthian */
  $('[data-create]').elements.name.addEventListener('change', event => {
    if (userInput.value) return;
    userInput.value = event.target.value; userInput.dispatchEvent(new Event('input'));
  });

  function showSlip(username, password) {
    const slip = $('[data-slip]'), text = loginInfo(username, password);
    slip.hidden = false;
    slip.innerHTML = '<b>Phiếu đăng nhập cho giáo viên</b><pre>' + esc(text) + '</pre><button type="button" class="btn sm">Chép phiếu</button><small>Mật khẩu chỉ hiện lúc này. Hãy chép và gửi riêng cho giáo viên.</small>';
    slip.querySelector('button').onclick = () => navigator.clipboard?.writeText(text).then(() => toast('Đã chép phiếu đăng nhập.'), () => toast('Thầy cô bôi đen rồi chép phiếu nhé.', true));
  }

  $('[data-create]').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const feedback = form.querySelector('[role="status"]');
    form.elements.username.value = form.elements.username.value.trim().toLowerCase();
    if (!form.reportValidity()) return;
    button.disabled = true;
    feedback.textContent = 'Đang tạo tài khoản…';
    try {
      const teacher = Object.fromEntries(new FormData(form));
      const result = await send('/api/admin/teachers', 'POST', teacher);
      showSlip(result.teacher.username, teacher.password);
      form.reset();
      await reload();
      feedback.textContent = 'Đã tạo tài khoản @' + result.teacher.username + '.';
    } catch (error) {
      feedback.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  /* ---- Dữ liệu thử: cùng tên học sinh với scripts/seed-demo-classrooms.js ---- */
  const demoStatus = $('[data-demo-status]');
  $('[data-demo-make]').onclick = async event => {
    const button = event.currentTarget; button.disabled = true;
    try {
      let issued = '';
      if (!teachers.some(t => t.username === DEMO.username)) {
        issued = newPassword();
        await send('/api/admin/teachers', 'POST', { username: DEMO.username, name: DEMO.name, password: issued });
      } else if (!teachers.find(t => t.username === DEMO.username).active) {
        await send('/api/admin/teachers/' + DEMO.username, 'PATCH', { active: true });
      }
      const known = new Map(((await api('/api/classes')).classes || []).map(c => [c.name, c]));
      let made = 0;
      for (let ci = 0; ci < DEMO_CLASSES.length; ci++) {
        const def = DEMO_CLASSES[ci];
        let room = known.get(def.name);
        if (!room) room = await send('/api/classes', 'POST', { name: def.name, grade: def.grade, owner: DEMO.username });
        else if (room.owner !== DEMO.username) await send('/api/classes/' + room.code, 'PATCH', { owner: DEMO.username });
        const have = new Set(((await api('/api/students?classCode=' + room.code)).students || []).map(st => st.id));
        for (let seat = 0; seat < 35; seat++) {
          const id = 'mock-hue-' + def.section + '-' + String(seat + 1).padStart(3, '0');
          if (have.has(id)) continue;
          demoStatus.textContent = 'Đang tạo ' + def.name + ': ' + (seat + 1) + '/35…';
          await send('/api/sync', 'POST', { classCode: room.code, profile: { id, name: demoName(ci, seat), grade: def.grade, avatar: DEMO_AVATARS[(seat + ci) % DEMO_AVATARS.length], xp: 0, streak: 0, attempts: 0, correct: 0, topics: {}, history: [], wrongLog: {} } });
          made++;
        }
      }
      await reload();
      demoStatus.textContent = 'Xong: 7 lớp mẫu, thêm ' + made + ' học sinh.' + (issued ? ' Mật khẩu của cô ' + DEMO.name + ' ở phiếu đăng nhập bên dưới.' : ' Tài khoản cô ' + DEMO.name + ' đã có sẵn, mật khẩu giữ nguyên (đặt lại bằng nút Sửa nếu quên).');
      if (issued) showSlip(DEMO.username, issued);
      if (issued) $('[data-slip]').scrollIntoView({ block: 'center', behavior: 'smooth' });
    } catch (error) { demoStatus.textContent = error.message; }
    finally { button.disabled = false; }
  };
  $('[data-demo-clear]').onclick = async event => {
    const button = event.currentTarget;
    if (!await confirmBox('Xoá dữ liệu mẫu?', 'Xoá 7 lớp “Mẫu … · Huệ”, học sinh hư cấu trong các lớp đó và tài khoản @' + DEMO.username + '. Lớp và học sinh thật không bị ảnh hưởng.', 'Xoá dữ liệu mẫu')) return;
    button.disabled = true;
    try {
      const names = new Set(DEMO_CLASSES.map(c => c.name));
      const rooms = ((await api('/api/classes')).classes || []).filter(c => names.has(c.name));
      for (const room of rooms) await api('/api/classes/' + room.code, { method: 'DELETE' });
      if (teachers.some(t => t.username === DEMO.username)) await api('/api/admin/teachers/' + DEMO.username, { method: 'DELETE' });
      await reload();
      demoStatus.textContent = 'Đã xoá ' + rooms.length + ' lớp mẫu và tài khoản mẫu.';
    } catch (error) { demoStatus.textContent = error.message; }
    finally { button.disabled = false; }
  };

  view.addEventListener('submit', async event => {
    const form = event.target.closest('[data-assign]');
    if (!form) return;
    event.preventDefault();
    const owner = form.querySelector('select').value;
    if (!owner) { toast('Chọn giáo viên nhận lớp trước nhé.', true); return; }
    const button = form.querySelector('button'); button.disabled = true;
    try { await send('/api/classes/' + form.dataset.assign, 'PATCH', { owner }); toast('Đã giao lớp.'); await reload(); }
    catch (error) { toast(error.message, true); button.disabled = false; }
  });

  view.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-gen')) {
      const input = button.parentElement.querySelector('input');
      input.value = newPassword(); input.focus(); input.select();
      return;
    }
    if (button.hasAttribute('data-refresh')) {
      button.disabled = true;
      try { await reload(); toast('Đã cập nhật danh sách.'); }
      catch (error) { toast(error.message, true); }
      finally { button.disabled = false; }
      return;
    }
    if (button.dataset.editUser) {
      const teacher = teachers.find(item => item.username === button.dataset.editUser);
      if (!teacher) return;
      const form = $('[data-edit-form]');
      form.elements.username.value = teacher.username;
      form.elements.name.value = teacher.name;
      form.elements.password.value = '';
      $('[data-edit-title]').textContent = 'Cập nhật ' + teacher.name;
      $('[data-edit]').showModal();
      return;
    }
    if (button.dataset.classesUser) {
      /* giao NHIỀU lớp cho một giáo viên trong một lần */
      const teacher = teachers.find(item => item.username === button.dataset.classesUser);
      if (!teacher) return;
      button.disabled = true;
      try {
        const classes = (await api('/api/classes')).classes || [];
        const ownerName = u => teachers.find(t => t.username === u)?.name;
        const form = $('[data-classes-form]');
        form.elements.username.value = teacher.username;
        $('[data-classes-title]').textContent = 'Giao lớp cho ' + teacher.name;
        $('[data-class-list]').innerHTML = classes.length ? classes.map(c => {
          const mine = c.owner === teacher.username, other = !mine && c.owner && ownerName(c.owner);
          return '<label class="admin-class-option"><input type="checkbox" value="' + esc(c.code) + '" data-owner="' + esc(c.owner || '') + '"' + (mine ? ' checked' : '') + '>' +
            '<span><b>' + esc(className(c)) + '</b><small>Mã ' + esc(c.code) + ' · ' + (mine ? 'đang phụ trách' : other ? 'đang của ' + esc(other) + ' – đánh dấu để chuyển sang' : 'chưa có giáo viên') + '</small></span></label>';
        }).join('') : '<p class="admin-note">Chưa có lớp nào. Tạo lớp ở mục <a href="#lop">Lớp học</a>.</p>';
        $('[data-classes]').showModal();
      } catch (error) { toast(error.message, true); }
      finally { button.disabled = false; }
      return;
    }
    if (button.dataset.deleteUser) {
      const teacher = teachers.find(item => item.username === button.dataset.deleteUser);
      if (!teacher) return;
      const form = $('[data-delete-form]');
      form.elements.username.value = teacher.username;
      $('[data-delete-title]').textContent = 'Xoá tài khoản ' + teacher.name + '?';
      $('[data-delete-note]').textContent = teacher.classes.length
        ? teacher.name + ' đang phụ trách ' + teacher.classes.length + ' lớp (' + teacher.students + ' học sinh). Các lớp sẽ được chuyển, học sinh và kết quả học vẫn giữ nguyên.'
        : 'Giáo viên này chưa có lớp nào. Tài khoản sẽ không đăng nhập được nữa.';
      $('[data-move-wrap]').hidden = !teacher.classes.length;
      $('[data-move]').innerHTML = teacherOptions('', teacher.username);
      $('[data-delete]').showModal();
      return;
    }
    if (button.dataset.active) {
      const locking = button.dataset.enabled !== 'true';
      const teacher = teachers.find(item => item.username === button.dataset.active);
      if (locking && !await confirmBox('Khoá ' + (teacher?.name || '') + '?', 'Giáo viên sẽ bị đăng xuất ngay trên mọi máy và không đăng nhập được cho tới khi mở khoá. Lớp và học sinh vẫn giữ nguyên.', 'Khoá tài khoản')) return;
      button.disabled = true;
      try {
        await send('/api/admin/teachers/' + encodeURIComponent(button.dataset.active), 'PATCH', { active: !locking });
        await reload();
        toast(locking ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.');
      } catch (error) {
        toast(error.message, true);
        button.disabled = false;
      }
    }
  });

  $('[data-edit-form]').addEventListener('submit', async event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[value="save"]');
    button.disabled = true;
    try {
      const password = form.elements.password.value.trim();
      const body = { name: form.elements.name.value.trim(), password };
      const result = await send('/api/admin/teachers/' + encodeURIComponent(form.elements.username.value), 'PATCH', body);
      $('[data-edit]').close();
      await reload();
      if (password) showSlip(result.teacher.username, password);
      toast(password ? 'Đã đặt lại mật khẩu. Phiếu đăng nhập mới ở khung bên trái.' : 'Đã lưu thông tin giáo viên.');
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  $('[data-classes-form]').addEventListener('submit', async event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('[value="save"]'), username = form.elements.username.value;
    const changes = [...form.querySelectorAll('input[type=checkbox]')]
      .filter(box => box.checked !== (box.dataset.owner === username))
      .map(box => ({ code: box.value, owner: box.checked ? username : '' }));
    if (!changes.length) { $('[data-classes]').close(); return; }
    button.disabled = true;
    try {
      for (const change of changes) await send('/api/classes/' + change.code, 'PATCH', { owner: change.owner });
      $('[data-classes]').close();
      await reload();
      const added = changes.filter(c => c.owner).length, removed = changes.length - added;
      toast('Đã lưu phân công' + (added ? ': giao thêm ' + added + ' lớp' : '') + (removed ? (added ? ', ' : ': ') + 'trả ' + removed + ' lớp về quản trị' : '') + '.');
    } catch (error) {
      toast(error.message, true);
      await reload().catch(() => {});
    } finally {
      button.disabled = false;
    }
  });

  $('[data-delete-form]').addEventListener('submit', async event => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('[value="delete"]');
    button.disabled = true;
    try {
      const to = form.elements.to.value;
      const result = await api('/api/admin/teachers/' + encodeURIComponent(form.elements.username.value) + '?chuyenCho=' + encodeURIComponent(to), { method: 'DELETE' });
      $('[data-delete]').close();
      await reload();
      toast(result.movedClasses ? 'Đã xoá tài khoản và chuyển ' + result.movedClasses + ' lớp.' : 'Đã xoá tài khoản.');
    } catch (error) {
      toast(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
}

register('quan-tri-giao-vien', 'Quản lý giáo viên', page);
