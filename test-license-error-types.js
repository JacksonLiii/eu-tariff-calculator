// Exercises the real popup.js activation handler against the Worker's
// { valid, errorType } response contract, with fetch mocked so it doesn't
// depend on reaching the live Cloudflare Worker.
// errorType: "network" (Worker couldn't reach Creem / got a bad response),
//            "invalid" (key is genuinely wrong or already used), or null (success).
const puppeteer = require('puppeteer');

const SCENARIOS = [
  {
    name: 'fetch throws (offline / DNS failure)',
    mock: { kind: 'reject' },
    expectClass: 'error',
    expectKey: 'licenseActivateNetworkError',
  },
  {
    name: 'errorType=network (Worker up, Creem unreachable/bad response)',
    mock: { kind: 'resolve', body: { valid: false, errorType: 'network' } },
    expectClass: 'error',
    expectKey: 'licenseActivateNetworkError',
  },
  {
    name: 'errorType=invalid (key wrong or already used)',
    mock: { kind: 'resolve', body: { valid: false, errorType: 'invalid' } },
    expectClass: 'error',
    expectKey: 'licenseActivateError',
  },
  {
    name: 'valid=true, errorType=null (success)',
    mock: { kind: 'resolve', body: { valid: true, errorType: null } },
    expectClass: 'success',
    expectKey: 'licenseActivateSuccess',
  },
];

async function runScenario(browser, scenario) {
  const page = await browser.newPage();

  await page.evaluateOnNewDocument((mock) => {
    window.chrome = {
      i18n: {
        // Stub returns the message key itself so the test can assert on it directly.
        getMessage: (key) => key,
      },
      storage: {
        local: {
          _data: {},
          get(keys, cb) {
            const result = {};
            keys.forEach((k) => { if (this._data[k] !== undefined) result[k] = this._data[k]; });
            cb(result);
          },
          set(obj, cb) {
            Object.assign(this._data, obj);
            if (cb) cb();
          },
        },
      },
    };

    window.fetch = (url) => {
      if (!String(url).includes('creem-license-proxy')) {
        return Promise.reject(new Error('unexpected fetch in test: ' + url));
      }
      if (mock.kind === 'reject') {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return Promise.resolve({ json: () => Promise.resolve(mock.body) });
    };
  }, scenario.mock);

  const popupPath = 'D:/desktop/我的第一个Saas软件/popup.html';
  await page.goto('file://' + popupPath, { waitUntil: 'load' });

  await page.click('#licenseToggle');
  await page.type('#licenseKeyInput', 'TEST-KEY-DOES-NOT-MATTER');
  await page.click('#activateBtn');

  await page.waitForFunction(
    () => document.getElementById('licenseMessage').style.display === 'block',
    { timeout: 5000 }
  );

  const result = await page.evaluate(() => ({
    text: document.getElementById('licenseMessage').textContent,
    className: document.getElementById('licenseMessage').className,
  }));

  await page.close();
  return result;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let allPassed = true;
  try {
    for (const scenario of SCENARIOS) {
      const result = await runScenario(browser, scenario);
      const pass = result.text === scenario.expectKey && result.className === scenario.expectClass;
      allPassed = allPassed && pass;
      console.log(
        `${pass ? 'PASS' : 'FAIL'} — ${scenario.name}\n` +
        `  expected: class=${scenario.expectClass} key=${scenario.expectKey}\n` +
        `  actual:   class=${result.className} key=${result.text}`
      );
    }
  } finally {
    await browser.close();
  }

  if (!allPassed) {
    console.error('\nSome scenarios FAILED.');
    process.exit(1);
  }
  console.log('\nAll license errorType scenarios passed.');
})();
