/* Tủ thẻ dùng chung cho bài trên màn hình và phiếu giấy. */
'use strict';

const WordShelf = (() => {
  const clean = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const searchKey = value => clean(value).toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const variants = ['sage', 'apricot', 'lilac', 'sky'];
  function customSets() {
    return (Array.isArray(db.wordSets) ? db.wordSets : []).filter(set =>
      set && typeof set.id === 'string' && /^list-[\w-]+$/.test(set.id) && typeof set.title === 'string' &&
      /^[1-5]$/.test(set.grade) && Array.isArray(set.words) && set.words.length >= 2 &&
      set.words.length <= 20 && set.words.every(word => typeof word === 'string' && clean(word) && word.length <= 60));
  }
  function assigned() {
    return customSets().filter(set => set.published && String(set.grade) === S.grade);
  }
  function library() {
    return assigned().concat(myTopics().filter(t => t.viDu?.length).map(t => ({
      id: 'book-' + t.id, title: t.ten, group: t.nhom, words: t.viDu, revision: 1
    })));
  }
  function record(set, student = S) {
    const result = student.wordRounds?.[set.id];
    return result && result.revision === set.revision ? result : null;
  }
  function dueSets() {
    return library().filter(set => record(set)?.missed?.length);
  }
  function dueCount() {
    return dueSets().reduce((count, set) => count + record(set).missed.length, 0);
  }
  function reviewList(sets) {
    if (!sets.length) return '';
    return '<section class="shelf-review"><h2>Thẻ từ cần luyện lại</h2>' + sets.map(set =>
      '<article class="home-assignment"><div><b>' + esc(set.title) + '</b><p>' +
      record(set).missed.map(esc).join(' · ') + '</p></div><button class="soft-btn" data-retry-set="' +
      esc(set.id) + '">Luyện từ còn sai →</button></article>').join('') + '</section>';
  }
  function home() {
    const sets = assigned();
    if (!sets.length) return '';
    const set = sets.find(s => !record(s)) || sets.find(s => record(s)?.missed?.length) || sets[0];
    return '<section class="home-assignment"><div><span class="shelf-label">Thầy cô giao · Lớp ' + esc(S.grade) +
      '</span><h2>' + esc(set.title) + '</h2></div><button class="soft-btn" data-practice-set="' + esc(set.id) +
      '">' + (record(set) ? 'Luyện lại' : 'Mở bộ thẻ') + ' →</button></section>';
  }
  function card(set, index) {
    const result = record(set);
    return '<article class="deck-card ' + variants[index % variants.length] + '"><div class="deck-cover" aria-hidden="true"><span>' +
      esc(set.words[0]) + '</span></div><div class="deck-info"><span class="shelf-label">' +
      esc(set.group || 'Thầy cô giao') + '</span><h2>' + esc(set.title) + '</h2><p>' +
      set.words.length + ' thẻ' + (result ? ' · Lượt gần nhất đúng ' + result.last + '/' + set.words.length : '') +
      '</p><button class="soft-btn" data-practice-set="' + esc(set.id) + '">Luyện thẻ →</button>' +
      (result?.missed?.length ? ' <button class="shelf-text" data-retry-set="' + esc(set.id) + '">Ôn ' +
      result.missed.length + ' từ cần nhớ</button>' : '') + '</div></article>';
  }
  function cards(query = '', filter = 'all') {
    const term = searchKey(query);
    const list = (filter === 'assigned' ? assigned() : library()).filter(set =>
      [set.title, ...set.words].some(text => searchKey(text).includes(term)));
    return list.length ? list.map(card).join('') : '<p class="shelf-empty">' +
      (term ? 'Chưa tìm thấy bộ thẻ. Em thử tìm một từ khác nhé.' : 'Lớp em chưa có bộ thẻ thầy cô giao. Em có thể chọn “Tất cả” để luyện.') + '</p>';
  }
  function page() {
    return pageHeading('LUYỆN CHÍNH TẢ · LỚP ' + esc(S.grade), 'Tủ thẻ từ', 'Nhìn kĩ từng từ, che thẻ rồi viết lại theo trí nhớ.') +
      '<div class="shelf-tools"><div class="shelf-tabs" aria-label="Chọn bộ thẻ"><button data-filter="all" aria-pressed="true">Tất cả</button><button data-filter="assigned" aria-pressed="false">Thầy cô giao</button></div>' +
      '<label class="shelf-search">Tìm bộ thẻ<input type="search" id="shelfSearch" placeholder="Tên bài hoặc từ cần tìm"></label></div>' +
      '<div class="deck-grid" id="shelfResults" aria-live="polite">' + cards() + '</div>';
  }
  function bind() {
    let filter = 'all';
    const update = () => { $('#shelfResults').innerHTML = cards($('#shelfSearch').value, filter); };
    $('#shelfSearch').oninput = update;
    $$('[data-filter]').forEach(button => button.onclick = () => {
      filter = button.dataset.filter;
      $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      update();
    });
  }
  function teacherPanel() {
    const sets = customSets().filter(set => SCHOOL_GRADES.includes(Number(set.grade)));
    return '<section class="teacher-panel shelf-manager"><div class="shelf-panel-heading"><div><h2>Bộ thẻ của thầy cô</h2>' +
      '<p>Soạn từ một lần để giao cho học sinh trên máy này hoặc in phiếu cho cả lớp.</p></div><button class="primary-btn" id="newWordSet">+ Soạn bộ thẻ</button></div>' +
      sets.map(set => {
        const studentResults = Object.values(db.profiles).map(p => ({ p, r: record(set, p) })).filter(({r}) => r);
        return '<article class="managed-set"><div><b>' + esc(set.title) + '</b><p>Lớp ' + esc(set.grade) + ' · ' + set.words.length +
          ' thẻ · ' + (set.published ? 'Đã giao' : 'Bản nháp') + '</p></div><div class="set-actions">' +
          '<button class="soft-btn" data-edit-set="' + esc(set.id) + '">Chỉnh sửa</button><button class="soft-btn" data-sheet="' +
          esc(set.id) + '">Phiếu in</button></div>' +
          (studentResults.length ? '<details><summary>Kết quả của ' + studentResults.length + ' học sinh</summary><ul>' + studentResults.map(({p, r}) =>
            '<li><b>' + esc(p.name) + '</b> · Lượt gần nhất đúng ' + esc(r.last) + '/' + set.words.length + ' · ' +
            (r.missed?.length ? 'Cần ôn: ' + r.missed.map(esc).join(', ') : 'Đã viết đúng tất cả các thẻ') + '</li>').join('') +
          '</ul></details>' : '') + '</article>';
      }).join('') + '</section>';
  }
  function editor(set) {
    if (!teacherOK || currentView !== 'teacher') return;
    const options = SCHOOL_GRADES.map(g => '<option ' + (g == (set?.grade || S.grade) ? 'selected' : '') + ' value="' + g + '">Lớp ' + g + '</option>').join('');
    openModal(set ? 'Chỉnh sửa bộ thẻ' : 'Soạn bộ thẻ', 'Bộ thẻ dùng để luyện trên máy và in ra giấy.',
      '<form id="setForm" class="shelf-form"><label>Tên bộ thẻ<input id="setTitle" maxlength="70" required value="' + esc(set?.title || '') +
      '" placeholder="Ví dụ: Từ ngữ về sân trường"></label><label>Khối lớp<select id="setGrade">' + options + '</select></label>' +
      '<label>Các từ hoặc cụm từ<textarea id="setWords" rows="6" required aria-describedby="wordHint" placeholder="sân trường&#10;sạch sẽ">' +
      esc(set?.words.join('\n') || '') + '</textarea></label><small id="wordHint">Mỗi dòng một từ hoặc cụm từ. Chọn từ 2 đến 20 thẻ, tối đa 60 kí tự mỗi thẻ. Các dòng trùng nhau sẽ được gộp.</small>' +
      '<label class="inline-check"><input type="checkbox" id="setPublished" ' + (!set || set.published ? 'checked' : '') +
      '> Giao cho học sinh khối lớp này</label><p id="setError" role="alert"></p><div class="modal-actions"><button type="button" class="soft-btn" data-close-modal>Huỷ</button>' +
      '<button class="primary-btn" type="submit">Lưu bộ thẻ</button></div></form>');
    $('#setTitle').focus();
    $('#setForm').onsubmit = event => {
      event.preventDefault();
      const title = clean($('#setTitle').value);
      const words = [...new Set($('#setWords').value.split(/\r?\n/).map(clean).filter(Boolean))];
      const error = !title ? 'Hãy nhập tên bộ thẻ.' : words.length < 2 || words.length > 20 ? 'Cần từ 2 đến 20 thẻ khác nhau.' :
        words.some(w => w.length > 60) ? 'Có một thẻ dài quá 60 kí tự.' : '';
      if (error) { $('#setError').textContent = error; (!title ? $('#setTitle') : $('#setWords')).focus(); return; }
      const updated = {
        id: set?.id || 'list-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
        title, words, grade: $('#setGrade').value, published: $('#setPublished').checked,
        revision: set ? set.revision + Number(JSON.stringify(set.words) !== JSON.stringify(words)) : 1
      };
      db.wordSets = [updated].concat(customSets().filter(s => s.id !== updated.id));
      save(); closeModal(); render(); toast(updated.published ? 'Đã giao bộ thẻ cho lớp ' + updated.grade : 'Đã lưu bản nháp.');
      $('#newWordSet').focus();
    };
  }
  function worksheet(set) {
    const sheets = [];
    for (let offset = 0; offset < set.words.length; offset += 8) {
      const rows = set.words.slice(offset, offset + 8).map((w, i) =>
        '<tr><th scope="row">' + (offset + i + 1) + '</th><td>' + esc(w) + '</td><td class="writing-space"></td></tr>').join('');
      sheets.push('<section class="sheet-page"><p class="sheet-brand">Vườn Chữ · Chính tả lớp ' + esc(set.grade) + '</p><h2>' + esc(set.title) +
        '</h2><div class="sheet-name">Họ tên ________________________ &nbsp; Ngày ____________</div><p>Đọc kĩ từ mẫu, gấp cột từ mẫu ra sau theo nét đứt, rồi viết lại. Mở phiếu để tự kiểm tra.</p>' +
        '<table><thead><tr><th>STT</th><th>Từ mẫu</th><th>Em viết lại</th></tr></thead><tbody>' + rows + '</tbody></table><small>Trang ' + (sheets.length + 1) +
        ' / ' + Math.ceil(set.words.length / 8) + '</small></section>');
    }
    openModal('Phiếu luyện chính tả', 'Xem trước phiếu A4', '<div class="sheet-tools"><button class="primary-btn" id="printWordSheet">In phiếu</button></div>' + sheets.join(''), 'worksheet-dialog');
    $('#printWordSheet').onclick = () => window.print();
    $('#printWordSheet').focus();
  }
  function markDifference(text, other) {
    const letters = Array.from(text), compared = Array.from(other);
    let start = 0, tail = 0;
    const shared = Math.min(letters.length, compared.length);
    while (start < shared && letters[start] === compared[start]) start++;
    while (tail < shared - start && letters[letters.length - 1 - tail] === compared[compared.length - 1 - tail]) tail++;
    const end = letters.length - tail;
    const middle = letters.slice(start, end).join('');
    return esc(letters.slice(0, start).join('')) + (middle ? '<mark>' + esc(middle) + '</mark>' : '') + esc(letters.slice(end).join(''));
  }
  function practice(set, retry = false) {
    let words = retry ? (record(set)?.missed || []).slice() : set.words.slice();
    if (!words.length) return;
    let index = 0;
    let missed = [];
    const trigger = document.activeElement;
    const roundTitle = esc(set.title);
    onModalClose = () => {
      // Keep the child's current shelf filter and query after a round.
      if (currentView === 'shelf') $('#shelfSearch').dispatchEvent(new Event('input'));
      else render();
      if (trigger?.isConnected) trigger.focus();
      else (currentView === 'shelf' ? $('#shelfSearch') : $('#viewRoot'))?.focus();
    };
    function question(reading) {
      const body = '<div class="memory-progress" aria-hidden="true"><i style="width:' + Math.round(index / words.length * 100) + '%"></i></div>' +
        (reading ? '<div class="memory-face"><p>Đọc kĩ và ghi nhớ từ này</p><strong id="memoryWord">' + esc(words[index]) +
          '</strong>' + (db.settings.sound ? '<button class="soft-btn" data-say="' + esc(words[index]) + '">🔊 Nghe từ</button>' : '') +
          '</div><button class="primary-btn memory-primary" id="coverWord">Che từ và viết →</button>' :
          '<form id="memoryForm" class="shelf-form"><label>Em nhớ từ gì?<input id="memoryInput" aria-describedby="memoryHint" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="150" required></label>' +
          '<small id="memoryHint">Viết đủ dấu và chú ý chữ viết hoa.</small><button class="primary-btn memory-primary">Kiểm tra</button>' +
          '<button type="submit" formnovalidate id="forgotWord" class="shelf-text">Em chưa nhớ</button></form>');
      openModal(roundTitle, (retry ? 'Ôn lại' : 'Luyện thẻ') + ' · Thẻ ' + (index + 1) + ' / ' + words.length, body, 'memory-dialog');
      if (reading) {
        $('#coverWord').focus();
        $('#coverWord').onclick = () => { stopSpeak(); question(false); };
      } else {
        $('#memoryInput').focus();
        $('#memoryForm').onsubmit = event => {
          event.preventDefault();
          const skipped = event.submitter?.id === 'forgotWord';
          const typed = skipped ? '' : clean($('#memoryInput').value);
          if (!typed && !skipped) { $('#memoryHint').textContent = 'Em hãy viết từ mình nhớ vào ô trên.'; return; }
          const word = words[index], right = typed === clean(word);
          if (!right) missed.push(word);
          sfx(right ? 'good' : 'bad');
          $('.modal-body').innerHTML = '<div class="memory-feedback ' + (right ? 'correct' : 'again') +
            '"><h3>' + (right ? 'Em viết đúng rồi!' : 'Cùng nhìn lại nhé') + '</h3>' +
            (skipped ? '<p>Em sẽ gặp lại từ này trong lượt ôn.</p>' : right ? '' : '<p>Em đã viết <b>' + markDifference(typed, word) + '</b></p>') +
            '<p>Từ mẫu</p><strong>' + (!right && !skipped ? markDifference(word, typed) : esc(word)) +
            '</strong></div><button class="primary-btn memory-primary" id="nextCard">' + (index + 1 === words.length ? 'Xem kết quả' : 'Thẻ tiếp theo →') + '</button>';
          $('#nextCard').focus();
          $('#nextCard').onclick = () => { index++; if (index < words.length) question(true); else finish(); };
        };
      }
    }
    function finish() {
      const score = words.length - missed.length;
      if (!S.wordRounds || typeof S.wordRounds !== 'object' || Array.isArray(S.wordRounds)) S.wordRounds = {};
      const previous = record(set);
      S.wordRounds[set.id] = {
        revision: set.revision, last: retry && previous ? previous.last : score, missed: missed.slice()
      };
      const prizes = StreakRoom.award();
      saveHistory('cards', '', 'Thẻ từ · ' + set.title, score, words.length);
      checkBadges();
      save();
      openModal(roundTitle, 'Kết quả luyện thẻ', '<div class="memory-summary"><p>' + (retry ? 'Lượt ôn lại' : 'Lượt luyện cả bộ') +
        '</p><h3>Em viết đúng ' + score + ' / ' + words.length + ' từ</h3>' +
        (missed.length ? '<p>Những từ cần nhớ thêm</p><ul>' + missed.map(w => '<li>' + esc(w) + '</li>').join('') +
        '</ul><button class="primary-btn" id="retryMissed">Ôn lại ' + missed.length + ' từ này</button>' : '<p>Em đã nhớ hết các từ trong lượt này!</p>') +
        StreakRoom.celebrate(prizes) + '<button class="soft-btn" data-close-modal>Hoàn tất</button></div>', 'memory-dialog');
      const next = $('#retryMissed');
      if (next) next.onclick = () => { words = missed.slice(); missed = []; index = 0; retry = true; question(true); };
      (next || $('.memory-summary [data-close-modal]')).focus();
    }
    question(true);
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    const { practiceSet, retrySet, editSet, sheet } = target.dataset;
    if (practiceSet || retrySet) {
      const set = library().find(s => s.id === (practiceSet || retrySet));
      if (set) practice(set, !!retrySet);
    } else if (currentView === 'teacher' && teacherOK) {
      if (target.id === 'newWordSet') editor();
      if (editSet || sheet) {
        const set = customSets().find(s => s.id === (editSet || sheet));
        if (set) (editSet ? editor : worksheet)(set);
      }
    }
  });
  return { home, page, bind, teacherPanel, dueSets, dueCount, reviewList };
})();
