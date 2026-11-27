// Art for the penalty scene. Limbs are layered around explicit hip, knee,
// shoulder and elbow pivots so the run, strike and save all read in silhouette.
let artworkId = 0;

function stop(offset, color, opacity = 1) {
  return `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`;
}

function linear(id, colors, vector = '0% 0% 84% 100%') {
  const [x1, y1, x2, y2] = vector.split(' ');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${colors.map(([at, color]) => stop(at, color)).join('')}</linearGradient>`;
}

export const PENALTY_KICK_CONTACT_MS = 252;
export const PENALTY_STRIDE_UNITS = 120;
export const PENALTY_KEEPER_DIVE_MS = Object.freeze({ push: 235, reach: 470, land: 725, recover: 872 });

const STRIKER_JOINTS = {
  near: [[132, 216], [128, 253], [129, 298]],
  far: [[160, 215], [174, 252], [175, 297]]
};

function interpolate(track, time) {
  const next = track.findIndex(frame => time <= frame[0] + 1e-8);
  if (next === 0) return track[0].slice(1);
  if (next < 0) return track.at(-1).slice(1);
  const before = track[next - 1];
  const after = track[next];
  const amount = (time - before[0]) / (after[0] - before[0]);
  return before.slice(1).map((value, axis) => value + (after[axis + 1] - value) * amount);
}

function solveLeg(side, [ankleX, ankleY, pitch], [bodyX, bodyY]) {
  const [hip, knee, ankle] = STRIKER_JOINTS[side];
  const [upperX, upperY] = knee.map((coordinate, index) => coordinate - hip[index]);
  const [lowerX, lowerY] = ankle.map((coordinate, index) => coordinate - knee[index]);
  const thigh = Math.hypot(upperX, upperY);
  const calf = Math.hypot(lowerX, lowerY);
  const dx = ankleX - bodyX - hip[0];
  const dy = ankleY - bodyY - hip[1];
  const heading = Math.atan2(dy, dx);
  const distance = Math.max(Math.abs(thigh - calf) + .2, Math.min(thigh + calf - .2, Math.hypot(dx, dy)));
  const clampedX = Math.cos(heading) * distance;
  const clampedY = Math.sin(heading) * distance;
  const kneeOffset = Math.acos((thigh ** 2 + distance ** 2 - calf ** 2) / (2 * thigh * distance));
  const hipAngle = heading - kneeOffset;
  const shinAngle = Math.atan2(clampedY - thigh * Math.sin(hipAngle), clampedX - thigh * Math.cos(hipAngle));
  const toDegrees = 180 / Math.PI;
  const thighRotation = (hipAngle - Math.atan2(upperY, upperX)) * toDegrees;
  const shinRotation = (shinAngle - Math.atan2(lowerY, lowerX)) * toDegrees - thighRotation;
  return [thighRotation, shinRotation, pitch - thighRotation - shinRotation];
}

const runFoot = [
  [0, 24, 0, -8], [.10, 12, 0, 0], [.33, -16, 0, 0], [.43, -28, -4, 20],
  [.57, -24, -25, 42], [.72, -4, -41, 20], [.87, 23, -24, -19], [1, 24, 0, -8]
];
const runBody = [[0, 0, -2], [.16, -2, 5], [.35, 0, -2], [.50, 1, -8], [.66, 0, 5], [.85, -1, -2], [1, 0, -2]];
const strikeBody = [[0, 0, 0], [.14, -1, 3], [.24, -6, 6], [.32, 2, 4], [.36, 11, 2], [.49, 15, 2], [.62, 15, -3], [.76, 11, 2], [.89, 7, 4], [1, 7, 0]];
const strikeFoot = [
  [0, 130, 298, 0], [.14, 118, 291, 14], [.24, 98, 262, 47], [.32, 114, 277, 20],
  [.36, 176, 291, -4.5], [.49, 205, 251, -39], [.62, 196, 262, -26], [.76, 174, 285, -11],
  [.89, 153, 298, 2], [1, 140, 298, 0]
];
const plantFoot = [[0, 175, 297, 0], [.76, 175, 297, 0], [.89, 168, 290, 13], [1, 173, 297, 0]];

function strikerLegAnimation(mode) {
  // The foot's trajectory is solved in stage coordinates before converting to joint rotations.
  // The opposite boot stays on the same patch of turf as the torso moves during the strike.
  const tracks = { body: [], nearLeg: [], nearShin: [], nearBoot: [], farLeg: [], farShin: [], farBoot: [] };
  const run = mode === 'Run';
  const count = 50;
  const format = number => number.toFixed(3);
  for (let index = 0; index <= count; index++) {
    const progress = index / count;
    const [x, y] = interpolate(run ? runBody : strikeBody, progress);
    const at = index * 100 / count + '%';
    tracks.body.push(`${at}{transform:translate(${format(x)}px,${format(y)}px)}`);
    for (const side of ['near', 'far']) {
      let target;
      if (run) {
        const phase = side === 'near' ? progress : (progress + .5) % 1;
        const [offset, lift, pitch] = interpolate(runFoot, phase);
        target = side === 'near' ? [126 + offset, 298 + lift, pitch] : [151 + offset, 297 + lift, pitch];
      } else {
        target = interpolate(side === 'near' ? strikeFoot : plantFoot, progress);
      }
      const joints = solveLeg(side, target, [x, y]);
      ['Leg', 'Shin', 'Boot'].forEach((joint, jointIndex) => {
        tracks[side + joint].push(`${at}{transform:rotate(${format(joints[jointIndex])}deg)}`);
      });
    }
  }
  return Object.entries(tracks).map(([part, frames]) => `@keyframes cgStriker${mode}${part[0].toUpperCase() + part.slice(1)}{${frames.join('')}}`).join('\n');
}

const strikerMotion = `
  .cg-striker-shadow { transform-origin: 154px 313px; }
  .cg-striker-body { transform-origin: 148px 213px; }
  .cg-striker-trunk { transform-origin: 149px 212px; animation: cgStrikerBreathe 1.9s ease-in-out infinite; }
  .cg-striker-skull { transform-origin: 152px 135px; }
  .cg-striker-hair-tip { transform-origin: 135px 58px; }
  .cg-striker-eye { transform-box: fill-box; transform-origin: center; animation: cgStrikerBlink 5.1s infinite; }
  .cg-striker-far-arm { transform-origin: 173px 152px; }
  .cg-striker-near-arm { transform-origin: 120px 157px; }
  .cg-striker-far-fore { transform-origin: 189px 181px; }
  .cg-striker-near-fore { transform-origin: 106px 185px; }
  .cg-striker-far-leg { transform-origin: 160px 215px; }
  .cg-striker-near-leg { transform-origin: 132px 216px; }
  .cg-striker-far-shin { transform-origin: 174px 252px; }
  .cg-striker-near-shin { transform-origin: 128px 253px; }
  .cg-striker-far-boot { transform-origin: 175px 297px; }
  .cg-striker-near-boot { transform-origin: 129px 298px; }
  .cg-striker-cheer { opacity: 0; }

  .caller-performer[data-motion="run"] .cg-striker-body { animation: cgStrikerRunBody .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-trunk { animation: cgStrikerLean .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-near-leg { animation: cgStrikerRunNearLeg .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-far-leg { animation: cgStrikerRunFarLeg .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-near-shin { animation: cgStrikerRunNearShin .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-far-shin { animation: cgStrikerRunFarShin .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-near-boot { animation: cgStrikerRunNearBoot .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-far-boot { animation: cgStrikerRunFarBoot .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-near-arm { animation: cgStrikerNearDrive .48s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-striker-far-arm { animation: cgStrikerFarDrive .48s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-striker-near-fore { animation: cgStrikerNearForeDrive .48s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-striker-far-fore { animation: cgStrikerFarForeDrive .48s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-striker-skull { animation: cgStrikerStabilizeHead .48s linear infinite; }
  .caller-performer[data-motion="run"] .cg-striker-hair-tip { animation: cgStrikerHair .18s ease-in-out infinite alternate; }
  .caller-performer[data-motion="run"] .cg-striker-shadow { animation: cgStrikerRunShadow .48s linear infinite; }
  .caller-performer[data-motion="run"][data-gait="paced"] .cg-striker :is(.cg-striker-body,.cg-striker-trunk,.cg-striker-near-leg,.cg-striker-far-leg,.cg-striker-near-shin,.cg-striker-far-shin,.cg-striker-near-boot,.cg-striker-far-boot,.cg-striker-near-arm,.cg-striker-far-arm,.cg-striker-near-fore,.cg-striker-far-fore,.cg-striker-skull,.cg-striker-shadow) {
    animation-delay: var(--caller-gait-time, 0s);
    animation-play-state: paused;
  }

  .caller-performer[data-motion="fake"] .cg-striker-body { animation: cgStrikerCheck .69s ease-in-out both; }
  .caller-performer[data-motion="fake"] .cg-striker-near-leg { animation: cgStrikerFeint .69s ease-in-out both; }
  .caller-performer[data-motion="fake"] .cg-striker-near-shin { animation: cgStrikerFeintShin .69s ease-in-out both; }
  .caller-performer[data-motion="fake"] .cg-striker-near-arm { animation: cgStrikerCheckArm .69s ease-in-out both; }
  .caller-performer[data-motion="fake"] .cg-striker-skull { animation: cgStrikerLook .69s ease-in-out both; }
  .caller-performer:is([data-motion="fake"],[data-motion="win"]) .cg-striker-trunk { animation: none; }

  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-body { animation: cgStrikerStrikeBody .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-near-leg { animation: cgStrikerStrikeNearLeg .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-near-shin { animation: cgStrikerStrikeNearShin .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-near-boot { animation: cgStrikerStrikeNearBoot .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-far-leg { animation: cgStrikerStrikeFarLeg .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-far-shin { animation: cgStrikerStrikeFarShin .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-far-boot { animation: cgStrikerStrikeFarBoot .70s linear both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-trunk { animation: cgStrikerStrikeTorso .70s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-skull { animation: cgStrikerTrackBall .70s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-near-arm { animation: cgStrikerBalance .70s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-far-arm { animation: cgStrikerBalanceFar .70s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="kick"]) .cg-striker-near-fore { animation: cgStrikerStrikeElbow .70s both; }

  .caller-performer[data-motion="win"] .cg-striker-body { animation: cgStrikerJump 1.08s ease-in-out 2; }
  .caller-performer[data-motion="win"] .cg-striker-near-arm { animation: cgStrikerCheerNear 1.08s ease-in-out 2; }
  .caller-performer[data-motion="win"] .cg-striker-far-arm { animation: cgStrikerCheerFar 1.08s ease-in-out 2; }
  .caller-performer[data-motion="win"] .cg-striker-near-leg { animation: cgStrikerCheerLeg 1.08s ease-in-out 2; }
  .caller-performer[data-motion="win"] .cg-striker-neutral { opacity: 0; }
  .caller-performer[data-motion="win"] .cg-striker-cheer { opacity: 1; }
  .caller-performer[data-motion="win"] .cg-striker-shadow { animation: cgStrikerShadow 1.08s ease-in-out 2; }

  @keyframes cgStrikerBreathe { 50% { transform: rotate(1.6deg) translateY(-2px); } }
  @keyframes cgStrikerBlink { 0%, 38%, 42%, 78%, 82%, 100% { scale: 1; } 40%, 80% { scale: 1 .08; } }
  @keyframes cgStrikerLean { 0%, 50%, 100% { transform: rotate(12deg); } 16%, 66% { transform: rotate(17deg) skewX(-1.6deg); } 37%, 84% { transform: rotate(13deg); } }
  @keyframes cgStrikerStabilizeHead { 0%,50%,100% { transform: rotate(-9deg); } 16%, 66% { transform: rotate(-14deg) translateY(-2px); } }
  @keyframes cgStrikerNearDrive { 0%,100% { transform: rotate(41deg); } 45% { transform: rotate(-52deg); } }
  @keyframes cgStrikerFarDrive { 0%,100% { transform: rotate(-32deg); } 50% { transform: rotate(43deg); } }
  @keyframes cgStrikerNearForeDrive { 0%,100% { transform: rotate(-57deg); } 45% { transform: rotate(-82deg); } }
  @keyframes cgStrikerFarForeDrive { 0%,100% { transform: rotate(-52deg); } 50% { transform: rotate(-23deg); } }
  @keyframes cgStrikerRunShadow { 0%,50%,100% { opacity: .76; } 17%,67% { opacity: .97; transform: scaleX(1.035); } 45%,94% { opacity: .53; transform: scaleX(.83); } }
  @keyframes cgStrikerHair { to { transform: rotate(-10deg); } }
  @keyframes cgStrikerCheck { 28% { transform: translate(-9px,5px) rotate(-12deg); } 56% { transform: translate(10px,-7px) rotate(19deg); } 80% { transform: translate(5px,3px) rotate(-5deg); } }
  @keyframes cgStrikerFeint { 28% { transform: rotate(24deg); } 55% { transform: rotate(-26deg); } 79% { transform: rotate(8deg); } }
  @keyframes cgStrikerFeintShin { 38% { transform: rotate(39deg); } 67% { transform: rotate(10deg); } }
  @keyframes cgStrikerCheckArm { 31% { transform: rotate(39deg); } 69% { transform: rotate(57deg); } }
  @keyframes cgStrikerLook { 45% { transform: rotate(-15deg); } 78% { transform: rotate(9deg); } }
  @keyframes cgStrikerStrikeTorso { 0% { transform: rotate(8deg); } 24% { transform: rotate(-11deg) scaleX(.95); } 36% { transform: rotate(12deg) scaleX(.98); } 52% { transform: rotate(22deg) scaleX(.94); } 78% { transform: rotate(10deg); } 100% { transform: rotate(3deg); } }
  @keyframes cgStrikerTrackBall { 0% { transform: rotate(3deg); } 24% { transform: rotate(21deg) translateY(3px); } 36% { transform: rotate(9deg); } 62% { transform: rotate(-10deg); } 100% { transform: rotate(0); } }
  @keyframes cgStrikerBalance { 15% { transform: rotate(31deg); } 24% { transform: rotate(53deg); } 36% { transform: rotate(77deg); } 53% { transform: rotate(93deg); } 75% { transform: rotate(36deg); } }
  @keyframes cgStrikerBalanceFar { 24% { transform: rotate(-39deg) translateY(-3px); } 36% { transform: rotate(-67deg); } 55% { transform: rotate(-49deg); } 82% { transform: rotate(-7deg); } }
  @keyframes cgStrikerStrikeElbow { 23% { transform: rotate(-24deg); } 36% { transform: rotate(-5deg); } 60% { transform: rotate(-50deg); } 90% { transform: rotate(-17deg); } }
  @keyframes cgStrikerJump { 0%,100% { transform: translateY(0); } 18%,82% { transform: translateY(3px) scaleY(.97); } 48% { transform: translateY(-30px) rotate(-5deg); } }
  @keyframes cgStrikerCheerNear { 0%,100% { transform: rotate(0); } 33%,60% { transform: rotate(117deg); } }
  @keyframes cgStrikerCheerFar { 0%,100% { transform: rotate(0); } 38%,64% { transform: rotate(-126deg); } }
  @keyframes cgStrikerCheerLeg { 45%,60% { transform: rotate(23deg); } }
  @keyframes cgStrikerShadow { 50% { opacity: .42; transform: scaleX(.71); } }

  @media (prefers-reduced-motion: reduce) { .cg-striker * { animation: none !important; } }
` + strikerLegAnimation('Run') + '\n' + strikerLegAnimation('Strike');

export function strikerMarkup() {
  const id = 'striker' + ++artworkId;
  const paint = key => `url(#${id}-${key})`;
  return `<svg class="cg-striker" viewBox="0 0 300 330" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <style>${strikerMotion}</style>
    <defs>
      ${linear(id + '-skin', [[0, '#fff1cb'], [.32, '#ffd29d'], [.66, '#e49b6b'], [.9, '#a66050'], [1, '#c18c61']], '16% 6% 83% 100%')}
      ${linear(id + '-skin-shadow', [[0, '#f4bc89'], [.46, '#cb8c68'], [1, '#8f514b']])}
      ${linear(id + '-hair', [[0, '#57698c'], [.22, '#384962'], [.61, '#1c263d'], [.85, '#131c2e'], [1, '#253747']])}
      ${linear(id + '-jersey', [[0, '#fff8b8'], [.29, '#f9d86c'], [.65, '#dfa439'], [.88, '#a05f24'], [1, '#b8843e']])}
      ${linear(id + '-shorts', [[0, '#577187'], [.46, '#2f465d'], [.8, '#1a2c45'], [1, '#2e4856']])}
      ${linear(id + '-socks', [[0, '#fbf7e4'], [.42, '#edf4f4'], [1, '#90a8be']])}
      ${linear(id + '-boot', [[0, '#b2ffe3'], [.27, '#63c8ad'], [.65, '#26786f'], [1, '#123c51']])}
      ${linear(id + '-iris', [[0, '#473249'], [.55, '#733f49'], [1, '#aa6847']])}
      <radialGradient id="${id}-blush"><stop stop-color="#ed6c67" stop-opacity=".62"/><stop offset="1" stop-color="#ed6c67" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-face-bounce" cx="45%" cy="100%" r="73%"><stop stop-color="#ffdc9f" stop-opacity=".43"/><stop offset="1" stop-color="#ffdc9f" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-shadow"><stop stop-color="#05192b" stop-opacity=".68"/><stop offset="1" stop-color="#05192b" stop-opacity="0"/></radialGradient>
      <pattern id="${id}-mesh" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".62" fill="#773c20" opacity=".18"/></pattern>
    </defs>

    <ellipse class="cg-striker-shadow" cx="154" cy="316" rx="82" ry="10" fill="${paint('shadow')}"/>
    <g class="cg-striker-body" stroke="#253043" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <g class="cg-striker-far-leg">
        <path d="M145 205q22-11 30 6l8 28q-9 17-27 15l-13-23Z" fill="${paint('shorts')}"/>
        <path d="m165 221 9 21" stroke="#e6a344" stroke-width="3" opacity=".82"/>
        <g class="cg-striker-far-shin">
          <path d="M161 248q10 3 18-7l1 23-13 4Z" fill="${paint('skin-shadow')}"/>
          <path d="M163 263q10 4 17-1l3 34-14 8-7-9Z" fill="${paint('socks')}"/>
          <path d="m164 271 15-2m-15 8 16-2" stroke="#526889" stroke-width="2.1"/>
          <g class="cg-striker-far-boot">
            <path d="M169 297q8 1 14-5l8 7 14 3q7 3 8 8 1 6-10 6h-32q-7-1-7-8Z" fill="${paint('boot')}"/>
            <path d="M166 309q23 3 43-1l1 4-5 4h-34Z" fill="#21394d"/>
            <path d="m182 299 6 4m-2-5 6 3" stroke="#a1f0c5" stroke-width="1.4"/>
            <circle data-run-contact="far" cx="172" cy="316" r="1" fill="none" stroke="none"/>
          </g>
        </g>
      </g>

      <g class="cg-striker-trunk">
        <g class="cg-striker-far-arm">
          <path d="M163 148q11-7 20 1l15 24-13 11-18-16Z" fill="${paint('jersey')}"/>
          <path d="m181 176 13-10 5 7-14 11Z" fill="#fcf4d6"/>
          <g class="cg-striker-far-fore">
            <path d="M187 176q5-5 10-1l8 8 8-2q6 1 9 7l-2 5-7 2-8-2q-13 0-20-8Z" fill="${paint('skin-shadow')}"/>
            <path d="m211 188 4 2m-7 1 4 2" fill="none" stroke="#985848" stroke-width="1.1"/>
          </g>
        </g>
        <path d="M128 135q6 4 22 2l7 8 21 4q9 11 5 24l-6 34 3 12q-28 17-66 3l-4-33q-6-25 3-36Z" fill="${paint('jersey')}"/>
        <path d="M116 167q6 29 1 51 16 6 43 1l3 6q-29 10-49-3Z" fill="#aa5551" opacity=".34" stroke="none"/>
        <path d="m117 200 63-28-2 14-59 26Zm2 14 59-26-2 6-53 24Z" fill="#ffed94" opacity=".62" stroke="none"/>
        <path d="M123 170q14-13 48-8l3 44q-31 18-53 6Z" fill="${paint('mesh')}" stroke="none"/>
        <path d="M124 151q15 8 32-1l12-6-10-6-26-2Z" fill="#fff8d9"/>
        <path d="M137 128v16q13 9 23-1l-1-17Z" fill="${paint('skin')}"/>
        <path d="M134 142q10 8 20 4l6-5 6 5-13 13-10-2-16-14Z" fill="#345372"/>
        <path d="M166 171q6-4 13-3l-1 10-8 5-6-5Z" fill="#f9efbf" stroke-width="1.5"/>
        <path d="m170 176 2-3 2 3 3-1-2 3h-5l-2-3Z" fill="#489080" stroke="none"/>
        <path d="M126 215q15 5 44-3m-41-17 8 1" fill="none" stroke="#ad5d36" stroke-width="1.4" opacity=".68"/>
        <path d="M116 159q-5 8-2 18m12-29 8-2m-15 71q8 5 12 5m37-71 8 5" stroke="#fff2b1" stroke-width="1.45" opacity=".63" fill="none"/>
        <g class="cg-striker-near-arm">
          <path d="M115 149q11-6 19 6 4 7 1 13l-12 17-17-7 3-17Z" fill="${paint('jersey')}"/>
          <path d="m107 175 18 6-4 7-17-7Z" fill="#fff5d6"/>
          <g class="cg-striker-near-fore">
            <path d="M105 182q7 0 16 5l-5 13 3 5q3 6-3 11l-8 1-7-4 1-9-2-11Z" fill="${paint('skin')}"/>
            <path d="m103 206 5 3m1-3 6 2m-9 5 6 1" fill="none" stroke="#a65e50" stroke-width="1.2"/>
            <path d="m108 186-3 11" fill="none" stroke="#ffe6b7" stroke-width="2" opacity=".66"/>
          </g>
        </g>
        <g class="cg-striker-skull">
          <path d="M105 78q14-27 48-31 32 0 46 23l-9 42-16 16-51 6-20-20Z" fill="${paint('hair')}"/>
          <path d="M112 96q-12-9-17 3-2 12 12 19l8-1Z" fill="${paint('skin-shadow')}"/>
          <path d="M112 80q14-23 45-25 30 2 34 26l2 15 5 7-1 6-8 3q-2 14-14 23-9 7-26 6-21-3-32-18-10-15-5-43Z" fill="${paint('skin')}"/>
          <path d="M113 105q10 8 23 7 20 0 26-7 4 6 18 9l7-1q-2 11-13 22-12 8-26 7-26-6-35-25Z" fill="${paint('face-bounce')}" stroke="none"/>
          <path d="M170 76q11 0 18 6m-52 4q9-5 19-3" fill="none" stroke="#302b49" stroke-width="3.1"/>
          <g class="cg-striker-eye">
            <path d="M137 96q8-10 19-3 4 3 3 9-14 5-22-1Zm34-4q7-7 15 0l1 8q-10 4-16-1Z" fill="#fff7e2" stroke-width="1.4"/>
            <ellipse cx="151" cy="98" rx="5.1" ry="6.5" fill="${paint('iris')}" stroke="none"/>
            <ellipse cx="181" cy="96.5" rx="4.3" ry="6" fill="${paint('iris')}" stroke="none"/>
            <ellipse cx="152" cy="98" rx="2.4" ry="4.2" fill="#20213c" stroke="none"/>
            <ellipse cx="182" cy="97" rx="2" ry="3.8" fill="#20213c" stroke="none"/>
            <circle cx="153" cy="95" r="1.65" fill="#fffdf3" stroke="none"/><circle cx="183" cy="94.5" r="1.5" fill="#fffdf3" stroke="none"/>
          </g>
          <path d="m181 97 3 8-4 2" fill="none" stroke="#ba6656" stroke-width="1.2"/>
          <ellipse cx="140" cy="111" rx="17" ry="10" fill="${paint('blush')}" stroke="none"/>
          <ellipse cx="187" cy="109" rx="8" ry="6" fill="${paint('blush')}" stroke="none"/>
          <path d="M158 115q12 4 24-3-4 12-14 12-6-1-10-6Z" fill="#683943" class="cg-striker-neutral" stroke="#884852" stroke-width="1.1"/>
          <path d="M163 116q12 0 16-3l-3 5-11 1Z" fill="#fff3da" class="cg-striker-neutral" stroke="none"/>
          <g class="cg-striker-cheer" stroke-width="1.3">
            <path d="M155 112q15 5 28-3l-3 11q-4 9-13 7-9-1-12-15Z" fill="#713c50" stroke="#884852"/>
            <path d="M158 114q13 3 23-3l-3 6q-11 7-18 0Z" fill="#fff7dc" stroke="none"/>
            <path d="M165 126q3-6 11-4l2 2-4 3Z" fill="#f78982" stroke="none"/>
          </g>
          <path d="M98 103q7-3 11 8" fill="none" stroke="#b76d53" stroke-width="1.3"/>
          <path d="M105 95q3 4 8 6l1-16 11 7q-1-7 3-13l10 5-1-11q11 5 24 4l-7-8q17 3 29-6l8 6q6-13-5-24-16-16-43-11-32-1-43 19-8 15 5 42Z" fill="${paint('hair')}"/>
          <g class="cg-striker-hair-tip">
            <path d="M101 63q-6-10-20-11 14-11 29-6-4-8-12-12 16-4 28 6 1-13 15-20-4 10 4 17 24-6 40 9-19-5-36 3-39 1-48 14Z" fill="${paint('hair')}"/>
            <path d="M98 49q11-2 24 4 12-13 35-13m-44 24q12-12 25-13m-5 20q15-3 27-9" fill="none" stroke="#8fabc4" stroke-width="2" opacity=".35"/>
          </g>
          <path d="M118 122q7 11 27 16" stroke="#ffdbb8" stroke-width="2.1" opacity=".69" fill="none"/>
        </g>
      </g>

      <g class="cg-striker-near-leg">
        <path d="M116 215q20 9 44 0l-5 15-10 20-26-1-6-22Z" fill="${paint('shorts')}"/>
        <path d="M119 219q6 10 8 23m21-21-5 20" fill="none" stroke="#e5b251" stroke-width="2.5"/>
        <path d="M118 245q13 3 28-1l-3 8-24 1Z" fill="#f6eed0"/>
        <g class="cg-striker-near-shin">
          <path d="M120 250q10 5 21 0l-2 18-18 1Z" fill="${paint('skin')}"/>
          <path d="M119 263q12 4 21-1l-1 39-18 5-5-17Z" fill="${paint('socks')}"/>
          <path d="M120 271q11 4 19-1m-20 7 19-1" stroke="#5a7899" stroke-width="2"/>
          <path d="M121 283v14" stroke="#f5fffa" stroke-width="1.25" opacity=".74"/>
          <g class="cg-striker-near-boot">
            <path d="M120 297q10 3 18-5l11 8 17 2q9 1 12 9 0 6-9 7h-45q-10-1-10-8Z" fill="${paint('boot')}"/>
            <path d="M115 310q25 5 61-1l1 4-6 5h-47Z" fill="#23394f"/>
            <path d="M130 319v2m17-2v2m17-2v2" stroke="#294256" stroke-width="3.1"/>
            <path d="m140 298 7 4m-2-5 9 4m-13 2 11 3m-22-4 7 5" stroke="#e3ffe8" stroke-width="1.7"/>
            <path d="m158 305 9 1" stroke="#e3ffe8" stroke-width="1.3" opacity=".7"/>
            <circle data-kick-contact cx="177" cy="309" r="1" fill="none" stroke="none"/>
            <circle data-run-contact="near" cx="126" cy="318" r="1" fill="none" stroke="none"/>
          </g>
        </g>
      </g>
    </g>
  </svg>`;
}

const keeperMotion = `
  .cg-keeper-mirror { transform-origin: 150px 165px; }
  .cg-keeper-shadow { transform-origin: 150px 316px; }
  .cg-keeper-body { transform-origin: 150px 208px; animation: cgKeeperReady 1.6s ease-in-out infinite; }
  .cg-keeper-trunk { transform-origin: 150px 209px; }
  .cg-keeper-skull { transform-origin: 150px 140px; animation: cgKeeperScan 3.7s ease-in-out infinite; }
  .cg-keeper-eyes { transform-box: fill-box; transform-origin: center; animation: cgKeeperBlink 4.8s 1s infinite; }
  .cg-keeper-reach { transform-origin: 111px 158px; animation: cgKeeperGloves .9s ease-in-out infinite alternate; }
  .cg-keeper-reach-right { animation-delay: -.48s; }
  .cg-keeper-elbow { transform-origin: 77px 180px; }
  .cg-keeper-leg { transform-origin: 128px 222px; }
  .cg-keeper-knee { transform-origin: 114px 251px; }
  .cg-keeper-surprise { opacity: 0; }

  .caller-performer[data-direction="left"] .cg-keeper-mirror { transform: scaleX(-1); }
  .caller-performer[data-motion="run"] .cg-keeper-body { animation: cgKeeperHop .65s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-keeper-leg { animation: cgKeeperStep .65s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-keeper-leg-right { animation-delay: -.325s; }
  .caller-performer[data-motion="run"] .cg-keeper-knee { animation: cgKeeperReadyKnee .65s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cg-keeper-reach { animation: cgKeeperGloves .65s ease-in-out infinite alternate; }

  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-body { animation: cgKeeperDive .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-trunk { animation: cgKeeperDiveTorso .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-reach { animation: cgKeeperDiveArm .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-reach-right { animation-name: cgKeeperDiveLead; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-elbow { animation: cgKeeperDiveForearm .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-leg { animation: cgKeeperDiveLeg .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-leg-right { animation-name: cgKeeperDiveOtherLeg; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-knee { animation: cgKeeperDiveKnee .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-shadow { animation: cgKeeperDiveShadow .98s both; }
  .caller-performer:is([data-motion="fake"],[data-motion="dive"]) .cg-keeper-skull { animation: cgKeeperDiveFace .98s both; }

  .caller-performer:is([data-motion="focus"],[data-motion="catch"]) .cg-keeper-body { animation: cgKeeperReach .73s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="catch"]) .cg-keeper-reach { animation: cgKeeperFocusArm .73s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="catch"]) .cg-keeper-reach-right { animation-name: cgKeeperFocusLead; }
  .caller-performer:is([data-motion="focus"],[data-motion="catch"]) .cg-keeper-elbow { animation: cgKeeperSoften .73s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="catch"]) .cg-keeper-leg { animation: cgKeeperStepIn .73s both; }
  .caller-performer:is([data-motion="focus"],[data-motion="catch"]) .cg-keeper-leg-right { animation-name: cgKeeperStepThrough; }
  .caller-performer[data-motion="win"] .cg-keeper-body { animation: cgKeeperSit 1s both; }
  .caller-performer[data-motion="win"] .cg-keeper-reach { animation: cgKeeperHandsUp 1s both; }
  .caller-performer[data-motion="win"] .cg-keeper-elbow { animation: cgKeeperHandsBend 1s both; }
  .caller-performer[data-motion="win"] .cg-keeper-skull { animation: cgKeeperUhOh 1s both; }
  .caller-performer[data-motion="win"] .cg-keeper-neutral { opacity: 0; }
  .caller-performer[data-motion="win"] .cg-keeper-surprise { opacity: 1; }

  @keyframes cgKeeperReady { 50% { transform: translateY(3px) scaleY(.974); } }
  @keyframes cgKeeperScan { 18%, 48% { transform: rotate(-3deg); } 76%, 92% { transform: rotate(3.5deg) translateX(2px); } }
  @keyframes cgKeeperBlink { 0%, 73%, 79%, 100% { scale: 1; } 76% { scale: 1 .05; } }
  @keyframes cgKeeperGloves { to { transform: rotate(5deg); } }
  @keyframes cgKeeperHop { 0%,100% { transform: translate(-3px,3px) scaleY(.972); } 18%,68% { transform: translate(0,-4px) scaleY(1.008); } 50% { transform: translate(3px,3px) scaleY(.972); } }
  @keyframes cgKeeperStep { 0%,100% { transform: rotate(3deg); } 18% { transform: rotate(-4deg); } 52% { transform: rotate(1deg); } }
  @keyframes cgKeeperReadyKnee { 0%,50%,100% { transform: rotate(-3deg); } 18%,68% { transform: rotate(4deg); } }
  @keyframes cgKeeperDive {
    0% { transform: none; }
    14% { transform: translate(-8px,8px) rotate(-4deg) scaleY(.93); animation-timing-function: cubic-bezier(.76,.15,.86,.61); }
    24% { transform: translate(9px,-5px) rotate(23deg) scaleY(1.03); animation-timing-function: cubic-bezier(.14,.63,.32,1); }
    48% { transform: translate(47px,-26px) rotate(74deg); animation-timing-function: cubic-bezier(.55,.08,.9,.64); }
    65% { transform: translate(65px,48px) rotate(84deg); animation-timing-function: cubic-bezier(.6,.31,.8,.52); }
    74% { transform: translate(71px,83px) rotate(90deg) scaleX(1.025); }
    81% { transform: translate(75px,82px) rotate(82deg); }
    89% { transform: translate(64px,65px) rotate(59deg); }
    100% { transform: translate(56px,40px) rotate(31deg); }
  }
  @keyframes cgKeeperDiveTorso { 14% { transform: rotate(-5deg) scaleX(.98); } 24% { transform: rotate(9deg); } 48% { transform: rotate(7deg) scaleX(.93); } 74% { transform: rotate(-6deg) scaleX(.96); } 100% { transform: rotate(-3deg); } }
  @keyframes cgKeeperDiveArm { 14% { transform: rotate(24deg); } 24% { transform: rotate(38deg); } 48%,65% { transform: rotate(112deg); } 74% { transform: rotate(83deg); } 89%,100% { transform: rotate(58deg); } }
  @keyframes cgKeeperDiveLead { 14% { transform: rotate(-16deg); } 24% { transform: rotate(35deg); } 48%,64% { transform: rotate(68deg); } 74% { transform: rotate(39deg); } 89%,100% { transform: rotate(31deg); } }
  @keyframes cgKeeperDiveForearm { 14% { transform: rotate(26deg); } 24% { transform: rotate(8deg); } 48%,64% { transform: rotate(-17deg); } 74% { transform: rotate(24deg); } 100% { transform: rotate(38deg); } }
  @keyframes cgKeeperDiveLeg { 14% { transform: rotate(10deg) translate(1px,-1px); } 24% { transform: rotate(-10deg); } 48% { transform: rotate(-23deg); } 74% { transform: rotate(-16deg); } 100% { transform: rotate(-12deg); } }
  @keyframes cgKeeperDiveOtherLeg { 14% { transform: rotate(14deg); } 24% { transform: rotate(3deg) translateY(4px); } 48% { transform: rotate(-27deg); } 74% { transform: rotate(-9deg); } 100% { transform: rotate(-23deg); } }
  @keyframes cgKeeperDiveKnee { 14% { transform: rotate(12deg); } 24% { transform: rotate(-9deg); } 48% { transform: rotate(-4deg); } 76% { transform: rotate(24deg); } 100% { transform: rotate(43deg); } }
  @keyframes cgKeeperDiveFace { 14% { transform: rotate(5deg); } 24% { transform: rotate(-8deg); } 48% { transform: rotate(-22deg); } 74% { transform: rotate(-15deg); } 100% { transform: rotate(-9deg); } }
  @keyframes cgKeeperDiveShadow { 24% { transform: translateX(12px); opacity: .82; } 48% { transform: translateX(51px) scaleX(1.33); opacity: .45; } 74% { transform: translateX(86px) scale(1.42,1.3); opacity: 1; } 100% { transform: translateX(53px) scaleX(1.21); opacity: .88; } }
  @keyframes cgKeeperReach { 0% { transform: none; } 15% { transform: translate(-5px,6px) rotate(-5deg) scaleY(.946); } 41% { transform: translate(22px,-12px) rotate(30deg); } 67% { transform: translate(24px,12px) rotate(21deg) scaleY(.928); } 100% { transform: translate(19px,5px) rotate(9deg); } }
  @keyframes cgKeeperFocusArm { 14% { transform: rotate(16deg); } 42% { transform: rotate(64deg); } 67% { transform: rotate(47deg); } 100% { transform: rotate(27deg); } }
  @keyframes cgKeeperFocusLead { 14% { transform: rotate(1deg); } 42% { transform: rotate(54deg); } 67% { transform: rotate(29deg); } 100% { transform: rotate(15deg); } }
  @keyframes cgKeeperSoften { 14% { transform: rotate(18deg); } 42% { transform: rotate(-14deg); } 67%,100% { transform: rotate(37deg); } }
  @keyframes cgKeeperStepIn { 15% { transform: rotate(7deg); } 42% { transform: rotate(-8deg); } 67%,100% { transform: rotate(13deg); } }
  @keyframes cgKeeperStepThrough { 15% { transform: rotate(11deg); } 42% { transform: rotate(-19deg); } 67%,100% { transform: rotate(4deg); } }
  @keyframes cgKeeperSit { 22% { transform: translateY(-10px) rotate(-7deg); } 62% { transform: translateY(8px) scaleY(.95); } 100% { transform: translateY(4px) scaleY(.98); } }
  @keyframes cgKeeperHandsUp { 40%,100% { transform: rotate(74deg); } }
  @keyframes cgKeeperHandsBend { 40%,100% { transform: rotate(47deg); } }
  @keyframes cgKeeperUhOh { 28% { transform: rotate(-8deg) scale(1.06); } 70% { transform: rotate(7deg); } 100% { transform: rotate(-2deg); } }

  @media (prefers-reduced-motion: reduce) { .cg-keeper * { animation: none !important; } }
`;

function keeperArm(paint, right = false) {
  const arm = `<g class="cg-keeper-reach${right ? ' cg-keeper-reach-right' : ''}">
    <path d="M111 147q-13-2-24 7l-15 18 13 15 32-17Z" fill="${paint('jersey')}"/>
    <path d="m79 165 13 13-7 8-14-14Z" fill="#ffe292"/>
    <g class="cg-keeper-elbow">
      <path d="M73 173q9-1 17 11l-12 16-15-8Z" fill="${paint('skin')}"/>
      <path d="M77 182q-2 10-10 16l-12-5 7-16Z" fill="#242b50"/>
      <path d="M70 182q1 10-10 14l-10-5 5-15Z" fill="#bedaf0"/>
      <path d="M58 179q3-6-1-11-4-4-8 3l-2 4-5-16q-2-5-6-4-4 2-1 9l3 12-13-9q-6-4-8 1-1 3 4 8l8 8-9-2q-6 0-6 5 1 4 9 5-3 4 2 7l12 4q11 2 17-5l6-10Z" fill="${paint('glove')}"/>
      <path d="m29 186 8 1q4 2 4 7m-2-15 6 3m0 12q5-1 8-5" stroke="#6e95bd" stroke-width="1.2" fill="none"/>
      <path d="M40 174q5 4 8 13l-11 3-6-7Z" fill="#6be0d2" opacity=".8" stroke-width="1.1"/>
      <path d="M28 164q3 0 5 2m7-5 2 6m-22 8 8 7" stroke="#fff8e5" opacity=".82" fill="none" stroke-width="1.6"/>
    </g>
  </g>`;
  return right ? `<g transform="translate(300 0) scale(-1 1)">${arm}</g>` : arm;
}

function keeperLeg(paint, right = false) {
  const leg = `<g class="cg-keeper-leg${right ? ' cg-keeper-leg-right' : ''}">
    <path d="M112 214q16-8 34 3l-7 20-12 20-28-4-1-14Z" fill="${paint('shorts')}"/>
    <path d="m104 229 7 16-5 8m7-6 17 3" stroke="#b9a6ff" stroke-width="2" fill="none"/>
    <g class="cg-keeper-knee">
      <path d="m100 251 24 2-4 17-21-2-5-5Z" fill="${paint('skin')}"/>
      <path d="M95 262q10 5 23 1l-7 31-17 7-6-7Z" fill="${paint('sock')}"/>
      <path d="m96 271 20-1m-22 6 21-1" stroke="#c5b5ff" opacity=".63" stroke-width="1.7" fill="none"/>
      <path d="M91 294q10 8 20 0l2 13-3 9H70q-13-2-10-9 4-8 28-9Z" fill="${paint('boot')}"/>
      <path d="M62 308q31 5 50-1v5l-5 4H69Z" fill="#252e53"/>
      <path d="m86 298-8 4m13-3-7 5m10-2-5 4" stroke="#d6fbff" stroke-width="1.35" fill="none"/>
      <path d="M78 317v2m24-2v2" stroke="#283451" stroke-width="3"/>
    </g>
  </g>`;
  return right ? `<g transform="translate(300 0) scale(-1 1)">${leg}</g>` : leg;
}

export function keeperMarkup() {
  const id = 'keeper' + ++artworkId;
  const paint = key => `url(#${id}-${key})`;
  return `<svg class="cg-keeper" viewBox="0 0 300 330" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <style>${keeperMotion}</style>
    <defs>
      ${linear(id + '-skin', [[0, '#ffdaae'], [.44, '#d88f62'], [.77, '#a75b48'], [1, '#8b4a47']])}
      ${linear(id + '-hair', [[0, '#856057'], [.38, '#563f4c'], [.77, '#382b42'], [1, '#271e3b']])}
      ${linear(id + '-jersey', [[0, '#e5bcff'], [.35, '#a98bec'], [.63, '#8261d4'], [1, '#442c87']])}
      ${linear(id + '-shorts', [[0, '#664e9f'], [.36, '#4f3e81'], [1, '#272747']])}
      ${linear(id + '-sock', [[0, '#9c88ec'], [1, '#373262']])}
      ${linear(id + '-glove', [[0, '#fffbed'], [.57, '#e4e9f4'], [1, '#91a1c3']])}
      ${linear(id + '-boot', [[0, '#daeee8'], [.46, '#92dcda'], [.86, '#42889e'], [1, '#385674']])}
      <radialGradient id="${id}-blush"><stop stop-color="#fa6d64" stop-opacity=".62"/><stop offset="1" stop-color="#e66d67" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-shadow"><stop stop-color="#061227" stop-opacity=".65"/><stop offset="1" stop-color="#061227" stop-opacity="0"/></radialGradient>
      <pattern id="${id}-mesh" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".68" fill="#231841" opacity=".14"/></pattern>
    </defs>
    <g class="cg-keeper-mirror">
      <ellipse class="cg-keeper-shadow" cx="150" cy="317" rx="105" ry="10" fill="${paint('shadow')}"/>
      <g class="cg-keeper-body" stroke="#262644" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">
        ${keeperLeg(paint)}
        ${keeperLeg(paint, true)}
        <g class="cg-keeper-trunk">
          ${keeperArm(paint)}
          ${keeperArm(paint, true)}
          <path d="M130 137q14 6 38 0l22 13q10 15 4 36l-6 38q-37 15-73 1l-11-46q-3-21 7-30Z" fill="${paint('jersey')}"/>
          <path d="m112 153 23-9 12 11-35 16Zm43 1 14-12 21 10 4 14Z" fill="#c0aeff" stroke="none"/>
          <path d="M112 191q35 19 80-3l-5 16q-40 20-72-1Zm3 18q31 12 72-1l-1 4q-35 14-69 3Z" fill="#c29dea" opacity=".7" stroke="none"/>
          <path d="M114 170q36-16 79 3l-4 41q-35 18-69 1Z" fill="${paint('mesh')}" stroke="none"/>
          <path d="M133 126h35v19q-17 16-34 1Z" fill="${paint('skin')}"/>
          <path d="M132 140q17 15 37 0l4 7-10 12q-12 3-25-1l-10-11Z" fill="#ffe39c"/>
          <path d="M145 174h6v24m-7 0h16m-13-20 4-5" stroke="#fff0c4" stroke-width="2.2" fill="none" opacity=".82"/>
          <path d="M174 164q6-1 9 1l-1 8-4 4-5-3Z" fill="#ffe198" stroke-width="1.4"/>
          <path d="m177 169 2-2 2 2-2 4Z" fill="#7655a6" stroke="none"/>
          <path d="M120 219q31 8 61-1" stroke="#4e3988" stroke-width="1.65" fill="none"/>

          <g class="cg-keeper-skull">
            <path d="M102 80q7-38 47-45 38 0 51 34l-3 37-13 16-61 3-25-22Z" fill="${paint('hair')}"/>
            <path d="M105 91q-13-7-17 3-3 12 14 18l7-6Zm91 1q13-7 16 3 4 8-13 17l-7-6Z" fill="${paint('skin')}"/>
            <path d="M105 77q17-24 45-25 35-1 45 23l3 23q-2 23-19 36-12 10-29 9-18 0-30-9-16-13-20-36Z" fill="${paint('skin')}"/>
            <path d="M116 86q10-8 22-3m23 0q12-5 22 3" stroke="#4a3146" stroke-width="2.8" fill="none"/>
            <g class="cg-keeper-eyes">
              <path d="M114 96q6-10 17-8 8 2 11 10-12 9-27 2Z" fill="#fff7e2" stroke-width="1.4"/>
              <path d="M158 98q4-10 15-10 10 1 13 10-12 8-28 2Z" fill="#fff7e2" stroke-width="1.4"/>
              <ellipse cx="131" cy="96" rx="6" ry="7.5" fill="#8c554f" stroke="none"/>
              <ellipse cx="172" cy="96" rx="5.9" ry="7.5" fill="#8c554f" stroke="none"/>
              <ellipse cx="132" cy="96" rx="3.4" ry="5" fill="#3b2a47" stroke="none"/>
              <ellipse cx="173" cy="96" rx="3.4" ry="5" fill="#3b2a47" stroke="none"/>
              <circle cx="133" cy="92.6" r="1.9" fill="#fffce8" stroke="none"/>
              <circle cx="174" cy="92.6" r="1.9" fill="#fffce8" stroke="none"/>
            </g>
            <ellipse cx="120" cy="111" rx="13" ry="8" fill="${paint('blush')}" stroke="none"/>
            <ellipse cx="181" cy="111" rx="13" ry="8" fill="${paint('blush')}" stroke="none"/>
            <path d="m149 98-4 8 3 3 6-2" stroke="#975243" stroke-width="1.4" fill="none"/>
            <g class="cg-keeper-neutral">
              <path d="M137 117q11 5 25-1-4 10-13 11-7 0-12-8Z" fill="#6d3d4c" stroke="#87505a" stroke-width="1.2"/>
              <path d="M142 118q10 2 17-1l-3 4-10 1Z" fill="#ffefcf" stroke="none"/>
            </g>
            <g class="cg-keeper-surprise">
              <path d="M142 121q0-8 7-8 7 1 8 8 2 7-7 8-9-1-8-8Z" fill="#6d3d4c" stroke="#8b545d" stroke-width="1.2"/>
              <path d="M145 126q3-5 9-2l-1 4-5 1Z" fill="#ef7f78" stroke="none"/>
            </g>
            <path d="M94 94q8-1 11 9m101-10q-8 3-10 10" stroke="#995948" stroke-width="1.4" fill="none"/>
            <path d="M103 88q5-9 7-20 9 6 14 0l6-9q6 13 15 10 9-2 14-11 5 11 13 11 5 1 11-5l13 21 4-16q1-10-5-20 5-11-2-19-7-7-17-2-6-13-17-9-10-8-19 2-9-5-17-1-9 0-12 9-13 1-18 11-5 10 5 21Z" fill="${paint('hair')}"/>
            <path d="M104 56q2-9 9-14m6-3q7-9 17-7m10-2q7-8 20-2m6 7q8-4 16 2m-59 18q9 2 15-5" stroke="#d79472" stroke-width="2" opacity=".41" fill="none"/>
            <path d="M105 76q24-8 48-9 24 0 45 9v8q-26-5-47-4-22 1-47 4Z" fill="#f0c772" stroke-width="2.2"/>
            <path d="M112 78q41-8 78-1" stroke="#fff0ae" stroke-width="1.5" opacity=".73" fill="none"/>
            <path d="M117 126q7 9 21 12m40-10q7-4 10-11" stroke="#ffca93" stroke-width="2" opacity=".56" fill="none"/>
          </g>
        </g>
      </g>
    </g>
  </svg>`;
}
