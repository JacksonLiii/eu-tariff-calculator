const puppeteer = require('puppeteer');

const extensionPath = __dirname;
const VALID_LICENSE_KEY = process.env.TEST_LICENSE_KEY || 'REPLACE_WITH_A_VALID_TEST_LICENSE_KEY';
const INVALID_LICENSE_KEY = 'FAKE1-FAKE2-FAKE3-FAKE4-FAKE5';

(async () => {
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
    await extPage.close();
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;

    async function activate(page, licenseKey) {
      await page.click('#licenseToggle');
      await page.evaluate(() => { document.getElementById('licenseKeyInput').value = ''; });
      await page.type('#licenseKeyInput', licenseKey);
      await page.click('#activateBtn');
      await page.waitForFunction(
        () => document.getElementById('activateBtn').textContent.trim() === '激活',
        { timeout: 10000 }
      );
      await new Promise((r) => setTimeout(r, 200));
      return page.evaluate(() => ({
        messageText: document.getElementById('licenseMessage').textContent,
        messageClass: document.getElementById('licenseMessage').className,
      }));
    }

    async function readStorage(page) {
      return page.evaluate(
        () => new Promise((resolve) => chrome.storage.local.get(['isPro', 'licenseKey'], resolve))
      );
    }

    // Test A: invalid license key
    console.log('=== 测试A: 无效 License Key ===');
    let page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'load' });
    const resultA = await activate(page, INVALID_LICENSE_KEY);
    console.log('提示信息:', resultA.messageText, '| class:', resultA.messageClass);
    const storageA = await readStorage(page);
    console.log('storage 状态:', storageA);
    const usageStatusA = await page.evaluate(() => document.getElementById('usageStatus').textContent);
    console.log('状态栏文案:', usageStatusA);
    await page.close();

    // Test B: valid license key
    console.log('\n=== 测试B: 有效 License Key ===');
    page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'load' });
    const resultB = await activate(page, VALID_LICENSE_KEY);
    console.log('提示信息:', resultB.messageText, '| class:', resultB.messageClass);
    const storageB = await readStorage(page);
    console.log('storage 状态:', storageB);
    const usageStatusB = await page.evaluate(() => document.getElementById('usageStatus').textContent);
    console.log('状态栏文案:', usageStatusB);

    // verify no longer limited: calc 6 times, all should succeed
    console.log('\n--- 激活后连续计算6次，验证不受5次限制 ---');
    for (let i = 1; i <= 6; i++) {
      await page.evaluate(() => { document.getElementById('declaredValue').value = ''; });
      await page.type('#declaredValue', '50');
      await page.select('#countryCode', 'DE');
      await page.click('#calcBtn');
      await new Promise((r) => setTimeout(r, 150));
      const resultVisible = await page.evaluate(() => document.getElementById('result').style.display === 'block');
      console.log(`第${i}次计算 -> 结果显示:${resultVisible}`);
    }
    await page.close();
  } finally {
    await browser.close();
  }
})();
