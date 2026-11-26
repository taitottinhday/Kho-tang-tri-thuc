/* Danh sách lớp, nhận xét và lịch sử theo từng người chơi. */
'use strict';
const ClassRoom = (() => {
  let selected = '';
  const date = value => new Date(value).toLocaleDateString('vi-VN');
  const quote = value => {
    const raw = String(value ?? '');
    return '"' + (/^[\s]*[=+\-@]/.test(raw) ? "'" : '') + raw.replace(/"/g,'""') + '"';
  };
  function panel() {
    return '<section class="project-panel"><h2>Quản lý học sinh</h2><p>Tìm học sinh để xem lịch sử, sửa hồ sơ và gửi nhận xét.</p>' +
      '<div class="btn-row"><button class="primary-btn" id="classAdd">+ Thêm học sinh</button><button class="soft-btn" id="classExport">Xuất lịch sử CSV</button></div>' +
      '<div class="lesson-filter"><label>Tìm tên<input type="search" id="studentSearch"></label><label>Khối lớp<select id="studentGrade"><option value="">Tất cả</option>' +
      ClassPractice.gradeOpts() + '</select></label></div><div id="classStudents"></div><div id="classStudentDetail"></div></section>';
  }
  function notes(p) {
    const entries = Array.isArray(p.teacherNotes) ? p.teacherNotes : [];
    return entries.map(n => '<li><time>' + esc(date(n.at)) + '</time><p>' + esc(n.text) + '</p></li>').join('');
  }
  function studentNotes(p) {
    const list = notes(p);
    return list ? '<section class="pf-card"><h2>Nhận xét của thầy cô</h2><ul class="teacher-notes">' + list + '</ul></section>' : '';
  }
  function editor(p, after) {
    openModal(p ? 'Sửa hồ sơ học sinh' : 'Thêm học sinh','Thông tin dùng trên thiết bị này.',
      '<form id="classProfileForm" class="project-form"><label>Tên học sinh<input id="className" maxlength="20" required value="' +
      esc(p?.name || '') + '"></label><label>Khối lớp<select id="classGrade">' + ClassPractice.gradeOpts(p?.grade || '1') +
      '</select></label><p id="classProfileError" role="alert"></p><button class="primary-btn">Lưu hồ sơ</button></form>');
    $('#className').focus();
    $('#classProfileForm').onsubmit = e => {
      e.preventDefault();
      const name = $('#className').value.trim(), grade = schoolGrade($('#classGrade').value);
      if (!name) { $('#classProfileError').textContent = 'Nhập tên học sinh.'; return; }
      const student = p || newProfile(name,grade);
      const prev = { name:student.name, grade:student.grade };
      Object.assign(student,{ name,grade });
      db.profiles[student.id] = student;
      try { localStorage.setItem(STORE_KEY,JSON.stringify(db)); }
      catch { if (p) Object.assign(p,prev); else delete db.profiles[student.id]; $('#classProfileError').textContent = 'Không lưu được hồ sơ trên trình duyệt.'; return; }
      selected = student.id; closeModal(); updateChrome(); after(); toast('Đã lưu hồ sơ học sinh.');
    };
  }
  function bind() {
    const g = $('#studentGrade'), s = $('#studentSearch'), list = $('#classStudents'), detail = $('#classStudentDetail');
    function filtered() {
      const text = s.value.trim().normalize('NFC').toLocaleLowerCase('vi');
      return Object.values(db.profiles).filter(p => (!g.value || p.grade === g.value) && p.name.normalize('NFC').toLocaleLowerCase('vi').includes(text));
    }
    function draw() {
      const pupils = filtered();
      list.innerHTML = pupils.map(p => '<article class="project-row"><div><b>' + esc(p.name) + '</b><small>Lớp ' + esc(p.grade) +
        ' · ' + p.history.length + ' lượt đã lưu · ' + (p.attempts ? pct(p.correct,p.attempts) + '% đúng' : 'Chưa có điểm') +
        '</small></div><button class="soft-btn" data-class-student="' + esc(p.id) + '">Xem chi tiết</button></article>').join('') || '<p>Chưa có học sinh phù hợp.</p>';
      $$('[data-class-student]',list).forEach(b => b.onclick = () => { selected = b.dataset.classStudent; drawDetail(); });
      drawDetail();
    }
    function drawDetail() {
      const p = filtered().find(p => p.id === selected);
      if (!p) { detail.innerHTML = ''; return; }
      const topics = gradeTopics(p.grade).filter(t => p.topics[t.id]?.attempts);
      detail.innerHTML = '<article class="project-detail"><div class="project-row"><h3>' + esc(p.name) +
        ' · Lớp ' + esc(p.grade) + '</h3><button class="soft-btn" id="classEditProfile">Sửa hồ sơ</button></div>' +
        '<details><summary>Kĩ năng theo chủ đề (' + topics.length + ')</summary><ul>' + topics.map(t => {
          const score = p.topics[t.id];
          return '<li>' + esc(t.ten) + ' · ' + score.correct + '/' + score.attempts + ' câu đúng</li>';
        }).join('') + '</ul></details>' +
        '<details open><summary>Lịch sử luyện tập (' + p.history.length + ')</summary><ul class="class-history">' +
        (p.history.map(h => '<li><time>' + esc(h.d) + '</time><span>' + esc(h.title || getTopic(h.topic)?.ten || KIND_LABEL[h.kind] || 'Luyện tập') +
          (h.grade ? ' · Lớp ' + esc(h.grade) : '') + '</span><b>' + esc(h.acc) + '%</b>' + (typeof h.total === 'number' ? ' · ' + h.correct + '/' + h.total : '') + '</li>').join('') || '<li>Chưa có lượt làm bài.</li>') +
        '</ul></details><form id="studentNoteForm" class="project-form"><label>Nhận xét gửi học sinh<textarea id="studentNote" required maxlength="500" rows="2"></textarea></label>' +
        '<button class="primary-btn">Lưu nhận xét</button></form><ul class="teacher-notes">' + notes(p) + '</ul></article>';
      $('#classEditProfile').onclick = () => editor(p,draw);
      $('#studentNoteForm').onsubmit = e => {
        e.preventDefault();
        const text = $('#studentNote').value.trim();
        if (!text) return;
        const previous = p.teacherNotes;
        p.teacherNotes = [{ at:Date.now(), text }, ...(Array.isArray(previous) ? previous : [])].slice(0,50);
        try { localStorage.setItem(STORE_KEY,JSON.stringify(db)); drawDetail(); toast('Đã lưu nhận xét.'); }
        catch { p.teacherNotes = previous; toast('Không lưu được nhận xét trên trình duyệt.'); }
      };
    }
    s.oninput = g.onchange = draw; draw();
    $('#classAdd').onclick = () => editor(null, () => { s.value = ''; g.value = ''; draw(); });
    $('#classExport').onclick = () => {
      const rows = [['Học sinh','Lớp của lượt làm','Ngày','Bài','Đúng %','Số câu đúng','Tổng số câu']];
      filtered().forEach(p => p.history.forEach(h => rows.push([p.name,h.grade || p.grade,h.d,
        h.title || getTopic(h.topic)?.ten || KIND_LABEL[h.kind] || 'Luyện tập',h.acc,h.correct,h.total])));
      ClassPractice.download('lich-su-vuon-chu-' + dayKey() + '.csv','\uFEFF' + rows.map(r => r.map(quote).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    };
  }
  return { panel, bind, studentNotes };
})();
