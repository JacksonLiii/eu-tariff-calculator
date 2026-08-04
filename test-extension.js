const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const extensionPath = __dirname;

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });

  try {
    const extPage = await browser.newPage();
    await extPage.goto('chrome://extensions/', { waitUntil: 'networkidle0' });

    await extPage.waitForSelector('pierce/extensions-item', { timeout: 15000 });
    const extensionId = await extPage.$eval('pierce/extensions-item', (el) => el.id);
    console.log('插件ID:', extensionId);
    await extPage.close();

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'load' });

    await page.type('#declaredValue', '50');
    await page.evaluate(() => { document.getElementById('categoryCount').value = '1'; });
    await page.select('#countryCode', 'DE');
    await page.click('#calcBtn');

    await page.waitForSelector('#result', { visible: true, timeout: 5000 });

    const outputPath = path.join(__dirname, 'test-result.png');
    await page.screenshot({ path: outputPath });

    const values = await page.evaluate(() => ({
      duty: document.getElementById('rDuty').textContent,
      vat: document.getElementById('rVat').textContent,
      total: document.getElementById('rTotal').textContent,
      pct: document.getElementById('rPct').textContent,
    }));

    console.log('关税 duty:', values.duty);
    console.log('VAT:', values.vat);
    console.log('落地总成本 total:', values.total);
    console.log('附加成本占比 pct:', values.pct);
    console.log('截图已保存到:', outputPath);
  } finally {
    await browser.close();
  }
})();
