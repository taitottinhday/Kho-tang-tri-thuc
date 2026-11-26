/* Trang “Lý thuyết” cho từng chủ đề (Claude Code, đợt 7) – theo cấu trúc trang lý thuyết ForumFlash:
   Trọng tâm · Công thức nhớ · Ví dụ mở đầu · Cách làm 01-02-03 · Ví dụ và giảng giải · Đối chiếu ·
   Lỗi thường gặp (Chưa đúng → Đã sửa) · Tự kiểm tra trước khi làm bài · “Làm bài tập →”.
   Nội dung dựng tự động từ ngân hàng câu hỏi nên chủ đề nào cũng có. Nạp SAU app.js. */
'use strict';
const CONG_THUC = {
  'c-k-q': 'k + i, e, ê · qu + vần · c + các âm còn lại',
  'g-gh': 'gh + i, e, ê · g + các âm còn lại',
  'ng-ngh': 'ngh + i, e, ê · ng + các âm còn lại',
  's-x': 'Nhớ từ theo nghĩa · từ láy cùng âm đầu: xinh xắn, sạch sẽ',
  'ch-tr': 'Nhớ từ theo nghĩa · đồ vật trong nhà hay viết ch',
  'd-gi-r': 'Nhớ từ theo nghĩa · từ láy cùng âm đầu: rộn ràng, dịu dàng',
  'l-n': 'n: hơi ra mũi · l: hơi ra hai bên lưỡi',
  'an-ang': 'an, at → lưỡi chạm răng · ang, ac → miệng mở',
  'ai-ay': 'ai: tai, nai, hai · ay: tay, bay, cay',
  'ao-au': 'ao: sao, táo, báo · au: rau, cau, sau',
  'uon-uong': 'uôn, uôt → n, t · uông, uôc → ng, c',
  'uon-uong-2': 'ươn, ươt → n, t · ương, ươc → ng, c',
  'ien-ieng': 'iên, iêt → n, t · iêng, iêc → ng, c',
  'ui-uy': 'ui · uy · iu · ưu → ghép thử, đọc to, chọn từ có nghĩa',
  'an-ang-2': 'ăn, ân → n · ăng, âng → ng',
  'hoi-nga': 'huyền – ngã – nặng · ngang – sắc – hỏi',
  'dau-thanh': 'ia, ua, ưa → dấu ở chữ đầu · iê, uô, ươ → dấu ở chữ thứ hai',
  'tu-kho': 'Hiểu nghĩa → nhớ mặt chữ → viết lại 3 lần',
  'viet-hoa': 'Đầu câu · tên người · tên địa danh → viết hoa',
  'viet-hoa-ngoai': 'Viết hoa mỗi bộ phận · các tiếng nối bằng gạch ngang',
  'viet-hoa-ten-rieng': 'Viết hoa chữ đầu của mỗi bộ phận tạo thành tên',
  // các cặp của chương trình lớp 1–3 (data/chuong-trinh.js, đợt 16)
  'c-k': 'k + i, e, ê · c + các âm còn lại',
  'gi-d': 'Nhớ từ theo nghĩa · từ láy cùng âm đầu: dịu dàng, giữ gìn',
  'r-d': 'Tiếng động → r: rì rào, róc rách · nhớ từ: dạy, dễ',
  'r-gi': 'Nhớ từ theo nghĩa: rùa, rau, rửa · gia đình, gió, giỏ',
  'v-d': 'v: môi dưới chạm răng · từ láy cùng âm đầu: vui vẻ, dịu dàng',
  'in-inh': 'in → n (chín, pin) · inh → nh (xinh, kính)',
  'uyp-uyu': 'uyp: đèn tuýp · uyu: khuỷu tay, khúc khuỷu',
  'uynh-uych': 'uynh: phụ huynh, huỳnh quang · uych: ngã huỵch, huých',
  'an-uan': 'ân: cân, sân, chân · uân: xuân, tuần, khuân',
  'im-iem': 'im: chim, kim, tim · iêm: diêm, tiêm, liềm',
  'ieng-yeng': 'Không âm đầu → yê (yểng) · có âm đầu → iê (tiếng)',
  'et-oet': 'et: vẹt, tét, sét · oet: khoét, toét, loét',
  'ong-ong': 'ong: ong, võng, bóng · ông: bông, sông, lông',
  'anh-enh': 'anh: chanh, xanh, cành · ênh: kênh, bênh, lênh đênh',
  'inh-uynh': 'inh: xinh, kính, bình · uynh: huynh, huỳnh',
  'oan-oan2': 'oan: ngoan, toán, xoan · oăn: xoăn, khoăn, thoăn thoắt',
  'oa-ue': 'oa: hoa, loa, xoa · uê: quê, huệ, xum xuê',
  'uu-iu': 'ưu: cừu, bưu điện, lựu · iu: rìu, dịu, xíu',
  'ich-it': 'ich: lịch, thích, xích · it: vịt, mít, thịt',
  'ach-ech': 'ach: sách, gạch, sạch · êch: ếch, lệch, hếch',
  'ien-yen-uyen': 'Có âm đầu → iê · không âm đầu → yê · có âm đệm u → uyê',
  'ieu-yeu-iu': 'Có âm đầu → iêu · không âm đầu → yêu · iu đọc ngắn: rìu, dịu',
  'en-eng': 'en → n (đèn, khen) · eng → ng (xẻng, kẻng)',
  'i-y': 'Không âm đầu, sau âm đệm u → y · sau phụ âm → i (kĩ, sĩ)',
  'ay-ay2': 'ay: tay, bay, cay · ây: mây, cây, dây',
  'at-ac': 'at → lưỡi chạm răng (cát, hát) · ac → miệng mở (bác, rác)',
  'uoc-uot': 'ươc → c (nước, bước) · ươt → t (ướt, lướt)',
  'iec-iet': 'iêc → c (chiếc, xiếc) · iêt → t (viết, biết)'
};
// Bài ghép nhiều cặp: nối công thức của từng cặp
function congThuc(t) { return t.cap ? t.cap.map(id => CONG_THUC[id]).filter(Boolean).join(' ‖ ') : CONG_THUC[t.id]; }
function markWord(sentence, word, cls) {
  const s = esc(sentence), w = esc(word), i = s.indexOf(w);
  return i < 0 ? s : s.slice(0, i) + '<mark class="' + cls + '">' + w + '</mark>' + s.slice(i + w.length);
}
function openTheory(id, level, assignmentId) {
  const t = getTopic(id); if (!t) return;
  const items = t.baiTap.map((b, i) => Object.assign({}, b, { _t: t.id, _i: i }));
  const chon = items.filter(b => b.loai === 'chon' && b.de.includes('___'));
  const loi = items.filter(b => b.loai === 'timLoi');
  const formula = congThuc(t) || plain(t.quyTac[0]);
  const ex0 = chon[0];
  // Đối chiếu: nếu đáp án là “phần chữ” (k/c/q, ai/ay…) thì xếp từ theo cột; nếu không thì bảng Viết đúng / Không viết
  const groups = {};
  chon.forEach(it => { const w = itemWord(it); if (it.dapAn.length <= 4 && w !== it.dapAn) (groups[it.dapAn] = groups[it.dapAn] || []).push(w); });
  const keys = Object.keys(groups);
  const compare = keys.length >= 2
    ? '<div class="th-cols">' + keys.slice(0, 4).map(k => '<div class="th-col"><b>' + esc(k) + '</b>' + [...new Set(groups[k])].slice(0, 5).map(w => '<button class="th-word" data-say="' + esc(w) + '">' + esc(w) + '</button>').join('') + '</div>').join('') + '</div>'
    : '<div class="table-wrap"><table class="th-table"><thead><tr><th>✓ Viết đúng</th><th>✗ Không viết</th></tr></thead><tbody>' +
      chon.slice(0, 6).map(it => '<tr><td><button class="th-word" data-say="' + esc(itemWord(it)) + '">' + esc(itemWord(it)) + '</button></td><td><s>' + wrongWords(it).map(esc).join('</s>, <s>') + '</s></td></tr>').join('') + '</tbody></table></div>';
  const examples = chon.slice(1, 5).map(it => {
    const w = itemWord(it), wrong = wrongWords(it)[0];
    return '<article class="th-ex"><div class="th-ex-top"><p>' + markWord(fullSentence(it), w, 'good') + '</p><button class="mini-speak" data-say="' + esc(fullSentence(it)) + '" aria-label="Nghe câu">🔊</button></div>' +
      '<small>Viết đúng: <b>' + esc(w) + '</b>' + (wrong ? ' · không viết <s>' + esc(wrong) + '</s>' : '') + '</small></article>';
  }).join('');
  const fixes = loi.slice(0, 3).map(it => '<div class="th-fix"><div class="th-bad"><small>Chưa đúng</small><p>' + markWord(it.cau, it.tuSai, 'bad') + '</p></div>' +
    '<div class="th-good"><small>Đã sửa</small><p>' + markWord(it.cau.replace(it.tuSai, it.tuDung), it.tuDung, 'good') + '</p></div>' +
    '<p class="th-why">Chữ “' + esc(it.tuSai) + '” phải viết là “<b>' + esc(it.tuDung) + '</b>”.</p></div>').join('');
  const steps = [
    ['Đọc to cả từ', 'Nghe kĩ âm đầu, vần và dấu thanh của tiếng cần viết.'],
    ['Nhớ công thức', esc(formula)],
    ['Đặt vào câu, đọc lại', 'Ghép từ vào câu, đọc lại cả câu xem đã đúng nghĩa và đúng chính tả chưa.']
  ];
  const html = '<div class="theory" style="--c:' + t.mau + '">' +
    '<div class="th-top"><button class="pl-x" id="thClose" aria-label="Thoát">✕</button><h1>' + t.bieuTuong + ' ' + esc(t.ten) + '</h1><span class="th-badge">Lớp ' + esc(S.grade) + '</span></div>' +
    '<div class="th-grid"><section class="th-card"><small>Trọng tâm</small><p>' + md(t.quyTac[0]) + '</p></section>' +
    '<section class="th-formula"><small>Công thức nhớ</small><b>' + esc(formula) + '</b></section></div>' +
    (ex0 ? '<section class="th-hero"><div class="th-hero-note"><small>Ví dụ mở đầu</small><span>Đọc câu trước khi xem phần giảng giải.</span></div><p class="th-big">' + markWord(fullSentence(ex0), itemWord(ex0), 'good') + '</p><button class="speak-btn" data-say="' + esc(fullSentence(ex0)) + '" aria-label="Nghe câu">🔊</button></section>' : '') +
    '<h2>Mẹo ghi nhớ</h2><div class="th-steps">' + t.quyTac.map((r, i) => '<div class="th-step"><span>' + String(i + 1).padStart(2, '0') + '</span><p>' + md(r) + '</p></div>').join('') + '</div>' +
    '<h2>Cách làm</h2><div class="th-steps how">' + steps.map((s, i) => '<div class="th-step"><span>' + String(i + 1).padStart(2, '0') + '</span><p><b>' + s[0] + '.</b> ' + s[1] + '</p></div>').join('') + '</div>' +
    (examples ? '<h2>Ví dụ và giảng giải</h2><div class="th-examples">' + examples + '</div>' : '') +
    '<h2>Đối chiếu</h2><p class="th-sub">Bấm vào từ để nghe đọc.</p>' + compare +
    (fixes ? '<h2>Lỗi thường gặp</h2><div class="th-fixes">' + fixes + '</div>' : '') +
    '<h2>Tự kiểm tra trước khi làm bài</h2><ul class="th-check">' +
    ['Em đọc to được các từ ví dụ ở trên.', 'Em nhớ công thức: ' + esc(formula) + '.', 'Em hiểu vì sao các câu “chưa đúng” bị sai.', 'Em sẽ đọc lại cả câu sau khi chọn đáp án.']
      .map((c, i) => '<li><label><input type="checkbox" class="th-tick" /> <span>' + c + '</span></label></li>').join('') + '</ul>' +
    '<div class="th-actions"><button class="soft-btn big" id="thIntro">← Về bài học</button><button class="primary-btn big" id="thPractice">Làm bài tập →</button></div></div>';
  openPlayer(html);
  $('#modalRoot').classList.add('theory-mode');
  const ts = tstat(t.id);
  if (!ts.theory) { ts.theory = true; S.xp += 5; save(); toast('📖 +5 XP vì em đọc lý thuyết!'); }
  $('#thClose').onclick = () => closeModal();
  $('#thIntro').onclick = () => showIntro(t, level, assignmentId);
  $('#thPractice').onclick = e => { const k = level && tierOpen(ts, level) ? level : suggestTier(ts); beginLesson(e.currentTarget, t, k, assignmentId); };
  $$('.th-tick').forEach(c => c.onchange = () => { sfx('tap'); if ($$('.th-tick').every(x => x.checked)) toast('Sẵn sàng rồi! Bấm “Làm bài tập” nhé 💪'); });
}
