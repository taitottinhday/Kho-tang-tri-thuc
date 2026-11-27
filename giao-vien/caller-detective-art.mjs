let nextDetective = 0;

const motion = `
  .cd-figure, .cd-head, .cd-arm, .cd-leg, .cd-scarf, .cd-shadow, .cd-brow,
  .cd-eyes, .cd-glint { transform-box: view-box; }
  .cd-figure { transform-origin: 162px 328px; animation: cd-breathe 2.8s ease-in-out infinite; }
  .cd-head { transform-origin: 157px 204px; transition: transform .34s cubic-bezier(.24,.9,.35,1.25); }
  .cd-arm-back { transform-origin: 108px 227px; transition: transform .34s cubic-bezier(.22,.85,.35,1.2); }
  .cd-arm-lens { transform-origin: 211px 225px; transition: transform .47s cubic-bezier(.19,.72,.28,1.15); }
  .cd-leg-back { transform-origin: 137px 295px; }
  .cd-leg-front { transform-origin: 183px 292px; }
  .cd-scarf { transform-origin: 143px 207px; animation: cd-scarf 1.9s ease-in-out infinite; }
  .cd-shadow { transform-origin: 163px 360px; opacity:.79; }
  .cd-eyes { transform-origin: 167px 139px; animation: cd-blink 4.4s ease-in-out infinite; }
  .cd-brow { transform-origin: 174px 115px; transition: transform .22s ease; }
  .cd-glint { transform-origin: 290px 158px; animation: cd-glint 2.35s ease-in-out infinite; }
  .cd-mouth-smile, .cd-mouth-o { opacity: 0; transition: opacity .14s; }
  .cd-mouth-rest { transition: opacity .14s; }
  .caller-performer[data-motion=run] .cd-figure { animation: cd-step .59s ease-in-out infinite; }
  .caller-performer[data-motion=run] .cd-head { transform: rotate(6deg) translateX(3px); }
  .caller-performer[data-motion=run] .cd-leg-front { animation: cd-stride .59s ease-in-out infinite; }
  .caller-performer[data-motion=run] .cd-leg-back { animation: cd-stride .59s -.295s ease-in-out infinite; }
  .caller-performer[data-motion=run] .cd-arm-back { animation: cd-arm-swing .59s -.295s ease-in-out infinite; }
  .caller-performer[data-motion=run] .cd-arm-lens { animation: cd-lens-swing .59s ease-in-out infinite; }
  .caller-performer[data-motion=run] .cd-scarf { animation-duration: .58s; }
  .caller-performer[data-motion=fake] .cd-figure { animation: cd-double-take .62s cubic-bezier(.17,.74,.32,1) both; }
  .caller-performer[data-motion=fake] .cd-head { transform: rotate(-11deg) translate(-4px,3px); }
  .caller-performer[data-motion=fake] .cd-arm-back { transform: rotate(68deg); }
  .caller-performer[data-motion=fake] .cd-arm-lens { transform: rotate(11deg); }
  .caller-performer[data-motion=fake] .cd-brow { transform: translateY(-6px) rotate(-5deg); }
  .caller-performer[data-motion=fake] .cd-mouth-o { opacity: 1; }
  .caller-performer[data-motion=fake] .cd-mouth-rest,
  .caller-performer[data-motion=win] .cd-mouth-rest { opacity: 0; }
  .caller-performer[data-motion=focus] .cd-figure { animation: cd-peer 1.65s ease-in-out infinite; }
  .caller-performer[data-motion=focus] .cd-head { transform: rotate(8deg) translate(7px,6px); }
  .caller-performer[data-motion=focus] .cd-brow { transform: translateY(3px) rotate(5deg); }
  .caller-performer[data-motion=focus] .cd-arm-lens { transform: rotate(-47deg) translate(1px,7px); }
  .caller-performer[data-motion=focus] .cd-glint { animation: cd-glint .9s ease-in-out infinite; }
  .caller-performer[data-motion=win] .cd-figure { animation: cd-cheer 1.08s cubic-bezier(.26,.82,.3,1) both; }
  .caller-performer[data-motion=win] .cd-shadow { animation: cd-shadow-hop 1.08s ease both; }
  .caller-performer[data-motion=win] .cd-head { transform: rotate(-6deg) translateY(-3px); }
  .caller-performer[data-motion=win] .cd-arm-back { transform: rotate(103deg); }
  .caller-performer[data-motion=win] .cd-arm-lens { transform: rotate(-28deg); }
  .caller-performer[data-motion=win] .cd-mouth-smile { opacity: 1; }
  @keyframes cd-breathe {
    0%,100% { transform: translateY(0) rotate(-.7deg); }
    50% { transform: translateY(-2.3px) rotate(.45deg) scaleY(1.01); }
  }
  @keyframes cd-step {
    0%,50%,100% { transform: translateY(1px) rotate(4deg) scaleY(.989); }
    25%,75% { transform: translateY(-6px) rotate(4deg) scaleY(1.012); }
  }
  @keyframes cd-stride {
    0%,100% { transform: rotate(-21deg); }
    23% { transform: rotate(2deg) translateY(-4px); }
    50% { transform: rotate(23deg); }
    76% { transform: rotate(1deg); }
  }
  @keyframes cd-arm-swing {
    0%,100% { transform: rotate(21deg); }
    50% { transform: rotate(-22deg); }
  }
  @keyframes cd-lens-swing {
    0%,100% { transform: rotate(-9deg); }
    50% { transform: rotate(5deg); }
  }
  @keyframes cd-blink {
    0%,41%,47%,89%,94%,100% { transform: scaleY(1); }
    44%,91% { transform: scaleY(.07); }
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
    0%,100% { transform: rotate(2deg) translateX(2px); }
    50% { transform: rotate(5deg) translate(7px,2px); }
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
  }
`;

/** Jointed detective. The SVG coordinates keep each pivot consistent at any display size. */
export function detectiveMarkup() {
  const id = `caller-detective-${++nextDetective}`;
  return `
    <svg class="caller-detective-rig" viewBox="0 0 360 380" fill="none" aria-hidden="true" focusable="false">
      <style>${motion}</style>
      <defs>
        <radialGradient id="${id}-shadow">
          <stop stop-color="#100d20" stop-opacity=".74"/>
          <stop offset="1" stop-color="#100d20" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${id}-coat" x1="108" y1="208" x2="215" y2="337" gradientUnits="userSpaceOnUse">
          <stop stop-color="#f5be72"/><stop offset=".48" stop-color="#bb774c"/><stop offset="1" stop-color="#89523e"/>
        </linearGradient>
        <linearGradient id="${id}-lapel" x1="114" y1="211" x2="173" y2="289" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffda96"/><stop offset=".63" stop-color="#e5a060"/><stop offset="1" stop-color="#a85e46"/>
        </linearGradient>
        <linearGradient id="${id}-skin" x1="113" y1="78" x2="202" y2="200" gradientUnits="userSpaceOnUse">
          <stop stop-color="#fff0c7"/><stop offset=".54" stop-color="#f2bd92"/><stop offset="1" stop-color="#c87e62"/>
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
        <linearGradient id="${id}-boot" x1="118" y1="307" x2="209" y2="363" gradientUnits="userSpaceOnUse">
          <stop stop-color="#78534e"/><stop offset=".48" stop-color="#493947"/><stop offset="1" stop-color="#272638"/>
        </linearGradient>
        <linearGradient id="${id}-brass" x1="270" y1="127" x2="323" y2="192" gradientUnits="userSpaceOnUse">
          <stop stop-color="#fff3bb"/><stop offset=".34" stop-color="#f6ce7b"/><stop offset=".67" stop-color="#a96d4b"/><stop offset="1" stop-color="#dca464"/>
        </linearGradient>
        <radialGradient id="${id}-glass" cx=".33" cy=".29" r=".78">
          <stop stop-color="#ecfffe" stop-opacity=".86"/><stop offset=".59" stop-color="#8cd8d1" stop-opacity=".46"/>
          <stop offset="1" stop-color="#417a91" stop-opacity=".7"/>
        </radialGradient>
        <radialGradient id="${id}-flush">
          <stop stop-color="#e77968" stop-opacity=".55"/><stop offset="1" stop-color="#eb8e73" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="${id}-iris" x1="159" y1="125" x2="159" y2="149" gradientUnits="userSpaceOnUse">
          <stop stop-color="#935b54"/><stop offset=".54" stop-color="#463847"/><stop offset="1" stop-color="#222838"/>
        </linearGradient>
        <clipPath id="${id}-lens-clip"><circle cx="295" cy="157" r="27"/></clipPath>
      </defs>
      <ellipse class="cd-shadow" cx="163" cy="359" rx="117" ry="20" fill="url(#${id}-shadow)"/>
      <g class="cd-figure" stroke-linecap="round" stroke-linejoin="round">
        <g class="cd-leg cd-leg-back">
          <path d="M122 287q14-12 30 2l-7 45-22 4-7-18Z" fill="#3d4557" stroke="#322a40" stroke-width="4"/>
          <path d="M119 328q11 4 24 0l-2 11c9 2 19 6 17 13-1 7-15 10-39 7-9-1-13-5-11-12Z" fill="url(#${id}-boot)" stroke="#292635" stroke-width="4"/>
          <path d="M111 351q12 5 40 0" stroke="#9f7560" stroke-width="2.4" opacity=".76"/>
        </g>
        <g class="cd-leg cd-leg-front">
          <path d="M168 285q14-11 31 1l2 43-16 14-19-11Z" fill="#3d5362" stroke="#322a40" stroke-width="4"/>
          <path d="M172 304q8 1 11-7l2 33-8 5Z" fill="#64727a" opacity=".68"/>
          <path d="M169 328q16 6 30-2l3 13c16 1 29 7 27 15-1 6-11 10-33 10-18 0-27-2-29-9Z" fill="url(#${id}-boot)" stroke="#282637" stroke-width="4.4"/>
          <path d="M171 354q22 6 50-1" stroke="#aa826b" stroke-width="2.5"/>
          <path d="M192 341q12-2 22 5m-38-13 16 1" stroke="#bb9780" stroke-width="2.5" opacity=".68"/>
          <path d="M185 340l9 4m-13 0 8 4" stroke="#ead0a2" stroke-width="1.8" opacity=".73"/>
        </g>
        <g class="cd-arm cd-arm-back">
          <path d="M112 217q-21-3-31 27l-5 32 23 5 29-51Z" fill="#a5694f" stroke="#513941" stroke-width="4"/>
          <path d="M83 253l-5 16 23 4 6-16Z" fill="#ca8a60"/>
          <path d="M77 269q11 1 23 7l-3 13-24-3Z" fill="#80544a" stroke="#533a42" stroke-width="3.2"/>
          <path d="M75 284c-6 3-9 14-4 22 3 5 15 7 20 1 4-3 5-11 3-18Z" fill="url(#${id}-skin)" stroke="#633d48" stroke-width="3"/>
          <path d="M74 298l2 6m7-7 1 7" stroke="#aa6559" stroke-width="1.7"/>
        </g>
        <path d="M126 204c-21 4-37 17-39 40l5 26-11 46c22 16 54 27 76 18l13-16 11 17c25-1 58-15 60-25l-17-55c8-26-5-45-35-51Z" fill="url(#${id}-coat)" stroke="#573a42" stroke-width="5"/>
        <path d="M87 310q38 24 66 17l17-17 14 17q30-3 52-20l3 4q-17 18-52 25l-17-17-12 16q-35 9-75-17Z" fill="#77484b" opacity=".75"/>
        <path d="M101 263q-2 20-10 39m116-63q7 29 17 55m-118 19q20 10 45 11" stroke="#f3bb76" stroke-width="2.4" opacity=".62"/>
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
        <g class="cd-head">
          <path d="M95 95c-16 7-20 34-15 55 1 12 9 26 17 35 16 19 37 25 62 24 50-2 82-28 86-64 4-35-18-56-53-66Z" fill="url(#${id}-skin)" stroke="#573847" stroke-width="4.4"/>
          <path d="M94 114c-11-12-22-4-21 13 0 15 7 30 20 29l6-19Z" fill="#ecab87" stroke="#68434b" stroke-width="3.6"/>
          <path d="M82 122q-4 6 6 19" stroke="#be7565" stroke-width="3"/>
          <path d="M82 115q-7-7-8-20-7-18 16-38c30-20 91-24 132 6 16 13 22 29 23 45-12 4-22-3-31-11 1 12-6 17-13 19 2-11-7-24-14-29-3 14-13 21-20 24 3-10 0-18-6-22-8 13-23 21-39 23l9-15c-13 7-27 16-34 28l-4-11-5 13Z" fill="url(#${id}-hair)" stroke="#433042" stroke-width="4.6"/>
          <path d="M95 95c19-16 36-23 58-24m-11 22 12-15m32 7 8 7m26-3 11 9" stroke="#b16a60" stroke-width="2.6" opacity=".57"/>
          <path d="M103 160c17 18 52 29 84 22 17-4 38-19 50-38-4 32-35 57-76 59-24 1-46-8-58-22Z" fill="#c97966" opacity=".23"/>
          <ellipse cx="115" cy="155" rx="22" ry="13" fill="url(#${id}-flush)"/>
          <ellipse cx="219" cy="151" rx="22" ry="13" fill="url(#${id}-flush)"/>
          <g class="cd-brow" stroke="#5d3841">
            <path d="M112 124q12-13 30-8m35-2q15-9 28 1" stroke-width="5.2"/>
            <path d="M116 120q12-7 23-5m41-2q9-4 17-2" stroke="#b77765" stroke-width="1.6" opacity=".7"/>
          </g>
          <g class="cd-eyes">
            <path d="M112 135q3-12 17-13c12 0 19 8 18 17-1 10-10 16-22 15-10-1-15-10-13-19Z" fill="#fff7de" stroke="#613e4a" stroke-width="2.9"/>
            <path d="M178 132q4-12 17-14c12-1 21 8 21 17 0 11-9 17-21 18-10 0-19-10-17-21Z" fill="#fff7de" stroke="#613e4a" stroke-width="2.9"/>
            <ellipse cx="134" cy="138" rx="9" ry="11.5" fill="url(#${id}-iris)"/>
            <ellipse cx="202" cy="135.5" rx="9.5" ry="12" fill="url(#${id}-iris)"/>
            <circle cx="137" cy="133" r="3.5" fill="#fffbea"/>
            <circle cx="204.5" cy="130" r="3.6" fill="#fffbea"/>
            <circle cx="130" cy="142" r="1.6" fill="#b2d3c7"/>
            <circle cx="198" cy="140" r="1.7" fill="#b2d3c7"/>
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
        </g>
        <g class="cd-arm cd-arm-lens">
          <path d="M205 218c11-9 26-1 37 12l15-15 15 12c-6 22-22 38-36 35-13-3-29-14-38-27Z" fill="url(#${id}-coat)" stroke="#583b43" stroke-width="4.4"/>
          <path d="M210 221c10 1 17 6 26 16m-15 9 12 8" stroke="#ffcf88" stroke-width="2.6" opacity=".79"/>
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
    </svg>`;
}
