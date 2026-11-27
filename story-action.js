/* Các cảnh hành động chỉ được phát khi học sinh sửa đúng chữ ở chốt. */
'use strict';
window.StoryAction = (() => {
  const art = 'assets/vuon-truyen/';
  const quest = 'assets/quest/';
  const ending = { football:'Bóng vào lưới!', royal:'Công chúa đã an toàn!' };

  function plan(route, turn, lastChapter, lastScene) {
    const id = route.id;
    const finale = lastChapter && lastScene && Boolean(ending[id]);
    const duration = id === 'rabbit' ? 1570 : id === 'football'
      ? (finale ? 3130 : 2040) : (finale ? 3290 : 2100);
    return { id, finale, duration, pitch: id === 'football' && lastChapter, near: turn % 2 === 0, title: finale ? ending[id] : '' };
  }

  function atlas(source, className) {
    return '<span class="' + className + '"><img src="' + source + '" alt="" decoding="async"></span>';
  }

  function hero(route, action) {
    const base = 'forest-traveler-sprite story-hero-run';
    let poses = atlas(route.stride, base);
    if (action.id === 'football') {
      poses += atlas(art + 'football-feint.webp', 'forest-traveler-sprite story-feint');
      if (action.finale) poses += atlas(quest + 'footballer-strike.webp', 'forest-traveler-sprite story-strike');
    }
    if (action.id === 'royal') {
      poses += atlas(art + 'king-brace.webp', 'forest-traveler-sprite story-brace');
      for (const position of ['rear', 'front']) {
        poses += atlas(quest + 'guard-stride.webp', 'forest-escort forest-escort-' + position);
      }
    }
    return '<div class="forest-traveler-path"><span class="forest-traveler"><span class="forest-traveler-shadow"></span><span class="forest-trail"></span>' +
      poses + '</span></div>';
  }

  function football(finale) {
    const goal = '<div class="journey-goal story-goal"><span class="journey-net"></span></div>';
    return (finale ? goal : '') +
      '<div class="story-ball-path"><span class="story-ball-shadow"></span><span class="forest-traveler-ball"></span></div>' +
      '<div class="story-opponent-path"><div class="story-opponent"><span class="story-opponent-shadow"></span>' +
      atlas(art + 'football-defender.webp', 'story-opponent-poses') + '</div></div>';
  }

  function royal(finale) {
    const gate = '<div class="story-gate"><span class="story-gate-light"></span><span class="story-gate-doors"><i></i><i></i></span>' +
      '<img src="' + art + 'moon-gate.webp" alt="" decoding="async"></div>' +
      atlas(quest + 'princess-wave.webp', 'story-rescued-princess');
    return (finale ? gate : '') +
      '<div class="story-opponent-path"><div class="story-opponent"><span class="story-opponent-shadow"></span>' +
      atlas(art + 'shadow-knight.webp', 'story-opponent-poses') + '</div></div><span class="story-shield-ripple"></span>';
  }

  function markup(route, action) {
    const classes = ['forest-crossing', 'story-action-' + action.id];
    if (action.finale) classes.push('is-finale');
    if (action.pitch) classes.push('on-pitch');
    if (action.near) classes.push('cut-near');
    const props = action.id === 'football' ? football(action.finale) : action.id === 'royal' ? royal(action.finale) : '';
    return '<div class="' + classes.join(' ') + '" aria-hidden="true" style="--pass-duration:' + (action.duration - 60) + 'ms">' +
      props + hero(route, action) + '<div class="forest-near"></div>' +
      (action.title ? '<strong class="story-action-result">' + action.title + '</strong>' : '') + '</div>';
  }

  return { plan, markup };
})();
