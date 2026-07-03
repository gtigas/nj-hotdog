import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1000 });
const fail = (msg) => { console.error('FAIL:', msg); process.exitCode = 1; };

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

// 1. Table renders 80 tiles
const tileCount = await page.$$eval('button', (btns) => btns.filter(b => b.className.includes('tile')).length);
console.log('tiles:', tileCount);
if (tileCount !== 80) fail(`expected 80 tiles, got ${tileCount}`);

// 2. Click the Rutt's Hutt tile -> modal opens
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes("Rutt's Hutt"));
  btn.click();
});
await new Promise(r => setTimeout(r, 400));
const modalText = await page.evaluate(() => document.body.innerText);
if (!/1928/.test(modalText)) fail('modal missing year 1928');
if (!/Clifton/i.test(modalText)) fail('modal missing enrichment town Clifton');
if (!/Relish/i.test(modalText)) fail('modal missing decoded topping Relish');
console.log('modal open: year/town/toppings present');
await page.screenshot({ path: '/tmp/e2e_modal.png' });

// 3. Rate it 8
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '8');
  btns[btns.length - 1].click();
});
await new Promise(r => setTimeout(r, 300));
const stored = await page.evaluate(() => localStorage.getItem('njhdi:v1'));
console.log('localStorage:', stored);
if (!stored || !JSON.parse(stored).ratings?.r1c01?.rating) fail('rating not in localStorage');

// 4. Type notes, wait for debounce save
await page.evaluate(() => {
  const ta = document.querySelector('textarea');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(ta, 'Crispy ripper, great relish.');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
});
await new Promise(r => setTimeout(r, 900));
const notes = await page.evaluate(() => JSON.parse(localStorage.getItem('njhdi:v1')).ratings.r1c01.notes);
console.log('notes saved:', JSON.stringify(notes));
if (!notes.includes('Crispy')) fail('notes not persisted');

// 5. Share modal opens and renders preview
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /share/i.test(b.textContent) && b.closest('[class*=modal],[class*=Modal],[role=dialog]'));
  (btn || [...document.querySelectorAll('button')].find(b => /share/i.test(b.textContent))).click();
});
await new Promise(r => setTimeout(r, 1200));
const previewOk = await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find(i => i.src.startsWith('data:image/png'));
  return img ? img.src.length : 0;
});
console.log('share preview data-url bytes:', previewOk);
if (previewOk < 50000) fail('share preview missing or tiny');
await page.screenshot({ path: '/tmp/e2e_share.png' });

// 6. Reload -> persistence + badge on tile
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
const bodyText = await page.evaluate(() => document.body.innerText);
if (!/rated 1|You've rated 1/i.test(bodyText)) console.log('note: header stats text:', bodyText.split('\n').slice(0, 4).join(' | '));
const badge = await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes("Rutt's Hutt"));
  return btn.textContent;
});
console.log('tile text after reload:', JSON.stringify(badge));
if (!badge.includes('8')) fail('rating badge not visible on tile after reload');
await page.screenshot({ path: '/tmp/e2e_reload.png' });

await browser.close();
console.log(process.exitCode ? 'E2E: FAILURES' : 'E2E: ALL PASS');
