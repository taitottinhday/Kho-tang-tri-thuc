/* Hồ sơ học sinh + thanh "Kỹ năng" theo từng chủ đề (mục D trong PHOI_HOP) – Claude Code.
   Nạp SAU app.js. Dùng registerView(), tstat(), myTopics() của app.js. */
'use strict';
(function () {
  function skillLevel(ts) {
    if (!ts || ts.attempts < 5) return { cls: 'nodata', text: 'Chưa đủ dữ liệu' };
    const a = ts.correct / ts.attempts;
    if (a < 0.6) return { cls: 'weak', text: 'Cần ôn' };
    if (a < 0.85) return { cls: 'mid', text: 'Đang tiến bộ' };
    return { cls: 'good', text: 'Vững vàng' };
  }
  function box(icon, value, label) { return '<div class="pf-stat"><span aria-hidden="true">' + icon + '</span><b>' + value + '</b><small>' + label + '</small></div>'; }
  function page() {
    const topics = myTopics();
    const stars = Object.values(S.topics).reduce((a, t) => a + (t.stars || 0), 0);
    const trees = [1, 2, 3, 4, 5].filter(g => S.nodes && S.nodes['boss' + g] && S.nodes['boss' + g].done).length;
    const weak = topics.filter(t => skillLevel(S.topics[t.id]).cls === 'weak');
    return '<section class="pf-head"><div class="pf-avatar" aria-hidden="true">' + S.avatar + '</div><div><h1>' + esc(S.name) + '</h1><p>Lớp ' + esc(S.grade) + ' · ' + gardenName() + '</p></div><button class="soft-btn" id="pfEdit">✏️ Sửa hồ sơ</button></section>' +
      '<section class="pf-stats" aria-label="Thành tích">' +
      box('⭐', stars, 'Sao') + box('🌸', S.flowers || 0, 'Bông hoa') + box('🔥', S.streak, 'Ngày liên tiếp') +
      box('📝', S.attempts, 'Câu đã làm') + box('🎯', pct(S.correct, S.attempts) + '%', 'Chính xác') + box('🌳', trees + '/5', 'Cây Chữ Thần') + '</section>' +
      (weak.length ? '<div class="note-callout big-note">💡 Em nên ôn thêm: <b>' + weak.map(t => esc(t.ten)).join(', ') + '</b>. Bấm “Ôn ngay” bên dưới nhé!</div>' : '') +
      '<section class="pf-card"><h2>Kỹ năng Lớp ' + esc(S.grade) + '</h2><p>Mỗi chủ đề cần ít nhất 5 câu để biết em đã vững chưa.</p>' +
      topics.map(t => {
        const ts = S.topics[t.id], lv = skillLevel(ts), p = ts && ts.attempts ? pct(ts.correct, ts.attempts) : 0;
        return '<div class="skill-row ' + lv.cls + '"><div class="skill-top"><b>' + t.bieuTuong + ' ' + esc(t.ten) + '</b><span class="skill-tag">' + lv.text + '</span></div>' +
          '<div class="skill-bar"><span style="width:' + p + '%"></span></div>' +
          '<div class="skill-foot"><small>' + (ts && ts.attempts ? 'Đúng ' + ts.correct + '/' + ts.attempts + ' câu' : 'Chưa làm câu nào') + '</small>' +
          (lv.cls === 'weak' || lv.cls === 'mid' ? '<button class="text-link" data-start="' + t.id + '">Ôn ngay →</button>' : '') + '</div></div>';
      }).join('') + '</section>' +
      '<section class="pf-card"><h2>Gần đây em đã làm</h2>' + (S.history.length ? '<ul class="pf-history">' + S.history.slice(0, 8).map(h => {
        const t = getTopic(h.topic);
        return '<li><span>' + esc(KIND_LABEL[h.kind] || 'Luyện tập') + (t ? ' · ' + t.bieuTuong + ' ' + esc(t.ten) : '') + '</span><b>' + h.acc + '%</b><small>' + esc(h.d) + '</small></li>';
      }).join('') + '</ul>' : '<p>Em chưa làm bài nào. Ra đảo học bài đầu tiên nhé!</p>') +
      '<div class="btn-row"><button class="soft-btn" data-view="badges">🏅 Xem huy hiệu (' + S.badges.length + ')</button><button class="soft-btn" data-view="settings">⚙️ Cài đặt</button></div></section>';
  }
  registerView('profile', 'Hồ sơ', page, () => { $('#pfEdit').onclick = showProfile; });
})();
