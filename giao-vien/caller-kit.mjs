// Đồ dùng chung cho hai trò gọi tên “Đại úy Vịt” và “Lái đò tri thức”.
export const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

export const sprite = (src, className) => {
  const node = el('img', className);
  node.src = src;
  node.alt = '';
  node.draggable = false;
  node.decoding = 'async';
  return node;
};

export const preload = urls => urls.forEach(url => { new Image().src = url; });
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const pick = list => list[Math.floor(Math.random() * list.length)];

const words = student => student.name.trim().split(/\s+/);
const collator = new Intl.Collator('vi');

/* Xếp theo TÊN (chữ cuối) như sổ điểm, trùng tên thì xét cả họ tên. */
export function sortByGivenName(students) {
  return students.slice().sort((a, b) => collator.compare(words(a).at(-1), words(b).at(-1)) || collator.compare(a.name, b.name));
}

/* Bảng tên ngắn: “Minh”; trùng thì “Gia Minh”; vẫn trùng thì dùng cả họ tên. */
export function shortNames(students) {
  const forms = [s => words(s).at(-1), s => words(s).slice(-2).join(' '), s => words(s).join(' ')];
  const counts = forms.map(form => students.reduce((map, s) => map.set(form(s), (map.get(form(s)) || 0) + 1), new Map()));
  return new Map(students.map(student => {
    const level = forms.findIndex((form, i) => counts[i].get(form(student)) === 1);
    return [student.id, forms[level < 0 ? 2 : level](student)];
  }));
}

/* Nhịp diễn: mọi khoảng chờ đều đi qua wait() của trò chơi, nên nút “Hiện kết quả” cắt ngang được ngay.
   Máy bật “giảm chuyển động” vẫn giữ nguyên câu chuyện và nhịp (cả lớp còn đọc kịp); chỉ tắt rung, chớp, lia máy. */
export function director({ pace, wait }) {
  const stretch = ms => Math.max(30, Math.round(ms * pace));
  const beat = ms => wait(stretch(ms));
  async function tween(ms, step) {
    const duration = stretch(ms);
    const started = performance.now();
    let frame = 0;
    let live = true;
    const tick = now => {
      if (!live) return;
      const k = clamp((now - started) / duration, 0, 1);
      step(k);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    try {
      await wait(duration);
      step(1);
    } finally {
      live = false;
      cancelAnimationFrame(frame);
    }
  }
  return { beat, tween, stretch };
}

export const smooth = k => k * k * (3 - 2 * k);
