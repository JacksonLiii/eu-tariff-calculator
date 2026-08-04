const puppeteer = require('puppeteer');

const extensionPath = __dirname;

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--lang=en-US',
    ],
  });

  try {
    const extPage = await browser.newPage();
    await extPage.goto('chrome://extensions/', { waitUntil: 'networkidle0' });
    await extPage.waitForSelector('pierce/extensions-item', { timeout: 15000 });

    const extensionId = await extPage.$eval('pierce/extensions-item', (el) => el.id);
    console.log('插件ID:', extensionId);

    await extPage.screenshot({ path: 'extensions-page-with-icon.png' });

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    const page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'load' });
    const manifest = await page.evaluate(() => chrome.runtime.getManifest());
    console.log('manifest.name:', manifest.name);
    console.log('manifest.description:', manifest.description);
    console.log('manifest.icons:', manifest.icons);
    console.log('manifest.action.default_icon:', manifest.action.default_icon);

    const h1Text = await page.evaluate(() => document.querySelector('h1').textContent);
    console.log('popup h1:', h1Text);
  } finally {
    await browser.close();
  }
})();
