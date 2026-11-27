/* API, kho câu hỏi và đồng bộ hồ sơ với máy chủ lớp học. */
'use strict';
const MayChu = (() => {
  const TOKEN_KEY = 'vuonchu.teacherToken';
  const CLASS_KEY = 'vuonchu.classCode';
  const QUEUE_KEY = 'vuonchu.syncQueue';
  let token = sessionStorage.getItem(TOKEN_KEY) || '';
  let serverQuestions = [];
  let syncTimer = 0;
  let selectedTab = 'students';
  let selectedStudent = '';
  let selectedClass = '';
  let statusData = { storage: 'file' };
  const lastSyncedHistory = new Map();

  const escText = value => typeof esc === 'function' ? esc(value) : String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const headers = () => token ? { Authorization: 'Bearer ' + token } : {};
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
    const type = response.headers.get('content-type') || '';
    const body = type.includes('application/json') ? await response.json() : await response.arrayBuffer();
    if (!response.ok) throw Object.assign(Error(body?.error || 'Máy chủ chưa phản hồi. Thầy cô thử lại nhé.'), { status: response.status });
    return body;
  }
  const post = (url, body, signal) => request(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body), signal });
  function statusLabel() {
    if (statusData.storage === 'postgres') return '<b class="cloud-ok">Đã nối PostgreSQL</b><span>Kho câu hỏi, tài liệu và hồ sơ sẽ dùng chung trên các thiết bị.</span>';
    return '<b class="cloud-file">Đang lưu tạm bằng tệp</b><span>Thầy hãy gắn PostgreSQL trong Railway để dữ liệu bền vững sau khi khởi động lại.</span>';
  }
  function teacherPanel() {
    const signedIn = Boolean(token);
    return '<section class="project-panel cloud-panel" id="cloudPanel"><div class="cloud-head"><div><h2>☁️ Máy chủ lớp học</h2><p id="cloudStatus">Đang kiểm tra máy chủ…</p></div>' +
      (signedIn ? '<button class="soft-btn" id="cloudLogout">Đăng xuất</button>' : '') + '</div>' +
      (!signedIn ? '<form class="cloud-login" id="cloudLogin"><label>Tên đăng nhập<input id="cloudUser" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Quản trị: để trống"></label><label>Mật khẩu<input id="cloudPassword" type="password" autocomplete="current-password" required></label><button class="primary-btn">Đăng nhập máy chủ</button><p id="cloudLoginMessage" role="status"></p></form>' : '') +
      '<div class="cloud-class"><div><b>Mã lớp đang kết nối</b><span id="cloudCodeValue">' + escText(localStorage.getItem(CLASS_KEY) || 'Chưa kết nối') + '</span></div>' +
      (signedIn ? '<button class="primary-btn" id="cloudCreateClass">Tạo mã lớp</button>' : '') +
      '<form id="cloudJoin" class="cloud-join"><label>Kết nối máy này với lớp<input id="cloudClassCode" inputmode="latin" maxlength="6" autocomplete="off" placeholder="Ví dụ: AB23CD" value="' + escText(localStorage.getItem(CLASS_KEY) || '') + '"></label><button class="soft-btn">Kết nối / đồng bộ</button></form></div>' +
      (signedIn ? '<div class="cloud-tabs" role="tablist"><button type="button" data-cloud-tab="students" aria-selected="true">Học sinh</button><button type="button" data-cloud-tab="questions" aria-selected="false">Câu hỏi</button><button type="button" data-cloud-tab="docs" aria-selected="false">Tài liệu</button></div>' +
        '<div id="cloudTabBody" class="cloud-tab-body"><p>Chọn một mục để xem dữ liệu trên máy chủ.</p></div>' : '') + '</section>';
  }
  async function refreshStatus() {
    try { statusData = await request('/api/status'); }
    catch { statusData = { storage: 'offline' }; }
    const el = document.querySelector('#cloudStatus');
    if (el) el.innerHTML = statusData.storage === 'offline' ? '<b class="cloud-file">Chưa kết nối được máy chủ</b><span>Em vẫn học được; dữ liệu sẽ chờ mạng để đồng bộ.</span>' : statusLabel();
  }
  async function login(event) {
    event.preventDefault();
    const form = document.querySelector('#cloudLogin'), message = document.querySelector('#cloudLoginMessage'), button = form.querySelector('button');
    button.disabled = true; message.textContent = 'Đang đăng nhập…';
    try {
      const result = await post('/api/login', { username: (document.querySelector('#cloudUser')?.value || '').trim(), password: document.querySelector('#cloudPassword').value });
      token = result.token; sessionStorage.setItem(TOKEN_KEY, token); render();
    } catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; }
  }
  function logout() { token = ''; sessionStorage.removeItem(TOKEN_KEY); render(); }
  function render() { if (typeof currentView === 'string' && currentView === 'teacher') window.render?.(); }

  function csvTemplate() {
    const topics = typeof myTopics === 'function' ? myTopics() : [];
    if (!topics.length) throw Error('Chưa đọc được danh sách chủ đề. Hãy tải lại trang rồi thử lại.');
    const sep = ';', quote = v => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = [
      ['dang','chu_de','lop','de_bai','dap_an','lua_chon','giai_thich','cong_bo'],
      ['choice',topics[0].id,'1','Em dùng gì để cắt giấy?','cái kéo','cái kéo|cái céo','Đáp án đúng có dấu hỏi ngã phù hợp.','nháp'],
      ['fill',(topics[1] || topics[0]).id,'1|2','Bé đội ___ón khi ra nắng.','n','','Điền chữ còn thiếu vào đúng một chỗ trống.','nháp'],
      ['listen',(topics[2] || topics[0]).id,'2','Nghe rồi viết lại từ ngữ.','gia đình','','Thầy cô có thể đọc từ cho học sinh.','nháp']
    ];
    return '\uFEFF' + rows.map(row => row.map(quote).join(sep)).join('\r\n');
  }
  function download(name, content, mime) {
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([content], { type:mime }));
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  const dateText = value => { try { return new Date(value).toLocaleString('vi-VN'); } catch { return '—'; } };
  const csvCell = value => '"' + String(value ?? '').replace(/^[\s]*([=+\-@])/, "'$1").replace(/"/g,'""') + '"';
  function csvStudents(students) {
    const rows = [['Mã lớp','Học sinh','Lớp','XP','Chuỗi ngày','Đúng %','Bài xong','Lần học gần nhất']];
    students.forEach(s => rows.push([s.classCode,s.name,s.grade,s.xp,s.streak,s.attempts ? Math.round(s.correct / s.attempts * 100) : 0,
      Object.values(s.topics || {}).filter(t => t.done).length, s.history?.[0]?.d || '']));
    download('hoc-sinh-vuon-chu.csv','\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
  }
  async function drawStudents(container) {
    const code = localStorage.getItem(CLASS_KEY) || '';
    const data = await request('/api/students' + (code ? '?classCode=' + encodeURIComponent(code) : ''));
    const students = data.students || [];
    container.innerHTML = '<div class="cloud-actions"><p>' + (code ? 'Mã lớp ' + escText(code) + ' · ' : '') + students.length + ' học sinh trên máy chủ.</p><button class="soft-btn" id="cloudStudentsCsv">Xuất CSV</button></div>' +
      (students.length ? '<div class="cloud-students">' + students.map(s => '<article class="cloud-student"><div class="cloud-student-head"><div><b>' + escText(s.avatar || '🧸') + ' ' + escText(s.name) + ' · Lớp ' + escText(s.grade) + '</b><small>⭐ ' + Number(s.xp || 0) + ' XP · 🔥 ' + Number(s.streak || 0) + ' ngày · ' + (s.attempts ? Math.round(s.correct / s.attempts * 100) + '% đúng' : 'Chưa có lượt học') + ' · ' + Object.values(s.topics || {}).filter(t => t.done).length + ' bài xong · học gần nhất ' + escText(s.history?.[0]?.d || '—') + '</small></div><button type="button" class="soft-btn" data-cloud-student="' + escText(s.classCode + '|' + s.id) + '">Xem</button></div></article>').join('') + '</div>' : '<p>Chưa có học sinh. Trên thiết bị học sinh, nhập mã lớp để kết nối.</p>') + '<div id="cloudStudentDetail"></div>';
    document.querySelector('#cloudStudentsCsv').onclick = () => csvStudents(students);
    container.querySelectorAll('[data-cloud-student]').forEach(button => button.onclick = () => {
      const [studentClass,id] = button.dataset.cloudStudent.split('|'); selectedStudent = id; selectedClass = studentClass;
      const s = students.find(row => row.id === id && row.classCode === studentClass); if (!s) return;
      const detail = document.querySelector('#cloudStudentDetail');
      detail.innerHTML = '<article class="cloud-detail"><div class="cloud-detail-head"><h3>' + escText(s.name) + ' · Lớp ' + escText(s.grade) + '</h3><button type="button" class="soft-btn danger" id="cloudDeleteStudent">Xoá trên máy chủ</button></div>' +
        '<details open><summary>Lịch sử gần đây</summary><ul>' + (s.history || []).map(h => '<li>' + escText(h.d) + ' · ' + escText(h.title || h.kind || 'Luyện tập') + ' · ' + Number(h.correct || 0) + '/' + Number(h.total || 0) + ' (' + Number(h.acc || 0) + '%)</li>').join('') + '</ul></details>' +
        '<details><summary>Từ hay sai</summary><ul>' + Object.entries(s.wrongLog || {}).sort((a,b) => b[1]-a[1]).slice(0,50).map(([word,n]) => '<li>' + escText(word) + ' · sai ' + Number(n) + ' lần</li>').join('') + '</ul></details>' +
        '<form id="cloudNoteForm" class="cloud-note-form"><label>Gửi nhận xét cho học sinh<textarea id="cloudNote" rows="2" maxlength="500" required></textarea></label><button class="primary-btn">Gửi nhận xét</button></form><ul class="teacher-notes">' + (s.teacherNotes || []).map(n => '<li><time>' + escText(dateText(n.at)) + '</time><p>' + escText(n.text) + '</p></li>').join('') + '</ul></article>';
      document.querySelector('#cloudNoteForm').onsubmit = async e => {
        e.preventDefault(); const note = document.querySelector('#cloudNote').value.trim(); if (!note) return;
        try { await post('/api/students/' + encodeURIComponent(studentClass) + '/' + encodeURIComponent(id) + '/notes',{ text:note }); await drawStudents(container); selectedStudent = ''; toast('Đã gửi nhận xét. Học sinh sẽ nhận khi máy đồng bộ.'); }
        catch (error) { toast(error.message); }
      };
      document.querySelector('#cloudDeleteStudent').onclick = async () => {
        if (!confirm('Xoá hồ sơ ' + s.name + ' khỏi máy chủ lớp?')) return;
        try { await request('/api/students/' + encodeURIComponent(studentClass) + '/' + encodeURIComponent(id),{ method:'DELETE' }); await drawStudents(container); toast('Đã xoá học sinh khỏi máy chủ.'); }
        catch (error) { toast(error.message); }
      };
    });
    if (selectedStudent) container.querySelector('[data-cloud-student]')?.click();
  }
  async function downloadCsvTemplate() {
    try { download('mau-cau-hoi-vuon-chu.csv',csvTemplate(),'text/csv;charset=utf-8'); }
    catch (error) { toast(error.message); }
  }
  async function drawQuestions(container) {
    const data = await request('/api/questions'); const questions = data.questions || [];
    serverQuestions = questions;
    container.innerHTML = '<div class="cloud-actions"><p>' + questions.filter(q => q.active).length + ' câu đã công bố · ' + questions.filter(q => !q.active).length + ' câu nháp.</p><button class="soft-btn" id="cloudCsvTemplate">Tải mẫu CSV</button><button class="soft-btn" id="cloudJsonTemplate">Tải mẫu JSON</button></div>' +
      '<div class="cloud-import"><label>Nhập tệp câu hỏi (.csv hoặc .json)<input type="file" id="cloudQuestionFile" accept=".csv,.json,text/csv,application/json"></label><p id="cloudQuestionMessage" role="status"></p></div>' +
      '<button class="primary-btn" id="cloudPublishAll">Công bố tất cả câu nháp</button><div class="cloud-question-list">' + questions.map(q => '<article class="cloud-question"><div><b>' + escText(q.prompt) + '</b><small>' + escText(q.topic) + ' · Lớp ' + (q.grades || []).join(', ') + ' · ' + (q.active ? 'Đã công bố' : 'Bản nháp') + '</small></div><button class="soft-btn danger" data-question-delete="' + escText(q.id) + '">Xoá</button></article>').join('') + (questions.length ? '' : '<p>Chưa có câu hỏi trên máy chủ.</p>') + '</div>';
    document.querySelector('#cloudCsvTemplate').onclick = downloadCsvTemplate;
    document.querySelector('#cloudJsonTemplate').onclick = () => download('mau-cau-hoi-vuon-chu.json',JSON.stringify([{type:'choice',topic:(myTopics()[0] || {}).id || 'ma-chu-de',grades:[1],prompt:'Em dùng gì để cắt giấy?',answer:'cái kéo',choices:['cái kéo','cái céo'],note:'',active:false}],null,2),'application/json');
    document.querySelector('#cloudPublishAll').onclick = async () => {
      try { const r = await post('/api/questions/publish',{}); await drawQuestions(container); toast('Đã công bố ' + r.published + ' câu hỏi.'); }
      catch (error) { toast(error.message); }
    };
    container.querySelectorAll('[data-question-delete]').forEach(button => button.onclick = async () => {
      if (!confirm('Xoá câu hỏi này khỏi máy chủ?')) return;
      try { await request('/api/questions/' + encodeURIComponent(button.dataset.questionDelete),{ method:'DELETE' }); await drawQuestions(container); toast('Đã xoá câu hỏi.'); }
      catch (error) { toast(error.message); }
    });
    document.querySelector('#cloudQuestionFile').onchange = async event => {
      const file = event.target.files[0]; if (!file) return;
      const message = document.querySelector('#cloudQuestionMessage');
      try {
        if (file.size > 3 * 1024 * 1024) throw Error('Tệp nhập không được quá 3 MB.');
        const content = await file.text(); let result;
        if (file.name.toLowerCase().endsWith('.csv')) result = await request('/api/questions',{ method:'POST', headers:{'Content-Type':'text/csv; charset=utf-8'}, body:content });
        else result = await post('/api/questions',JSON.parse(content.replace(/^\uFEFF/,'')));
        const errors = result.errors || [];
        message.innerHTML = 'Đã nhập ' + (result.imported ?? result.saved ?? 0) + ' câu ở dạng bản nháp.' + (errors.length ? '<ul>' + errors.map(e => '<li>' + escText(e.message) + '</li>').join('') + '</ul>' : '');
        await drawQuestions(container);
        const newMessage = document.querySelector('#cloudQuestionMessage'); if (newMessage) newMessage.innerHTML = 'Đã nhập ' + (result.imported ?? result.saved ?? 0) + ' câu ở dạng bản nháp.' + (errors.length ? '<ul>' + errors.map(e => '<li>' + escText(e.message) + '</li>').join('') + '</ul>' : '');
      } catch (error) { message.textContent = error instanceof SyntaxError ? 'Tệp JSON chưa đúng cú pháp.' : error.message; }
      event.target.value = '';
    };
  }
  async function fileAsDataUrl(file) { return new Promise((resolve,reject) => { const reader = new FileReader(); reader.onerror = () => reject(Error('Không đọc được tệp.')); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }); }
  async function drawDocs(container, teacher = false) {
    const result = await request('/api/docs'); const docs = result.documents || [];
    if (teacher) {
      container.innerHTML = '<div class="cloud-import"><h3>Tải tài liệu lên</h3><form id="cloudDocForm" class="cloud-doc-form"><label>Tên tài liệu<input id="cloudDocTitle" maxlength="180" placeholder="Ví dụ: Phiếu luyện dấu hỏi, dấu ngã" required></label><div class="cloud-doc-fields"><label>Lớp<select id="cloudDocGrade"><option value="chung">Dùng chung</option><option value="1">Lớp 1</option><option value="2">Lớp 2</option><option value="3">Lớp 3</option></select></label><label>Mã chủ đề (nếu có)<select id="cloudDocTopic"><option value="">Không chọn</option>' + (typeof myTopics === 'function' ? myTopics().map(t => '<option value="' + escText(t.id) + '">' + escText(t.ten) + '</option>').join('') : '') + '</select></label></div><label>Ghi chú<textarea id="cloudDocNote" maxlength="500" rows="2"></textarea></label><label>Tệp (tối đa 10 MB)<input id="cloudDocFile" type="file" accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.mp3,application/pdf,image/png,image/jpeg,image/webp,audio/mpeg" required></label><label class="project-check"><input id="cloudDocPublished" type="checkbox"> Công bố cho học sinh</label><button class="primary-btn">Tải tài liệu lên</button><p id="cloudDocMessage" role="status"></p></form></div>' +
        '<h3>Thư viện trên máy chủ</h3>' + docRows(docs,true);
      document.querySelector('#cloudDocForm').onsubmit = async e => {
        e.preventDefault(); const file = document.querySelector('#cloudDocFile').files[0], message = document.querySelector('#cloudDocMessage'), button = e.submitter;
        if (!file) return; if (file.size > 10 * 1024 * 1024) { message.textContent = 'Tệp không được quá 10 MB.'; return; }
        button.disabled = true;
        try {
          const saved = await post('/api/docs',{ name:file.name,title:document.querySelector('#cloudDocTitle').value,grade:document.querySelector('#cloudDocGrade').value,
            topic:document.querySelector('#cloudDocTopic').value,note:document.querySelector('#cloudDocNote').value,published:document.querySelector('#cloudDocPublished').checked,data:await fileAsDataUrl(file) });
          await drawDocs(container,true); const msg = document.querySelector('#cloudDocMessage'); if (msg) msg.textContent = 'Đã tải lên ' + saved.document.name + '.';
        } catch (error) { message.textContent = error.message; }
        finally { button.disabled = false; }
      };
      container.querySelectorAll('[data-doc-delete]').forEach(button => button.onclick = async () => {
        if (!confirm('Xoá tài liệu này khỏi máy chủ?')) return;
        try { await request('/api/docs/' + encodeURIComponent(button.dataset.docDelete),{ method:'DELETE' }); await drawDocs(container,true); toast('Đã xoá tài liệu.'); }
        catch (error) { toast(error.message); }
      });
      container.querySelectorAll('[data-doc-download]').forEach(button => button.onclick = () => downloadDoc(button.dataset.docDownload,button.dataset.docName));
      return;
    }
    const shown = docs.filter(d => d.published !== false);
    container.innerHTML = shown.length ? docRows(shown,false) : '<p>Thầy cô chưa công bố tài liệu nào.</p>';
    container.querySelectorAll('[data-doc-download]').forEach(button => button.onclick = () => downloadDoc(button.dataset.docDownload,button.dataset.docName));
  }
  function docRows(docs, teacher) {
    return '<div class="cloud-doc-list">' + docs.map(d => '<article class="cloud-doc"><div><b>📚 ' + escText(d.title || d.name) + '</b><small>Lớp ' + (d.grade === 'chung' ? 'nào cũng dùng' : escText(d.grade)) + (d.topic ? ' · ' + escText((typeof getTopic === 'function' && getTopic(d.topic) || {}).ten || d.topic) : '') + ' · ' + (Number(d.size || 0) / 1024 / 1024).toFixed(2) + ' MB' + (teacher ? ' · ' + (d.published ? 'Đã công bố' : 'Bản nháp') : '') + '</small>' + (d.note ? '<span>' + escText(d.note) + '</span>' : '') + '</div><div class="cloud-doc-actions">' + (teacher ? '<button type="button" class="soft-btn" data-doc-download="' + escText(d.id) + '" data-doc-name="' + escText(d.name) + '">Tải về</button><button type="button" class="soft-btn danger" data-doc-delete="' + escText(d.id) + '">Xoá</button>' : '<a class="soft-btn" href="/api/docs/' + encodeURIComponent(d.id) + '" target="_blank" rel="noopener">Mở tài liệu</a>') + '</div></article>').join('') + '</div>';
  }
  async function downloadDoc(id,name) {
    try { const bytes = await request('/api/docs/' + encodeURIComponent(id)); const blob = new Blob([bytes]); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href),1000); }
    catch (error) { toast(error.message); }
  }
  async function drawTab() {
    const body = document.querySelector('#cloudTabBody'); if (!body || !token) return;
    body.innerHTML = '<p>Đang tải dữ liệu…</p>';
    try {
      if (selectedTab === 'students') await drawStudents(body);
      else if (selectedTab === 'questions') await drawQuestions(body);
      else await drawDocs(body,true);
    } catch (error) { body.innerHTML = '<p role="alert">' + escText(error.message) + '</p>'; }
  }
  async function connectClass(code, profiles) {
    if (typeof GUEST_MODE !== 'undefined' && GUEST_MODE) throw Error('Em hãy mở hồ sơ của mình để kết nối lớp nhé.');
    const cleanCode = String(code || '').toUpperCase().replace(/\s/g,'');
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(cleanCode)) throw Error('Mã lớp gồm 6 kí tự, không dùng 0, O, 1 hoặc I.');
    const list = profiles || (typeof db !== 'undefined' ? Object.values(db.profiles || {}) : []);
    if (!list.length) throw Error('Chưa tìm thấy hồ sơ học sinh trên máy này.');
    const joined = [];
    try {
      for (const profile of list) {
        const payload = { classCode: cleanCode, profile: profileSummary(profile) };
        joined.push([payload, await post('/api/sync', payload, AbortSignal.timeout?.(5000))]);
      }
    } catch (error) {
      if (!error.status) throw Error('Chưa kết nối được. Em kiểm tra mạng rồi nhập lại mã lớp nhé.');
      throw error;
    }
    localStorage.setItem(CLASS_KEY,cleanCode);
    joined.forEach(([payload, result]) => acceptProfile(payload, result));
    window.NoiDung?.refresh();
    return cleanCode;
  }
  function profileSummary(p) {
    const topics = {};
    for (const [key,value] of Object.entries(p.topics || {})) topics[key] = { stars:value.stars || 0,best:value.best || 0,attempts:value.attempts || 0,correct:value.correct || 0,done:!!value.done };
    const wrongLog = {};
    for (const [key,value] of Object.entries(p.wrongLog || {}).slice(0,50)) {
      const item = typeof itemOf === 'function' ? itemOf(key) : null;
      const label = item && typeof itemWord === 'function' ? itemWord(item) : key;
      wrongLog[label] = (wrongLog[label] || 0) + (Number(value) || 0);
    }
    return { id:p.id,name:p.name,grade:p.grade,avatar:p.avatar,xp:p.xp,streak:p.streak,bestStreak:p.bestStreak,lastDay:p.lastDay,
      attempts:p.attempts,correct:p.correct,topics,history:(p.history || []).slice(0,60),wrongLog };
  }
  function readQueue() { try { const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); return Array.isArray(q) ? q : []; } catch { return []; } }
  function queuePayload(payload) {
    const queue = readQueue().filter(q => !(q.classCode === payload.classCode && q.profile?.id === payload.profile?.id)); queue.push(payload);
    localStorage.setItem(QUEUE_KEY,JSON.stringify(queue.slice(-50)));
  }
  const activeSyncs = new Map();
  const syncKey = (code, id) => code + ':' + id;
  function forgetPayload(payload) {
    const snapshot = JSON.stringify(payload);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(readQueue().filter(q => JSON.stringify(q) !== snapshot)));
  }
  function acceptProfile(payload, result) {
    const key = syncKey(payload.classCode, payload.profile.id);
    lastSyncedHistory.set(key, historyStamp(payload.profile));
    const local = typeof db !== 'undefined' ? db.profiles?.[payload.profile.id] : null;
    const notes = result.teacherNotes || [];
    if (local && localStorage.getItem(CLASS_KEY) === payload.classCode && JSON.stringify(local.teacherNotes || []) !== JSON.stringify(notes)) {
      local.teacherNotes = notes;
      try { localStorage.setItem(STORE_KEY,JSON.stringify(db)); } catch {}
      if (typeof currentView === 'string' && currentView === 'profile' && db.current === local.id) window.render?.();
    }
  }
  async function transmit(payload) {
    const result = await post('/api/sync',payload,AbortSignal.timeout?.(6000));
    acceptProfile(payload, result);
    forgetPayload(payload);
    return result;
  }
  async function sendProfile(code,p) {
    if (typeof GUEST_MODE !== 'undefined' && GUEST_MODE) return { skipped:true };
    const payload = { classCode:code,profile:profileSummary(p) };
    queuePayload(payload);
    return sendQueued(payload);
  }
  async function sendQueued(payload) {
    const key = syncKey(payload.classCode, payload.profile.id);
    if (activeSyncs.has(key)) return activeSyncs.get(key);
    const work = transmit(payload);
    activeSyncs.set(key, work);
    try {
      const result = await work;
      if (readQueue().some(q => syncKey(q.classCode, q.profile.id) === key)) setTimeout(flushQueue, 100);
      return result;
    } catch (error) {
      if (!error.status || error.status >= 500 || error.status === 429) return { queued:true };
      forgetPayload(payload);
      throw error;
    } finally { activeSyncs.delete(key); }
  }
  async function flushQueue() {
    if (!navigator.onLine) return;
    const queue = readQueue(); if (!queue.length) return;
    for (const payload of queue) {
      try {
        await sendQueued(payload);
      } catch { /* tiếp tục gửi hồ sơ khác */ }
    }
  }
  function historyStamp(p) { return JSON.stringify([p.history?.length || 0,p.history?.[0] || null]); }
  function scheduleSync() {
    clearTimeout(syncTimer);
    if (typeof GUEST_MODE !== 'undefined' && GUEST_MODE) return;
    const code = localStorage.getItem(CLASS_KEY);
    if (!code || typeof db === 'undefined' || !db.profiles?.[db.current]) return;
    const profile = db.profiles[db.current];
    if (lastSyncedHistory.get(syncKey(code, profile.id)) === historyStamp(profile)) return;
    queuePayload({ classCode: code, profile: profileSummary(profile) });
    syncTimer = setTimeout(flushQueue, 400);
  }
  function installSaveHook() {
    if (typeof window.save !== 'function' || window.save.__cloudHook) return;
    const original = window.save;
    const wrapped = function (...args) { const result = original.apply(this,args); scheduleSync(); return result; };
    wrapped.__cloudHook = true; window.save = wrapped;
  }
  let questionRequest;
  function loadQuestions() {
    if (!questionRequest) questionRequest = fetchQuestions().finally(() => { questionRequest = null; });
    return questionRequest;
  }
  async function fetchQuestions() {
    try {
      const result = await request('/api/questions', { cache: 'no-store', signal: AbortSignal.timeout?.(3000) });
      serverQuestions = (result.questions || []).filter(q => q.active !== false);
      if (typeof db !== 'undefined') {
        const existing = Array.isArray(db.classQuestions) ? db.classQuestions : [];
        const saved = localStorage.getItem('vuonchu.remoteQuestionIds');
        const previous = saved === null ? existing.filter(q => /^q[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(q.id)).map(q => q.id) : JSON.parse(saved);
        const remoteIds = serverQuestions.map(q => q.id);
        const replace = new Set(previous.concat(remoteIds));
        const combined = existing.filter(q => !replace.has(q.id)).concat(serverQuestions);
        try {
          if (saved !== JSON.stringify(remoteIds)) localStorage.setItem('vuonchu.remoteQuestionIds', JSON.stringify(remoteIds));
          if (JSON.stringify(existing) !== JSON.stringify(combined)) {
            db.classQuestions = combined;
            localStorage.setItem(STORE_KEY,JSON.stringify(db));
          }
        } catch {}
      }
      return serverQuestions;
    } catch { return serverQuestions; }
  }
  function remoteQuestions() { return serverQuestions; }
  async function saveQuestions(rows) {
    if (!token || !rows?.length) return;
    try { await post('/api/questions',rows); await loadQuestions(); }
    catch (error) { toast('Chưa đồng bộ câu hỏi lên máy chủ: ' + error.message); }
  }
  function bindTeacher() {
    refreshStatus();
    const loginForm = document.querySelector('#cloudLogin'); if (loginForm) loginForm.onsubmit = login;
    document.querySelector('#cloudLogout')?.addEventListener('click',logout);
    document.querySelector('#cloudLogin')?.querySelector('#cloudPassword')?.focus();
    document.querySelectorAll('[data-cloud-tab]').forEach(button => button.onclick = () => {
      selectedTab = button.dataset.cloudTab;
      document.querySelectorAll('[data-cloud-tab]').forEach(b => b.setAttribute('aria-selected',String(b === button)));
      drawTab();
    });
    const create = document.querySelector('#cloudCreateClass');
    if (create) create.onclick = async () => {
      create.disabled = true;
      try { const result = await post('/api/classes',{}); localStorage.setItem(CLASS_KEY,result.code); document.querySelector('#cloudCodeValue').textContent = result.code; document.querySelector('#cloudClassCode').value = result.code; toast('Đã tạo mã lớp ' + result.code + '.'); }
      catch (error) { toast(error.message); } finally { create.disabled = false; }
    };
    const join = document.querySelector('#cloudJoin');
    if (join) join.onsubmit = async e => {
      e.preventDefault(); const button = join.querySelector('button'); button.disabled = true;
      try { const code = await connectClass(document.querySelector('#cloudClassCode').value); document.querySelector('#cloudCodeValue').textContent = code; toast('Đã kết nối máy này với lớp ' + code + '.'); }
      catch (error) { toast(error.message); } finally { button.disabled = false; }
    };
    if (token) drawTab();
    installSaveHook();
  }
  function docsPage() { return '<div class="docs-view"><div class="page-heading"><p class="eyebrow">THƯ VIỆN LỚP HỌC</p><h1>📚 Tài liệu của thầy cô</h1><p>Tài liệu luyện tập được thầy cô chia sẻ với lớp em.</p></div><section class="project-panel" id="publicDocs"><p>Đang tìm tài liệu…</p></section></div>'; }
  function bindDocs() { const body = document.querySelector('#publicDocs'); if (body) drawDocs(body,false).catch(() => { body.innerHTML = '<p>Mất kết nối. Em có thể thử lại sau nhé.</p>'; }); }
  function refreshCurrentProfile() {
    const code = localStorage.getItem(CLASS_KEY);
    if (code && typeof db !== 'undefined' && db.profiles?.[db.current]) sendProfile(code,db.profiles[db.current]).catch(() => {});
  }
  function init() {
    installSaveHook();
    window.addEventListener('online',flushQueue);
    setInterval(() => { flushQueue(); refreshCurrentProfile(); },60000);
    let viewingProfile = false;
    AFTER_RENDER.push(view => {
      if (view === 'profile' && !viewingProfile) refreshCurrentProfile();
      viewingProfile = view === 'profile';
    });
    setInterval(() => { if (viewingProfile && !document.hidden && navigator.onLine) refreshCurrentProfile(); },5000);
    if (typeof registerView === 'function') registerView('docs','Tài liệu của thầy cô',docsPage,bindDocs);
    if (localStorage.getItem(CLASS_KEY)) setTimeout(() => flushQueue(),1000);
  }
  init();
  function setToken(value) { token = value || ''; }
  return { setToken,teacherPanel,bindTeacher,connectClass,sendProfile,loadQuestions,remoteQuestions,saveQuestions,csvTemplate,publicDocs:docsPage,bindDocs };
})();
window.MayChu = MayChu;
