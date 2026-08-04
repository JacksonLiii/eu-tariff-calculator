const puppeteer = require('puppeteer');

const CHECKOUT_URL = process.argv[2];

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  try {
    const page = await browser.newPage();
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
      console.log('已点击 Germany 选项');
    } else {
      console.log('未找到 Germany 选项元素');
    }
    await new Promise((r) => setTimeout(r, 800));

    // click continue to payment
    const buttons2 = await page.$$('button[type="submit"]');
    console.log('submit按钮数量:', buttons2.length);
    if (buttons2.length > 0) {
      await buttons2[0].click();
      console.log('已点击继续付款');
    }
    await new Promise((r) => setTimeout(r, 3000));

    await page.screenshot({ path: 'checkout-after-continue.png', fullPage: true });

    const frames = page.frames();
    console.log('点击后 frame 数量:', frames.length);
    frames.forEach((f, i) => console.log(`  frame[${i}] name=${f.name()} url:`, f.url().slice(0, 120)));

    console.log('当前URL:', page.url());
  } finally {
    await browser.close();
  }
})();
