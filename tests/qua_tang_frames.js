// Chụp đúng khoảnh khắc trong kịch bản: node tests/qua_tang_frames.js quà t1,t2,... [rộng] [cao]
const { launch } = require('./cdp_driver.js'); const path = require('path'), fs = require('fs');
(async () => {
  const id = process.argv[2], times = process.argv[3].split(',').map(Number), w = Number(process.argv[4] || 390), h = Number(process.argv[5] || 844);
  const out = path.join(__dirname, '..', 'qa-results', 'qua-tang'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(w, h);
  try {
    await b.goto('index.html', 5000);
    for (let k = 0; k < times.length; k++) {
      await b.eval(`QuaTang.close(); QuaTang.show({gift:'${id}',correct:12,total:12,acc:100,student:'Bé Na',avatar:'🦊',praise:'Em đọc kĩ từng chữ nên viết đúng quá!',firstTime:true});
        for (let i=0;i<100 && !document.querySelector('dialog.qt.qt-on');i++) await new Promise(r=>setTimeout(r,50));
        await new Promise(r=>setTimeout(r,${times[k]})); return 1`);
      await b.shot(path.join(out, `${id}-t${k}-${w}.png`));
    }
    console.log(b.errors);
  } finally { await b.close(); }
  const { execFileSync } = require('child_process');
  execFileSync('python', ['-c', `from PIL import Image
ims=[Image.open(r'${out}'+'/${id}-t%d-${w}.png'%k) for k in range(${times.length})]
W,H=ims[0].size; s=Image.new('RGB',((W+10)*len(ims),H),'white')
for k,im in enumerate(ims): s.paste(im,(k*(W+10),0))
s.save(r'${out}'+'/sheet-${id}-${w}.png')`]);
})();
