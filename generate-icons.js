const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const SIZES = [16, 48, 128];
const OUT_DIR = path.join(__dirname, 'icons');

function buildSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - size * 0.04;
  const ringWidth = Math.max(1, size * 0.07);
  const fontSize = size * 0.62;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#003399" />
  <circle cx="${cx}" cy="${cy}" r="${r - ringWidth / 2}" fill="none" stroke="#FFCC00" stroke-width="${ringWidth}" />
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, 'Helvetica Neue', sans-serif" font-weight="700"
        font-size="${fontSize}" fill="#FFFFFF">&#8364;</text>
</svg>`;
}

(async () => {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
  }

  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const size of SIZES) {
      const svg = buildSvg(size);
      const page = await browser.newPage();
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
      await page.setContent(`<!DOCTYPE html><html><head><style>
        html,body{margin:0;padding:0;background:transparent;}
      </style></head><body>${svg}</body></html>`);
      const outPath = path.join(OUT_DIR, `icon${size}.png`);
      await page.screenshot({ path: outPath, omitBackground: true });
      await page.close();
      console.log(`已生成: ${outPath}`);
    }
  } finally {
    await browser.close();
  }
})();
