/* Chuyển động rượt đuổi cho nhiệm vụ cá nhân. Nạp sau app.js. */
'use strict';
window.ChaseRun = (() => {
  const missLimit = 3;
  const catchDelay = 900;
  const escapeDelay = 1120;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const safePercent = race => Math.round(race.gap / 80 * 100);
  const mistakeCount = race => 'Sai ' + race.mistakes + '/' + missLimit;
  function createRace() {
    return { gap: 26, rabbitX: 54, wolfX: 28, mistakes: 0,
      feedback: 'Sói đang đuổi theo phía sau!', escaped: false, caught: false };
  }
  function playerFrame(q) {
    const race = q.race, safe = safePercent(race);
    return '<section class="chase-run quest-stage quest-stage--rabbit" data-quest-stage aria-label="Trò chơi Thỏ Lá chạy khỏi sói" style="--rabbit-x:' + race.rabbitX + '%;--wolf-x:' + race.wolfX + '%;--safe:' + safe + '%">' +
      '<div class="quest-viewport" aria-hidden="true"><div class="chase-backdrop"><img src="assets/chase-forest.webp" alt="" /></div>' +
      '<div class="chase-track"><span class="chase-dust dust-one"></span><span class="chase-dust dust-two"></span>' +
      runner('wolf') + runner('rabbit') + '<span class="chase-brake-dust"></span></div><div class="quest-foreground"></div><div class="quest-light"></div></div>' +
      '<div class="chase-hud"><span class="chase-title"><i>🏁</i> THỎ LÁ CHẠY TRỐN</span><span class="chase-safe" data-chase-mistakes>' + mistakeCount(race) + '</span></div>' +
      '<div class="chase-meter" role="progressbar" aria-label="Khoảng cách an toàn với sói" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + safe + '"><span></span><b>AN TOÀN</b></div>' +
      '<div class="chase-feedback" data-chase-feedback aria-live="polite">' + race.feedback + '</div>' +
      '<div class="chase-outcome" data-chase-outcome aria-hidden="true"></div></section>';
  }
  function runner(animal) {
    return '<div class="chase-runner chase-' + animal + '"><span class="chase-paw"></span>' +
      '<span class="chase-stride"><img src="assets/chase-' + animal + '-stride.webp" alt="" /></span>' +
      (animal === 'rabbit' ? '<span class="chase-speed-lines"></span>' : '') + '</div>';
  }
  function answer(q, correct) {
    const race = q.race;
    if (race.caught || race.escaped) return;
    if (correct) {
      race.rabbitX = clamp(race.rabbitX + 8.5, 52, 95);
      race.wolfX = clamp(race.wolfX + 2.4, 3, race.rabbitX - 8);
      race.gap = clamp(race.rabbitX - race.wolfX, 8, 80);
      race.feedback = 'Đúng rồi! Thỏ bứt tốc! 🐇💨';
    } else {
      race.mistakes++;
      if (race.mistakes >= missLimit) {
        race.caught = true;
        race.rabbitX = clamp(race.rabbitX + 3, 49, 94);
        race.gap = 0;
        race.feedback = 'Sói bắt kịp Thỏ Lá sau ' + missLimit + ' câu sai.';
      } else {
        race.rabbitX = clamp(race.rabbitX + 1.2, 49, 95);
        race.wolfX = clamp(Math.min(race.rabbitX - 7, race.wolfX + 5.8), 3, 88);
        race.gap = clamp(race.rabbitX - race.wolfX, 7, 80);
        race.feedback = race.mistakes === missLimit - 1
          ? 'Cẩn thận! Sai thêm một câu là Sói bắt kịp.'
          : 'Sói tiến gần hơn! Cố lên, Thỏ Lá! 🐺';
      }
    }
    const last = q.i + 1 >= q.items.length;
    if (correct && last && q.correct === q.items.length) {
      race.escaped = true;
      race.gap = 80;
      race.rabbitX = 123;
      race.feedback = 'Em trả lời đúng hết — Thỏ Lá chạy thoát rồi! 🎉';
    }
    const root = document.querySelector('.chase-run');
    if (!root) return;
    if (race.caught || race.escaped) window.QuestCinema?.resetCamera(root);
    root.style.setProperty('--rabbit-x', race.rabbitX + '%');
    root.style.setProperty('--wolf-x', race.wolfX + '%');
    root.style.setProperty('--safe', safePercent(race) + '%');
    root.classList.toggle('is-correct', correct);
    root.classList.toggle('is-wrong', !correct);
    root.classList.toggle('is-escaped', race.escaped);
    root.classList.toggle('is-caught', race.caught);
    root.querySelector('[data-chase-mistakes]').textContent = mistakeCount(race);
    root.querySelector('.chase-meter').setAttribute('aria-valuenow', String(safePercent(race)));
    root.querySelector('[data-chase-feedback]').textContent = race.feedback;
    if (race.caught || race.escaped) {
      root.querySelector('[data-chase-outcome]').textContent = race.caught ? 'SÓI BẮT KỊP THỎ LÁ!' : '🌟 THỎ LÁ ĐÃ THOÁT! 🌟';
    }
  }
  return { createRace, playerFrame, answer, missLimit, catchDelay, escapeDelay };
})();
