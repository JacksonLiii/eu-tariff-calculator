/**
 * Generates the Chrome Web Store screenshots: 5 images, exactly 1280x800 PNG.
 *
 * Output: screenshots/store-1..5-*.png  (screenshots/ is gitignored)
 *
 * The popup is only 300px wide, so a raw capture pasted on a 1280x800 canvas
 * reads as a thin strip. Instead each shot is composed: the popup is captured
 * on its own at 2x device scale, then placed on a 1280x800 canvas next to a
 * caption. Capturing at 2x and displaying at ~1.2x keeps the text sharp.
 *
 * Never types a real License Key — shot 5 uses placeholder text on purpose.
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const extensionPath = __dirname;
const OUT_DIR = path.join(__dirname, 'screenshots');
const W = 1280;
const H = 800;

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const shots = [
  {
    file: 'store-1-default.png',
    headline: 'Know the real landed cost\nbefore you quote.',
    sub: 'Duty, VAT and total landed cost for any EU destination — estimated in seconds, without leaving your browser.',
    setup: async () => {},
  },
  {
    file: 'store-2-result.png',
    headline: 'Every number, broken down.',
    sub: 'A €50 parcel to Germany with one HS6 category: €3 duty, €10.07 VAT, €63.07 landed — 26% on top of declared value.',
    setup: async (page) => {
      await page.type('#declaredValue', '50');
      await page.select('#countryCode', 'DE');
      await page.click('#calcBtn');
      await page.waitForFunction(
        () => document.getElementById('result').style.display === 'block',
        { timeout: 5000 }
      );
    },
  },
  {
    file: 'store-3-history.png',
    headline: 'Your last 20 calculations,\nkept on your device.',
    sub: 'History never leaves your browser. No account, no sync, no tracking — clear it any time.',
    setup: async (page) => {
      // Local time, no 'Z' — the popup formats with getHours()/getDate(), so a UTC
      // stamp would shift and could render a date later than "today".
      const stamp = (h, m) => `${today()}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      const history = [
        { declaredValue: 129, categoryCount: 3, countryCode: 'NL', duty: 9, vat: 28.98, total: 166.98, pct: 0.29, timestamp: stamp(16, 42) },
        { declaredValue: 45, categoryCount: 1, countryCode: 'IT', duty: 3, vat: 10.56, total: 58.56, pct: 0.3, timestamp: stamp(15, 18) },
        { declaredValue: 88, categoryCount: 2, countryCode: 'FR', duty: 6, vat: 18.8, total: 112.8, pct: 0.28, timestamp: stamp(14, 5) },
        { declaredValue: 25, categoryCount: 1, countryCode: 'ES', duty: 3, vat: 5.88, total: 33.88, pct: 0.36, timestamp: stamp(11, 51) },
        { declaredValue: 60, categoryCount: 1, countryCode: 'DE', duty: 3, vat: 11.97, total: 74.97, pct: 0.25, timestamp: stamp(9, 30) },
      ];
      await page.evaluate(
        (h) => new Promise((r) => chrome.storage.local.set({ landedCostHistory: h }, r)),
        history
      );
      await page.reload({ waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 300));
      await page.click('#historyToggle');
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    file: 'store-4-limit.png',
    headline: 'Five free calculations a day.\nUnlimited for $14.99.',
    sub: 'One-time payment, not a subscription. No recurring charge, nothing to cancel.',
    setup: async (page) => {
      await page.evaluate(
        (date) => new Promise((r) => chrome.storage.local.set({ usageData: { date, count: 5 } }, r)),
        today()
      );
      await page.reload({ waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 300));
      await page.type('#declaredValue', '50');
      await page.click('#calcBtn');
      await page.waitForFunction(
        () => document.getElementById('upgradePrompt').style.display === 'block',
        { timeout: 5000 }
      );
    },
  },
  {
    file: 'store-5-license.png',
    headline: 'Already bought Pro?\nPaste your key.',
    sub: 'Activation is a single field. Your key is checked over HTTPS and stored only on your own device.',
    setup: async (page) => {
      await page.click('#licenseToggle');
      await new Promise((r) => setTimeout(r, 200));
      // Placeholder only. A real key must never appear in a published screenshot.
      await page.type('#licenseKeyInput', 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
      await new Promise((r) => setTimeout(r, 150));
    },
  },
];

function compositionHtml({ headline, sub, imgB64, imgW, imgH }) {
  // Scale the popup to fill the vertical space without exceeding it.
  const maxH = 700;
  const displayH = Math.min(maxH, imgH);
  const displayW = Math.round((imgW / imgH) * displayH);

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    display: flex; align-items: center; gap: 56px;
    padding: 0 72px;
    background: linear-gradient(135deg, #eef2f7 0%, #e3e9f2 100%);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    color: #1f2328;
  }
  .copy { flex: 1 1 auto; max-width: 560px; }
  h1 {
    font-size: 44px; line-height: 1.15; font-weight: 700;
    letter-spacing: -0.5px; white-space: pre-line; margin-bottom: 22px;
  }
  p { font-size: 20px; line-height: 1.5; color: #4a5560; }
  .shot { flex: 0 0 auto; }
  .shot img {
    width: ${displayW}px; height: ${displayH}px; display: block;
    border-radius: 12px;
    box-shadow: 0 18px 48px rgba(20, 30, 50, .22), 0 2px 6px rgba(20, 30, 50, .10);
  }
</style></head>
<body>
  <div class="copy">
    <h1>${headline}</h1>
    <p>${sub}</p>
  </div>
  <div class="shot"><img src="data:image/png;base64,${imgB64}"></div>
</body></html>`;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Chrome 151 ignores --load-extension; browser.installExtension() (CDP
  // Extensions.loadUnpacked) is the supported replacement. --no-sandbox is
  // required here because Chrome's own sandbox cannot initialise in this
  // environment — without it the process exits with code 3 before starting.
  const browser = await puppeteer.launch({
    headless: true,
    enableExtensions: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--no-first-run',
      '--no-default-browser-check',
      '--lang=en-US',
    ],
  });

  try {
    const extensionId = await browser.installExtension(extensionPath);
    console.log('extension id:', extensionId);

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;

    // Sanity check the locale actually resolved to English before shooting.
    const probe = await browser.newPage();
    await probe.goto(popupUrl, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 400));
    const dropdown = await probe.evaluate(() =>
      Array.from(document.querySelectorAll('#countryCode option')).map((o) => o.textContent)
    );
    console.log('uiLanguage:', await probe.evaluate(() => chrome.i18n.getUILanguage()));
    console.log('dropdown :', dropdown);
    await probe.close();

    for (const shot of shots) {
      const page = await browser.newPage();
      await page.setViewport({ width: 420, height: 900, deviceScaleFactor: 2 });

      // Start each shot from clean storage so states don't bleed into each other.
      await page.goto(popupUrl, { waitUntil: 'load' });
      await page.evaluate(() => new Promise((r) => chrome.storage.local.clear(r)));
      await page.reload({ waitUntil: 'load' });
      await new Promise((r) => setTimeout(r, 350));

      await shot.setup(page);
      await new Promise((r) => setTimeout(r, 250));

      const box = await page.evaluate(() => ({
        w: document.body.scrollWidth,
        h: document.body.scrollHeight,
      }));
      const popupB64 = await page.screenshot({
        encoding: 'base64',
        clip: { x: 0, y: 0, width: box.w, height: box.h },
      });
      await page.close();

      const comp = await browser.newPage();
      await comp.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
      await comp.setContent(
        compositionHtml({
          headline: shot.headline,
          sub: shot.sub,
          imgB64: popupB64,
          imgW: box.w,
          imgH: box.h,
        }),
        { waitUntil: 'load' }
      );
      await new Promise((r) => setTimeout(r, 250));

      const outPath = path.join(OUT_DIR, shot.file);
      await comp.screenshot({ path: outPath });
      await comp.close();

      console.log(`  wrote ${shot.file}  (popup was ${box.w}x${box.h})`);
    }
  } finally {
    await browser.close();
  }

  console.log('\nDone. Verifying dimensions...');
  for (const shot of shots) {
    const buf = fs.readFileSync(path.join(OUT_DIR, shot.file));
    // PNG IHDR: width at byte 16..19, height at 20..23 (big-endian)
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const ok = w === W && h === H ? 'OK ' : 'BAD';
    console.log(`  ${ok} ${shot.file}  ${w}x${h}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
})().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
