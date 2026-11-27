'use strict';

const BASE_URL = (process.env.VUONCHU_URL || 'http://localhost:3000').replace(/\/+$/, '');
const ADMIN_PASSWORD = process.env.VUONCHU_ADMIN_PASSWORD || process.env.TEACHER_PASSWORD || '';
const TEACHER = { username: 'lethiquynhhue', name: 'Lê Thị Quỳnh Huệ' };
const CLASS_LIST = [
  { name: 'Mẫu 1A · Huệ', grade: 1, section: '1a' },
  { name: 'Mẫu 1B · Huệ', grade: 1, section: '1b' },
  { name: 'Mẫu 2A · Huệ', grade: 2, section: '2a' },
  { name: 'Mẫu 2B · Huệ', grade: 2, section: '2b' },
  { name: 'Mẫu 3A · Huệ', grade: 3, section: '3a' },
  { name: 'Mẫu 3B · Huệ', grade: 3, section: '3b' },
  { name: 'Mẫu 3C · Huệ', grade: 3, section: '3c' }
];
const SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const MIDDLE_NAMES = ['Minh', 'Hoàng', 'Gia', 'Ngọc', 'Khánh', 'Bảo', 'Thành', 'Quốc', 'Thảo', 'Phương', 'Thuỳ', 'Thanh', 'Anh', 'Hải', 'Đức', 'Tuệ', 'Mai', 'Diệu'];
const GIVEN_NAMES = ['An', 'Bình', 'Châu', 'Dũng', 'Em', 'Giang', 'Hà', 'Huy', 'Hân', 'Khang', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'My', 'Nam', 'Ngân', 'Nhi', 'Phúc', 'Quân', 'Quỳnh', 'Sơn', 'Thảo', 'Trang', 'Trí', 'Tú', 'Uyên', 'Vy', 'Yến'];
const AVATARS = ['🐻', '🐰', '🦊', '🐼', '🐱', '🐸', '🐯', '🐨', '🦁', '🐵'];

function studentName(classIndex, seat) {
  const surname = SURNAMES[(seat * 7 + classIndex * 3) % SURNAMES.length];
  const middle = MIDDLE_NAMES[(seat * 11 + classIndex * 5) % MIDDLE_NAMES.length];
  const given = GIVEN_NAMES[(seat * 13 + classIndex * 7) % GIVEN_NAMES.length];
  return surname + ' ' + middle + ' ' + given;
}

function randomPassword() {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = require('node:crypto').randomBytes(20);
  return Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('');
}

async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(BASE_URL + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: 'Bearer ' + token } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.error || method + ' ' + path + ' returned ' + response.status);
  return data;
}

async function main() {
  if (!ADMIN_PASSWORD) throw Error('Cần đặt VUONCHU_ADMIN_PASSWORD hoặc TEACHER_PASSWORD của tài khoản quản trị.');
  const { token } = await request('/api/login', { method: 'POST', body: { username: 'admin', password: ADMIN_PASSWORD } });
  const current = await request('/api/admin/teachers', { token });
  let teacher = current.teachers.find(item => item.username === TEACHER.username);
  let issuedPassword = '';
  if (!teacher) {
    issuedPassword = randomPassword();
    const created = await request('/api/admin/teachers', {
      method: 'POST', token,
      body: { username: TEACHER.username, name: TEACHER.name, password: issuedPassword }
    });
    teacher = created.teacher;
  } else if (!teacher.active) {
    await request('/api/admin/teachers/' + TEACHER.username, { method: 'PATCH', token, body: { active: true } });
  }

  const knownClasses = await request('/api/classes', { token });
  const classesByName = new Map(knownClasses.classes.map(item => [item.name, item]));
  const rows = [];
  let totalStudents = 0;
  for (let classIndex = 0; classIndex < CLASS_LIST.length; classIndex++) {
    const definition = CLASS_LIST[classIndex];
    let classroom = classesByName.get(definition.name);
    if (!classroom) {
      classroom = await request('/api/classes', {
        method: 'POST', token,
        body: { name: definition.name, grade: definition.grade, owner: TEACHER.username }
      });
    } else if (classroom.owner && classroom.owner !== TEACHER.username) {
      throw Error('Lớp “' + definition.name + '” đang do tài khoản khác phụ trách. Dữ liệu cũ vẫn được giữ nguyên.');
    } else if (classroom.owner !== TEACHER.username) {
      await request('/api/classes/' + classroom.code, {
        method: 'PATCH', token, body: { owner: TEACHER.username }
      });
    }

    const existing = await request('/api/students?classCode=' + encodeURIComponent(classroom.code), { token });
    const existingIds = new Set((existing.students || []).map(student => student.id));
    let added = 0;
    for (let seat = 0; seat < 35; seat++) {
      const id = 'mock-hue-' + definition.section + '-' + String(seat + 1).padStart(3, '0');
      if (existingIds.has(id)) continue;
      await request('/api/sync', {
        method: 'POST',
        body: {
          classCode: classroom.code,
          profile: {
            id,
            name: studentName(classIndex, seat),
            grade: definition.grade,
            avatar: AVATARS[(seat + classIndex) % AVATARS.length],
            xp: 0,
            streak: 0,
            attempts: 0,
            correct: 0,
            topics: {},
            history: [],
            wrongLog: {}
          }
        }
      });
      added++;
    }
    totalStudents += added;
    rows.push({ name: classroom.name || definition.name, code: classroom.code, students: added || 35 });
  }

  console.log('Đã tạo dữ liệu mẫu trên ' + BASE_URL);
  console.log('Giáo viên phụ trách 7 lớp: ' + TEACHER.name + ' (@' + TEACHER.username + ')');
  console.log('Học sinh hư cấu: ' + totalStudents + ' (35 em/lớp)');
  for (const classroom of rows) console.log(classroom.name + ' · mã ' + classroom.code + ' · ' + classroom.students + ' học sinh');
  if (issuedPassword) console.log('\nMật khẩu cấp lần đầu cho giáo viên ' + TEACHER.name + ' (hãy lưu lại):\n' + issuedPassword);
  else console.log('\nTài khoản giáo viên đã có sẵn. Mật khẩu hiện tại không bị thay đổi.');
  console.log('\nMỗi hồ sơ chỉ có tên và lớp, chưa có kết quả học tập.');
}

main().catch(error => {
  console.error('Không tạo được dữ liệu mẫu: ' + error.message);
  process.exitCode = 1;
});
