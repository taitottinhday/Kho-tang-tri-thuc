/* Chạy kịch bản giao diện trên Chrome qua CDP với đồng hồ và sự kiện thật.
 * node tests/run_browser_qa.js 390 844
 */
'use strict';
const { launch } = require('./cdp_driver.js');
const fs = require('node:fs/promises');
const path = require('node:path');

async function main() {
  const width = Number(process.argv[2] || 1366);
  const height = Number(process.argv[3] || 900);
  const out = process.argv[4] || path.join('qa-results', 'project');
  await fs.mkdir(out,{ recursive: true });
  const browser = await launch(width,height);
  try {
    await browser.goto('index.html');
    await browser.eval(`
      history.replaceState(null,'','/qa?w=${width}&h=${height}');
      document.open();
      document.write('<!doctype html><meta charset=utf-8><style>body{margin:0}iframe{border:0}</style><pre id="report" hidden></pre><iframe title="Vườn Chữ"></iframe><script src="/tests/browser_qa.js"></script>');
      document.close();
    `);
    let result = null;
    for (let i = 0; !result && i < 120; i++) {
      await browser.sleep(350);
      result = await browser.eval("const raw = document.getElementById('report')?.textContent; return raw ? JSON.parse(raw) : null;");
    }
    if (!result) throw Error('Kịch bản chưa trả kết quả: ' + browser.errors.join('\n'));
    await browser.shot(path.join(out,'home-' + width + '.png'));
    await fs.writeFile(path.join(out,'result-' + width + '.json'),JSON.stringify(result,null,2));
    console.log(width + '×' + height + ': ' + result.passed.length + ' đạt ·', result.failed, browser.errors);
    if (!result.complete || result.failed.length || browser.errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
