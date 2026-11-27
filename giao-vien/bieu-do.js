/* Biểu đồ dùng chung cho trang giáo viên & quản trị – Claude (đợt 22).
   SVG thuần, không thư viện ngoài. Quy cách: cột ≤ 24px, đầu cột bo 4px (gốc vuông), lưới mảnh liền nét,
   chữ dùng màu chữ (không dùng màu dữ liệu), di chuột / Tab hiện số, luôn có “Xem bảng số liệu”.
   API:  BieuDo.cot(el, [{ nhan, gt, phu? }], { donVi, moTa, mau? })      – cột dọc theo thời gian
         BieuDo.ngang(el, [{ nhan, gt, phu? }], { donVi, moTa, toiDa?, dinhDang? }) – thanh ngang xếp hạng
   gt = số; phu = dòng phụ trong chú thích nổi. Màu mặc định: --viz-1 (đặt trong gv.css). */
'use strict';
window.BieuDo = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const so = n => Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  /* trục y tròn số: 0 / 5 / 10 … */
  function nice(max) {
    if (max <= 0) return { top: 4, step: 1 };
    const raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
    const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    return { top: Math.ceil(max / step) * step, step };
  }
  /* cột có đầu bo 4px, gốc vuông */
  function barPath(x, y, w, h, r) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  function hBarPath(x, y, w, h, r) {
    if (w <= 0) return '';
    r = Math.min(r, h / 2, w);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  }
  function tooltip(host) {
    let tip = host.querySelector('.viz-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'viz-tip'; tip.setAttribute('role', 'status'); tip.hidden = true; host.appendChild(tip); }
    return {
      show(mark, value, label, extra) {
        tip.replaceChildren();
        const v = document.createElement('b'); v.textContent = value; tip.appendChild(v);
        const l = document.createElement('span'); l.textContent = label; tip.appendChild(l);
        if (extra) { const s = document.createElement('small'); s.textContent = extra; tip.appendChild(s); }
        tip.hidden = false;
        const hb = host.getBoundingClientRect(), mb = mark.getBoundingClientRect();
        const left = Math.min(Math.max(mb.left - hb.left + mb.width / 2 - tip.offsetWidth / 2, 0), hb.width - tip.offsetWidth);
        tip.style.left = left + 'px';
        tip.style.top = Math.max(0, mb.top - hb.top - tip.offsetHeight - 8) + 'px';
      },
      hide() { tip.hidden = true; }
    };
  }
  /* bảng số liệu: luôn có, để không ai phải rê chuột mới đọc được số */
  function table(host, rows, head, fmt) {
    const d = document.createElement('details'); d.className = 'viz-table';
    const s = document.createElement('summary'); s.textContent = 'Xem bảng số liệu'; d.appendChild(s);
    const t = document.createElement('table'), tr = t.createTHead().insertRow();
    head.forEach(h => { const th = document.createElement('th'); th.textContent = h; tr.appendChild(th); });
    const tb = t.createTBody();
    rows.forEach(r => { const row = tb.insertRow(); row.insertCell().textContent = r.nhan; const c = row.insertCell(); c.textContent = fmt(r.gt); c.className = 'num'; });
    d.appendChild(t); host.appendChild(d);
  }
  function wire(host, svg, rows, label, fmt) {
    const tip = tooltip(host);
    svg.querySelectorAll('[data-i]').forEach(hit => {
      const i = Number(hit.dataset.i), r = rows[i], mark = svg.querySelector('[data-mark="' + i + '"]') || hit;
      const on = () => { svg.querySelectorAll('.viz-mark.on').forEach(m => m.classList.remove('on')); mark.classList.add('on'); tip.show(mark, fmt(r.gt), r.nhan, r.phu); };
      const off = () => { mark.classList.remove('on'); tip.hide(); };
      hit.addEventListener('pointerenter', on); hit.addEventListener('pointerleave', off);
      hit.addEventListener('focus', on); hit.addEventListener('blur', off);
      hit.setAttribute('tabindex', '0'); hit.setAttribute('role', 'img');
      hit.setAttribute('aria-label', r.nhan + ': ' + fmt(r.gt) + (r.phu ? ' (' + r.phu + ')' : ''));
    });
    svg.setAttribute('aria-label', label);
  }

  /* ---------- cột dọc (theo ngày) ---------- */
  function cot(host, rows, o = {}) {
    host.replaceChildren(); host.classList.add('viz');
    const fmt = v => so(v) + (o.donVi ? ' ' + o.donVi : '');
    if (!rows.length || rows.every(r => !r.gt)) { const p = document.createElement('p'); p.className = 'viz-empty'; p.textContent = o.trong || 'Chưa có số liệu trong khoảng này.'; host.appendChild(p); }
    const W = Math.max(280, host.clientWidth || 600), H = o.cao || 210, padL = 34, padB = 26, padT = 10, padR = 6;
    const pw = W - padL - padR, ph = H - padT - padB, n = rows.length || 1, band = pw / n;
    const bw = Math.min(24, Math.max(6, band * 0.6));
    const max = Math.max(0, ...rows.map(r => r.gt)), { top, step } = nice(max);
    const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'viz-svg', role: 'group' }, host);
    for (let v = 0; v <= top + 1e-9; v += step) {
      const y = padT + ph - (v / top) * ph;
      mk('line', { x1: padL, x2: W - padR, y1: y, y2: y, class: v === 0 ? 'viz-base' : 'viz-grid' }, svg);
      const t = mk('text', { x: padL - 6, y: y + 4, class: 'viz-tick', 'text-anchor': 'end' }, svg); t.textContent = so(v);
    }
    const every = Math.ceil(n / Math.max(1, Math.floor(pw / 46))); // nhãn trục x không chồng nhau
    rows.forEach((r, i) => {
      const x = padL + band * i + (band - bw) / 2, h = top ? (r.gt / top) * ph : 0, y = padT + ph - h;
      mk('path', { d: barPath(x, y, bw, h, 4), class: 'viz-mark', 'data-mark': i, fill: o.mau || 'var(--viz-1)' }, svg);
      mk('rect', { x: padL + band * i, y: padT, width: band, height: ph, class: 'viz-hit', 'data-i': i }, svg);
      if ((n - 1 - i) % every === 0) { const t = mk('text', { x: padL + band * i + band / 2, y: H - 8, class: 'viz-tick', 'text-anchor': 'middle' }, svg); t.textContent = r.nhanNgan || r.nhan; }
    });
    // nhãn trực tiếp cho cột cao nhất (chọn lọc, không ghi số trên mọi cột)
    const best = rows.reduce((b, r, i) => r.gt > (rows[b]?.gt ?? -1) ? i : b, 0);
    if (rows[best] && rows[best].gt > 0) {
      const x = padL + band * best + band / 2, y = padT + ph - (rows[best].gt / top) * ph - 6;
      const t = mk('text', { x, y: Math.max(11, y), class: 'viz-label', 'text-anchor': 'middle' }, svg); t.textContent = so(rows[best].gt);
    }
    wire(host, svg, rows, o.moTa || 'Biểu đồ cột', fmt);
    table(host, rows, [o.cotNhan || 'Ngày', o.cotGiaTri || 'Giá trị'], fmt);
  }

  /* ---------- thanh ngang (xếp hạng lớp / giáo viên) ---------- */
  function ngang(host, rows, o = {}) {
    host.replaceChildren(); host.classList.add('viz');
    const fmt = o.dinhDang || (v => so(v) + (o.donVi ? ' ' + o.donVi : ''));
    if (!rows.length) { const p = document.createElement('p'); p.className = 'viz-empty'; p.textContent = o.trong || 'Chưa có số liệu.'; host.appendChild(p); return; }
    const W = Math.max(280, host.clientWidth || 520), rowH = 34, bh = 16, labW = Math.min(150, W * 0.36), valW = 56;
    const H = rows.length * rowH + 6, pw = W - labW - valW - 8;
    const max = o.toiDa || Math.max(1, ...rows.map(r => r.gt));
    const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'viz-svg', role: 'group' }, host);
    mk('line', { x1: labW, x2: labW, y1: 0, y2: H, class: 'viz-base' }, svg);
    rows.forEach((r, i) => {
      const y = i * rowH + (rowH - bh) / 2, w = Math.max(r.gt > 0 ? 2 : 0, (r.gt / max) * pw);
      const lab = mk('text', { x: labW - 8, y: y + bh / 2 + 4, class: 'viz-cat', 'text-anchor': 'end' }, svg);
      lab.textContent = r.nhan.length > 18 ? r.nhan.slice(0, 17) + '…' : r.nhan;
      mk('rect', { x: labW, y, width: pw, height: bh, rx: 4, class: 'viz-track' }, svg);
      mk('path', { d: hBarPath(labW, y, w, bh, 4), class: 'viz-mark', 'data-mark': i, fill: r.mau || o.mau || 'var(--viz-1)' }, svg);
      const v = mk('text', { x: labW + w + 6, y: y + bh / 2 + 4, class: 'viz-label' }, svg); v.textContent = fmt(r.gt);
      mk('rect', { x: 0, y: i * rowH, width: W, height: rowH, class: 'viz-hit', 'data-i': i }, svg);
    });
    wire(host, svg, rows, o.moTa || 'Biểu đồ thanh', fmt);
    table(host, rows, [o.cotNhan || 'Mục', o.cotGiaTri || 'Giá trị'], fmt);
  }

  /* vẽ lại khi khung đổi kích thước (xoay điện thoại, thu nhỏ cửa sổ) */
  function tuCo(host, draw) {
    draw();
    if (typeof ResizeObserver === 'undefined') return;
    let w = host.clientWidth, t = 0;
    new ResizeObserver(() => { if (Math.abs(host.clientWidth - w) < 8) return; w = host.clientWidth; clearTimeout(t); t = setTimeout(draw, 120); }).observe(host);
  }
  return { cot, ngang, tuCo, so };
})();
