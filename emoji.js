/* Biểu tượng 3D dễ thương cho toàn bộ web – Claude Code (đợt 11).
   Thay các emoji trong giao diện bằng ảnh Microsoft Fluent Emoji 3D (giấy phép MIT, xem assets/emoji/LICENSE-MIT.txt)
   để mọi máy (Windows, Android, iPhone) đều thấy cùng một bộ hình mềm mại, có khối.
   Nạp TRƯỚC app.js: một MutationObserver đổi chữ-emoji thành <img class="emo"> ngay khi nội dung được chèn vào trang
   (trước khi trình duyệt vẽ), nên các tệp khác vẫn viết emoji bình thường. Bỏ qua ô nhập, <option>, <title>
   và mọi phần tử có thuộc tính data-noemo. */
'use strict';
const EMOJI_ART = new Set('1f308 1f30d 1f315 1f319 1f31f 1f331 1f332 1f333 1f334 1f337 1f338 1f339 1f33a 1f33b 1f33c 1f33f 1f342 1f343 1f344 1f34e 1f353 1f36a 1f36c 1f36d 1f380 1f381 1f384 1f385 1f388 1f389 1f38b 1f392 1f393 1f3a7 1f3a8 1f3ae 1f3af 1f3b2 1f3b5 1f3b6 1f3c1 1f3c5 1f3c6 1f3d4 1f3dd 1f3e0 1f3e1 1f407 1f411 1f414 1f41d 1f41e 1f422 1f423 1f425 1f427 1f428 1f42c 1f42f 1f430 1f434 1f435 1f438 1f43b 1f43c 1f43e 1f43f 1f440 1f44b 1f451 1f464 1f466 1f467 1f469-200d-1f3eb 1f48c 1f49a 1f49d 1f4a1 1f4a4 1f4a7 1f4aa 1f4af 1f4c7 1f4ca 1f4d2 1f4d6 1f4d8 1f4da 1f4dc 1f4dd 1f501 1f504 1f507 1f508 1f50a 1f50e 1f510 1f512 1f513 1f514 1f520 1f525 1f56f 1f5a8 1f5d1 1f5dd 1f5e3 1f5fa 1f622 1f634 1f680 1f6cd 1f6f7 1f917 1f91d 1f940 1f95a 1f973 1f984 1f986 1f98a 1f98b 1f98c 1f9c1 1f9d2 1f9e0 1f9e3 1f9e4 1f9ed 1f9f8 1f9fa 1fa7a 1fa81 1fa85 1fab4 1fae7 23f0 23f1 23f3 2600 2601 2603 2699 26a0 26a1 26c4 26f2 26f5 2705 2708 270f 2712 2728 2744 274c 2753 2757 2795 2b50'.split(' '));
function emoKey(s) { return [...s.replace(/️/g, '')].map(c => c.codePointAt(0).toString(16)).join('-'); }
function emoSrc(s) { const k = emoKey(s); return EMOJI_ART.has(k) ? 'assets/emoji/' + k + '.webp' : ''; }
/* Dùng trực tiếp trong HTML khi muốn ảnh to, có lớp riêng: emoImg('🎁', 'lock-art') */
function emoImg(s, cls) { const src = emoSrc(s); return src ? '<img class="emo ' + (cls || '') + '" src="' + src + '" alt="' + s + '" draggable="false" decoding="async">' : s; }
(function () {
  const RE = /\p{Extended_Pictographic}️?(?:‍\p{Extended_Pictographic}️?)*/gu;
  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|OPTION|OPTGROUP|SELECT|TITLE|INPUT|NOSCRIPT|text|tspan|svg)$/;
  function allowed(el) {
    for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP.test(e.nodeName) || e.hasAttribute('data-noemo') || e.isContentEditable) return false;
    }
    return true;
  }
  function convert(node) {
    const t = node.nodeValue; if (!t || !node.parentNode) return;
    RE.lastIndex = 0; let m, last = 0, frag = null;
    while ((m = RE.exec(t))) {
      const src = emoSrc(m[0]); if (!src) continue;
      frag = frag || document.createDocumentFragment();
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const img = document.createElement('img');
      img.className = 'emo'; img.src = src; img.alt = m[0]; img.draggable = false; img.decoding = 'async';
      frag.appendChild(img); last = m.index + m[0].length;
    }
    if (!frag) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function walk(root) {
    if (root.nodeType === 3) { if (allowed(root.parentNode)) convert(root); return; }
    if (root.nodeType !== 1 || !allowed(root)) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (RE.lastIndex = 0, RE.test(n.nodeValue) && allowed(n.parentNode)) ? 1 : 2 });
    const list = []; while (tw.nextNode()) list.push(tw.currentNode);
    list.forEach(convert);
  }
  window.emojify = walk;
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') { if (m.target.parentNode && allowed(m.target.parentNode)) convert(m.target); }
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  walk(document.body || document.documentElement);
})();
