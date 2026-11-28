// “Đại úy Vịt triệu tập”: cả lớp là một xóm nhỏ, Đại úy Vịt chạy xe máy đi gõ cửa từng nhà.
// Tên được chọn đã có sẵn trước khi diễn; nhầm nhà chỉ là phần diễn cho hồi hộp.
import { el, sprite, preload, clamp, pick, shortNames, sortByGivenName, director, smooth } from './caller-kit.mjs';

const ART = '../assets/caller-vit/';
const art = name => ART + name + '.webp';
const CELL = 190, LAWN = 180, ROAD = 94, TOP = 132, BOTTOM = 112, EDGE = 104, VROAD = 96;
const ARTWORK = ['duck-ride-side', 'duck-ride-front', 'duck-ride-back', 'duck-bike-parked', 'duck-walk', 'duck-knock', 'duck-proud', 'duck-paper',
  'girl-hello', 'girl-hide', 'girl-cry', 'boy-hello', 'boy-hide', 'boy-cry', 'tree', ...Array.from({ length: 9 }, (_, i) => 'house-' + (i + 1))];
/* chiều cao từng dáng của vịt, tính theo đơn vị bản đồ */
const POSE = { 'ride-side': 102, 'ride-front': 102, 'ride-back': 103, walk: 88, knock: 92, proud: 96, paper: 98 };
const kidArt = (student, mood) => art((student?.group === 'nam' ? 'boy-' : 'girl-') + mood);

export function createDuckVillage(host, { sound, roster }) {
  preload(ARTWORK.map(art));
  const scene = el('div', 'journey-scene vit-scene');
  scene.dataset.phase = 'idle';
  const world = el('div', 'vit-world');
  const shade = el('div', 'vit-shade');
  const hud = el('div', 'vit-hud');
  scene.append(world, shade, hud);
  host.querySelector('.caller-cinema-setpiece').append(scene);

  let map = { width: 0, height: 0, cols: 1, rows: 1, houses: [] };
  let duck, duckImg, bike;
  const at = { x: 0, y: 0 };
  const camera = { x: 0, y: 0, z: .4 };
  let shot = { kind: 'overview' };
  const tags = new Map();
  let frame = 0, last = 0, alive = true;
  const still = matchMedia('(prefers-reduced-motion: reduce)');

  const roadY = row => TOP + row * (LAWN + ROAD) + LAWN + ROAD / 2;
  const leftX = () => EDGE + VROAD / 2;
  const rightX = () => map.width - EDGE - VROAD / 2;

  /* ---------- dựng bản đồ ---------- */
  function block(className, x, y, w, h) {
    const node = el('div', className);
    Object.assign(node.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    world.append(node);
    return node;
  }
  function tree(x, y, size) {
    const node = sprite(art('tree'), 'vit-tree');
    Object.assign(node.style, { left: x + 'px', top: y + 'px', width: size + 'px', zIndex: Math.round(y) });
    world.append(node);
  }
  function build() {
    const students = sortByGivenName(roster());
    const names = shortNames(students);
    const count = Math.max(students.length, 1);
    const cols = clamp(Math.ceil(Math.sqrt(count * 2.4)), 6, 12);
    const rows = Math.max(3, Math.ceil(count / cols));
    const width = (EDGE + VROAD) * 2 + cols * CELL;
    const height = TOP + rows * (LAWN + ROAD) + BOTTOM;
    map = { width, height, cols, rows, houses: [] };
    world.replaceChildren();
    tags.clear();
    hud.replaceChildren();
    world.style.width = width + 'px';
    world.style.height = height + 'px';

    const inner = width - EDGE * 2;
    for (let row = 0; row < rows; row++) {
      const top = TOP + row * (LAWN + ROAD);
      block('vit-walk', EDGE + VROAD, top + LAWN - 24, cols * CELL, 24);
      block('vit-road is-flat', EDGE, top + LAWN, inner, ROAD);
    }
    const roadTop = TOP - 34;
    const roadHeight = roadY(rows - 1) + ROAD / 2 - roadTop;
    block('vit-road is-tall', EDGE, roadTop, VROAD, roadHeight);
    block('vit-road is-tall', width - EDGE - VROAD, roadTop, VROAD, roadHeight);

    for (let x = EDGE + VROAD + 70; x < width - EDGE - VROAD - 30; x += 150) tree(x, TOP - 52 - (x % 3) * 6, 74);
    for (let x = 90; x < width - 60; x += 170) tree(x, height - 8 - (x % 4) * 5, 80);
    for (let y = TOP + 40; y < height - BOTTOM; y += 128) { tree(46, y, 72); tree(width - 46, y + 50, 72); }

    for (let slot = 0; slot < rows * cols; slot++) {
      const row = Math.floor(slot / cols), col = slot % cols;
      const x = EDGE + VROAD + col * CELL + CELL / 2;
      const bottom = TOP + row * (LAWN + ROAD) + LAWN - 16;
      const student = students[slot];
      if (!student) { tree(x, bottom, 96); map.houses.push(null); continue; }
      const house = el('div', 'vit-house');
      Object.assign(house.style, { left: x + 'px', top: bottom + 'px', zIndex: Math.round(bottom) });
      const door = el('div', 'vit-door');
      door.append(el('i', 'vit-leaf'));
      const sign = el('span', 'vit-sign' + (names.get(student.id).length > 9 ? ' is-long' : ''), names.get(student.id));
      sign.title = student.name;
      const style = ((slot * 4 + row * 2) % 9) + 1;
      const shift = style === 8 ? 19 : 0; // nhà kính có cửa lệch sang phải
      house.style.setProperty('--door-x', `calc(50% + ${shift}px)`);
      house.append(sprite(art('house-' + style), 'vit-house-art'), door, sign);
      world.append(house);
      map.houses.push({ student, slot, row, col, x, door: x + shift, bottom, node: house, short: names.get(student.id) });
    }

    bike = sprite(art('duck-bike-parked'), 'vit-bike');
    bike.hidden = true;
    duck = el('div', 'vit-duck');
    duckImg = sprite(art('duck-ride-side'), '');
    duck.append(duckImg);
    world.append(bike, duck);
    pose('ride-side');
    place(leftX() + 30, roadY(0) + 8);
  }

  function pose(name, flip = false) {
    const src = art('duck-' + name);
    if (!duckImg.src.endsWith(src.slice(2))) duckImg.src = src;
    duckImg.style.height = POSE[name] + 'px';
    duck.dataset.pose = name;
    duck.classList.toggle('is-flipped', flip);
  }
  function place(x, y) {
    at.x = x; at.y = y;
    duck.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
    duck.style.zIndex = Math.round(y);
  }

  /* ---------- máy quay ---------- */
  function zoomOf(kind, vw, vh) {
    const fit = Math.min(vw / map.width, vh / map.height);
    if (kind === 'overview') return fit;
    if (kind === 'close') return Math.min(vw / (CELL * 2.2), vh / (LAWN * 1.75));
    const follow = Math.min(vw / (CELL * 3), Math.max(vw / (CELL * 5.3), vh / ((LAWN + ROAD) * 2.1)));
    return Math.max(follow, fit * 1.3);
  }
  function aim(vw, vh) {
    const z = zoomOf(shot.kind, vw, vh) * (shot.boost || 1);
    let x = map.width / 2, y = map.height / 2;
    if (shot.kind === 'follow') { x = at.x; y = at.y - 46; }
    else if (shot.kind === 'close') { x = shot.x; y = shot.y; }
    const halfW = vw / (2 * z), halfH = vh / (2 * z);
    x = map.width > halfW * 2 ? clamp(x, halfW, map.width - halfW) : map.width / 2;
    y = map.height > halfH * 2 ? clamp(y, halfH, map.height - halfH) : map.height / 2;
    return { x, y, z };
  }
  const toScreen = (x, y) => ({
    x: scene.clientWidth / 2 + (x - camera.x) * camera.z,
    y: scene.clientHeight / 2 + (y - camera.y) * camera.z
  });
  function render(now) {
    if (!alive) return;
    frame = requestAnimationFrame(render);
    const dt = Math.min(.1, (now - last) / 1000 || .016);
    last = now;
    const vw = scene.clientWidth, vh = scene.clientHeight;
    if (!vw || !vh) return;
    const goal = aim(vw, vh);
    const ease = shot.snap || still.matches ? 1 : 1 - Math.exp(-dt * (shot.kind === 'follow' ? 4.6 : 3.2)); // giảm chuyển động: không lia máy
    shot.snap = false;
    camera.z += (goal.z - camera.z) * ease;
    camera.x += (goal.x - camera.x) * ease;
    camera.y += (goal.y - camera.y) * ease;
    world.style.transform = `translate(${vw / 2 - camera.x * camera.z}px,${vh / 2 - camera.y * camera.z}px) scale(${camera.z})`;
    if (shot.kind === 'close') {
      const eye = toScreen(shot.x, shot.y + 26);
      shade.style.setProperty('--eye-x', eye.x + 'px');
      shade.style.setProperty('--eye-y', eye.y + 'px');
    }
    for (const tag of tags.values()) {
      const point = tag.anchor();
      const screen = toScreen(point.x, point.y);
      const half = tag.node.offsetWidth / 2;
      tag.node.style.left = clamp(screen.x, half + 6, Math.max(half + 6, vw - half - 6)) + 'px';
      tag.node.style.top = clamp(screen.y, tag.node.offsetHeight + 46, vh - 6) + 'px'; // chừa dải trạng thái phía trên
    }
  }

  /* ---------- lời thoại & chữ to ---------- */
  function tag(key, className, text, anchor) {
    hush(key);
    const node = el('div', className, text);
    hud.append(node);
    tags.set(key, { node, anchor });
    return node;
  }
  function hush(...keys) {
    for (const key of keys) { tags.get(key)?.node.remove(); tags.delete(key); }
  }
  const duckSays = text => tag('duck', 'vit-bubble', text, () => ({ x: at.x, y: at.y - (POSE[duck.dataset.pose] || 96) - 6 }));
  const kidSays = (house, text) => tag('kid', 'vit-bubble is-kid', text, () => ({ x: house.door - 34, y: house.bottom - 94 }));
  const knockText = (house, text, big) => tag('knock', 'vit-knock' + (big ? ' is-big' : ''), text, () => ({ x: house.door, y: house.bottom - 108 }));

  /* ---------- hành động ---------- */
  function puff(x, y) {
    const node = el('i', 'vit-puff');
    Object.assign(node.style, { left: x + 'px', top: y + 'px', zIndex: Math.round(y) - 1 });
    node.addEventListener('animationend', () => node.remove());
    world.append(node);
  }

  async function ride(points, stage) {
    const path = [{ x: at.x, y: at.y }, ...points].filter((p, i, all) => !i || Math.hypot(p.x - all[i - 1].x, p.y - all[i - 1].y) > 1);
    if (path.length < 2) return;
    const lengths = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
    const total = lengths.reduce((a, b) => a + b, 0);
    let travelled = -1, puffAt = 0, engineAt = 0;
    await stage.tween(clamp(total / .6, 900, 6800), k => {
      const eased = k < .12 ? smooth(k / .12) * .09 : k > .86 ? .91 + smooth((k - .86) / .14) * .09 : .09 + (k - .12) / .74 * .82;
      let distance = eased * total, i = 0;
      while (i < lengths.length - 1 && distance > lengths[i]) distance -= lengths[i++];
      const from = path[i], to = path[i + 1], part = lengths[i] ? distance / lengths[i] : 1;
      const dx = to.x - from.x, dy = to.y - from.y;
      if (Math.abs(dx) >= Math.abs(dy)) pose('ride-side', dx < 0);
      else pose(dy > 0 ? 'ride-front' : 'ride-back');
      place(from.x + dx * part, from.y + dy * part);
      const now = performance.now();
      if (eased - travelled > 0 && now > puffAt && Math.abs(dx) >= Math.abs(dy)) {
        puff(at.x - Math.sign(dx) * 52, at.y - 14);
        puffAt = now + 90;
      }
      if (now > engineAt) { sound('bikeEngine'); engineAt = now + 420; }
      travelled = eased;
    });
  }

  /* Đường đi trên phố: cùng một con đường thì chạy thẳng, khác đường thì vòng qua đường dọc hai đầu phố. */
  function route(house, { tour = false } = {}) {
    const goalY = roadY(house.row) - 6;
    const goalX = house.x + 8;
    const rowNow = clamp(Math.round((at.y - roadY(0)) / (LAWN + ROAD)), 0, map.rows - 1);
    const yNow = roadY(rowNow) + 4;
    const points = [];
    if (tour) {
      const far = [...Array(map.rows).keys()].sort((a, b) => (Math.abs(b - rowNow) + Math.abs(b - house.row)) - (Math.abs(a - rowNow) + Math.abs(a - house.row)))[0];
      if (far !== rowNow && far !== house.row) {
        points.push({ x: rightX(), y: yNow }, { x: rightX(), y: roadY(far) }, { x: leftX(), y: roadY(far) }, { x: leftX(), y: goalY });
      }
    }
    if (!points.length && house.row !== rowNow) {
      const side = (at.x - leftX()) + (goalX - leftX()) < (rightX() - at.x) + (rightX() - goalX) ? leftX() : rightX();
      points.push({ x: side, y: yNow }, { x: side, y: goalY });
    }
    points.push({ x: goalX, y: goalY });
    return points;
  }

  async function walkTo(x, y, stage, ms = 760, name = 'walk') {
    const from = { x: at.x, y: at.y };
    pose(name, x < from.x - 4);
    let stepAt = 0;
    await stage.tween(ms, k => {
      place(from.x + (x - from.x) * smooth(k), from.y + (y - from.y) * smooth(k));
      duck.style.setProperty('--hop', (-Math.abs(Math.sin(k * Math.PI * 4)) * 6) + 'px');
      if (performance.now() > stepAt && k < .9) { sound('step', { surface: 'office', strength: .35 }); stepAt = performance.now() + 230; }
    });
    duck.style.setProperty('--hop', '0px');
  }

  async function dismount(house, stage) {
    sound('brake');
    for (let i = 0; i < 4; i++) puff(at.x - 40 + i * 14, at.y - 6 - (i % 2) * 14);
    await stage.beat(380);
    Object.assign(bike.style, { left: at.x + 'px', top: at.y + 'px', zIndex: Math.round(at.y) - 2 });
    bike.hidden = false;
    pose('walk', true);
    await walkTo(house.door + 40, house.bottom + 14, stage, 820);
  }
  async function remount(stage) {
    const x = parseFloat(bike.style.left), y = parseFloat(bike.style.top);
    await walkTo(x, y, stage, 700);
    bike.hidden = true;
    pose('ride-side');
    sound('bikeBell', { strength: .7 });
  }

  function kidAt(house, mood) {
    let kid = house.node.querySelector('.vit-kid');
    if (!kid) { kid = sprite(kidArt(house.student, mood), 'vit-kid'); house.node.append(kid); }
    kid.src = kidArt(house.student, mood);
    kid.dataset.mood = mood;
    return kid;
  }
  const openDoor = house => { house.node.classList.add('is-open'); sound('doorOpen'); };
  function closeDoor(house) {
    house.node.classList.remove('is-open');
    house.node.querySelector('.vit-kid')?.remove();
  }
  function confetti(house) {
    const origin = toScreen(house.x, house.bottom - 110);
    const burst = el('div', 'vit-burst');
    Object.assign(burst.style, { left: origin.x + 'px', top: origin.y + 'px' });
    const colors = ['#ff5d73', '#ffd23f', '#3ec1d3', '#8e6cef', '#63d471', '#ff9f1c'];
    for (let i = 0; i < 40; i++) {
      const bit = el('i');
      const angle = Math.random() * Math.PI * 2, power = 50 + Math.random() * 150;
      bit.style.cssText = `--dx:${Math.cos(angle) * power}px;--dy:${Math.sin(angle) * power - 60}px;--spin:${Math.random() * 720 - 360}deg;background:${colors[i % colors.length]};animation-delay:${Math.random() * .12}s`;
      burst.append(bit);
    }
    hud.append(burst);
    setTimeout(() => burst.remove(), 2400);
  }

  /* Cú gõ nhầm số 1: cửa mở, bạn trong nhà xin tha, vịt nhận ra nhầm nhà. */
  async function wrongDoor(house, stage, focus, status) {
    focus(house.student, 'is-candidate');
    status('Đại úy Vịt đang gõ cửa…');
    pose('knock');
    knockText(house, 'CỐC CỐC!');
    sound('doorKnock');
    await stage.beat(1100);
    hush('knock');
    openDoor(house);
    kidAt(house, 'hide');
    kidSays(house, pick(['Đừng gọi con…', 'Đừng gọi con…', 'Không phải con đâu ạ!', 'Con đang ôn bài mà…']));
    await stage.beat(1250);
    hush('kid');
    pose('proud');
    duckSays(pick(['Ơ… nhầm nhà rồi!', 'Ơ… nhầm nhà rồi!', 'Ủa, chưa phải nhà này!']));
    sound('oops');
    await stage.beat(1350);
    closeDoor(house);
    hush('duck');
    await remount(stage);
    focus(null);
  }

  /* Cú ngập ngừng số 2: đứng trước nhà hàng xóm rồi đi bộ sang đúng nhà. */
  async function nextDoor(near, target, stage, status) {
    status('Đại úy Vịt đang xem lại địa chỉ…');
    pose('walk', true);
    duckSays('Hừm… nhà này à?');
    sound('hmm');
    await stage.beat(1500);
    near.node.classList.add('is-sweating');
    duckSays('À… hình như nhà bên kia.');
    await stage.beat(1200);
    shot = { kind: 'follow', boost: 1.18 };
    const walk = walkTo(target.door + 42, target.bottom + 14, stage, 1700);
    target.node.classList.add('is-sweating');
    await walk;
    hush('duck');
    near.node.classList.remove('is-sweating');
  }

  /* Đúng nhà: tối xung quanh, gõ ba tiếng, cửa mở, trao giấy triệu tập. */
  async function summon(house, stage, focus, status, first) {
    shot = { kind: 'close', x: house.door + 6, y: house.bottom - 70 };
    scene.dataset.phase = 'spotlight';
    house.node.classList.add('is-target');
    house.node.classList.remove('is-sweating');
    await walkTo(house.door + 4, house.bottom + 18, stage, 420, 'knock');
    pose('knock');
    status('Cả xóm nín thở…');
    knockText(house, 'CỐC CỐC CỐC!', true);
    sound('doorKnock');
    await stage.beat(820);
    sound('doorKnock', { strength: 1.2 });
    await stage.beat(first ? 960 : 600);
    hush('knock');
    sound('heartbeat');
    await stage.beat(first ? 1100 : 500);
    openDoor(house);
    await walkTo(house.door + 60, house.bottom + 16, stage, 480, 'walk');
    pose('proud');
    kidAt(house, 'hello');
    focus(house.student, 'is-pointed');
    status(house.student.name + ' ra mở cửa rồi!');
    kidSays(house, 'Dạ… em đây ạ…');
    await stage.beat(1450);
    kidAt(house, 'hide');
    sound('gulp');
    await stage.beat(first ? 1150 : 800);
    hush('kid');
    pose('paper');
    duckSays('Có giấy triệu tập!');
    sound('paper');
    await stage.beat(650);
    kidAt(house, 'cry');
    house.node.classList.add('is-delivered');
    sound('cry');
    sound('chime');
    confetti(house);
    await stage.beat(2100);
  }

  function reset() {
    scene.dataset.phase = 'idle';
    shot = { kind: 'overview', snap: true };
    build();
  }

  async function play(batch, decoys, { pace, wait, focus, status }) {
    const stage = director({ pace, wait });
    reset();
    const byId = new Map(map.houses.filter(Boolean).map(house => [house.student.id, house]));
    const targets = batch.map(student => byId.get(student.id)).filter(Boolean);
    if (!targets.length) return;
    const chosen = new Set(batch.map(student => student.id));
    const free = house => house && !chosen.has(house.student.id);
    const first = targets[0];
    const neighbours = [first.slot - 1, first.slot + 1].map(slot => map.houses[slot]).filter(house => free(house) && house.row === first.row);
    const near = neighbours.length ? pick(neighbours) : null;
    const others = decoys.map(student => byId.get(student.id)).filter(house => free(house) && house !== near);
    const early = others.find(house => Math.abs(house.slot - first.slot) > 2) || others[0];

    scene.dataset.phase = 'riding';
    status('Đại úy Vịt xuất phát!');
    duckSays('Tuýt tuýt! Kiểm tra bài cũ đây!');
    sound('whistle');
    await stage.beat(2100);
    shot = { kind: 'follow' };
    await stage.beat(800);
    hush('duck');

    if (early) {
      await ride(route(early), stage);
      await dismount(early, stage);
      await wrongDoor(early, stage, focus, status);
    }
    if (near) {
      status('Đại úy Vịt đang đi tuần quanh xóm…');
      await ride(route(near, { tour: true }), stage);
      await dismount(near, stage);
      await nextDoor(near, first, stage, status);
    } else {
      await ride(route(first, { tour: true }), stage);
      await dismount(first, stage);
    }
    await summon(first, stage, focus, status, true);

    for (const house of targets.slice(1)) {
      hush('duck', 'kid');
      scene.dataset.phase = 'riding';
      shot = { kind: 'follow' };
      status('Còn một giấy triệu tập nữa!');
      await remount(stage);
      await ride(route(house), stage);
      await dismount(house, stage);
      await summon(house, stage, focus, status, false);
    }
  }

  const observer = new ResizeObserver(() => { shot.snap = true; });
  observer.observe(scene);
  reset();
  frame = requestAnimationFrame(render);

  return {
    reset,
    play,
    celebrate() { scene.dataset.phase = 'reveal'; hush('duck', 'kid', 'knock'); },
    resultText(batch) {
      return {
        eyebrow: 'ĐẠI ÚY VỊT · LỆNH TRIỆU TẬP',
        heading: 'GIẤY TRIỆU TẬP',
        caption: 'Lên bảng trả bài ngay!',
        again: 'Gọi tiếp',
        home: 'Về xóm',
        leave: 'stay',
        portrait: student => kidArt(student, 'hello')
      };
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.remove();
    }
  };
}
