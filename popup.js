const HISTORY_KEY = 'landedCostHistory';
const MAX_HISTORY = 20;
const USAGE_KEY = 'usageData';
const PRO_KEY = 'isPro';
const LICENSE_KEY_STORAGE = 'licenseKey';
const FREE_DAILY_LIMIT = 5;
const UPGRADE_URL = 'https://creem.io/test/checkout/prod_5BcHyQM5AZoMlOqSeVaR1r';
const LICENSE_WORKER_URL = 'https://creem-license-proxy.lidingyao44.workers.dev';

const COUNTRY_NAMES = {
  DE: '德国 DE',
  FR: '法国 FR',
  IT: '意大利 IT',
  ES: '西班牙 ES',
  NL: '荷兰 NL',
};

function applyI18n() {
  document.title = chrome.i18n.getMessage('appName');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = chrome.i18n.getMessage(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = chrome.i18n.getMessage(key);
  });
}

function loadHistory(callback) {
  chrome.storage.local.get([HISTORY_KEY], (data) => {
    callback(data[HISTORY_KEY] || []);
  });
}

function saveHistoryEntry(entry) {
  loadHistory((history) => {
    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
      history = history.slice(0, MAX_HISTORY);
    }
    chrome.storage.local.set({ [HISTORY_KEY]: history }, () => {
      renderHistory(history);
    });
  });
}

function formatTime(isoString) {
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderHistory(history) {
  const listEl = document.getElementById('historyList');
  listEl.innerHTML = '';

  if (!history || history.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'historyEmpty';
    empty.textContent = chrome.i18n.getMessage('historyEmpty');
    listEl.appendChild(empty);
    return;
  }

  history.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'historyItem';

    const time = document.createElement('span');
    time.className = 'historyTime';
    time.textContent = formatTime(entry.timestamp);

    const main = document.createElement('span');
    main.className = 'historyMain';
    const countryLabel = COUNTRY_NAMES[entry.countryCode] || entry.countryCode;
    main.textContent = chrome.i18n.getMessage('historyItemFormat', [
      countryLabel,
      String(entry.declaredValue),
      entry.total.toFixed(2),
    ]);

    item.appendChild(time);
    item.appendChild(main);
    listEl.appendChild(item);
  });
}

function getTodayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadUsageAndPro(callback) {
  chrome.storage.local.get([USAGE_KEY, PRO_KEY], (data) => {
    const today = getTodayString();
    let usage = data[USAGE_KEY];
    if (!usage || usage.date !== today) {
      usage = { date: today, count: 0 };
      chrome.storage.local.set({ [USAGE_KEY]: usage });
    }
    callback(usage, !!data[PRO_KEY]);
  });
}

function updateUsageDisplay(usage, isPro) {
  const el = document.getElementById('usageStatus');
  if (isPro) {
    el.textContent = chrome.i18n.getMessage('proStatusText');
    el.classList.add('pro');
  } else {
    el.classList.remove('pro');
    const remaining = Math.max(0, FREE_DAILY_LIMIT - usage.count);
    el.textContent = chrome.i18n.getMessage('remainingUsageText', [String(remaining), String(FREE_DAILY_LIMIT)]);
  }
}

document.getElementById('upgradeBtn').addEventListener('click', function () {
  chrome.tabs.create({ url: UPGRADE_URL });
});

document.getElementById('licenseToggle').addEventListener('click', function () {
  const body = document.getElementById('licenseBody');
  body.style.display = body.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('activateBtn').addEventListener('click', function () {
  const input = document.getElementById('licenseKeyInput');
  const messageEl = document.getElementById('licenseMessage');
  const btn = document.getElementById('activateBtn');
  const licenseKey = input.value.trim();

  if (!licenseKey) {
    messageEl.className = 'error';
    messageEl.textContent = chrome.i18n.getMessage('errorEmptyLicenseKey');
    messageEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = chrome.i18n.getMessage('activateButtonLoading');
  messageEl.style.display = 'none';

  fetch(LICENSE_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.valid) {
        chrome.storage.local.set({ [PRO_KEY]: true, [LICENSE_KEY_STORAGE]: licenseKey }, () => {
          messageEl.className = 'success';
          messageEl.textContent = chrome.i18n.getMessage('licenseActivateSuccess');
          messageEl.style.display = 'block';
          document.getElementById('upgradePrompt').style.display = 'none';
          loadUsageAndPro(updateUsageDisplay);
        });
      } else {
        messageEl.className = 'error';
        messageEl.textContent = chrome.i18n.getMessage('licenseActivateError');
        messageEl.style.display = 'block';
      }
    })
    .catch(() => {
      messageEl.className = 'error';
      messageEl.textContent = chrome.i18n.getMessage('licenseActivateError');
      messageEl.style.display = 'block';
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = chrome.i18n.getMessage('activateButton');
    });
});

document.getElementById('calcBtn').addEventListener('click', function () {
  const declaredValueInput = document.getElementById('declaredValue');
  const categoryCountInput = document.getElementById('categoryCount');
  const countryCode = document.getElementById('countryCode').value;

  const declaredValue = parseFloat(declaredValueInput.value);
  const categoryCount = parseInt(categoryCountInput.value, 10) || 1;

  const errorEl = document.getElementById('error');
  const resultEl = document.getElementById('result');

  if (!declaredValue || declaredValue <= 0) {
    errorEl.textContent = chrome.i18n.getMessage('errorInvalidValue');
    errorEl.style.display = 'block';
    resultEl.style.display = 'none';
    return;
  }

  errorEl.style.display = 'none';

  const upgradePromptEl = document.getElementById('upgradePrompt');

  loadUsageAndPro((usage, isPro) => {
    if (!isPro && usage.count >= FREE_DAILY_LIMIT) {
      resultEl.style.display = 'none';
      upgradePromptEl.style.display = 'block';
      return;
    }
    upgradePromptEl.style.display = 'none';

    const result = calculateLandedCost({ declaredValue, categoryCount, countryCode });

    document.getElementById('rDuty').textContent = '€' + result.duty.toFixed(2);
    document.getElementById('rVat').textContent = '€' + result.vat.toFixed(2);
    document.getElementById('rTotal').textContent = '€' + result.totalLandedCost.toFixed(2);
    document.getElementById('rPct').textContent = (result.additionalCostPercentage * 100).toFixed(0) + '%';

    resultEl.style.display = 'block';

    saveHistoryEntry({
      declaredValue,
      categoryCount,
      countryCode,
      duty: result.duty,
      vat: result.vat,
      total: result.totalLandedCost,
      pct: result.additionalCostPercentage,
      timestamp: new Date().toISOString(),
    });

    if (!isPro) {
      const newUsage = { date: usage.date, count: usage.count + 1 };
      chrome.storage.local.set({ [USAGE_KEY]: newUsage }, () => {
        updateUsageDisplay(newUsage, isPro);
      });
    }
  });
});

document.getElementById('historyToggle').addEventListener('click', function () {
  const body = document.getElementById('historyBody');
  const icon = document.getElementById('historyToggleIcon');
  const expanded = body.style.display === 'block';
  body.style.display = expanded ? 'none' : 'block';
  icon.textContent = expanded ? '▸' : '▾';
});

document.getElementById('clearHistoryBtn').addEventListener('click', function () {
  if (confirm(chrome.i18n.getMessage('confirmClearHistory'))) {
    chrome.storage.local.set({ [HISTORY_KEY]: [] }, () => {
      renderHistory([]);
    });
  }
});

applyI18n();
loadHistory(renderHistory);
loadUsageAndPro(updateUsageDisplay);
