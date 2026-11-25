/* Phần thưởng (Claude Code, đợt 9). Nạp SAU app.js.
   • Trang trí vườn (ý tưởng từ cửa hàng vé thưởng của ABCmouse): tiêu 🌸 bông hoa mua cây, hoa,
     bạn thú; đặt vào khu vườn 6×4 ô, chuyển chỗ, cất vào túi. Chạm vào bạn thú → bạn ấy “chào” em.
   • Giấy khen in được (ý tưởng từ giấy khen cuối bản đồ của Reading Eggs): A4 ngang, có tên, lớp,
     thành tích, ngày tháng, chỗ ký của giáo viên. */
'use strict';
const DECOR = [
  { id: 'tulip', icon: '🌷', name: 'Hoa tulip', price: 2 }, { id: 'sunflower', icon: '🌻', name: 'Hoa hướng dương', price: 2 },
  { id: 'mushroom', icon: '🍄', name: 'Nấm đỏ', price: 2 }, { id: 'rose', icon: '🌹', name: 'Hoa hồng', price: 3 },
  { id: 'hibiscus', icon: '🌺', name: 'Hoa dâm bụt', price: 3 }, { id: 'ladybug', icon: '🐞', name: 'Bọ rùa', price: 3 },
  { id: 'butterfly', icon: '🦋', name: 'Bươm bướm', price: 4 }, { id: 'bee', icon: '🐝', name: 'Ong mật', price: 4 },
  { id: 'chick', icon: '🐥', name: 'Gà con', price: 5 }, { id: 'kite', icon: '🪁', name: 'Cánh diều', price: 5 },
  { id: 'tree', icon: '🌳', name: 'Cây bàng', price: 6 }, { id: 'palm', icon: '🌴', name: 'Cây dừa', price: 6 },
  { id: 'duck', icon: '🦆', name: 'Vịt con', price: 6 }, { id: 'bunny', icon: '🐇', name: 'Thỏ trắng', price: 8 },
  { id: 'squirrel', icon: '🐿️', name: 'Sóc nâu', price: 8 }, { id: 'fountain', icon: '⛲', name: 'Đài phun nước', price: 12 },
  { id: 'house', icon: '🏡', name: 'Ngôi nhà nhỏ', price: 15 }, { id: 'rainbow', icon: '🌈', name: 'Cầu vồng', price: 20 }
];
const GD_COLS = 6, GD_ROWS = 4;
let gdSel = null; // { type: 'bag', id } | { type: 'cell', cell }
function decor() { if (!S.decor || !S.decor.owned) S.decor = { owned: {}, placed: {} }; return S.decor; }
function decorById(id) { return DECOR.find(x => x.id === id); }
function freeCount(id) { const d = decor(); return (d.owned[id] || 0) - Object.values(d.placed).filter(x => x === id).length; }
function firstEmpty() { const d = decor(); for (let i = 0; i < GD_COLS * GD_ROWS; i++) if (!d.placed[i]) return i; return -1; }

function gardenScene(mini) {
  const d = decor(), cells = [];
  for (let i = 0; i < GD_COLS * GD_ROWS; i++) {
    const it = d.placed[i] && decorById(d.placed[i]);
    cells.push(mini ? '<span class="gd-cell">' + (it ? it.icon : '') + '</span>'
      : '<button class="gd-cell ' + (it ? 'has' : 'empty') + (gdSel && gdSel.type === 'cell' && gdSel.cell === i ? ' sel' : '') + '" data-cell="' + i + '" aria-label="' + (it ? it.name : 'Ô đất trống') + '">' + (it ? '<span>' + it.icon + '</span>' : '') + '</button>');
  }
  return '<div class="gd-scene' + (mini ? ' mini' : '') + (gdSel ? ' placing' : '') + '"><div class="gd-sky" aria-hidden="true"><span class="gd-sun">☀️</span><span class="gd-cloud c1">☁️</span><span class="gd-cloud c2">☁️</span></div>' +
    '<div class="gd-grid" style="--cols:' + GD_COLS + '">' + cells.join('') + '</div></div>';
}
function gardenMini() {
  const placed = Object.keys(decor().placed).length;
  return placed ? '<div class="gd-mini-wrap">' + gardenScene(true) + '</div><button class="soft-btn gd-mini-btn" data-view="garden">🏡 Trang trí vườn · ' + S.flowers + ' 🌸</button>'
    : '<button class="primary-btn gd-mini-btn" data-view="garden">🏡 Dùng ' + S.flowers + ' 🌸 trang trí vườn</button>';
}
function gardenPage() {
  const d = decor(), bag = DECOR.filter(x => freeCount(x.id) > 0);
  const hint = gdSel ? (gdSel.type === 'bag' ? 'Chạm vào một ô đất trống để đặt ' + decorById(gdSel.id).icon + ' ' + decorById(gdSel.id).name + '.' : 'Chạm ô trống để chuyển chỗ, hoặc cất vào túi.')
    : Object.keys(d.placed).length ? 'Chạm vào cây, hoa, bạn thú trong vườn để chúng chào em!' : 'Vườn đang trống. Dùng 🌸 mua đồ ở cửa hàng nhé!';
  return pageHeading('KHU VƯỜN CỦA EM', 'Trang trí vườn', 'Học bài để nhận 🌸 bông hoa, rồi mua cây, hoa và bạn thú cho khu vườn của riêng em.', '<span class="gd-wallet">🌸 <b>' + S.flowers + '</b> bông hoa</span>') +
    '<div class="gd-layout"><section class="gd-main">' + gardenScene(false) +
    '<div class="gd-bar"><p class="gd-hint">' + hint + '</p>' +
    (gdSel && gdSel.type === 'cell' ? '<button class="soft-btn" id="gdStore">🎒 Cất vào túi</button>' : '') +
    (gdSel ? '<button class="soft-btn" id="gdDone">Xong</button>' : '') + '</div>' +
    '<h2 class="gd-h">🎒 Túi đồ</h2>' + (bag.length ? '<div class="gd-bag">' + bag.map(x => '<button class="gd-item' + (gdSel && gdSel.type === 'bag' && gdSel.id === x.id ? ' sel' : '') + '" data-bag="' + x.id + '"><span>' + x.icon + '</span><small>' + x.name + ' ×' + freeCount(x.id) + '</small></button>').join('') + '</div>'
      : '<p class="gd-empty">Túi đang trống – đồ mới mua sẽ tự đặt vào vườn.</p>') +
    '</section><aside class="gd-shop"><h2 class="gd-h">🛍️ Cửa hàng</h2><div class="gd-shop-grid">' + DECOR.map(x => {
      const can = S.flowers >= x.price, own = d.owned[x.id] || 0;
      return '<div class="gd-card' + (can ? '' : ' poor') + '"><span class="gd-card-ico" aria-hidden="true">' + x.icon + '</span><b>' + x.name + '</b>' +
        '<button class="' + (can ? 'primary-btn' : 'soft-btn') + ' gd-buy" data-buy="' + x.id + '" aria-label="Mua ' + x.name + ' giá ' + x.price + ' bông hoa">' + x.price + ' 🌸</button>' + (own ? '<small>Đã có ' + own + '</small>' : '') + '</div>';
    }).join('') + '</div>' +
    '<div class="gd-earn"><b>Cách nhận 🌸</b><ul><li>Mỗi ⭐ mới trong bài học: +1</li><li>Mở 🎁 giỏ quà trên con đường: +3</li><li>Vượt ⚡ thử thách: +2 · 🌳 Cây Chữ Thần: +5</li><li>Xong nhiệm vụ hôm nay: +2</li></ul></div></aside></div>';
}
function gardenBind() {
  $$('[data-buy]').forEach(b => b.onclick = () => buyDecor(b.dataset.buy));
  $$('[data-bag]').forEach(b => b.onclick = () => { sfx('tap'); gdSel = gdSel && gdSel.type === 'bag' && gdSel.id === b.dataset.bag ? null : { type: 'bag', id: b.dataset.bag }; render(); });
  $$('[data-cell]').forEach(b => b.onclick = () => tapCell(Number(b.dataset.cell)));
  const st = $('#gdStore'); if (st) st.onclick = () => { delete decor().placed[gdSel.cell]; gdSel = null; save(); render(); toast('🎒 Đã cất vào túi'); };
  const dn = $('#gdDone'); if (dn) dn.onclick = () => { gdSel = null; render(); };
}
function tapCell(i) {
  const d = decor(), id = d.placed[i];
  if (gdSel && gdSel.type === 'bag') {
    if (id) { toast('Ô này có đồ rồi, em chọn ô trống nhé!'); return; }
    d.placed[i] = gdSel.id; if (freeCount(gdSel.id) <= 0) gdSel = null;
    sfx('good'); save(); render(); return;
  }
  if (gdSel && gdSel.type === 'cell') {
    if (gdSel.cell === i) { gdSel = null; render(); return; }
    if (!id) { d.placed[i] = d.placed[gdSel.cell]; delete d.placed[gdSel.cell]; gdSel = null; sfx('good'); save(); render(); return; }
  }
  if (id) { const it = decorById(id); sfx('tap'); speak(it.name); gdSel = { type: 'cell', cell: i }; render(); }
}
function buyDecor(id) {
  const it = decorById(id); if (!it) return;
  if (S.flowers < it.price) { sfx('bad'); toast('Em cần thêm ' + (it.price - S.flowers) + ' 🌸 nữa. Học thêm một bài nhé!'); return; }
  const d = decor();
  S.flowers -= it.price; d.owned[id] = (d.owned[id] || 0) + 1;
  const cell = firstEmpty(); if (cell >= 0) d.placed[cell] = id;
  sfx('win'); save(); render(); toast(it.icon + ' ' + it.name + ' đã về vườn của em!');
}
registerView('garden', 'Trang trí vườn', gardenPage, gardenBind);
AFTER_RENDER.push(view => { if (view !== 'garden') gdSel = null; });

/* ============================== GIẤY KHEN ============================== */
let certItems = [];
function certData(opts) {
  const g = String(opts.grade || S.grade), topics = gradeTopics(g);
  const done = topics.filter(t => S.topics[t.id] && S.topics[t.id].done).length;
  const stars = topics.reduce((a, t) => a + ((S.topics[t.id] || {}).stars || 0), 0);
  const reasons = {
    island: 'Đã đánh thức Cây Chữ Thần của ' + gardenName(g) + ', vượt qua mọi thử thách chính tả trên đảo.',
    grade: 'Đã hoàn thành tất cả ' + topics.length + ' bài chính tả của Lớp ' + g + '.',
    effort: 'Đã chăm chỉ luyện chính tả, viết đúng và viết đẹp mỗi ngày.'
  };
  return { g, done, total: topics.length, stars, reason: reasons[opts.kind] || reasons.effort };
}
function certificateHtml(opts) {
  const c = certData(opts), d = new Date();
  return '<div class="cert"><div class="cert-in">' +
    '<span class="cert-corner tl" aria-hidden="true">🌸</span><span class="cert-corner tr" aria-hidden="true">🌼</span><span class="cert-corner bl" aria-hidden="true">🌿</span><span class="cert-corner br" aria-hidden="true">🌷</span>' +
    '<div class="cert-brand">🌱 VƯỜN CHỮ KÌ DIỆU · LUYỆN CHÍNH TẢ TIỂU HỌC</div>' +
    '<h1 class="cert-title">GIẤY KHEN</h1><p class="cert-lead">Trân trọng khen ngợi em</p>' +
    '<div class="cert-name">' + esc(S.name) + '</div><p class="cert-class">Học sinh Lớp ' + esc(c.g) + '</p>' +
    '<p class="cert-reason">' + esc(c.reason) + '</p>' +
    '<div class="cert-stats"><span>⭐ ' + c.stars + ' sao</span><span>📘 ' + c.done + '/' + c.total + ' bài</span><span>🔥 ' + S.streak + ' ngày liên tiếp</span></div>' +
    '<div class="cert-foot"><div class="cert-seal"><span>🏅</span><small>Vườn Chữ</small></div>' +
    '<div class="cert-sign"><p>Ngày ' + d.getDate() + ' tháng ' + (d.getMonth() + 1) + ' năm ' + d.getFullYear() + '</p><b>Giáo viên chủ nhiệm</b><span class="cert-line"></span></div></div>' +
    '</div></div>';
}
function showCertificate(opts) {
  openModal('📜 Giấy khen', esc(S.name) + ' · Lớp ' + esc(opts.grade || S.grade), '<div class="cert-preview">' + certificateHtml(opts) + '</div>' +
    '<div class="modal-actions center"><button class="primary-btn big" id="certPrint">🖨️ In giấy khen</button></div><p class="small-print" style="text-align:center">Mẹo: chọn khổ A4, hướng ngang, bật “In hình nền” để giữ màu.</p>', 'wide');
  sfx('win'); confetti();
  $('#certPrint').onclick = () => {
    let el = $('#printSheet');
    if (!el) { el = document.createElement('div'); el.id = 'printSheet'; document.body.appendChild(el); }
    el.innerHTML = '<div class="cert-print">' + certificateHtml(opts) + '</div>';
    document.body.classList.add('print-sheet');
    const done = () => document.body.classList.remove('print-sheet');
    window.addEventListener('afterprint', done, { once: true });
    window.print(); setTimeout(done, 1500);
  };
}
function certList() {
  certItems = [];
  [1, 2, 3, 4, 5].forEach(g => {
    if (S.nodes && S.nodes['boss' + g] && S.nodes['boss' + g].done) certItems.push({ kind: 'island', grade: String(g), icon: '🌳', text: 'Đánh thức Cây Chữ Thần – ' + gardenName(g) });
    const tl = gradeTopics(g);
    if (tl.length && tl.every(t => S.topics[t.id] && S.topics[t.id].done)) certItems.push({ kind: 'grade', grade: String(g), icon: '👑', text: 'Hoàn thành mọi bài Lớp ' + g });
  });
  if (S.badges.length >= 3) certItems.push({ kind: 'effort', grade: S.grade, icon: '🌟', text: 'Chăm chỉ luyện chính tả' });
  return '<section class="pf-card"><h2>📜 Giấy khen của em</h2>' + (certItems.length
    ? '<div class="cert-list">' + certItems.map((x, i) => '<button class="cert-item" data-cert="' + i + '"><span aria-hidden="true">' + x.icon + '</span><b>' + esc(x.text) + '</b><small>Xem &amp; in →</small></button>').join('') + '</div>'
    : '<p>Đánh thức 🌳 Cây Chữ Thần cuối mỗi hòn đảo, học xong mọi bài của lớp, hoặc sưu tầm 3 huy hiệu để nhận giấy khen nhé!</p>') + '</section>';
}
function bindCerts() { $$('[data-cert]').forEach(b => b.onclick = () => showCertificate(certItems[Number(b.dataset.cert)])); }
