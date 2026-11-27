'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { options: seasonOptions } = require('../season-options.js');

const MAX_DOC = 10 * 1024 * 1024;
const MAX_IMAGE = 300 * 1024;
const MAX_SYNC = 200 * 1024;
const TYPES = new Set(['choice', 'fill', 'picture', 'listen', 'order', 'sort']);
const DOC_TYPES = {
  '.pdf': ['application/pdf', 'inline'], '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'attachment'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'attachment'],
  '.png': ['image/png', 'inline'], '.jpg': ['image/jpeg', 'inline'], '.jpeg': ['image/jpeg', 'inline'],
  '.webp': ['image/webp', 'inline'], '.mp3': ['audio/mpeg', 'inline']
};
const id = () => 'q' + crypto.randomUUID();
const text = (v, max) => typeof v === 'string' ? v.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, max + 1) : '';
const goodTopic = value => typeof value === 'string' && /^[a-z0-9-]{1,40}$/.test(value);
const clampCount = n => Number.isFinite(Number(n)) ? Math.max(0, Math.min(100000000, Number(n))) : 0;

function validateQuestion(input) {
  const q = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const type = q.type || q.dang;
  const topic = q.topic || q.chu_de;
  const prompt = text(q.prompt ?? q.de_bai, 240), answer = text(q.answer ?? q.dap_an, 70);
  const note = text(q.note ?? q.giai_thich, 300);
  const grades = [...new Set((Array.isArray(q.grades) ? q.grades : String(q.lop ?? '').split('|')).map(Number))];
  const choices = (Array.isArray(q.choices) ? q.choices : String(q.lua_chon ?? '').split('|')).map(v => text(v, 70)).filter(Boolean);
  const image = typeof q.image === 'string' ? q.image : '';
  const alt = text(q.alt, 120);
  if (!TYPES.has(type)) throw Error('Dạng câu hỏi chưa hợp lệ.');
  if (!goodTopic(topic)) throw Error('Mã chủ đề cần gồm 1–40 kí tự a–z, 0–9 hoặc dấu gạch ngang.');
  if (!grades.length || grades.some(g => ![1, 2, 3].includes(g))) throw Error('Lớp cần là 1, 2 hoặc 3.');
  if (!prompt || prompt.length > 240 || !answer || answer.length > 70 || note.length > 300 || alt.length > 120) throw Error('Đề bài (tối đa 240 kí tự), đáp án (70), giải thích (300) hoặc mô tả ảnh (120) chưa hợp lệ.');
  if (['choice', 'picture', 'sort'].includes(type) && (choices.length < 2 || choices.length > 4 || new Set(choices).size !== choices.length || !choices.includes(answer))) throw Error('Dạng này cần 2–4 lựa chọn khác nhau, có đáp án đúng.');
  if (type === 'fill') {
    const blanks = prompt.match(/_+/g) || [];
    if (blanks.length !== 1 || blanks[0] !== '___') throw Error('Câu điền chữ cần đúng một chỗ trống viết bằng ___.');
  }
  if (type === 'order') {
    const words = answer.split(/\s+/);
    if (words.length < 2 || words.length > 8 || new Set(words).size < 2) throw Error('Đáp án xếp tiếng cần 2–8 tiếng và có ít nhất hai tiếng khác nhau.');
  }
  if (image && image.startsWith('data:')) {
    const match = image.match(/^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw Error('Ảnh câu hỏi cần là WebP, PNG hoặc JPEG và không quá 300 KB.');
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length > MAX_IMAGE) throw Error('Ảnh câu hỏi cần là WebP, PNG hoặc JPEG và không quá 300 KB.');
    const signature = match[1] === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : match[1] === 'jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
    if (!signature) throw Error('Chữ ký ảnh không khớp với kiểu WebP, PNG hoặc JPEG đã khai báo.');
  } else if (type === 'picture' && !/^[0-9a-f]{4,8}$/i.test(image)) {
    throw Error('Câu nhìn tranh cần ảnh WebP, PNG, JPEG hoặc mã hình có sẵn.');
  }
  return { id: typeof q.id === 'string' && /^q[a-z0-9-]{8,50}$/i.test(q.id) ? q.id : id(), type, topic, grades, prompt, answer,
    choices, note, image: type === 'picture' ? image : '', alt, active: q.active !== false && q.published !== false,
    createdAt: q.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function parseCsv(source) {
  const csv = String(source || '').replace(/^\uFEFF/, '');
  const firstLine = csv.split(/\r?\n/, 1)[0] || '';
  let commas = 0, semis = 0, quoted = false;
  for (let i = 0; i < firstLine.length; i++) {
    if (firstLine[i] === '"' && firstLine[i + 1] === '"' && quoted) { i++; continue; }
    if (firstLine[i] === '"') quoted = !quoted;
    else if (!quoted && firstLine[i] === ',') commas++;
    else if (!quoted && firstLine[i] === ';') semis++;
  }
  const delimiter = semis > commas ? ';' : ',';
  const rows = []; let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"' && inQuotes && csv[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch === delimiter) { row.push(cell); cell = ''; }
    else if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && csv[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  row.push(cell); if (row.some(v => v.trim()) || !rows.length) rows.push(row);
  const headers = (rows.shift() || []).map(h => h.trim().toLowerCase());
  const required = ['dang', 'chu_de', 'lop', 'de_bai', 'dap_an', 'lua_chon', 'giai_thich', 'cong_bo'];
  if (required.some(h => !headers.includes(h))) throw Error('Thiếu cột. Mẫu cần: ' + required.join(', ') + '.');
  if (rows.length > 500) throw Error('Mỗi lần nhập tối đa 500 dòng.');
  return rows.map((values, i) => ({
    line: i + 2,
    question: Object.fromEntries(headers.map((h, n) => [h, (values[n] || '').trim()])),
  })).filter(r => Object.values(r.question).some(v => v));
}

function fromCsv(q) {
  const gradeValues = q.lop.split('|').map(v => Number(v.trim())).filter(Boolean);
  return { type: q.dang, topic: q.chu_de, grades: gradeValues, prompt: q.de_bai, answer: q.dap_an,
    choices: q.lua_chon ? q.lua_chon.split('|') : [], note: q.giai_thich, active: false };
}

function dataUrlBytes(value) {
  const m = String(value || '').match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw Error('Tệp tải lên chưa đúng định dạng.');
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > MAX_DOC) throw Error('Tệp tài liệu không được quá 10 MB.');
  return { mime: m[1].toLowerCase(), bytes: buffer };
}

function validateDocument(input) {
  const q = input || {};
  const name = text(q.name, 180), title = text(q.title || q.name, 180), grade = String(q.grade || 'chung');
  const topic = q.topic ? String(q.topic) : '';
  const note = text(q.note, 500), ext = path.extname(name).toLowerCase(), declared = DOC_TYPES[ext];
  if (!name || !title || !declared) throw Error('Chọn PDF, Word (.docx), PowerPoint (.pptx), ảnh PNG/JPG/WebP hoặc âm thanh MP3.');
  if (!['1', '2', '3', 'chung'].includes(grade)) throw Error('Lớp tài liệu cần là 1, 2, 3 hoặc chung.');
  if (topic && !goodTopic(topic)) throw Error('Mã chủ đề chưa hợp lệ.');
  const { bytes, mime } = dataUrlBytes(q.data);
  if (mime !== declared[0]) throw Error('Kiểu dữ liệu trong tệp không khớp với phần mở rộng đã khai báo.');
  let matches = false;
  if (ext === '.pdf') matches = bytes.subarray(0, 5).toString() === '%PDF-';
  else if (ext === '.png') matches = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  else if (ext === '.jpg' || ext === '.jpeg') matches = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  else if (ext === '.webp') matches = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  else if (ext === '.mp3') matches = bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  else if (ext === '.docx') matches = bytes.subarray(0, 4).toString('hex') === '504b0304' && bytes.includes(Buffer.from('word/document.xml')) && bytes.includes(Buffer.from([0x50,0x4b,0x05,0x06]));
  else if (ext === '.pptx') matches = bytes.subarray(0, 4).toString('hex') === '504b0304' && bytes.includes(Buffer.from('ppt/presentation.xml')) && bytes.includes(Buffer.from([0x50,0x4b,0x05,0x06]));
  if (!matches) throw Error('Nội dung tệp không khớp với phần mở rộng đã khai báo.');
  return { id: typeof q.id === 'string' && /^d[a-z0-9-]{8,50}$/i.test(q.id) ? q.id : 'd' + crypto.randomUUID(), name,
    title, grade, topic, note, mime: declared[0], disposition: declared[1], bytes, published: q.published === true };
}

const MAX_HISTORY = 3000;
const timeStamp = v => Number.isFinite(Number(v)) && Number(v) > 0 && Number(v) < 1e14 ? Math.round(Number(v)) : 0;
const entryKey = h => [h.at || 0, h.d, h.kind, h.topic, h.title, h.correct, h.total, h.assignmentId || ''].join('|');
/* Máy học sinh chỉ gửi 60 lượt gần nhất → máy chủ CỘNG DỒN để giữ trọn lịch sử cả học kỳ.
   Tìm phần gối nhau giữa danh sách mới (mới → cũ) và danh sách đã lưu; phần chưa có được thêm lên đầu. */
function mergeHistory(stored, incoming) {
  const old = Array.isArray(stored) ? stored : [], fresh = Array.isArray(incoming) ? incoming : [];
  if (!old.length) return fresh.slice(0, MAX_HISTORY);
  const have = new Map(); for (const h of old) have.set(entryKey(h), (have.get(entryKey(h)) || 0) + 1);
  const add = [];
  for (const h of fresh) { const k = entryKey(h), n = have.get(k) || 0; if (n > 0) have.set(k, n - 1); else add.push(h); }
  // lượt không có mốc giờ (bản cũ) trùng nội dung chỉ được tính một lần
  return add.concat(old).sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, MAX_HISTORY);
}
function mergeStudent(previous, incoming) {
  const latest = history => (history || []).reduce((max, h) => Math.max(max, h.at || 0), 0);
  const current = latest(previous?.history) > latest(incoming.history) ? previous : incoming;
  return { ...current, teacherNotes: previous?.teacherNotes || [], history: mergeHistory(previous?.history, incoming.history) };
}

/* ---- Giáo viên sửa nội dung 51 bài: ẩn câu, sửa câu, thêm câu (3 kiểu câu quen thuộc) ---- */
const cleanLine = (v, max) => text(v, max).slice(0, max);
function lessonItem(raw) {
  const q = raw && typeof raw === 'object' ? raw : {};
  if (q.loai === 'chon') {
    const de = cleanLine(q.de, 200), dapAn = cleanLine(q.dapAn, 40);
    const luaChon = [...new Set([dapAn].concat((Array.isArray(q.luaChon) ? q.luaChon : []).map(v => cleanLine(v, 40))).filter(Boolean))];
    if ((de.match(/___/g) || []).length !== 1) throw Error('Câu điền chỗ trống cần đúng một chỗ trống, viết bằng ba dấu gạch dưới ___ .');
    if (de.startsWith('___')) throw Error('Đừng để chỗ trống ở đầu câu (chữ viết hoa sẽ làm lộ đáp án).');
    if (!dapAn || luaChon.length < 2 || luaChon.length > 4) throw Error('Cần 1 đáp án đúng và từ 1 đến 3 đáp án sai khác nhau.');
    return { loai: 'chon', de, dapAn, luaChon };
  }
  if (q.loai === 'timLoi') {
    const cau = cleanLine(q.cau, 200), tuSai = cleanLine(q.tuSai, 30), tuDung = cleanLine(q.tuDung, 30);
    const n = cau.split(' ').filter(w => w.replace(/[.,!?;:"“”()…]/g, '') === tuSai).length;
    if (!cau || !tuSai || !tuDung) throw Error('Cần câu, chữ viết sai và chữ viết đúng.');
    if (n !== 1) throw Error('Chữ viết sai “' + tuSai + '” phải xuất hiện đúng 1 lần trong câu.');
    if (tuSai === tuDung) throw Error('Chữ viết đúng phải khác chữ viết sai.');
    return { loai: 'timLoi', cau, tuSai, tuDung };
  }
  if (q.loai === 'ngheViet') {
    const cau = cleanLine(q.cau, 160);
    if (cau.split(' ').length < 2) throw Error('Câu nghe – viết cần ít nhất 2 chữ.');
    return { loai: 'ngheViet', cau: /[.!?]$/.test(cau) ? cau : cau + '.' };
  }
  throw Error('Kiểu câu chưa hợp lệ.');
}
function lessonEdit(body) {
  const b = body && typeof body === 'object' ? body : {};
  const key = v => /^(\d{1,3}|gv-[a-z0-9]{4,24})$/.test(String(v));
  const hidden = [...new Set((Array.isArray(b.hidden) ? b.hidden : []).map(String).filter(key))].slice(0, 300);
  const edits = {};
  for (const [k, v] of Object.entries(b.edits || {}).slice(0, 300)) if (/^\d{1,3}$/.test(k)) edits[k] = lessonItem(v);
  const added = (Array.isArray(b.added) ? b.added : []).slice(0, 300).map(a => {
    if (!/^gv-[a-z0-9]{4,24}$/.test(String(a?.id))) throw Error('Mã câu thêm chưa hợp lệ.');
    return { id: a.id, ...lessonItem(a) };
  });
  return { hidden, edits, added, noGen: b.noGen === true };
}
const editIsEmpty = e => !e.hidden.length && !Object.keys(e.edits).length && !e.added.length && !e.noGen;
function assignmentInfo(body) {
  const topic = String(body?.topic || '');
  if (!goodTopic(topic)) throw Object.assign(Error('Chọn bài cần giao.'), { status: 400 });
  const due = /^\d{4}-\d{2}-\d{2}$/.test(String(body?.due || '')) ? String(body.due) : '';
  return { topic, due, note: cleanLine(body?.note, 200) };
}

function classInfo(body) {
  const grade = Number(body?.grade);
  return { name: text(body?.name, 40).slice(0, 40), grade: [1, 2, 3].includes(grade) ? grade : 0 };
}

function validateStudent(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw Error('Thiếu hồ sơ học sinh.');
  const name = text(profile.name, 40), grade = Number(profile.grade);
  if (!/^[\w-]{1,80}$/.test(String(profile.id || '')) || !name || ![1, 2, 3].includes(grade)) throw Error('Hồ sơ cần mã, tên và lớp 1–3 hợp lệ.');
  const topics = {};
  if (profile.topics && typeof profile.topics === 'object') for (const [key, v] of Object.entries(profile.topics).slice(0, 250)) {
    if (!goodTopic(key) || !v || typeof v !== 'object') continue;
    topics[key] = { stars: clampCount(v.stars), best: Math.max(0, Math.min(100, clampCount(v.best))), attempts: clampCount(v.attempts), correct: clampCount(v.correct), done: v.done === true };
  }
  const history = Array.isArray(profile.history) ? profile.history.slice(0, 60).map(h => ({ d: text(h?.d, 24), grade: Number(h?.grade) || grade,
    kind: text(h?.kind, 40), topic: goodTopic(h?.topic) ? h.topic : '', title: text(h?.title, 100), correct: clampCount(h?.correct),
    total: clampCount(h?.total), acc: Math.max(0, Math.min(100, clampCount(h?.acc))), at: timeStamp(h?.at),
    ...(/^a[0-9a-f]{12}$/.test(h?.assignmentId || '') ? { assignmentId: h.assignmentId } : {}) })) : [];
  const wrongLog = {};
  if (profile.wrongLog && typeof profile.wrongLog === 'object') for (const [key, value] of Object.entries(profile.wrongLog).slice(0, 50)) {
    if (key.length <= 140) wrongLog[key] = clampCount(value);
  }
  return { id: String(profile.id), name, grade, avatar: text(profile.avatar, 16), xp: clampCount(profile.xp), streak: clampCount(profile.streak),
    bestStreak: clampCount(profile.bestStreak), lastDay: text(profile.lastDay, 24), attempts: clampCount(profile.attempts), correct: clampCount(profile.correct),
    topics, history, wrongLog, teacherNotes: [] };
}

async function createStore(env = process.env, options = {}) {
  if (env.DATABASE_URL) {
    const { Pool } = require('pg');
    const host = new URL(env.DATABASE_URL).hostname;
    const pool = options.pool || new Pool({ connectionString: env.DATABASE_URL,
      ssl: host.endsWith('.railway.internal') || host === 'railway.internal' || host === '127.0.0.1' || host === 'localhost' || host === '::1' ? false : { rejectUnauthorized: false },
      max: 8, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
    await pool.query(`CREATE TABLE IF NOT EXISTS class_questions (id text PRIMARY KEY, body jsonb NOT NULL, published boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS class_documents (id text PRIMARY KEY, name text NOT NULL, title text NOT NULL, grade text NOT NULL, topic text NOT NULL DEFAULT '', note text NOT NULL DEFAULT '', mime text NOT NULL, disposition text NOT NULL, body bytea NOT NULL, published boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS class_codes (code char(6) PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
      ALTER TABLE class_codes ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
      ALTER TABLE class_codes ADD COLUMN IF NOT EXISTS grade int NOT NULL DEFAULT 0;
      CREATE TABLE IF NOT EXISTS app_data (key text PRIMARY KEY, body jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS class_students (class_code char(6) NOT NULL REFERENCES class_codes(code) ON DELETE CASCADE, profile_id text NOT NULL, body jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(class_code, profile_id));`);
    return pgStore(pool);
  }
  return fileStore(options.dataDir || env.DATA_DIR || path.join(__dirname, '..', '.data'));
}

function pgStore(pool) {
  return {
    kind: 'postgres',
    async listQuestions(all = false) { const r = await pool.query('SELECT body, published FROM class_questions WHERE ($1::boolean OR published) ORDER BY updated_at DESC', [all]); return r.rows.map(x => ({ ...x.body, active: x.published })); },
    async saveQuestions(rows) { for (const q of rows) await pool.query('INSERT INTO class_questions(id,body,published,updated_at) VALUES($1,$2::jsonb,$3,now()) ON CONFLICT(id) DO UPDATE SET body=$2::jsonb,published=$3,updated_at=now()', [q.id, JSON.stringify(q), q.active]); },
    async deleteQuestion(key) { const r = await pool.query('DELETE FROM class_questions WHERE id=$1', [key]); return r.rowCount > 0; },
    async publishDrafts() { const r = await pool.query('UPDATE class_questions SET published=true,body=jsonb_set(body,\'{active}\',\'true\'::jsonb),updated_at=now() WHERE published=false'); return r.rowCount; },
    async listDocs(all = false) { const r = await pool.query('SELECT id,name,title,grade,topic,note,mime,disposition,published,octet_length(body) AS size,created_at FROM class_documents WHERE ($1::boolean OR published) ORDER BY created_at DESC', [all]); return r.rows; },
    async getDoc(key) { const r = await pool.query('SELECT * FROM class_documents WHERE id=$1', [key]); if (!r.rowCount) return null; const d = r.rows[0]; return { ...d, bytes: Buffer.from(d.body) }; },
    async saveDoc(d) { await pool.query('INSERT INTO class_documents(id,name,title,grade,topic,note,mime,disposition,body,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [d.id,d.name,d.title,d.grade,d.topic,d.note,d.mime,d.disposition,d.bytes,d.published]); },
    async deleteDoc(key) { const r = await pool.query('DELETE FROM class_documents WHERE id=$1', [key]); return r.rowCount > 0; },
    async createClass(code, info = {}) { await pool.query('INSERT INTO class_codes(code,name,grade) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [code, info.name || '', info.grade || 0]); },
    async listClasses() { const r = await pool.query('SELECT code,name,grade,created_at FROM class_codes ORDER BY created_at'); return r.rows.map(x => ({ code: x.code.trim(), name: x.name, grade: x.grade, createdAt: x.created_at })); },
    async updateClass(code, info) { const r = await pool.query('UPDATE class_codes SET name=$2,grade=$3 WHERE code=$1', [code, info.name, info.grade]); return r.rowCount > 0; },
    async deleteClass(code) { const r = await pool.query('DELETE FROM class_codes WHERE code=$1', [code]); return r.rowCount > 0; },
    async setDocPublished(key, published) { const r = await pool.query('UPDATE class_documents SET published=$2 WHERE id=$1', [key, published]); return r.rowCount > 0; },
    async hasClass(code) { return (await pool.query('SELECT 1 FROM class_codes WHERE code=$1', [code])).rowCount > 0; },
    async getData(key) { const r = await pool.query('SELECT body FROM app_data WHERE key=$1', [key]); return r.rowCount ? r.rows[0].body : null; },
    async updateData(key, initial, update) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('INSERT INTO app_data(key,body) VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING', [key, JSON.stringify(initial)]);
        const { rows } = await client.query('SELECT body FROM app_data WHERE key=$1 FOR UPDATE', [key]);
        const value = update(rows[0].body);
        await client.query('UPDATE app_data SET body=$2::jsonb,updated_at=now() WHERE key=$1', [key, JSON.stringify(value)]);
        await client.query('COMMIT');
        return value;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally { client.release(); }
    },
    async setData(key, value) { await pool.query('INSERT INTO app_data(key,body,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET body=$2::jsonb,updated_at=now()', [key, JSON.stringify(value)]); },
    async upsertStudent(code, p) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('INSERT INTO class_students(class_code,profile_id,body) VALUES($1,$2,$3::jsonb) ON CONFLICT DO NOTHING', [code,p.id,JSON.stringify(p)]);
        const { rows } = await client.query('SELECT body FROM class_students WHERE class_code=$1 AND profile_id=$2 FOR UPDATE', [code,p.id]);
        const previous = rows[0].body;
        const merged = mergeStudent(previous, p);
        await client.query('UPDATE class_students SET body=$3::jsonb,updated_at=now() WHERE class_code=$1 AND profile_id=$2', [code,p.id,JSON.stringify(merged)]);
        await client.query('COMMIT');
        return merged.teacherNotes;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally { client.release(); }
    },
    async listStudents(code) { const r = await pool.query('SELECT class_code,profile_id,body,updated_at FROM class_students WHERE ($1::text IS NULL OR class_code=$1) ORDER BY class_code, body->>\'name\'', [code || null]); return r.rows.map(x => ({ classCode: x.class_code.trim(), ...x.body, updatedAt: x.updated_at })); },
    async addNote(code, profileId, note) { const r = await pool.query(`UPDATE class_students SET body=jsonb_set(body,'{teacherNotes}', ($3::jsonb || COALESCE(body->'teacherNotes','[]'::jsonb)) - 50),updated_at=now() WHERE class_code=$1 AND profile_id=$2 RETURNING body`, [code,profileId,JSON.stringify([note])]); return r.rows[0]?.body || null; },
    async deleteStudent(code, profileId) { const r = await pool.query('DELETE FROM class_students WHERE class_code=$1 AND profile_id=$2', [code,profileId]); return r.rowCount > 0; },
    async close() { await pool.end(); }
  };
}

function fileStore(directory) {
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, 'store.json');
  let data = { questions: [], docs: [], classes: [], students: [] };
  try { const saved = JSON.parse(fs.readFileSync(file, 'utf8')); data = { ...data, ...saved }; } catch {}
  let writes = Promise.resolve();
  const persist = () => { const snapshot = JSON.stringify(data); writes = writes.catch(() => {}).then(async () => { const tmp = file + '.tmp'; await fs.promises.writeFile(tmp, snapshot); await fs.promises.rename(tmp, file); }); return writes; };
  return {
    kind: 'file',
    async listQuestions(all = false) { return data.questions.filter(q => all || q.active).map(q => ({ ...q })); },
    async saveQuestions(rows) { for (const q of rows) { const i = data.questions.findIndex(x => x.id === q.id); if (i < 0) data.questions.unshift(q); else data.questions[i] = q; } await persist(); },
    async deleteQuestion(key) { const n = data.questions.length; data.questions = data.questions.filter(q => q.id !== key); await persist(); return n !== data.questions.length; },
    async publishDrafts() { let n = 0; data.questions.forEach(q => { if (!q.active) { q.active = true; n++; } }); await persist(); return n; },
    async listDocs(all = false) { return data.docs.filter(d => all || d.published).map(({ bytes, ...d }) => ({ ...d, size: Buffer.from(bytes, 'base64').length })); },
    async getDoc(key) { const d = data.docs.find(x => x.id === key); return d ? { ...d, bytes: Buffer.from(d.bytes, 'base64') } : null; },
    async saveDoc(d) { data.docs.unshift({ ...d, bytes: d.bytes.toString('base64') }); await persist(); },
    async deleteDoc(key) { const n = data.docs.length; data.docs = data.docs.filter(d => d.id !== key); await persist(); return n !== data.docs.length; },
    async createClass(code, info = {}) { if (!data.classes.includes(code)) { data.classes.push(code); data.classInfo = data.classInfo || {}; data.classInfo[code] = { name: info.name || '', grade: info.grade || 0, createdAt: new Date().toISOString() }; } await persist(); },
    async listClasses() { return data.classes.map(code => ({ code, name: '', grade: 0, ...(data.classInfo || {})[code] })); },
    async updateClass(code, info) { if (!data.classes.includes(code)) return false; data.classInfo = data.classInfo || {}; data.classInfo[code] = { ...data.classInfo[code], ...info }; await persist(); return true; },
    async deleteClass(code) { if (!data.classes.includes(code)) return false; data.classes = data.classes.filter(c => c !== code); if (data.classInfo) delete data.classInfo[code]; data.students = data.students.filter(s => s.classCode !== code); await persist(); return true; },
    async setDocPublished(key, published) { const d = data.docs.find(x => x.id === key); if (!d) return false; d.published = published; await persist(); return true; },
    async hasClass(code) { return data.classes.includes(code); },
    async getData(key) { const v = (data.kv || {})[key]; return v === undefined ? null : JSON.parse(JSON.stringify(v)); },
    async updateData(key, initial, update) {
      data.kv = data.kv || {};
      const value = update(JSON.parse(JSON.stringify(data.kv[key] ?? initial)));
      data.kv[key] = value;
      await persist();
      return value;
    },
    async setData(key, value) { data.kv = data.kv || {}; data.kv[key] = value; await persist(); },
    async upsertStudent(code, p) {
      const i = data.students.findIndex(x => x.classCode === code && x.id === p.id);
      const merged = { ...mergeStudent(data.students[i], p), classCode: code, updatedAt: new Date().toISOString() };
      if (i < 0) data.students.push(merged); else data.students[i] = merged;
      await persist();
      return merged.teacherNotes;
    },
    async listStudents(code) { return data.students.filter(s => !code || s.classCode === code).map(s => ({ ...s })); },
    async addNote(code, profileId, note) { const s = data.students.find(x => x.classCode === code && x.id === profileId); if (!s) return null; s.teacherNotes = [note, ...(s.teacherNotes || [])].slice(0,50); await persist(); return s; },
    async deleteStudent(code, profileId) { const n = data.students.length; data.students = data.students.filter(s => !(s.classCode === code && s.id === profileId)); await persist(); return n !== data.students.length; },
    async close() { await writes; }
  };
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0, rejected = false;
    req.on('data', chunk => { size += chunk.length; if (size > limit) { if (!rejected) reject(Object.assign(Error('Tệp hoặc dữ liệu vượt quá giới hạn cho phép.'), { status: 413 })); rejected = true; return; } if (!rejected) chunks.push(chunk); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function json(res, status, body) { const payload = Buffer.from(JSON.stringify(body)); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': payload.length, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(payload); }
function safeName(name) { return String(name).replace(/[\r\n"\\]/g, '_').replace(/[\x00-\x1f]/g, ''); }
function getIp(req) { const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').pop().trim(); return forwarded || req.socket.remoteAddress || 'unknown'; }

function createApiHandler(store, env = process.env) {
  const failed = new Map(), syncLimit = new Map();
  const secret = () => env.SESSION_SECRET || env.TEACHER_PASSWORD || '';
  const tokenFor = () => {
    const payload = Buffer.from(JSON.stringify({ role: 'teacher', exp: Date.now() + 12 * 60 * 60 * 1000 })).toString('base64url');
    return payload + '.' + crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  };
  const validToken = req => {
    if (!env.TEACHER_PASSWORD) return false;
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''), [payload, sig, extra] = token.split('.');
    if (!payload || !sig || extra) return false;
    const expected = crypto.createHmac('sha256', secret()).update(payload).digest();
    let supplied; try { supplied = Buffer.from(sig, 'base64url'); } catch { return false; }
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return false;
    try { const data = JSON.parse(Buffer.from(payload, 'base64url').toString()); return data.role === 'teacher' && data.exp > Date.now(); } catch { return false; }
  };
  const auth = (req, res) => { if (!validToken(req)) { json(res, 401, { error: 'Thầy cô hãy đăng nhập để tiếp tục.' }); return false; } return true; };
  return async function handle(req, res) {
    let url; try { url = new URL(req.url, 'http://localhost'); } catch { return json(res,400,{ error:'Địa chỉ yêu cầu chưa đúng.' }); }
    const route = url.pathname;
    try {
      if (route === '/api/status' && req.method === 'GET') return json(res, 200, { storage: store.kind });
      if (route === '/api/site-theme' && req.method === 'GET') {
        const choice = await store.getData('siteTheme');
        return json(res, 200, { season: choice?.season || null });
      }
      if (route === '/api/site-theme' && req.method === 'PUT') {
        if (!auth(req, res)) return;
        const { season } = JSON.parse((await readBody(req, 1000)).toString('utf8')) || {};
        if (typeof season !== 'string' || !Object.hasOwn(seasonOptions, season)) {
          return json(res, 400, { error: 'Cảnh nền này không có trong danh sách.' });
        }
        const choice = await store.updateData('siteTheme', { season: null }, () => ({ season }));
        return json(res, 200, choice);
      }
      if (route === '/api/login' && req.method === 'POST') {
        if (!env.TEACHER_PASSWORD) return json(res,503,{ error:'Chưa bật đăng nhập giáo viên. Thầy hãy đặt TEACHER_PASSWORD trong Railway → Variables rồi khởi động lại dịch vụ.' });
        const ip = getIp(req), now = Date.now(), old = failed.get(ip) || { times: [], lockedUntil: 0 };
        old.times = old.times.filter(t => now - t < 10 * 60 * 1000);
        if (old.lockedUntil > now) return json(res,429,{ error:'Thầy cô nhập sai nhiều lần. Vui lòng chờ 10 phút rồi thử lại.' });
        const body = JSON.parse((await readBody(req, 4000)).toString('utf8'));
        const received = crypto.createHash('sha256').update(String(body.password || '')).digest();
        const expected = crypto.createHash('sha256').update(String(env.TEACHER_PASSWORD)).digest();
        const ok = crypto.timingSafeEqual(received, expected);
        if (!ok) { old.times.push(now); if (old.times.length >= 5) old.lockedUntil = now + 10 * 60 * 1000; failed.set(ip, old); return json(res,401,{ error: old.lockedUntil ? 'Đã tạm khoá đăng nhập 10 phút vì nhập sai nhiều lần.' : 'Mật khẩu chưa đúng. Thầy cô thử lại nhé.' }); }
        failed.delete(ip); return json(res,200,{ token: tokenFor(), expiresIn: 43200 });
      }
      if (route === '/api/questions' && req.method === 'GET') {
        const teacher = validToken(req); return json(res,200,{ questions: await store.listQuestions(teacher) });
      }
      if (route === '/api/questions' && req.method === 'POST') {
        if (!auth(req,res)) return;
        const ct = String(req.headers['content-type'] || '');
        if (ct.includes('text/csv')) {
          let parsed;
          try { parsed = parseCsv((await readBody(req, 3 * 1024 * 1024)).toString('utf8')); }
          catch (error) { error.status = error.status || 400; throw error; }
          const rows = [], errors = [];
          for (const r of parsed) try { rows.push(validateQuestion(fromCsv(r.question))); } catch (e) { errors.push({ line: r.line, message: 'Dòng ' + r.line + ': ' + e.message }); }
          if (rows.length) await store.saveQuestions(rows);
          return json(res,200,{ imported: rows.length, errors, questions: rows });
        }
        const body = JSON.parse((await readBody(req, 3 * 1024 * 1024)).toString('utf8'));
        const inputs = Array.isArray(body) ? body : Array.isArray(body.questions) ? body.questions : [body];
        if (!inputs.length || inputs.length > 100) return json(res,400,{ error:'Mỗi lần nhập từ 1 đến 100 câu hỏi.' });
        const rows = inputs.map((q,i) => { try { return validateQuestion(q); } catch (e) { throw Object.assign(Error('Câu ' + (i + 1) + ': ' + e.message),{status:400}); } });
        await store.saveQuestions(rows); return json(res,200,{ saved: rows.length, questions: rows });
      }
      if (route === '/api/questions/publish' && req.method === 'POST') { if (!auth(req,res)) return; return json(res,200,{ published: await store.publishDrafts() }); }
      if (route.startsWith('/api/questions/') && req.method === 'DELETE') {
        if (!auth(req,res)) return; const key = decodeURIComponent(route.slice('/api/questions/'.length));
        return await store.deleteQuestion(key) ? json(res,200,{ deleted:true }) : json(res,404,{ error:'Không tìm thấy câu hỏi.' });
      }
      if (route === '/api/docs' && req.method === 'GET') return json(res,200,{ documents: await store.listDocs(validToken(req)) });
      if (route === '/api/docs' && req.method === 'POST') {
        if (!auth(req,res)) return;
        const body = JSON.parse((await readBody(req, 14 * 1024 * 1024)).toString('utf8'));
        let doc;
        try { doc = validateDocument(body); } catch (error) { error.status = 400; throw error; }
        await store.saveDoc(doc); return json(res,201,{ document: { id:doc.id,name:doc.name,title:doc.title,grade:doc.grade,topic:doc.topic,note:doc.note,mime:doc.mime,published:doc.published,size:doc.bytes.length } });
      }
      if (route.startsWith('/api/docs/') && req.method === 'GET') {
        const doc = await store.getDoc(decodeURIComponent(route.slice('/api/docs/'.length)));
        if (!doc || (!doc.published && !validToken(req))) return json(res,404,{ error:'Không tìm thấy tài liệu.' });
        const disposition = doc.disposition === 'inline' ? 'inline' : 'attachment';
        res.writeHead(200,{ 'Content-Type':doc.mime,'Content-Length':doc.bytes.length,'Content-Disposition': disposition + "; filename*=UTF-8''" + encodeURIComponent(safeName(doc.name)), 'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store' });
        return res.end(doc.bytes);
      }
      if (route.startsWith('/api/docs/') && req.method === 'PATCH') {
        if (!auth(req,res)) return; const b = JSON.parse((await readBody(req,2000)).toString('utf8'));
        return await store.setDocPublished(decodeURIComponent(route.slice('/api/docs/'.length)), b.published === true) ? json(res,200,{ published: b.published === true }) : json(res,404,{ error:'Không tìm thấy tài liệu.' });
      }
      if (route.startsWith('/api/docs/') && req.method === 'DELETE') {
        if (!auth(req,res)) return; const key = decodeURIComponent(route.slice('/api/docs/'.length));
        return await store.deleteDoc(key) ? json(res,200,{ deleted:true }) : json(res,404,{ error:'Không tìm thấy tài liệu.' });
      }
      if (route === '/api/classes' && req.method === 'POST') {
        if (!auth(req,res)) return;
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let code = '';
        const raw = (await readBody(req,2000)).toString('utf8'), info = classInfo(raw ? JSON.parse(raw) : {});
        do { code = Array.from({length:6}, () => chars[crypto.randomInt(chars.length)]).join(''); } while (await store.hasClass(code));
        await store.createClass(code, info); return json(res,201,{ code, ...info });
      }
      if (route === '/api/classes' && req.method === 'GET') { if (!auth(req,res)) return; return json(res,200,{ classes: await store.listClasses() }); }
      const classMatch = route.match(/^\/api\/classes\/([A-HJ-NP-Z2-9]{6})$/);
      if (classMatch && (req.method === 'PATCH' || req.method === 'DELETE')) {
        if (!auth(req,res)) return;
        if (req.method === 'DELETE') return await store.deleteClass(classMatch[1]) ? json(res,200,{ deleted:true }) : json(res,404,{ error:'Không tìm thấy lớp.' });
        const info = classInfo(JSON.parse((await readBody(req,2000)).toString('utf8')));
        return await store.updateClass(classMatch[1], info) ? json(res,200,info) : json(res,404,{ error:'Không tìm thấy lớp.' });
      }
      if (route === '/api/lessons' && req.method === 'GET') return json(res,200,{ edits: (await store.getData('lessonEdits')) || {} });
      const lessonMatch = route.match(/^\/api\/lessons\/([a-z0-9-]{1,40})$/);
      if (lessonMatch && req.method === 'PUT') {
        if (!auth(req,res)) return;
        const raw = JSON.parse((await readBody(req, 400000)).toString('utf8'));
        let edit; try { edit = lessonEdit(raw); } catch (e) { return json(res,400,{ error: e.message }); }
        await store.updateData('lessonEdits', {}, all => {
          const id = lessonMatch[1];
          if (Object.hasOwn(raw, 'previous') && !require('node:util').isDeepStrictEqual(raw.previous, all[id] || null)) {
            throw Object.assign(Error('Bài này vừa được cập nhật ở nơi khác. Thầy cô mở lại bài để xem bản mới rồi lưu lại nhé.'), { status: 409 });
          }
          if (editIsEmpty(edit)) delete all[id]; else all[id] = edit;
          return all;
        });
        return json(res,200,{ edit });
      }
      if (route === '/api/assignments' && req.method === 'GET') {
        const code = String(url.searchParams.get('classCode') || '').toUpperCase(), list = (await store.getData('assignments')) || [];
        if (validToken(req) && !code) {
          const classes = new Set((await store.listClasses()).map(c => c.code));
          return json(res,200,{ assignments: list.filter(a => classes.has(a.classCode)) });
        }
        if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) return json(res,401,{ error: 'Thầy cô hãy đăng nhập để tiếp tục.' });
        if (!await store.hasClass(code)) return json(res,200,{ assignments: [] });
        return json(res,200,{ assignments: list.filter(a => a.classCode === code) });
      }
      if (route === '/api/assignments' && req.method === 'POST') {
        if (!auth(req,res)) return;
        const b = JSON.parse((await readBody(req,5000)).toString('utf8')), info = assignmentInfo(b);
        const codes = [...new Set((Array.isArray(b.classCodes) ? b.classCodes : []).map(c => String(c).toUpperCase()))].slice(0, 30);
        if (!codes.length) return json(res,400,{ error:'Chọn ít nhất một lớp.' });
        for (const c of codes) if (!await store.hasClass(c)) return json(res,404,{ error:'Không tìm thấy lớp ' + c + '.' });
        const now = Date.now(), made = codes.map(classCode => ({ id: 'a' + crypto.randomBytes(6).toString('hex'), classCode, ...info, createdAt: now, explicitSubmission: true }));
        await store.updateData('assignments', [], list => made.concat(list).slice(0, 500));
        return json(res,201,{ assignments: made });
      }
      const assignMatch = route.match(/^\/api\/assignments\/([a-z0-9]{6,30})$/);
      if (assignMatch && req.method === 'DELETE') {
        if (!auth(req,res)) return;
        await store.updateData('assignments', [], list => {
          const rest = list.filter(a => a.id !== assignMatch[1]);
          if (rest.length === list.length) throw Object.assign(Error('Không tìm thấy bài đã giao.'), { status: 404 });
          return rest;
        });
        return json(res,200,{ deleted:true });
      }
      if (route === '/api/live-games' && req.method === 'POST') {
        if (!auth(req,res)) return;
        const body = JSON.parse((await readBody(req, 60000)).toString('utf8'));
        const classCode = String(body.classCode || '').toUpperCase();
        if (!/^[A-HJ-NP-Z2-9]{6}$/.test(classCode) || !await store.hasClass(classCode)) return json(res,404,{ error:'Không tìm thấy lớp này trên máy chủ.' });
        const clean = value => String(value || '').normalize('NFC').trim().replace(/[\x00-\x1f]/g,' ').replace(/\s+/g,' ');
        const items = Array.isArray(body.items) ? body.items.slice(0,15).map((item,index) => {
          const prompt = clean(item?.prompt), answer = clean(item?.answer), rule = clean(item?.rule);
          const choices = Array.isArray(item?.choices) ? [...new Set(item.choices.map(clean).filter(Boolean))] : [];
          if (!prompt || prompt.length > 220 || !answer || answer.length > 80 || choices.length < 2 || choices.length > 4 || !choices.includes(answer) || choices.some(c => c.length > 80) || rule.length > 300) {
            throw Object.assign(Error('Câu ' + (index + 1) + ' chưa hợp lệ. Mỗi câu cần đề, đáp án và 2–4 lựa chọn.'), { status:400 });
          }
          return { prompt, answer, choices, rule };
        }) : [];
        if (items.length < 3) return json(res,400,{ error:'Đấu trường cần ít nhất 3 câu hỏi.' });
        const seconds = Math.floor(Math.max(10,Math.min(60,Number(body.seconds) || 20)));
        const now = Date.now(), chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const rooms = await store.updateData('liveGames', [], list => {
          const active = list.filter(room => room.expiresAt > now && room.phase !== 'complete');
          let code;
          do { code = Array.from({length:6}, () => chars[crypto.randomInt(chars.length)]).join(''); } while (active.some(room => room.code === code));
          const room = { code, classCode, title:clean(body.title).slice(0,90) || 'Đấu trường chữ', items, seconds, phase:'waiting', round:0, revealedRound:null,
            participants:[], createdAt:now, expiresAt:now + 2 * 60 * 60 * 1000 };
          return [room,...active].slice(0,80);
        });
        const room = rooms[0];
        return json(res,201,{ code:room.code, classCode, title:room.title, expiresAt:room.expiresAt });
      }
      const livePath = route.match(/^\/api\/live-games\/([A-HJ-NP-Z2-9]{6})(?:\/(join|answer|start|reveal|next|end))?$/);
      if (livePath && req.method === 'GET' && !livePath[2]) {
        const code = livePath[1], classCode = String(url.searchParams.get('classCode') || '').toUpperCase();
        const profileId = String(url.searchParams.get('profileId') || ''), host = validToken(req);
        let rooms = await store.getData('liveGames') || [], room = rooms.find(r => r.code === code);
        if (!room || room.expiresAt <= Date.now()) return json(res,404,{ error:'Phòng chơi đã hết hạn hoặc không còn tồn tại.' });
        if (host) {
          if (room.classCode !== classCode) return json(res,403,{ error:'Phòng này thuộc lớp khác.' });
        } else {
          if (room.classCode !== classCode || !/^[\w-]{4,80}$/.test(profileId)) return json(res,403,{ error:'Hãy kết nối hồ sơ học sinh với đúng lớp trước.' });
          const student = (await store.listStudents(classCode)).find(s => s.id === profileId);
          if (!student || !room.participants.some(p => p.id === profileId)) return json(res,403,{ error:'Em cần vào phòng từ máy đã kết nối với lớp.' });
        }
        if (room.phase === 'question' && room.deadlineAt && room.deadlineAt <= Date.now()) {
          await store.updateData('liveGames', [], list => list.map(r => r.code === code && r.phase === 'question' && r.round === room.round ? { ...r, phase:'reveal', revealedAt:Date.now(), revealedRound:r.round } : r));
          rooms = await store.getData('liveGames') || []; room = rooms.find(r => r.code === code);
        }
        const revealed = room.phase === 'reveal' || (room.phase === 'complete' && room.revealedRound === room.round);
        const questionVisible = room.phase === 'question' || room.phase === 'reveal' || revealed;
        const question = questionVisible ? room.items[room.round] || null : null;
        const participants = room.participants.map(p => ({ name:p.name, avatar:p.avatar || '🙂', score:p.score || 0,
          answered:!!p.answers?.[room.round], ...(host && revealed ? { choice:p.answers?.[room.round]?.choice || '', correct:!!p.answers?.[room.round]?.correct } : {}) }));
        const me = host ? null : room.participants.find(p => p.id === profileId);
        const myAnswer = me?.answers?.[room.round] || null;
        const rank = me ? room.participants.slice().sort((a,b) => (b.score || 0) - (a.score || 0)).findIndex(player => player.id === profileId) + 1 : null;
        return json(res,200,{ code, classCode:room.classCode, title:room.title, phase:room.phase, round:room.round, total:room.items.length,
          seconds:room.seconds, deadlineAt:room.deadlineAt || null, participants, answeredCount:room.participants.filter(p => p.answers?.[room.round]).length,
          question:question ? { prompt:question.prompt, choices:question.choices, ...(revealed ? { answer:question.answer, rule:question.rule } : {}) } : null,
          me:me ? { answer:myAnswer ? { choice:myAnswer.choice, ...(revealed ? { correct:myAnswer.correct } : {}) } : null, score:me.score || 0, ...(revealed ? { rank } : {}) } : null });
      }
      if (livePath && req.method === 'POST' && livePath[2]) {
        const code = livePath[1], action = livePath[2], body = JSON.parse((await readBody(req,5000)).toString('utf8'));
        const classCode = String(body.classCode || '').toUpperCase();
        const profileId = String(body.profileId || '');
        const isStudentAction = action === 'join' || action === 'answer';
        let studentSnapshot = null;
        if (!isStudentAction && !auth(req,res)) return;
        if (isStudentAction) {
          if (!/^[A-HJ-NP-Z2-9]{6}$/.test(classCode) || !/^[\w-]{4,80}$/.test(profileId)) return json(res,400,{ error:'Thiếu mã lớp hoặc hồ sơ học sinh.' });
          if (!await store.hasClass(classCode)) return json(res,404,{ error:'Không tìm thấy lớp này.' });
          studentSnapshot = (await store.listStudents(classCode)).find(s => s.id === profileId);
          if (!studentSnapshot) return json(res,403,{ error:'Hồ sơ này chưa kết nối với lớp. Hãy mở Hồ sơ và đồng bộ lớp trước nhé.' });
        }
        const now = Date.now();
        const rooms = await store.updateData('liveGames', [], list => list.map(room => {
          if (room.code !== code) return room;
          if (room.expiresAt <= now) throw Object.assign(Error('Phòng chơi đã hết hạn.'), { status:404 });
          if (isStudentAction && room.classCode !== classCode) throw Object.assign(Error('Mã lớp không khớp với phòng chơi.'), { status:403 });
          if (!isStudentAction && room.classCode !== classCode) throw Object.assign(Error('Phòng này thuộc lớp khác.'), { status:403 });
          if (action === 'join') {
            if (room.phase !== 'waiting') throw Object.assign(Error('Phòng đã bắt đầu. Em nhờ thầy cô tạo phòng mới nhé.'), { status:409 });
            if (!room.participants.some(p => p.id === profileId)) {
              if (room.participants.length >= 60) throw Object.assign(Error('Phòng đã đủ 60 bạn.'), { status:409 });
              room = { ...room, participants:[...room.participants,{ id:profileId, name:studentSnapshot.name, avatar:studentSnapshot.avatar || '🙂', score:0, answers:{} }] };
            }
          } else if (action === 'answer') {
            const round = Number(body.round), choice = String(body.choice || '');
            const player = room.participants.find(p => p.id === profileId), question = room.items[room.round];
            if (!player || room.phase !== 'question' || round !== room.round || room.deadlineAt <= now) throw Object.assign(Error('Lượt này đã đóng. Chờ thầy cô mở câu tiếp theo nhé.'), { status:409 });
            if (player.answers?.[round]) throw Object.assign(Error('Đáp án của em đã được ghi nhận.'), { status:409 });
            if (!question?.choices.includes(choice)) throw Object.assign(Error('Chọn một đáp án có trong câu hỏi.'), { status:400 });
            const correct = choice === question.answer, answers = { ...(player.answers || {}), [round]:{ choice, correct, at:now } };
            room = { ...room, participants:room.participants.map(p => p.id === profileId ? { ...p, answers, score:(p.score || 0) + (correct ? 10 : 0) } : p) };
          } else if (action === 'start') {
            if (room.phase !== 'waiting') throw Object.assign(Error('Phòng đã bắt đầu rồi.'), { status:409 });
            if (!room.participants.length) throw Object.assign(Error('Chờ ít nhất một học sinh vào phòng rồi bắt đầu nhé.'), { status:409 });
            room = { ...room, phase:'question', round:0, deadlineAt:now + room.seconds * 1000 };
          } else if (action === 'reveal') {
            if (room.phase !== 'question') throw Object.assign(Error('Chưa có câu hỏi đang mở.'), { status:409 });
            room = { ...room, phase:'reveal', revealedAt:now, revealedRound:room.round };
          } else if (action === 'next') {
            if (room.phase !== 'reveal') throw Object.assign(Error('Hãy hiện đáp án trước khi chuyển câu.'), { status:409 });
            if (room.round + 1 >= room.items.length) room = { ...room, phase:'complete', completedAt:now };
            else room = { ...room, phase:'question', round:room.round + 1, deadlineAt:now + room.seconds * 1000 };
          } else if (action === 'end') room = { ...room, phase:'complete', completedAt:now };
          else throw Object.assign(Error('Thao tác phòng chơi chưa hợp lệ.'), { status:400 });
          return room;
        }));
        const room = rooms.find(r => r.code === code);
        if (!room) return json(res,404,{ error:'Không tìm thấy phòng chơi.' });
        return json(res,200,{ ok:true, code, phase:room.phase, round:room.round });
      }
      if (route === '/api/sync' && req.method === 'POST') {
        const body = JSON.parse((await readBody(req,MAX_SYNC)).toString('utf8'));
        const code = String(body.classCode || '').toUpperCase();
        if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code) || !await store.hasClass(code)) return json(res,404,{ error:'Mã lớp chưa đúng. Em kiểm tra lại với thầy cô nhé.' });
        let profile;
        try { profile = validateStudent(body.profile); } catch (error) { error.status = 400; throw error; }
        const ip = getIp(req), now = Date.now();
        const networkKey = 'ip:' + ip, network = (syncLimit.get(networkKey) || []).filter(t => now - t < 60_000);
        if (network.length >= 300) return json(res,429,{ error:'Nhiều thiết bị đang đồng bộ cùng lúc. Em chờ một chút rồi thử lại nhé.' });
        network.push(now); syncLimit.set(networkKey,network);
        const key = ip + ':' + code + ':' + profile.id, bucket = syncLimit.get(key) || [];
        const valid = bucket.filter(t => now - t < 60_000); if (valid.length >= 20) return json(res,429,{ error:'Máy đang gửi dữ liệu quá nhanh. Em chờ một chút nhé.' });
        valid.push(now); syncLimit.set(key,valid);
        if (syncLimit.size > 2000) for (const [k,times] of syncLimit) if (!times.some(t => now - t < 60_000)) syncLimit.delete(k);
        const teacherNotes = await store.upsertStudent(code,profile);
        const assignments = ((await store.getData('assignments')) || []).filter(a => a.classCode === code);
        return json(res,200,{ ok:true, teacherNotes, assignments });
      }
      if (route === '/api/students' && req.method === 'GET') {
        if (!auth(req,res)) return; const code = url.searchParams.get('classCode') || '';
        return json(res,200,{ students: await store.listStudents(code) });
      }
      const noteMatch = route.match(/^\/api\/students\/([A-HJ-NP-Z2-9]{6})\/([\w-]+)\/notes$/);
      if (noteMatch && req.method === 'POST') {
        if (!auth(req,res)) return; const b = JSON.parse((await readBody(req,5000)).toString('utf8'));
        const note = { at: Date.now(), text: text(b.text,500) }; if (!note.text) return json(res,400,{ error:'Nhập nhận xét trước khi lưu.' });
        const saved = await store.addNote(noteMatch[1],noteMatch[2],note); return saved ? json(res,200,{ teacherNotes:saved.teacherNotes }) : json(res,404,{ error:'Không tìm thấy học sinh trong lớp này.' });
      }
      const studentMatch = route.match(/^\/api\/students\/([A-HJ-NP-Z2-9]{6})\/([\w-]+)$/);
      if (studentMatch && req.method === 'DELETE') {
        if (!auth(req,res)) return; return await store.deleteStudent(studentMatch[1],studentMatch[2]) ? json(res,200,{ deleted:true }) : json(res,404,{ error:'Không tìm thấy học sinh.' });
      }
      return json(res,404,{ error:'Không tìm thấy API này.' });
    } catch (error) {
      if (res.headersSent || res.destroyed) return;
      const status = error.status || (error instanceof SyntaxError ? 400 : 500);
      if (status >= 500) console.error('Lỗi API:', error.message);
      return json(res,status,{ error: status === 500 ? 'Máy chủ tạm thời gặp sự cố. Thầy cô thử lại sau nhé.' : error.message });
    }
  };
}

module.exports = { mergeHistory, lessonItem, createStore, createApiHandler, validateQuestion, validateDocument, parseCsv, validateStudent, MAX_DOC, MAX_SYNC };
