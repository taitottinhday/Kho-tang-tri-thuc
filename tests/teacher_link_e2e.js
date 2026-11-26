'use strict';
// Two browser profiles through the normal classroom workflow, including an offline submission.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { launch } = require('./cdp_driver');
const { buildServer } = require('../server');

const width = Number(process.argv[2] || 390);
const height = Number(process.argv[3] || 844);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'vuonchu-link-'));
const env = { TEACHER_PASSWORD: 'lop-thu-cuc-bo', SESSION_SECRET: 'chỉ-dùng-cho-kiểm-thử-nối-lớp' };
const topic = 'l2-03';
const topicPath = '#bai-hoc/' + topic;

function click(browser, selector) {
  return browser.eval('document.querySelector(' + JSON.stringify(selector) + ').click()');
}
async function until(browser, condition, label, limit = 16) {
  for (let n = 0; n < limit * 5; n++) {
    if (await browser.eval('return Boolean(' + condition + ')')) {
      console.log('✓ ' + label);
      return;
    }
    await browser.sleep(200);
  }
  throw Error(label);
}
function chooseLessonAnswer() {
  const it = Q.items[Q.i], $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const click = selector => $(selector).click();
  const pick = value => all('[data-answer]').find(b => b.dataset.answer === value).click();
  const type = (selector, value) => { const field = $(selector); field.value = value; field.dispatchEvent(new Event('input')); };
  switch (it.loai) {
    case 'chon': pick(it.dapAn); break;
    case 'ngheChon': case 'nhinTranh': pick(it.word); break;
    case 'dungSai': click('[data-tf="' + Number(it.dung) + '"]'); break;
    case 'ghepChu': it.units.forEach(unit => all('[data-tile]:not(.used)').find(b => b.textContent === unit).click()); break;
    case 'timLoi': all('[data-tok]').find(b => b.textContent.replace(/[.,!?;:"“”()…]/g, '') === it.tuSai).click(); break;
    case 'ngheViet': type('#dictIn', it.cau); break;
    case 'goChu': type('#dbType', it.dapAn); break;
    case 'suaLoi': type('#dbFix', it.tuDung); break;
    case 'chonCau': pick(it.good); break;
    case 'phanLoai': it.words.forEach((w, k) => { click('[data-w="' + k + '"]'); click('[data-b="' + it.baskets.indexOf(w.b) + '"]'); }); break;
    case 'noiTu': it.pairs.forEach((p, k) => { click('[data-l="' + k + '"]'); click('[data-r="' + it.right.indexOf(p[1]) + '"]'); }); break;
    case 'sapXep': it.words.forEach((_, k) => click('[data-k="' + k + '"]')); break;
    case 'chonNhieu': it.chips.forEach((c, k) => { if (c.ok) click('[data-c="' + k + '"]'); }); break;
    default: throw Error('Dạng câu chưa có trong bộ kiểm thử: ' + it.loai);
  }
  click('#plCheck');
  if (!$('.pl-sheet.good')) throw Error('Đáp án kiểm thử sai ở dạng ' + it.loai);
  click('#plCont');
}

async function main() {
  let teacher, student, server;
  try {
    server = await buildServer({ env, dataDir: temp });
    const addr = await server.listen(0, '127.0.0.1');
    const base = 'http://127.0.0.1:' + addr.port + '/';
    teacher = await launch(width, height);
    student = await launch(width, height);
    await Promise.all([teacher.goto(base + 'giao-vien/#lop'), student.goto(base)]);
    await until(teacher, 'document.querySelector("#loginBtn")', 'Cổng giáo viên sẵn sàng');
    await teacher.eval('document.querySelector("#loginPass").value=' + JSON.stringify(env.TEACHER_PASSWORD) + ';document.querySelector("#loginForm").requestSubmit()');
    await until(teacher, 'document.querySelector("#newClass")', 'Đăng nhập và mở Lớp học');
    await teacher.eval('document.querySelector("#ncName").value="Lớp thử 2A";document.querySelector("#newClass").requestSubmit()');
    await until(teacher, 'document.querySelector(".class-card .code")', 'Tạo lớp và nhận mã');
    const code = await teacher.eval('return document.querySelector(".class-card .code").textContent.trim()');
    await until(student, 'document.querySelector("#wlCreate")', 'Học sinh dùng phiên trình duyệt riêng');
    await click(student, '#wlCreate');
    await student.eval('document.querySelector("#nameInput").value="Bé Mai";document.querySelector("#saveProfile").click()');
    await student.sleep(550);
    await student.eval('document.querySelector("#howToGo")?.click(); go("settings")');
    await student.eval('document.querySelector("#classCodeIn").value=' + JSON.stringify(code) + ';document.querySelector("#classJoin").requestSubmit()');
    await until(student, 'document.querySelector(".class-code")', 'Kết nối mã lớp qua Cài đặt');
    await student.eval('go("home")');
    assert.equal(await student.eval('return sessionStorage.getItem("vuonchu.teacherToken")'), null);
    await teacher.eval('location.hash=' + JSON.stringify(topicPath));
    await until(teacher, 'document.querySelector("[data-edit=\\"0\\"]")', 'Mở danh sách câu của bài');
    const hiddenKey = await teacher.eval(`const item = document.querySelector('[data-hide="1"]'); item.click(); return item.dataset.hide`);
    await until(teacher, 'document.querySelector(".q-item.off")', 'Giáo viên lưu thay đổi ẩn câu');
    await until(student, 'getTopic("' + topic + '").goc && !getTopic("' + topic + '").baiTap.some(q=>String(q._k)===' + JSON.stringify(hiddenKey) + ')', 'Học sinh đang mở web nhận thao tác ẩn câu');
    await click(teacher, '[data-edit="0"]');
    await teacher.eval(`document.querySelector('#fDe').value='Buổi ___áng, cả lớp tập thể dục.'; document.querySelector('#fDung').value='s';
      document.querySelectorAll('.fSai').forEach((e,i)=>e.value=i ? '' : 'x'); document.querySelector('#sf').requestSubmit()`);
    await until(student, 'getTopic("' + topic + '").baiTap.some(q=>q.de?.includes("cả lớp tập thể dục"))', 'Câu vừa sửa xuất hiện ở ngân hàng bài của học sinh');
    await teacher.eval('location.hash="giao-bai/' + topic + '"');
    await until(teacher, 'document.querySelector("#asForm")', 'Biểu mẫu Giao bài mở đúng bài');
    async function assign(note, count) {
      await teacher.eval('document.querySelector("#asTopic").value=' + JSON.stringify(topic) +
        ';document.querySelector("#asNote").value=' + JSON.stringify(note) + ';document.querySelector("#asForm").requestSubmit()');
      await until(teacher, 'document.querySelectorAll("#asList details").length===' + count, 'Giao ' + note + ' cho lớp');
    }
    await assign('Lượt một', 1);
    await assign('Lượt hai', 2);
    await until(student, 'document.querySelectorAll(".nd-tasks [data-assignment]").length===2', 'Hai bài cùng chủ đề tự hiện mà không tải lại trang');
    const [second, first] = await teacher.eval('return [...document.querySelectorAll("#asList details")].map(d=>d.dataset.assignment)');
    async function start(id, viaTheory = false) {
      await click(student, '[data-assignment="' + id + '"]');
      await until(student, 'document.querySelector("#beginQuiz")', 'Học sinh mở bài được giao');
      if (viaTheory) await click(student, '#openTheory');
      await click(student, viaTheory ? '#thPractice' : '#beginQuiz');
      await until(student, 'Q?.assignmentId===' + JSON.stringify(id), 'Lượt làm giữ đúng bài giao' + (viaTheory ? ' qua Lý thuyết' : ''));
    }
    await start(first, true);
    const originalQuestions = await student.eval('return JSON.stringify(Q.items)');
    await teacher.eval('location.hash=' + JSON.stringify(topicPath));
    await until(teacher, 'document.querySelector(".q-item.off")', 'Mở lại bài để hiện câu');
    await click(teacher, '[data-hide="' + hiddenKey + '"]');
    await until(teacher, '!document.querySelector(".q-item.off")', 'Lưu hiện lại câu trong lúc học sinh đang làm');
    await student.sleep(5400);
    assert.equal(await student.eval('return JSON.stringify(Q.items)'), originalQuestions, 'Phiên đang làm giữ nguyên câu và đáp án');
    await teacher.eval('location.hash="giao-bai"');
    await until(teacher, 'document.querySelectorAll("#asList details").length===2', 'Giáo viên mở bảng điểm trước khi học sinh nộp');
    await click(teacher, '#asList details[data-assignment="' + first + '"] summary');
    async function finish(id) {
      await student.eval('const answer=' + chooseLessonAnswer.toString() + '; const length=Q.items.length; for(let i=0;i<length;i++) answer();');
      await until(student, 'S.history[0]?.assignmentId===' + JSON.stringify(id) + ' && S.history[0].acc===100', 'Chấm xong và lưu kết quả đúng vào hồ sơ học sinh');
      await student.eval('QuaTang.close(); document.querySelector("#home")?.click()');
    }
    await finish(first);
    const row = id => 'document.querySelector("#asList details[data-assignment=\\"' + id + '\\"]")';
    await until(teacher, row(first) + '?.textContent.includes("Đúng 100%") && ' + row(first) + '.open', 'Bảng điểm tự cập nhật và giữ hàng giáo viên đang mở');
    assert.equal(await teacher.eval('return ' + row(second) + '.textContent.includes("Chưa làm")'), true, 'Lượt hai chưa nộp mặc dù cùng bài');
    await until(student, 'getTopic("' + topic + '").baiTap.some(q=>String(q._k)===' + JSON.stringify(hiddenKey) + ')', 'Lượt tiếp theo dùng câu đã được hiện lại');
    await start(second);
    await student.send('Network.enable');
    await student.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
    await finish(second);
    await until(student, 'JSON.parse(localStorage.getItem("vuonchu.syncQueue") || "[]").some(x=>x.profile.history[0]?.assignmentId===' + JSON.stringify(second) + ')', 'Mất mạng vẫn lưu bài vào hàng đợi');
    await teacher.eval('location.hash="hoc-sinh"');
    await until(teacher, 'document.querySelector("tr[data-open]")', 'Giáo viên mở hồ sơ học sinh chờ lượt nộp tiếp theo');
    await click(teacher, 'tr[data-open]');
    await teacher.eval('document.querySelector("#noteText").value="Em học rất chăm!"');
    await student.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await until(teacher, 'document.querySelectorAll("#hsHistory li").length===2', 'Hồ sơ giáo viên nhận lượt học mới khi kết nối lại');
    assert.equal(await teacher.eval('return document.querySelector("#noteText").value'), 'Em học rất chăm!', 'Cập nhật giữ nguyên nhận xét đang gõ');
    await teacher.eval('document.querySelector("#noteForm").requestSubmit()');
    await student.eval('go("profile")');
    await until(student, 'document.body.innerText.includes("Em học rất chăm!")', 'Nhận xét hiện ở hồ sơ học sinh đang mở');
    await student.eval('go("home")');
    await teacher.eval('document.querySelector("#dlg").close(); location.hash="giao-bai"');
    await until(teacher, row(second) + '?.textContent.includes("Đúng 100%")', 'Có mạng lại, bài tự gửi và bảng điểm tự cập nhật');
    await click(teacher, '[data-asdel="' + second + '"]');
    await click(teacher, '#cfOk');
    await until(student, '!document.querySelector("[data-assignment=\\"' + second + '\\"]")', 'Thu hồi chỉ gỡ bài khỏi trang học sinh');
    assert.equal(await student.eval('return S.history.filter(h=>h.assignmentId).length'), 2, 'Lịch sử giữ cả hai lượt');
    assert.deepEqual([...teacher.errors, ...student.errors], []);
    console.log('Đạt đồng bộ hai trình duyệt tại ' + width + '×' + height);
  } finally {
    await student?.close();
    await teacher?.close();
    await server?.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
