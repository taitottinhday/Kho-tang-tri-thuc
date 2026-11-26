/* Nội dung thầy cô chỉnh + bài thầy cô giao – Claude Code (đợt 18). Nạp SAU app.js và dang-bai.js.
   • Thầy cô ẩn / sửa / thêm câu ở trang giáo viên → bài học của học sinh đổi theo (nhớ trên máy để dùng khi mất mạng).
   • Bài thầy cô giao cho lớp hiện ở đầu Trang học, có hạn nộp; làm xong tự đánh dấu. */
'use strict';
(function () {
  const EDIT_KEY = 'vuonchu.lessonEdits', TASK_KEY = 'vuonchu.assignments', CLASS_KEY = 'vuonchu.classCode';
  const REFRESH_MS = 5000;
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const classCode = () => { try { return localStorage.getItem(CLASS_KEY) || ''; } catch (e) { return ''; } };
  const online = () => location.protocol === 'http:' || location.protocol === 'https:';

  /* ---------- áp phần chỉnh sửa vào ngân hàng bài ---------- */
  function valid(q) {
    if (!q) return false;
    if (q.loai === 'chon') return typeof q.de === 'string' && q.de.includes('___') && Array.isArray(q.luaChon) && q.luaChon.includes(q.dapAn);
    if (q.loai === 'timLoi') return typeof q.cau === 'string' && !!q.tuSai && !!q.tuDung;
    return q.loai === 'ngheViet' && typeof q.cau === 'string';
  }
  const clean = q => q.loai === 'chon' ? { loai: 'chon', de: q.de, dapAn: q.dapAn, luaChon: q.luaChon.slice() } : q.loai === 'timLoi' ? { loai: 'timLoi', cau: q.cau, tuSai: q.tuSai, tuDung: q.tuDung } : { loai: 'ngheViet', cau: q.cau };
  function applyEdits(all) {
    ALL_TOPICS.forEach(t => {
      const e = all && all[t.id];
      if (!e) { if (t.goc) { t.baiTap = t.goc.slice(); t.sinh = t.sinhGoc; delete t.goc; delete t.sinhGoc; } return; }
      if (!t.goc) { t.goc = t.baiTap.slice(); t.sinhGoc = t.sinh; }
      const hidden = new Set((e.hidden || []).map(String)), list = [];
      t.goc.forEach((b, i) => {
        if (hidden.has(String(i))) return;
        const changed = e.edits && e.edits[i];
        list.push(Object.assign(valid(changed) ? clean(changed) : Object.assign({}, b), { _k: i }));
      });
      (e.added || []).forEach(a => { if (valid(a) && !hidden.has(a.id)) list.push(Object.assign(clean(a), { _k: a.id, cuaThayCo: true })); });
      t.baiTap = list;
      t.sinh = e.noGen ? [] : t.sinhGoc;
    });
  }

  /* Câu thầy cô thêm luôn có mặt trong bài học (tối đa 4 câu mỗi lượt, mức Khó lấy tất cả) */
  const baseBuild = buildLesson;
  window.buildLesson = function (t, level, grade = S.grade) {
    const list = baseBuild(t, level, grade);
    const own = t.baiTap.map((b, i) => Object.assign({}, b, { _t: t.id, _i: i })).filter(b => b.cuaThayCo && !(b.loai === 'ngheViet' && Number(grade) < 2));
    if (!own.length) return list;
    const rest = list.filter(it => !(typeof it._i === 'number' && t.baiTap[it._i] && t.baiTap[it._i].cuaThayCo && it.loai === t.baiTap[it._i].loai));
    const take = shuffle(own).slice(0, level === 'kho' ? own.length : 4);
    take.forEach((x, k) => rest.splice(Math.min(rest.length, 1 + k * 2), 0, x));
    return rest;
  };

  /* ---------- bài thầy cô giao ---------- */
  const tasks = () => classCode() && (typeof GUEST_MODE === 'undefined' || !GUEST_MODE) ? read(TASK_KEY, []).filter(a => a.classCode === classCode()) : [];
  const doneAt = a => (S.history || []).reduce((best, h) => {
    const matches = h.kind === 'lesson' && h.topic === a.topic && (h.assignmentId === a.id ||
      (!a.explicitSubmission && !h.assignmentId && (h.at || 0) >= a.createdAt));
    return matches && (!best || h.acc > best.acc) ? h : best;
  }, null);
  const dueText = d => { if (!d) return ''; const [y, m, day] = d.split('-').map(Number); const left = Math.round((new Date(y, m - 1, day) - new Date(new Date().toDateString())) / 864e5); return left < 0 ? 'Đã quá hạn ' + day + '/' + m : left === 0 ? 'Hạn hôm nay' : left === 1 ? 'Hạn ngày mai' : 'Hạn ' + day + '/' + m; };
  function taskCard() {
    const list = tasks().map(a => ({ a, t: getTopic(a.topic), done: doneAt(a) })).filter(x => x.t && x.t.lop[0] <= 3);
    const todo = list.filter(x => !x.done), done = list.filter(x => x.done).slice(0, 3);
    if (!list.length) return '';
    const row = x => '<li class="nd-task' + (x.done ? ' done' : '') + '"><span class="nd-ico" aria-hidden="true">' + (x.done ? '✅' : '📌') + '</span><div class="nd-info"><b>' + esc('Lớp ' + x.t.lop[0] + ' · ' + x.t.ten) + '</b>' +
      '<small>' + (x.done ? 'Em đã làm: đúng ' + x.done.acc + '%' : (dueText(x.a.due) || 'Thầy cô giao')) + (x.a.note ? ' · “' + esc(x.a.note) + '”' : '') + '</small></div>' +
      '<button type="button" class="' + (x.done ? 'soft-btn' : 'primary-btn') + ' sm" data-task="' + esc(x.a.topic) + '" data-assignment="' + esc(x.a.id) + '">' + (x.done ? 'Làm lại' : 'Làm ngay') + '</button></li>';
    return '<section class="nd-tasks" aria-label="Bài thầy cô giao"><h2>📬 Bài thầy cô giao' + (todo.length ? ' <span>' + todo.length + '</span>' : '') + '</h2><ul>' + todo.concat(done).map(row).join('') + '</ul></section>';
  }
  async function openTask(button) {
    button.disabled = true;
    await refresh();
    const a = tasks().find(task => task.id === button.dataset.assignment);
    if (!a) { toast('Thầy cô đã thu hồi bài này.'); return; }
    const t = getTopic(a.topic);
    if (t) showIntro(t, null, a.id);
    if (button.isConnected) button.disabled = false;
  }
  let lastTaskHtml;
  function drawTasks(view) {
    if ((view || currentView) !== 'home') return;
    const current = document.querySelector('.nd-tasks');
    const html = taskCard(), anchor = document.querySelector('.voyage-actions');
    if (!anchor || (current && lastTaskHtml === html)) return;
    const focused = current?.contains(document.activeElement) ? document.activeElement.dataset.assignment : '';
    current?.remove();
    lastTaskHtml = html;
    if (!html) return;
    anchor.insertAdjacentHTML('beforebegin', html);
    const section = document.querySelector('.nd-tasks');
    section.querySelectorAll('[data-task]').forEach(b => {
      b.onclick = () => openTask(b);
      if (b.dataset.assignment === focused) b.focus({ preventScroll: true });
    });
  }

  /* ---------- tải từ máy chủ ---------- */
  let pendingEdits = read(EDIT_KEY, {}), appliedEdits, inFlight;
  function applyPending() {
    if (!Q && appliedEdits !== pendingEdits) {
      applyEdits(pendingEdits);
      appliedEdits = pendingEdits;
    }
  }
  AFTER_RENDER.push(view => { applyPending(); drawTasks(view); });
  async function load(path) {
    try {
      const r = await fetch(path, { cache: 'no-store', signal: AbortSignal.timeout?.(2500) });
      return r.ok ? await r.json() : null;
    } catch { return null; }
  }
  async function pull() {
    const code = classCode();
    const [lessons, assigned] = await Promise.all([
      load('api/lessons'), code ? load('api/assignments?classCode=' + encodeURIComponent(code)) : null
    ]);
    if (lessons && JSON.stringify(lessons.edits) !== JSON.stringify(pendingEdits)) {
      pendingEdits = lessons.edits || {};
      write(EDIT_KEY, pendingEdits);
    }
    if (assigned && code === classCode() && JSON.stringify(assigned.assignments || []) !== JSON.stringify(read(TASK_KEY, []))) {
      write(TASK_KEY, assigned.assignments || []);
    }
    applyPending();
    drawTasks();
  }
  function refresh() {
    if (!online()) return Promise.resolve();
    if (!inFlight) inFlight = pull().finally(() => { inFlight = null; });
    return inFlight;
  }
  applyPending();
  render();
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  addEventListener('online', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.NoiDung = { applyEdits, refresh, tasks };
})();
