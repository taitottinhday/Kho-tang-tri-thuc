const DAY = 86400000;
const vietnamDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
});

export function dayNumber(key) {
  const parts = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(key || ''));
  if (!parts) return null;
  const [, year, month, day] = parts.map(Number);
  const stamp = Date.UTC(year, month - 1, day);
  const calendar = new Date(stamp);
  return calendar.getUTCFullYear() === year && calendar.getUTCMonth() === month - 1 && calendar.getUTCDate() === day
    ? stamp / DAY : null;
}

export function todayNumber(value = new Date()) {
  const parts = Object.fromEntries(vietnamDate.formatToParts(value).map(part => [part.type, part.value]));
  return dayNumber(parts.year + '-' + parts.month + '-' + parts.day);
}

export function labelDay(day, year = false) {
  const date = new Date(day * DAY);
  return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + (year ? '/' + date.getUTCFullYear() : '');
}

function entryDay(entry, first, last) {
  const stamp = Number(entry.at);
  if (!Number.isFinite(stamp) || stamp <= 0 || stamp > 8640000000000000) return dayNumber(entry.d);
  const utcDay = Math.floor(stamp / DAY);
  if (utcDay < first - 1 || utcDay > last) return null;
  return todayNumber(new Date(stamp));
}

const count = value => Math.max(0, Math.floor(Number.isFinite(Number(value)) ? Number(value) : 0));
const blank = () => ({ turns: 0, total: 0, correct: 0 });
export const accuracyOf = row => row.total ? row.correct * 100 / row.total : null;
export const needsSupport = row => row.total >= 10 && accuracyOf(row) < 60;

export function bandOf(row) {
  const rate = accuracyOf(row);
  if (rate === null) return 3;
  if (rate < 60) return 0;
  return rate < 80 ? 1 : 2;
}

function add(row, total, correct) {
  row.turns++;
  row.total += total;
  row.correct += correct;
}

export function makeReport(students, { days = 30, today = todayNumber(), source = 'all', classCode = '' } = {}) {
  const start = today - days + 1;
  const previousStart = start - days;
  // Keep charts legible on small displays. The final bucket always includes today.
  const step = days <= 7 ? 1 : days <= 30 ? 3 : 7;
  const buckets = [];
  for (let from = start; from <= today; from += step) {
    buckets.push({ ...blank(), from, to: Math.min(from + step - 1, today) });
  }
  const current = blank();
  const previous = blank();
  const topics = new Map();
  const ranges = [
    { label: 'Dưới 60%', count: 0, tone: 'amber' },
    { label: '60–dưới 80%', count: 0, tone: 'blue' },
    { label: '80–100%', count: 0, tone: 'green' },
    { label: 'Chưa có lượt', count: 0, tone: 'gray' }
  ];
  let active = 0;
  let previousActive = 0;
  const rows = [];

  for (const student of students) {
    if (classCode && student.classCode !== classCode) continue;
    const row = { ...blank(), student, topics: new Map() };
    let wasActive = false;
    for (const entry of student.history || []) {
      if (!entry) continue;
      const assigned = Boolean(entry.assignmentId);
      if ((source === 'assigned' && !assigned) || (source === 'other' && assigned)) continue;
      const day = entryDay(entry, previousStart, today);
      const total = count(entry.total);
      if (!total || day === null || day < previousStart || day > today) continue;
      const correct = Math.min(total, count(entry.correct));
      if (day < start) {
        wasActive = true;
        add(previous, total, correct);
        continue;
      }
      add(row, total, correct);
      add(current, total, correct);
      add(buckets[Math.floor((day - start) / step)], total, correct);
      if (!entry.topic) continue;
      if (!topics.has(entry.topic)) topics.set(entry.topic, { ...blank(), id: entry.topic, title: entry.title, students: 0 });
      if (!row.topics.has(entry.topic)) {
        row.topics.set(entry.topic, blank());
        topics.get(entry.topic).students++;
      }
      add(topics.get(entry.topic), total, correct);
      add(row.topics.get(entry.topic), total, correct);
    }
    if (row.turns) active++;
    if (wasActive) previousActive++;
    ranges[bandOf(row)].count++;
    rows.push(row);
  }

  return {
    start, today, current, previous, active, previousActive,
    buckets, ranges, rows, topics: [...topics.values()],
    needsSupport: rows.filter(needsSupport).length
  };
}
