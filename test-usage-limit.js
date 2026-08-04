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
    ],
  });

  try {
    const extPage = await browser.newPage();
    await extPage.goto('chrome://extensions/', { waitUntil: 'networkidle0' });
    await extPage.waitForSelector('pierce/extensions-item', { timeout: 15000 });
    const extensionId = await extPage.$eval('pierce/extensions-item', (el) => el.id);
    await extPage.close();

    const popupUrl = `chrome-extension://${extensionId}/popup.html`;

    async function calcOnce(page) {
      await page.evaluate(() => { document.getElementById('declaredValue').value = ''; });
      await page.type('#declaredValue', '50');
      await page.evaluate(() => { document.getElementById('categoryCount').value = '1'; });
      await page.select('#countryCode', 'DE');
      await page.click('#calcBtn');
      await new Promise((r) => setTimeout(r, 150));
      return page.evaluate(() => ({
        resultVisible: document.getElementById('result').style.display === 'block',
        upgradeVisible: document.getElementById('upgradePrompt').style.display === 'block',
        usageStatus: document.getElementById('usageStatus').textContent,
      }));
    }

    // Test 1: 6 consecutive clicks on a fresh (non-Pro) popup
    let page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'load' });

    console.log('=== 免费用户连续点击6次 ===');
    for (let i = 1; i <= 6; i++) {
      const state = await calcOnce(page);
      console.log(`第${i}次点击 -> 结果区显示:${state.resultVisible} | 升级提示显示:${state.upgradeVisible} | 状态栏:"${state.usageStatus}"`);
    }
    await page.close();

    // Test 2: set isPro = true directly in storage, then verify unlimited
    page = await browser.newPage();
    await page.goto(popupUrl, { waitUntil: 'load' });
    await page.evaluate(() => new Promise((resolve) => chrome.storage.local.set({ isPro: true }, resolve)));
    await page.reload({ waitUntil: 'load' });

    console.log('\n=== 手动设置 isPro=true 后，再连续点击3次 ===');
    for (let i = 1; i <= 3; i++) {
      const state = await calcOnce(page);
      console.log(`第${i}次点击 -> 结果区显示:${state.resultVisible} | 升级提示显示:${state.upgradeVisible} | 状态栏:"${state.usageStatus}"`);
    }

    const finalStorage = await page.evaluate(
      () => new Promise((resolve) => chrome.storage.local.get(['usageData', 'isPro'], resolve))
    );
    console.log('\n最终 storage 状态:', finalStorage);
    await page.close();
  } finally {
    await browser.close();
  }
})();
