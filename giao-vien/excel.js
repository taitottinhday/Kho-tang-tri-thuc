/* Đọc và tạo tệp Excel (.xlsx) ngay trong trình duyệt – Claude Code (đợt 18).
   Giáo viên không phải “lưu thành CSV UTF-8”: tải tệp mẫu .xlsx, điền, rồi tải đúng tệp đó lên. Không cần thư viện. */
'use strict';
const Excel = (() => {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const xml = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const colName = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - 1 - m) / 26; } return s; };

  function zip(files) { // không nén (store) – đủ cho tệp mẫu nhỏ
    const parts = [], central = []; let offset = 0;
    const u16 = v => [v & 255, (v >> 8) & 255], u32 = v => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
    for (const [name, text] of files) {
      const n = enc.encode(name), d = enc.encode(text), crc = crc32(d);
      const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0)]);
      parts.push(local, n, d);
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(d.length), ...u32(d.length), ...u16(n.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), n);
      offset += local.length + n.length + d.length;
    }
    const size = central.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(size), ...u32(offset), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function sheetXml(rows, widths) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews>' +
      '<cols>' + widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols><sheetData>' +
      rows.map((r, y) => '<row r="' + (y + 1) + '">' + r.map((v, x) => '<c r="' + colName(x) + (y + 1) + '" t="inlineStr"' + (y === 0 ? ' s="1"' : ' s="2"') + '><is><t xml:space="preserve">' + xml(v) + '</t></is></c>').join('') + '</row>').join('') + '</sheetData></worksheet>';
  }
  /* sheets: [{name, rows, widths}] */
  function build(sheets) {
    const ns = 'http://schemas.openxmlformats.org';
    return zip([
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="' + ns + '/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((_, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + ns + '/package/2006/relationships"><Relationship Id="rId1" Type="' + ns + '/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="' + ns + '/spreadsheetml/2006/main" xmlns:r="' + ns + '/officeDocument/2006/relationships"><sheets>' + sheets.map((s, i) => '<sheet name="' + xml(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + ns + '/package/2006/relationships">' + sheets.map((_, i) => '<Relationship Id="rId' + (i + 1) + '" Type="' + ns + '/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId99" Type="' + ns + '/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="' + ns + '/spreadsheetml/2006/main"><fonts count="2"><font><sz val="12"/><name val="Calibri"/></font><font><b/><sz val="12"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F6B4F"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>']
    ].concat(sheets.map((s, i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(s.rows, s.widths)])));
  }

  async function inflate(bytes) {
    if (typeof DecompressionStream === 'undefined') throw Error('Trình duyệt này cũ quá, thầy cô mở bằng Chrome hoặc Edge bản mới, hoặc dùng ô “Dán từ Excel”.');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  }
  async function unzip(buffer) {
    const b = new Uint8Array(buffer), v = new DataView(buffer);
    let e = b.length - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw Error('Đây không phải tệp Excel (.xlsx).');
    const count = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true); const out = {};
    for (let i = 0; i < count; i++) {
      const method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true), nlen = v.getUint16(p + 28, true), xlen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true), at = v.getUint32(p + 42, true);
      const name = dec.decode(b.subarray(p + 46, p + 46 + nlen));
      const start = at + 30 + v.getUint16(at + 26, true) + v.getUint16(at + 28, true), data = b.subarray(start, start + csize);
      if (/^xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/.test(name)) { if (csize > 6e6) throw Error('Tệp Excel quá lớn.'); out[name] = dec.decode(method === 8 ? await inflate(data) : data); }
      p += 46 + nlen + xlen + clen;
    }
    return out;
  }
  /* Trang tính đầu tiên → mảng dòng, mỗi dòng là mảng chữ */
  async function read(buffer) {
    const files = await unzip(buffer);
    const first = Object.keys(files).filter(n => n.startsWith('xl/worksheets/')).sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10))[0];
    if (!first) throw Error('Tệp Excel không có trang tính nào.');
    const parse = s => new DOMParser().parseFromString(s, 'application/xml');
    const shared = files['xl/sharedStrings.xml'] ? Array.from(parse(files['xl/sharedStrings.xml']).getElementsByTagName('si')).map(si => Array.from(si.getElementsByTagName('t')).filter(t => t.parentNode.nodeName !== 'rPh').map(t => t.textContent).join('')) : [];
    return Array.from(parse(files[first]).getElementsByTagName('row')).slice(0, 1001).map(row => {
      const cells = [];
      for (const c of Array.from(row.getElementsByTagName('c'))) {
        const ref = (c.getAttribute('r') || '').match(/^[A-Z]+/); let x = cells.length;
        if (ref) { x = 0; for (const ch of ref[0]) x = x * 26 + ch.charCodeAt(0) - 64; x--; }
        if (x > 30) continue;
        const type = c.getAttribute('t'), val = c.getElementsByTagName('v')[0];
        const text = type === 's' ? shared[Number(val && val.textContent)] || '' : type === 'inlineStr' ? Array.from(c.getElementsByTagName('t')).map(t => t.textContent).join('') : val ? val.textContent : '';
        while (cells.length < x) cells.push('');
        cells[x] = text;
      }
      return cells.map(s => String(s).normalize('NFC').trim());
    });
  }
  return { build, read };
})();
