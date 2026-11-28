// “Lái đò tri thức”: thầy/cô chở cả lớp qua sông, gặp giông bão rồi cập bến trường.
// Cả lớp lần lượt lên bờ; bạn được gọi là người ngủ quên còn lại trên đò (tên đã chọn sẵn trước khi diễn).
import { el, sprite, preload, clamp, pick, shortNames, director, smooth } from './caller-kit.mjs';

const ART = '../assets/caller-do/';
const art = name => ART + name + '.webp';
const POSES = ['stand', 'row', 'shock', 'storm', 'wave', 'call', 'giggle'];
const PILOT_KEY = 'caller-ferry-pilot';
const NAMES_KEY = 'caller-ferry-names';
const MAX_SEATS = 60;
const STAGE_W = 1600, STAGE_H = 900;
/* hình học của con đò trên sân khấu 1600×900 */
export const BOAT = { x: 0, y: 606, w: 1120, h: 261, dockShift: 34 };
const SEATS = { left: 338, right: 978, front: 784, rowGap: 46 };
const TEMPO = .58; // nhịp “Nhanh” bằng đúng tốc độ video mẫu (khoảng 15 giây một chuyến)
/* mép thuyền phía gần người xem (theo % ảnh boat.webp): hai đầu thuyền cong lên */
const RAIL = [[0, 50], [5, 53.5], [10, 55.5], [20, 59], [30, 61], [40, 62], [50, 62.5], [60, 61], [70, 57.5], [80, 51], [85, 45], [90, 35], [95, 19], [100, 4]];
function railAt(x) {
  const percent = clamp((x - BOAT.x) / BOAT.w * 100, 0, 100);
  const next = Math.max(1, RAIL.findIndex(point => point[0] >= percent));
  const [a, b] = [RAIL[next - 1], RAIL[next]];
  return BOAT.y + (a[1] + (b[1] - a[1]) * (percent - a[0]) / (b[0] - a[0])) / 100 * BOAT.h;
}
const DECK = { edge: 1040, y: 648 };

const store = {
  get(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* chế độ riêng tư */ } }
};

export function createKnowledgeFerry(host, { sound, roster }) {
  preload([...['thay', 'co'].flatMap(who => POSES.map(pose => art(who + '-' + pose))), art('nonla'), art('boat'), art('bg-song'), art('bg-ben'), art('wave'), art('carp'),
    ...Array.from({ length: 8 }, (_, i) => art('sit-' + (i + 1))), ...Array.from({ length: 4 }, (_, i) => art('walk-' + (i + 1))), art('sleep-boy'), art('sleep-girl')]);

  let pilot = store.get(PILOT_KEY, 'thay') === 'co' ? 'co' : 'thay';
  let showNames = store.get(NAMES_KEY, 'on') !== 'off';
  const title = () => (pilot === 'co' ? 'Cô' : 'Thầy');
  const self = () => (pilot === 'co' ? 'cô' : 'thầy');

  const scene = el('div', 'journey-scene do-scene');
  const wash = el('div', 'do-wash');
  const stage = el('div', 'do-stage');
  const bgSong = sprite(art('bg-song'), 'do-bg do-bg-song');
  const bgBen = sprite(art('bg-ben'), 'do-bg do-bg-ben');
  const rainbow = el('div', 'do-rainbow');
  const birds = el('div', 'do-birds');
  birds.innerHTML = '<i></i><i></i><i></i><i></i>';
  const sky = el('div', 'do-sky');
  sky.innerHTML = '<i class="do-cloud c1"></i><i class="do-cloud c2"></i><i class="do-cloud c3"></i><i class="do-cloud c4"></i>' +
    '<svg class="do-bolt" viewBox="0 0 60 120" aria-hidden="true"><path d="M36 2 6 66h20L16 118l40-70H34L52 2z" fill="#ffe65a" stroke="#fff7c2" stroke-width="4" stroke-linejoin="round"/></svg>';
  const boat = el('div', 'do-boat');
  const rock = el('div', 'do-rock');
  const hullBack = sprite(art('boat'), 'do-hull');
  const pilotImg = sprite(art(pilot + '-stand'), 'do-pilot');
  const seats = el('div', 'do-seats');
  const hullFront = sprite(art('boat'), 'do-hull is-front');
  rock.append(hullBack, pilotImg, seats, hullFront);
  boat.append(rock);
  const ripples = el('div', 'do-ripples');
  const walkers = el('div', 'do-walkers');
  const splashes = el('div', 'do-splashes');
  const hat = sprite(art('nonla'), 'do-hat');
  stage.append(bgSong, bgBen, rainbow, birds, sky, boat, ripples, walkers, splashes, hat);
  const rain = el('div', 'do-rain');
  const flash = el('div', 'do-flash');
  const dim = el('div', 'do-dim');
  const hud = el('div', 'do-hud');
  const chips = el('div', 'do-chips');
  const classChip = el('span', 'do-chip');
  const leftChip = el('span', 'do-chip is-count');
  chips.append(classChip, leftChip);
  const tools = el('div', 'do-tools');
  const pilotButton = el('button', 'do-chip');
  pilotButton.type = 'button';
  const namesButton = el('button', 'do-chip');
  namesButton.type = 'button';
  tools.append(pilotButton, namesButton);
  const logBox = el('div', 'do-log');
  const banner = el('div', 'do-banner-slot');
  scene.append(wash, stage, rain, flash, dim, hud, chips, logBox, banner);
  host.querySelector('.caller-cinema-setpiece').append(scene);
  host.append(tools); // nút bấm phải nằm ngoài lớp trang trí (aria-hidden)

  const view = { s: 1, x: 0, y: 0 };
  const people = new Map();
  const tags = new Map();
  let frame = 0, alive = true, playing = false, remaining = 0;
  const loops = new Set();

  function layout() {
    const w = scene.clientWidth, h = scene.clientHeight;
    if (!w || !h) return;
    const contain = Math.min(w / STAGE_W, h / STAGE_H);
    const cover = Math.max(w / STAGE_W, h / STAGE_H);
    view.s = Math.max(contain, Math.min(cover, w / 1250));
    view.x = (w - STAGE_W * view.s) / 2;
    if (view.x < 0) view.x = Math.max(w - STAGE_W * view.s, Math.min(0, view.x * .3)); // màn hẹp: nhích về phía thầy cô
    view.y = h > STAGE_H * view.s ? (h - STAGE_H * view.s) * .62 : h - STAGE_H * view.s;
    stage.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.s})`;
  }
  function render() {
    if (!alive) return;
    frame = requestAnimationFrame(render);
    if (!tags.size) return;
    const w = scene.clientWidth, h = scene.clientHeight;
    for (const tag of tags.values()) {
      const point = tag.anchor();
      const half = tag.node.offsetWidth / 2;
      const x = view.x + point.x * view.s, y = view.y + point.y * view.s;
      tag.node.style.left = clamp(x, half + 6, Math.max(half + 6, w - half - 6)) + 'px';
      tag.node.style.top = clamp(y, tag.node.offsetHeight + 46, h - 6) + 'px';
    }
  }

  /* ---------- lời thoại, chữ to, nhật ký chuyến đò ---------- */
  function bubble(key, text, anchor, className = '', life = 0) {
    hush(key);
    const node = el('div', 'do-bubble ' + className, text);
    hud.append(node);
    const tag = { node, anchor };
    tags.set(key, tag);
    if (life) later(() => { if (tags.get(key) === tag) hush(key); }, life);
    return node;
  }
  function hush(...keys) { for (const key of keys) { tags.get(key)?.node.remove(); tags.delete(key); } }
  function hushAll() { hud.replaceChildren(); tags.clear(); }
  const pilotSays = (text, life) => bubble('pilot', text, () => ({ x: 190 + boatShift(), y: 478 }), '', life);
  const seatAnchor = person => () => ({ x: person.x + boatShift(), y: person.y - person.h - 22 });
  function chatter(lines, life) {
    const seated = [...people.values()].filter(person => !person.gone);
    if (!seated.length) return;
    const person = pick(seated);
    bubble('kid-' + person.student.id, pick(lines), seatAnchor(person), 'is-kid', life);
  }
  function shout(text, tone = '') {
    const node = el('div', 'do-banner ' + tone, text);
    banner.replaceChildren(node);
    later(() => node.remove(), tone === 'is-count' ? 460 : 1250); // hẹn giờ: vẫn tự ẩn khi máy tắt hiệu ứng
  }
  function log(text) {
    logBox.append(el('p', '', text));
    while (logBox.children.length > 4) logBox.firstElementChild.remove();
  }
  function later(job, ms) {
    const id = setTimeout(() => { loops.delete(id); job(); }, ms);
    loops.add(id);
    return id;
  }
  function clearTimers() { loops.forEach(clearTimeout); loops.clear(); }

  /* ---------- con đò & hành khách ---------- */
  let shift = 0;
  const boatShift = () => shift;
  function moveBoat(x, ms) {
    shift = x;
    boat.style.transitionDuration = ms + 'ms';
    boat.style.transform = `translateX(${x}px)`;
  }
  function posePilot(pose) {
    pilotImg.src = art(pilot + '-' + pose);
    pilotImg.dataset.pose = pose;
  }
  function counter(n) {
    remaining = n;
    leftChip.innerHTML = 'Còn trên đò: <b>' + n + '</b>';
  }
  function labels() {
    pilotButton.textContent = 'Người lái đò: ' + title();
    namesButton.textContent = 'Tên: ' + (showNames ? 'hiện' : 'ẩn');
    scene.classList.toggle('is-nameless', !showNames);
  }
  pilotButton.onclick = () => {
    if (playing) return;
    pilot = pilot === 'co' ? 'thay' : 'co';
    store.set(PILOT_KEY, pilot);
    labels();
    posePilot('stand');
  };
  namesButton.onclick = () => {
    showNames = !showNames;
    store.set(NAMES_KEY, showNames ? 'on' : 'off');
    labels();
  };

  const sitArt = student => art('sit-' + (((student.signature >>> 3) % 4) * 2 + (student.group === 'nam' ? 1 : 2)));
  const walkArt = student => art('walk-' + (student.group === 'nam' ? ((student.signature >>> 6) % 2 ? 3 : 1) : ((student.signature >>> 6) % 2 ? 4 : 2)));
  const sleepArt = student => art(student.group === 'nam' ? 'sleep-boy' : 'sleep-girl');

  function seat(winners = []) {
    const chosen = new Set(winners.map(student => student.id));
    let list = roster().slice();
    classChip.textContent = 'Lớp mình · ' + list.length + ' bạn';
    counter(list.length);
    if (list.length > MAX_SEATS) list = list.filter(s => !chosen.has(s.id)).slice(0, MAX_SEATS - winners.length).concat(winners);
    const names = shortNames(roster());
    /* trộn chỗ ngồi theo mã riêng của từng bạn để bạn được gọi không luôn ngồi một góc */
    list.sort((a, b) => (a.signature % 997) - (b.signature % 997));
    const count = list.length;
    const rows = count <= 8 ? 1 : count <= 18 ? 2 : count <= 28 ? 3 : 4;
    const perRow = Math.max(1, Math.ceil(count / rows));
    const spacing = Math.min(96, (SEATS.right - SEATS.left) / perRow);
    const size = clamp(spacing * 2.05, 96, count <= 8 ? 150 : 128);
    people.clear();
    seats.replaceChildren();
    seats.style.setProperty('--tag-size', clamp(spacing * .3, 14, 20) + 'px');
    list.forEach((student, index) => {
      const row = Math.floor(index / perRow);
      const inRow = Math.min(perRow, count - row * perRow);
      const depth = rows - 1 - row;
      const scale = 1 - depth * .055;
      const centre = (SEATS.left + SEATS.right) / 2;
      const x = centre + (index % perRow - (inRow - 1) / 2) * spacing + (row % 2 ? spacing * .2 : -spacing * .2);
      const y = SEATS.front - depth * SEATS.rowGap - Math.max(0, railAt(BOAT.w / 2) - railAt(x)) * .85; // đầu thuyền cong lên thì ngồi cao theo
      const node = el('div', 'do-kid');
      Object.assign(node.style, { left: x + 'px', top: y - size * scale + 'px', height: size * scale + 'px' });
      node.style.setProperty('--bob', -(student.signature % 1200) + 'ms');
      const img = sprite(sitArt(student), '');
      const label = el('b', 'do-name', names.get(student.id));
      label.title = student.name;
      label.style.top = (index % 2 ? 2 : -16) + 'px';
      node.append(img, label);
      seats.append(node);
      people.set(student.id, { student, node, img, x, y, h: size * scale, short: names.get(student.id), gone: false });
    });
  }

  /* ---------- thời tiết ---------- */
  function splash(x, y, size, className = '') {
    const node = sprite(art('wave'), 'do-wave ' + className);
    Object.assign(node.style, { left: x + 'px', top: y + 'px', width: size + 'px' });
    node.addEventListener('animationend', () => node.remove());
    splashes.append(node);
    for (let i = 0; i < 6; i++) {
      const drop = el('i', 'do-drop');
      drop.style.cssText = `left:${x + (Math.random() - .5) * size}px;top:${y - size * .25}px;--dx:${(Math.random() - .5) * 150}px;--dy:${-40 - Math.random() * 130}px`;
      drop.addEventListener('animationend', () => drop.remove());
      splashes.append(drop);
    }
  }
  let surge = 0;
  function startSurf() {
    stopSurf();
    const next = () => {
      splash(110 + Math.random() * 980 + boatShift(), 800 + Math.random() * 66, 120 + Math.random() * 130, Math.random() > .5 ? 'is-flip' : '');
      surge = later(next, 190 + Math.random() * 170);
    };
    next();
  }
  function stopSurf() { clearTimeout(surge); loops.delete(surge); }
  function thunder(word = 'ĐÙNG!') {
    flash.classList.remove('is-on');
    void flash.offsetWidth;
    flash.classList.add('is-on');
    scene.classList.remove('is-quake');
    void scene.offsetWidth;
    scene.classList.add('is-quake');
    shout(word, 'is-gold');
    sound('thunder');
  }
  function flyHat(back, duration) {
    hat.getAnimations().forEach(animation => animation.cancel());
    const head = { x: 152 + boatShift(), y: 505 }, away = { x: -140, y: 140 };
    const from = back ? away : head, to = back ? head : away;
    const frames = Array.from({ length: 9 }, (_, i) => {
      const k = i / 8;
      const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 190;
      return { transform: `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${(back ? 1 - k : k) * -900}deg)`, opacity: 1 };
    });
    hat.animate(frames, { duration, easing: 'ease-in-out', fill: back ? 'none' : 'forwards' });
  }
  function jumpCarp() {
    const fish = sprite(art('carp'), 'do-carp');
    stage.append(fish);
    const frames = Array.from({ length: 11 }, (_, i) => {
      const k = i / 10;
      const x = 1180 - 520 * k, y = 830 - Math.sin(k * Math.PI) * 540;
      return { transform: `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${40 - k * 150}deg)` };
    });
    fish.animate(frames, { duration: 1500, easing: 'linear' }).onfinish = () => { splash(660, 810, 180); fish.remove(); };
    splash(1180, 830, 180, 'is-flip');
  }

  /* ---------- lên bờ ---------- */
  function leave(person, pace, line) {
    person.gone = true;
    person.node.classList.add('has-left');
    hush('kid-' + person.student.id);
    const node = el('div', 'do-walker');
    node.append(sprite(walkArt(person.student), ''), el('b', 'do-name', person.short));
    walkers.append(node);
    const startX = person.x + boatShift(), startY = person.y;
    const exitX = STAGE_W + 90 + Math.random() * 60;
    const lane = DECK.y + (person.student.signature % 3) * 9 - 6;
    const path = [
      [startX, startY, .86, 0], [startX + 26, startY - 74, 1, .13], [DECK.edge - 90, startY - 30, 1, .34],
      [DECK.edge + 30, lane, .96, .55], [(DECK.edge + exitX) / 2, lane, .92, .78], [exitX, lane, .9, 1]
    ];
    const duration = Math.round((1750 + Math.random() * 350) * pace);
    const anim = node.animate(path.map(([x, y, scale, offset]) => ({ transform: `translate(${x}px,${y}px) translate(-50%,-100%) scale(${scale})`, offset })),
      { duration, easing: 'linear', fill: 'both' });
    anim.onfinish = () => node.remove();
    if (line) {
      const born = performance.now();
      bubble('walk-' + person.student.id, line, () => {
        const k = clamp((performance.now() - born) / duration, 0, 1);
        let i = 1;
        while (i < path.length - 1 && k > path[i][3]) i++;
        const a = path[i - 1], b = path[i], t = (k - a[3]) / (b[3] - a[3] || 1);
        return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t - 150 };
      }, 'is-kid', Math.round(duration * .62));
    }
    sound('hop');
  }

  async function disembark(winners, acting) {
    const stay = new Set(winners.map(student => student.id));
    const queue = [...people.values()].filter(person => !stay.has(person.student.id))
      .sort((a, b) => (b.x + Math.random() * 260) - (a.x + Math.random() * 260));
    const hidden = Math.max(0, remaining - people.size);
    const lastFew = Math.min(queue.length, 4);
    const rush = queue.slice(0, queue.length - lastFew);
    const gap = rush.length ? clamp(3000 / rush.length, 55, 300) : 0;
    const cheers = ['Thoát rồi!', 'Hú hồn!', 'Tới trường rồi!', 'Em lên bờ nha ' + self() + '!', 'May quá!'];
    let left = people.size + hidden;
    const walkPace = Math.max(.75, acting.stretch(1000) / 1000);
    if (hidden) { left -= hidden; counter(left); }
    for (let i = 0; i < rush.length; i++) {
      leave(rush[i], walkPace, i % 4 === 2 ? pick(cheers) : '');
      counter(--left);
      if (i % 6 === 5) log(rush[i].short + ' đã lên bờ');
      await acting.beat(gap * 1.45);
    }
    const thanks = ['Em đi trước nha!', 'Em cảm ơn ' + self() + ' ạ!', 'Em đi trước nha!', 'Tới trường rồi!'];
    for (let i = rush.length; i < queue.length; i++) {
      await acting.beat(340);
      leave(queue[i], walkPace, thanks[(i - rush.length) % thanks.length]);
      counter(--left);
      log(queue[i].short + ' đã lên bờ');
      const still = left - winners.length;
      if (still === 2) shout('Còn ' + left + ' bạn!', 'is-gold');
      await acting.beat(i === queue.length - 1 ? 900 : 640);
    }
  }

  function reset() {
    playing = false;
    clearTimers();
    hushAll();
    walkers.replaceChildren();
    splashes.replaceChildren();
    banner.replaceChildren();
    logBox.replaceChildren();
    stage.querySelectorAll('.do-carp').forEach(node => node.remove());
    hat.getAnimations().forEach(animation => animation.cancel());
    scene.className = 'journey-scene do-scene';
    scene.dataset.phase = 'idle';
    pilotButton.disabled = false;
    labels();
    posePilot('stand');
    moveBoat(0, 0);
    seat();
    layout();
  }

  async function play(batch, _decoys, { pace, wait, focus, status }) {
    const acting = director({ pace: pace * TEMPO, wait });
    reset();
    playing = true;
    pilotButton.disabled = true;
    seat(batch);
    const everyone = roster().length;
    const phase = name => { scene.dataset.phase = name; };

    /* 1. bảng hiệu – đếm ngược – khởi hành */
    phase('title');
    status('Cả lớp đã lên đò.');
    const sign = el('div', 'do-sign');
    sign.innerHTML = '<span class="do-rope l"></span><span class="do-rope r"></span><div><i>✿</i><b>Lái Đò Tri Thức</b><i>✿</i></div>';
    banner.replaceChildren(sign);
    sound('chime');
    await acting.beat(1100);
    banner.replaceChildren();
    phase('countdown');
    for (const number of ['3', '2', '1']) {
      shout(number, 'is-count');
      sound('countBeep');
      await acting.beat(600);
    }
    phase('sailing');
    shout('Khởi hành!', 'is-white');
    sound('boatHorn');
    posePilot('row');
    pilotSays(pick(['Ngồi yên nào, mình đi thôi!', 'Mình khởi hành nhé!']), 1700);
    moveBoat(56, acting.stretch(5200));
    await acting.beat(700);
    chatter(['Sông đẹp quá!', 'Em chưa học bài…', self() === 'cô' ? 'Cô ơi, đi chưa ạ?' : 'Thầy ơi, đi chưa ạ?'], 1100);
    sound('riverWave', { strength: .5 });
    await acting.beat(900);

    /* 2. gió to: nón lá bay */
    phase('wind');
    status('Gió to quá!');
    scene.classList.add('is-storm');
    shout('GIÓ TO!', 'is-white');
    sound('wind');
    posePilot('shock');
    flyHat(false, acting.stretch(900));
    pilotSays('Ối, nón của ' + self() + '!', 1200);
    log('Gió thổi bay nón của ' + self() + '!');
    startSurf();
    await acting.beat(1150);

    /* 3. giông bão */
    phase('storm');
    status('Giông tới rồi, cả lớp ngồi vững!');
    scene.classList.add('is-rough');
    posePilot('storm');
    chatter([self() === 'cô' ? 'Cô ơi, em sợ!' : 'Em sợ quá ạ!', 'Sóng to quá!'], 900);
    await acting.beat(750);
    thunder();
    chatter(['Ướt hết rồi!', 'Ối ối ối!'], 850);
    chatter(['Bám chắc vào!'], 850);
    await acting.beat(900);
    shout('CÁ CHÉP VƯỢT SÓNG!', 'is-gold');
    jumpCarp();
    sound('splash');
    chatter(['Cá chép kìa!', 'Cá chép vượt vũ môn!'], 1200);
    pilotSays('Bám chắc vào nhé!', 1100);
    await acting.beat(1250);
    pilotSays('Ngồi yên, có ' + self() + ' đây!', 1000);
    await acting.beat(800);
    shout('SÓNG LỚN!', 'is-white');
    splash(120 + boatShift(), 880, 620, 'is-giant');
    sound('bigWave');
    pilotSays('Bám chắc vào các con!', 1200);
    await acting.beat(800);
    thunder('ẦM!');
    splash(640, 875, 380, 'is-giant is-flip');
    chatter(['Ướt rồi!', 'Á á!'], 800);
    chatter(['Á á!', 'Ôi!'], 800);
    await acting.beat(900);
    thunder();
    await acting.beat(850);

    /* 4. trời quang, cầu vồng, bến trường hiện ra */
    phase('clearing');
    status('Bão tan, bến trường ở phía trước.');
    stopSurf();
    hushAll();
    scene.classList.remove('is-storm', 'is-rough', 'is-quake');
    scene.classList.add('is-arriving');
    moveBoat(BOAT.dockShift, acting.stretch(1500));
    sound('rainbow');
    posePilot('shock');
    pilotSays('Qua cơn bão rồi các em ơi!', 1300);
    log('Bão tan, cầu vồng hiện ra!');
    chatter(['Sắp tới trường rồi!', 'Hết bão rồi!'], 1200);
    await acting.beat(900);
    flyHat(true, acting.stretch(880));
    await acting.beat(900);
    posePilot('stand');
    pilotSays('Ơ, nón của ' + self() + ' bay về rồi!', 1200);
    await acting.beat(950);
    phase('docked');
    shout('CẬP BẾN!', 'is-gold');
    sound('chime');
    log('Đò cập bến trường rồi!');
    chatter(['Cầu vồng kìa!', 'Hết bão rồi!'], 1100);
    await acting.beat(900);

    /* 5. cả lớp lần lượt lên bờ */
    phase('disembark');
    status('Các bạn lần lượt lên bờ.');
    posePilot('wave');
    pilotSays(pick(['Cẩn thận bậc thang nhé!', 'Từ từ thôi các con!']), 1900);
    await disembark(batch, acting);

    /* 6. ai còn trên đò? */
    const winners = batch.map(student => people.get(student.id)).filter(Boolean);
    const solo = winners.length === 1;
    phase('asking');
    shout('Ai còn trên đò?', 'is-gold');
    status('Ai còn trên đò?');
    sound('heartbeat');
    const gapBetween = 150;
    winners.forEach((person, i) => {
      /* chuyển ra giữa-mũi thuyền, ngồi cao hơn mạn để cả lớp nhìn rõ */
      person.x = 790 + (i - (winners.length - 1) / 2) * gapBetween;
      person.y = railAt(person.x) + 16;
      person.h = 158;
      Object.assign(person.node.style, { left: person.x + 'px', top: person.y - person.h + 'px', height: person.h + 'px' });
      person.img.src = sleepArt(person.student);
      person.node.classList.add('is-asleep', 'is-last');
    });
    await acting.beat(1150);
    phase('spotlight');
    spot(winners);
    for (const person of winners) {
      person.node.classList.add('is-spot');
      const zz = el('span', 'do-zz');
      zz.innerHTML = '<i>z</i><i>z</i><i>Z</i>';
      person.node.append(zz);
    }
    sound('snore');
    await acting.beat(800);
    log(winners.map(person => person.short).join(', ') + (solo ? ' vẫn còn ngủ trên đò!' : ' còn ngủ quên trên đò!'));
    posePilot('call');
    pilotSays(solo ? winners[0].short + ' ơi, tới bờ rồi con!' : 'Các con ơi, tới bờ rồi!');
    sound('call');
    await acting.beat(1500);
    for (const person of winners) {
      person.img.src = walkArt(person.student);
      person.node.classList.remove('is-asleep');
      person.node.classList.add('is-awake');
      person.node.querySelector('.do-zz')?.remove();
      focus(person.student, 'is-pointed');
    }
    hush('pilot');
    posePilot('giggle');
    bubble('wake', solo ? 'Dạ… em dậy rồi ạ!' : 'Dạ… chúng em dậy rồi ạ!', () => {
      const person = winners[Math.floor(winners.length / 2)];
      return { x: person.x + boatShift(), y: person.y - 252 }; // cao hơn bảng tên của bạn vừa thức dậy
    }, 'is-gold');
    status(batch.map(student => student.name).join(', ') + ' còn ở lại trên đò!');
    sound('giggle');
    await acting.beat(1750);
    playing = false;
    pilotButton.disabled = false;
    scene.dataset.crowd = String(everyone);
  }

  function spot(winners) {
    const xs = winners.map(person => person.x + boatShift());
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = winners.reduce((sum, person) => sum + person.y - person.h * .75, 0) / winners.length;
    const reach = Math.max(150, (Math.max(...xs) - Math.min(...xs)) / 2 + 130);
    dim.style.setProperty('--eye-x', view.x + cx * view.s + 'px');
    dim.style.setProperty('--eye-y', view.y + cy * view.s + 'px');
    dim.style.setProperty('--eye-r', reach * view.s + 'px');
    scene.classList.add('is-spotlit');
  }

  const observer = new ResizeObserver(() => {
    layout();
    const lit = [...people.values()].filter(person => person.node.classList.contains('is-spot'));
    if (lit.length) spot(lit);
  });
  observer.observe(scene);
  reset();
  frame = requestAnimationFrame(render);

  return {
    reset,
    play,
    celebrate() { scene.dataset.phase = 'reveal'; clearTimers(); hushAll(); },
    resultText(batch) {
      const total = roster().length, others = total - batch.length;
      return {
        eyebrow: 'CẬP BẾN TRI THỨC',
        heading: batch.length > 1 ? 'Những hành khách cuối cùng' : 'Hành khách cuối cùng',
        caption: title() + ' đã đưa ' + (batch.length > 1 ? 'các em' : 'em') + ' sang tận bờ. Mời ' + (batch.length > 1 ? 'các em' : 'em') + ' lên bảng nhé!',
        note: others > 0 ? 'Cả ' + others + ' bạn đã lên bờ, chỉ còn ' + (batch.length > 1 ? 'các em' : 'em') + ' ngủ quên trên đò.' : '',
        again: 'Chuyến đò mới',
        typed: true,
        portrait: sitArt
      };
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      clearTimers();
      observer.disconnect();
      tools.remove();
      scene.remove();
    }
  };
}
