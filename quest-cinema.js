/* Giữ cảnh Thám tử chữ liền mạch giữa các câu và đổi nhịp mà không đặt lại khung chân. */
'use strict';
window.QuestCinema = (() => {
  const owners = new WeakMap();
  const reduced = () => document.body.classList.contains('calm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const find = root => root.querySelector('.player > [data-quest-stage]');

  function mount(root, quiz) {
    const scene = find(root);
    if (scene) owners.set(scene, quiz);
  }

  function refresh(root, html, quiz) {
    const scene = find(root);
    if (!scene || owners.get(scene) !== quiz) return false;
    // Thay các phần của câu hỏi. Cảnh luôn gắn trong DOM nên giữ thời gian của các animation.
    const template = document.createElement('template');
    template.innerHTML = html;
    const next = find(template.content);
    if (!next) return false;
    const before = document.createDocumentFragment(), after = document.createDocumentFragment();
    while (next.previousElementSibling) before.prepend(next.previousElementSibling);
    while (next.nextElementSibling) after.append(next.nextElementSibling);
    while (scene.previousElementSibling) scene.previousElementSibling.remove();
    while (scene.nextElementSibling) scene.nextElementSibling.remove();
    scene.parentElement.style.cssText = next.parentElement.style.cssText;
    scene.before(before);
    scene.after(after);
    if (quiz.journey?.won) {
      scene.classList.remove('is-finishing');
      scene.classList.add('is-won');
      scene.querySelector('[data-journey-feedback]').textContent = quiz.journey.message;
    }
    return true;
  }

  function setRate(root, selector, rate) {
    root.querySelectorAll(selector).forEach(element => element.getAnimations?.().forEach(animation => {
      if (animation.updatePlaybackRate) animation.updatePlaybackRate(rate);
      else animation.playbackRate = rate;
    }));
  }

  function answer(quiz, right) {
    if (reduced() || quiz.race?.caught || quiz.race?.escaped || quiz.journey?.won || quiz.journey?.short) return;
    const scene = find(document.getElementById('modalRoot'));
    if (!scene) return;
    if (quiz.race) {
      setRate(scene, '.chase-rabbit .chase-stride img,.chase-rabbit .chase-paw', right ? 1.5 : .77);
      setRate(scene, '.chase-wolf .chase-stride img,.chase-wolf .chase-paw', right ? .87 : 1.5);
    } else {
      setRate(scene, '.journey-sprite>img,.journey-shadow,.journey-ball-visual,.journey-ball-shadow', right ? 1.37 : .72);
    }
    if (!right) return;
    const view = scene.querySelector('.quest-viewport');
    if (!view?.animate) return;
    view.getAnimations?.().filter(animation => animation.id === 'quest-camera-nudge').forEach(animation => animation.cancel());
    const motion = view.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.042) translateX(-.55%)', offset: .45 },
      { transform: 'scale(1)' }
    ], { duration: 710, easing: 'cubic-bezier(.24,.65,.35,1)' });
    motion.id = 'quest-camera-nudge';
  }

  function resetCamera(root) {
    root.querySelector('.quest-viewport')?.getAnimations?.().filter(animation => animation.id === 'quest-camera-nudge')
      .forEach(animation => animation.cancel());
  }

  return { mount, refresh, answer, resetCamera, reduced };
})();
