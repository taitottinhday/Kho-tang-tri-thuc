/* Chuyển động rượt đuổi cho nhiệm vụ cá nhân. Nạp sau app.js. */
'use strict';
window.ChaseRun = (() => {
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const wolfX = race => clamp(race.wolfX == null ? race.rabbitX - race.gap : race.wolfX, 3, 88);
  function playerFrame(q) {
    const race = q.race || { gap:26, rabbitX:54, wolfX:28, feedback:'Sói đang đuổi theo phía sau!', escaped:false };
    const safe = Math.round(race.gap / 80 * 100);
    return '<section class="chase-run" aria-label="Trò chơi Thỏ Lá chạy khỏi sói" style="--rabbit-x:' + race.rabbitX + '%;--wolf-x:' + wolfX(race) + '%;--safe:' + safe + '%">' +
      '<div class="chase-backdrop" aria-hidden="true"><img src="assets/chase-forest.webp" alt="" /></div>' +
      '<div class="chase-hud"><span class="chase-title"><i>🏁</i> THỎ LÁ CHẠY TRỐN</span><span class="chase-safe" data-chase-safe>Cách sói ' + safe + '%</span></div>' +
      '<div class="chase-meter" role="progressbar" aria-label="Khoảng cách an toàn với sói" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + safe + '"><span data-chase-meter></span><b>AN TOÀN</b></div>' +
      '<div class="chase-track" aria-hidden="true"><span class="chase-bush bush-one">🌿</span><span class="chase-bush bush-two">🌱</span><span class="chase-dust dust-one">✦</span><span class="chase-dust dust-two">✧</span>' +
      '<div class="chase-runner chase-wolf"><img src="assets/chase-wolf.webp" alt="" /><span class="chase-paw"></span></div>' +
      '<div class="chase-runner chase-rabbit"><img src="assets/chase-rabbit.webp" alt="" /><span class="chase-paw"></span><span class="chase-speed-lines"></span></div></div>' +
      '<div class="chase-feedback" data-chase-feedback aria-live="polite">' + race.feedback + '</div>' +
      '<div class="chase-escape" data-chase-escape aria-live="polite">🌟 THỎ LÁ ĐÃ THOÁT! 🌟</div></section>';
  }
  function answer(q, correct) {
    const race = q.race || (q.race = { gap:26, rabbitX:54, wolfX:28, feedback:'', escaped:false });
    if (correct) {
      race.rabbitX = clamp(race.rabbitX + 8.5, 52, 95);
      race.wolfX = clamp(race.wolfX + 2.4, 3, race.rabbitX - 8);
      race.gap = clamp(race.rabbitX - race.wolfX, 8, 80);
      race.feedback = 'Đúng rồi! Thỏ bứt tốc! 🐇💨';
    } else {
      race.rabbitX = clamp(race.rabbitX + 1.2, 49, 95);
      race.wolfX = clamp(Math.min(race.rabbitX - 7, race.wolfX + 5.8), 3, 88);
      race.gap = clamp(race.rabbitX - race.wolfX, 7, 80);
      race.feedback = 'Sói tiến gần hơn! Cố lên, Thỏ Lá! 🐺';
    }
    const last = q.i + 1 >= q.items.length;
    if (last && q.correct === q.items.length) {
      race.escaped = true;
      race.gap = 80;
      race.rabbitX = 113;
      race.wolfX = 40;
      race.feedback = 'Em trả lời đúng hết — Thỏ Lá chạy thoát rồi! 🎉';
    }
    const root = document.querySelector('.chase-run');
    if (!root) return;
    root.style.setProperty('--rabbit-x', race.rabbitX + '%');
    root.style.setProperty('--wolf-x', wolfX(race) + '%');
    root.style.setProperty('--safe', Math.round(race.gap / 80 * 100) + '%');
    root.style.setProperty('--rabbit-speed', correct ? '.44s' : '1.5s');
    root.style.setProperty('--wolf-speed', correct ? '1.1s' : '.56s');
    root.classList.remove('is-correct','is-wrong','is-escaped');
    void root.offsetWidth;
    root.classList.add(correct ? 'is-correct' : 'is-wrong');
    if (race.escaped) root.classList.add('is-escaped');
    const safe = root.querySelector('[data-chase-safe]');
    const meter = root.querySelector('[data-chase-meter]');
    const progress = root.querySelector('.chase-meter');
    const feedback = root.querySelector('[data-chase-feedback]');
    if (safe) safe.textContent = 'Cách sói ' + Math.round(race.gap / 80 * 100) + '%';
    if (meter) meter.style.width = Math.round(race.gap / 80 * 100) + '%';
    if (progress) progress.setAttribute('aria-valuenow', String(Math.round(race.gap / 80 * 100)));
    if (feedback) feedback.textContent = race.feedback;
  }
  return { playerFrame, answer };
})();
