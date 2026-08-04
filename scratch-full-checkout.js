const puppeteer = require('puppeteer');

const CHECKOUT_URL = process.argv[2];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  try {
    const page = await browser.newPage();
    page.on('console', (msg) => console.log('[页面console]', msg.text()));
    page.on('pageerror', (err) => console.log('[页面错误]', err.message));

    await page.goto(CHECKOUT_URL, { waitUntil: 'load', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));

    await page.type('#email', 'test-buyer@example.com');
    await page.type('#name', 'Test Buyer');

    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.textContent.trim(), b);
      if (text.includes('选择账单国家')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 800));

    const germanyHandle = await page.evaluateHandle(() => {
      const els = Array.from(document.querySelectorAll('div'));
      return els.find((el) => el.className.includes('cursor-pointer') && el.textContent.trim() === 'Germany');
    });
    if (germanyHandle && germanyHandle.asElement()) {
      await germanyHandle.asElement().click();
      console.log('已选择账单国家: Germany');
    }
    // wait for the "更新中..." (recalculating tax/price) state to clear
    let submitInfo = null;
    for (let i = 0; i < 20; i++) {
      submitInfo = await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (!btn) return null;
        return { text: btn.textContent.trim(), disabled: btn.disabled };
      });
      if (submitInfo && !submitInfo.disabled && submitInfo.text.includes('继续付款')) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    console.log('submit按钮最终状态:', JSON.stringify(submitInfo, null, 2));

    await page.click('button[type="submit"]');
    console.log('已点击继续付款(via page.click)');

    await new Promise((r) => setTimeout(r, 5000));
    await page.screenshot({ path: 'checkout-payment-step3.png', fullPage: true });

    const urlNow = page.url();
    console.log('点击后 URL:', urlNow);

    const allFrames = page.frames();
    console.log('总frame数:', allFrames.length);
    allFrames.forEach((f, i) => console.log(`  [${i}] name="${f.name()}" url=${f.url().slice(0, 100)}`));
  } finally {
    await browser.close();
  }
})();
