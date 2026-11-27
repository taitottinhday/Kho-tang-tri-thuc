import { accuracyOf, bandOf, labelDay, makeReport, needsSupport } from './thong-ke-data.mjs';

const { esc, load, className, lessonById, openStudent, storageWarn, register } = window.GV;
const fmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const names = new Intl.Collator('vi');
const n = value => fmt.format(value);
const rate = value => value === null ? '—' : n(value) + '%';
const nameOf = student => student.name || 'Học sinh chưa đặt tên';
const titleOf = topic => lessonById(topic.id)?.ten || topic.title || topic.id;
const dateRange = (from, to) => from === to ? labelDay(to) : `${labelDay(from)}–${labelDay(to)}`;

function change(value, previous, unit = '') {
  if (value === null || previous === null) return 'Chưa đủ dữ liệu để so sánh';
  const delta = Math.round((value - previous) * 10) / 10;
  if (!delta) return 'Bằng kỳ trước';
  return (delta > 0 ? '+' : '−') + n(Math.abs(delta)) + unit + ' so với kỳ trước';
}

function stats(data) {
  const { active, previousActive, rows, current, previous, needsSupport } = data;
  const cards = [
    ['Học sinh có lượt', `${n(active)}<small> / ${n(rows.length)}</small>`, change(active, previousActive, ' em'), 'users'],
    ['Lượt học', n(current.turns), change(current.turns, previous.turns, ' lượt'), 'turns'],
    ['Tỷ lệ trả lời đúng', rate(accuracyOf(current)), current.total
      ? `${n(current.correct)}/${n(current.total)} câu đúng · ${change(accuracyOf(current), accuracyOf(previous), ' điểm %')}`
      : 'Chưa có câu trả lời trong kỳ', 'rate'],
    ['Có thể cần hỗ trợ', n(needsSupport), 'Dưới 60% đúng sau ít nhất 10 câu', 'help']
  ];
  const icons = {
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-4m-2-11a4 4 0 0 1 0 8M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    turns: 'M3 13h4l3-8 4 14 3-6h4',
    rate: 'm4 12 5 5L20 6',
    help: 'M12 8v4m0 4h.01M10.3 4.9l-8 14A1 1 0 0 0 3.2 20h17.6a1 1 0 0 0 .9-1.5l-8-13.6a2 2 0 0 0-3.4 0Z'
  };
  return `<div class="gv-report-stats">${cards.map(([label, value, hint, key]) => `
    <article class="gv-report-stat" data-tone="${key}">
      <div><span>${label}</span><svg aria-hidden="true" viewBox="0 0 24 24"><path d="${icons[key]}"/></svg></div>
      <strong>${value}</strong><p>${hint}</p>
    </article>`).join('')}</div>`;
}

function trend(data, state) {
  const { buckets, current } = data;
  const isRate = state.metric === 'rate';
  const values = buckets.map(bucket => isRate ? accuracyOf(bucket) : bucket.turns);
  const highest = Math.max(1, ...values);
  const max = isRate ? 100 : Math.max(4, Math.ceil(highest / 4) * 4);
  const detail = bucket => {
    const date = dateRange(bucket.from, bucket.to);
    return bucket.total ? `${date} · ${n(bucket.turns)} lượt · ${n(bucket.correct)}/${n(bucket.total)} câu đúng (${rate(accuracyOf(bucket))})` : `${date} · Chưa có lượt học`;
  };
  const last = buckets.findLastIndex(bucket => bucket.turns > 0);
  const selected = state.bucket ?? last;
  return `<section class="gv-report-panel gv-report-trend">
    <div class="gv-report-heading"><div><h2>Hoạt động theo thời gian</h2><p>${state.days <= 7 ? 'Theo ngày' : state.days <= 30 ? 'Theo nhóm 3 ngày' : 'Theo nhóm 7 ngày'} · Chọn cột để xem số liệu</p></div>
      <div class="gv-report-segment" role="group" aria-label="Chỉ số biểu đồ">
        <button type="button" data-metric="turns" aria-pressed="${!isRate}">Lượt học</button>
        <button type="button" data-metric="rate" aria-pressed="${isRate}">Tỷ lệ đúng</button>
      </div></div>
    ${current.turns ? `<div class="gv-report-chart" data-metric-kind="${state.metric}">
      <div class="gv-report-axis" aria-hidden="true">${[1, .75, .5, .25, 0].map(tick => `<span>${n(max * tick)}${isRate ? '%' : ''}</span>`).join('')}</div>
      <div class="gv-report-plot" style="--columns:${buckets.length}">
        ${buckets.map((bucket, i) => `<button type="button" class="gv-report-column" data-bucket="${i}"
          aria-label="${detail(bucket)}" title="${detail(bucket)}" aria-pressed="${i === selected}">
            <span class="gv-report-column-track"><span class="gv-report-bar" style="--value:${(values[i] || 0) * 100 / max}%" ${!values[i] ? 'hidden' : ''}></span>
              ${values[i] === 0 && bucket.total ? '<span class="gv-report-zero"></span>' : ''}
            </span>
            <span class="gv-report-x-label" aria-hidden="true">${labelDay(bucket.from)}</span>
          </button>`).join('')}
      </div>
    </div><p class="gv-report-chart-note" aria-live="polite">${detail(buckets[selected])}</p>`
      : '<p class="gv-report-empty">Chưa có lượt học đã đồng bộ trong khoảng thời gian này.</p>'}
  </section>`;
}

function distribution(data, state) {
  return `<section class="gv-report-panel"><div class="gv-report-heading"><div>
    <h2>Kết quả theo học sinh</h2><p>Chọn một nhóm để lọc bảng chi tiết.</p>
  </div></div>
  <div class="gv-report-stack" aria-hidden="true">${data.ranges.filter(group => group.count).map(group =>
    `<span class="gv-report-dot ${group.tone}" style="flex-grow:${group.count}"></span>`).join('')}</div>
  <div class="gv-report-bands" role="group" aria-label="Lọc bảng học sinh theo nhóm">
    ${data.ranges.map((group, i) => `<button type="button" class="gv-report-band" data-band="${i}"
      aria-pressed="${!state.topic && state.band === String(i)}" aria-controls="gvReportStudents" ${group.count ? '' : 'disabled'}>
      <span class="gv-report-dot ${group.tone}" aria-hidden="true"></span><span>${group.label}</span><strong>${n(group.count)}</strong>
    </button>`).join('')}
  </div></section>`;
}

const enoughTopicData = topic => topic.total >= 10 && topic.students >= 2;
const forReview = topic => enoughTopicData(topic) && accuracyOf(topic) < 70;

function topics(data, state) {
  const ordered = data.topics.slice().sort((a, b) => Number(forReview(b)) - Number(forReview(a)) ||
    Number(enoughTopicData(b)) - Number(enoughTopicData(a)) ||
    accuracyOf(a) - accuracyOf(b) || b.total - a.total);
  const visible = state.moreTopics ? ordered : ordered.slice(0, 5);
  const selected = ordered.find(topic => topic.id === state.topic);
  if (selected && !visible.includes(selected)) visible[visible.length - 1] = selected;
  return `<section class="gv-report-panel"><div class="gv-report-heading"><div><h2>Kết quả theo chủ đề</h2>
    <p>Ưu tiên chủ đề đủ dữ liệu và có tỷ lệ đúng thấp.</p></div></div>
    ${visible.length ? `<div class="gv-report-topics">${visible.map(topic => {
      const score = accuracyOf(topic);
      return `<button type="button" class="gv-report-topic" data-topic="${esc(topic.id)}" aria-controls="gvReportStudents"
        aria-pressed="${state.topic === topic.id}"><span class="gv-report-topic-title"><strong>${esc(titleOf(topic))}</strong><b>${rate(score)}</b></span>
        <span class="gv-report-topic-bar" aria-hidden="true"><span class="${forReview(topic) ? 'amber' : 'green'}" style="width:${score}%"></span></span>
        <small>${n(topic.students)} em · ${n(topic.correct)}/${n(topic.total)} câu đúng${forReview(topic) ? ' · Gợi ý ôn lại' : ''}</small>
      </button>`;
    }).join('')}</div>` : '<p class="gv-report-empty">Chưa có kết quả gắn với chủ đề trong kỳ này.</p>'}
    ${ordered.length > 5 ? `<button class="gv-report-link" type="button" data-more aria-expanded="${state.moreTopics}">
      ${state.moreTopics ? 'Thu gọn' : 'Xem thêm ' + n(ordered.length - 5) + ' chủ đề'}</button>` : ''}
  </section>`;
}

function studentsPanel(data, state) {
  const topic = data.topics.find(item => item.id === state.topic);
  const group = data.ranges[state.band];
  const filtered = data.rows.flatMap((row, i) => {
    if (topic) return row.topics.has(topic.id) ? [{ ...row, ...row.topics.get(topic.id), i }] : [];
    if (group && bandOf(row) !== Number(state.band)) return [];
    return [{ ...row, i }];
  }).sort((a, b) => Number(needsSupport(b)) - Number(needsSupport(a)) ||
    Number(Boolean(b.turns)) - Number(Boolean(a.turns)) ||
    Number(b.total >= 10) - Number(a.total >= 10) ||
    (a.total >= 10 && b.total >= 10 ? accuracyOf(a) - accuracyOf(b) : 0) ||
    names.compare(nameOf(a.student), nameOf(b.student)));
  return `<section class="gv-report-panel" id="gvReportStudents"><div class="gv-report-heading"><div>
    <h2>Chi tiết học sinh</h2>
    <p aria-live="polite">${n(filtered.length)}/${n(data.rows.length)} học sinh${topic ? ' · ' + esc(titleOf(topic)) : group ? ' · ' + group.label : ''}</p></div>
    ${topic || group ? '<button type="button" class="gv-report-link" data-clear>Xóa lọc bảng</button>' : ''}
    </div>
    ${filtered.length ? `<div class="gv-report-table-wrap" tabindex="0" role="region" aria-label="Bảng kết quả học sinh">
      <table class="gv-report-table"><thead><tr><th scope="col">Học sinh</th><th scope="col">Lượt</th>
        <th scope="col">Câu đúng</th><th scope="col">Tỷ lệ đúng</th><th scope="col">Ghi chú</th></tr></thead><tbody>
      ${filtered.map(row => {
        const { student } = row;
        const label = !row.turns ? 'Chưa có lượt' : row.total < 10 ? 'Dưới 10 câu' : needsSupport(row) ? 'Có thể cần hỗ trợ' : '—';
        return `<tr><th scope="row"><button class="gv-report-student" type="button" data-student="${row.i}">${esc(nameOf(student))}</button>
          <span>${esc(className(student.classCode))}</span></th><td>${n(row.turns)}</td><td>${row.total ? n(row.correct) + '/' + n(row.total) : '—'}</td>
          <td><strong>${rate(accuracyOf(row))}</strong></td><td><span class="gv-report-row-note ${needsSupport(row) ? 'warn' : ''}">${label}</span></td></tr>`;
      }).join('')}</tbody></table></div>` : '<p class="gv-report-empty">Chưa có học sinh thuộc phạm vi này.</p>'}
  </section>`;
}

async function page(view) {
  view.innerHTML = '<section class="gv-report" aria-busy="true"><p class="gv-report-empty" role="status">Đang tải dữ liệu thống kê…</p></section>';
  const root = view.firstElementChild;
  const state = { days: 30, classCode: '', source: 'all', metric: 'turns', bucket: null, band: '', topic: '', moreTopics: false };
  let classes, students, report;

  function render() {
    report = makeReport(students, state);
    const period = root.querySelector('[data-period]');
    period.textContent = `Từ ${labelDay(report.start, true)} đến ${labelDay(report.today, true)}`;
    root.querySelector('[data-stats]').innerHTML = stats(report);
    root.querySelector('[data-trend]').innerHTML = trend(report, state);
    renderBreakdown();
  }

  function renderBreakdown() {
    root.querySelector('[data-distribution]').innerHTML = distribution(report, state);
    root.querySelector('[data-topics]').innerHTML = topics(report, state);
    root.querySelector('[data-students]').innerHTML = studentsPanel(report, state);
  }

  function renderClassOptions() {
    const field = root.querySelector('[name="classCode"]');
    if (!classes.some(item => item.code === state.classCode)) state.classCode = '';
    field.innerHTML = '<option value="">Tất cả lớp</option>' + classes.map(item =>
      `<option value="${esc(item.code)}">${esc(item.name || item.code)}</option>`).join('');
    field.value = state.classCode;
  }

  const fetchData = () => Promise.all([load('classes', true), load('students', true)]);
  try {
    [classes, students] = await fetchData();
  } catch (error) {
    if (!root.isConnected) return;
    throw error;
  }
  if (!root.isConnected) return;
  root.removeAttribute('aria-busy');
  root.innerHTML = storageWarn() + `<div class="gv-report-intro">
    <div><h2>Báo cáo học tập</h2><span data-period aria-live="polite"></span></div>
    <button type="button" data-refresh class="gv-report-refresh"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5m10-2a7 7 0 0 0-12-3l-3 5m16 0-3 5a7 7 0 0 1-12-3"/></svg>Làm mới</button>
  </div>
  <div class="gv-report-filters" role="group" aria-label="Bộ lọc báo cáo">
    <label>Lớp học<select name="classCode"></select></label>
    <label>Thời gian<select name="days"><option value="7">7 ngày qua</option><option value="30" selected>30 ngày qua</option><option value="90">90 ngày qua</option></select></label>
    <label>Loại lượt<select name="source"><option value="all">Tất cả lượt</option><option value="assigned">Có mã bài giao</option><option value="other">Các lượt khác</option></select></label>
  </div>
  <div data-stats></div>
  <div class="gv-report-grid"><div data-trend></div><div data-distribution></div></div>
  <div class="gv-report-grid gv-report-grid-detail"><div data-topics></div><div data-students></div></div>
  <details class="gv-report-method"><summary>Cách tính và phạm vi dữ liệu</summary>
    <ul><li>Tỷ lệ đúng bằng tổng số câu đúng chia cho tổng số câu đã làm. Một học sinh có thể có nhiều lượt học.</li>
    <li>Kỳ trước là khoảng thời gian ngay liền trước, có cùng số ngày. Báo cáo tính ngày theo giờ Việt Nam. Lượt cũ thiếu mốc giờ dùng ngày lưu trên thiết bị.</li>
    <li>Gợi ý hỗ trợ áp dụng khi học sinh đã làm ít nhất 10 câu và đúng dưới 60%. Chủ đề được gợi ý ôn lại khi có từ 2 em, ít nhất 10 câu đã trả lời và tỷ lệ đúng dưới 70%.</li>
    <li>Báo cáo dùng lịch sử đã đồng bộ của học sinh đang kết nối. Lượt học trên thiết bị sẽ xuất hiện sau khi được đồng bộ. Nhóm “Có mã bài giao” gồm các lượt có lưu mã bài giao.</li></ul>
  </details>`;
  renderClassOptions();
  render();

  root.querySelector('.gv-report-filters').addEventListener('change', ({ target }) => {
    state[target.name] = target.name === 'days' ? Number(target.value) : target.value;
    Object.assign(state, { bucket: null, band: '', topic: '', moreTopics: false });
    render();
  });
  root.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const { metric, bucket, band, topic, student } = button.dataset;
    if (metric || bucket !== undefined) {
      if (metric) state.metric = metric;
      else state.bucket = Number(bucket);
      const panel = root.querySelector('[data-trend]');
      panel.innerHTML = trend(report, state);
      panel.querySelector(metric ? `[data-metric="${metric}"]` : `[data-bucket="${bucket}"]`)?.focus();
    } else if (band !== undefined || topic || button.hasAttribute('data-clear') || button.hasAttribute('data-more')) {
      const origin = state.topic ? '[data-topic][aria-pressed="true"]' : '[data-band][aria-pressed="true"]';
      if (band !== undefined) {
        state.band = state.band === band ? '' : band;
        state.topic = '';
      } else if (topic) {
        state.topic = state.topic === topic ? '' : topic;
        state.band = '';
      } else if (button.hasAttribute('data-more')) {
        state.moreTopics = !state.moreTopics;
      } else {
        const previous = root.querySelector(origin)?.dataset;
        state.band = '';
        state.topic = '';
        renderBreakdown();
        const previousControl = previous?.topic ? `[data-topic="${CSS.escape(previous.topic)}"]` : `[data-band="${previous?.band}"]`;
        root.querySelector(previousControl)?.focus();
        return;
      }
      renderBreakdown();
      root.querySelector(topic ? `[data-topic="${CSS.escape(topic)}"]` : band !== undefined ? `[data-band="${band}"]` : '[data-more]')?.focus();
    } else if (student !== undefined) {
      openStudent(report.rows[Number(student)].student);
    } else if (button.hasAttribute('data-refresh')) {
      button.disabled = true;
      try {
        [classes, students] = await fetchData();
        if (!root.isConnected) return;
        Object.assign(state, { bucket: null, band: '', topic: '' });
        renderClassOptions();
        render();
        window.GV.toast('Đã cập nhật thống kê.');
      } catch (error) {
        if (root.isConnected) window.GV.toast(error.message, true);
      } finally {
        button.disabled = false;
      }
    }
  });
}

register('thong-ke', 'Thống kê', page);
