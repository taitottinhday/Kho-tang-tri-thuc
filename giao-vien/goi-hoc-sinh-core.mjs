const DIACRITICS = /[\u0300-\u036f]/g;

export function normalizeName(value) {
  return String(value ?? '').trim().normalize('NFC').toLocaleLowerCase('vi')
    .normalize('NFD').replace(DIACRITICS, '').replace(/đ/g, 'd').replace(/\s+/g, ' ');
}

export function parseNames(value) {
  const rows = String(value ?? '').split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  const seen = new Map();
  return rows.map(name => {
    const key = normalizeName(name);
    const occurrence = (seen.get(key) || 0) + 1;
    seen.set(key, occurrence);
    return { name, key, occurrence };
  });
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRoster(girls = [], boys = []) {
  const mapNames = (list, group) => list.map(item => {
    const entry = typeof item === 'string' ? { name: item, key: normalizeName(item), occurrence: 1 } : item;
    const id = group + ':' + encodeURIComponent(entry.key) + ':' + entry.occurrence;
    const hash = stableHash(id + '|' + entry.key);
    return {
      id, name: entry.name, group,
      palette: hash % 8,
      badge: hash % 5,
      signature: hash,
      caseCode: 1000 + (hash % 8999),
      initials: Array.from(entry.name)[0] || '?'
    };
  });
  const girlRows = mapNames(girls, 'nu');
  const boyRows = mapNames(boys, 'nam');
  return { girls: girlRows, boys: boyRows, all: girlRows.concat(boyRows) };
}

export function secureIndex(length, random = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto)) {
  if (length <= 1) return 0;
  if (random) {
    const limit = 0x100000000 - (0x100000000 % length);
    const sample = new Uint32Array(1);
    do { random(sample); } while (sample[0] >= limit);
    return sample[0] % length;
  }
  return Math.floor(Math.random() * length);
}

export function secureShuffle(values, random = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto)) {
  const out = values.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureIndex(i + 1, random);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newDailyState(dateKey) {
  return { date: dateKey, round: { girls: [], boys: [], all: [] }, history: [] };
}

export function normalizeDailyState(value, dateKey) {
  if (!value || value.date !== dateKey) return newDailyState(dateKey);
  const state = newDailyState(dateKey);
  for (const scope of ['girls', 'boys', 'all']) {
    if (Array.isArray(value.round?.[scope])) state.round[scope] = value.round[scope].map(String);
  }
  if (Array.isArray(value.history)) {
    state.history = value.history.filter(item => item && item.id != null && item.name)
      .slice(-300).map(item => ({ ...item, id: String(item.id) }));
  }
  return state;
}

export function selectBatch(roster, count, scope, state, randomIndex = secureIndex) {
  const pool = Array.isArray(roster) ? roster : [];
  if (!pool.length) return [];
  const requested = Math.max(1, Math.min(3, Number(count) || 1));
  state.round ||= { girls: [], boys: [], all: [] };
  // Keep IDs from the full class even when a gender-specific game passes only a subset.
  state.round[scope] = Array.isArray(state.round[scope]) ? state.round[scope].map(String) : [];
  const selected = [];
  const inBatch = new Set();
  const called = new Set(state.round[scope]);
  const eligible = pool.filter(student => !called.has(student.id));
  for (let i = 0; i < Math.min(requested, eligible.length); i++) {
    const options = eligible.filter(student => !inBatch.has(student.id));
    if (!options.length) break;
    const student = options[randomIndex(options.length)];
    selected.push(student);
    inBatch.add(student.id);
    state.round[scope].push(student.id);
  }
  return selected;
}

export function recordBatch(state, students, game, timestamp = Date.now()) {
  for (const student of students) {
    state.history.push({ id: student.id, name: student.name, game, at: timestamp });
  }
  state.history = state.history.slice(-300);
  return state;
}

function fileName(student) { return normalizeName(student.name); }
function firstLetter(student) { return Array.from(fileName(student))[0] || ''; }
function lastLetter(student) { return Array.from(fileName(student)).filter(ch => /[a-z]/.test(ch)).at(-1) || ''; }
function letters(student) { return new Set(Array.from(fileName(student)).filter(ch => /[a-z]/.test(ch))); }
function wordCount(student) { return String(student.name).trim().split(/\s+/).filter(Boolean).length; }
function normalizedLength(student) { return Array.from(fileName(student)).filter(ch => /[a-z0-9]/.test(ch)).length; }

export function buildDetectiveClues(roster, target, randomIndex = secureIndex, maxClues = 5) {
  let remaining = roster.slice();
  const clues = [];
  const used = new Set();
  const targetLetters = letters(target);
  const targetLength = normalizedLength(target);
  const targetWords = wordCount(target);
  const targetStart = firstLetter(target);
  const targetEnd = lastLetter(target);
  const badgeNames = ['màu ngọc bích', 'màu hổ phách', 'màu hoa đào', 'màu mây bạc', 'màu lam'];

  function optionsFor(candidates) {
    const options = [];
    const add = (key, text, predicate) => {
      if (used.has(key)) return;
      const next = candidates.filter(predicate);
      if (next.some(student => student.id === target.id) && next.length < candidates.length) {
        options.push({ key, text, next });
      }
    };
    const initials = [...new Set(candidates.map(firstLetter).filter(Boolean))];
    initials.filter(letter => letter !== targetStart).forEach(letter => {
      add('initial-not-' + letter, 'Tên của nghi phạm không bắt đầu bằng chữ ' + letter.toLocaleUpperCase('vi') + '.', student => firstLetter(student) !== letter);
    });
    const candidateLetters = new Set(candidates.flatMap(student => [...letters(student)]));
    [...candidateLetters].filter(letter => !targetLetters.has(letter)).forEach(letter => {
      add('lacks-' + letter, 'Tên của nghi phạm không có chữ “' + letter + '”.', student => !letters(student).has(letter));
    });
    [...targetLetters].forEach(letter => {
      add('has-' + letter, 'Trong tên có chữ “' + letter + '”.', student => letters(student).has(letter));
    });
    if (targetLength > 1) {
      add('length-short-' + targetLength, 'Tên có không quá ' + targetLength + ' chữ cái.', student => normalizedLength(student) <= targetLength);
    }
    if (targetLength < 30) {
      add('length-long-' + targetLength, 'Tên có từ ' + targetLength + ' chữ cái trở lên.', student => normalizedLength(student) >= targetLength);
    }
    add('words-' + targetWords, 'Họ tên có ' + targetWords + ' tiếng.', student => wordCount(student) === targetWords);
    if (targetEnd) add('end-' + targetEnd, 'Tên kết thúc bằng chữ ' + targetEnd.toLocaleUpperCase('vi') + '.', student => lastLetter(student) === targetEnd);

    // A deterministic case-file seal is derived from the name and its roster identity.
    // It provides a truthful backup clue for short or repeated names.
    const targetBadge = target.badge ?? (target.signature ?? stableHash(target.id)) % badgeNames.length;
    const badges = new Set(candidates.map(student => (student.badge ?? (student.signature ?? stableHash(student.id)) % badgeNames.length)));
    for (const badge of badges) {
      if (badge === targetBadge) continue;
      add('badge-not-' + badge, 'Hồ sơ không mang con dấu ' + badgeNames[badge] + '.', student => (student.badge ?? (student.signature ?? stableHash(student.id)) % badgeNames.length) !== badge);
    }
    for (const student of candidates) {
      if (student.id === target.id) continue;
      const code = student.caseCode ?? (1000 + ((student.signature ?? stableHash(student.id)) % 8999));
      add('case-code-not-' + code, 'Mã hồ sơ không phải ' + code + '.', item => (item.caseCode ?? (1000 + ((item.signature ?? stableHash(item.id)) % 8999))) !== code);
    }
    return options;
  }

  const desired = Math.max(3, Math.min(5, Number(maxClues) || 5));
  while (clues.length < desired && remaining.length > 1) {
    const options = optionsFor(remaining);
    if (!options.length) break;
    const keepAtLeast = clues.length < 2 ? 3 : clues.length < desired - 1 ? 2 : 1;
    const safe = options.filter(option => option.next.length >= keepAtLeast);
    const choicePool = safe.length ? safe : options;
    const choice = choicePool[randomIndex(choicePool.length)];
    used.add(choice.key);
    clues.push({ text: choice.text, remaining: choice.next.slice(), removed: remaining.filter(student => !choice.next.some(next => next.id === student.id)).map(student => student.id) });
    remaining = choice.next;
  }
  return { clues, finalCandidates: remaining, targetIncluded: remaining.some(student => student.id === target.id) };
}

