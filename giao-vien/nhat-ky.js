/* Nhật ký hoạt động (chỉ quản trị) – Claude (đợt 24). Ai làm gì, lúc nào: đăng nhập, tạo/khoá tài khoản, giao lớp,
   tạo/xoá lớp, tài liệu, giao bài, sổ nhận xét, cảnh nền. Máy chủ giữ 600 mục gần nhất; không ghi mật khẩu. */
'use strict';
(function () {
  const G = window.GV;
  const { $, esc, api, download, pageHead } = G;
  const ACTIONS = {
    login: ['Đăng nhập', 'access'], 'login.locked': ['Bị tạm khoá đăng nhập', 'risk'], 'password.self': ['Tự đổi mật khẩu', 'access'],
    'teacher.create': ['Tạo tài khoản giáo viên', 'account'], 'teacher.update': ['Sửa thông tin giáo viên', 'account'], 'teacher.password': ['Đặt lại mật khẩu giáo viên', 'risk'],
    'teacher.lock': ['Khoá tài khoản', 'risk'], 'teacher.unlock': ['Mở khoá tài khoản', 'account'], 'teacher.delete': ['Xoá tài khoản', 'risk'],
    'class.create': ['Tạo lớp', 'class'], 'class.update': ['Sửa lớp', 'class'], 'class.assign': ['Giao / chuyển lớp', 'class'], 'class.delete': ['Xoá lớp', 'risk'],
    'student.delete': ['Xoá học sinh khỏi lớp', 'risk'], 'assignment.create': ['Giao bài', 'teach'], 'assignment.delete': ['Huỷ bài đã giao', 'teach'],
    'doc.upload': ['Tải tài liệu lên', 'teach'], 'doc.publish': ['Công bố tài liệu', 'teach'], 'doc.unpublish': ['Chuyển tài liệu về nháp', 'teach'], 'doc.delete': ['Xoá tài liệu', 'risk'],
    'comments.save': ['Lưu sổ nhận xét', 'teach'], 'theme.change': ['Đổi cảnh nền học sinh', 'teach']
  };
  window.NHAT_KY_NHAN = ACTIONS; // Bảng điều khiển quản trị dùng chung nhãn
  const GROUPS = { '': 'Mọi hoạt động', access: 'Đăng nhập', account: 'Tài khoản', class: 'Lớp học', teach: 'Dạy học', risk: 'Cần chú ý' };
  const when = iso => { const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); };
  const detailOf = e => { const lesson = e.action.startsWith('assignment.create') && G.lessonById(e.detail.split(' · ')[0]); return lesson ? 'Lớp ' + lesson.lop[0] + ' – ' + lesson.ten + ' · ' + e.detail.split(' · ').slice(1).join(' · ') : e.detail; };

  async function page(v) {
    const entries = (await api('/api/admin/audit')).entries || [];
    const people = [...new Map(entries.map(e => [e.by, e.name || e.by])).entries()];
    const day = 864e5, recent = entries.filter(e => Date.now() - new Date(e.at) < 7 * day);
    v.innerHTML = pageHead('Quản trị trường', 'Nhật ký hoạt động', 'Ai đã làm gì trên trang giáo viên. Dùng để kiểm tra khi có thay đổi bất thường. Không ghi mật khẩu.', '<button class="btn" type="button" id="lgCsv">Xuất CSV</button>') +
      '<div class="kpis">' + [[recent.length, 'Hoạt động 7 ngày'], [new Set(recent.filter(e => e.action === 'login').map(e => e.by)).size, 'Người đăng nhập 7 ngày'], [recent.filter(e => (ACTIONS[e.action] || [])[1] === 'risk').length, 'Thao tác cần chú ý 7 ngày']]
        .map(([n, l]) => '<div class="kpi"><span class="kpi-label">' + l + '</span><span class="kpi-value">' + n + '</span></div>').join('') + '</div>' +
      '<div class="toolbar filter-bar"><label class="field"><span>Người thực hiện</span><select id="lgWho"><option value="">Tất cả</option>' + people.map(([u, n]) => '<option value="' + esc(u) + '">' + esc(n) + (u !== 'admin' ? ' (@' + esc(u) + ')' : '') + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Loại</span><select id="lgKind">' + Object.entries(GROUPS).map(([k, n]) => '<option value="' + k + '">' + n + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Tìm</span><input id="lgQ" type="search" placeholder="Tên lớp, tài liệu, giáo viên…"></label></div><div id="lgList"></div>';
    let shown = [];
    const draw = () => {
      const who = $('#lgWho').value, kind = $('#lgKind').value, q = $('#lgQ').value.trim().toLocaleLowerCase('vi');
      shown = entries.filter(e => (!who || e.by === who) && (!kind || (ACTIONS[e.action] || [])[1] === kind) && (!q || ((ACTIONS[e.action] || [e.action])[0] + ' ' + e.name + ' ' + detailOf(e)).toLocaleLowerCase('vi').includes(q)));
      $('#lgList').innerHTML = shown.length ? '<div class="table-wrap"><table class="log-table"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hoạt động</th><th>Chi tiết</th></tr></thead><tbody>' + shown.slice(0, 300).map(e => {
        const [label, group] = ACTIONS[e.action] || [e.action, ''];
        return '<tr><td class="log-time">' + esc(when(e.at)) + '</td><td><b>' + esc(e.name || e.by) + '</b>' + (e.by && e.by !== 'admin' ? '<br><small class="muted">@' + esc(e.by) + '</small>' : '') + '</td><td><span class="log-kind k-' + esc(group || 'none') + '">' + esc(label) + '</span></td><td class="log-detail">' + esc(detailOf(e)) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (shown.length > 300 ? '<p class="hint">Đang hiện 300/' + shown.length + ' mục. Xuất CSV để xem đủ.</p>' : '')
        : '<div class="empty">' + (entries.length ? 'Không có hoạt động phù hợp bộ lọc.' : 'Chưa có hoạt động nào được ghi. Nhật ký bắt đầu ghi từ phiên bản này.') + '</div>';
    };
    $('#lgWho').onchange = $('#lgKind').onchange = draw; $('#lgQ').oninput = draw; draw();
    $('#lgCsv').onclick = () => {
      const q = x => '"' + (/^[=+\-@]/.test(String(x)) ? "'" : '') + String(x == null ? '' : x).replace(/"/g, '""') + '"';
      const rows = [['Thời gian', 'Người thực hiện', 'Tên đăng nhập', 'Hoạt động', 'Chi tiết']].concat(shown.map(e => [when(e.at), e.name, e.by, (ACTIONS[e.action] || [e.action])[0], detailOf(e)]));
      download('nhat-ky-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
    };
  }
  G.register('nhat-ky', 'Nhật ký hoạt động', page);
})();
