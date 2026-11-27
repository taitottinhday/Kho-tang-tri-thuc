// Chụp đúng khoảnh khắc trong đoạn phim: node tests/phim_frames.js tuyến loại(ket|thuong) t1,t2,... [rộng] [cao]
const { launch } = require('./cdp_driver.js'); const path = require('path'), fs = require('fs');
(async () => {
  const [route, kind, list, w = 390, h = 844] = process.argv.slice(2);
  const times = list.split(',').map(Number), out = path.join(__dirname, '..', 'qa-results', 'phim'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(Number(w), Number(h));
  try {
    await b.goto('index.html', 5000);
    for (let k = 0; k < times.length; k++) {
      await b.eval(`db.onboarded = true; if (typeof hideWelcome === 'function') hideWelcome(); closeModal(); Phim.stop();
        const q = { race: ${route === 'rabbit'} ? { escaped: ${kind === 'ket'} } : null, journey: ${route !== 'rabbit'} ? { mode: { id: '${route}' }, justWon: ${kind === 'ket'} } : null, log: [{right:true},{right:true},{right:true}] };
        const p = PhimTruyen.plan(q, true); window.__t = performance.now(); Phim.play(p.shots, { combo: 3 });
        for (let i = 0; i < 80 && !document.querySelector('.ph-shot'); i++) await new Promise(r => setTimeout(r, 40));
        await new Promise(r => setTimeout(r, ${times[k]})); return 1`);
      await b.shot(path.join(out, `${route}-${kind}-t${k}-${w}.png`));
    }
    console.log(b.errors);
  } finally { await b.close(); }
  require('child_process').execFileSync('python', ['-c', `from PIL import Image
ims=[Image.open(r'${out}'+'/${route}-${kind}-t%d-${w}.png'%k) for k in range(${times.length})]
W,H=ims[0].size; s=Image.new('RGB',((W+10)*len(ims),H),'white')
for k,im in enumerate(ims): s.paste(im,(k*(W+10),0))
s.save(r'${out}'+'/sheet-${route}-${kind}-${w}.png')`]);
})();
