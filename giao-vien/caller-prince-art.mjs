const costumes = [
  { coat: '#a6532f', light: '#ffd999', mane: '#612834', muzzle: '#ffd0a0', silk: '#147194', silkLight: '#57cddd', cape: '#c63157', capeLight: '#ff769b' },
  { coat: '#a79189', light: '#fff5dd', mane: '#534d66', muzzle: '#fbd5c1', silk: '#6b4695', silkLight: '#bd8adf', cape: '#563789', capeLight: '#ab7dec' },
  { coat: '#754435', light: '#e59c65', mane: '#382637', muzzle: '#fbbb8c', silk: '#286f5c', silkLight: '#81bb81', cape: '#ac4550', capeLight: '#fa8b6c' }
];

let rigCount = 0;

const motionStyles = `
  .cpr-rig { display:block; width:100%; height:auto; overflow:visible; }
  .cpr-rig .cpr-joint { transform-box:view-box; transition:transform .5s cubic-bezier(.2,.68,.33,1.2); }
  .cpr-rig .cpr-body { transform-origin:242px 219px; animation:cpr-breathe 3s ease-in-out infinite; }
  .cpr-rig .cpr-head { transform-origin:340px 180px; animation:cpr-nod 4s ease-in-out infinite; }
  .cpr-rig .cpr-tail { transform-origin:150px 209px; animation:cpr-tail 2.4s ease-in-out infinite; }
  .cpr-rig .cpr-cape { transform-origin:226px 143px; animation:cpr-cloth 2.4s ease-in-out infinite; }
  .cpr-rig .cpr-rider { transform-origin:245px 197px; }
  .cpr-rig .cpr-hand { transform-origin:266px 149px; }
  .cpr-rig .cpr-reins { transition:opacity .18s ease; }
  .cpr-rig .cpr-eye { transform-origin:center; transform-box:fill-box; animation:cpr-blink 4.7s linear infinite; }
  .cpr-rig .cpr-horse-eye { animation-delay:1.8s; }
  .cpr-rig .cpr-foot { transform-box:view-box; }
  .cpr-rig .cpr-shadow { transform-origin:center; transform-box:fill-box; }
  .cpr-rig .cpr-presentation { opacity:0; transition:opacity .28s; }
  .caller-performer[data-motion="run"] .cpr-body { animation:cpr-gallop .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-head { animation:cpr-drive .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-rider { animation:cpr-rider .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-hind { animation:cpr-hind .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-fore { animation:cpr-fore .61s ease-in-out infinite; animation-delay:-.10s; }
  .caller-performer[data-motion="run"] .cpr-far.cpr-hind { animation-delay:-.14s; }
  .caller-performer[data-motion="run"] .cpr-far.cpr-fore { animation-delay:-.22s; }
  .caller-performer[data-motion="run"] .cpr-hock { animation:cpr-hock .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-knee { animation:cpr-knee .61s ease-in-out infinite; animation-delay:-.10s; }
  .caller-performer[data-motion="run"] .cpr-far .cpr-hock { animation-delay:-.14s; }
  .caller-performer[data-motion="run"] .cpr-far .cpr-knee { animation-delay:-.22s; }
  .caller-performer[data-motion="run"] .cpr-tail { animation:cpr-stream .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-cape { animation:cpr-cape-stream .61s ease-in-out infinite; }
  .caller-performer[data-motion="run"] .cpr-shadow { animation:cpr-ground .61s ease-in-out infinite; }
  .caller-performer[data-motion="fake"] .cpr-body { animation:cpr-brake .72s cubic-bezier(.25,.1,.25,1) both; }
  .caller-performer[data-motion="fake"] .cpr-head { animation:cpr-startle .72s ease-out both; }
  .caller-performer[data-motion="fake"] .cpr-rider { transform:rotate(-10deg) translate(-2px,-4px); }
  .caller-performer[data-motion="fake"] .cpr-fore { transform:rotate(-12deg); }
  .caller-performer[data-motion="focus"] .cpr-head { animation:cpr-look 1.35s ease-in-out infinite alternate; }
  .caller-performer[data-motion="focus"] .cpr-rider { transform:rotate(7deg) translate(3px,-2px); }
  .caller-performer[data-motion="focus"] .cpr-hand, .caller-performer[data-motion="win"] .cpr-hand { transform:rotate(-46deg) translate(3px,-3px); }
  .caller-performer[data-motion="focus"] .cpr-reins, .caller-performer[data-motion="win"] .cpr-reins { opacity:.42; }
  .caller-performer[data-motion="win"] .cpr-body { animation:cpr-rear 1.05s cubic-bezier(.2,.65,.26,1) both; }
  .caller-performer[data-motion="win"] .cpr-fore { animation:cpr-lift 1.05s ease-in-out both; }
  .caller-performer[data-motion="win"] .cpr-knee { animation:cpr-fold 1.05s ease-in-out both; }
  .caller-performer[data-motion="win"] .cpr-head { animation:cpr-happy 1.05s ease-in-out both; }
  .caller-performer[data-motion="win"] .cpr-rider { transform:rotate(10deg); }
  .caller-performer[data-motion="win"] .cpr-presentation { opacity:1; animation:cpr-magic 1.4s ease-in-out infinite; }
  @keyframes cpr-breathe { 50% { transform:translateY(-3px) scaleY(1.012); } }
  @keyframes cpr-nod { 22% { transform:rotate(2.5deg); } 60% { transform:rotate(-3deg); } }
  @keyframes cpr-tail { 48% { transform:rotate(8deg); } }
  @keyframes cpr-cloth { 48% { transform:rotate(5deg) scaleX(.97); } }
  @keyframes cpr-blink { 0%,42%,46%,74%,78%,100% { transform:scaleY(1); } 44%,76% { transform:scaleY(.07); } }
  @keyframes cpr-gallop { 0%,100% { transform:translateY(-2px) rotate(-4deg); } 22% { transform:translateY(-16px) rotate(-7deg); } 52% { transform:translateY(-23px) rotate(2deg); } 76% { transform:translateY(1px) rotate(5deg) scaleY(.98); } }
  @keyframes cpr-drive { 0%,100% { transform:rotate(1deg); } 36% { transform:rotate(-7deg); } 70% { transform:rotate(7deg); } }
  @keyframes cpr-rider { 0%,100% { transform:rotate(6deg) translateY(0px); } 33% { transform:rotate(12deg) translate(2px,-5px); } 74% { transform:rotate(2deg) translateY(3px); } }
  @keyframes cpr-hind { 0%,100% { transform:rotate(-24deg); } 40% { transform:rotate(29deg); } 75% { transform:rotate(8deg); } }
  @keyframes cpr-fore { 0%,100% { transform:rotate(16deg); } 30% { transform:rotate(-39deg); } 72% { transform:rotate(20deg); } }
  @keyframes cpr-hock { 0%,100% { transform:rotate(-9deg); } 37% { transform:rotate(55deg); } 65% { transform:rotate(-9deg); } }
  @keyframes cpr-knee { 0%,100% { transform:rotate(55deg); } 38%,52% { transform:rotate(1deg); } 79% { transform:rotate(41deg); } }
  @keyframes cpr-stream { 0%,100% { transform:rotate(17deg); } 40% { transform:rotate(24deg) scaleX(1.04); } 73% { transform:rotate(10deg); } }
  @keyframes cpr-cape-stream { 0%,100% { transform:rotate(15deg); } 45% { transform:rotate(24deg) scaleX(1.1); } }
  @keyframes cpr-ground { 48% { transform:scaleX(.83) scaleY(.68); opacity:.64; } }
  @keyframes cpr-brake { 40% { transform:translateY(7px) rotate(6deg) scaleY(.97); } 75% { transform:translateY(-5px) rotate(-3deg); } }
  @keyframes cpr-startle { 36% { transform:rotate(-14deg) translateY(-5px); } 76% { transform:rotate(5deg); } }
  @keyframes cpr-look { to { transform:rotate(7deg) translateY(3px); } }
  @keyframes cpr-rear { 42% { transform:rotate(-11deg) translateY(-10px); } 75% { transform:rotate(2deg); } }
  @keyframes cpr-lift { 42% { transform:rotate(-47deg); } 75% { transform:rotate(-9deg); } }
  @keyframes cpr-fold { 42% { transform:rotate(56deg); } }
  @keyframes cpr-happy { 45% { transform:rotate(-12deg); } 76% { transform:rotate(4deg); } }
  @keyframes cpr-magic { 50% { opacity:.45; transform:translateY(-6px); } }
  @media(prefers-reduced-motion:reduce) { .cpr-rig g { animation:none !important; transition:none !important; } }
`;

function horseLeg(which, far, paint) {
  const fore = which === 'fore';
  const offset = far ? (fore ? 'translate(-27 -6)' : 'translate(30 -6)') : '';
  const pivot = fore ? '314px 206px' : '175px 222px';
  const joint = fore ? '321px 267px' : '162px 264px';
  const edge = far ? '#4c3038' : '#572e3c';
  const upper = fore
    ? 'M296 204 Q305 191 326 199 Q342 208 334 233 L326 272 Q321 281 311 274 L305 244 Q296 230 296 204Z'
    : 'M155 206 Q176 191 195 205 Q207 219 195 238 L171 271 Q161 282 151 267 L157 243 Q142 226 155 206Z';
  const lower = fore
    ? 'M311 265 Q320 257 330 267 L330 300 L338 309 Q341 314 335 318 H312 Q304 316 308 307 L309 296Z'
    : 'M151 262 Q161 254 172 264 L175 301 L183 309 Q185 315 178 318 H152 Q146 315 149 309 L151 298Z';
  const hoof = fore ? 'M309 300 Q321 303 331 300 L338 309 Q341 314 335 318 H312 Q304 316 308 307Z'
    : 'M150 300 Q163 304 175 300 L183 309 Q185 315 178 318 H152 Q146 315 149 309Z';
  const shine = fore ? 'M318 310 Q326 311 331 307' : 'M158 311 Q166 312 172 308';
  return `<g transform="${offset}" opacity="${far ? '.93' : '1'}">
    <g class="cpr-joint cpr-${which}${far ? ' cpr-far' : ''}" style="transform-origin:${pivot}">
      <path d="${upper}" fill="${paint}" stroke="${edge}" stroke-width="4"/>
      <g class="cpr-foot cpr-${fore ? 'knee' : 'hock'}" style="transform-origin:${joint}">
        <path d="${lower}" fill="${paint}" stroke="${edge}" stroke-width="3.6"/>
        <path d="${hoof}" fill="#533246" stroke="#442a3d" stroke-width="2"/>
        <path d="${shine}" fill="none" stroke="#ad6877" stroke-width="2.5"/>
      </g>
    </g>
  </g>`;
}

export function princeMarkup(index = 0) {
  const costume = costumes[index % costumes.length] || costumes[0];
  const id = `cpr${++rigCount}`;
  const paint = `url(#${id}horse)`;
  const ink = '#532b3e';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="cpr-rig" viewBox="0 0 480 345" aria-hidden="true" focusable="false" stroke-linecap="round" stroke-linejoin="round">
    <style>${motionStyles}</style>
    <defs>
      <linearGradient id="${id}horse" x1=".24" y1=".05" x2=".72" y2=".96"><stop stop-color="${costume.light}"/><stop offset=".58" stop-color="${costume.coat}"/><stop offset="1" stop-color="#834052"/></linearGradient>
      <linearGradient id="${id}mane" x1=".22" y1=".22" x2=".77" y2=".91"><stop stop-color="${costume.mane}"/><stop offset="1" stop-color="#45293c"/></linearGradient>
      <linearGradient id="${id}cape" x1=".16" y1=".05" x2=".79" y2=".92"><stop stop-color="${costume.capeLight}"/><stop offset="1" stop-color="${costume.cape}"/></linearGradient>
      <linearGradient id="${id}silk" x1=".3" y1=".08" x2=".74" y2=".94"><stop stop-color="${costume.silkLight}"/><stop offset="1" stop-color="${costume.silk}"/></linearGradient>
      <linearGradient id="${id}gold" x1=".27" y1=".08" x2=".64" y2=".97"><stop stop-color="#fff6b5"/><stop offset=".47" stop-color="#ffd67c"/><stop offset="1" stop-color="#e68b48"/></linearGradient>
      <linearGradient id="${id}skin" x1=".33" y1=".1" x2=".73" y2=".99"><stop stop-color="#ffebbd"/><stop offset=".68" stop-color="#ffc398"/><stop offset="1" stop-color="#ed937c"/></linearGradient>
      <linearGradient id="${id}hair" x1=".34" y1=".05" x2=".75" y2=".92"><stop stop-color="#a35c47"/><stop offset="1" stop-color="#532d45"/></linearGradient>
      <linearGradient id="${id}white" x1=".33" y1=".11" x2=".84" y2=".97"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#b7c9da"/></linearGradient>
      <radialGradient id="${id}shadow"><stop stop-color="#331939" stop-opacity=".43"/><stop offset="1" stop-color="#331939" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}blush"><stop stop-color="#f67384" stop-opacity=".74"/><stop offset="1" stop-color="#f67384" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="cpr-shadow" cx="241" cy="320" rx="172" ry="17" fill="url(#${id}shadow)"/>
    <g class="cpr-body cpr-joint">
      <g class="cpr-tail cpr-joint">
        <path d="M153 206 C130 185 101 177 84 192 C63 206 76 228 51 243 C71 245 83 239 85 229 C87 249 76 262 64 265 C89 270 106 253 107 232 C116 205 132 224 143 227Z" fill="url(#${id}mane)" stroke="${ink}" stroke-width="4"/>
        <path d="M139 207 C118 199 99 194 91 209 C84 215 87 229 78 235 M121 210 C101 210 107 240 88 250" fill="none" stroke="#eebc91" stroke-opacity=".38" stroke-width="3.2"/>
      </g>
      ${horseLeg('hind', true, costume.coat)}
      ${horseLeg('fore', true, costume.coat)}
      <path d="M221 171 Q252 165 274 173 L272 203 L213 215Z" fill="url(#${id}white)" stroke="#47506b" stroke-width="4"/>
      <path d="M181 178 C208 175 235 188 263 182 C285 176 301 151 316 132 C331 130 348 145 351 164 C351 196 354 222 324 239 C301 253 283 250 256 250 C216 254 176 262 150 235 C130 211 146 181 181 178Z" fill="${paint}" stroke="${ink}" stroke-width="4.3"/>
      <path d="M152 215 C143 199 160 184 183 185 C205 183 227 196 246 194 C221 213 182 188 159 218Z" fill="#fff0c5" opacity=".43"/>
      <path d="M286 233 Q319 226 340 199 Q337 226 317 237 Q304 242 286 233Z" fill="#ffd1a0" opacity=".53"/>
      <path d="M190 238 Q211 245 243 242 M168 228 Q171 231 177 232" fill="none" stroke="#773d49" stroke-opacity=".57" stroke-width="2.7"/>
      ${horseLeg('hind', false, paint)}
      ${horseLeg('fore', false, paint)}
      <path d="M183 185 Q217 168 252 182 L288 199 L281 231 Q246 245 208 228 L188 219Z" fill="url(#${id}silk)" stroke="#4c2f51" stroke-width="4"/>
      <path d="M187 193 Q222 180 253 191 L282 204 L277 224 Q244 234 213 224 L194 215Z" fill="none" stroke="#ffe1a0" stroke-width="2.7"/>
      <path d="m220 206 7-8 8 8-8 9z m7-13v-3 m0 29v3" fill="#fff3b4" stroke="#fff3b4" stroke-width="1.3"/>
      <path d="M218 179 Q240 169 266 180 Q277 188 269 198 Q245 191 225 199 Q209 200 206 189 Q207 183 218 179Z" fill="url(#${id}mane)" stroke="${ink}" stroke-width="3.8"/>
      <path d="M218 182 Q236 178 251 181 M262 185l5 3" fill="none" stroke="#ec9e73" stroke-width="2.5" opacity=".77"/>
      <g class="cpr-head cpr-joint">
        <path d="M334 125 C323 115 305 120 300 135 C291 130 285 143 287 153 C277 151 274 163 280 172 Q269 178 274 191 C291 193 309 180 317 173 Q337 163 343 143Z" fill="url(#${id}mane)" stroke="${ink}" stroke-width="4"/>
        <path d="M289 170 Q300 166 304 154 Q310 144 326 136 M284 179 Q308 171 318 153" fill="none" stroke="#d28473" stroke-width="2.5" opacity=".62"/>
        <path d="M346 126 C338 104 343 86 350 79 Q360 86 364 110 C370 104 378 105 384 108 Q386 91 397 84 Q408 97 397 119 C408 127 406 145 417 154 L430 168 Q441 183 428 195 C419 206 394 207 379 194 L359 176 Q347 185 330 200 Q311 204 300 193 C311 176 310 152 319 140 Q330 128 346 126Z" fill="${paint}" stroke="${ink}" stroke-width="4.5"/>
        <path d="M350 90 Q357 99 359 112 L351 114Q346 100 350 90Z M396 94 Q402 105 393 113 L389 111Z" fill="#e89b91" stroke="#9f5366" stroke-width="1.7"/>
        <path d="M362 121 Q368 119 371 125 C366 135 370 141 380 149 Q383 153 381 158 C372 155 358 146 357 136 Q357 129 362 121Z" fill="#fff1c8" opacity=".87"/>
        <path d="M377 174 C384 160 414 155 427 165 Q440 175 431 192 Q414 207 387 196Z" fill="${costume.muzzle}" stroke="#76394b" stroke-width="2.4"/>
        <path d="M388 173 Q400 167 414 169" fill="none" stroke="#fff5d6" stroke-width="3.6" opacity=".75"/>
        <ellipse cx="422" cy="177" rx="4.5" ry="3.2" transform="rotate(-19 422 177)" fill="#633449"/>
        <path d="M410 192 Q420 193 425 187" fill="none" stroke="#79384b" stroke-width="2.8"/>
        <path d="M330 138 C327 119 339 112 354 117 C363 107 384 108 390 123 Q395 134 387 135 C378 129 369 135 362 137 Q347 140 337 150 L341 138Z" fill="url(#${id}mane)" stroke="${ink}" stroke-width="3.5"/>
        <path d="M337 132 Q355 119 372 121 Q381 118 385 124 M344 136 Q352 130 358 129" fill="none" stroke="#d58e78" stroke-width="2.6" opacity=".72"/>
        <path d="M376 138 Q382 133 390 137" fill="none" stroke="#733c4d" stroke-width="3.5"/>
        <g class="cpr-eye cpr-horse-eye">
          <path d="M370 146 Q378 138 390 144 Q398 150 391 159 Q381 167 371 159 Q367 153 370 146Z" fill="#fff6e6" stroke="#6a344b" stroke-width="2.8"/>
          <ellipse cx="384" cy="152" rx="7" ry="9" fill="#774a74"/>
          <ellipse cx="385.5" cy="152.5" rx="4.4" ry="6.1" fill="#342238"/>
          <circle cx="387" cy="148" r="2.6" fill="#fffdf3"/><circle cx="381.5" cy="156" r="1.3" fill="#ffcda0"/>
        </g>
        <ellipse cx="396" cy="166" rx="12" ry="8" fill="url(#${id}blush)"/>
        <path d="M346 130 Q344 154 361 176 Q373 190 394 191 M366 171 Q400 156 419 153" fill="none" stroke="#693245" stroke-width="6.8"/>
        <path d="M346 130 Q344 154 361 176 Q373 190 394 191 M366 171 Q400 156 419 153" fill="none" stroke="#e19b70" stroke-width="2.8"/>
        <circle cx="369" cy="173" r="5.8" fill="url(#${id}gold)" stroke="#8c504b" stroke-width="1.8"/>
        <circle cx="395" cy="191" r="5.2" fill="url(#${id}gold)" stroke="#8c504b" stroke-width="1.8"/>
      </g>
      <g class="cpr-cape cpr-joint">
        <path d="M228 141 Q203 125 185 141 C164 158 139 158 113 147 C124 180 146 187 179 182 C151 200 132 211 102 211 C141 231 172 224 197 202 Q212 184 235 185Z" fill="url(#${id}cape)" stroke="#713248" stroke-width="4.4"/>
        <path d="M124 157 C157 176 184 150 198 149 Q178 171 146 177 M119 214 C152 214 185 191 202 168" fill="none" stroke="#ffd6bb" stroke-width="3" opacity=".6"/>
        <path d="M179 182 C195 171 202 159 215 155 Q200 186 176 203" fill="#762b54" opacity=".43"/>
      </g>
      <g class="cpr-rider cpr-joint">
        <path d="M223 170 Q249 164 260 181 L254 204 L235 214 L226 235 Q216 241 212 230 L217 207 L231 194 Q208 192 213 181Z" fill="url(#${id}white)" stroke="#4b3852" stroke-width="4"/>
        <path d="M217 211 Q230 220 236 214 L229 235 Q230 243 220 247 H202 Q192 246 195 240 Q196 234 213 232L214 217Z" fill="#58384f" stroke="#432c45" stroke-width="3.5"/>
        <path d="M218 216 Q228 222 234 218 M204 240h14" fill="none" stroke="#f3b478" stroke-width="2.7"/>
        <path d="M218 142 Q224 131 244 134 Q265 135 273 150 L264 174 L262 185 Q241 192 217 182 L216 166Z" fill="url(#${id}silk)" stroke="#4e3453" stroke-width="4"/>
        <path d="M220 176 Q240 184 263 176" fill="none" stroke="#ffe09a" stroke-width="4.5"/>
        <path d="m241 177 5-3 5 4-5 6z" fill="url(#${id}gold)" stroke="#8d5042" stroke-width="1.6"/>
        <path d="M228 137 Q242 148 256 138 L253 148 Q241 151 232 147" fill="url(#${id}white)" stroke="#5d536e" stroke-width="1.8"/>
        <path d="M217 145 Q226 139 234 146 L231 154 Q225 153 219 157Z" fill="url(#${id}gold)" stroke="#8b544f" stroke-width="1.8"/>
        <path d="M250 150 Q253 160 252 168 M239 150v21" fill="none" stroke="#f9dfab" stroke-width="2.5"/>
        <circle cx="246" cy="158" r="1.9" fill="#ffe0a1"/><circle cx="246" cy="167" r="1.8" fill="#ffe0a1"/>
        <path class="cpr-reins" d="M289 166 Q317 207 364 175 L395 190" fill="none" stroke="#613444" stroke-width="4"/>
        <path class="cpr-reins" d="M289 166 Q317 207 364 175 L395 190" fill="none" stroke="#d79463" stroke-width="1.6"/>
        <g class="cpr-hand cpr-joint">
          <path d="M260 144 Q272 143 276 152 L280 158 L290 155 Q299 152 303 160 Q305 167 297 171 L280 175 Q268 175 261 167 L255 158Z" fill="url(#${id}silk)" stroke="#53374e" stroke-width="3.5"/>
          <path d="M284 157 L289 172" fill="none" stroke="#ffdd8b" stroke-width="4"/>
          <path d="M294 155 Q299 148 305 151 Q316 146 321 153 Q325 158 320 163 L311 167 Q301 170 296 165Z" fill="url(#${id}skin)" stroke="#9c5060" stroke-width="2.4"/>
          <path d="m310 156 6-2 m-4 6 7-3" fill="none" stroke="#d98474" stroke-width="1.1"/>
        </g>
        <path d="M233 125 L255 126 L255 140 Q244 147 232 140Z" fill="url(#${id}skin)" stroke="#864954" stroke-width="2.8"/>
        <path d="M221 81 C223 62 257 62 270 75 Q285 86 282 104 C281 119 270 135 254 137 Q238 141 225 128 C217 127 211 119 212 111 Q211 104 218 102Z" fill="url(#${id}skin)" stroke="${ink}" stroke-width="4"/>
        <path d="M221 109 Q215 107 216 115 Q216 121 223 121" fill="none" stroke="#d78779" stroke-width="2"/>
        <path d="M216 107 C204 100 206 90 212 84 C204 83 205 73 215 69 Q211 62 220 56 C232 46 247 53 258 62 Q273 56 281 69 Q291 79 283 91 Q278 84 269 84 Q260 94 243 91 Q233 92 227 102 L226 113Z" fill="url(#${id}hair)" stroke="${ink}" stroke-width="3.9"/>
        <path d="M215 83 Q225 68 249 70 Q259 73 270 69 M215 94 Q226 81 244 82 M224 62 Q237 56 246 61" fill="none" stroke="#eb9d74" stroke-width="2.7" opacity=".68"/>
        <path d="M230 65 L223 43 Q228 43 236 50 L243 36 Q247 38 253 49 L268 41 L264 63 Q249 69 230 65Z" fill="url(#${id}gold)" stroke="#88485d" stroke-width="3.2"/>
        <path d="M231 60 Q244 64 262 58" fill="none" stroke="#fff1b0" stroke-width="2.5"/>
        <path d="m244 50 4-4 4 5-5 5z" fill="#e65f82" stroke="#ae4d6e" stroke-width="1.1"/>
        <circle cx="223" cy="42.5" r="3.2" fill="#ffe9a0" stroke="#ad6163" stroke-width="1.5"/>
        <circle cx="244" cy="36" r="3.15" fill="#ffe9a0" stroke="#ad6163" stroke-width="1.5"/>
        <circle cx="269" cy="41" r="3.2" fill="#ffe9a0" stroke="#ad6163" stroke-width="1.5"/>
        <path d="M237 101 Q242 96 249 99 M263 97 Q269 94 274 99" fill="none" stroke="#8a4957" stroke-width="2.8"/>
        <g class="cpr-eye">
          <path d="M236 108 Q243 101 251 107 Q255 113 248 117 Q240 121 236 114Z M261 106 Q269 100 275 107 Q278 113 271 116 Q264 119 261 113Z" fill="#fff8ed" stroke="#87495b" stroke-width="1.8"/>
          <ellipse cx="246" cy="110.7" rx="4.1" ry="5.9" fill="#586381"/><ellipse cx="270.2" cy="109.7" rx="3.9" ry="5.5" fill="#586381"/>
          <ellipse cx="247" cy="111" rx="2.4" ry="3.9" fill="#3c2a42"/><ellipse cx="271.2" cy="110" rx="2.3" ry="3.8" fill="#3c2a42"/>
          <circle cx="248" cy="108" r="1.7" fill="white"/><circle cx="272" cy="106.8" r="1.5" fill="white"/>
        </g>
        <ellipse cx="238" cy="120.5" rx="8" ry="4.7" fill="url(#${id}blush)"/><ellipse cx="275" cy="117.5" rx="6" ry="4.2" fill="url(#${id}blush)"/>
        <path d="M257 110 Q263 115 259 117 Q257 117 255 116 M249 124 Q257 130 266 123" fill="none" stroke="#a05660" stroke-width="2"/>
      </g>
    </g>
    <g class="cpr-presentation" fill="#fff3b5" stroke="#ffd780" stroke-width="1.4">
      <path d="M441 124q1 11 11 12-10 2-11 12-2-10-12-12 10-1 12-12Z"/>
      <path d="M424 95q1 6 7 7-6 1-7 7-1-6-7-7 6-1 7-7Z"/>
      <circle cx="456" cy="111" r="2.8"/><circle cx="411" cy="120" r="2"/>
    </g>
  </svg>`;
}
