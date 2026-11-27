import * as PIXI from '../assets/vendor/pixi.min.mjs';
import { princeMarkup, createPrinceGait } from './caller-prince-art.mjs';
import { strikerMarkup, keeperMarkup, PENALTY_KICK_CONTACT_MS, PENALTY_STRIDE_UNITS } from './caller-penalty-art.mjs';
import { detectiveMarkup } from './caller-detective-art.mjs';
import { footballAt, netMesh, netPoint } from './caller-motion.mjs';

const GOAL = [
  '<svg viewBox="0 0 360 230" aria-hidden="true">',
  '<defs><linearGradient id="caller-post" x2="0" y2="1"><stop stop-color="#fff"/><stop offset="1" stop-color="#7395b8"/></linearGradient></defs>',
  '<path d="M22 213 49 39 324 23 346 208 22 218z" fill="#101a33" fill-opacity=".21"/>',
  '<path class="caller-net-weave" fill="none" stroke="#d9e9ed" stroke-width=".8" stroke-opacity=".48"/>',
  '<g class="caller-net-contact" fill="none" visibility="hidden"><circle r="10" stroke="#b4fff0" stroke-width="2"/><circle r="15" stroke="#fff5bd" stroke-width="1" stroke-dasharray="2 4"/></g>',
  '<path d="M16 216 42 42Q43 35 52 35L325 20Q333 20 333 30L340 211" fill="none" stroke="#253451" stroke-width="14" stroke-linecap="round"/>',
  '<path d="M16 212 42 39Q43 33 52 33L325 18Q331 18 332 28L340 209" fill="none" stroke="url(#caller-post)" stroke-width="8" stroke-linecap="round"/>',
  '<path d="M22 216 333 213 350 188" fill="none" stroke="#a0bfd9" stroke-width="3" opacity=".65"/></svg>'
].join('');
const BALL = '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="caller-ball-light" cx=".3" cy=".2" r=".78"><stop stop-color="#fff"/><stop offset=".62" stop-color="#edf9fc"/><stop offset="1" stop-color="#849dbb"/></radialGradient></defs><circle cx="32" cy="32" r="29" fill="url(#caller-ball-light)" stroke="#1c2946" stroke-width="3"/><path d="m23 19 17 2 7 15-15 10-14-11Z M6 22l8 2 7-5 4-16C15 5 9 12 6 22Zm44-13-1 13 11 7A29 29 0 0 0 50 9Zm11 26-12 5-4 15a30 30 0 0 0 16-20ZM22 58l6-11-9-8-13 5a28 28 0 0 0 16 14Z" fill="#233451"/><path d="m13 24 6 12m21-15 10-1m-3 16 3 5m-18 5-4 3" stroke="#6482a4" stroke-width="1.8" fill="none"/><ellipse cx="22" cy="14" rx="8" ry="3" fill="white" opacity=".65" transform="rotate(-26 22 14)"/></svg>';

const COLORS = {
  garden: [0xffa5cb, 0xffcdd8, 0xffe299, 0xf6c38a],
  stadium: [0xbaf8ff, 0x69ddff, 0x99fff7, 0xffcf84],
  office: [0xf5b367, 0xffdd95, 0x6ee3f1, 0xf3ab7e]
};
const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
const between = (min, max) => min + Math.random() * (max - min);
const BALL_SPOT = { x: 42, y: 83, floor: 86, scale: 1, angle: 0 };
const NET_BASE = netMesh();
const CONTACTS = {
  detective: { width: 360, stride: 84, seconds: .78, attr: 'data-step-contact' },
  striker: { width: 300, stride: PENALTY_STRIDE_UNITS, seconds: .48, attr: 'data-run-contact' }
};

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
    const ground = kind === 'turf' ? [0x8aa759, 0x4f782f, 0x9db178] : [0xcacd9b, 0xd6a87a, 0xe6c090];
    const palette = kind === 'dust' || kind === 'turf' ? ground : colors;
    sprite.tint = palette[Math.floor(between(0, palette.length))];
    const isRain = kind === 'rain';
    const isPetal = kind === 'petal';
    const isDust = kind === 'dust' || kind === 'turf';
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
      if (kind !== 'rain' && kind !== 'petal' && kind !== 'crowd') item.vy += (kind === 'dust' ? 6 : 157) * delta;
      sprite.position.set(item.x, item.y);
      sprite.rotation = kind === 'rain' ? .31 : item.rotation + item.age * (kind === 'petal' ? 1.7 : 4);
      const size = item.size * (kind === 'dust' ? .65 + progress : 1);
      sprite.scale.set(kind === 'rain' ? .7 : size, kind === 'rain' ? size : kind === 'petal' ? size * .48 : size);
      sprite.alpha = (1 - progress) * (kind === 'dust' || kind === 'rain' ? .46 : kind === 'crowd' || kind === 'turf' ? .55 : .92);
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
  const horseGaits = new WeakMap();
  const cues = new Set();
  let first;
  let current;
  let keeper;
  let ball;
  let ballShadow;
  let ballState;
  let goal;
  let net;
  let netContact;
  let netContactTween;
  let netTween;
  let cameraTween;
  let shake;
  let ballFlight;
  let signalTween;
  let markTween;
  let guestTween;
  let evidenceTween;
  let slow = false;
  let travelSeries = 0;
  let keeperDiveSeries = 0;
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
    element.dataset.role = role;
    element.dataset.motion = 'idle';
    element.style.left = x + '%';
    element.innerHTML = '<div class="caller-performer-facing">' + markup + '</div>';
    actors.append(element);
    if (role === 'prince' && !reduced) horseGaits.set(element, createPrinceGait(element));
    return element;
  }

  function pose(element, key, direction) {
    if (!element) return;
    if (key !== 'run') {
      horseGaits.get(element)?.reset();
      delete element.dataset.locomotion;
      delete element.dataset.gait;
    }
    if (direction) element.dataset.direction = direction;
    if (element.dataset.motion === key) {
      delete element.dataset.motion;
      void element.offsetWidth;
    }
    element.dataset.motion = key;
  }

  function svgOnStage(svgElement, x, y) {
    const matrix = svgElement?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(x, y).matrixTransform(matrix);
    const bounds = actors.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    return { x: (point.x - bounds.left) / bounds.width * 100, y: (point.y - bounds.top) / bounds.height * 100 };
  }

  function svgContact(anchor) {
    if (!anchor) return null;
    return svgOnStage(anchor, anchor.cx.baseVal.value, anchor.cy.baseVal.value);
  }

  function hostPoint(point) {
    const stage = actors.getBoundingClientRect();
    const screen = host.getBoundingClientRect();
    return {
      x: ((stage.left - screen.left) + stage.width * point.x / 100) * 100 / Math.max(1, screen.width),
      y: ((stage.top - screen.top) + stage.height * point.y / 100) * 100 / Math.max(1, screen.height)
    };
  }

  function groundContact(anchor, role, strength) {
    const contact = svgContact(anchor);
    if (!contact || contact.x < 1 || contact.x > 100) return;
    if (role !== 'detective') {
      fx.burst(contact.x, contact.y, role === 'prince' ? 'dust' : 'turf', Math.ceil(3 + strength * 5));
    }
    sound(role === 'prince' ? 'hoof' : 'step', { strength, pan: contact.x / 50 - 1, surface: mode });
  }

  function walk(element, x, duration, { finish = 'idle', beats = false, facing } = {}) {
    if (!element) return;
    moving.get(element)?.kill();
    const origin = parseFloat(element.style.left);
    const role = element.dataset.role;
    const gait = reduced ? null : CONTACTS[role];
    const horse = reduced ? null : horseGaits.get(element);
    const distance = Math.abs(x - origin) * actors.clientWidth / 100;
    const actorWidth = element.offsetWidth || 1;
    const svgDistance = distance / actorWidth * (role === 'prince' ? 480 : gait?.width || 300);
    const contactNodes = gait ? ['near', 'far'].map(side => element.querySelector('[' + gait.attr + '="' + side + '"]')) : [];
    const facesLeft = facing ? facing === 'left' : x < origin;
    if (Math.abs(x - origin) > 2) element.classList.toggle('faces-left', facesLeft);
    const walkingBackwards = facesLeft !== (x < origin);
    if (gait) {
      if (role === 'detective') element.dataset.locomotion = 'driven';
      else element.dataset.gait = 'paced';
    }
    horse?.reset();
    pose(element, 'run');
    horse?.step(0);
    const path = { progress: 0 };
    let lastContact = -1;
    let lastDistance = 0;
    const animation = gsap.to(path, {
      progress: 1,
      duration: time(duration),
      ease: 'sine.inOut',
      onUpdate() {
        const progress = path.progress;
        const traveled = svgDistance * progress;
        element.style.left = origin + (x - origin) * progress + '%';
        const force = clamp(.25 + (traveled - lastDistance) / 14, .25, 1);
        lastDistance = traveled;
        element.style.setProperty('--ground-force', String(.68 + force * .32));
        if (horse) {
          const lift = clamp(.65 + force * .34, .65, 1);
          const landings = horse.step(traveled, { lift });
          if (beats) for (const hoof of landings) groundContact(hoof, role, force);
        } else if (gait) {
          const gaitTime = traveled / gait.stride;
          const phase = ((walkingBackwards ? -gaitTime : gaitTime) % 1 + 1) % 1;
          element.style.setProperty('--caller-phase', String(phase));
          element.style.setProperty('--caller-gait-time', (-phase * gait.seconds) + 's');
          const contact = Math.floor(gaitTime * 2);
          if (beats && contact !== lastContact) groundContact(contactNodes[contact % 2], role, force);
          lastContact = contact;
        }
      },
      onComplete() {
        element.style.removeProperty('--ground-force');
        if (finish && element.isConnected) pose(element, finish);
      }
    });
    moving.set(element, animation);
  }

  function cameraTo(x, zoom, duration = .58) {
    if (reduced) return;
    cameraTween?.kill();
    if (mode === 'stadium' && host.clientWidth < 570) zoom = Math.min(1.075, zoom);
    const pan = (50 - x) * (zoom - 1) * .9;
    cameraTween = gsap.to(camera, { scale: zoom, xPercent: pan, duration, ease: 'sine.inOut', overwrite: 'auto' });
  }

  function impact(x, y, label = '') {
    fx.burst(x, y, 'spark', 32);
    const point = hostPoint({ x, y });
    host.style.setProperty('--flash-x', point.x + '%');
    host.style.setProperty('--flash-y', point.y + '%');
    host.classList.remove('has-impact');
    if (label) showSignal(label, clamp(point.x, 12, 88), clamp(point.y, 14, 72));
    if (reduced) return;
    void host.offsetWidth;
    host.classList.add('has-impact');
    shake?.kill();
    shake = gsap.fromTo(camera, { y: 4 }, { y: 0, duration: .36, ease: 'elastic.out(1,.32)' });
  }

  function showSignal(label, x, y) {
    signal.textContent = label;
    signal.style.left = x + '%';
    signal.style.top = y + '%';
    signalTween?.kill();
    signalTween = gsap.timeline().fromTo(signal, { autoAlpha: 0, y: 12, scale: .72 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: time(.33), ease: 'back.out(1.7)'
    }).to(signal, { autoAlpha: 0, y: -12, duration: time(.28), delay: .64 });
  }

  function showTarget(student, left, top) {
    targetName.textContent = student.name;
    target.style.left = clamp(left, 21, 79) + '%';
    target.style.top = top == null ? '' : clamp(top, 19, 65) + '%';
    markTween?.kill();
    markTween = gsap.timeline().fromTo(target, { autoAlpha: 0, y: 7, scale: .9 }, {
      autoAlpha: 1, y: 0, scale: 1, duration: time(.26), ease: 'back.out(1.6)'
    }).to(target, { autoAlpha: 0, y: -6, duration: time(.24), delay: 1.15 });
  }

  function placeBall(position) {
    ballState = { ...position };
    ball.style.left = position.x + '%';
    ball.style.top = position.y + '%';
    ball.style.setProperty('--ball-scale', position.scale);
    ball.firstElementChild.style.rotate = position.angle + 'deg';
    ballShadow.style.left = position.x + '%';
    ballShadow.style.top = position.floor + '%';
    const altitude = Math.max(0, position.floor - position.y - 3);
    ballShadow.style.scale = String(position.scale * (1 + altitude * .027));
    ballShadow.style.opacity = String(clamp(.52 - altitude * .014, .07, .52));
  }

  function launchBall({ x, y, floor, scale, arc = 9, duration, spin = 280, end, trail = true, rolling = false }) {
    ballFlight?.kill();
    const from = ballState;
    const to = { x, y, floor, scale };
    const clock = { position: 0 };
    const ratio = actors.clientHeight / Math.max(1, actors.clientWidth);
    ballFlight = gsap.to(clock, {
      position: 1,
      duration: time(duration),
      ease: 'none',
      onUpdate() {
        const progress = clock.position;
        const position = footballAt(from, to, progress, { arc, spin, drag: rolling ? 2.6 : .55, rolling });
        placeBall(position);
        const angle = Math.atan2(position.velocityY * ratio, position.velocityX) * 180 / Math.PI;
        ball.style.setProperty('--trail-angle', angle + 'deg');
        ball.classList.toggle('in-flight', !reduced && trail && progress < .92);
      },
      onComplete() { ball.classList.remove('in-flight'); end?.(); }
    });
  }

  function netLocation(u, v) {
    const { x, y } = netPoint(u, v);
    return svgOnStage(net.ownerSVGElement, x, y);
  }

  function hitNet(u, v) {
    if (reduced) return;
    netTween?.kill();
    const clock = { seconds: 0 };
    netTween = gsap.to(clock, {
      seconds: .85,
      duration: .85,
      ease: 'none',
      onUpdate() { net.setAttribute('d', netMesh(clock.seconds, u, v, 23)); },
      onComplete() { net.setAttribute('d', NET_BASE); }
    });
  }

  function markNetContact(u, v) {
    netContactTween?.kill();
    const point = netPoint(u, v);
    netContact.setAttribute('visibility', 'visible');
    const update = (scale, opacity) => {
      netContact.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ') scale(' + scale + ')');
      netContact.setAttribute('opacity', opacity);
    };
    update(1, 1);
    if (reduced) return;
    const ring = { progress: 0 };
    netContactTween = gsap.to(ring, {
      progress: 1,
      duration: .62,
      ease: 'power2.out',
      onUpdate() { update(.7 + ring.progress * 1.8, 1 - ring.progress); },
      onComplete() { netContact.setAttribute('visibility', 'hidden'); }
    });
  }

  function keeperDive(direction) {
    pose(keeper, 'dive', direction);
    if (reduced) return;
    const serial = ++keeperDiveSeries;
    const landing = keeper.querySelector('.cg-keeper-shadow');
    cue(() => {
      if (serial !== keeperDiveSeries || keeper.dataset.motion !== 'dive') return;
      const point = svgContact(landing);
      if (!point) return;
      fx.burst(point.x, point.y, 'turf', 11);
      sound('step', { strength: .54, pan: point.x / 50 - 1, surface: mode });
    }, 735);
  }

  function appendStudent(horse, markup) {
    const guest = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    guest.setAttribute('class', 'caller-horse-guest');
    guest.innerHTML = markup;
    const portrait = guest.firstElementChild;
    portrait.setAttribute('width', '76');
    portrait.setAttribute('height', '91');
    portrait.style.animation = 'none';
    horse.querySelector('.cpr-rider').before(guest);
    return guest;
  }

  function mountStudent(horse, guest) {
    const feet = guest.querySelector('path[d^="M29 66h5"]');
    const farFoot = feet?.cloneNode(false);
    if (farFoot) {
      feet.setAttribute('d', 'M29 66h5v12h-8z');
      farFoot.setAttribute('d', 'M38 66h5l4 12h-8z');
      feet.after(farFoot);
    }
    const setPosition = (x, y, tilt = 0) => {
      guest.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + tilt + ' 38 81)');
    };
    const setFeet = angle => {
      feet?.setAttribute('transform', 'rotate(' + angle + ' 31 66)');
      farFoot?.setAttribute('transform', 'rotate(' + -angle + ' 40 66)');
    };
    const settle = () => {
      setPosition(174, 100);
      setFeet(-12);
      pose(horse, 'win');
      const seat = svgOnStage(guest, 39, 44);
      if (seat) fx.burst(seat.x, seat.y, 'petal', 21);
      sound('chime');
    };
    if (reduced) { settle(); return 0; }

    const startX = 84;
    const groundY = 230;
    const mountX = 147;
    const strides = { progress: 0 };
    const jump = { progress: 0 };
    setPosition(startX, groundY);
    guestTween?.kill();
    guestTween = gsap.timeline()
      .fromTo(guest, { opacity: 0 }, { opacity: 1, duration: .13 }, 0)
      .to(strides, {
        progress: 1, duration: .36, ease: 'sine.inOut',
        onUpdate() {
          const step = strides.progress;
          setPosition(startX + (mountX - startX) * step, groundY - Math.abs(Math.sin(step * Math.PI * 2)) * 3, 3);
          setFeet(Math.sin(step * Math.PI * 4) * 21);
        }
      }, 0)
      .call(() => {
        setPosition(mountX, groundY + 4, 11);
        setFeet(0);
        const point = svgOnStage(guest, 38, 83);
        if (point) {
          fx.burst(point.x, point.y, 'dust', 8);
          sound('step', { strength: .58, pan: point.x / 50 - 1, surface: mode });
        }
      }, [], .36)
      .to(jump, {
        progress: 1, duration: .38, ease: 'sine.inOut',
        onUpdate() {
          const fraction = jump.progress;
          const clearance = Math.sin(fraction * Math.PI);
          setPosition(mountX + (174 - mountX) * fraction, groundY + 4 + (100 - groundY - 4) * fraction - clearance * 28, 11 * (1 - fraction));
          setFeet(clearance * 26 - fraction * 12);
        },
        onComplete: settle
      }, .44);
    return 840;
  }

  function strikerTakeOff() {
    const rigWidth = first.offsetWidth / Math.max(1, actors.clientWidth) * 100;
    const ballRadius = ball.offsetWidth / Math.max(1, actors.clientWidth) * 50 * ballState.scale;
    // The boot reaches x=224 in the 300-unit rig at its contact frame.
    return ballState.x - ballRadius * .86 - rigWidth * (224 / 300 - .5);
  }

  function playFootContact() {
    const toe = svgContact(first.querySelector('[data-kick-contact]'));
    if (toe) fx.burst(toe.x, Math.max(toe.y, ballState.floor - 1), 'turf', 10);
    sound('kick', { pan: ballState.x / 50 - 1 });
  }

  function setup() {
    travelSeries = 0;
    actors.replaceChildren();
    setpiece.replaceChildren();
    evidence.hidden = true;
    delete evidence.dataset.state;
    if (mode === 'garden') current = first = performer(princeMarkup(0), 'prince', 35);
    if (mode === 'office') current = first = performer(detectiveMarkup(), 'detective', 33);
    if (mode === 'stadium') {
      setpiece.innerHTML = '<div class="caller-cinema-goal">' + GOAL + '</div>';
      goal = setpiece.firstElementChild;
      net = goal.querySelector('.caller-net-weave');
      netContact = goal.querySelector('.caller-net-contact');
      net.setAttribute('d', NET_BASE);
      current = first = performer(strikerMarkup(), 'striker', 26);
      keeper = performer(keeperMarkup(), 'keeper', 79);
      ballShadow = document.createElement('div');
      ballShadow.className = 'caller-cinema-ball-shadow';
      ball = document.createElement('div');
      ball.className = 'caller-cinema-ball';
      ball.innerHTML = BALL;
      actors.append(ballShadow, ball);
      placeBall(BALL_SPOT);
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
      if (!reduced) first.style.left = mode === 'garden' ? '-17%' : '19%';
      walk(first, mode === 'garden' ? 37 : 32, mode === 'garden' ? 1.02 : 1.38, { beats: true });
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
      if (mode === 'office') {
        const oneStride = current.offsetWidth * (84 / 360) / Math.max(1, actors.clientWidth) * 100;
        const limit = oneStride * (slow ? 1.12 : .84);
        x = clamp(x, from - limit, from + limit);
      }
      const tagX = x < 49 ? x + 18 : x - 17;
      const serial = ++travelSeries;
      const duration = mode === 'office' ? (slow ? .94 : .66) : (slow ? .74 : .53);
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
      const exitMs = this.depart();
      if (reduced) previous.remove();
      else cue(() => previous.remove(), exitMs + 15);
      current = performer(princeMarkup(index), 'prince', reduced ? 38 : -19);
      walk(current, 38, 1.02, { beats: true });
      sound('fanfare');
    },
    winner(studentAvatar, student) {
      if (mode !== 'garden') return 0;
      const horse = current;
      moving.get(horse)?.kill();
      pose(horse, 'focus');
      if (student) showTarget(student, parseFloat(horse.style.left) + (horse.classList.contains('faces-left') ? 12 : -12), 50);
      if (studentAvatar) return mountStudent(horse, appendStudent(horse, studentAvatar));
      pose(horse, 'win');
      sound('chime');
      return 0;
    },
    depart() {
      if (mode !== 'garden' || reduced) return 0;
      const distance = 124 - parseFloat(current.style.left);
      const duration = clamp(distance * .012, .85, 1.2);
      walk(current, 124, duration, { beats: true, finish: null });
      cameraTo(61, 1.035, .95);
      return duration * 1000;
    },
    prepareShot() {
      host.classList.remove('has-goal');
      ballFlight?.kill();
      netTween?.kill();
      netContactTween?.kill();
      netContact.setAttribute('visibility', 'hidden');
      net.setAttribute('d', NET_BASE);
      placeBall(BALL_SPOT);
      ball.classList.remove('in-flight');
      pose(keeper, 'run');
      walk(first, 20, .37, { facing: 'right', beats: true });
      cameraTo(34, 1.12);
    },
    fakeShot(trick, onImpact) {
      const runUp = .46;
      walk(first, strikerTakeOff(), runUp, { facing: 'right', beats: true, finish: null });
      cue(() => {
        pose(first, trick === 0 ? 'fake' : 'focus');
        keeperDive(trick === 1 ? 'right' : 'left');
        if (trick === 0) {
          fx.burst(40, 84, 'turf', 9);
          sound('swerve');
          onImpact?.();
          return;
        }
        cue(() => {
          playFootContact();
          const contact = netLocation(trick === 1 ? .01 : .43, trick === 1 ? .66 : .59) || { x: 67, y: 60 };
          launchBall({
            ...contact, floor: 82, scale: .68, arc: 9, duration: .29, spin: 320,
            end() {
              impact(contact.x, contact.y);
              sound(trick === 1 ? 'post' : 'catch');
              onImpact?.();
              launchBall({
                x: 58, y: 81, floor: 84, scale: .93, arc: 4, duration: .27, spin: -160, trail: false
              });
            }
          });
        }, PENALTY_KICK_CONTACT_MS);
      }, runUp * 1000 + 12);
    },
    scoreShot(index, hold = false, student) {
      cameraTo(62, hold ? 1.13 : 1.09);
      const takeOff = strikerTakeOff();
      const advance = Math.abs(parseFloat(first.style.left) - takeOff) > 1.25;
      if (advance) walk(first, takeOff, .48, { facing: 'right', beats: true, finish: null });
      cue(() => {
        pose(first, 'focus');
        cue(() => {
          playFootContact();
          const u = [.76, .24, .68][index];
          const v = [.45, .60, .66][index];
          const contact = netLocation(u, v) || { x: 86, y: 60 };
          const floor = netLocation(u, .99)?.y ?? 80;
          cue(() => keeperDive(u > .5 ? 'left' : 'right'), 70);
          launchBall({
            ...contact, floor, scale: .58, arc: hold ? 14 : 10,
            duration: hold ? .74 : .50, spin: 570,
            end() {
              host.classList.add('has-goal');
              hitNet(u, v);
              markNetContact(u, v);
              const point = hostPoint(contact);
              impact(contact.x, contact.y, 'VÀO!');
              if (student) showTarget(student, point.x, point.y - 18);
              sound('goal', { pan: contact.x / 50 - 1 });
              pose(first, 'win');
              launchBall({
                x: contact.x + 1.8, y: floor - 1.5, floor, scale: .55,
                arc: 0, duration: .49, spin: 117, trail: false
              });
            }
          });
        }, PENALTY_KICK_CONTACT_MS);
      }, advance ? 495 : 25);
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
      delete evidence.dataset.state;
      const count = clue.remaining.length;
      evidence.firstElementChild.textContent = 'Còn ' + count + ' hồ sơ';
      evidence.lastElementChild.textContent = count > 1 && count <= 4 ? clue.remaining.map(student => student.name).join(' · ') : '';
      evidenceTween?.kill();
      evidenceTween = gsap.fromTo(evidence, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: time(.34), ease: 'power2.out' });
    },
    confirmSuspect(student) {
      if (mode !== 'office' || !student) return;
      evidence.hidden = false;
      evidence.dataset.state = 'confirmed';
      evidence.firstElementChild.textContent = 'Đã xác minh';
      evidence.lastElementChild.textContent = student.name;
      evidenceTween?.kill();
      evidenceTween = gsap.fromTo(evidence, { y: 8, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: time(.30), ease: 'power2.out'
      });
      sound('stamp');
      const detective = current;
      cue(() => {
        const lens = detective.querySelector('.cd-elbow-lens circle[cx="295"][cy="157"]');
        const point = svgContact(lens);
        if (!point) return;
        const projection = hostPoint(point);
        host.style.setProperty('--flash-x', clamp(projection.x, 12, 88) + '%');
        host.style.setProperty('--flash-y', clamp(projection.y, 16, 75) + '%');
        host.classList.remove('has-lens');
        if (!reduced) {
          void host.offsetWidth;
          host.classList.add('has-lens');
        }
        fx.burst(point.x, point.y, 'spark', 13);
      }, 220);
    },
    falseClue() {
      moving.get(current)?.kill();
      pose(current, 'fake');
      sound('swerve');
    },
    nextCase() {
      evidence.hidden = true;
      delete evidence.dataset.state;
      const x = parseFloat(current.style.left);
      walk(current, x + (x < 45 ? 5 : -5), .67, { beats: true });
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
      netTween?.kill();
      netContactTween?.kill();
      guestTween?.kill();
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
      netTween?.kill();
      netContactTween?.kill();
      guestTween?.kill();
      signalTween?.kill();
      markTween?.kill();
      evidenceTween?.kill();
      evidence.hidden = true;
      delete evidence.dataset.state;
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
