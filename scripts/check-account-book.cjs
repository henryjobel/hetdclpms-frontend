const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require('playwright');

(async () => {
  const output = path.join(require('node:os').tmpdir(), 'het-account-book-preview');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1263, height: 893 }, deviceScaleFactor: 1 });
  await page.setContent('<body style="margin:0"></body>');
  const source = ts.transpileModule(fs.readFileSync('src/lib/account-book-pdf.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  await page.addScriptTag({ content: 'window.exports = {}; window.require = () => ({showToast(){}});\n' + source });
  const count = await page.evaluate(() => {
    const particulars = ['Client booking advance received for foundation work', 'Cement and sand purchase for foundation', 'Rebar purchase for column and slab work', 'Cash deposited to project bank account'];
    const rows = Array.from({ length: 38 }, (_, i) => ({ date: '01 Sept 2026', voucherNo: 'DEMO-CONSTRUCTION-' + String(i + 1).padStart(3, '0'), particulars: particulars[i % 4], party: '1001 - Cash in Hand / Project construction account', cashIn: i % 2 ? 0 : 120000, bankOut: i % 2 ? 18000 : 0, totalIn: i % 2 ? 0 : 120000, totalOut: i % 2 ? 18000 : 0 }));
    rows[0].particulars += ' — নির্মাণ সামগ্রী ক্রয়';
    window.options = { filename: 'account-book-preview', organization: 'Construction Project — Design verification', month: '01 Sep 2026 - 05 Oct 2026', summary: { opening: 0, received: 2280000, payment: 342000, closing: 1938000, cashClosing: 2280000, bankClosing: -342000 }, rows };
    const stress = window.exports.renderAccountBookPages({ ...window.options, rows: [{ ...rows[0], particulars: 'Full description must remain readable. '.repeat(100) }] });
    if (stress.length < 2) throw new Error('Long description pagination failed');
    const pages = window.exports.renderAccountBookPages(window.options);
    window.previews = pages;
    pages.forEach((canvas, i) => { canvas.id = 'page-' + i; canvas.style.width = '1263px'; canvas.style.height = '892.5px'; document.body.append(canvas); });
    return pages.length;
  });
  for (const i of [0, count - 1]) await page.locator('#page-' + i).screenshot({ path: path.join(output, `page-${i + 1}.png`) });
  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(() => window.exports.exportAccountBookToPdf(window.options));
  const download = await downloadPromise;
  await download.saveAs(path.join(output, 'account-book-preview.pdf'));
  const pdf = fs.readFileSync(path.join(output, 'account-book-preview.pdf'));
  if (!pdf.subarray(0, 8).toString().startsWith('%PDF-1.4')) throw new Error('Invalid PDF');
  console.log(JSON.stringify({ output, pages: count, bytes: pdf.length }));
  await browser.close();
})();
