/* Lựa chọn nhân vật và diễn biến của các màn Thám tử chữ. */
'use strict';
window.QuestJourney = (() => {
  const choices = {
    rabbit: {
      id: 'rabbit', name: 'Thỏ Lá', icon: '🐇', portrait: 'assets/chase-rabbit.webp',
      mission: 'Thoát khỏi Sói', rule: 'Đúng 5 câu để thoát. Sai 3 câu thì Sói bắt kịp.'
    },
    football: {
      id: 'football', name: 'Cầu thủ', icon: '⚽', portrait: 'assets/quest/footballer-card.webp',
      mission: 'Đường đến khung thành', rule: 'Đúng 4 câu để sút vào gôn.', goal: 4,
      first: 'Dẫn bóng tới khung thành!', right: 'Đúng rồi! Cầu thủ đẩy bóng tiến lên.',
      wrong: 'Cầu thủ giữ bóng. Mình thử ở câu tiếp theo nhé!',
      cue: 'Cầu thủ lấy đà sút bóng!',
      winTitle: '⚽ Bóng vào lưới rồi!', winMessage: 'Cầu thủ đặt chân trụ và sút bóng vào gôn nhờ những câu đúng của em.',
      nextTry: 'Thêm câu trả lời đúng để đưa bóng tới chỗ dứt điểm.', finish: 'VÀO GÔN!', duration: 1910,
      startX: 19, endX: 64
    },
    royal: {
      id: 'royal', name: 'Nhà vua', icon: '👑', portrait: 'assets/quest/king-card.webp',
      mission: 'Đường về cung điện', rule: 'Đúng 4 câu để gặp Công chúa.', goal: 4,
      first: 'Đoàn hộ tống đang lên đường tới cung điện.', right: 'Đúng rồi! Đoàn hộ tống tiến thêm một đoạn.',
      wrong: 'Đoàn đi chậm lại. Mình cẩn thận ở câu tiếp theo nhé!',
      cue: 'Tới cổng rồi. Đoàn đang dừng lại…',
      winTitle: '👑 Đã gặp Công chúa!', winMessage: 'Ngựa đã tới cổng cung. Công chúa bước ra vẫy tay chào Nhà vua và đoàn hộ tống.',
      nextTry: 'Thêm câu trả lời đúng để đoàn tới cổng cung điện.', finish: 'CÔNG CHÚA RA ĐÓN!', duration: 2100,
      startX: 31, endX: 66
    }
  };
  const character = id => Object.hasOwn(choices, id) ? choices[id] : choices.rabbit;
  const chooseMarkup = selected => Object.values(choices).map(entry =>
    '<label class="quest-choice quest-choice--' + entry.id + '">' +
    '<input type="radio" name="quest-character" value="' + entry.id + '"' + (entry.id === character(selected).id ? ' checked' : '') + '>' +
    '<span class="quest-choice-portrait"><img src="' + entry.portrait + '" alt=""></span>' +
    '<span class="quest-choice-info"><b>' + entry.name + '</b><small>' + entry.rule + '</small></span></label>'
  ).join('');

  function create(q) {
    const mode = character(q.adventure);
    return { mode, goal: Math.min(mode.goal, q.items.length), steps: 0, won: false, short: false, justWon: false, message: mode.first };
  }
  const percent = state => Math.round(100 * state.steps / state.goal);
  const position = state => state.mode.startX + (state.mode.endX - state.mode.startX) * state.steps / state.goal;

  function sprite(name, cls) {
    return '<span class="journey-sprite ' + (cls || '') + '"><img src="assets/quest/' + name + '.webp" alt="" decoding="async"></span>';
  }
  function football() {
    return '<div class="journey-goal"><span class="journey-net"></span></div>' +
      '<div class="journey-actor journey-footballer"><span class="journey-shadow"></span><span class="quest-contact-dust"></span>' +
        sprite('footballer-stride', 'journey-foot-run') + sprite('footballer-strike', 'journey-foot-kick') + '</div>' +
      '<div class="journey-ball"><span class="journey-ball-shadow"></span><span class="journey-ball-visual"></span></div><span class="journey-sparks"></span>';
  }
  function royal() {
    return '<div class="journey-beacon"></div>' +
      '<div class="journey-actor journey-guard journey-guard-back"><span class="journey-shadow"></span>' + sprite('guard-stride') + '</div>' +
      '<div class="journey-actor journey-rider"><span class="journey-shadow"></span><span class="quest-contact-dust"></span>' +
        sprite('king-stride', 'journey-rider-walk') + sprite('king-halt', 'journey-rider-halt') + '</div>' +
      '<div class="journey-actor journey-guard journey-guard-front"><span class="journey-shadow"></span>' + sprite('guard-stride') + '</div>' +
      '<div class="journey-actor journey-princess"><span class="journey-shadow"></span>' + sprite('princess-wave') + '</div>' +
      '<span class="journey-sparks"></span>';
  }
  const shortBadge = 'CHƯA ĐẾN ĐÍCH';
  const badge = state => state.won ? state.mode.finish : state.short ? shortBadge : '';
  function playerFrame(q) {
    const state = q.journey, mode = state.mode;
    return '<section class="journey-scene quest-stage journey--' + mode.id + ' quest-stage--' + mode.id + (state.won ? ' is-won' : state.short ? ' is-short' : '') + '" data-quest-stage aria-label="' + mode.mission +
      '" style="--lead-x:' + position(state) + '%;--journey-progress:' + percent(state) + '%">' +
      '<div class="quest-viewport" aria-hidden="true"><div class="journey-background"></div>' +
        '<div class="journey-track">' + (mode.id === 'football' ? football() : royal()) + '</div>' +
        '<div class="quest-foreground"></div><div class="quest-light"></div></div>' +
      '<div class="journey-hud"><strong>' + mode.icon + ' ' + mode.mission + '</strong><span data-journey-count>Đúng ' + state.steps + '/' + state.goal + '</span></div>' +
      '<div class="journey-meter" role="progressbar" aria-label="Câu đúng để tới đích" aria-valuemin="0" aria-valuemax="' + state.goal + '" aria-valuenow="' + state.steps + '"><span></span></div>' +
      '<div class="journey-feedback" aria-live="polite" data-journey-feedback>' + state.message + '</div>' +
      '<div class="journey-finish" aria-hidden="true" data-journey-finish>' + badge(state) + '</div></section>';
  }

  function answer(q, right) {
    const state = q.journey;
    state.justWon = false;
    if (state.won) return;
    state.steps = Math.min(q.correct, state.goal);
    state.won = state.steps === state.goal;
    state.justWon = state.won;
    state.short = !state.won && q.i + 1 >= q.items.length;
    state.message = state.won ? state.mode.winTitle : state.short ? state.mode.nextTry : right ? state.mode.right : state.mode.wrong;
    const frame = document.querySelector('.journey-scene');
    if (!frame) return;
    if (state.justWon) {
      window.QuestCinema?.resetCamera(frame);
      const ball = frame.querySelector('.journey-ball');
      if (ball) frame.style.setProperty('--shot-start', getComputedStyle(ball).left);
    }
    frame.style.setProperty('--lead-x', position(state) + '%');
    frame.style.setProperty('--journey-progress', percent(state) + '%');
    frame.classList.toggle('is-correct', right);
    frame.classList.toggle('is-wrong', !right);
    frame.classList.toggle('is-short', state.short);
    // Khung sau khi chuyển câu giữ tư thế đã về đích; hoạt ảnh chỉ phát lúc đạt mốc.
    frame.classList.toggle('is-finishing', state.justWon);
    frame.querySelector('[data-journey-count]').textContent = 'Đúng ' + state.steps + '/' + state.goal;
    frame.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(state.steps));
    const feedback = frame.querySelector('[data-journey-feedback]');
    const finish = frame.querySelector('[data-journey-finish]');
    const animatedWin = state.justWon && !window.QuestCinema?.reduced();
    feedback.textContent = animatedWin ? state.mode.cue : state.message;
    finish.textContent = badge(state);
    if (animatedWin) finish.addEventListener('animationend', () => { feedback.textContent = state.message; }, { once: true });
  }

  function result(state) {
    if (!state) return null;
    if (state.won) return { title: state.mode.winTitle, message: state.mode.winMessage };
    return { title: '🌱 Suýt tới đích rồi!', message: state.mode.nextTry };
  }

  return { character, chooseMarkup, create, playerFrame, answer, result };
})();
