const puppeteer = require('puppeteer');

const extensionPath = __dirname;
const VALID_LICENSE_KEY = process.env.TEST_LICENSE_KEY || 'REPLACE_WITH_A_VALID_TEST_LICENSE_KEY';

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
    await extPage.close();
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(popupUrl, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 300));

    const uiLanguage = await page.evaluate(() => chrome.i18n.getUILanguage());
    console.log('chrome.i18n.getUILanguage():', uiLanguage);

    const texts = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector('h1').textContent,
      declaredValueLabel: document.querySelector('label[for="declaredValue"]').textContent,
      categoryCountHint: document.querySelector('.hint').textContent,
      countryCodeLabel: document.querySelector('label[for="countryCode"]').textContent,
      calcButton: document.getElementById('calcBtn').textContent,
      dutyLabel: document.querySelector('#result div:nth-child(1) span:first-child').textContent,
      totalLabel: document.querySelector('#result div:nth-child(4) span:first-child').textContent,
      footerNote: document.querySelector('.footer-note').textContent,
      disclaimer: document.querySelector('.disclaimer').textContent,
      licenseToggleText: document.getElementById('licenseToggle').textContent,
      historyToggleText: document.querySelector('#historyToggle span').textContent,
      clearHistoryButton: document.getElementById('clearHistoryBtn').textContent,
    }));
    console.log('\n=== 页面文案（应为英文） ===');
    console.log(JSON.stringify(texts, null, 2));

    // manifest name/description via chrome.runtime
    const manifestInfo = await page.evaluate(() => {
      const m = chrome.runtime.getManifest();
      return { name: m.name, description: m.description, default_locale: m.default_locale };
    });
    console.log('\n=== manifest 解析结果 ===');
    console.log(JSON.stringify(manifestInfo, null, 2));

    // functional test: calculation
    console.log('\n=== 功能测试: 计算 ===');
    await page.type('#declaredValue', '50');
    await page.select('#countryCode', 'DE');
    await page.click('#calcBtn');
    await new Promise((r) => setTimeout(r, 200));
    const calcResult = await page.evaluate(() => ({
      duty: document.getElementById('rDuty').textContent,
      vat: document.getElementById('rVat').textContent,
      total: document.getElementById('rTotal').textContent,
      pct: document.getElementById('rPct').textContent,
    }));
    console.log('计算结果:', calcResult);

    // history
    console.log('\n=== 功能测试: 历史记录 ===');
    await page.click('#historyToggle');
    await new Promise((r) => setTimeout(r, 200));
    const historyText = await page.evaluate(() =>
      document.querySelector('.historyItem .historyMain').textContent
    );
    console.log('历史记录条目文案:', historyText);

    // usage limit: click 5 more times (total 6) to trigger block
    console.log('\n=== 功能测试: 次数限制 (再点5次，累计6次) ===');
    for (let i = 2; i <= 6; i++) {
      await page.evaluate(() => { document.getElementById('declaredValue').value = ''; });
      await page.type('#declaredValue', '50');
      await page.click('#calcBtn');
      await new Promise((r) => setTimeout(r, 150));
    }
    const limitState = await page.evaluate(() => ({
      resultVisible: document.getElementById('result').style.display === 'block',
      upgradePromptVisible: document.getElementById('upgradePrompt').style.display === 'block',
      upgradePromptText: document.querySelector('#upgradePrompt p').textContent,
      upgradeButtonText: document.getElementById('upgradeBtn').textContent,
      usageStatus: document.getElementById('usageStatus').textContent,
    }));
    console.log('第6次点击后状态:', limitState);

    // license activation
    console.log('\n=== 功能测试: License Key 激活 ===');
    await page.click('#licenseToggle');
    await page.type('#licenseKeyInput', VALID_LICENSE_KEY);
    await page.click('#activateBtn');
    await page.waitForFunction(
      () => document.getElementById('activateBtn').textContent.trim() === 'Activate',
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 200));
    const licenseResult = await page.evaluate(() => ({
      messageText: document.getElementById('licenseMessage').textContent,
      usageStatus: document.getElementById('usageStatus').textContent,
    }));
    console.log('激活结果:', licenseResult);

    // confirm dialog text for clear history
    console.log('\n=== 功能测试: 清空历史确认框文案 ===');
    let dialogMessage = null;
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    const historyBodyVisible = await page.evaluate(
      () => document.getElementById('historyBody').style.display === 'block'
    );
    if (!historyBodyVisible) {
      await page.click('#historyToggle');
      await new Promise((r) => setTimeout(r, 200));
    }
    await page.click('#clearHistoryBtn');
    await new Promise((r) => setTimeout(r, 300));
    console.log('确认框文案:', dialogMessage);

    await page.screenshot({ path: 'popup-english-default.png' });
    console.log('\n截图已保存: popup-english-default.png');
  } finally {
    await browser.close();
  }
})();
