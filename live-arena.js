/* Đấu trường trực tiếp: giáo viên tạo phòng, học sinh vào bằng mã lớp đã kết nối. */
'use strict';
const LiveArena = (() => {
  const CLASS_KEY = 'vuonchu.classCode';
  const TOKEN_KEY = 'vuonchu.teacherToken';
  const PROFILE_KEY = 'vuonchu.v2';
  const codeOk = value => /^[A-HJ-NP-Z2-9]{6}$/.test(String(value || '').toUpperCase());
  const token = () => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
  async function request(path, { method='GET', body, teacher=false } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (teacher && token()) headers.Authorization = 'Bearer ' + token();
    const response = await fetch(path,{ method, headers, ...(body ? {body:JSON.stringify(body)} : {}), cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(data.error || 'Máy chủ chưa trả lời. Thầy cô thử lại nhé.');
    return data;
  }
  const label = value => esc(value || '');
  const questionLabel = value => label(value).replace(/_{3,}/g,'<span class="live-blank">?</span>');
  const classCode = () => { try { return String(localStorage.getItem(CLASS_KEY) || '').toUpperCase(); } catch { return ''; } };
  const profile = () => {
    try { return db.profiles?.[db.current] || null; } catch { return null; }
  };
  function toItems(items) {
    return items.slice(0,15).map(it => ({ prompt:it.de, answer:it.dapAn, choices:shuffle(it.luaChon || []), rule:(getTopic(it._t)?.quyTac || [''])[0] }));
  }
  async function host(items,title,seconds) {
    const code = classCode();
    if (!token()) { toast('Thầy cô hãy đăng nhập ở Góc giáo viên trước khi tạo phòng trực tuyến.'); return; }
    if (!codeOk(code)) { toast('Thầy cô hãy kết nối hoặc tạo mã lớp ở Góc giáo viên trước nhé.'); return; }
    if (items.length < 3) { toast('Chưa có đủ 3 câu chọn chữ đúng cho chủ đề này.'); return; }
    try {
      const result = await request('/api/live-games',{ method:'POST', teacher:true, body:{ classCode:code, title, seconds, items:toItems(items) } });
      hostRoom(result.code,code);
    } catch (error) { toast(error.message); }
  }
  function roomApi(code,codeClass,student,hostMode=false) {
    const query = new URLSearchParams({ classCode:codeClass });
    if (student) query.set('profileId',student);
    return request('/api/live-games/' + encodeURIComponent(code) + '?' + query.toString(),{teacher:hostMode});
  }
  function roomAction(code,action,payload,hostMode=false) {
    return request('/api/live-games/' + encodeURIComponent(code) + '/' + action,{method:'POST',teacher:hostMode,body:payload});
  }
  function hostRoom(code,codeClass) {
    let lastKey = '', pollId = 0, clockId = 0, state = null, busy = false;
    const controls = '<section class="live-room-panel" id="liveHostPanel"><div class="live-room-loading">✨ Đang mở cánh cửa lớp học…</div></section>';
    openModal('🏆 Đấu trường chữ','Mã phòng riêng · ' + esc(codeClass),controls,'live-arena-dialog');
    $('#modalRoot .modal-close')?.focus();
    const panel = () => $('#liveHostPanel');
    const act = async action => {
      if (action === 'end' && state?.phase === 'complete') { closeModal(); return; }
      if (busy) return; busy=true;
      try { await roomAction(code,action,{classCode:codeClass},true); lastKey=''; }
      catch (error) { toast(error.message); }
      finally { busy=false; }
      await refresh();
    };
    const sig = s => JSON.stringify([s.phase,s.round,s.answeredCount,s.participants.map(p=>[p.name,p.score,p.answered,p.correct])]);
    function view(s) {
      const count = s.participants.length, number = s.round + 1;
      const roster = s.participants.length ? '<div class="live-roster">' + s.participants.map(p => '<span><i>' + label(p.avatar || '🙂') + '</i>' + label(p.name) + (s.phase === 'question' && p.answered ? ' <b>✓</b>' : '') + '</span>').join('') + '</div>' : '<div class="live-empty-roster"><span>🐰</span><b>Đang chờ các bạn vào phòng</b><small>Học sinh mở Trò chơi → Vào phòng đấu chữ rồi nhập mã bên trên.</small></div>';
      let inside='';
      if (s.phase === 'waiting') inside = '<div class="live-wait"><div class="live-room-code-label">MÃ PHÒNG · LỚP ' + label(codeClass) + '</div><button class="live-room-code" id="liveCopy" aria-label="Sao chép mã phòng">' + label(code) + '<span>⧉</span></button><p>Chiếu mã này lên bảng để các bạn vào chơi. Học sinh cần kết nối hồ sơ với mã lớp trước.</p>' + roster + '<button class="world-cta live-control" data-live-control="start" ' + (!count ? 'disabled' : '') + '>Bắt đầu đấu trường <span>→</span></button></div>';
      else if (s.phase === 'question') inside = '<div class="live-question"><div class="live-round">CÂU ' + number + ' / ' + s.total + '<span>' + s.answeredCount + ' / ' + count + ' bạn đã trả lời</span></div><h2>' + questionLabel(s.question?.prompt) + '</h2><div class="live-options">' + (s.question?.choices || []).map((c,i) => '<div style="--choice-i:' + i + '"><b>' + 'ABCD'[i] + '</b>' + label(c) + '</div>').join('') + '</div><div class="live-countdown"><div><i id="liveBar"></i></div><b id="liveSeconds">' + s.seconds + '</b></div><button class="world-cta live-control" data-live-control="reveal">Hiện đáp án <span>✨</span></button></div>';
      else if (s.phase === 'reveal') inside = '<div class="live-reveal"><span class="live-round">ĐÁP ÁN CÂU ' + number + ' · ' + s.answeredCount + ' / ' + count + ' BẠN ĐÃ TRẢ LỜI</span><h2>' + label(s.question?.answer) + '</h2><p>' + label(s.question?.rule) + '</p><div class="live-results">' + s.participants.map(p => '<div><span>' + label(p.avatar || '🙂') + ' ' + label(p.name) + '</span><b class="' + (p.correct ? 'is-right' : 'is-miss') + '">' + (p.answered ? (p.correct ? '+10 ⭐' : 'Thử lại lần sau') : 'Chưa kịp trả lời') + '</b></div>').join('') + '</div><button class="world-cta live-control" data-live-control="next">' + (number >= s.total ? 'Xem bảng vinh danh' : 'Mở câu tiếp theo') + ' <span>→</span></button></div>';
      else inside = '<div class="live-final"><img src="assets/tho-tham-hiem-vuon-chu.png" alt="Thỏ Lá chúc mừng cả lớp"/><small>HOÀN THÀNH CUỘC PHIÊU LƯU</small><h2>Cả lớp đã làm nên một trận đấu tuyệt vời!</h2><div class="live-results live-podium">' + s.participants.slice().sort((a,b)=>b.score-a.score).map((p,i) => '<div><span>' + (['🥇','🥈','🥉'][i] || (i+1)+'.') + ' ' + label(p.avatar || '🙂') + ' ' + label(p.name) + '</span><b>' + p.score + ' điểm</b></div>').join('') + '</div><button class="soft-btn live-control" data-live-control="end">Đóng bảng điểm</button></div>';
      const hostTools = s.phase === 'complete' ? '' : '<button class="live-stop" data-live-control="end">Kết thúc phòng</button>';
      return '<section class="live-room-panel" id="liveHostPanel" data-phase="' + label(s.phase) + '"><div class="live-host-top"><span class="live-host-pill"><i></i> TRỰC TIẾP</span><span>Lớp ' + label(codeClass) + '</span>' + hostTools + '</div>' + inside + '</section>';
    }
    async function refresh() {
      if ($('#modalRoot').hidden || busy) return;
      try {
        state = await roomApi(code,codeClass,null,true);
        const nextKey=sig(state);
        if (nextKey !== lastKey) { const target=panel(); if(target) target.outerHTML=view(state); lastKey=nextKey; }
        updateClock(state);
      } catch (error) { const target=panel(); if(target && !target.querySelector('.live-room-error')) target.insertAdjacentHTML('beforeend','<p class="live-room-error" role="alert">' + label(error.message) + '</p>'); }
    }
    function updateClock(s) {
      const seconds=$('#liveSeconds'),bar=$('#liveBar'); if(!seconds || !bar || !s.deadlineAt) return;
      const left=Math.max(0,Math.ceil((s.deadlineAt-Date.now())/1000)); seconds.textContent=left;
      bar.style.width=(Math.max(0,left/s.seconds*100))+'%'; seconds.classList.toggle('low',left<=5);
    }
    function bindControls(event) {
      const button=event.target.closest('[data-live-control]'); if(button) { event.preventDefault(); act(button.dataset.liveControl); return; }
      if(event.target.closest('#liveCopy')) {
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(()=>toast('Đã sao chép mã phòng ' + code + '!')).catch(()=>toast('Mã phòng: ' + code));
        else toast('Mã phòng: ' + code);
      }
    }
    $('#modalRoot').addEventListener('click',bindControls);
    pollId=setInterval(refresh,1300); clockId=setInterval(()=>state&&updateClock(state),250); refresh();
    const cleanup=()=>{clearInterval(pollId);clearInterval(clockId);$('#modalRoot').removeEventListener('click',bindControls);};
    onModalClose=()=>{cleanup();if(state?.phase!=='complete')roomAction(code,'end',{classCode:codeClass},true).catch(()=>{});render();};
  }
  function join() {
    if (typeof GUEST_MODE !== 'undefined' && GUEST_MODE) { toast('Mở hồ sơ học sinh để vào phòng đấu nhé.'); return; }
    const codeClass=classCode(), student=profile();
    openModal('🔢 Vào phòng đấu chữ','Nhập mã 6 kí tự thầy cô đang chiếu.','<div class="live-join-card"><div class="live-join-illustration"><img src="assets/tho-tham-hiem-vuon-chu.png" alt="Thỏ Lá đang chờ em"/><span>✦</span></div><p>Thỏ Lá đã chuẩn bị chỗ cho <b>' + label(student?.name || 'em') + '</b>!</p><form id="liveJoinForm"><label for="liveJoinCode">Mã phòng đấu</label><input id="liveJoinCode" inputmode="latin" maxlength="6" autocomplete="off" placeholder="VÍ DỤ: AB23CD" aria-describedby="liveJoinHelp"/><small id="liveJoinHelp">' + (codeOk(codeClass) ? 'Hồ sơ đã kết nối với lớp ' + label(codeClass) + '.' : 'Em cần kết nối hồ sơ với lớp trước khi vào chơi.') + '</small><p id="liveJoinError" role="alert"></p><button class="world-cta" type="submit">Vào phòng <span>→</span></button></form></div>');
    const input=$('#liveJoinCode'),form=$('#liveJoinForm'); input?.focus();
    if (input) input.oninput=()=>{input.value=input.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,'').slice(0,6);};
    form.onsubmit=async event=>{
      event.preventDefault(); const code=input.value.toUpperCase(),error=$('#liveJoinError'),button=form.querySelector('button');
      if (!codeOk(code)) { error.textContent='Mã phòng gồm 6 kí tự. Em kiểm tra lại trên bảng nhé.'; return; }
      if (!codeOk(codeClass) || !student) { error.textContent='Thầy cô hãy kết nối hồ sơ này với mã lớp trước nhé.'; return; }
      button.disabled=true; error.textContent='';
      try { await roomAction(code,'join',{classCode:codeClass,profileId:student.id}); studentRoom(code,codeClass,student.id); }
      catch (err) { error.textContent=err.message; button.disabled=false; }
    };
  }
  function studentRoom(code,codeClass,profileId) {
    let lastKey='',pollId=0,clockId=0,state=null,busy=false;
    const screen='<section class="live-student-screen" id="liveStudentScreen"><div class="live-room-loading">🐰 Thỏ Lá đang tìm phòng cho em…</div></section>';
    openModal('🏆 Đấu trường chữ','Phòng ' + esc(code) + ' · Lớp ' + esc(codeClass),screen,'live-arena-mode');
    $('#modalRoot .modal-close')?.focus();
    const signature=s=>JSON.stringify([s.phase,s.round,s.me?.answer?.choice,s.me?.score,s.question?.answer]);
    async function sendAnswer(choice) {
      if (busy) return; busy=true;
      try { await roomAction(code,'answer',{classCode:codeClass,profileId,round:state.round,choice}); lastKey=''; }
      catch(error){toast(error.message);}
      finally{busy=false;}
      await refresh();
    }
    function view(s) {
      const number=s.round+1,me=s.me||{score:0,answer:null};
      if(s.phase==='waiting') return '<section class="live-student-screen"><div class="live-host-pill"><i></i> ĐÃ VÀO PHÒNG</div><div class="live-student-wait"><img src="assets/tho-tham-hiem-vuon-chu.png" alt=""/><span>🏆</span><h2>Chỗ của em đã sẵn sàng!</h2><p>Nhìn lên bảng nhé. Thầy cô sẽ bắt đầu khi các bạn đã vào đủ.</p><b>Mã phòng ' + esc(code) + '</b></div></section>';
      if(s.phase==='question') return '<section class="live-student-screen live-student-question"><div class="live-round">CÂU ' + number + ' / ' + s.total + '<span>⭐ ' + me.score + ' điểm</span></div><div class="live-countdown"><div><i id="liveBar"></i></div><b id="liveSeconds">' + s.seconds + '</b></div><h2>' + questionLabel(s.question?.prompt) + '</h2>' + (me.answer ? '<div class="live-locked-answer"><span>✅</span><b>Đã nhận đáp án của em!</b><small>Đợi thầy cô hiện kết quả nhé.</small></div>' : '<div class="live-student-options">' + (s.question?.choices || []).map((choice,index)=>'<button style="--choice-i:' + index + '" data-live-answer="' + label(choice) + '"><span>' + 'ABCD'[index] + '</span>' + label(choice) + '</button>').join('') + '</div>') + '</section>';
      if(s.phase==='reveal') return '<section class="live-student-screen live-student-reveal"><div class="live-reveal-burst">' + (me.answer?.correct ? '🎉' : '💡') + '</div><small>CÂU ' + number + ' · ' + (me.answer?.correct ? 'EM TRẢ LỜI ĐÚNG!' : 'MÌNH CÙNG HỌC NHÉ') + '</small><h2>' + label(s.question?.answer) + '</h2><p>' + label(s.question?.rule || 'Từ đúng đã được mở. Em nhớ nhìn thật kĩ các chữ nhé!') + '</p><div class="live-locked-answer"><span>' + (me.answer?.correct ? '🌟' : '🐰') + '</span><b>' + (me.answer?.correct ? '+10 điểm cho em' : 'Câu sau mình thử tiếp!') + '</b><small>Thỏ Lá đang chờ thầy cô mở câu kế tiếp.</small></div></section>';
      const rank=me.rank || null;
      return '<section class="live-student-screen live-student-reveal"><div class="live-reveal-burst">🏆</div><small>CUỘC PHIÊU LƯU ĐÃ KHÉP LẠI</small><h2>Em nhận được ' + me.score + ' điểm!</h2><p>' + (rank ? 'Vị trí của em trong lớp: ' + rank + ' / ' + s.participants.length : 'Cảm ơn em đã cùng lớp tham gia!') + '</p><div class="live-final-rabbit"><img src="assets/tho-tham-hiem-vuon-chu.png" alt="Thỏ Lá chúc mừng em"/></div><button class="soft-btn" data-live-student-close>Đóng phòng</button></section>';
    }
    async function refresh() {
      if($('#modalRoot').hidden||busy)return;
      try {
        state=await roomApi(code,codeClass,profileId,false); const key=signature(state);
        if(key!==lastKey){const target=$('#liveStudentScreen');if(target)target.outerHTML=view(state);lastKey=key;}
        updateClock(state);
      } catch(error){const target=$('#liveStudentScreen');if(target&&!target.querySelector('.live-room-error'))target.insertAdjacentHTML('beforeend','<p class="live-room-error" role="alert">' + label(error.message) + '</p>');}
    }
    function updateClock(s){const seconds=$('#liveSeconds'),bar=$('#liveBar');if(!seconds||!bar||!s.deadlineAt)return;const left=Math.max(0,Math.ceil((s.deadlineAt-Date.now())/1000));seconds.textContent=left;bar.style.width=(Math.max(0,left/s.seconds*100))+'%';seconds.classList.toggle('low',left<=5);}
    function click(event){const answer=event.target.closest('[data-live-answer]');if(answer){$$('[data-live-answer]').forEach(b=>b.disabled=true);sendAnswer(answer.dataset.liveAnswer);return;}if(event.target.closest('[data-live-student-close]'))closeModal();}
    $('#modalRoot').addEventListener('click',click); pollId=setInterval(refresh,1200);clockId=setInterval(()=>state&&updateClock(state),250);refresh();
    const cleanup=setInterval(()=>{if($('#modalRoot').hidden){clearInterval(pollId);clearInterval(clockId);clearInterval(cleanup);$('#modalRoot').removeEventListener('click',click);}},900);
  }
  return { host, join };
})();
window.LiveArena = LiveArena;
