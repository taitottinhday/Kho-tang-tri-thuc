/* Bài luyện theo chủ đề và câu hỏi do giáo viên biên soạn. */
'use strict';
const ClassPractice = (() => {
  const labels = { choice: 'Chọn cách viết đúng', fill: 'Điền chữ còn thiếu', picture: 'Nhìn tranh chọn từ',
    listen: 'Nghe viết từ ngữ', order: 'Xếp tiếng thành cụm từ', sort: 'Chọn nhóm chính tả' };
  const pictures = { '1f414': 'gà', '1f407': 'thỏ', '1f986': 'vịt', '1f422': 'rùa', '1f43f': 'sóc', '1f33b': 'hoa hướng dương', '1f34e': 'táo', '1f4da': 'sách' };
  const samples = [
    ['choice','l1-08','Em dùng gì để cắt giấy?','cái kéo',['cái kéo','cái céo','cái quéo']],
    ['choice','l3-02','Chọn cụm từ viết đúng.','giữ gìn',['giữ gìn','dữ dìn','rữ rìn']],
    ['choice','l2-04','Chọn cụm từ viết đúng để điền vào câu “Em luôn … giúp bạn.”','sẵn sàng',['sẵn sàng','sẳn sàng']],
    ['picture','l2-05','Nhìn tranh và chọn tên viết đúng.','con gà',['con gà','con ghà'],'1f414'],
    ['picture','l1-13','Nhìn tranh và chọn tên viết đúng.','con rùa',['con rùa','con dùa','con giùa'],'1f422'],
    ['picture','l2-03','Nhìn tranh và chọn tên viết đúng.','con sóc',['con sóc','con xóc'],'1f43f'],
    ['fill','l2-03','Các bạn chơi ngoài ___ân trường.','s'],
    ['fill','l2-10','Bé đội ___ón khi ra nắng.','n'],
    ['fill','l2-01','Bạn Lan ___ăm chỉ học bài.','ch'],
    ['fill','l2-04','Mẹ luôn ___ sàng giúp đỡ mọi người.','sẵn'],
    ['listen','l1-08','Nghe rồi viết lại cụm từ.','con kiến'],
    ['listen','l2-01','Nghe rồi viết lại cụm từ.','trăng tròn'],
    ['listen','l2-03','Nghe rồi viết lại cụm từ.','xinh xắn'],
    ['listen','l3-02','Nghe rồi viết lại cụm từ.','gia đình'],
    ['listen','l2-10','Nghe rồi viết lại cụm từ.','lá non'],
    ['listen','l2-04','Nghe rồi viết lại cụm từ.','dễ thương'],
    ['order','l2-01','Xếp các tiếng thành cụm từ chỉ hoạt động dưới nước.','chèo thuyền'],
    ['order','l2-03','Xếp các tiếng thành cụm từ chỉ nơi học sinh chơi giờ ra chơi.','sân trường'],
    ['order','l2-10','Xếp các tiếng thành cụm từ chỉ bộ phận của cây.','lá cây'],
    ['sort','l3-02','“Dịu dàng” có hai tiếng bắt đầu bằng chữ nào?','d',['d','gi','r']],
    ['sort','l2-04','Tiếng “nhẫn” trong “kiên nhẫn” mang dấu nào?','ngã',['hỏi','ngã','nặng']],
    ['sort','l2-03','“Xinh xắn” có hai tiếng bắt đầu bằng chữ nào?','x',['s','x']]
  ];
  const seed = samples.map(([type, topic, prompt, answer, choices, image], i) => ({
    id: 'm' + i, type, topic, prompt, answer, choices, image,
    grades: SCHOOL_GRADES.filter(g => gradeTopics(g).some(t => t.id === topic)), active: true
  }));
  const clean = value => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/g, ' ') : '';
  const isPick = type => ['choice','picture','sort'].includes(type);
  function validate(q) {
    const type = q?.type, topic = getTopic(q?.topic);
    const grades = [...new Set((Array.isArray(q?.grades) ? q.grades : []).map(Number))];
    const prompt = clean(q?.prompt), answer = clean(q?.answer), note = clean(q?.note), alt = clean(q?.alt);
    const choices = Array.isArray(q?.choices) ? q.choices.map(clean).filter(Boolean) : [];
    const image = typeof q?.image === 'string' ? q.image : '';
    if (!Object.hasOwn(labels, type) || !topic || !grades.length || !grades.every(g => gradeTopics(g).includes(topic))) throw Error('Chọn dạng, chủ đề và khối có chủ đề này.');
    if (!prompt || !answer || prompt.length > 240 || answer.length > 70 || note.length > 300 || alt.length > 120) throw Error('Cần có đề và đáp án. Đề tối đa 240 kí tự, đáp án tối đa 70 kí tự.');
    if (isPick(type) && (choices.length < 2 || choices.length > 4 || choices.length !== new Set(choices).size || !choices.includes(answer) || choices.some(c => c.length > 70))) throw Error('Nhập 2–4 lựa chọn khác nhau, gồm cả đáp án đúng.');
    if (type === 'fill' && (prompt.match(/___/g) || []).length !== 1) throw Error('Câu điền chữ cần đúng một chỗ trống viết bằng ___.');
    if (type === 'order' && (answer.split(' ').length < 2 || answer.split(' ').length > 8 || new Set(answer.split(' ')).size < 2)) throw Error('Đáp án xếp tiếng cần 2–8 tiếng, trong đó có ít nhất hai tiếng khác nhau.');
    if (type === 'picture' && !Object.hasOwn(pictures, image) && !(alt && image.length <= 410000 && /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(image))) throw Error('Chọn hình có sẵn hoặc tải ảnh lên và nhập mô tả ảnh.');
    return { type, topic: topic.id, grades, prompt, answer, note, choices, image: type === 'picture' ? image : '', alt, active: q.active !== false };
  }
  let cachedQuestions, cachedSource;
  function entries() {
    const changed = db.classQuestions;
    if (cachedQuestions && changed === cachedSource) return cachedQuestions;
    const byId = new Map(seed.map(q => [q.id, q]));
    for (const q of Array.isArray(changed) ? changed : []) {
      if (!q || !/^(?:m\d+|q[\w-]+)$/.test(q.id)) continue;
      try { byId.set(q.id, { id: q.id, ...validate(q) }); } catch { /* Dữ liệu sao lưu cũ */ }
    }
    cachedSource = changed;
    cachedQuestions = [...byId.values()];
    return cachedQuestions;
  }
  function item(q) {
    return { ...q, loai: 'classQuestion', _t: q.topic, _i: 'cq-' + q.id, dapAn: q.answer };
  }
  function byKey(topic, token) {
    const q = entries().find(entry => entry.id === token.slice(3) && entry.topic === topic && entry.active && entry.grades.includes(Number(S.grade)));
    return q ? item(q) : null;
  }
  function eligible(topic, type = 'all') {
    return entries().filter(q => q.active && q.grades.includes(Number(S.grade)) && (topic === 'all' || q.topic === topic) && (type === 'all' || q.type === type));
  }
  function play(topic, type) {
    const built = ['all','choice'].includes(type) ? gradeTopics(S.grade).filter(t => topic === 'all' || t.id === topic).flatMap(t =>
      t.baiTap.map((q, i) => ({ ...q, _t: t.id, _i: i })).filter(q => type === 'all' || q.loai === 'chon')) : [];
    const custom = shuffle(eligible(topic, type).map(item)).slice(0, 6);
    const questions = shuffle(custom.concat(shuffle(built).slice(0, 8 - custom.length)));
    if (!questions.length) { toast('Chưa có câu hỏi phù hợp. Em chọn chủ đề hoặc dạng khác nhé.'); return; }
    startQuiz({ kind: 'classPractice', title: topic === 'all' ? 'Luyện theo khối' : getTopic(topic).ten,
      icon: '🧩', topicId: topic === 'all' ? '' : topic, items: questions, bankFilter: [topic, type] });
  }
  const option = (value, name, selected) => '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') + '>' + esc(name) + '</option>';
  const gradeOpts = value => SCHOOL_GRADES.map(g => option(g, 'Lớp ' + g, String(g) === String(value))).join('');
  const typeOpts = value => Object.entries(labels).map(([k, name]) => option(k,name,k === value)).join('');
  const topicOpts = (topics,value) => topics.map(t => option(t.id,t.ten,t.id === value)).join('');
  function page() {
    return pageHeading('ÔN LUYỆN · LỚP ' + S.grade, 'Luyện theo chủ đề', 'Chọn lỗi chính tả em muốn luyện rồi chọn cách làm bài.') +
      '<div class="practice-link"><span>Thầy cô có thể chia sẻ phiếu học tập và tài liệu cho lớp.</span><button class="soft-btn" data-view="docs">📚 Tài liệu của thầy cô</button></div>' +
      '<form id="practiceFilter" class="project-panel lesson-filter"><label>Chủ đề<select id="practiceTopic">' + option('all','Mọi chủ đề') + topicOpts(myTopics()) +
      '</select></label><label>Dạng bài<select id="practiceType">' + option('all','Trộn nhiều dạng') + typeOpts() +
      '</select></label><p id="practiceInfo" aria-live="polite"></p><button class="primary-btn big">Bắt đầu luyện →</button></form>';
  }
  function bindPractice() {
    if (!window.__classQuestionsLoaded) {
      window.__classQuestionsLoaded = true;
      MayChu.loadQuestions().then(() => { if (currentView === 'practice') render(); });
    }
    const form = $('#practiceFilter');
    form.onchange = () => {
      const type = $('#practiceType').value;
      const count = eligible($('#practiceTopic').value, type).length;
      $('#practiceInfo').textContent = ['all','choice'].includes(type) ? 'Gồm câu mẫu theo chủ đề và câu đã được công bố trong kho giáo viên.' :
        count ? 'Có ' + count + ' câu thuộc dạng này.' : 'Chủ đề này chưa có câu thuộc dạng đã chọn.';
      $('button', form).disabled = !count && !['all','choice'].includes(type);
    };
    form.onchange();
    form.onsubmit = e => { e.preventDefault(); play($('#practiceTopic').value, $('#practiceType').value); };
  }
  function show(q) {
    const kind = q.type;
    const img = kind === 'picture' ? '<img class="practice-image" src="' + esc(pictures[q.image] ? 'assets/emoji/' + q.image + '.webp' : q.image) +
      '" alt="' + esc(q.alt || pictures[q.image]) + '">' : '';
    let content = '<p class="class-type">' + labels[kind] + '</p><p class="question-prompt">' + esc(q.prompt).replace('___','…') + '</p>' + img;
    if (kind === 'listen') content += '<button class="soft-btn" id="practiceListen">🔊 Nghe từ</button> <button class="soft-btn" id="practiceSlow">Nghe chậm</button>';
    if (isPick(kind)) content += optionsHtml(shuffle(q.choices),'data-answer');
    else if (kind === 'order') {
      let tokens = shuffle(q.answer.split(' '));
      if (tokens.join(' ') === q.answer) tokens.push(tokens.shift());
      content += '<output id="practiceOrder" aria-live="polite">Chạm từng tiếng theo thứ tự</output><div class="practice-tokens">' +
        tokens.map(word => '<button class="soft-btn" data-practice-token="' + esc(word) + '">' + esc(word) + '</button>').join('') +
        '<button class="soft-btn" id="practiceRedo">Xếp lại</button></div>';
    } else content += '<label class="practice-answer">Câu trả lời<input id="practiceAnswer" class="dictation-input" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="90"></label>';
    openPlayer(playerShell(content,q));
    const evaluate = typed => ({
      right: clean(typed) === q.answer,
      html: 'Đáp án: <b>' + esc(q.answer) + '</b>' + (q.note ? '<div class="pl-hint">' + esc(q.note) + '</div>' : '')
    });
    if (kind === 'listen') {
      $('#practiceListen').onclick = () => speak(q.answer);
      $('#practiceSlow').onclick = () => speak(q.answer,0.65);
    }
    if (isPick(kind)) bindOptions(value => { markOptions(q.answer,value); return evaluate(value); });
    else if (kind === 'order') {
      const buttons = $$('[data-practice-token]'), picked = [];
      buttons.forEach(button => button.onclick = () => {
        if (Q.answered) return;
        picked.push(button.dataset.practiceToken); button.disabled = true;
        $('#practiceOrder').textContent = picked.join(' ');
        setReady(picked.length === buttons.length ? () => evaluate(picked.join(' ')) : null);
      });
      $('#practiceRedo').onclick = () => {
        if (Q.answered) return;
        picked.length = 0; buttons.forEach(b => b.disabled = false);
        $('#practiceOrder').textContent = 'Chạm từng tiếng theo thứ tự'; setReady(null);
      };
    } else {
      const input = $('#practiceAnswer');
      input.oninput = () => setReady(clean(input.value) ? () => { input.readOnly = true; return evaluate(input.value); } : null);
      input.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing && clean(input.value)) doCheck(); };
    }
  }
  function download(name, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const link = document.createElement('a'); link.href = url; link.download = name;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  function saveRows(rows) {
    const previous = Array.isArray(db.classQuestions) ? db.classQuestions : [];
    const ids = new Set(rows.map(q => q.id));
    const old = db.classQuestions;
    db.classQuestions = previous.filter(q => !ids.has(q.id)).concat(rows);
    try { localStorage.setItem(STORE_KEY,JSON.stringify(db)); }
    catch (error) { db.classQuestions = old; throw Error('Bộ nhớ trình duyệt đã đầy. Hãy thử ảnh nhỏ hơn.'); }
    MayChu.saveQuestions(rows);
    updateChrome();
  }
  const uid = () => 'q' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10);
  function questionPanel() {
    return '<section class="project-panel"><h2>Kho câu hỏi</h2><p>Thêm hoặc chỉnh câu theo chủ đề, khối lớp và dạng bài. Câu được công bố sẽ hiện trong mục Luyện theo chủ đề.</p>' +
      '<div class="btn-row"><button class="primary-btn" id="questionNew">+ Soạn câu hỏi</button><button class="soft-btn" id="questionTemplate">Tải mẫu JSON</button>' +
      '<label class="soft-btn file-btn">Nhập câu hỏi JSON<input id="questionImport" type="file" accept=".json,application/json" hidden></label></div>' +
      '<p id="questionStatus" role="status"></p><label>Tìm trong kho<input id="bankSearch" type="search" placeholder="Đề bài hoặc đáp án"></label>' +
      '<label>Khối lớp<select id="bankGrade">' + option('all','Tất cả các lớp') + gradeOpts() + '</select></label><div id="bankEntries"></div></section>';
  }
  function edit(q) {
    const data = q || { grades: [Number(S.grade)], type:'choice', topic: myTopics()[0].id };
    let uploaded = data.image && !pictures[data.image] ? data.image : '';
    openModal(q ? 'Chỉnh câu hỏi' : 'Soạn câu hỏi','Chọn chủ đề phù hợp với khối lớp trước khi công bố.',
      '<form id="questionForm" class="project-form"><label>Dạng bài<select id="questionType">' + typeOpts(data.type) +
      '</select></label><label>Chủ đề<select id="questionTopic">' + topicOpts(ALL_TOPICS.filter(t => SCHOOL_GRADES.some(g => gradeTopics(g).includes(t))),data.topic) +
      '</select></label><fieldset><legend>Khối lớp</legend>' + SCHOOL_GRADES.map(g => '<label class="project-check"><input type="checkbox" name="questionGrade" value="' + g +
        '"' + (data.grades.includes(g) ? ' checked' : '') + '> Lớp ' + g + '</label>').join('') + '</fieldset>' +
      '<label>Đề bài<textarea id="questionPrompt" maxlength="240" required>' + esc(data.prompt || '') + '</textarea></label>' +
      '<label>Đáp án đúng<input id="questionAnswer" maxlength="70" required value="' + esc(data.answer || '') + '"></label>' +
      '<label id="questionChoiceField">Các lựa chọn, mỗi dòng một lựa chọn<textarea id="questionChoices" rows="4">' + esc((data.choices || []).join('\n')) + '</textarea></label>' +
      '<div id="questionImageField"><label>Hình có sẵn<select id="questionImage">' + option('','Chọn hình có sẵn hoặc tải ảnh') +
      Object.entries(pictures).map(([id,name]) => option(id,name,id === data.image)).join('') + '</select></label>' +
      '<label>Ảnh của thầy cô<input type="file" accept="image/png,image/jpeg,image/webp" id="questionUpload"></label><img id="questionPreview" class="practice-image" alt=""></div>' +
      '<label id="questionAltField">Mô tả ảnh cho học sinh dùng trình đọc màn hình<input id="questionAlt" maxlength="120" value="' + esc(data.alt || '') + '"></label>' +
      '<label>Giải thích sau khi chấm<textarea id="questionNote" maxlength="300">' + esc(data.note || '') + '</textarea></label>' +
      '<label class="project-check"><input id="questionActive" type="checkbox"' + (data.active === false ? '' : ' checked') + '> Công bố cho học sinh</label>' +
      '<p id="questionError" role="alert"></p><button class="primary-btn" id="questionSave">Lưu câu hỏi</button></form>');
    const field = $('#questionType');
    function fields() {
      const pic = field.value === 'picture';
      $('#questionChoiceField').hidden = !isPick(field.value);
      $('#questionImageField').hidden = $('#questionAltField').hidden = !pic;
      $('#questionPrompt').placeholder = field.value === 'fill' ? 'Ví dụ: Bé đội ___ón khi ra nắng.' : 'Viết lời dẫn cho học sinh.';
      const preview = $('#questionPreview'), selected = $('#questionImage').value;
      preview.hidden = !selected && !uploaded;
      if (!preview.hidden) preview.src = selected ? 'assets/emoji/' + selected + '.webp' : uploaded;
    }
    field.onchange = $('#questionImage').onchange = fields; fields();
    $('#questionUpload').onchange = async e => {
      const file = e.target.files[0], control = $('#questionSave'), error = $('#questionError');
      if (!file) return;
      control.disabled = true;
      try {
        if (file.size > 5000000 || !/^image\/(jpeg|png|webp)$/.test(file.type)) throw Error('Chọn ảnh PNG, JPG hoặc WebP dưới 5 MB.');
        const bitmap = await createImageBitmap(file), canvas = document.createElement('canvas');
        const ratio = Math.min(1,400 / Math.max(bitmap.width,bitmap.height));
        canvas.width = Math.max(1,Math.round(bitmap.width * ratio)); canvas.height = Math.max(1,Math.round(bitmap.height * ratio));
        canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
        if (!control.isConnected) return;
        uploaded = canvas.toDataURL('image/webp',0.75); $('#questionImage').value = ''; error.textContent = ''; fields();
      } catch (e) { error.textContent = e.message; }
      finally { control.disabled = false; }
    };
    $('#questionForm').onsubmit = e => {
      e.preventDefault();
      try {
        const valid = validate({ type: field.value, topic: $('#questionTopic').value, grades: $$('[name=questionGrade]:checked').map(i => i.value),
          prompt: $('#questionPrompt').value, answer: $('#questionAnswer').value, choices: $('#questionChoices').value.split(/\r?\n/),
          note: $('#questionNote').value, image: $('#questionImage').value || uploaded, alt: $('#questionAlt').value, active: $('#questionActive').checked });
        saveRows([{ id: q && q.topic === valid.topic ? q.id : uid(), ...valid }].concat(q && q.topic !== valid.topic ? [{ ...q, active:false }] : []));
        closeModal(); render(); toast('Đã lưu câu hỏi.');
      } catch (error) { $('#questionError').textContent = error.message; }
    };
  }
  function bindBank() {
    const search = $('#bankSearch'), grade = $('#bankGrade'), list = $('#bankEntries');
    function results() {
      const term = search.value.normalize('NFC').trim().toLocaleLowerCase('vi');
      const rows = entries().filter(q => (grade.value === 'all' || q.grades.includes(Number(grade.value))) &&
        (q.prompt + ' ' + q.answer).toLocaleLowerCase('vi').includes(term));
      list.innerHTML = rows.map(q => '<article class="project-row"><div><b>' + esc(q.prompt) + '</b><small>' + esc(labels[q.type]) + ' · Lớp ' + q.grades.join(', ') +
        ' · ' + (q.active ? 'Đã công bố' : 'Bản nháp') + '</small></div><button class="soft-btn" data-question-edit="' + q.id + '">Sửa</button></article>').join('') ||
        '<p>Chưa tìm thấy câu hỏi.</p>';
      $$('[data-question-edit]',list).forEach(b => b.onclick = () => edit(rows.find(q => q.id === b.dataset.questionEdit)));
    }
    search.oninput = grade.onchange = results; results();
    $('#questionNew').onclick = () => edit();
    $('#questionTemplate').onclick = () => download('mau-cau-hoi-vuon-chu.json',JSON.stringify(seed.map(({id,...q}) => q),null,2),'application/json');
    $('#questionImport').onchange = async e => {
      const file = e.target.files[0], error = $('#questionStatus');
      if (!file) return;
      try {
        if (file.size > 2000000) throw Error('Tệp vượt quá 2 MB.');
        const data = JSON.parse((await file.text()).replace(/^\uFEFF/,''));
        if (!Array.isArray(data) || !data.length || data.length > 100) throw Error('Tệp phải là danh sách từ 1 đến 100 câu như tệp mẫu.');
        const rows = data.map((q,i) => {
          try { return { id: uid(), ...validate({ ...q, active:false }) }; }
          catch (error) { throw Error('Câu ' + (i + 1) + ' · ' + error.message); }
        });
        if (!error.isConnected || currentView !== 'teacher' || !teacherOK) return;
        saveRows(rows); results(); error.textContent = 'Đã nhập ' + rows.length + ' câu ở dạng bản nháp.';
      } catch (e) { error.textContent = e instanceof SyntaxError ? 'Tệp JSON chưa đúng cú pháp.' : e.message; }
      e.target.value = '';
    };
  }
  return { page, bindPractice, show, byKey, play, questionPanel, bindBank, gradeOpts, download };
})();
registerView('practice', 'Luyện theo chủ đề', ClassPractice.page, ClassPractice.bindPractice);
