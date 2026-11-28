const SWEEPS = [
  { x: .71, y: .21, move: 820, hold: 410 },
  { x: .34, y: .24, move: 660, hold: 280 },
  { x: .53, y: .19, move: 740, hold: 280 },
  { x: .19, y: .25, move: 880, hold: 390 },
  { x: .65, y: .21, move: 830, hold: 260 },
  { x: .28, y: .24, move: 750, hold: 460 }
];
const PARKED = { x: .39, y: .22, bank: 0, scale: 1, opacity: 1, aimX: .39, aimY: .79, beam: 0 };
const glide = t => t * t * (3 - 2 * t);

const TALK = {
  enter: ['Bíp bíp! Lớp này đông vui quá!', 'Xin chào Trái Đất!', 'Tàu đã đến nơi. Bắt đầu quét!'],
  scan: ['Bạn này à…?', 'Hừm… chưa phải.', 'Tín hiệu yếu quá…', 'Ồ, bạn này cười xinh!', 'Để xem nào…', 'Không phải… đi tiếp!'],
  search: ['Tín hiệu mạnh dần…', 'Ai đây nhỉ…?', 'Ra-đa đang kêu tít tít!'],
  lock: ['Tìm thấy rồi!', 'Đúng bạn này!', 'Khoá mục tiêu!'],
  abduct: ['Lên tàu nào!', 'Vèo… lên đây!', 'Mời bạn lên tàu!'],
  depart: ['Hẹn gặp lại cả lớp!', 'Tạm biệt Trái Đất!']
};
const pick = list => list[Math.floor(Math.random() * list.length)];
const RIM = [[52, 84], [78, 92], [104, 96], [130, 97], [156, 96], [182, 92], [208, 84]];
const SAUCER = `
  <svg viewBox="0 0 260 140" role="presentation">
    <defs>
      <linearGradient id="ufo-hull" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f8ffff"/><stop offset=".38" stop-color="#9ad9ea"/><stop offset=".7" stop-color="#4f7fb6"/><stop offset="1" stop-color="#223a68"/></linearGradient>
      <linearGradient id="ufo-belly" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#33508a"/><stop offset="1" stop-color="#16244c"/></linearGradient>
      <linearGradient id="ufo-dome" x1="0" x2=".7" y1="0" y2="1"><stop stop-color="#e9ffff" stop-opacity=".42"/><stop offset=".55" stop-color="#8fdcec" stop-opacity=".22"/><stop offset="1" stop-color="#6279c8" stop-opacity=".5"/></linearGradient>
      <radialGradient id="ufo-core"><stop stop-color="#fff"/><stop offset=".3" stop-color="#e6fff8"/><stop offset="1" stop-color="#69e7ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="ufo-skin" cx=".42" cy=".35"><stop stop-color="#c8f7a6"/><stop offset="1" stop-color="#6fc46a"/></radialGradient>
      <filter id="ufo-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g class="ufo-pilot">
      <path d="M119 24c-3-9-7-13-12-15" fill="none" stroke="#7fcf72" stroke-width="2.6" stroke-linecap="round"/><circle cx="106" cy="8" r="4" fill="#ffe680"/>
      <path d="M141 24c3-9 7-13 12-15" fill="none" stroke="#7fcf72" stroke-width="2.6" stroke-linecap="round"/><circle cx="154" cy="8" r="4" fill="#ffe680"/>
      <ellipse cx="130" cy="40" rx="22" ry="19" fill="url(#ufo-skin)" stroke="#4f9d55" stroke-width="1.4"/>
      <g class="ufo-eyes"><ellipse cx="120.5" cy="38" rx="6" ry="7.6" fill="#1b2340"/><ellipse cx="139.5" cy="38" rx="6" ry="7.6" fill="#1b2340"/><circle cx="122.4" cy="34.6" r="2.2" fill="#fff"/><circle cx="141.4" cy="34.6" r="2.2" fill="#fff"/></g>
      <path class="ufo-mouth" d="M124 49q6 5 12 0" fill="none" stroke="#2f5a34" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="112.5" cy="46" rx="3.4" ry="2" fill="#ff9fb4" opacity=".75"/><ellipse cx="147.5" cy="46" rx="3.4" ry="2" fill="#ff9fb4" opacity=".75"/>
    </g>
    <path d="M80 66c4-34 23-52 50-52s46 18 50 52c-15 11-85 11-100 0Z" fill="url(#ufo-dome)" stroke="#d6ffff" stroke-width="2.6"/>
    <path d="M92 48c6-16 16-24 29-26" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>
    <path d="M44 92c20 14 50 20 86 20s66-6 86-20c-6 14-40 26-86 26S50 106 44 92Z" fill="url(#ufo-belly)"/>
    <path d="M18 80c18-24 57-36 112-36s94 12 112 36c-17 20-57 30-112 30S35 100 18 80Z" fill="url(#ufo-hull)" stroke="#e6fbff" stroke-width="2.6"/>
    <path d="M30 80c22 10 55 15 100 15s78-5 100-15" fill="none" stroke="#2a4479" stroke-width="3" opacity=".55"/>
    <ellipse cx="130" cy="72" rx="98" ry="15" fill="none" stroke="#fff" stroke-width="1.6" opacity=".45"/>
    <g class="ufo-rim" filter="url(#ufo-glow)">${RIM.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4.6" style="--i:${i}"/>`).join('')}</g>
    <ellipse class="ufo-core" cx="130" cy="117" rx="30" ry="6" fill="url(#ufo-core)" filter="url(#ufo-glow)"/>
  </svg>`;
export function createUfoCinema(host, board, { sound }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const setpiece = host.querySelector('.caller-cinema-setpiece');
  setpiece.replaceChildren();
  const beam = document.createElement('div');
  beam.className = 'ufo-beam';
  const landing = document.createElement('div');
  landing.className = 'ufo-landing';
  const scanner = document.createElement('div');
  scanner.className = 'ufo-scanner';
  scanner.setAttribute('aria-hidden', 'true');
  scanner.innerHTML = '<div class="ufo-bob"><div class="ufo-saucer">' + SAUCER + '</div></div><p class="ufo-bubble"></p>';
  const bubble = scanner.querySelector('.ufo-bubble');
  const sky = document.createElement('div');
  sky.className = 'ufo-sky';
  sky.innerHTML = '<i class="ufo-stars"></i><i class="ufo-stars is-far"></i><i class="ufo-meteor"></i><i class="ufo-meteor is-late"></i>';
  const reticle = document.createElement('div');
  reticle.className = 'ufo-reticle';
  reticle.innerHTML = '<i></i><i></i><i></i><i></i><b>ĐÃ KHOÁ</b>';
  const captives = document.createElement('div');
  captives.className = 'ufo-captives';
  setpiece.append(sky, beam, landing, reticle, captives, scanner);

  let frame;
  let pose = { ...PARKED };
  let motionFrame;
  let walkFrame;
  let walkStarted;
  let walkTime;
  const walkers = new Map();
  let aimTile;
  let aimBase;
  let aimPoint;
  let aligned = false;
  let flying = false;

  // Hàng bị cắt dở ở mép khung cuộn thì mờ hẳn đi, không hiện nửa người.
  function markEdges() {
    const top = board.scrollTop;
    let cut = 0;
    for (const tile of board.children) {
      const bottom = tile.offsetTop + tile.offsetHeight;
      if (tile.offsetTop < top - 1 && bottom > top) cut = Math.max(cut, bottom - top);
    }
    board.style.setProperty('--cut-top', cut ? Math.ceil(cut) + 'px' : '0px');
    board.classList.toggle('ufo-cut-top', cut > 0);
    board.classList.toggle('ufo-cut-bottom', board.scrollHeight > board.clientHeight + 2 && top + board.clientHeight < board.scrollHeight - 2);
  }

  // Cuộn theo từng hàng trọn vẹn để hàng trên cùng không bị cắt mất đầu.
  function keepVisible(tile) {
    if (board.scrollHeight <= board.clientHeight + 2) return;
    const top = board.scrollTop, view = board.clientHeight;
    const rowTop = tile.offsetTop, rowBottom = rowTop + tile.offsetHeight;
    if (rowTop >= top && rowBottom <= top + view) return;
    const starts = [...new Set([...board.children].map(item => item.offsetTop))].sort((a, b) => a - b);
    const need = rowBottom > top + view ? rowBottom - view : rowTop;
    const start = starts.find(value => value >= need) ?? rowTop;
    board.scrollTop = Math.max(0, Math.min(start, rowTop) - 3);
  }

  function paint() {
    if (!frame?.width || !frame.height) return;
    const x = pose.x * frame.width;
    const y = pose.y * frame.height;
    const targetX = pose.aimX * frame.width;
    const targetY = pose.aimY * frame.height;
    const dx = targetX - x;
    const dy = targetY - y;
    scanner.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-76%)`;
    scanner.style.setProperty('--ship-bank', pose.bank + 'deg');
    scanner.style.setProperty('--ship-scale', pose.scale);
    scanner.style.opacity = pose.opacity;
    if (pose.x > .6) bubble.classList.add('is-left');
    else if (pose.x < .4) bubble.classList.remove('is-left');
    beam.style.height = Math.hypot(dx, dy) + 'px';
    beam.style.transform = `translate3d(${x}px,${y}px,0) translateX(-50%) rotate(${Math.atan2(-dx, dy)}rad)`;
    beam.style.opacity = pose.beam;
    landing.style.transform = `translate3d(${targetX}px,${targetY}px,0) translate(-50%,-50%)`;
    landing.style.opacity = pose.beam;
    reticle.style.transform = landing.style.transform;
  }

  function trackAim(syncPose = true) {
    if (!aimBase) return;
    aimPoint = {
      aimX: (aimBase.x + (walkers.get(aimTile)?.x || 0)) / frame.width,
      aimY: aimBase.y / frame.height
    };
    if (!syncPose || flying) return;
    Object.assign(pose, aimPoint);
    if (aligned) pose.x = aimPoint.aimX;
    paint();
  }

  function measureAim(syncPose = true) {
    const feet = aimTile?.querySelector('.student-avatar-wrap')?.getBoundingClientRect();
    if (!feet || !frame?.width || !frame.height) return;
    const stage = host.getBoundingClientRect();
    aimBase = {
      x: feet.left + feet.width / 2 - stage.left - (walkers.get(aimTile)?.x || 0),
      y: feet.top + feet.height * .91 - stage.top
    };
    trackAim(syncPose);
  }

  function layoutWalkers() {
    const rows = new Map();
    const width = board.clientWidth;
    if (!width) return;
    for (const walker of walkers.values()) {
      const { tile } = walker;
      const rowTop = tile.offsetTop;
      walker.center = tile.offsetLeft + tile.offsetWidth / 2;
      const footprint = Math.min(tile.offsetWidth, tile.firstElementChild.offsetWidth + 6);
      if (!rows.has(rowTop)) rows.set(rowTop, { walkers: [], left: width, right: 0 });
      const row = rows.get(rowTop);
      row.walkers.push(walker);
      row.left = Math.min(row.left, walker.center - footprint / 2);
      row.right = Math.max(row.right, walker.center + footprint / 2);
    }

    [...rows.values()].forEach((row, index) => {
      const spread = row.right - row.left;
      const center = (row.left + row.right) / 2;
      const few = row.walkers.length <= 4;
      const distance = Math.min(few ? 140 : 68, width * (few ? .19 : .075));
      const margin = 5;
      // Give each row an aisle to move in while preserving the order of its students.
      const half = Math.min(spread / 2, width / 2 - distance - margin);
      const from = Math.max(-distance, margin - center + half);
      const to = Math.min(distance, width - margin - center - half);
      for (const walker of row.walkers) {
        walker.track = {
          inset: (center - walker.center) * (1 - 2 * half / Math.max(1, spread)),
          from,
          to,
          phase: index % 2 ? Math.PI : 0,
          period: 4900 + (index % 3) * 570
        };
      }
    });
  }

  function placeWalkers(now) {
    for (const walker of walkers.values()) {
      if (!walker.track) continue;
      const { tile, track, frozenAt } = walker;
      const elapsed = Math.max(0, (frozenAt ?? now) - walkStarted);
      const progress = (.5 + .5 * Math.sin(elapsed / track.period * 2 * Math.PI + track.phase));
      const easeIn = glide(Math.min(1, elapsed / 680));
      const x = (track.inset + track.from + (track.to - track.from) * progress) * easeIn;
      const dx = x - walker.x;
      if (Math.abs(dx) >= .06) {
        walker.x = x;
        tile.style.setProperty('--ufo-walk-x', x.toFixed(2) + 'px');
      }
      const stepping = frozenAt == null && Math.abs(dx) >= .06;
      if (stepping) {
        const direction = dx > 0 ? 'right' : 'left';
        if (tile.dataset.ufoStep !== direction) tile.dataset.ufoStep = direction;
      } else {
        delete tile.dataset.ufoStep;
      }
    }
  }

  function stopWalking(clear = false) {
    cancelAnimationFrame(walkFrame);
    for (const walker of walkers.values()) {
      walker.frozenAt ??= walkTime;
      delete walker.tile.dataset.ufoStep;
      if (clear) walker.tile.style.removeProperty('--ufo-walk-x');
    }
    if (clear) walkers.clear();
  }

  function startWalking() {
    walkStarted = performance.now();
    walkTime = walkStarted;
    for (const tile of board.children) walkers.set(tile, { tile, x: 0 });
    layoutWalkers();
    function step(now) {
      if (reduced.matches) {
        stopWalking(true);
        measureAim();
        return;
      }
      walkTime = now;
      placeWalkers(now);
      trackAim();
      walkFrame = requestAnimationFrame(step);
    }
    walkFrame = requestAnimationFrame(step);
  }

  function measureStage() {
    frame = host.getBoundingClientRect();
    markEdges();
    if (walkers.size) {
      layoutWalkers();
      placeWalkers(walkTime);
    }
    if (aimTile) keepVisible(aimTile);
    measureAim();
    paint();
  }

  function aimAt(student, vertical = false) {
    aimTile = board.querySelector('[data-id="' + CSS.escape(student.id) + '"]');
    aligned = vertical;
    if (vertical) {
      // UFO hạ xuống: cả lớp đứng sững lại nhìn lên, không ai đi lấn vào bạn được chọn.
      for (const walker of walkers.values()) {
        walker.frozenAt ??= walkTime;
        delete walker.tile.dataset.ufoStep;
      }
    }
    if (aimTile) keepVisible(aimTile);
    measureAim(false);
  }

  function setPhase(phase) {
    host.dataset.ufoPhase = phase;
  }

  let bubbleTimer;
  function say(text, hold = 0) {
    clearTimeout(bubbleTimer);
    bubble.classList.remove('is-on');
    if (!text) return;
    bubble.textContent = text;
    void bubble.offsetWidth; // chạy lại hiệu ứng bật lên mỗi câu
    bubble.classList.add('is-on');
    if (hold) bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), hold);
  }

  function gasp(on) {
    for (const tile of board.querySelectorAll('.ufo-gasp')) tile.classList.remove('ufo-gasp');
    if (!on || !aimTile) return;
    for (const near of [aimTile.previousElementSibling, aimTile.nextElementSibling]) {
      if (near && Math.abs(near.offsetTop - aimTile.offsetTop) < 4) near.classList.add('ufo-gasp');
    }
  }

  // Bạn được chọn bay lên theo luồng sáng rồi chui vào bụng đĩa bay.
  async function abduct(pause, pace) {
    const tile = aimTile;
    const avatar = tile?.querySelector('.student-avatar-wrap');
    const chibi = avatar?.querySelector('.student-chibi');
    if (!chibi || !frame?.width) return;
    const stage = host.getBoundingClientRect();
    const box = avatar.getBoundingClientRect();
    const left = box.left - stage.left, top = box.top - stage.top;
    const captive = document.createElement('div');
    captive.className = 'ufo-captive';
    captive.style.cssText = `left:${left}px;top:${top}px;width:${box.width}px;height:${box.height}px`;
    captive.append(chibi.cloneNode(true));
    captives.append(captive);
    tile.classList.add('is-abducted');
    if (reduced.matches) {
      captive.remove();
      await pause(320);
      return;
    }
    const dx = pose.x * frame.width - (left + box.width / 2);
    const dy = pose.y * frame.height - (top + box.height / 2);
    const duration = 2150 * pace;
    captive.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .04}px,-18px) rotate(-7deg) scale(1.3)`, opacity: 1, offset: .16 },
      { transform: `translate(${dx * .45}px,${dy * .5}px) rotate(9deg) scale(1.2)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx * .9}px,${dy * .9}px) rotate(-6deg) scale(.7)`, opacity: .9, offset: .88 },
      { transform: `translate(${dx}px,${dy}px) rotate(0deg) scale(.2)`, opacity: 0 }
    ], { duration, easing: 'cubic-bezier(.42,0,.36,1)', fill: 'forwards' });
    scanner.classList.remove('is-gulp');
    setTimeout(() => scanner.classList.add('is-gulp'), duration * .9);
    await pause(2150);
  }

  async function fly(to, duration, wait, ease = glide) {
    const start = { ...pose };
    const entries = Object.keys(pose);
    const started = performance.now();
    flying = true;

    function draw(progress) {
      const end = { ...start, ...to, ...aimPoint, bank: 0 };
      if (aligned && aimPoint) end.x = aimPoint.aimX;
      for (const key of entries) pose[key] = start[key] + (end[key] - start[key]) * progress;
      // Tilt around the emitter so the beam stays attached while the hull banks.
      if (!reduced.matches && to.bank) pose.bank += to.bank * Math.sin(Math.PI * progress);
      paint();
    }
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      draw(ease(progress));
      if (progress < 1) motionFrame = requestAnimationFrame(step);
    }
    if (!duration || reduced.matches) {
      draw(1);
    } else {
      motionFrame = requestAnimationFrame(step);
      try {
        await wait(duration);
      } finally {
        cancelAnimationFrame(motionFrame);
      }
      draw(1);
    }
    flying = false;
  }

  const observer = new ResizeObserver(measureStage);
  observer.observe(host);
  observer.observe(board);
  const onScroll = () => { markEdges(); measureAim(); };
  board.addEventListener('scroll', onScroll, { passive: true });

  function reset() {
    cancelAnimationFrame(motionFrame);
    stopWalking(true);
    pose = { ...PARKED };
    aimTile = null;
    aimBase = null;
    aimPoint = null;
    aligned = false;
    flying = false;
    setPhase('idle');
    say('');
    gasp(false);
    captives.replaceChildren();
    scanner.classList.remove('is-gulp');
    for (const tile of board.querySelectorAll('.is-abducted')) tile.classList.remove('is-abducted');
    board.scrollTop = 0;
    measureStage();
  }

  reset();
  return {
    async play(batch, decoys, { pace, wait, focus, status = () => {} }) {
      const still = reduced.matches;
      const pause = ms => wait(Math.round(ms * pace));
      const move = (goal, ms, ease) => fly(goal, still ? 0 : ms * pace, wait, ease);
      setPhase('enter');
      status('Phát hiện vật thể lạ trên bầu trời lớp mình!');
      if (!still) {
        startWalking();
        pose = { ...PARKED, x: -.09, y: .29, opacity: 0, scale: .8 };
        paint();
        sound('ufoScan');
        await move({ x: .47, y: .23, opacity: 1, scale: 1, bank: -7 }, 980);
      }
      say(pick(TALK.enter), 1500 * pace);

      setPhase('scan');
      status('UFO đang quét cả lớp…');
      const targets = decoys.length ? decoys : batch;
      const sweeps = still ? SWEEPS.slice(0, 2) : SWEEPS;
      const lines = [...TALK.scan].sort(() => Math.random() - .5);
      for (const [index, sweep] of sweeps.entries()) {
        const student = targets[index % targets.length];
        focus(null);
        aimAt(student);
        sound('ufoScan');
        const bank = sweep.x > pose.x ? -8 : 8;
        await move({ x: sweep.x, y: sweep.y, bank, beam: .85 }, sweep.move);
        focus(student, 'is-candidate');
        if (index % 2) say(lines[index % lines.length], sweep.hold * pace + 200);
        await pause(still ? 290 : sweep.hold);
      }

      if (!still) {
        setPhase('search');
        status('Tín hiệu đang mạnh dần…');
        focus(null);
        say(pick(TALK.search));
        sound('ufoRadar');
        await move({ x: .22, y: .24, bank: 0, beam: .48 }, 330);
        await pause(950);
      }

      for (const [index, student] of batch.entries()) {
        setPhase('approach');
        status(batch.length > 1 ? 'Đang tìm bạn thứ ' + (index + 1) + '…' : 'Tín hiệu đã rõ…');
        aimAt(student, true);
        focus(null);
        say('');
        await move({ y: .24, bank: 0, beam: 1 }, 880);
        setPhase('lock');
        status('Đã khoá mục tiêu: ' + student.name + '!');
        focus(student, 'is-pointed');
        gasp(true);
        say(pick(TALK.lock));
        sound('ufoLock');
        await pause(still ? 530 : 1500);
        setPhase('abduct');
        status('Mời ' + student.name + ' lên tàu…');
        say(pick(TALK.abduct));
        sound('ufoAbduct');
        await abduct(pause, pace);
        gasp(false);
      }

      setPhase('depart');
      status('UFO bay đi… và thả bạn được chọn xuống trả bài!');
      say(pick(TALK.depart));
      stopWalking();
      aimTile = null;
      aimBase = null;
      aimPoint = null;
      aligned = false;
      sound('ufoDepart');
      await pause(still ? 0 : 520);
      say('');
      await move({ y: -.19, opacity: 0, scale: .72, bank: 0, beam: 0 }, 880, t => t * t);
      await pause(still ? 90 : 360);
    },
    reset,
    celebrate() {
      setPhase('reveal');
      say('');
      captives.replaceChildren();
      for (const tile of board.querySelectorAll('.is-abducted')) tile.classList.remove('is-abducted');
      pose.opacity = 0;
      pose.beam = 0;
      paint();
    },
    destroy() {
      cancelAnimationFrame(motionFrame);
      stopWalking(true);
      observer.disconnect();
      board.removeEventListener('scroll', onScroll);
      board.classList.remove('ufo-cut-top', 'ufo-cut-bottom');
      delete host.dataset.ufoPhase;
      clearTimeout(bubbleTimer);
      gasp(false);
      sky.remove();
      reticle.remove();
      captives.remove();
      beam.remove();
      landing.remove();
      scanner.remove();
    }
  };
}
