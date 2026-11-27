import * as PIXI from '../assets/vendor/pixi.min.mjs';
import { princeMarkup } from './caller-prince-art.mjs';
import { strikerMarkup, keeperMarkup } from './caller-penalty-art.mjs';
import { detectiveMarkup } from './caller-detective-art.mjs';

const GOAL = '<svg viewBox="0 0 360 230" aria-hidden="true"><defs><pattern id="caller-net" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(3)"><path d="M0 14V0H14" fill="none" stroke="#cbe7f5" stroke-opacity=".4" stroke-width="1"/></pattern><linearGradient id="caller-post" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#a0bfd9"/></linearGradient></defs><path d="M22 212 49 41 323 24 349 188 332 215 22 220z" fill="#102750" fill-opacity=".24"/><path d="M22 211 49 41 323 24 349 188 332 215 22 220z" fill="url(#caller-net)"/><path d="M16 216 42 42Q43 35 52 35L325 20Q333 20 333 30L340 211" fill="none" stroke="#253451" stroke-width="14" stroke-linecap="round"/><path d="M16 212 42 39Q43 33 52 33L325 18Q331 18 332 28L340 209" fill="none" stroke="url(#caller-post)" stroke-width="8" stroke-linecap="round"/><path d="M22 216 333 213 350 188" fill="none" stroke="#a0bfd9" stroke-width="3" opacity=".65"/></svg>';
const BALL = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="caller-ball-light" cx=".3" cy=".2" r=".78"><stop stop-color="#fff"/><stop offset=".62" stop-color="#edf9fc"/><stop offset="1" stop-color="#849dbb"/></radialGradient></defs><circle cx="32" cy="32" r="29" fill="url(#caller-ball-light)" stroke="#1c2946" stroke-width="3"/><path d="m23 19 17 2 7 15-15 10-14-11Z M6 22l8 2 7-5 4-16C15 5 9 12 6 22Zm44-13-1 13 11 7A29 29 0 0 0 50 9Zm11 26-12 5-4 15a30 30 0 0 0 16-20ZM22 58l6-11-9-8-13 5a28 28 0 0 0 16 14Z" fill="#233451"/><path d="m13 24 6 12m21-15 10-1m-3 16 3 5m-18 5-4 3" stroke="#6482a4" stroke-width="1.8" fill="none"/><ellipse cx="22" cy="14" rx="8" ry="3" fill="white" opacity=".65" transform="rotate(-26 22 14)"/></svg>';

const COLORS = {
  garden: [0xffa5cb, 0xffcdd8, 0xffe299, 0xf6c38a],
  stadium: [0xbaf8ff, 0x69ddff, 0x99fff7, 0xffcf84],
  office: [0xf5b367, 0xffdd95, 0x6ee3f1, 0xf3ab7e]
};
const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
const between = (min, max) => min + Math.random() * (max - min);

function makeParticles(host, mode, reduced) {
  if (reduced) return { burst() {}, reset() {}, destroy() {} };
  const app = new PIXI.Application();
  let ready = false;
  let disposed = false;
  let observer;
  let width = 1;
  let height = 1;
  const particles = [];
  const available = [];
  let ambientTime = 0;
  const colors = COLORS[mode];

  function particle(kind, x, y) {
    const sprite = available.pop();
    if (!sprite) return;
    sprite.visible = true;
    sprite.tint = colors[Math.floor(between(0, colors.length))];
    const isRain = kind === 'rain';
    const isPetal = kind === 'petal';
    const isDust = kind === 'dust';
    const isCrowd = kind === 'crowd';
    const life = isPetal ? between(2, 4) : isRain ? between(.36, .7) : isDust ? between(.32, .65) : isCrowd ? between(.38, .72) : between(.48, 1.45);
    particles.push({
      sprite, kind, x, y, life, age: 0, rotation: between(0, Math.PI * 2),
      vx: isRain ? -180 : isPetal ? between(-28, 18) : isCrowd ? 0 : between(-135, 135),
      vy: isRain ? 530 : isPetal ? between(22, 46) : isCrowd ? 0 : isDust ? between(-45, -12) : between(-155, -35),
      size: isRain ? between(8, 17) : isPetal ? between(3, 5) : isDust ? between(4, 9) : between(2, 6)
    });
  }

  function tick(ticker) {
    const delta = Math.min(ticker.deltaMS / 1000, .033);
    ambientTime += delta;
    if (ambientTime > (mode === 'office' ? .052 : .16)) {
      ambientTime = 0;
      if (mode === 'office') particle('rain', between(.06, .31) * width, between(-.05, .12) * height);
      if (mode === 'garden') particle('petal', between(.08, .93) * width, between(.03, .36) * height);
      if (mode === 'stadium') particle('crowd', between(.04, .97) * width, between(.4, .54) * height);
    }
    for (let index = particles.length - 1; index >= 0; index--) {
      const item = particles[index];
      const { sprite, kind } = item;
      item.age += delta;
      if (item.age >= item.life) {
        sprite.visible = false;
        available.push(sprite);
        particles.splice(index, 1);
        continue;
      }
      const progress = item.age / item.life;
      item.x += item.vx * delta;
      item.y += item.vy * delta;
      if (kind !== 'rain' && kind !== 'petal' && kind !== 'crowd') item.vy += (kind === 'dust' ? -20 : 142) * delta;
      sprite.position.set(item.x, item.y);
      sprite.rotation = kind === 'rain' ? .31 : item.rotation + item.age * (kind === 'petal' ? 1.7 : 4);
      const size = item.size * (kind === 'dust' ? .65 + progress : 1);
      sprite.scale.set(kind === 'rain' ? .7 : size, kind === 'rain' ? size : kind === 'petal' ? size * .48 : size);
      sprite.alpha = (1 - progress) * (kind === 'dust' || kind === 'rain' ? .46 : kind === 'crowd' ? .55 : .92);
    }
  }

  function resize() {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    app.renderer.resize(width, height);
  }

  app.init({ preference: 'webgl', width: 1, height: 1, backgroundAlpha: 0, autoDensity: true, resolution: Math.min(1.5, window.devicePixelRatio || 1) })
    .then(() => {
      if (disposed) { app.destroy(true, { children: true }); return; }
      app.canvas.className = 'caller-pixi-canvas';
      host.append(app.canvas);
      const shape = new PIXI.GraphicsContext().circle(0, 0, 1).fill(0xffffff);
      for (let index = 0; index < 124; index++) {
        const sprite = new PIXI.Graphics({ context: shape });
        sprite.visible = false;
        app.stage.addChild(sprite);
        available.push(sprite);
      }
      ready = true;
      if (mode === 'office') host.classList.add('has-rain');
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(host);
      app.ticker.add(tick);
    })
    .catch(() => {
      if (app.renderer && app.stage) app.destroy(true, { children: true });
      ready = false;
    });

  return {
    burst(x, y, kind, count = 18) {
      if (!ready || disposed) return;
      for (let index = 0; index < count; index++) {
        particle(kind, width * x / 100 + between(-8, 8), height * y / 100 + between(-6, 6));
      }
    },
    reset() {
      for (const { sprite } of particles) { sprite.visible = false; available.push(sprite); }
      particles.length = 0;
    },
    destroy() {
      disposed = true;
      observer?.disconnect();
      if (ready) app.destroy(true, { children: true, context: true });
    }
  };
}

export function createCinema(host, mode, { gsap, sound }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const camera = host.querySelector('.caller-cinema-world');
  const fxHost = host.querySelector('.caller-cinema-fx');
  const actors = host.querySelector('.caller-cinema-actors');
  const target = host.querySelector('.caller-cinema-target');
  const targetName = target.querySelector('strong');
  const signal = host.querySelector('.caller-cinema-signal');
  const evidence = host.querySelector('.caller-cinema-evidence');
  const setpiece = host.querySelector('.caller-cinema-setpiece');
  const fx = makeParticles(fxHost, mode, reduced);
  const moving = new WeakMap();
  const cues = new Set();
  let first;
  let current;
  let keeper;
  let ball;
  let goal;
  let cameraTween;
  let shake;
  let ballFlight;
  let signalTween;
  let markTween;
  let evidenceTween;
  let slow = false;
  let travelSeries = 0;
  const time = value => reduced ? .01 : value;

  function cue(fn, ms) {
    const id = window.setTimeout(() => { cues.delete(id); fn(); }, reduced ? 5 : ms);
    cues.add(id);
    return id;
  }

  function clearCues() {
    for (const id of cues) clearTimeout(id);
    cues.clear();
  }

  function performer(markup, role, x) {
    const element = document.createElement('div');
    element.className = 'caller-performer caller-performer--' + role;
    element.dataset.motion = 'idle';
    element.style.left = x + '%';
    element.innerHTML = '<div class="caller-performer-facing">' + markup + '</div>';
    actors.append(element);
    return element;
  }

  function pose(element, key, direction) {
    if (!element) return;
    if (direction) element.dataset.direction = direction;
    if (element.dataset.motion === key) {
      delete element.dataset.motion;
      void element.offsetWidth;
    }
    element.dataset.motion = key;
  }

  function walk(element, x, duration, { motion = 'run', finish = 'idle', beats = false } = {}) {
    if (!element) return;
    moving.get(element)?.kill();
    if (Math.abs(x - parseFloat(element.style.left)) > 2 && mode !== 'stadium') {
      element.classList.toggle('faces-left', x < parseFloat(element.style.left));
    }
    pose(element, motion);
    let nextStep = 0;
    const animation = gsap.to(element, {
      left: x + '%',
      duration: time(duration),
      ease: 'power2.inOut',
      onUpdate() {
        if (!beats || reduced || animation.time() < nextStep) return;
        nextStep += mode === 'garden' ? .155 : .23;
        const footX = parseFloat(element.style.left);
        fx.burst(footX, mode === 'garden' ? 83 : 85, 'dust', mode === 'garden' ? 8 : 3);
        sound(mode === 'garden' ? 'hoof' : 'step');
      },
      onComplete() { if (finish && element.isConnected) pose(element, finish); }
    });
    moving.set(element, animation);
  }

  function cameraTo(x, zoom, duration = .58) {
    if (reduced) return;
    cameraTween?.kill();
    const pan = (50 - x) * (zoom - 1) * .9;
    cameraTween = gsap.to(camera, { scale: zoom, xPercent: pan, duration, ease: 'power2.out' });
  }

  function impact(x, y, label = '') {
    fx.burst(x, y, 'spark', 32);
    host.style.setProperty('--flash-x', x + '%');
    host.style.setProperty('--flash-y', y + '%');
    host.classList.remove('has-impact');
    if (reduced) return;
    void host.offsetWidth;
    host.classList.add('has-impact');
    shake?.kill();
    shake = gsap.fromTo(camera, { y: 4 }, { y: 0, duration: .36, ease: 'elastic.out(1,.32)' });
    if (label) showSignal(label, x, y);
  }

  function showSignal(label, x, y) {
    signal.textContent = label;
    signal.style.left = x + '%';
    signal.style.top = y + '%';
    signalTween?.kill();
    signalTween = gsap.timeline().fromTo(signal, { autoAlpha: 0, y: 12, scale: .72 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: time(.33), ease: 'back.out(1.7)'
    }).to(signal, { autoAlpha: 0, y: -12, duration: time(.28), delay: time(.64) });
  }

  function showTarget(student, left) {
    targetName.textContent = student.name;
    target.style.left = clamp(left, 21, 79) + '%';
    markTween?.kill();
    markTween = gsap.timeline().fromTo(target, { autoAlpha: 0, y: 7, scale: .9 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: time(.26), ease: 'back.out(1.6)'
    }).to(target, { autoAlpha: 0, y: -6, duration: time(.24), delay: time(1.15) });
  }

  function launchBall({ x = 82, y = 57, height = 20, duration = .68, start, end, trail = true }) {
    ballFlight?.kill();
    const x0 = parseFloat(ball.style.left);
    const y0 = parseFloat(ball.style.top);
    const flight = { progress: 0 };
    const velocity = y - y0;
    const picture = ball.firstElementChild;
    start?.();
    ballFlight = gsap.to(flight, {
      progress: 1, duration: time(duration), ease: 'sine.inOut',
      onUpdate() {
        const p = flight.progress;
        const ballX = x0 + (x - x0) * p;
        const ballY = y0 + velocity * p - Math.sin(Math.PI * p) * height;
        ball.style.left = ballX + '%';
        ball.style.top = ballY + '%';
        picture.style.rotate = (p * (x > x0 ? 690 : -310)) + 'deg';
        ball.style.setProperty('--ball-scale', 1 - .39 * p);
        ball.classList.toggle('in-flight', trail && p > .08 && p < .91);
      },
      onComplete() { ball.classList.remove('in-flight'); end?.(); }
    });
  }

  function setup() {
    travelSeries = 0;
    actors.replaceChildren();
    setpiece.replaceChildren();
    evidence.hidden = true;
    if (mode === 'garden') current = first = performer(princeMarkup(0), 'prince', 35);
    if (mode === 'office') current = first = performer(detectiveMarkup(), 'detective', 33);
    if (mode === 'stadium') {
      setpiece.innerHTML = '<div class="caller-cinema-goal">' + GOAL + '</div>';
      goal = setpiece.firstElementChild;
      current = first = performer(strikerMarkup(), 'striker', 26);
      keeper = performer(keeperMarkup(), 'keeper', 79);
      ball = document.createElement('div');
      ball.className = 'caller-cinema-ball';
      ball.style.left = '42%';
      ball.style.top = '83%';
      ball.innerHTML = BALL;
      actors.append(ball);
    }
  }

  setup();
  return {
    enter() {
      if (mode === 'stadium') {
        host.classList.add('is-playing-shot');
        sound('whistle');
        pose(keeper, 'run');
        cameraTo(49, 1.06, .84);
        return;
      }
      if (!reduced) first.style.left = mode === 'garden' ? '-17%' : '-12%';
      walk(first, mode === 'garden' ? 37 : 32, mode === 'garden' ? 1.02 : .89, { beats: true });
      cameraTo(39, 1.07, .84);
      sound(mode === 'garden' ? 'fanfare' : 'paper');
    },
    travel(student, decision = false) {
      const location = (student.signature % 103) / 102;
      if (mode === 'stadium') {
        if (!decision) showTarget(student, 73 + location * 7);
        return;
      }
      const from = parseFloat(current.style.left);
      const lane = mode === 'garden' ? 25 : 23;
      let x = lane + location * 45;
      if (Math.abs(x - from) < 10) x = from < 47 ? from + 12 : from - 12;
      const tagX = x < 49 ? x + 18 : x - 17;
      const serial = ++travelSeries;
      const duration = slow ? .74 : .53;
      walk(current, x, duration, { beats: true, finish: decision || mode === 'office' ? 'focus' : 'idle' });
      cameraTo(x, slow ? 1.16 : 1.09);
      if (!decision) cue(() => { if (travelSeries === serial) showTarget(student, tagX); }, 210);
      if (decision && mode === 'office') cue(() => fx.burst(tagX, 49, 'spark', 14), 540);
    },
    turnBack() {
      moving.get(current)?.kill();
      pose(current, 'fake');
      cameraTo(parseFloat(current.style.left), 1.13);
      sound('swerve');
      cue(() => fx.burst(parseFloat(current.style.left), 81, 'dust', 12), 140);
    },
    newPrince(index) {
      const previous = current;
      this.depart();
      if (reduced) previous.remove();
      else cue(() => previous.remove(), 900);
      current = performer(princeMarkup(index), 'prince', reduced ? 38 : -19);
      walk(current, 38, 1.02, { beats: true });
      sound('fanfare');
    },
    winner(studentAvatar) {
      if (mode !== 'garden') return;
      const x = parseFloat(current.style.left);
      pose(current, 'win');
      if (studentAvatar) {
        const guest = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        guest.setAttribute('class', 'caller-horse-guest');
        guest.innerHTML = studentAvatar;
        const portrait = guest.firstElementChild;
        portrait.setAttribute('x', '174');
        portrait.setAttribute('y', '100');
        portrait.setAttribute('width', '76');
        portrait.setAttribute('height', '91');
        const rider = current.querySelector('.cpr-rider');
        rider.before(guest);
        moving.set(guest, gsap.fromTo(guest, { x: -55, y: 110, autoAlpha: 0 }, {
          x: 0, y: 0, autoAlpha: 1, duration: time(.57), ease: 'back.out(1.37)'
        }));
      }
      fx.burst(x, 56, 'petal', 24);
      sound('chime');
    },
    depart() {
      if (mode !== 'garden' || reduced) return;
      walk(current, 124, .83, { beats: true, finish: null });
      cameraTo(61, 1.035, .76);
    },
    prepareShot() {
      host.classList.remove('has-goal');
      ballFlight?.kill();
      ball.style.left = '42%';
      ball.style.top = '83%';
      ball.style.setProperty('--ball-scale', 1);
      ball.classList.remove('in-flight');
      pose(keeper, 'run');
      walk(first, 20, .36, { motion: 'fake', finish: 'idle' });
      cameraTo(34, 1.12);
    },
    fakeShot(trick, onImpact) {
      walk(first, 35, .36, { beats: true, finish: null });
      cue(() => {
        pose(first, trick === 0 ? 'fake' : 'focus');
        pose(keeper, 'fake', trick === 1 ? 'right' : 'left');
        if (trick === 0) {
          fx.burst(40, 83, 'dust', 13);
          sound('swerve');
          onImpact?.();
          return;
        }
        cue(() => {
          sound('kick');
          const x = trick === 1 ? 65 : 78;
          const y = trick === 1 ? 64 : 58;
          launchBall({ x, y, height: 19, duration: .31, end() {
            impact(x, y);
            sound(trick === 1 ? 'post' : 'catch');
            onImpact?.();
            launchBall({ x: 58, y: 79, height: 7, duration: .30, trail: false });
          } });
        }, 246);
      }, 290);
    },
    scoreShot(index, hold = false, student) {
      cameraTo(68, 1.1);
      const kickFrom = parseFloat(ball.style.left);
      if (kickFrom >= 50) walk(first, kickFrom - 7, .27, { beats: true, finish: null });
      cue(() => {
        pose(first, 'focus');
        cue(() => {
          sound('kick');
          cue(() => pose(keeper, 'focus', index % 2 ? 'right' : 'left'), 75);
          launchBall({ x: 86 + index * 2.5, y: 57 + index * 4, height: 22,
            duration: hold ? .72 : .54, end() {
              host.classList.add('has-goal');
              if (!reduced) gsap.fromTo(goal, { skewX: 3, scaleX: 1.045 }, { skewX: 0, scaleX: 1, duration: .64, ease: 'elastic.out(1,.32)' });
              impact(86, 55, 'VÀO!');
              if (student) showTarget(student, 71);
              sound('goal');
              pose(first, 'win');
            }
          });
        }, 246);
      }, kickFrom >= 50 ? 220 : 25);
    },
    stampClue(clue) {
      if (current.dataset.motion !== 'run') pose(current, 'focus');
      host.classList.remove('has-lens');
      void host.offsetWidth;
      host.style.setProperty('--flash-x', clamp(parseFloat(current.style.left) + 12, 25, 78) + '%');
      host.classList.add('has-lens');
      sound('stamp');
      if (!clue) return;
      evidence.hidden = false;
      const count = clue.remaining.length;
      evidence.firstElementChild.textContent = 'Còn ' + count + ' hồ sơ';
      evidence.lastElementChild.textContent = count > 1 && count <= 4 ? clue.remaining.map(student => student.name).join(' · ') : '';
      evidenceTween?.kill();
      evidenceTween = gsap.fromTo(evidence, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: time(.34), ease: 'power2.out' });
    },
    falseClue() {
      moving.get(current)?.kill();
      pose(current, 'fake');
      sound('swerve');
    },
    nextCase() {
      evidence.hidden = true;
      walk(current, parseFloat(current.style.left) < 45 ? 59 : 32, .61, { beats: true });
      cameraTo(48, 1.055);
    },
    setSlow(flag) {
      slow = flag;
      cameraTo(mode === 'stadium' ? 71 : parseFloat(current.style.left), flag ? 1.17 : 1.055, flag ? .95 : .55);
      if (flag) sound('heartbeat');
    },
    celebrate() {
      if (mode !== 'garden') pose(current, 'win');
      pose(keeper, 'win');
      for (const x of [22, 49, 78]) fx.burst(x, 40, 'spark', 25);
      cameraTo(50, 1.045);
    },
    reset() {
      clearCues();
      for (const actor of actors.children) moving.get(actor)?.kill();
      cameraTween?.kill();
      shake?.kill();
      ballFlight?.kill();
      signalTween?.kill();
      markTween?.kill();
      evidenceTween?.kill();
      gsap.set(camera, { xPercent: 0, y: 0, scale: 1 });
      gsap.set([target, signal], { autoAlpha: 0 });
      host.classList.remove('has-goal', 'has-impact', 'has-lens');
      slow = false;
      fx.reset();
      setup();
    },
    destroy() {
      clearCues();
      for (const actor of actors.children) moving.get(actor)?.kill();
      cameraTween?.kill();
      shake?.kill();
      ballFlight?.kill();
      signalTween?.kill();
      markTween?.kill();
      evidenceTween?.kill();
      evidence.hidden = true;
      host.classList.remove('has-goal', 'has-impact', 'has-lens', 'is-playing-shot');
      fxHost.classList.remove('has-rain');
      gsap.set(camera, { xPercent: 0, y: 0, scale: 1 });
      gsap.set([target, signal], { autoAlpha: 0 });
      actors.replaceChildren();
      setpiece.replaceChildren();
      fx.destroy();
    }
  };
}
