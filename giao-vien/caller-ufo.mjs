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
  scanner.innerHTML = `
    <div class="ufo-saucer">
      <svg viewBox="0 0 260 132" role="presentation">
        <defs>
          <linearGradient id="ufo-hull" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f8ffff"/><stop offset=".38" stop-color="#8ad8ee"/><stop offset=".7" stop-color="#447db4"/><stop offset="1" stop-color="#203966"/></linearGradient>
          <linearGradient id="ufo-dome" x1="0" x2=".7" y1="0" y2="1"><stop stop-color="#e3ffff" stop-opacity=".95"/><stop offset=".45" stop-color="#86d9ec" stop-opacity=".72"/><stop offset="1" stop-color="#6279c8" stop-opacity=".82"/></linearGradient>
          <radialGradient id="ufo-core"><stop stop-color="#fff"/><stop offset=".24" stop-color="#f8ffb5"/><stop offset="1" stop-color="#69e7ff" stop-opacity=".12"/></radialGradient>
          <filter id="ufo-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <ellipse cx="130" cy="113" rx="82" ry="10" fill="#070f32" opacity=".42"/>
        <path d="M22 78c18-24 55-37 108-37s90 13 108 37c-16 21-55 33-108 33S38 99 22 78Z" fill="url(#ufo-hull)" stroke="#e6fbff" stroke-width="3"/>
        <path d="M85 67c6-26 22-42 45-42s39 16 45 42c-13 10-77 10-90 0Z" fill="url(#ufo-dome)" stroke="#d6ffff" stroke-width="3"/>
        <ellipse cx="130" cy="78" rx="108" ry="21" fill="none" stroke="#a5eaff" stroke-width="2" opacity=".68"/>
        <path d="M46 87c21 9 49 13 84 13s63-4 84-13" fill="none" stroke="#263a79" stroke-width="4" opacity=".7"/>
        <g fill="#fff9a5" filter="url(#ufo-glow)"><circle cx="65" cy="87" r="4"/><circle cx="98" cy="94" r="4"/><circle cx="130" cy="96" r="4.5"/><circle cx="162" cy="94" r="4"/><circle cx="195" cy="87" r="4"/></g>
        <ellipse cx="130" cy="100" rx="31" ry="5.5" fill="url(#ufo-core)" filter="url(#ufo-glow)"/>
        <path d="M85 58c12-18 25-25 41-26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".76"/>
      </svg>
    </div>
  `;
  setpiece.append(beam, landing, scanner);

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

  function keepVisible(tile) {
    if (board.scrollHeight <= board.clientHeight + 2) return;
    const tileBox = tile.getBoundingClientRect();
    const boardBox = board.getBoundingClientRect();
    if (tileBox.top < boardBox.top) board.scrollTop -= boardBox.top - tileBox.top + 8;
    else if (tileBox.bottom > boardBox.bottom) board.scrollTop += tileBox.bottom - boardBox.bottom + 8;
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
    beam.style.height = Math.hypot(dx, dy) + 'px';
    beam.style.transform = `translate3d(${x}px,${y}px,0) translateX(-50%) rotate(${Math.atan2(-dx, dy)}rad)`;
    beam.style.opacity = pose.beam;
    landing.style.transform = `translate3d(${targetX}px,${targetY}px,0) translate(-50%,-50%)`;
    landing.style.opacity = pose.beam;
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
    if (vertical && walkers.has(aimTile)) {
      walkers.get(aimTile).frozenAt = walkTime;
      delete aimTile.dataset.ufoStep;
    }
    if (aimTile) keepVisible(aimTile);
    measureAim(false);
  }

  function setPhase(phase) {
    host.dataset.ufoPhase = phase;
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
  board.addEventListener('scroll', measureAim, { passive: true });

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
    board.scrollTop = 0;
    measureStage();
  }

  reset();
  return {
    async play(batch, decoys, { pace, wait, focus }) {
      const still = reduced.matches;
      const pause = ms => wait(Math.round(ms * pace));
      const move = (goal, ms, ease) => fly(goal, still ? 0 : ms * pace, wait, ease);
      setPhase('enter');
      if (!still) {
        startWalking();
        pose = { ...PARKED, x: -.09, y: .29, opacity: 0, scale: .8 };
        paint();
        sound('ufoScan');
        await move({ x: .47, y: .23, opacity: 1, scale: 1, bank: -7 }, 980);
      }

      setPhase('scan');
      const targets = decoys.length ? decoys : batch;
      const sweeps = still ? SWEEPS.slice(0, 2) : SWEEPS;
      for (const [index, sweep] of sweeps.entries()) {
        const student = targets[index % targets.length];
        focus(null);
        aimAt(student);
        sound('ufoScan');
        const bank = sweep.x > pose.x ? -8 : 8;
        await move({ x: sweep.x, y: sweep.y, bank, beam: .85 }, sweep.move);
        focus(student, 'is-candidate');
        await pause(still ? 290 : sweep.hold);
      }

      if (!still) {
        setPhase('search');
        await move({ x: .22, y: .24, bank: 0, beam: .48 }, 330);
        await pause(950);
      }

      for (const student of batch) {
        setPhase('approach');
        aimAt(student, true);
        focus(null);
        await move({ y: .24, bank: 0, beam: 1 }, 880);
        setPhase('lock');
        focus(student, 'is-pointed');
        sound('ufoLock');
        await pause(still ? 530 : 2020);
      }

      setPhase('depart');
      stopWalking();
      aimTile = null;
      aimBase = null;
      aimPoint = null;
      aligned = false;
      sound('ufoDepart');
      await move({ y: -.19, opacity: 0, scale: .72, bank: 0, beam: 0 }, 880, t => t * t);
      await pause(still ? 90 : 420);
    },
    reset,
    celebrate() {
      setPhase('reveal');
      pose.opacity = 0;
      pose.beam = 0;
      paint();
    },
    destroy() {
      cancelAnimationFrame(motionFrame);
      stopWalking(true);
      observer.disconnect();
      board.removeEventListener('scroll', measureAim);
      delete host.dataset.ufoPhase;
      beam.remove();
      landing.remove();
      scanner.remove();
    }
  };
}
