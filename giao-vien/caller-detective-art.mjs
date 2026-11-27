let nextDetective = 0;

const WALK_HEIGHT = 363;
const STRIDE = 84;
const STANCE = .58;
const FEMUR = 39;
const SHIN = 35;
const RAD = Math.PI / 180;
const sequence = (points, phase) => {
  const upper = points.findIndex(([at]) => at >= phase);
  if (upper <= 0) return points[Math.max(0, upper)][1];
  const [fromT, from] = points[upper - 1];
  const [toT, to] = points[upper];
  return from + (to - from) * ((phase - fromT) / (toT - fromT));
};
const round = value => Number(value.toFixed(3));
const weighted = (from, to, unit) =>
  'calc(' + round(from) + unit + ' + ' + round(to - from) + unit + ' * var(--caller-step-weight, 1))';

function bodyPose(phase) {
  const half = (phase * 2) % 1;
  const up = sequence([[0, -.25], [.23, 2.8], [.53, -3.5], [.83, -2.4], [1, -.25]], half);
  return { x: Math.cos(phase * 2 * Math.PI) * 2.7, y: up };
}

function legAt(phase, isNear) {
  const cycle = (phase + (isNear ? 0 : .5)) % 1;
  const foot = isNear ? { x: 174, y: 348 } : { x: 145, y: 348 };
  const hipBase = { x: isNear ? 174 : 144, y: 278 };
  const body = bodyPose(phase);
  const hip = { x: hipBase.x + body.x, y: hipBase.y + body.y };
  const toeAngle = sequence([[0, -14], [.09, 0], [.4, 0], [STANCE, 27], [.7, 7], [.84, -17], [1, -14]], cycle);
  const swing = Math.max(0, (cycle - STANCE) / (1 - STANCE));
  // During stance the foot travels backward by exactly the root travel. In swing it clears the floor.
  const touch = foot.x + 24;
  const lift = Math.sin(Math.PI * swing) * 29;
  const advance = swing * swing * (3 - 2 * swing);
  const ankleX = cycle <= STANCE
    ? touch - STRIDE * cycle
    : touch - STRIDE * STANCE * (1 - advance);
  const soleX = toeAngle >= 0 ? (isNear ? 32 : 25) : -10;
  const ankleY = WALK_HEIGHT - (Math.cos(toeAngle * RAD) * 15 + Math.sin(toeAngle * RAD) * soleX) - lift;
  const dx = ankleX - hip.x;
  const dy = ankleY - hip.y;
  const reach = Math.min(Math.hypot(dx, dy), FEMUR + SHIN - .04);
  const forward = Math.atan2(dy, dx);
  const bend = Math.acos((FEMUR ** 2 + reach ** 2 - SHIN ** 2) / (2 * FEMUR * reach));
  const knee = { x: hip.x + Math.cos(forward - bend) * FEMUR, y: hip.y + Math.sin(forward - bend) * FEMUR };
  const femurAngle = Math.atan2(hip.x - knee.x, knee.y - hip.y) / RAD;
  const shinAngle = Math.atan2(knee.x - ankleX, ankleY - knee.y) / RAD;
  return { hip, hipBase, knee, foot, ankleX, ankleY, femurAngle, shinAngle, toeAngle };
}

function joint(x, y, angle, baseX, baseY) {
  return 'translate(' + weighted(baseX, x, 'px') + ',' + weighted(baseY, y, 'px') + ') rotate(' + weighted(0, angle, 'deg') + ')';
}

function motionFrames(name, pose) {
  // Use a linear clock; the placement, flexion and weight shifts are defined by the gait itself.
  return '@keyframes ' + name + '{' + Array.from({ length: 41 }, (_, frame) => {
    const phase = frame / 40;
    const transform = pose(phase);
    return round(phase * 100) + '%{transform:' + transform + '}';
  }).join('') + '}';
}

function legFrames(isNear) {
  const name = isNear ? 'near' : 'far';
  return [
    motionFrames('cd-walk-' + name + '-femur', phase => {
      const { hip, hipBase, femurAngle } = legAt(phase, isNear);
      return joint(hip.x, hip.y, femurAngle, hipBase.x, hipBase.y);
    }),
    motionFrames('cd-walk-' + name + '-shin', phase => {
      const { knee, hipBase, shinAngle } = legAt(phase, isNear);
      return joint(knee.x, knee.y, shinAngle, hipBase.x, hipBase.y + FEMUR);
    }),
    motionFrames('cd-walk-' + name + '-shoe', phase => {
      const { ankleX, ankleY, toeAngle, foot } = legAt(phase, isNear);
      return joint(ankleX, ankleY, toeAngle, foot.x, foot.y);
    })
  ].join('');
}

const gaitCss = legFrames(false) + legFrames(true) + motionFrames('cd-walk-upper', phase => {
  const body = bodyPose(phase);
  return joint(body.x, body.y, 4 + Math.sin(phase * Math.PI * 2) * 3, 0, 0);
});

const motion = `
  .caller-detective-rig { --cd-cycle: var(--caller-stride, .78s); }
  .cd-figure, .cd-head, .cd-arm, .cd-joint, .cd-scarf, .cd-shadow, .cd-brow,
  .cd-eyes, .cd-glint, .cd-upper, .cd-neck-roll { transform-box: view-box; }
  .cd-figure { transform-origin: 162px 354px; }
  .cd-upper { transform-origin: 166px 290px; animation: cd-breathe 3.4s ease-in-out infinite; }
  .cd-head { transform-origin: 163px 201px; transition: transform .29s cubic-bezier(.3,.65,.28,1); }
  .cd-neck-roll { transform-origin: 157px 204px; transform: scale(.9); }
  .cd-arm-back { transform-origin: 112px 222px; transition: transform .35s cubic-bezier(.22,.85,.35,1.2); }
  .cd-arm-lens { transform-origin: 211px 225px; transition: transform .42s cubic-bezier(.17,.55,.25,1.12); }
  .cd-elbow-lens { transform-origin: 239px 241px; transition: transform .45s cubic-bezier(.17,.55,.24,1.1); }
  .cd-joint { transform-origin: 0 0; }
  .cd-far-femur { transform: translate(144px, 278px); }
  .cd-far-shin { transform: translate(144px, 317px); }
  .cd-far-shoe { transform: translate(145px, 348px); }
  .cd-near-femur { transform: translate(174px, 278px); }
  .cd-near-shin { transform: translate(174px, 317px); }
  .cd-near-shoe { transform: translate(174px, 348px); }
  .cd-scarf { transform-origin: 143px 207px; animation: cd-scarf 2.3s ease-in-out infinite; }
  .cd-shadow { transform-origin: 163px 363px; opacity: .7; }
  .cd-eyes { transform-origin: 167px 139px; animation: cd-blink 5.9s linear infinite; }
  .cd-pupils { animation: cd-saccade 6.7s linear infinite; transition: transform .12s ease-out; }
  .cd-brow { transform-origin: 174px 115px; transition: transform .22s ease; }
  .cd-glint { transform-origin: 290px 158px; animation: cd-glint 3.4s ease-in-out infinite; }
  .cd-mouth-smile, .cd-mouth-o { opacity: 0; transition: opacity .14s; }
  .cd-mouth-rest { transition: opacity .14s; }
  .caller-performer[data-motion=run] :is(.cd-upper,.cd-joint,.cd-arm,.cd-head,.cd-scarf) {
    animation-duration: var(--cd-cycle);
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-delay: 0s;
  }
  .caller-performer[data-locomotion=driven][data-motion=run] :is(.cd-upper,.cd-joint,.cd-arm,.cd-head,.cd-scarf) {
    animation-play-state: paused;
    animation-delay: calc(var(--cd-cycle) * var(--caller-phase, 0) * -1);
  }
  .caller-performer[data-motion=run] .cd-upper { animation-name: cd-walk-upper; }
  .caller-performer[data-motion=run] .cd-near-femur { animation-name: cd-walk-near-femur; }
  .caller-performer[data-motion=run] .cd-near-shin { animation-name: cd-walk-near-shin; }
  .caller-performer[data-motion=run] .cd-near-shoe { animation-name: cd-walk-near-shoe; }
  .caller-performer[data-motion=run] .cd-far-femur { animation-name: cd-walk-far-femur; }
  .caller-performer[data-motion=run] .cd-far-shin { animation-name: cd-walk-far-shin; }
  .caller-performer[data-motion=run] .cd-far-shoe { animation-name: cd-walk-far-shoe; }
  .caller-performer[data-motion=run] .cd-head { animation-name: cd-head-counter; }
  .caller-performer[data-motion=run] .cd-arm-back { animation-name: cd-arm-swing; }
  .caller-performer[data-motion=run] .cd-arm-lens { animation-name: cd-lens-swing; }
  .caller-performer[data-motion=run] .cd-scarf { animation-name: cd-scarf; }
  .caller-performer[data-motion=fake] .cd-upper { animation: cd-double-take .62s cubic-bezier(.17,.74,.32,1) both; }
  .caller-performer[data-motion=fake] .cd-head { transform: rotate(-11deg) translate(-4px,3px); }
  .caller-performer[data-motion=fake] .cd-arm-back { transform: rotate(68deg); }
  .caller-performer[data-motion=fake] .cd-arm-lens { transform: rotate(11deg); }
  .caller-performer[data-motion=fake] .cd-brow { transform: translateY(-6px) rotate(-5deg); }
  .caller-performer[data-motion=fake] .cd-mouth-o { opacity: 1; }
  .caller-performer[data-motion=fake] .cd-mouth-rest,
  .caller-performer[data-motion=win] .cd-mouth-rest { opacity: 0; }
  .caller-performer[data-motion=focus] .cd-upper { animation: cd-peer 1.65s cubic-bezier(.18,.69,.32,1) both; }
  .caller-performer[data-motion=focus] .cd-head { transform: rotate(8deg) translate(3px,8px); }
  .caller-performer[data-motion=focus] .cd-brow { transform: translateY(3px) rotate(5deg); }
  .caller-performer[data-motion=focus] .cd-arm-lens { animation: cd-raise-lens .63s cubic-bezier(.18,.47,.26,1) both; }
  .caller-performer[data-motion=focus] .cd-elbow-lens { transform: rotate(-32deg); }
  .caller-performer[data-motion=focus] .cd-pupils { transform: translate(-2px,2px); animation: none; }
  .caller-performer[data-motion=focus] .cd-glint { animation: cd-find-glint .62s .27s ease-out both; }
  .caller-performer[data-motion=win] .cd-figure { animation: cd-cheer 1.08s cubic-bezier(.26,.82,.3,1) both; }
  .caller-performer[data-motion=win] .cd-shadow { animation: cd-shadow-hop 1.08s ease both; }
  .caller-performer[data-motion=win] .cd-head { transform: rotate(-6deg) translateY(-3px); }
  .caller-performer[data-motion=win] .cd-arm-back { transform: rotate(103deg); }
  .caller-performer[data-motion=win] .cd-arm-lens { transform: rotate(-28deg); }
  .caller-performer[data-motion=win] .cd-mouth-smile { opacity: 1; }
  @keyframes cd-breathe {
    0%,100% { transform: translateY(0) rotate(-.4deg); }
    44% { transform: translateY(-1.25px) rotate(.52deg) scaleY(1.008); }
  }
  @keyframes cd-head-counter {
    0%,100% { transform: rotate(-1deg) translate(2px,-1px); }
    22% { transform: rotate(.9deg) translate(1px,.45px); }
    48% { transform: rotate(-2.3deg) translate(3px,-1.7px); }
    72% { transform: rotate(.8deg) translate(2px,.5px); }
  }
  @keyframes cd-arm-swing {
    0%,100% { transform: rotate(26deg); }
    23% { transform: rotate(6deg); }
    48% { transform: rotate(-22deg); }
    74% { transform: rotate(3deg); }
  }
  @keyframes cd-lens-swing {
    0%,100% { transform: rotate(-10deg); }
    24% { transform: rotate(-3deg); }
    48% { transform: rotate(8deg); }
    72% { transform: rotate(-1deg); }
  }
  @keyframes cd-blink {
    0%,32%,35.2%,71%,74.1%,94%,96.9%,100% { transform: scaleY(1); }
    33.3%,72.1%,95.1% { transform: scaleY(.055); }
  }
  @keyframes cd-saccade {
    0%,17%,90%,100% { transform: translate(0,0); }
    18.7%,37% { transform: translate(3.15px,-.9px); }
    38.3%,64% { transform: translate(-2.4px,1.45px); }
    65.7%,88.6% { transform: translate(1px,.5px); }
  }
  @keyframes cd-scarf {
    0%,100% { transform: rotate(-3deg) scaleX(.96); }
    48% { transform: rotate(6deg) scaleX(1.055); }
  }
  @keyframes cd-glint {
    0%,100% { transform: scale(.9); opacity: .69; }
    50% { transform: scale(1.04); opacity: .98; }
  }
  @keyframes cd-peer {
    0% { transform: none; }
    18% { transform: translate(-2px,1px) rotate(-1.5deg); }
    48% { transform: translate(5px,2px) rotate(4.1deg); }
    69% { transform: translate(3.7px,1.3px) rotate(3.3deg); }
    100% { transform: translate(4.2px,1.5px) rotate(3.5deg); }
  }
  @keyframes cd-raise-lens {
    0% { transform: rotate(0deg); }
    14% { transform: rotate(7deg) translateY(2px); }
    64% { transform: rotate(-28deg) translateY(9px); }
    83% { transform: rotate(-20deg) translateY(11px); }
    100% { transform: rotate(-22deg) translateY(10px); }
  }
  @keyframes cd-find-glint {
    0% { transform: translateX(-14px) scale(.91); opacity: .29; }
    49% { opacity: .89; }
    100% { transform: translateX(6px) scale(.97); opacity: .56; }
  }
  @keyframes cd-double-take {
    0% { transform: rotate(7deg) translateX(4px); }
    52% { transform: rotate(-8deg) translateX(-9px) scaleY(.965); }
    100% { transform: rotate(-3deg) translateX(-3px); }
  }
  @keyframes cd-cheer {
    0%,100% { transform: translateY(0) rotate(0); }
    15% { transform: translateY(5px) scale(1.035,.94); }
    39% { transform: translateY(-30px) scale(.98,1.04) rotate(-5deg); }
    62% { transform: translateY(3px) scale(1.03,.962); }
    78% { transform: translateY(-12px) rotate(3deg); }
  }
  @keyframes cd-shadow-hop {
    0%,100% { transform: scale(1); opacity: .78; }
    40% { transform: scale(.68,.83); opacity: .39; }
  }
  @media(prefers-reduced-motion:reduce) {
    .cd-figure, .cd-figure *, .cd-shadow { animation: none !important; transition-duration: .01ms !important; }
    .caller-performer[data-motion=focus] .cd-arm-lens { transform: rotate(-22deg) translateY(10px); }
  }
  ${gaitCss}
`;

/** Jointed detective. The SVG coordinates keep each pivot consistent at any display size. */
export function detectiveMarkup() {
  const id = `caller-detective-${++nextDetective}`;
  return `
    <svg class="caller-detective-rig" viewBox="0 0 360 380" fill="none" aria-hidden="true" focusable="false">
      <style>${motion}</style>
      <defs>
        <radialGradient id="${id}-shadow">
          <stop stop-color="#140e1c" stop-opacity=".87"/>
          <stop offset=".45" stop-color="#151022" stop-opacity=".37"/>
          <stop offset="1" stop-color="#251124" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${id}-coat" cx=".68" cy=".17" r=".9">
          <stop stop-color="#f0bc7f"/><stop offset=".29" stop-color="#d59a62"/>
          <stop offset=".63" stop-color="#af724d"/><stop offset=".84" stop-color="#86533e"/><stop offset="1" stop-color="#583c3f"/>
        </radialGradient>
        <linearGradient id="${id}-sleeve" x1=".63" y1=".1" x2=".32" y2=".92">
          <stop stop-color="#ecc290"/><stop offset=".46" stop-color="#c18556"/><stop offset=".74" stop-color="#a9694a"/><stop offset="1" stop-color="#6e4541"/>
        </linearGradient>
        <linearGradient id="${id}-pants" x1="0" y1="0" x2="1" y2=".26">
          <stop stop-color="#282e43"/><stop offset=".33" stop-color="#395366"/>
          <stop offset=".57" stop-color="#62717a"/><stop offset=".83" stop-color="#4c5867"/><stop offset="1" stop-color="#303448"/>
        </linearGradient>
        <linearGradient id="${id}-lapel" x1="114" y1="211" x2="173" y2="289" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffda96"/><stop offset=".63" stop-color="#e5a060"/><stop offset="1" stop-color="#a85e46"/>
        </linearGradient>
        <radialGradient id="${id}-skin" cx=".66" cy=".29" r=".79">
          <stop stop-color="#ffdfb4"/><stop offset=".35" stop-color="#f7c49a"/>
          <stop offset=".7" stop-color="#e5a07f"/><stop offset=".88" stop-color="#bc7465"/><stop offset="1" stop-color="#9d615b"/>
        </radialGradient>
        <linearGradient id="${id}-brim-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#3d314b" stop-opacity=".63"/><stop offset="1" stop-color="#624045" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="${id}-hair" x1="92" y1="55" x2="207" y2="179" gradientUnits="userSpaceOnUse">
          <stop stop-color="#633847"/><stop offset=".62" stop-color="#432b3a"/><stop offset="1" stop-color="#231f34"/>
        </linearGradient>
        <linearGradient id="${id}-hat" x1="82" y1="25" x2="221" y2="113" gradientUnits="userSpaceOnUse">
          <stop stop-color="#709f98"/><stop offset=".47" stop-color="#386c73"/><stop offset="1" stop-color="#284252"/>
        </linearGradient>
        <linearGradient id="${id}-band" x1="98" y1="64" x2="235" y2="98" gradientUnits="userSpaceOnUse">
          <stop stop-color="#db9f63"/><stop offset=".55" stop-color="#a55e53"/><stop offset="1" stop-color="#69444d"/>
        </linearGradient>
        <linearGradient id="${id}-cloth" x1="94" y1="190" x2="189" y2="246" gradientUnits="userSpaceOnUse">
          <stop stop-color="#f17f60"/><stop offset=".49" stop-color="#ca564e"/><stop offset="1" stop-color="#7d3e4c"/>
        </linearGradient>
        <linearGradient id="${id}-boot" x1=".41" y1="0" x2=".54" y2="1">
          <stop stop-color="#654d50"/><stop offset=".35" stop-color="#51414a"/>
          <stop offset=".64" stop-color="#392f40"/><stop offset=".82" stop-color="#261f30"/><stop offset="1" stop-color="#1d1d2b"/>
        </linearGradient>
        <linearGradient id="${id}-brass" x1="270" y1="127" x2="323" y2="192" gradientUnits="userSpaceOnUse">
          <stop stop-color="#fff3bb"/><stop offset=".34" stop-color="#f6ce7b"/><stop offset=".67" stop-color="#a96d4b"/><stop offset="1" stop-color="#dca464"/>
        </linearGradient>
        <radialGradient id="${id}-glass" cx=".33" cy=".29" r=".78">
          <stop stop-color="#ecfffe" stop-opacity=".47"/><stop offset=".59" stop-color="#8cd8d1" stop-opacity=".22"/>
          <stop offset="1" stop-color="#417a91" stop-opacity=".68"/>
        </radialGradient>
        <radialGradient id="${id}-flush">
          <stop stop-color="#e77968" stop-opacity=".55"/><stop offset="1" stop-color="#eb8e73" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${id}-iris" x1="159" y1="125" x2="159" y2="149" gradientUnits="userSpaceOnUse">
          <stop stop-color="#935b54"/><stop offset=".54" stop-color="#463847"/><stop offset="1" stop-color="#222838"/>
        </linearGradient>
        <clipPath id="${id}-lens-clip"><circle cx="295" cy="157" r="27"/></clipPath>
      </defs>
      <ellipse class="cd-shadow" cx="167" cy="363" rx="106" ry="13" fill="url(#${id}-shadow)"/>
      <ellipse class="cd-shadow" cx="169" cy="363" rx="59" ry="6.5" fill="url(#${id}-shadow)" opacity=".53"/>
      <g class="cd-figure" stroke-linecap="round" stroke-linejoin="round">
        <g class="cd-leg cd-leg-back">
          <g class="cd-joint cd-far-femur">
            <path d="M-14-6Q-2-14 13-4L12 37q-3 9-14 7l-10-4-4-15Z" fill="url(#${id}-pants)" stroke="#283040" stroke-width="3.8"/>
            <path d="M-10 6q2 19 0 29" stroke="#7f8a8e" stroke-width="1.6" opacity=".32"/>
          </g>
          <g class="cd-joint cd-far-shin">
            <path d="M-10-4q7-6 20 0L8 32q-5 8-16 5l-2-13-2-13Z" fill="url(#${id}-pants)" stroke="#2d2d3f" stroke-width="3.6"/>
            <path d="M-4 5q10-2 13-5M-5 23q6-3 11-1" stroke="#899097" stroke-width="1.4" opacity=".4"/>
          </g>
          <g class="cd-joint cd-far-shoe">
            <path d="M-10-14q9 4 23 0l-1 13c9 3 17 5 18 9 1 4-3 7-14 7l-22-.5q-6-.5-6-5l2-10Z" fill="url(#${id}-boot)" stroke="#241f31" stroke-width="3.5"/>
            <path d="M-8 11q12 2 30 0" stroke="#9f7d63" stroke-width="1.6" opacity=".65"/>
            <circle data-step-contact="far" cx="-10" cy="15" r=".1" opacity="0"/>
          </g>
        </g>
        <g class="cd-leg cd-leg-front">
          <g class="cd-joint cd-near-femur">
            <path d="M-15-6q12-10 30 2l-2 37q-1 11-11 12l-12-4-4-22Z" fill="url(#${id}-pants)" stroke="#282b41" stroke-width="4"/>
            <path d="M5 6q5 16 3 25m-18 4q7-6 19-5" stroke="#8d9194" stroke-width="1.8" opacity=".52"/>
          </g>
          <g class="cd-joint cd-near-shin">
            <path d="M-11-4q8-7 23-1L10 31q-3 9-17 7l-4-16-2-13Z" fill="url(#${id}-pants)" stroke="#2b2c41" stroke-width="3.8"/>
            <path d="M-6 1q6-2 13-1m-10 8q9-4 12-7M-7 26q8-4 15-2" stroke="#a4aba5" stroke-width="1.6" opacity=".59"/>
          </g>
          <g class="cd-joint cd-near-shoe">
            <path d="M-11-15q11 5 25-1l1 14q13 1 21 6c7 5 4 10-5 11l-30 .5q-12 0-13-6l1-12Z" fill="url(#${id}-boot)" stroke="#211f30" stroke-width="4"/>
            <path d="M-8 11q16 3 40 0m-18-12q11-1 19 5" stroke="#b8967b" stroke-width="1.9" opacity=".75"/>
            <path d="M-3-9l12 5m-13-1 11 5m-11 0 8 4" stroke="#d9b291" stroke-width="1.35" opacity=".66"/>
            <path d="M-3 10q5-3 12-2" stroke="#493440" stroke-width="1.4"/>
            <circle data-step-contact="near" cx="-10" cy="15" r=".1" opacity="0"/>
          </g>
        </g>
        <g class="cd-upper">
        <g class="cd-arm cd-arm-back">
          <path d="M112 217q-21-3-31 27l-5 32 23 5 29-51Z" fill="#a5694f" stroke="#513941" stroke-width="4"/>
          <path d="M83 253l-5 16 23 4 6-16Z" fill="#ca8a60"/>
          <path d="M77 269q11 1 23 7l-3 13-24-3Z" fill="#80544a" stroke="#533a42" stroke-width="3.2"/>
          <path d="M75 284c-6 3-9 14-4 22 3 5 15 7 20 1 4-3 5-11 3-18Z" fill="url(#${id}-skin)" stroke="#633d48" stroke-width="3"/>
          <path d="M74 298l2 6m7-7 1 7" stroke="#aa6559" stroke-width="1.7"/>
        </g>
        <path d="M126 204c-21 4-37 17-39 40l5 26-11 46c22 16 54 27 76 18l13-16 11 17c25-1 58-15 60-25l-17-55c8-26-5-45-35-51Z" fill="url(#${id}-coat)" stroke="#573a42" stroke-width="5"/>
        <path d="M87 310q38 24 66 17l17-17 14 17q30-3 52-20l3 4q-17 18-52 25l-17-17-12 16q-35 9-75-17Z" fill="#77484b" opacity=".75"/>
        <path d="M101 263q-2 20-10 39m116-63q7 29 17 55m-118 19q20 10 45 11" stroke="#f3bb76" stroke-width="1.9" opacity=".59"/>
        <path d="M92 277q-2 16-8 31m139-75q3 14-.7 28l12 39m-145 12q26 17 47 17" stroke="#cf976e" stroke-width="1.2" opacity=".82"/>
        <path d="M97 265q10 10 21 13m83-15q10-2 22-7m-112 50 13 3m90-12 14-10" stroke="#623d40" stroke-width="1.5" opacity=".45"/>
        <path d="M115 205q44-22 88 2l-13 48-22 46-40-58Z" fill="#465962" stroke="#634246" stroke-width="3.2"/>
        <path d="M135 206l12 31 18-8-9-27m28 2-8 26 15 5 8-26" fill="#fff0c1" stroke="#aa7356" stroke-width="2.6"/>
        <path d="M146 229q15 4 30-1l-7 42-15 4Z" fill="#315365"/>
        <path d="M116 204l17 19 31 71-38-29 4-11-23-8 4-37Z" fill="url(#${id}-lapel)" stroke="#875342" stroke-width="2.7"/>
        <path d="M202 203l-5 20-28 70 36-28-5-10 19-11-5-33Z" fill="url(#${id}-lapel)" stroke="#875342" stroke-width="2.7"/>
        <path d="M109 206l8 6 18 20m62-11 4-14 12 6m-87 51 21 16" stroke="#ffe5ac" stroke-width="2" opacity=".67"/>
        <path d="M105 283l27 5-3 14-25-4Zm86 4 28-11 3 14-26 11Z" fill="#a6684d" stroke="#865341" stroke-width="2.4"/>
        <path d="M106 285l24 4m63-1 24-10" stroke="#fcc48b" stroke-width="2.3" opacity=".67"/>
        <path d="M164 297l-2 18" stroke="#663f43" stroke-width="2"/>
        <circle cx="181" cy="289" r="4.7" fill="#e9bd75" stroke="#754950" stroke-width="2"/>
        <circle cx="179" cy="306" r="4.7" fill="#e9bd75" stroke="#754950" stroke-width="2"/>
        <path class="cd-scarf" d="M149 201q-17-7-30 7-16 15-37 6l6 8-10 4c26 12 41-9 65-8Z" fill="url(#${id}-cloth)" stroke="#64394b" stroke-width="3"/>
        <path d="M127 197c8-10 46-11 70-1l-6 20q-25 15-62 1Z" fill="url(#${id}-cloth)" stroke="#753e48" stroke-width="3.8"/>
        <path d="M136 208q18 4 41-1m-22 10 31-6" stroke="#f49972" stroke-width="2.7" opacity=".71"/>
        <g class="cd-head"><g class="cd-neck-roll">
          <path d="M95 95c-16 7-20 34-15 55 1 12 9 26 17 35 16 19 37 25 62 24 50-2 82-28 86-64 4-35-18-56-53-66Z" fill="url(#${id}-skin)" stroke="#573847" stroke-width="4.4"/>
          <path d="M94 114c-11-12-22-4-21 13 0 15 7 30 20 29l6-19Z" fill="#ecab87" stroke="#68434b" stroke-width="3.6"/>
          <path d="M82 122q-4 6 6 19" stroke="#be7565" stroke-width="3"/>
          <path d="M82 115q-7-7-8-20-7-18 16-38c30-20 91-24 132 6 16 13 22 29 23 45-12 4-22-3-31-11 1 12-6 17-13 19 2-11-7-24-14-29-3 14-13 21-20 24 3-10 0-18-6-22-8 13-23 21-39 23l9-15c-13 7-27 16-34 28l-4-11-5 13Z" fill="url(#${id}-hair)" stroke="#433042" stroke-width="4.6"/>
          <path d="M95 95c19-16 36-23 58-24m-11 22 12-15m32 7 8 7m26-3 11 9" stroke="#b16a60" stroke-width="2.6" opacity=".57"/>
          <path d="M103 160c17 18 52 29 84 22 17-4 38-19 50-38-4 32-35 57-76 59-24 1-46-8-58-22Z" fill="#c97966" opacity=".23"/>
          <path d="M92 103q58 12 145-1l8 12q4 16 0 24-57-20-151-9Z" fill="url(#${id}-brim-shadow)" opacity=".64"/>
          <path d="M237 151q-4 24-26 41-14 11-26 13" stroke="#ffddab" stroke-width="1.9" opacity=".75"/>
          <ellipse cx="115" cy="155" rx="22" ry="13" fill="url(#${id}-flush)"/>
          <ellipse cx="219" cy="151" rx="22" ry="13" fill="url(#${id}-flush)"/>
          <g class="cd-brow" stroke="#5d3841">
            <path d="M112 124q12-13 30-8m35-2q15-9 28 1" stroke-width="5.2"/>
            <path d="M116 120q12-7 23-5m41-2q9-4 17-2" stroke="#b77765" stroke-width="1.6" opacity=".7"/>
          </g>
          <g class="cd-eyes">
            <path d="M112 135q3-12 17-13c12 0 19 8 18 17-1 10-10 16-22 15-10-1-15-10-13-19Z" fill="#fff7de" stroke="#613e4a" stroke-width="2.9"/>
            <path d="M178 132q4-12 17-14c12-1 21 8 21 17 0 11-9 17-21 18-10 0-19-10-17-21Z" fill="#fff7de" stroke="#613e4a" stroke-width="2.9"/>
            <path d="M113 132q6-12 20-8 8 2 12 7m35-1q8-13 23-9 7 2 11 8" stroke="#ac7871" stroke-width="2.5" opacity=".45"/>
            <g class="cd-pupils">
              <ellipse cx="134" cy="138" rx="8.5" ry="11" fill="url(#${id}-iris)"/>
              <ellipse cx="202" cy="135.5" rx="9" ry="11.5" fill="url(#${id}-iris)"/>
              <ellipse cx="134" cy="137" rx="4.3" ry="6.8" fill="#292237"/>
              <ellipse cx="202" cy="135" rx="4.6" ry="7" fill="#272435"/>
              <circle cx="136.5" cy="132.8" r="2.65" fill="#fffbea"/>
              <circle cx="204.5" cy="130" r="2.8" fill="#fffbea"/>
              <circle cx="130.7" cy="142.8" r="1.25" fill="#b2d3c7"/>
              <circle cx="198.6" cy="140.2" r="1.35" fill="#b2d3c7"/>
            </g>
          </g>
          <path d="M160 143q5-2 10 4c6 7 3 11-5 11-6 0-10-3-8-8" fill="#e39776" stroke="#b66d60" stroke-width="2.1"/>
          <path d="M160 148q2-3 7-1" stroke="#ffddb1" stroke-width="2.2"/>
          <path class="cd-mouth-rest" d="M153 171q13 8 29-2" stroke="#8b4e53" stroke-width="3.4"/>
          <path class="cd-mouth-o" d="M161 174c0-8 11-10 14-3 5 9-11 15-14 3Z" fill="#77434d" stroke="#633947" stroke-width="2.3"/>
          <g class="cd-mouth-smile">
            <path d="M148 167q20 10 39-2-4 20-21 20-11 0-18-18Z" fill="#793e4b" stroke="#613948" stroke-width="2.5"/>
            <path d="M150 168q18 7 34-1-4 7-16 8-12 1-18-7Z" fill="#fff0cd"/>
            <path d="M157 182q5-7 16-4l2 4q-9 5-18 0Z" fill="#e5887d"/>
          </g>
          <path d="M160 192q7 2 17-2" stroke="#ffd3a2" stroke-width="2.3" opacity=".7"/>
          <path d="M89 77l9-38q3-22 19-27c24-7 40 7 56 2 27-9 42-2 49 17l16 48Z" fill="url(#${id}-hat)" stroke="#2e394c" stroke-width="5"/>
          <path d="M108 48q7-27 18-25c13-1 27 9 50 2 16-5 28-3 35 4" stroke="#b0c6a4" stroke-width="3.6" opacity=".56"/>
          <path d="M105 57q23-14 45-12t46 0" stroke="#b0c6a4" stroke-width="2.2" opacity=".32"/>
          <path d="M93 61c42 14 99 9 139-2l7 23c-40 13-108 22-153 6Z" fill="url(#${id}-band)" stroke="#62474e" stroke-width="3.2"/>
          <path d="M98 66q64 18 128-2" stroke="#ffd5a4" stroke-width="2" opacity=".54"/>
          <rect x="193" y="69" width="19" height="12" rx="3" transform="rotate(-7 193 69)" fill="#e9ba70" stroke="#764b4c" stroke-width="2.4"/>
          <path d="M71 76c-15-3-34 3-32 15 4 16 56 24 119 23 52-1 108-11 116-25 7-15-25-22-41-16-35 16-106 20-162 3Z" fill="url(#${id}-hat)" stroke="#30384b" stroke-width="4.8"/>
          <path d="M46 89q18 12 72 15c46 3 96-2 138-16m-173-8c42 12 104 7 150-4" stroke="#96bbb1" stroke-width="3.1" opacity=".65"/>
          <path d="M81 106q86 17 167-8" stroke="#1e3243" stroke-width="2.6" opacity=".61"/>
        </g></g>
        <g class="cd-arm cd-arm-lens">
          <path d="M205 218c12-10 27-1 38 12q10 13-3 29c-15 6-31-9-40-18-10-9-6-14 5-23Z" fill="url(#${id}-sleeve)" stroke="#634446" stroke-width="4"/>
          <path d="M210 221c10 1 17 6 26 16m-15 9 12 8" stroke="#ffcf88" stroke-width="2" opacity=".79"/>
          <g class="cd-arm cd-elbow-lens">
          <path d="M230 240q8-4 12-10l15-15 15 12c-6 22-23 40-35 34-8-2-12-12-7-21Z" fill="url(#${id}-sleeve)" stroke="#634446" stroke-width="3.8"/>
          <path d="M241 240q9-4 15-14m-20 26q6 5 12 0" stroke="#f4bd80" stroke-width="1.9" opacity=".72"/>
          <path d="M247 226l9-12 17 12-7 14q-11-6-19-14Z" fill="#825347" stroke="#583b43" stroke-width="3"/>
          <path d="M253 226l8 6" stroke="#d9a16a" stroke-width="1.8"/>
          <path d="M255 227l28-47 12 8-29 48Z" fill="#754548" stroke="#482e3d" stroke-width="4"/>
          <path d="M261 225l26-42" stroke="#dea46b" stroke-width="3"/>
          <circle cx="295" cy="157" r="36" fill="url(#${id}-brass)" stroke="#523b45" stroke-width="5"/>
          <circle cx="295" cy="157" r="28.6" fill="url(#${id}-glass)" stroke="#916859" stroke-width="2.4"/>
          <g class="cd-glint" clip-path="url(#${id}-lens-clip)">
            <path d="M256 165l44-52 10 5-48 55Zm9 10 47-55 5 5-46 54Z" fill="#f0ffeb" opacity=".42"/>
            <path d="M274 145q5-10 17-13" stroke="#fff9e1" stroke-width="3.1"/>
            <path d="M309 174q6-4 8-10" stroke="#bbfcf2" stroke-width="2.1" opacity=".78"/>
          </g>
          <path d="M264 148q7-26 34-24m21 12a30 30 0 0 1 7 14" stroke="#fff0b1" stroke-width="2.8" opacity=".7"/>
          <path d="M260 213c2-7 9-11 15-8 9 2 10 14 2 17-1 6-11 10-16 5-4-4-5-11-1-14Z" fill="url(#${id}-skin)" stroke="#6b4449" stroke-width="3"/>
          <path d="M265 211q7 0 13 5m-15 1 11 3" stroke="#ac665b" stroke-width="1.8"/>
          </g>
        </g>
        </g>
      </g>
    </svg>`;
}
